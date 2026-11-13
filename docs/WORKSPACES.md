# Perfil y espacios de trabajo — entrega basada en codex.md

Presentación vigente: [rediseño integral](DESIGN-SYSTEM.md). Listado en una
superficie, búsqueda desde el primer espacio y resumen de resultados; perfil con
identidad horizontal y atributos alineados. Contratos y descubrimiento de contexto
sin cambios. Lint/build aprobados; revisión visual del nuevo diseño pendiente.

## Alcance y diseño

La entrada inicial comparte un descubrimiento autenticado de entidades mediante `GET /api/v1/profile/entities`: solo workspaces conserva esta pantalla; solo entity entra al portal; ambos accesos requieren elección explícita; sin ninguno conserva «Crear espacio». Los errores 401/503 no se interpretan como lista vacía ni abren creación.

Esta fase implementa la guía [codex.md](../codex.md). El propietario eliminó el intento anterior; se construyó el dominio de nuevo desde la base presente, sin recuperar aquellos archivos. Se preservaron Auth, PWA, splash, paleta, tokens, controles y rutas públicas. No hay módulos de clientes, entidades fiscales, invitaciones, documentos, libros ni portal.

Dirección UI/UX: una vista de trabajo SaaS minimalista, distinta del formulario de acceso. Se aplicó `.opencode/skills/ui-ux-pro-max/SKILL.md` con búsquedas locales de sistema SaaS/workspaces, estilo minimalista y foco de diálogos. La propuesta genérica de landing/glassmorphism no correspondía al flujo: se adoptó el resultado Minimalism & Swiss Style, conservando los colores existentes y superficies opacas, sin gradientes ni fuentes externas. No se obtuvo una coincidencia verificada de stack para la búsqueda de cancelación; esa implementación sigue los contratos y APIs existentes, no una recomendación inventada de la skill.

- Cabecera de contexto y menú de cuenta: apariencia y cierre de sesión dentro del menú, sin repetir la cabecera del login. El controlador de tema permanece montado para seguir cambios del sistema.
- Inicio: título, explicación breve y acción «Crear espacio»; lista principal con roles del API y perfil en columna secundaria. Una sola columna en móvil/tablet. Búsqueda local por nombre/identificador cuando hay más de cuatro espacios; no inventa filtros de API.
- Perfil: nombre, correo de la sesión, avatar HTTPS seguro o iniciales, idioma y zona horaria. Perfil 404 no impide usar la cartera de espacios; no se inventa un perfil remoto. Las imágenes no reciben Bearer, omiten referrer y tienen alternativa si fallan.
- Crear: diálogo nativo accesible, nombre, identificador generado editable, validación y confirmación. Escape/cancelación desactivados durante el envío; el borrador permanece al cerrar manualmente. Foco nativo al abrir/cerrar, resumen enlazado y errores asociados a campos.
- Seleccionar: acción explícita y consulta de detalle al servidor; el nombre/rol del contexto solo se muestran como seleccionados después de respuesta correcta. No se promete abrir un módulo que aún no existe. La selección es temporal y se restablece al salir de la página/sesión.
- Estados reales de carga, vacío, error, reintento, permisos, conflicto y éxito. Selección acompañada de texto/check y aria-pressed; no depende solo del color.

## Contratos confirmados

Fuentes: `codex.md`, `../nuvora-api/docs/frontend-handoff.md`, `../nuvora-api/docs/multi-tenant-foundation.md` y schemas/controladores actuales de workspaces/perfil. No se modificó el API.

| Operación | Contrato |
| --- | --- |
| Perfil | `GET /api/v1/profile` → `{ profile }` |
| Lista | `GET /api/v1/workspaces` → `{ workspaces }` |
| Crear | `POST /api/v1/workspaces` con solo `{ name, slug }` → `201 { workspace }` |
| Detalle | `GET /api/v1/workspaces/:workspaceId` → `{ workspace, role }` |

Nombre 2–160 caracteres; identificador 1–160 con minúsculas, números y guiones entre palabras; UUID para detalle. `owner_id` lo decide el API. Nombres/avatares son presentación, no permisos. Un detalle ajeno o revocado responde 404, sin revelar existencia. Mensajes seguros para 400/401/403/404/409/429/503 y red; no se muestran errores internos del proveedor.

## Archivos y estado remoto

- `src/features/workspace/types`: contratos TypeScript.
- `api/workspaceApi.ts`: transporte relativo al Axios configurado, validación de respuestas y errores normalizados. Obtiene sesión con SDK oficial, comprueba usuario y consume AbortSignal antes/después de awaits. Sin refresh paralelo ni acceso a tablas/Storage.
- `api/useWorkspaceQueries.ts`: claves `['workspace', userId, ...]`, detalle también por ID; queries cancelables. Solo se repiten una vez fallos de red/503 en lecturas, nunca mutaciones o rechazos de permisos.
- La creación se cancela al desmontar. También comprueba identidad del objeto Query de la lista antes de escribir resultados: si Auth limpió la caché, rechaza la respuesta incluso antes del desmontaje de React. El provider Auth existente conserva cancelación/limpieza al salir o cambiar sesión.
- `pages/WorkspacePage.tsx`: selección y estado de presentación, sin persistir credenciales ni añadir un gestor global. Remontaje por usuario en `src/app/routes.tsx`; detalle sin observadores se elimina con gcTime 0 al cambiar de contexto.
- `components`: layout, menú de cuenta, avatar, perfil, feedback y diálogo de creación.
- `workspace.module.css`: estilos locales que reutilizan tokens semánticos, sin cambiar `globals.css` ni Tailwind.
- `utils/workspacePresentation.ts`: etiquetas, iniciales, fecha, URL de avatar y validación/generación de identificador.

Cancelar HTTP no revierte una escritura ya aceptada por el servidor. Si falla la red al crear, se informa que no pudo confirmarse y se ofrece actualizar la lista antes de repetir; no hay reintento automático.

## Verificación y límites

`codex.md` solicita lint/build para esta fase; su instrucción específica mantiene Playwright pendiente de autorización expresa. Se preparó `tests/auth/workspace.spec.ts` con 16 casos Demo: perfil, nulos/404, lista/vacío, creación, validación, conflicto, 401/403/503, detalle revocado, foco/Escape, tamaños/oscuro, doble envío y logout desde otra pestaña durante creación. Los casos Auth existentes se adaptaron al nuevo inicio y menú. No se ejecutó Playwright ni se afirma que estas pruebas hayan pasado.

No se validaron visualmente navegador/dispositivos ni integración real del API en esta entrega. RLS real con dos usuarios, SQL manual y metadatos de proveedor siguen pendientes del backend/propietario. No se consultaron secretos, no se modificaron entornos ni se ejecutó Git. Los resultados históricos de otras versiones no prueban esta fase.

Resultados finales de esta fase:

- `npm run lint`: aprobado, sin errores reportados.
- `npm run build`: aprobado; TypeScript y compilación Vite/PWA completados. JavaScript principal 632,90 kB (185,52 kB gzip), CSS 29,80 kB (6,87 kB gzip). Permanece la advertencia de chunk superior a 500 kB; no se alteró el esquema de chunks ni el service worker para ocultarla.
- `npm run test:auth`, `npm run test:pwa` y cualquier ejecución Playwright: no ejecutados por la restricción de codex.md. No hay confirmación funcional/visual de los 16 casos nuevos.
- Fuente y documentación revisadas; sin cambios de `.env`, dependencias, backend, Git ni despliegue.


## Continuidad: entidades/clientes

La fase posterior está en [ENTITIES.md](./ENTITIES.md). El panel se agrega únicamente al confirmar selección de workspace. El transporte de sesión ahora vive en `src/shared/api/authenticatedRequest.ts`; `workspaceApi.ts` conserva aliases/contratos existentes. Seleccionar otro espacio cancela y elimina sus consultas de entidades. Esto amplía la vista de workspaces sin rehacer su fase ni añadir módulos financieros.


## Actualización — navegación por rutas, 2026-11-12

La fase de separación por rutas autorizada está implementada. La cartera y detalle ya no se incrustan en inicio; el perfil vive en `/account`. Estado actual, decisiones y límites en [ROUTING.md](ROUTING.md). Los resultados de fases anteriores no validan esta navegación.
