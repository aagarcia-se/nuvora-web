# Plan y continuidad — Nuvora Web

**Lectura prioritaria:** la fase vigente de clientes/entidades está en la sección 18 y en [ENTITIES.md](./ENTITIES.md); perfil/workspaces de la sección 17 se conservan, basada en [codex.md](../codex.md). Las secciones anteriores son historia y no autorizan restaurar el intento de workspaces eliminado por el propietario. Lint/build solicitados para esta fase; Playwright pendiente de autorización expresa.

**Estado de autenticación:** login correo/contraseña, sesión, rutas protegidas, bienvenida y logout implementados. El usuario confirmó que el login real funciona tras corregir la URL del API y posteriormente dio conformidad a sus pruebas del banner/interfaz. No especificó navegador, dispositivo ni cada caso ejecutado: esa confirmación no certifica todas las plataformas ni toda la matriz de pruebas.

Registro por correo/contraseña está implementado en `/auth/register`, junto con el enlace desde login. Google OAuth se reutiliza para registro/inicio con URL emitida por el API, callback PKCE/hash y adopción de sesión Supabase. La recuperación web está implementada con solicitud genérica, adopción PKCE/hash y actualización final de contraseña.

El frontend y backend están alineados para contraseñas nuevas: 8–128 caracteres, mayúscula, minúscula, número, carácter especial y confirmación coincidente en web. Se permiten letras Unicode; los espacios no cuentan como carácter especial. Signin conserva compatibilidad con cuentas antiguas de 8–128.

## 1. Objetivo y prioridad

Implementar los flujos Auth web coordinados: login y registro por correo/contraseña consumiendo el API existente, Google, gestión de sesión, bienvenida protegida y logout. Diseño responsive minimalista con índigo **#4F46E5**, lavanda **#A5B4FC** en oscuro y sistema por defecto hasta elección manual.

Este es el punto de entrada vigente del plan frontend. La identidad índigo reemplaza las propuestas previas de esmeralda y lima; no restaurarlas. Registro, recuperación y Google están implementados; cartera, libros y portal siguen en el roadmap y no se muestran enlaces a flujos inexistentes.

Referencias:
- [AGENTS.md](../AGENTS.md): reglas permanentes.
- [README.md](../README.md): desarrollo y PWA.
- [Plan de producto/API](../../nuvora-api/docs/PLAN.md): roadmap general, no tareas adicionales de esta entrega.
- [Handoff](../../nuvora-api/docs/frontend-handoff.md): coordinación y contratos.

El borrador detallado de esta entrega se creó en `C:/Users/agarcia/.opencode/plan/plan.md`. Este documento deja las decisiones operativas dentro del repositorio, sin depender de esa ruta personal. Si difieren, seguir este plan y las instrucciones más recientes del usuario.

## 2. Base a conservar

- React, TypeScript, Vite, React Router, Tailwind 3.4, Axios y TanStack Query.
- Arquitectura `app`, `features`, `shared`, `styles` y alias `@/`.
- PWA existente: instalación, manifest, iconos, service worker, aviso de actualización y shell offline; pruebas Playwright.
- API Express/Supabase: signin, validación Bearer y `/auth/me`, seguridad y logs existentes. No reconstruir ni modificar el backend dentro de esta tarea sin coordinación.
- Inspeccionar archivos y dependencias sin ejecutar comandos Git y conservar cambios del usuario. No instalar paquetes ni generar módulos ajenos al login.

## 3. UI/UX Pro Max

Leer y aplicar `.opencode/skills/ui-ux-pro-max/SKILL.md` para sistema visual, componentes, experiencia, accesibilidad y React/Tailwind.

La skill está instalada. Aunque Python no estaba disponible en la primera planificación, el agente reportó haber consultado su buscador durante la implementación. Revalidar disponibilidad en futuras tareas; no instalar Python automáticamente ni atribuir resultados a búsquedas no ejecutadas.

El agente define componentes, colores complementarios, tipografía y recursos visuales. La elección vigente del usuario de sustituir lima por índigo y conservar ambos temas prevalece sobre recomendaciones automáticas.

## 4. Diseño aprobado como dirección

El usuario pidió sustituir lima por una identidad SaaS índigo y después rechazó el panel morado lateral. La dirección actual es centrada, funcional y minimalista, sin bloque de color, tarjeta ni sombra alrededor del formulario. No reconstruir la composición anterior.

| Token | Claro | Oscuro |
| --- | --- | --- |
| Marca / acción principal | `#4F46E5` | `#A5B4FC` |
| Texto de acción principal | `#FFFFFF` | `#1E1B4B` |
| Hover principal | `#4338CA` | `#C7D2FE` |
| Fondo | `#F8FAFC` | `#0F172A` |
| Superficie | `#FFFFFF` | `#1E293B` |
| Superficie secundaria | `#EEF2FF` | `#273449` |
| Texto principal | `#0F172A` | `#F8FAFC` |
| Texto secundario | `#475569` | `#CBD5E1` |
| Borde de campo | `#64748B` | `#94A3B8` |
| Foco | `#4F46E5` | `#A5B4FC` |

- Fuente de colores de interfaz: variables de `src/styles/globals.css`; `tailwind.config.ts` mapea los nombres semánticos. Cambiar solo Tailwind no sincroniza metadatos ni recursos gráficos.
- Formulario máximo 416px, títulos fluidos, cabecera marca/«Contadores», recuperación junto al campo de contraseña, invitación a registro separada y texto auxiliar de conexión.
- El selector sol/luna conserva sistema por defecto y preferencia manual persistida, con selección tonal discreta. Banner superior en flujo, icono neutro y acción de instalación secundaria; nunca un CTA inoperante.
- Labels visibles, autocomplete, pegado, gestores de contraseñas, foco, estados y errores asociados. No aplicar trim a contraseña. Mantener semántica y objetivos táctiles de al menos 44px.
- Monograma N geométrico SVG propio. Cabecera mediante máscara temática, sin placa; favicon/splash/PNG con lavanda sobre fondo uniforme #0F172A. Sin tipografía, imágenes externas ni dependencias nuevas.
- Geometría sincronizada en `public/brand-mark.svg`, `public/favicon.svg`, `public/splash-logo.svg` y path inline de `index.html`. `scripts/generate-icons.mjs` genera los PNG desde **splash-logo.svg**, no desde el favicon.
- Contraste objetivo AA: texto normal 4.5:1; texto grande y controles/foco pertinentes 3:1. Los cálculos y pruebas iniciales son históricos y no certifican toda la interfaz actual. Error/éxito no dependen solo del color.
- Detalles y evolución: [UI-ACCESSIBILITY.md](./UI-ACCESSIBILITY.md).

## 5. Contratos verificados

```http
POST /api/v1/auth/signin
Content-Type: application/json

{ "email": "contador@example.com", "password": "..." }
```

- Correo válido con trim; contraseña entre 8 y 128 caracteres según esquema actual.
- 200: `{ user, session }` de Supabase.
- 400: `{ error: "VALIDATION_ERROR", message, details }`.
- 401: `{ error: "AUTH_SIGNIN_FAILED", message: "Correo o contraseña inválidos." }`.
- `GET /api/v1/auth/me` con Bearer responde `{ user }`.
- Revisar esquemas/controladores/Postman antes de implementar por si cambiaron. Manejar timeout, red, 429 y 5xx; no reintentar signin automáticamente.

## 6. Integración y sesión

1. Incorporar SDK oficial Supabase y validar variables públicas `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_APP_NAME`.
2. Adoptar origen del API como base URL y rutas explícitas `/api/v1/...`, actualizando configuración y ejemplos para evitar prefijos duplicados. Mantener timeout Axios.
3. Enviar credenciales a signin mediante Axios, sin Bearer previo ni logs sensibles.
4. Validar respuesta y entregar `access_token`/`refresh_token` a `supabase.auth.setSession`; SDK es único responsable de persistencia/renovación.
5. Consultar `/auth/me` con token vigente y mostrar bienvenida con identidad real.
6. Restaurar sesión al recargar, con loading inicial y limpieza de listeners. Evitar carreras/duplicación por StrictMode.
7. Diferenciar fallo de red/servidor de sesión rechazada: ofrecer reintento para timeout/5xx sin borrar sesión válida. Token definitivamente inválido conduce a reautenticación, sin bucles de refresh.
8. Logout con SDK, cancelar peticiones y limpiar datos/cache. Manejar fallos de cierre sin afirmar éxito falso ni permitir repoblación por respuestas tardías.

No guardar tokens manualmente o en Query ni implementar refresh paralelo usando `/auth/refresh`. Bearer solo al API configurado, nunca a archivos o servicios externos. No incorporar secret keys. Supabase web y API deben apuntar al mismo proyecto no productivo en pruebas.

El orquestador reporta Auth backend aislado por operación y 27 pruebas aprobadas.
Persiste una limitación: `/me` responde 401 también ante indisponibilidad del
proveedor; el frontend no puede distinguirla de un rechazo de sesión.

## 7. Navegación y archivos

- `/login`: público, usuario autenticado va a `/` tras resolver sesión.
- `/`: bienvenida mínima protegida con usuario y Cerrar sesión. Sin dashboard ficticio.
- Sin sesión: redirigir al login. Mantener página no encontrada y UI PWA pertinente.

Áreas a crear/modificar según convenciones vigentes:

- `src/features/auth/`: API tipada, provider/context/hook, formulario, páginas y guards.
- `src/shared/lib/`: SDK Supabase.
- `src/shared/ui/`: Button, campo, PasswordField, InlineAlert y loading según necesidad.
- `src/shared/theme/`: selector y resolución de tema.
- `src/shared/config/`, `src/vite-env.d.ts`, `.env.example`: configuración pública.
- `src/shared/api/httpClient.ts`: token restringido al API.
- `src/app/providers.tsx`, `src/app/routes.tsx`: composición y rutas.
- `src/styles/globals.css`, `tailwind.config.ts` y punto de inicialización del tema.
- Favicon/iconos PWA y pruebas; README con instrucciones locales.

No crear carpetas vacías para funcionalidades futuras. Ajustar nombres tras inspección.

## 8. Pruebas y aceptación

- Login válido → SDK → `/auth/me` → bienvenida.
- Credenciales inválidas y validación visibles; corregir y reenviar funciona; sin doble envío.
- Recarga conserva sesión; rutas y redirecciones correctas durante carga/inicio/expiración.
- Logout limpia estado y peticiones tardías no repueblan datos.
- Fallos de red/429/5xx recuperables y sin bucles de refresh.
- Claro/oscuro/sistema persistentes, sin flash; contraste y teclado verificados en móvil/escritorio.
- API, callbacks, tokens y documentos excluidos del caché PWA. Shell offline se conserva.
- Solo tras nueva autorización del usuario: ejecutar `npm run lint`, `npm run build`, pruebas funcionales login/temas y `npm run test:pwa` según los cambios. Actualmente estas ejecuciones están suspendidas.
- Mocks para casos de comportamiento y login real con usuario de prueba autorizado y Supabase no productivo. No versionar credenciales ni atribuir a mocks una integración real.

## 9. Orden de trabajo y entrega

1. Leer AGENTS y skill, inspeccionar estado/dependencias/contratos.
2. Mantener tokens índigo, temas y formulario accesible con la composición vigente.
3. Integrar signin/Supabase, sesión, guards, bienvenida y logout.
4. Completar errores, identidad PWA y pruebas.
5. Entregar cambios, checks reales, configuración local y pendientes. Detenerse tras esta entrega y esperar la siguiente indicación.

Sin commit/push, despliegue ni cambios remotos sin autorización.

## 10. Revisión de integración y estructura

Auth implementado y reorganizado siguiendo la referencia San Gabriel:
`api/authApi.ts`, `api/useLogin.ts`, `components`, `pages` (nombre real plural),
`store` y `types/auth.types.ts`. Supabase permanece como único gestor de sesión;
no se copia el JWT propio ni la persistencia manual de la referencia.

Lint/build y 10 pruebas Auth simuladas aprobadas en la entrega de integración.
El bloqueo de configuración se resolvió: el usuario corrigió `VITE_API_BASE_URL`
y confirmó login real funcional. La URL inválida se rechazaba localmente; no
demostraba caída del API. Los agentes no modificaron `.env` ni sus claves.

## 11. Recuperación de contraseña

- `/auth/forgot-password` llama `POST /api/v1/auth/password-reset/request` con `{ email }` y mantiene una respuesta genérica, incluso cuando el correo no existe o el API responde `AUTH_RATE_LIMITED`.
- `/auth/reset-password` adopta enlaces PKCE (`code`) o recovery hash (`access_token`/`refresh_token`) mediante el SDK oficial Supabase. Limpia query/hash antes de continuar y nunca muestra ni persiste tokens o contraseñas.
- La actualización obtiene la sesión vigente desde Supabase en el momento del envío y llama `POST /api/v1/auth/password-reset/update` con Bearer únicamente al API. Tras `204`, cierra la sesión local y ofrece volver a iniciar sesión.
- Estados de validación, carga, éxito, enlace vencido/cancelado, errores de red/429 y validación de contraseña tienen feedback accesible. El marcador de recuperación en `sessionStorage` no contiene tokens y solo permite recuperar el estado de la pantalla después de limpiar la URL.
- Verificación histórica de la entrega de recuperación: 14 pruebas Auth simuladas, incluyendo solicitud/429 sin reintento, hash, limpieza de URL, Bearer al API, enlace inválido y regresiones de login/guards/logout. No certifica envío real de correo ni recuperación con una cuenta autorizada.

## 12. Registro de usuarios

- `/auth/register` consume `POST /api/v1/auth/signup` y adopta la sesión Supabase cuando el API la devuelve.
- Si Supabase exige confirmación de correo y no devuelve sesión, muestra un mensaje genérico y permite volver al login sin revelar información sensible.
- El formulario incluye correo, contraseña, confirmación, checklist accesible y estados de carga/error/rate limit/doble envío.
- La política coordinada para contraseñas nuevas es 8–128 caracteres, mayúscula, minúscula, número y carácter especial. Las letras Unicode se permiten; los espacios no cuentan como carácter especial. Signin mantiene compatibilidad con cuentas antiguas de 8–128.
- Google reutiliza el flujo OAuth existente: una cuenta Google nueva puede registrarse mediante el proveedor y una existente iniciar sesión. No se implementan Microsoft ni LinkedIn.
- Validación frontend/backend completada; falta probar registro real con confirmación de correo y SMTP del proyecto Supabase de cada ambiente.

## 13. Cierre visual y PWA — histórico, sustituido por secciones 15 y 16

- Identidad lima `#D5F454`, claro/oscuro con control sol/luna; sistema por defecto hasta elección manual persistida.
- Banner compacto superior fijo, con icono, título, subtítulo, acción Instalar y cierre. Se muestra como promoción antes de recibir `beforeinstallprompt`; solo habilita instalación cuando puede abrir la confirmación nativa y no reserva espacio para el formulario.
- Sin evento, informa brevemente disponibilidad/desarrollo/HTTPS/plataforma; no simula instalación ni ofrece instrucciones manuales extensas. Oculto en standalone o instalación confirmada; respeta nuevos cierres persistidos.
- Última revisión visual reportada: lint/build correctos, 6 pruebas PWA y 2 de promoción/temas aprobadas. Estos resultados corresponden a ejecuciones distintas de las 10 pruebas Auth, no a una única suite conjunta.
- Manifest/service worker comprobados en preview. El diálogo se verificó mediante eventos sintéticos; el navegador automatizado no emitió el evento nativo. El usuario después confirmó sus pruebas satisfactorias sin detallar dispositivos ni instalación nativa.
- Persisten el aviso de bundle superior a 500 kB y la verificación por plataforma de instalación, teclado virtual y safe areas. No bloquean el cierre del alcance visual aceptado.

Esta actualización documental no volvió a ejecutar pruebas ni implica publicación, commits o despliegues.

## 14. Google OAuth — configuración y estado

- `GET /api/v1/auth/oauth/google/url` se consume mediante el cliente versionado como `auth/oauth/google/url`; el cliente no duplica `/api/v1`.
- El botón «Continuar con Google» usa el logotipo oficial multicolor en SVG, estados de carga/error recuperable y foco visible. La URL solo se abre si proviene del origen del API configurado o de un host Google HTTPS permitido.
- `/auth/callback` elimina `code`, errores y tokens hash de la barra de direcciones antes del trabajo asíncrono. Adopta `?code=` con `exchangeCodeForSession` o `access_token`/`refresh_token` con `setSession`; no guarda tokens manualmente. Después deja que el provider valide `/auth/me` y redirige a `/`.
- Para habilitarlo: activar Google en Supabase Authentication → Providers → Google; registrar el Client ID y Client Secret de Google en Supabase. En local usar `http://localhost:5173/auth/callback`; en el ambiente publicado usar `https://nuvorapil.vercel.app/auth/callback` y configurar el mismo valor en `AUTH_REDIRECT_URL` del backend. La recuperación publicada usa `https://nuvorapil.vercel.app/auth/reset-password` en `PASSWORD_RESET_REDIRECT_URL`. El API publicado está en `https://nuvora-api-pil.onrender.com`; el usuario confirmó registro, Google y recuperación reales después de corregir CORS y redirects.
- La integración real requiere un proveedor configurado y una cuenta autorizada. No se considera validada por una respuesta simulada del endpoint ni por la compilación.


## 15. Rediseño y accesibilidad — primera revisión del 2026-11-12

Por solicitud del usuario, la identidad índigo sustituye la lima de la sección 13. El banner vigente es superior **en flujo**, no fijo, como dispone AGENTS.md. Se conserva autenticación/PWA y se rediseñan todas las pantallas existentes mediante el shell y componentes compartidos; no se añaden módulos de negocio.

Decisiones, contraste AA de las parejas comprobadas y límites: [UI-ACCESSIBILITY.md](./UI-ACCESSIBILITY.md). Lint/build correctos; 22 pruebas Auth/contraste/responsive y 6 PWA aprobadas con Chrome como alternativa al Chromium local que falla al arrancar. Capturas de escritorio claro y móvil oscuro inspeccionadas. Continúan pendientes instalación real por SO, Safari/iOS y certificación integral de accesibilidad. El build conserva el aviso de bundle superior a 500 kB.


<a id="continuidad-agentes"></a>

## 16. Continuidad previa al reinicio de workspaces — histórico

### Implementación que se debe conservar

- Eliminación del panel morado lateral y de la tarjeta/sombra del formulario en el shell Auth compartido.
- Monograma N geométrico aplicado a cabecera, favicon, splash HTML e iconos instalables; recursos PNG regenerados. Fondo del splash y de sus iconos igual al manifest: #0F172A, sin recuadro interior.
- Refinamiento del login: medida de 416px, títulos fluidos, encabezado «Tu espacio contable», recuperación junto a contraseña, registro separado y resumen de errores oculto cuando está vacío.
- Cabecera con contexto «Contadores» y divisor neutro; selector sol/luna con selección tonal; promoción PWA de menor peso visual, siempre superior en flujo.
- Reglas de contraseñas compartidas en `types/passwordRules.ts`, alineadas con Unicode y espacios según el schema API; `GoogleMark` en componentes, sin importar la página de login desde registro.

### Archivos para continuar

| Responsabilidad | Archivo |
| --- | --- |
| Composición de acceso y cabecera | `src/features/auth/components/AuthLayout.tsx` |
| Orden de campos, enlaces y mensajes de login | `src/features/auth/pages/LoginPage.tsx` |
| Tokens, medidas, tipografía y estados | `src/styles/globals.css` |
| Mapeo de tokens Tailwind 3.4 | `tailwind.config.ts` |
| Promoción e instalación | `src/shared/pwa/InstallApp.tsx`, `usePwaInstall.ts` |
| Selector y metadatos de tema | `src/shared/theme/ThemeSelector.tsx`, `themeMeta.ts` |
| Colores de navegador/arranque | `src/shared/config/brand.ts`, `public/theme.js`, `index.html` |
| Logo y PNG PWA | SVG de `public/`, `public/icons/`, `scripts/generate-icons.mjs` |
| Recursos precacheados y manifest | `vite.config.ts` |

### Validación y pendientes

1. **No ejecutar pruebas, lint ni build hasta nueva autorización expresa.** Esta restricción reemplaza los pasos generales de verificación. No ejecutar Git ni modificar `.env`/claves. Esta entrega documental no autoriza implementación adicional ni despliegue.
2. Los resultados de la primera revisión fueron 22 pruebas Auth/contraste/responsive, 6 PWA y 1 adicional Unicode; lint/build aprobados entonces, con aviso de bundle ~600 kB. No corresponden a los últimos refinamientos.
3. El PNG del nuevo monograma se inspeccionó como imagen; no se comprobó su render en la cabecera, favicon ni splash de una instalación real. Tampoco se revisó en navegador el último ajuste de proporciones y jerarquía. La configuración temporal para probar con Chrome ya fue retirada.
4. Si se autoriza verificar: revisar claro/oscuro, 320/375/768/1440px, orientación horizontal, títulos largos, foco/teclado, estados de error/carga, banner con/sin prompt y cierre. Verificar la máscara del logo y su inclusión en el shell offline. Después ejecutar los checks pertinentes, registrando resultados nuevos.
5. Instalación/splash reales, Safari/iOS, lectores de pantalla, teclado virtual/safe areas y actualización entre despliegues siguen pendientes. Una PWA instalada puede conservar iconos antiguos hasta una actualización o reinstalación tras publicar.
6. La skill está en `.opencode/skills/ui-ux-pro-max/SKILL.md`. Python se encontró en `C:/Users/agarcia/AppData/Local/Python/pythoncore-3.15-64/python.exe`; es una ruta local orientativa, comprobar disponibilidad sin instalar herramientas automáticamente. Node/npm funcionaron fuera del sandbox; no confundir restricciones de acceso con dependencias ausentes ni eludir aprobaciones.
7. No hay aprobación visual final del usuario sobre el último refinamiento. Recibir su feedback antes de considerarlo cerrado. No añadir por iniciativa propia módulos de cartera, captura, libros o portal; requieren nueva fase y contratos API confirmados.


<a id="workspaces-vigente"></a>

## 17. Perfil y workspaces — fase vigente codex.md

Objetivo: integrar el perfil autenticado, lista, creación y detalle de espacios accesibles con contratos actuales del API, conservando identidad/Auth/PWA. Se revisaron codex.md, handoff, foundation y schemas/controladores del backend. No se modificó el API ni se añadieron módulos financieros.

Decisión visual: zona de trabajo independiente del layout de acceso, lista principal y perfil lateral, composición de una columna en móvil, menú de cuenta con logout/apariencia y diálogo nativo para crear. Estilos locales con paleta/tokens existentes; sin gradientes, dependencias ni cambios de splash/service worker. Una selección solo se presenta como confirmada tras consultar su detalle y rol en el servidor.

Archivos: `src/features/workspace/{api,types,components,pages,utils}`, `workspace.module.css`, `src/app/routes.tsx`, ampliación de iconos SVG y pruebas mockeadas en `tests/auth`. Documentación completa de decisiones, cancelación, estados, límites y resultados: [WORKSPACES.md](./WORKSPACES.md).

Aceptación implementada en código: perfil con nulos/avatar alternativo; lista/vacío; validación 2–160 y slug; creación sin IDs de identidad, doble envío/reintento automático; confirmación y selección; errores seguros; cache keys por usuario/espacio y respuestas tardías descartadas. Esto no equivale a aprobación funcional en navegador.

Playwright no ejecutado: codex.md lo condiciona a autorización expresa. Se dejaron 16 casos nuevos Demo y se adaptaron casos Auth. Pendientes: ejecutar suites cuando se autorice, revisión visual móvil/escritorio y claro/oscuro, integración con API real, SQL/membresías y aislamiento RLS con dos usuarios. No declarar estos puntos completos por pasar lint/build.


Verificación final de esta fase: lint y build aprobados. Bundle principal 632,90 kB / 185,52 kB gzip, con advertencia de tamaño; CSS 29,80 kB / 6,87 kB gzip. Playwright no ejecutado. Sin validación visual, integración real ni RLS certificadas; sin cambios de configuración, dependencias, backend o Git.


<a id="entities-vigente"></a>

## 18. Clientes/entidades — frontend autorizado por codex.md

Implementados listado por espacio confirmado, carga/vacío/error/reintento, creación con legalName/taxId opcional, detalle y edición con canManage. Se consumen GET/POST de la colección y GET/PATCH de detalle ya existentes, sin cambiar ni repetir endpoints del API. No se tocaron backend, SQL, entornos, secretos o Git.

Dirección visual: cartera integrada en el layout actual, tabla/lista adaptable y diálogos nativos con espacio activo visible. Se reutilizan paleta/tokens, tarjetas, estados y controles; no se cambia splash/PWA ni hay estilos globales nuevos. Skill UI/UX Pro Max aplicada para estilo y formularios accesibles.

Contrato NIT: respetar permisos/máscara, mantener/cambiar/quitar explícitos; no enviar un NIT enmascarado o null por un cambio solo de nombre. No usar NIT como autorización/descubrimiento ni validar dígito verificador. El API sigue siendo autoridad.

Detalles de archivos, cancelación, pruebas y límites: [ENTITIES.md](./ENTITIES.md). Se prepararon 24 casos mockeados sin ejecutar Playwright. Pendientes revisión visual, ejecución autorizada de pruebas, integración real y requisitos manuales SQL/RLS del backend. Grants/portal/documentos/libros no forman parte de esta fase.


Cierre de la fase 18: implementación frontend finalizada; lint/build aprobados en revisión final. JS 650,95 kB / 189,88 kB gzip, CSS 33,17 kB / 7,38 kB gzip; aviso de tamaño conservado. 24 casos Demo preparados sin ejecutar Playwright. Sin revisión visual ni validación real del API/RLS certificadas. codex.md actualizado con el cierre y los pendientes; no se autoriza una fase posterior automáticamente.


## Actualización — navegación por rutas, 2026-11-12

La fase de separación por rutas autorizada está implementada. La cartera y detalle ya no se incrustan en inicio; el perfil vive en `/account`. Estado actual, decisiones y límites en [ROUTING.md](ROUTING.md). Los resultados de fases anteriores no validan esta navegación.


## Menú responsive — 2026-11-12

Implementado lateral de escritorio y panel móvil/PWA sobre las rutas existentes. Estado, archivos y límites en [NAVIGATION.md](NAVIGATION.md). No se añadieron módulos futuros.


## Continuidad al recuperar foco — 2026-11-12

Corregido reinicio de auth por eventos repetidos del SDK del mismo usuario verificado. Detalles y límites en [SESSION-CONTINUITY.md](SESSION-CONTINUITY.md).
