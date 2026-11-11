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

## Desarrollo

### Estado de la entrega

Login por correo/contraseña, sesión, rutas protegidas, bienvenida y logout
implementados. El usuario confirmó login real funcional después de corregir el
origen del API y posteriormente aceptó las pruebas del banner/interfaz. No se
registraron navegador/dispositivo ni una lista detallada de casos manuales.
Registro y Google siguen pendientes. Recuperación de contraseña disponible en `/auth/forgot-password` y `/auth/reset-password`.

La interfaz usa lima `#D5F454`, control sol/luna y banner compacto superior de
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

Esta entrega incluye correo/contraseña, sesión, recuperación, bienvenida y logout.
Signin usa el API; `setSession` del SDK oficial adopta sus tokens y gestiona
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

La identidad lima `#D5F454` usa texto oscuro y superficies neutras cálidas.
Tokens semánticos en `globals.css` y Tailwind 3.4; Inter/sistema sin descargas.
Control sol/luna accesible, sistema por defecto hasta elección manual persistida;
`public/theme.js` aplica el tema antes del render. La dirección lima aprobada
prevalece sobre recomendaciones genéricas de landing.
Layout fluido con safe areas, `100dvh`, controles de 48px y texto de input 16px.
La promoción PWA es fija y superpuesta: no reserva espacio ni cambia la posición
vertical del formulario al aparecer o cerrarse.

El origen configurado en `VITE_API_BASE_URL` se normaliza sin slash final y no debe
incluir `/api/v1`. `src/shared/config/env.ts` define `API_PREFIX` y
`src/shared/api/httpClient.ts` construye el `baseURL` versionado; para cambiar la
versión, actualiza esa constante sin modificar cada endpoint Auth. `/health` queda
fuera de este cliente versionado si se necesita consultar ese endpoint público.

## Verificación y compilación

```sh
npm run lint
npm run build
npm run preview
npm run test:auth
```

`npm run format` aplica Prettier. El build genera `dist/`.
Al desplegar, configurar el hosting para redirigir rutas de la SPA a `index.html`.

## PWA

El banner superior compacto y fijo se muestra como promoción incluso antes de que el
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
El nombre del manifest usa `VITE_APP_NAME` al compilar. La identidad
de instalación es una N oscura sobre lima `#D5F454`.
Los iconos PNG (192, 512, maskable 512 y Apple 180) se versionan en `public/icons`.
Para regenerarlos después de editar `public/favicon.svg`:

```sh
npm run icons:generate
```

Para probar instalación y offline sobre el build real:

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

Pruebas de navegador (Chromium):

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

En la revisión local las tres variables públicas estaban presentes, pero la URL
del API no cumplía el formato de origen previsto y no se pudo alcanzar `/health`
ni `/api/v1/auth/me`. No se modificaron archivos `.env`. El propietario debe
confirmar un origen operativo y CORS para `http://localhost:5173`.
No se probó login real por falta de cuenta autorizada y conectividad; las pruebas
automatizadas usan exclusivamente servicios Demo simulados.

Limitación del contrato actual: `/auth/me` responde 401 tanto ante rechazo de
token como ante indisponibilidad del proveedor. El cliente trata ese 401 como
rechazo y solicita reautenticación; no puede identificar su causa real. Los
errores de red/5xx distinguibles conservan sesión y ofrecen reintento.
