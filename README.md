# Nuvora Web

Base frontend con React, TypeScript, Vite, Tailwind CSS 3.4, Axios y TanStack Query.

El producto inicial es **Nuvora Contadores**: gestión de cartera de clientes/NIT,
captura XML/PDF y manual, clasificación con revisión, libros de compras/ventas
y portal básico para clientes. La web/PWA precede a la app móvil; Empresas y
Personal reutilizarán contratos y núcleo de permisos/datos.

Las reglas y fases del frontend están en [AGENTS.md](AGENTS.md). El plan coordinado
está en `../nuvora-api/docs/PLAN.md`. La base de autenticación y seguridad del API
se conserva; los módulos de negocio de esta propuesta aún están por implementar.

## Desarrollo

Requiere Node.js 22.12+ o 24 LTS y npm.

```sh
npm install
npm run dev
```

Abrir http://localhost:5173. Opcionalmente copiar `.env.example` a `.env.local`
y definir `VITE_APP_NAME` y `VITE_API_BASE_URL`. Las variables `VITE_*` son públicas:
no deben contener secretos. El cliente HTTP tiene un timeout de 15 segundos;
configurar la URL antes de conectar endpoints. La pantalla inicial no hace peticiones.

## Estructura

- `src/main.tsx`: punto de entrada con StrictMode y estilos globales.
- `src/App.tsx`: composición de providers y rutas.
- `src/app/providers.tsx`: QueryClientProvider, BrowserRouter y Devtools en desarrollo.
- `src/app/routes.tsx`: rutas, inicialmente inicio y página no encontrada, sin layout.
- `src/features`: futuras funcionalidades, organizadas por `api`, `pages`, `components` y `types` según necesidad.
- `src/shared/api`: instancias compartidas de Axios y QueryClient.
- `src/shared/config`: configuración pública y nombre de marca.
- `src/shared/{lib,ui,utils,theme}`: código reutilizable; carpetas vacías con `.gitkeep`.
- `src/styles/globals.css`: tokens claros/oscuros y estilos reutilizables.

Se conserva el patrón de arquitectura de San Gabriel y su `tailwind.config.ts`.
El color de ejemplo es `brand-600` (`#e11d48`). Las clases `bg-bg`, `bg-surface`,
`text-ink` y `text-muted` usan los tokens de `globals.css`. Para el tema oscuro,
agregar la clase `dark` al elemento `html`. La fuente Inter usa fuentes de sistema
como respaldo; no se descarga ninguna fuente externa.

## Verificación y compilación

```sh
npm run lint
npm run build
npm run preview
```

`npm run format` aplica Prettier. El build genera `dist/`.
Al desplegar, configurar el hosting para redirigir rutas de la SPA a `index.html`.

## PWA

El build incluye manifest, service worker y registro desde `PwaStatus`.
El nombre del manifest usa `VITE_APP_NAME` al compilar. La identidad provisional
de instalación es una N blanca sobre verde esmeralda `#047857`.
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
