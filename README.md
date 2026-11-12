# Nuvora Web

Base frontend con React, TypeScript, Vite, Tailwind CSS 3.4, Axios y TanStack Query.

El producto inicial es **Nuvora Contadores**: gestión de cartera de clientes/NIT,
captura XML/PDF y manual, clasificación con revisión, libros de compras/ventas
y portal básico para clientes. La web/PWA precede a la app móvil; Empresas y
Personal reutilizarán contratos y núcleo de permisos/datos.

Las reglas del frontend están en [AGENTS.md](AGENTS.md) y su plan de implementación
en [docs/PLAN.md](docs/PLAN.md). El plan coordinado
está en `../nuvora-api/docs/PLAN.md`. La base de autenticación y seguridad del API
se conserva; los módulos de negocio de esta propuesta aún están por implementar.

## Continuidad para agentes

Leer [AGENTS.md](AGENTS.md) y la [sección de continuidad del plan](docs/PLAN.md#continuidad-agentes) antes de cambiar código. El estado visual vigente y sus límites están en [UI-ACCESSIBILITY.md](docs/UI-ACCESSIBILITY.md).

**Instrucción vigente:** no ejecutar pruebas, lint ni build hasta nueva autorización del usuario; no ejecutar comandos Git ni modificar entornos/claves sin autorización. Los comandos siguientes son referencia de desarrollo, no autorización de ejecución automática. Los últimos ajustes visuales y de logo todavía no se han validado en navegador ni tienen aceptación visual final confirmada.

## Desarrollo

### Estado de la entrega

Login por correo/contraseña, sesión, rutas protegidas, bienvenida y logout
implementados. El usuario confirmó login real funcional después de corregir el
origen del API y posteriormente aceptó las pruebas del banner/interfaz. No se
registraron navegador/dispositivo ni una lista detallada de casos manuales.
Registro por correo/contraseña está disponible en `/auth/register`, con confirmación de correo cuando el API no devuelve sesión. Google OAuth está disponible mediante `/auth/callback`; recuperación de contraseña disponible en `/auth/forgot-password` y `/auth/reset-password`. El usuario confirmó estos tres flujos en el ambiente publicado después de configurar el API de Render y los redirects HTTPS.

La interfaz usa índigo `#4F46E5` en claro y lavanda `#A5B4FC` en oscuro, control sol/luna y banner compacto superior en flujo de
instalación. El banner puede mostrarse antes de que el navegador permita instalar;
el botón solo se habilita al disponer del prompt nativo. Se respetan cierre e
instalación detectada. Limpiar caché no necesariamente borra preferencias en
localStorage. Para evaluar instalación usar build/preview o HTTPS, no asumir que
el servidor de desarrollo ofrecerá instalación.

Los resultados y límites de verificación están en [docs/PLAN.md](docs/PLAN.md).
No sobrescribir el `.env` ya configurado al seguir las instrucciones para un
entorno nuevo que aparecen a continuación.

Requiere Node.js 22.12+ o 24 LTS y npm.

```sh
npm install
npm run dev
```

Abrir http://localhost:5173. Copiar `.env.example` a `.env.local` y configurar
`VITE_APP_NAME`, `VITE_API_BASE_URL` (origen, sin `/api/v1`),
`VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_...`).
API y SDK deben apuntar al mismo proyecto. Las variables `VITE_*` son públicas;
nunca usar claves secret/service role. Sin configuración válida se muestra el
login deshabilitado. El cliente HTTP tiene un timeout de 15 segundos.

### Google OAuth

Activa Google en Supabase (**Authentication → Providers → Google**) y configura
allí el Client ID y Client Secret autorizados. Registra
`http://localhost:5173/auth/callback` en los redirects permitidos de Supabase y
usa el mismo valor en `AUTH_REDIRECT_URL` del backend (cambia el origen por el
HTTPS del ambiente correspondiente). El frontend obtiene la URL desde
`GET /api/v1/auth/oauth/google/url`; no hace un segundo intercambio ni guarda
tokens manualmente. La prueba real requiere proveedor y cuenta autorizados.

Esta entrega incluye registro e inicio por correo/contraseña, Google, sesión, recuperación, bienvenida y logout.
Signup/signin usan el API; `setSession` del SDK oficial adopta sus tokens y gestiona
persistencia/renovación. `/auth/me` verifica la identidad antes de permitir `/`.
Un fallo recuperable permite reintentar sin borrar sesión; 401 exige acceso
nuevo. Logout usa alcance local (esta sesión), cancela solicitudes y limpia
Query. Si falla, se muestra error y reintento sin declarar cierre exitoso.

## Estructura

- `src/main.tsx`: punto de entrada con StrictMode y estilos globales.
- `src/App.tsx`: composición de providers y rutas.
- `src/app/providers.tsx`: QueryClientProvider, BrowserRouter y Devtools en desarrollo.
- `src/app/routes.tsx`: login público, bienvenida protegida y página no encontrada.
- `src/features/auth/api/authApi.ts`: transporte y errores de autenticación.
- `src/features/auth/api/useLogin.ts`: envío del formulario sin almacenar credenciales en Query.
- `src/features/auth/components`: `ProtectedRoute` y `AuthLayout`.
- `src/features/auth/pages`: login, recuperación, reset y bienvenida (plural como la referencia San Gabriel).
- `src/features/auth/store`: contexto y `AuthProvider`; SDK Supabase mantiene la sesión.
- `src/features/auth/types/auth.types.ts`: interfaces del dominio.
- `src/shared/api`: instancias compartidas de Axios y QueryClient.
- `src/shared/config`: configuración pública y nombre de marca.
- `src/shared/{lib,ui,theme}`: SDK Supabase, componentes y selector de tema.
- `src/styles/globals.css`: tokens claros/oscuros y estilos reutilizables.

La identidad vigente es índigo con neutros slate, acceso centrado sin panel lateral ni tarjeta/sombra y monograma N geométrico. El formulario tiene máximo 416px, títulos fluidos y enlaces agrupados según su función. El selector sol/luna y la promoción PWA son secundarios frente a la acción de acceso.

Los colores de interfaz se cambian en `src/styles/globals.css`, tanto en `:root` como en `.dark`. `tailwind.config.ts` mapea esos tokens; editar solamente Tailwind no actualiza todos los recursos. Para cambiar la marca completa, coordinar además `src/shared/config/brand.ts`, `public/theme.js`, `index.html`, SVG y PNG PWA. Tipografía Inter/sistema sin descargas externas.

Sistema por defecto hasta elección manual persistida; `public/theme.js` aplica el tema antes del render. Layout con safe areas y `100dvh`, campos con texto de 16px y controles táctiles de al menos 44px. La promoción PWA está **en flujo**, por lo que su presencia/cierre puede cambiar la posición del contenido. No restaurar el banner fijo ni el panel morado rechazado por el usuario.

El origen configurado en `VITE_API_BASE_URL` se normaliza sin slash final y no debe
incluir `/api/v1`. `src/shared/config/env.ts` define `API_PREFIX` y
`src/shared/api/httpClient.ts` construye el `baseURL` versionado; para cambiar la
versión, actualiza esa constante sin modificar cada endpoint Auth. `/health` queda
fuera de este cliente versionado si se necesita consultar ese endpoint público.

## Verificación y compilación

Comandos disponibles para cuando el usuario autorice reanudar la validación; actualmente suspendida.

```sh
npm run lint
npm run build
npm run preview
npm run test:auth
```

`npm run format` aplica Prettier. El build genera `dist/`.
Al desplegar, configurar el hosting para redirigir rutas de la SPA a `index.html`.

## Despliegue en Vercel

La configuración versionada en [`vercel.json`](vercel.json) prepara este proyecto
como una SPA Vite:

- build: `npm run build`;
- salida: `dist`;
- fallback de rutas client-side a `/index.html`, incluido `/auth/callback`;
- `/api`, `/health` y archivos con extensión no se reescriben, para no romper
  assets, `manifest.webmanifest` ni `sw.js`;
- `index.html`, `manifest.webmanifest` y `sw.js` se revalidan; los assets hash de
  `/assets` usan caché inmutable.

### Variables públicas de Vercel

Configura para cada ambiente, sin incluir secretos:

```text
VITE_APP_NAME=<nombre público de la aplicación>
VITE_API_BASE_URL=<origen HTTPS del API, sin /api/v1>
VITE_SUPABASE_URL=<URL pública del proyecto Supabase>
VITE_SUPABASE_PUBLISHABLE_KEY=<clave publishable pública de Supabase>
```

Para el ambiente publicado actual, configura en Vercel:

```text
VITE_API_BASE_URL=https://nuvora-api-pil.onrender.com
```

No uses el dominio anterior de Vercel para el API ni agregues `/api` o
`/api/v1`. El API Express está desplegado en Render.

Todas las variables `VITE_*` quedan en el navegador. No configurar claves
secretas, service role ni credenciales de proveedores. Al cambiar una variable,
crea un nuevo deployment porque Vite las incorpora durante el build.

### Redirects, CORS y pasos de producción

Para el ambiente publicado, registra en los redirects permitidos de Supabase:

```text
https://nuvorapil.vercel.app/auth/callback
https://nuvorapil.vercel.app/auth/reset-password
```

En Render configura `AUTH_REDIRECT_URL` y `PASSWORD_RESET_REDIRECT_URL` con esas
URLs. En el API permite por CORS el origen HTTPS final de
Vercel (además de los orígenes locales/staging necesarios), no `/api/v1` ni un
comodín innecesario. `VITE_API_BASE_URL` debe ser solo el origen del API; el
frontend añade `/api/v1`.

Pasos exactos:

1. Importa `nuvora-web` como proyecto Vercel y conserva su raíz.
2. Verifica `npm run build` como comando y `dist` como output (ya están en
   `vercel.json`).
3. Añade las cuatro variables públicas en Preview y Production, sin copiar
   `.env`.
4. Despliega desde Vercel y prueba una ruta interna, `/auth/callback`, el
   manifest y `/sw.js`.
5. Configura el dominio final en Supabase, los redirects en Render y el CORS
   del API; valida registro, login, Google OAuth, recuperación, refresh, logout
   y recarga directa de una ruta interna.

## PWA

El banner superior compacto y en flujo se muestra como promoción incluso antes de que el
navegador ofrezca instalación. El botón solo se habilita al recibir
`beforeinstallprompt`; conserva la confirmación del navegador. Sin evento indica
desarrollo, conexión no segura, iOS/no soporte o disponibilidad pendiente, sin
instrucciones manuales. En `npm run dev` la PWA está deshabilitada: para probarla
usa `npm run build` y `npm run preview` en `http://localhost:4173` con Chrome/Edge.
En un móvil remoto se necesita HTTPS; una IP LAN con HTTP no equivale a localhost.

Cerrar oculta la promoción 14 días con `nuvora-install-promotion-v2-dismissed-at`.
La clave anterior no oculta este nuevo diseño; los nuevos cierres sí se respetan.
Limpiar únicamente la caché no suele borrar localStorage. Standalone e instalación
confirmada durante la sesión ocultan el banner. No existe detección universal de
una PWA previamente instalada desde cualquier pestaña/navegador.

El build incluye manifest, service worker y registro desde `PwaStatus`.
El nombre del manifest usa `VITE_APP_NAME` al compilar. La identidad de instalación es una N geométrica lavanda `#A5B4FC` sobre #0F172A uniforme, coincidente con el fondo del manifest. No incluir una placa morada de otro tono dentro del icono: produciría un recuadro visible durante el splash.

- `public/brand-mark.svg`: símbolo independiente; la cabecera lo usa como máscara y aplica el token de color del tema, sin placa.
- `public/favicon.svg` y `public/splash-logo.svg`: versiones sobre fondo oscuro uniforme.
- `index.html`: mismo trazado SVG inline para el splash HTML antes de React.
- `scripts/generate-icons.mjs`: genera los PNG desde **`public/splash-logo.svg`**.
- `public/icons`: PNG 192, 512, maskable 512 y Apple 180. `vite.config.ts` incluye los recursos de marca en PWA.

Al cambiar la geometría, sincronizar los tres SVG y el path inline de `index.html`; después regenerar los PNG. Al cambiar colores, sincronizar también los metadatos y el arranque. El script gráfico siguiente no ejecuta pruebas ni build:

```sh
npm run icons:generate
```

Cuando se autorice validar, para probar instalación y offline sobre el build real:

```sh
npm run build
npm run preview
```

1. Abre `http://localhost:4173` en Chrome/Edge y espera al aviso de interfaz disponible sin conexión.
2. Usa «Instalar» cuando el navegador lo ofrezca, o su menú de instalación.
   En iOS usa Safari → Compartir → Añadir a pantalla de inicio.
3. Abre la app instalada y verifica el icono y el modo independiente.
4. En DevTools, activa Offline y recarga: el shell estático debe abrir.
   Los datos financieros, XML, API y operaciones requieren internet y no se cachean.
5. Para probar actualizaciones, mantén la pestaña abierta, genera otro build y
   pulsa Update en Application → Service Workers. La app ofrece «Actualizar»;
   solo recarga tras confirmarlo, para evitar perder trabajo.

El service worker está deshabilitado en `npm run dev` para no interferir con HMR.
En producción se necesita HTTPS, despliegue en la raíz `/` y fallback SPA.
Servir `sw.js` e `index.html` con revalidación (`Cache-Control: no-cache`),
y assets con hash con caché inmutable. El hosting debe excluir `/api`, `/health`
y callbacks de autenticación de cualquier fallback offline propio.

Pruebas de navegador (Chromium), solo al reautorizar su ejecución:

```sh
npx playwright install chromium
npm run test:pwa
```

Cubren manifest/iconos, criterios de instalación de Chromium, recarga offline,
exclusión de API del caché y controles de instalación con eventos sintéticos.
La instalación en el sistema operativo, Safari/iOS y el ciclo de actualización
entre dos despliegues requieren la validación manual anterior.

`test:auth` usa API/Supabase simulados con datos Demo y el SDK real, en un
servidor Vite aislado (5174). Cubre login, recarga, logout, errores, temas,
teclado y viewports móviles/tablet/escritorio, incluyendo standalone simulado.
No certifica login real ni teclado virtual, notch o instalación de un dispositivo.
Para integración real se requieren variables públicas y usuario autorizado del
proyecto no productivo; revisar también CORS del API para el origen web.

### Verificación de integración pendiente

La estructura de Auth sigue las responsabilidades de `san-gabriel-app`, leído
como referencia: `api`, `components`, `pages`, `store`, `types`. Se conserva
Supabase en lugar de copiar JWT propio, Zustand, permisos o persistencia manual.

La configuración de origen/CORS/redirects que bloqueó una revisión inicial fue corregida por el propietario, quien confirmó después login, registro, Google y recuperación reales. Esa confirmación histórica no valida todos los dispositivos ni el diseño recién modificado. No modificar `.env` ni usar credenciales reales para reproducir casos automatizados.

Los checks iniciales del rediseño fueron aprobados (22 Auth/contraste/responsive, 6 PWA y 1 Unicode adicional, más lint/build). Se usó Chrome instalado porque Chromium local fallaba al iniciar; la configuración temporal ya fue retirada. Los cambios posteriores de composición, monograma y jerarquía se implementaron sin checks por indicación del usuario. No presentar los resultados anteriores como validación del estado actual. El aviso de bundle ~600 kB, la instalación real por SO y Safari/iOS siguen pendientes.

Limitación del contrato actual: `/auth/me` responde 401 tanto ante rechazo de
token como ante indisponibilidad del proveedor. El cliente trata ese 401 como
rechazo y solicita reautenticación; no puede identificar su causa real. Los
errores de red/5xx distinguibles conservan sesión y ofrecen reintento.
