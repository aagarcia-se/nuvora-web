# Nuvora Web

Base frontend con React, TypeScript, Vite, Tailwind CSS 3.4, Axios y TanStack Query.

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
