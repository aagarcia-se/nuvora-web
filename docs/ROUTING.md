# Navegación por rutas — 2026-11-12

Objetivo: separar selección de espacio, cartera, detalle y cuenta, manteniendo contexto, permisos y componentes existentes.

## Implementado

| Ruta | Contenido |
| --- | --- |
| `/` | Espacios y diálogo de creación |
| `/workspaces/:workspaceId/clients` | Cartera y diálogo de alta |
| `/workspaces/:workspaceId/clients/:entityId` | Detalle y edición autorizada |
| `/account` | Perfil |

`src/app/WorkspaceRoutes.tsx` compone shell privado, control de acceso al workspace y páginas. `src/app/routes.tsx` registra rutas. El detalle vive en `src/features/entities/pages/EntityDetailPage.tsx`. El componente de diálogo de detalle anterior se reemplazó por esta página; las altas siguen siendo diálogos.

Criterio UI/UX: jerarquía Espacios → Clientes → Detalle, enlaces reales con historial nativo, un encabezado principal por vista, contexto del workspace visible y foco en main al cambiar ruta. Se consultó la skill local UI/UX Pro Max para breadcrumbs y jerarquía de encabezados. No se rediseñaron marca, PWA ni splash.

Acceso: UUID inválido no monta queries del recurso; el detalle del workspace confirma autorización antes del Outlet. El API sigue autorizando cada consulta/escritura. Datos financieros no se almacenan en historial. La edición directa usa la identidad de query del detalle; respuestas de mutaciones descartadas si cambia el contexto o se limpia caché. La navegación por correo/contraseña permite volver a rutas internas conocidas; OAuth conserva retorno al inicio.

## Verificación y límites

**Lint y build aprobados:** `npm run lint` y `npm run build`, con salida 0. TypeScript y generación Vite/PWA completados. Bundle principal 652,57 kB (190,10 kB gzip); CSS 34,01 kB (7,52 kB gzip). Se mantiene el aviso de chunk superior a 500 kB. Playwright no ejecutado por restricción vigente; los casos adaptados y nuevos permanecen pendientes. No se realizó inspección visual en navegador ni integración real del API. Mantener estas limitaciones hasta su validación efectiva. No se modificó nuvora-api, env, dependencias ni se ejecutó Git.

Pendiente de aceptación: probar enlaces directos/recarga, Atrás/Adelante, cuenta, contexto y denegación; comprobar anchos 320–1440 px, teclado y lectores de pantalla; verificar recuperación/Google en su configuración real. Las pantallas no implementan módulos fiscales futuros.


## Menú responsive — 2026-11-12

Implementado lateral de escritorio y panel móvil/PWA sobre las rutas existentes. Estado, archivos y límites en [NAVIGATION.md](NAVIGATION.md). No se añadieron módulos futuros.
