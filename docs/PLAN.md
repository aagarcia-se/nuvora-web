# Plan frontend — Nuvora Contadores

Actualizado: 2026-11-10. Estado: **planificación; fases funcionales pendientes de autorización e implementación**.

## 1. Objetivo y documentos de referencia

Construir una web responsive e instalable para contadores independientes y despachos que administran múltiples clientes/NIT. Reducir el tiempo de cierre mediante captura documental, clasificación sugerida, revisión humana y libros/exportaciones trazables.

Flujo principal:

**Seleccionar cliente → cargar XML/PDF o registrar manualmente → revisar extracción y clasificación → aprobar → consultar libro → cerrar/exportar período.**

Referencias:

- [Instrucciones del frontend](../AGENTS.md).
- [Desarrollo y PWA](../README.md).
- [Plan coordinado del API](../../nuvora-api/docs/PLAN.md).
- [Coordinación API ↔ Web](../../nuvora-api/docs/frontend-handoff.md).

Los enlaces al API requieren los dos repositorios como carpetas hermanas. Este plan concreta el trabajo frontend; no autoriza modificar contratos, ejecutar pendientes del backend ni aplicar migraciones remotas. Cada fase mayor requiere aprobación.

## 2. Punto de partida verificado

- React 19, TypeScript, Vite, React Router, Tailwind 3.4, Axios y TanStack Query.
- Arquitectura `app`, `features`, `shared` y `styles`; alias `@/`.
- Clientes HTTP/Query y configuración pública inicial. Sin SDK Supabase ni flujos de autenticación web implementados.
- PWA con manifest, iconos, registro del service worker, instalación, aviso de actualización y shell estático offline. Pruebas Playwright disponibles.
- Pantalla inicial mínima; sin despacho, cartera, captura, revisión, libros ni portal funcionales.
- Identidad provisional: tokens de marca rosados e iconos PWA verdes. Unificarlos durante la fase visual, conservando la funcionalidad existente.
- Scripts: `dev`, `build`, `preview`, `lint`, `format`, `icons:generate`, `test:pwa`. No hay scripts `test` ni `typecheck`.

Esta revisión fue documental: no vuelve a certificar pruebas anteriores, instalación en dispositivos ni recuperación/OAuth reales.

## 3. Alcance y límites del MVP

### Incluido

1. Autenticación, sesión, recuperación completa y Google.
2. Despacho/equipo, cartera, selección explícita de cliente y permisos por entidad.
3. XML/PDF según capacidades verificadas del extractor; registro manual y originales privados.
4. Extracción y clasificación sugerida, corrección, aprobación/rechazo e historial.
5. Categorías/reglas, compras/ventas, períodos, cierre/reapertura y exportaciones revisables.
6. Portal básico para carga/consulta autorizada del cliente.
7. Cupos/capacidades proporcionados por el API y piloto web/PWA.

### Posterior, con autorización independiente

Fotos/OCR/IA de comprobantes, certificadores verificados, app móvil, Empresas, Personal, caja/presupuestos y cobro automático. No crear módulos vacíos para anticiparlos. Paquetes 10/25/50 son ejemplos, no capacidades comerciales confirmadas.

PDF permanece en el MVP, pero no se prometerá procesamiento de documentos escaneados hasta verificarlo. El MVP no se considera completo sin el soporte PDF acordado y el portal básico.

## 4. Arquitectura y dominio

Mantener la composición `main.tsx → App.tsx → AppProviders / AppRoutes`, incluyendo `PwaStatus`. Incorporar layouts globales en `app` cuando se implemente navegación autenticada.

| Ubicación | Responsabilidad prevista |
| --- | --- |
| `src/app` | Providers, rutas, layouts y composición de experiencias |
| `src/features/auth` | Sesión, formularios, callback y recuperación |
| `src/features/workspaces` | Despacho, equipo e invitaciones |
| `src/features/entities` | Cartera, ficha y contexto de cliente |
| `src/features/documents` | Captura, importaciones, revisión y originales |
| `src/features/classification` | Categorías y reglas explicables |
| `src/features/books` | Compras/ventas, períodos y exportaciones |
| `src/features/portal` | Experiencia limitada del cliente, reutilizando dominios |
| `src/shared/api` | Transporte, errores comunes y configuración Query |
| `src/shared/config`, `ui`, `lib`, `utils`, `theme` | Configuración y piezas realmente compartidas |
| `src/shared/pwa` | Instalación, actualización y estado PWA existente |

Son responsabilidades propuestas: crear carpetas y subcarpetas solo cuando contengan implementación necesaria. Evitar replicar servicios de documentos dentro del portal.

Modelo lógico compartido, no tablas ni contratos para crear desde React:

```text
usuario/perfil ↔ membresías ↔ workspace (despacho)
workspace ↔ grants explícitos ↔ entity (cliente fiscal)
usuario/perfil ↔ acceso de cliente ↔ entity
entity → importaciones → documentos → archivos XML/PDF y líneas
entity → categorías/reglas → sugerencias revisables
documentos → revisiones/aprobaciones → registros elegibles del libro
entity → períodos → libros/exportaciones versionadas
workspace → capacidades comerciales confirmadas por servidor
acciones → auditoría con actor y alcance
```

Workspace organiza el trabajo; entity posee los documentos. El NIT no es un permiso. Pertenecer al despacho no implica acceso a toda su cartera y el portal no hereda privilegios del contador.

## 5. Dirección UI/UX propuesta

Aplicar UI/UX Pro Max al implementar cada fase visual. Sus instrucciones locales fueron consultadas; el usuario autorizó continuar sin búsquedas Python. No se atribuyen a la skill resultados de búsquedas no ejecutadas.

### Identidad y tokens

Propuesta: esmeralda como primario para dar continuidad al icono PWA, azul pizarra como secundario y superficies claras para lectura contable prolongada. La siguiente paleta es una decisión de diseño pendiente de llevar a tokens y verificar en componentes; no constituye un cambio ya aplicado:

| Token semántico | Base propuesta | Uso |
| --- | --- | --- |
| Primario | `#047857` | Acción principal, marca e instalación |
| Secundario | `#334155` | Navegación y acciones secundarias |
| Acento/información | `#1D4ED8` | Enlaces y avisos informativos |
| Fondo / superficie | `#F8FAFC` / `#FFFFFF` | Área de trabajo y paneles |
| Superficie secundaria | `#F1F5F9` | Agrupaciones y estados hover |
| Borde suave / control | `#E2E8F0` / `#64748B` | Separadores / límites de inputs |
| Texto / secundario | `#0F172A` / `#475569` | Jerarquía de lectura |
| Éxito / advertencia / error | `#166534` / `#92400E` / `#B91C1C` | Estados con texto e icono |

Definir variantes claras/oscuras y estados hover, active, focus y disabled en `tailwind.config.ts` y `globals.css`; evitar hexadecimales aislados en pantallas. Contraste objetivo: 4.5:1 en texto normal y 3:1 en controles/texto grande, medido sobre combinaciones reales. Unificar favicon, iconos PWA y metadatos con la identidad elegida.

- Tipografía: familia sans existente con respaldo del sistema; importes alineados y cifras tabulares. Tamaños base legibles de 14–16 px según densidad.
- Espaciado con escala de 4 px; radios moderados de 8–16 px y sombras discretas.
- Controles táctiles de al menos 44 px como objetivo de diseño; foco visible y navegación por teclado.
- Componentes por necesidad: botón, campo, alerta, estado vacío/carga/error, selector de entidad, tabla, paginación, filtros y diálogo accesible. Separar interacción, sesión y transporte.
- Una familia SVG consistente; considerar Lucide tras revisar dependencias. No usar emojis como iconos de navegación.
- Recursos visuales solo cuando ayuden al onboarding o a comprender un estado; optimizados, con licencias/alt adecuados. Generación externa solo con autorización aplicable.

### Experiencia

En escritorio, navegación estable y espacio principal orientado a tablas; en móvil, navegación compacta y detalle progresivo. Cliente y período activos deben ser visibles antes de cargar, aprobar, cerrar o exportar. Un cambio de cliente limpia selecciones y filtros incompatibles.

Evitar dashboards ornamentales: priorizar pendientes de revisión, errores y avance del cierre con datos reales. Mostrar estados por archivo y acciones recuperables. Las confirmaciones sensibles deben identificar entidad, período y efecto de la acción. Prototipos con fixtures se etiquetan **Demo**.

## 6. Navegación propuesta

Estas son **rutas del navegador**, no endpoints del API ni pantallas ya implementadas. Ajustarlas al confirmar los contratos y flujos:

| Ruta propuesta | Función |
| --- | --- |
| `/auth/login`, `/auth/register` | Acceso y registro |
| `/auth/forgot-password`, `/auth/reset-password` | Solicitud y cambio final de contraseña |
| `/auth/callback` | Retorno OAuth/sesión según flujo confirmado |
| `/app` | Resolver acceso y contexto inicial |
| `/app/workspaces/:workspaceId/clients` | Cartera autorizada |
| `/app/workspaces/:workspaceId/team` | Equipo/invitaciones según permiso |
| `/app/workspaces/:workspaceId/entities/:entityId/documents` | Bandeja y captura |
| `/app/workspaces/:workspaceId/entities/:entityId/documents/:documentId` | Detalle y revisión |
| `/app/workspaces/:workspaceId/entities/:entityId/classification` | Categorías/reglas |
| `/app/workspaces/:workspaceId/entities/:entityId/books` | Compras/ventas, períodos y exportación |
| `/portal/entities/:entityId/documents` | Carga/consulta limitada del cliente |

IDs de URL no autorizan acceso. Resolverlos contra permisos del servidor; contemplar sesión inicial, acceso revocado, entidad inexistente y retorno seguro a una ruta permitida. Un layout de portal distinto no sustituye autorización.

## 7. Contratos e integración

Rutas conservadas según documentación coordinada:

```text
GET  /health
POST /api/v1/auth/signup
POST /api/v1/auth/signin
POST /api/v1/auth/refresh
POST /api/v1/auth/password-reset/request
GET  /api/v1/auth/oauth/google/url
GET  /api/v1/auth/me
```

Antes de codificar Auth, verificar esquemas/controladores/Postman: cuerpos, respuestas y errores. Refresh recibe `{ refreshToken }`; `/auth/me` requiere Bearer. Mantener `{ error, message }`, tratar 401/403/429 y fallos de red; no reenviar correos automáticamente ante `AUTH_RATE_LIMITED`.

Propuesta a confirmar en fase 0: `VITE_API_BASE_URL` representa el **origen del API**, con rutas explícitas `/api/v1/...` y `/health`. El ejemplo actual del entorno no establece este contrato. Al adoptarlo, actualizar validación, cliente, `.env.example` y README conjuntamente.

Supabase oficial será el único responsable de persistencia/renovación de sesión. Definir si formularios usan el API existente y cómo integrar sus tokens con `setSession`, sin refresh paralelo. Confirmar OAuth/PKCE y recuperación completa antes de implementar callbacks. Axios solo agrega Bearer al API configurado; descargas firmadas no reciben ese encabezado.

Variables públicas previstas: `VITE_APP_NAME`, `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. No leer ni incorporar secretos del API; usar placeholders en ejemplos y configuración no productiva para pruebas.

Para cada dominio pendiente, acordar antes de conectar UI: rutas/métodos, DTOs, contexto workspace/entity, permisos, paginación/filtros, límites, errores, estados, idempotencia y concurrencia. No inventar endpoints o estados de proveedor.

## 8. Backlog ordenado y criterios de aceptación

### Fase 0 — Contratos y sistema visual

**Objetivo:** preparar Auth y una dirección visual coherente sin bloquearla por decisiones contables posteriores.

- Revisar contratos Auth y pendientes de aislamiento del API; definir origen/prefijos, flujo SDK y callbacks por entorno.
- Documentar tokens y especificaciones de componentes en `docs/design-system.md` al autorizar esta fase.
- Acordar matriz inicial de permisos y registrar decisiones pendientes por módulo.
- Archivos previstos: documentación y, al implementar diseño, `tailwind.config.ts`, `src/styles/globals.css`, `shared/config`, `shared/ui` e iconos afectados.
- **Aceptación:** flujo Auth documentado, configuración pública identificada, propuesta visual contrastada y límites API/Web claros.

### Fase 1 — Autenticación y sesión

**Dependencias:** configuración pública no productiva, redirects permitidos y coordinación del API para sesiones concurrentes, SMTP y recuperación.

- Incorporar SDK oficial; validación de entorno y cliente único, inicialización de sesión con loading y limpieza de suscripciones.
- Implementar login, registro, confirmación pendiente, Google/callback, recuperación completa y logout; integrar `/auth/me`.
- Proteger navegación sin parpadeos, normalizar errores y evitar dobles envíos. Limpiar parámetros sensibles y rechazar retornos externos.
- Archivos previstos: `features/auth`, `shared/api`, `shared/config`, providers/rutas, `.env.example`, README y pruebas Auth.
- **Aceptación:** sesión tras recarga, expiración controlada, 401/403/429 legibles, logout sin caché sensible ni respuestas tardías, callback cancelado/inválido manejado. Google y cambio final de contraseña verificados con proveedor real antes de declararlos completos.

### Fase 2 — Despacho, equipo y cartera

**Dependencias:** contratos implementados de perfiles, workspaces, entidades, invitaciones/grants y matriz de permisos. Definir uno/varios despachos por entidad y consentimiento de vinculación.

- Alta y contexto del despacho, cartera paginada, invitaciones, selección de cliente y permisos por acción.
- Incorporar layouts autenticados y claves Query por usuario/workspace/entity/filtros.
- Al cambiar contexto, cancelar peticiones y limpiar caché/selecciones anteriores; descartar respuestas tardías.
- Archivos previstos: `features/workspaces`, `features/entities`, layouts/rutas y pruebas de aislamiento.
- **Aceptación:** dos despachos/clientes aislados, acceso directo por URL denegado cuando corresponda, revocación visible, ninguna asignación inferida por NIT y sin fugas al cambiar rápidamente de entidad. Verificar autorización real con API, además de mocks UI.

### Fase 3 — Captura y revisión

**Dependencias:** contratos de importación/documentos/archivos, límites de lote/tamaño y capacidad PDF comprobada. Parser, extractor y Storage son del backend.

- Carga XML/PDF y captura manual; estado por archivo, originales mediante enlaces temporales y detalle editable según permisos.
- Preview de extracción, advertencias, discrepancias emisor/receptor, duplicados XML/PDF y conflictos sin UUID.
- Guardado como borrador y revisión/aprobación/rechazo explícitos, con historial y control de concurrencia acordado.
- Archivos previstos: `features/documents`, componentes compartidos necesarios y pruebas del flujo.
- **Aceptación:** objetivo conjunto de 50 XML válidos; reintentos sin duplicar, una factura XML/PDF representa una operación, formatos no soportados no aparecen como procesados y nada llega al libro sin aprobación. Cliente cargador no obtiene capacidad de aprobar.

### Fase 4 — Clasificación, libros y cierre

**Dependencias:** categorías/reglas, registros contables, períodos y exportaciones del API; formatos/regímenes, impuestos, redondeo y reapertura validados por especialista local.

- Sugerencias explicables por entidad, corrección y aprobación; reglas explícitas y revisables. IA no es requisito inicial.
- Compras/ventas desde documentos aprobados elegibles; filtros, totales del servidor y tratamiento visible de notas/anulaciones/ajustes.
- Cierre/reapertura según permiso, historial y exportación reproducible consistente con filtros.
- Archivos previstos: `features/classification`, `features/books`, formateadores y pruebas de revisión/cierre.
- **Aceptación:** bases/impuestos/totales conciliados con fixtures validados; borradores excluidos; exportaciones/cierres anteriores no cambian silenciosamente. CSV protegido contra fórmulas. Documento no se presenta como pago/cobro; preservar decimal del contrato sin cálculos binarios.

### Fase 5 — Portal, capacidades y piloto

**Dependencias:** invitaciones/acceso limitado, capacidades/cupos confirmados por API y entorno de piloto.

- Completar experiencia cliente reutilizando carga/consulta del núcleo con permisos limitados.
- Vista de cartera con pendientes y avance real por período; mensajes de cupo/plan desde servidor.
- Verificar instalación, actualización con confirmación y shell offline en dispositivos; preparar despliegue y callbacks HTTPS.
- Archivos previstos: `features/portal`, navegación por capacidades, pruebas E2E y documentación de piloto.
- **Aceptación:** cliente carga → contador revisa/aprueba → libro/exportación contiene una operación; acceso ajeno denegado y cupos coherentes. Medir tiempo de cierre, errores y correcciones frente a línea base, sin métricas inventadas.

## 9. Verificación transversal y entrega

- Formularios: labels, foco, teclado, errores accesibles, carga, vacío, éxito y permisos insuficientes; prevenir doble envío.
- Verificar móvil desde 320 px y escritorio; tablas con desplazamiento controlado, contexto visible y acciones alcanzables.
- Tests funcionales de sesión/callback, navegación, caché por contexto, revocación, duplicados y aprobación. Incorporar herramientas/scripts de pruebas unitarias solo al necesitarlos y documentarlos.
- Pruebas de parser, RLS, idempotencia y cálculos pertenecen al API; las de interfaz no las sustituyen.
- Solo fixtures sintéticos; no registrar XML, NIT reales, credenciales ni tokens. No renderizar contenido fiscal como HTML confiable.
- Preservar PWA: caché solo estático, exclusión de API/callbacks/documentos y actualización con confirmación. Ningún dato financiero offline por defecto.
- Cada entrega debe listar archivos, decisiones, comandos ejecutados, resultados reales, pendientes y aprobación solicitada para la siguiente fase.

Comandos existentes para cambios de código:

```sh
npm run lint
npm run build
# Si se afecta la PWA (incluye build y pruebas Chromium):
npm run test:pwa
```

Para cambios exclusivamente documentales: revisar coherencia, enlaces y `git diff --check`. No atribuirles ejecución de pruebas de aplicación. No hacer commit/push ni migraciones sin autorización.

## 10. Decisiones pendientes y momento límite

| Decisión | Responsable / coordinación | Necesaria antes de |
| --- | --- | --- |
| Configuración pública, origen API, sesión SDK y OAuth/recuperación | Web + API + configuración de entorno | Fase 1 |
| Tokens y componentes visuales accesibles | Frontend, con revisión del usuario | Implementación visual de fase 0/1 |
| Uno/varios despachos por entidad, consentimiento y permisos | Producto + API | Fase 2 |
| PDF texto/escaneado, límites y fallback manual | API/extractor + producto | Fase 3 |
| Formatos/regímenes fiscales, moneda/redondeo, cierre/reapertura | Especialista local + producto + API | Fase 4 |
| Cliente activo computable, archivado, cupos y activación comercial | Producto + API | Fase 5 |
| Hosting, redirects, SMTP y matriz real de dispositivos | Web + API + operación | Piloto |

**Próxima acción propuesta:** aprobar la fase 0 y confirmar la configuración pública necesaria para Auth. Los pendientes fiscales y comerciales posteriores no bloquean la estabilización de identidad.
