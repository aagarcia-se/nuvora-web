# Menú responsive — 2026-11-12

## Alcance finalizado

Lateral de escritorio desde 1024 px; botón y panel lateral modal en móvil/PWA. Espacios lleva al selector y Clientes a la cartera del workspace confirmado. En el detalle se mantiene Clientes activo. Cambiar espacio vuelve al selector, usando la limpieza/cancelación de contexto existente. La ausencia o error de autorización elimina el enlace Clientes y el nombre del espacio del menú.

Solo se muestra navegación disponible. Cuenta, apariencia y logout permanecen en avatar. Se conservan breadcrumbs, rutas y banner de instalación en flujo. Sin nuevas dependencias, endpoints, persistencia del workspace, cambios de service worker/manifest o modificaciones de API.

## Diseño y accesibilidad implementados

Skill local UI/UX Pro Max consultada con `drawer focus keyboard navigation --domain ux`: navegación con teclado, foco visible y foco no oculto. Recomendaciones aplicadas con controles HTML y diálogo nativo, sin roles de menú de aplicación para enlaces de navegación.

El panel cierra por Escape, botón, fondo, enlace o cambio al ancho de escritorio. `aria-expanded`, nombre del diálogo y `aria-current` identifican estado/contexto; el fondo es inerte por `showModal()`. Escape/cierre nativo restaura foco al disparador; navegar enfoca main. Mientras está abierto se bloquea scroll del body y se restaura al cerrar/desmontar. Controles de al menos 44 px, texto largo protegido, safe areas y 100dvh. No se añadieron animaciones.

Estilos locales en `src/features/workspace/navigation.module.css`, identidad índigo y tokens semánticos existentes en ambos temas. `WorkspaceNavigation.tsx` reutiliza contenido en lateral y panel; `WorkspaceLayout.tsx` gestiona el diálogo; `WorkspaceRoutes.tsx` comparte la consulta autorizada del workspace. El API sigue siendo autoridad de permisos.

## Verificación

**Lint aprobado:** `npm run lint`, salida 0. **Build aprobado:** `npm run build`, salida 0, con TypeScript y generación Vite/PWA completados. Bundle principal 656,84 kB (191,12 kB gzip); CSS 38,15 kB (8,16 kB gzip). Se conserva el aviso de chunk superior a 500 kB. Playwright no ejecutado por la restricción vigente de AGENTS/codex. Tres nuevos casos Demo preparados para Escape/foco/navegación, Clientes activo en detalle y ampliación móvil→escritorio; selectores de cambio de espacio acotados a breadcrumbs. No afirmar aprobación de esos casos ni revisión visual real.

Pendiente: revisar escritorio y anchos móviles, temas, nombres largos, teclado/lector de pantalla y PWA instalada en dispositivos reales. No se ejecutó integración real ni se modificó nuvora-api.
