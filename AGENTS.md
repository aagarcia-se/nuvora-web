# AGENTS.md — Nuvora Web

## Continuidad vigente — menú responsive, 2026-11-12

Menú autorizado e implementado sobre las rutas existentes: lateral desde 1024 px, panel modal nativo en móvil/PWA. Fuente de verdad del contexto: query del detalle del workspace confirmada por API, compartida con su boundary. Solo Espacios y Clientes cuando corresponda; sin secciones futuras. Perfil/apariencia/logout continúan en avatar; no duplicarlos en el menú lateral. Preservar cierre/foco/Escape/cambio de ancho, safe areas, tokens y restricción de Playwright. Ver `codex.md`, `docs/NAVIGATION.md` y `docs/ROUTING.md` para resultados reales. Los bloques históricos siguientes describen fases anteriores; no restaurar perfil/cartera incrustados en inicio.

## Contexto operativo vigente — fase codex.md, 2026-11-12

La fase actual es clientes/entidades de [codex.md](codex.md), exclusivamente en `nuvora-web`. Perfil/workspaces ya están implementados y no deben repetirse. Leer [docs/ENTITIES.md](docs/ENTITIES.md), [docs/WORKSPACES.md](docs/WORKSPACES.md) y las fases 17/18 de [docs/PLAN.md](docs/PLAN.md). No modificar `nuvora-api`, SQL, entornos, secretos o Git.

- **Alcance implementado:** perfil/workspaces conservados; cartera de clientes solo tras workspace confirmado, alta, detalle y edición con contratos existentes. Crear según rol owner/admin del workspace; editar según canManage de la entity. No construir grants, invitaciones, entity_memberships, portal, FEL, libros, módulos financieros ni edición de perfil.
- **UI/UX vigente:** acceso público minimalista existente. Después de login, vista propia de ancho completo con lista principal y perfil lateral, una columna en móvil, creación en diálogo nativo y contexto seleccionado visible. Cierre de sesión y apariencia dentro del menú de cuenta. No colocar la aplicación dentro del formulario de login de 416px.
- **Identidad preservada:** índigo/lavanda y superficies slate, monograma, temas, splash estático, PWA y controles existentes. Esta fase no cambia paleta, no incorpora gradientes ni reglas globales nuevas: estilos propios en `src/features/workspace/workspace.module.css` con tokens actuales. No restaurar lima ni el panel morado lateral.
- **Estado remoto:** transporte compartido en `shared/api/authenticatedRequest.ts`, con SDK Supabase, errores normalizados y AbortSignal; Axios relativo al API y Query por usuario/workspace/entity. Selección nunca autoriza. No enviar owner_id/userId/granted_by ni usar NIT como permiso. Cambiar workspace cancela/elimina consultas de entidades antes de cambiar selección.
- **Cancelación:** abortar lecturas/mutaciones al desmontar; Auth mantiene limpieza de caché. Las creaciones pendientes comprueban también identidad de la Query de lista antes de escribir en caché para rechazar respuestas después de un clear. No reintentar mutaciones; actualizar lista antes de repetir una creación de resultado incierto.
- **NIT:** respetar máscara del API; no reconstruir ni prefijar valores enmascarados para edición. NIT completo solo con canManage y respuesta autorizada. Mantener/cambiar/quitar explícitos; PATCH omite campos no cambiados y taxId:null elimina. Normalizar espacios/mayúsculas, sin dígito verificador ni verificación fiscal externa. No persistir NIT en URLs/storage/logs.
- **Verificación en esta fase:** el usuario invocó codex.md, que solicita lint/build; su restricción específica mantiene Playwright sin autorización expresa. No ejecutar `test:auth` ni `test:pwa` automáticamente (usan Playwright). Casos Demo preparados, no declararlos aprobados. Consultar resultados reales en docs/WORKSPACES.md. La autorización de lint/build corresponde a esta fase, no invalida restricciones futuras del usuario.
- **Límites:** sin validación visual ni integración real/RLS certificadas por el build. SQL, aislamiento real con dos usuarios y metadatos remotos deben verificarse con el backend/propietario; no ejecutar migraciones remotas.
- **Control de cambios:** no ejecutar comandos Git, commit/push ni modificar `.env`/claves. Preservar cambios del usuario y no instalar dependencias innecesarias.
- **Skill para diseño:** `.opencode/skills/ui-ux-pro-max/SKILL.md`. Las búsquedas locales orientan jerarquía, foco y estilo; no imponen landing/colores nuevos sobre los contratos y preferencias actuales.

## 1. Dirección de producto — 2026-11-10

Actúa como arquitecto frontend senior, desarrollador React/TypeScript y diseñador de producto SaaS accesible y multi-tenant. Este archivo es autónomo. Plan coordinado en `../nuvora-api/docs/PLAN.md`; integración en `../nuvora-api/docs/frontend-handoff.md`.

**Nuvora Contadores es el producto inicial:** contadores independientes y despachos gestionan múltiples clientes/NIT para preparar libros de compras/ventas y cierres mensuales. Web responsive e instalable como PWA primero; aplicación móvil después. Empresas B2B y Personal B2C reutilizarán el núcleo y contratos.

El plan anterior de empresas primero queda reemplazado. Mantener la base actual de la web y la autenticación/seguridad ya construidas en el API. No restaurar automáticamente el frontend anterior, su diseño, Tailwind v4 ni sus resultados de pruebas.

Marca configurable con `VITE_APP_NAME`; español, GTQ y `America/Guatemala`. Nuvora — Tus finanzas, bajo control. Priorizar tiempo de cierre, trazabilidad y revisión humana; no prometer cumplimiento fiscal automático.

## 2. Alcance

### MVP Contadores

- Login, registro, recuperación, Google, sesión y cierre de sesión con Supabase.
- Despacho/equipo, cartera de clientes y selección explícita de entidad fiscal.
- Importar XML y PDF FEL; registro manual; originales y estados de procesamiento.
- Clasificación automática sugerida, correcciones y aprobación humana antes de registrar en libros.
- Compras/ventas, categorías, períodos, cierre y exportaciones revisables.
- Portal básico: cliente carga comprobantes y consulta su información autorizada.
- Planes por NIT gestionados: mostrar cupos/capacidades confirmados por API. Paquetes 10/25/50 son ejemplos, cobro automático pendiente de decisión.

### Después

- Fotografías de comprobantes con IA e integración con certificadores comprobados.
- App móvil posterior a la web/PWA, reutilizando API y permisos.
- Empresas: múltiples entidades fiscales, sucursales, empleados, permisos, presupuestos, caja y consolidación.
- Personal: ingresos/gastos, presupuestos y hábitos; posible plan gratuito.

Estos módulos futuros no se implementan por adelantado. Preparar límites de dominio y contratos reutilizables, no pantallas vacías ni arquitectura especulativa.

## 3. Estado y convenciones existentes

- React 19, TypeScript, Vite, React Router, Tailwind **3.4**, Axios y TanStack Query; npm y lockfile.
- `src/main.tsx` inicia la app; `src/App.tsx` compone `src/app/providers.tsx` y `src/app/routes.tsx`.
- `src/features/<dominio>` para api/pages/components/hooks/types según necesidad real.
- `src/shared/api` contiene HTTP y QueryClient; `shared/config` configuración/marca; `shared/ui`, `lib`, `utils`, `theme` piezas compartidas; `src/styles/globals.css` estilos/tokens.
- Hay avances PWA en `src/shared/pwa`, manifest/service worker, iconos y pruebas Playwright. Respetar este trabajo existente; no confundir existencia con validación manual de todos los navegadores.
- Login correo/contraseña, registro, Google OAuth, recuperación, sesión SDK Supabase, rutas protegidas, bienvenida y logout implementados; usuario confirmó login real y Google funcional tras corregir el origen del API/callback. La fase de perfil/workspaces se incorpora según codex.md; no hay módulos financieros.
- Auth sigue la referencia San Gabriel: `api`, `components`, `pages` (plural), `store`, `types`. Interfaces en `types/auth.types.ts`, transporte en `api/authApi.ts`, formulario mediante `api/useLogin.ts`; SDK como gestor único de sesión, sin persistencia manual ni credenciales en Query.
- Scripts actuales: `dev`, `build`, `preview`, `lint`, `format`, `icons:generate`, `test:auth`, `test:pwa`. No hay `test` ni `typecheck`; build ejecuta TypeScript.
- Revisar archivos/scripts y preservar cambios del usuario. Por instrucción vigente, el control de versiones lo ejecuta el usuario: no ejecutar comandos Git ni commit/push. Para verificaciones seguir la autorización acotada y las restricciones del bloque inicial/codex.md. No modificar `.env` ni claves existentes sin autorización expresa.

Separar UI, estado remoto, sesión y transporte. Mantener TanStack Query para datos remotos; no añadir gestores globales sin necesidad. Usar Tailwind 3.4 y centralizar marca y tokens. La dirección visual se define según la responsabilidad de diseño siguiente, sin imponer la paleta histórica.

### Responsabilidad de diseño UI/UX y recursos visuales

- **Usar la skill UI/UX Pro Max para las tareas de diseño frontend.** Buscarla entre las skills disponibles y cargar sus instrucciones antes de definir o implementar el diseño. Si no está disponible, indicarlo y solicitar su instalación o ubicación; no afirmar que se utilizó ni inventar sus instrucciones.
- El agente es responsable de definir componentes, colores, interfaz de usuario y experiencia de usuario. Debe tomar decisiones visuales coherentes con Nuvora Contadores, explicar brevemente su criterio y llevarlas a componentes reutilizables cuando se implemente la fase autorizada.
- Dirección de marca actualizada por solicitud del usuario (2026-11-12): sustituir lima por índigo **#4F46E5** con texto blanco en claro; **#A5B4FC** con texto **#1E1B4B** en oscuro y superficies neutras slate. Tokens y resultados en `docs/UI-ACCESSIBILITY.md`. Mantener control sol/luna sin etiqueta visible «Tema», sistema por defecto hasta elección manual persistida. No depender solo del color para comunicar estados.
- Centralizar el sistema visual en tokens compatibles con Tailwind 3.4 y los estilos existentes: tipografía, espaciado, radios, sombras, densidad y estados interactivos. La paleta provisional puede evolucionar; evitar colores arbitrarios dispersos por las pantallas.
- Definir componentes según necesidad: botones, campos, selectores de cliente, tablas, filtros, navegación, tarjetas, diálogos, notificaciones y estados de carga/vacío/error. Incluir variantes, foco, teclado, responsive y jerarquía visual consistente.
- Diseñar la experiencia alrededor de seleccionar cliente, cargar documentos, revisar, aprobar y cerrar el período, reduciendo pasos y haciendo visible el contexto activo y las acciones importantes.
- Crear recursos visuales o utilizar bibliotecas/servicios de iconos modernos e imágenes cuando aporten claridad. Preferir una familia consistente de iconos SVG, por ejemplo Lucide, según dependencias existentes; evitar emojis como sustitutos de iconos de interfaz y mezclas de estilos.
- Seleccionar, crear o encargar las imágenes e ilustraciones necesarias para onboarding, estados vacíos o presentación del producto. Respetar licencias y atribuciones, optimizar tamaño/formato, definir texto alternativo cuando corresponda y evitar imágenes decorativas que dificulten el trabajo contable. Si se requiere un servicio externo o generación de imágenes, usarlo solo con herramientas disponibles y autorización aplicable.
- Mantener coherencia entre identidad de interfaz, favicon e iconos PWA. Documentar las decisiones del sistema visual al implementarlo y comprobar las pantallas en tamaños móviles y de escritorio cuando el usuario autorice la validación.

### Banner y estado de validación

- Conservar banner PWA compacto superior, en flujo y respetando safe areas. Puede mostrarse como promoción antes de disponer del prompt; habilitar «Instalar» únicamente cuando exista `beforeinstallprompt`. Informar disponibilidad sin prometer instalación universal ni mostrar un CTA activo inoperante.
- Ocultar en standalone/instalación confirmada y respetar cierre persistido. No restaurar el desplegable de instrucciones ni el banner inferior.
- Los flujos Auth reales cuentan con confirmación histórica del usuario. Los ajustes recientes de diseño y monograma no tienen nueva aceptación visual ni validación automatizada posterior. Resultados históricos y límites están en `docs/PLAN.md`; no atribuirles pruebas del estado actual, de dispositivos concretos o de todos los casos de sesión. Las funcionalidades futuras requieren nueva indicación.

## 4. Dominio preparado para expansión

- **Usuario/perfil:** identidad independiente del segmento.
- **Workspace:** espacio operativo/comercial; inicialmente despacho (incluido contador independiente), después empresa o personal.
- **Entity:** propietaria de documentos y registros financieros; en Contadores es cliente fiscal con NIT. Una entidad personal futura puede carecer de NIT.
- **Membresías y grants:** acceso explícito del equipo/espacio y del cliente a entidades concretas, con permisos y revocación.

No confundir workspace con entity ni usar NIT como permiso. No asumir acceso a toda cartera por estar en un despacho. La política de uno/varios despachos por entidad está pendiente antes de construir el módulo; el modelo permite desacoplar acceso de propiedad de documentos.

- Separar rol del espacio de capacidad por entidad; portal no hereda privilegios del contador. Owner/admin/viewer son roles base, matriz completa por definir con API.
- Datos financieros pertenecen a la entidad, no a una pantalla o segmento. Futuros usuarios B2B/B2C podrán autogestionar sin despacho obligatorio.
- Diseñar componentes y clientes HTTP por dominio. Separar navegación/experiencia de Contadores, Empresas y Personal cuando corresponda, reutilizando UI y contratos comunes.
- Capacidades del plan y permisos proceden del servidor; ocultar botones no implementa seguridad ni control de cupos.
- Claves de caché incluyen usuario/contexto, workspace/entity y filtros relevantes. Al cambiar contexto o cerrar sesión, cancelar peticiones y limpiar datos; respuestas tardías no deben repoblar vistas anteriores.
- Usar API para documentos/finanzas; no eludir autorización mediante consultas directas a tablas o Storage. URLs firmadas temporales solo tras autorización.

## 5. API y autenticación conservadas

Backend independiente Express/TypeScript/Supabase. Mantener contratos existentes:

```text
GET  /health
POST /api/v1/auth/signup
POST /api/v1/auth/signin
POST /api/v1/auth/refresh
POST /api/v1/auth/password-reset/request
POST /api/v1/auth/password-reset/update
GET  /api/v1/auth/oauth/google/url
GET  /api/v1/auth/me
```

- `/health` público, `/auth/me` protegido; refresh recibe `{ refreshToken }`. Signup recibe `{ email, password }`; password update recibe `{ password }` con Bearer. Contraseñas nuevas: 8–128, mayúscula, minúscula, número y carácter especial. Signin conserva compatibilidad con contraseñas antiguas de 8–128.
- No inventar rutas de clientes, libros o portal. Implementar con contratos confirmados; tipos/OpenAPI coordinados con backend.
- Axios compartido con timeout explícito, cancelación y errores normalizados. Definir base URL/prefijos para no duplicar `/api/v1`; `/health` queda fuera.
- Enviar Bearer solo al API configurado, nunca a URLs firmadas/proveedores externos.
- Errores estables `{ "error": "CODE", "message": "Mensaje seguro" }`. Tratar 401/403/429 y fallos de red; no reintentar automáticamente correos ante `AUTH_RATE_LIMITED` ni mutaciones no idempotentes.
- SDK oficial Supabase como único gestor de sesión/renovación. Si se usan endpoints Auth del API, integrar resultado con sesión oficial; no crear refresh paralelo desde Axios.
- No persistir contraseñas/refresh tokens manualmente. Inicialización con loading, limpieza de listeners y prevención de carreras; rutas protegidas son UX, el API autoriza.
- OAuth/callback con flujo confirmado, redirects permitidos, limpieza de parámetros sensibles y rechazo de redirecciones abiertas. Local previsto: `http://localhost:5173/auth/callback`.
- Registro, Google y recuperación incluyen formularios/callbacks y estados de error; confirmación de correo, proveedor Google, SMTP y ambientes reales deben verificarse por configuración. Logout limpia caché/estado y maneja errores.

Variables públicas previstas: `VITE_APP_NAME`, `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. Todo `VITE_*` llega al navegador. Nunca leer/copiar/usar `SUPABASE_SECRET_KEY`, service role ni claves de IA. `.env.example` con placeholders; no versionar entornos reales.

API tiene pendientes de aislamiento de sesiones concurrentes, pruebas, SMTP/recuperación, OpenAPI y ambientes. Conservar su login/Bearer existente y coordinar estabilización, no reconstruirlo. Desarrollo/staging no productivo y producción separados; confirmación de correo en producción.

## 6. Captura, revisión y cierre mensual

Flujo principal: **seleccionar cliente → cargar XML/PDF o registrar manualmente → extraer → sugerir clasificación → revisar → aprobar → libro/cierre**.

- Borrador puede guardarse antes de revisar; no debe mostrarse como registro aprobado. El cliente puede cargar sin obtener permiso de aprobación.
- Mostrar procesamiento, extracción parcial, advertencias, conflictos, rechazo y reintento seguro. Validaciones frontend ayudan a UX; límites y validación definitiva pertenecen al API.
- XML es fuente estructurada preferida. PDF está en MVP, pero soporte de texto/escaneados depende de verificar extractor. No inventar soporte OCR ni presentar archivos no soportados como procesados.
- Nunca llamar extractor/IA directamente desde navegador. Clasificación por reglas explicables primero; IA mediante backend cuando se acuerde proveedor. Sugerencias no son decisiones definitivas ni entrenamiento automático oculto.
- Mostrar fuente de datos/sugerencia, campos corregibles e historial. Correcciones pueden generar reglas explícitas y revisables, no mezclar aprendizaje o datos de clientes.
- XML/PDF de una misma factura son archivos asociados a un documento: no duplicar operación. Sin UUID o con conflicto, revisión según contrato.
- Determinar compras/ventas según receptor/emisor de la entidad, con discrepancias visibles. Contemplar notas, anulaciones y ajustes sin borrar trazabilidad.
- Importado, validado localmente y verificado externamente son distintos; solo mostrar el último con integración real. No asumir API SAT ni pedir contraseñas de Agencia Virtual.
- Libros y exportaciones solo con aprobados elegibles. Formatos, regímenes, IVA/retenciones/ISR y cierre/reapertura requieren definición y validación local antes de prometer cumplimiento.
- Conservar precisión decimal; no calcular dinero con float binario. Moneda/redondeo explícitos, API autoridad de totales. Distinguir fecha de emisión/importación/período/pago y fechas sin hora.
- Documento ≠ gasto/ingreso ≠ pago/cobro ≠ caja. Presupuestos y caja son expansión; importar nunca crea un pago implícito.

## 7. UX, seguridad y PWA

- Español, responsive/mobile-first, navegación por teclado, labels, foco visible y contraste. Tablas útiles para volumen de cartera con filtros/paginación del API.
- Mostrar siempre cliente/entidad activos en operaciones sensibles. Estados carga/vacío/error/éxito/permisos y evitar doble envío.
- KPIs reales orientados a pendientes de revisión y cierre. Fixtures sintéticos marcados Demo, sin datos tributarios reales en pruebas/logs/repositorio.
- No renderizar contenido fiscal como HTML confiable ni ejecutar instrucciones de documentos/resultados IA. Validar enlaces, entradas y archivos.
- No enviar datos fiscales a analítica/proveedores innecesarios. Minimización y retención coordinadas con backend; HTTPS, headers y CORS según despliegue.
- Preservar PWA existente: manifest/iconos, instalación, aviso de actualización y shell estático offline. API, XML/PDF, sesiones y datos financieros requieren red y no se cachean en service worker.
- Excluir callbacks y rutas API de fallback offline. Actualizar con confirmación para no perder trabajo; instalación/actualización iOS y sistema operativo requieren pruebas reales.
- Hosting con fallback SPA, HTTPS no local y política de caché del README. No asumir que el futuro móvil usará el almacenamiento de sesión del navegador.

## 8. Secuencia y criterios de aceptación

1. **Alinear contratos/permisos/diseño:** decisiones mínimas y formatos por confirmar. Preservar base/PWA.
2. **Auth:** SDK, sesión, formularios/callback, `/auth/me`, recuperación y logout. Verificar carga inicial, recarga, expiración, errores y limpieza.
3. **Despacho y cartera:** perfiles, entidades, invitaciones, selector y accesos según API. Pruebas de rutas/caché y revocación entre entidades/despachos.
4. **Captura y revisión:** XML/PDF/manual, duplicados, sugerencias, aprobación. Objetivo conjunto: 50 XML válidos y XML/PDF de una misma factura sin duplicar; nada al libro sin aprobación.
5. **Clasificación/libros:** reglas, compras/ventas, períodos, cierre y exportación con totales conciliables y formatos validados.
6. **Portal y piloto:** completar carga/consulta del cliente, cupos del plan, PWA e integración E2E cliente → contador → libro, incluyendo denegación de acceso ajeno.
7. **Expansión posterior:** fotos/IA, certificadores comprobados, móvil, Empresas y Personal por fases autorizadas.

No adelantar módulos futuros ni declarar funcionalidades completas basándose en mocks. El plan en API detalla dependencias y decisiones abiertas.

## 9. Trabajo y verificación

- Cambios pequeños, tipados, consistentes con la estructura existente. Inspeccionar dependencias antes de instalar; no añadir infraestructura especulativa.
- Cada fase: objetivo/archivos/decisiones/aceptación, implementación y resultados reales; aprobación antes de otra fase mayor.
- No commit/push, borrados ajenos ni migraciones remotas sin autorización.
- Cuando el usuario vuelva a autorizar verificaciones de código: lint/build y pruebas adecuadas; `test:pwa` si afecta PWA. Incorporar tests funcionales de sesión, permisos, navegación, revisión, libros y un E2E del MVP.
- Para documentación: revisar consistencia, enlaces y contenido sin comandos Git; no afirmar checks de código no ejecutados.

```bash
npm run dev
npm run lint
npm run build
npm run preview
npm run test:pwa
```

Node.js 22.12+ o 24 LTS según README. Playwright requiere Chromium (`npx playwright install chromium`) cuando se ejecuten sus pruebas. `npm run format` modifica archivos; evitar formateo masivo. No existen `npm test`/`typecheck` hasta que se agreguen explícitamente.


## Actualización de continuidad — 2026-11-12, rutas

Separación de navegación autorizada e implementada: `/` espacios, `/workspaces/:workspaceId/clients` cartera, `/workspaces/:workspaceId/clients/:entityId` detalle/edición, `/account` perfil. Preservar esta separación, el shell privado y los diálogos de alta. Detalle anterior como diálogo sustituido por `features/entities/pages/EntityDetailPage.tsx`. La autorización del workspace se confirma antes de montar queries de clientes; edición directa no depende de una lista visitada previamente.

Estado y límites en `codex.md` y `docs/ROUTING.md`: lint/build aprobados; suites adaptadas y nuevos casos Demo sin ejecutar, sin revisión visual ni integración real. Apariencia y logout permanecen en menú de cuenta. No adelantar fases mayores por este cierre.


## Continuidad de sesión — 2026-11-12

Preservar la corrección de AuthProvider: SIGNED_IN repetido/TOKEN_REFRESHED del mismo usuario ya verificado no deben limpiar Query ni desmontar UI. Identidad verificada se invalida en clear; cambios reales de sesión siguen resolviéndose. No desactivar refresh SDK ni revalidación de permisos para ocultar parpadeos. Hallazgo, caso preparado y resultados en `docs/SESSION-CONTINUITY.md`; Playwright no ejecutado.
