# Clientes y entidades — fase frontend de codex.md

## Estado vigente de presentación

Cartera y detalle separados por rutas (ver [ROUTING.md](ROUTING.md)). Detalle en `src/features/entities/pages/EntityDetailPage.tsx`: una superficie con cabecera limpia e iniciales, lista semántica de NIT/acceso/fechas, iconos SVG y separadores. Etiqueta/valor en columnas en escritorio y apilados en móvil. Sin cards por dato, badge de acceso ni borde decorativo. Edición conserva permisos, formulario y manejo explícito de NIT; altas siguen en diálogos. Tokens índigo/azul/verde según [PALETTE.md](PALETTE.md).

Última verificación de código: lint/build aprobados. Playwright, validación visual del resultado y API/RLS reales pendientes; ver codex.md para resultados. Las secciones siguientes conservan contratos y antecedentes; la descripción inicial de cartera incrustada queda reemplazada por esta sección.

## Alcance y criterio UX original

Integración únicamente en `nuvora-web` de los contratos ya implementados en el API. No se modificaron endpoints, SQL, configuración del backend ni secretos. Fuentes consultadas en lectura: `codex.md`, handoff/foundation y schemas, controladores y proyección del módulo entities del API.

Se aplicó UI/UX Pro Max desde `.opencode/skills/ui-ux-pro-max/SKILL.md`, con resultados verificados de estilo minimalista y resumen de errores accesible. Se preservan layout, paleta índigo/lavanda, tokens, temas, splash, PWA y componentes previos. La cartera se agrega como sección del espacio seleccionado; no se vuelve a construir el inicio de workspaces ni se introducen módulos futuros. Estilos propios en CSS Module y reutilización de los patrones de tarjeta, feedback y diálogo de workspaces.

Flujo: confirmar espacio → consultar clientes → crear o abrir detalle → editar si el API concede canManage. El espacio activo es visible en la cartera y en cada diálogo. Listado adaptable con búsqueda local por nombre cuando hay más de cuatro clientes, estados de carga/vacío/error y confirmaciones. NIT no es selector de autorización ni se usa como clave de lista.

## Contratos consumidos

| Operación | Contrato existente |
| --- | --- |
| Listar | `GET /api/v1/workspaces/:workspaceId/entities` → `{ entities }` |
| Crear | `POST` en esa colección, solo `{ legalName, taxId? }` → `201 { entity }` |
| Detalle | `GET /api/v1/workspaces/:workspaceId/entities/:entityId` → `{ entity }` |
| Editar | `PATCH` de detalle, solo campos cambiados `{ legalName?, taxId? }`; `taxId: null` quita NIT |

Respuesta: `id`, `kind`, `legal_name`, `created_by`, fechas, `taxId` opcional y `permissions` con `canView`, `canUpload`, `canReview`, `canManage`. Se validan forma y UUID; no se incorporan campos desconocidos al modelo. Solo se listan clientes con canView. El backend conserva toda la autoridad de autorización.

Crear se ofrece según rol owner/admin del detalle de workspace confirmado. Editar depende de canManage del detalle del cliente, no del nombre, avatar, NIT ni de ser propietario de otro espacio. Mensajes seguros para 400/401/403/404/409/429/503/red; el frontend no convierte esos mensajes en una comprobación de permisos real.

## NIT y edición

- Nombre legal: 2–240 caracteres, consistente con el schema existente.
- NIT opcional al crear. Se quitan espacios y se convierte a mayúsculas; formato alfanumérico/guion y 3–64 caracteres, conforme a las restricciones del SQL existente. No se aplica dígito verificador ni comprobación externa/fiscal.
- El NIT se muestra tal como está autorizado por la respuesta. Para lectura se conserva la máscara del servidor; no se reconstruye. Si llega inesperadamente un valor completo con canManage falso, se descarta del modelo de presentación/caché. Esto es defensa de interfaz, no sustituto de protección en el API.
- El formulario de edición empieza con «Mantener NIT». Cambiar o quitar son acciones explícitas. El campo de sustitución comienza vacío; nunca se prefija con un valor enmascarado.
- Cambiar solo el nombre omite taxId. Quitar envía null. El nombre se compara con el valor al abrir edición para no enviar por accidente un nombre que no se cambió durante una actualización en segundo plano.
- No se persisten NIT en localStorage/sessionStorage, URLs, logs o fixtures reales. Solo datos Demo en los casos mockeados.

## Sesión, caché y cancelación

`src/shared/api/authenticatedRequest.ts` extrae el transporte de sesión que antes estaba dentro del módulo workspace, para reutilizarlo con entities: SDK Supabase como única fuente de sesión, comprobación de usuario, AbortSignal y errores normalizados. No intercepta indiscriminadamente URLs ni añade refresh paralelo; Bearer solo en peticiones relativas al Axios configurado. Los exports anteriores de workspace se conservan como alias.

Queries de entidades: `['entities', userId, workspaceId, ...]`, detalle también por entityId. El panel solo se monta tras detalle correcto del espacio. Cambiar espacio cancela y elimina la caché de entidades del usuario antes de cambiar selección; el panel se remonta por usuario/espacio. Queries sin observadores se eliminan con gcTime 0.

Mutaciones sin reintentos automáticos, con guardia de doble envío y cancelación al desmontar. También comparan identidad de la Query de lista antes de escribir resultados para impedir repoblación tras clear de Auth o cambio de contexto. 403/404 al guardar invalidan las lecturas. Rechazo de acceso a cartera desmonta diálogos/borradores; una recuperación posterior no reabre datos anteriores silenciosamente.

Cancelar HTTP no revierte una escritura ya aceptada por el servidor. Ante resultado incierto se pide actualizar antes de repetir; no se declara rollback ni se reintenta automáticamente.

## Archivos

- `src/features/entities/types`, `api`, `components`, `utils`, `entities.module.css`.
- `src/features/workspace/pages/WorkspacePage.tsx`: montaje condicionado, enlace a clientes y limpieza al cambiar espacio.
- `src/shared/api/authenticatedRequest.ts`, `src/shared/utils/identifiers.ts`: reutilización real de transporte y validación UUID.
- `src/features/workspace/api/workspaceApi.ts`: conserva contratos con el transporte compartido.
- `tests/auth/entities.spec.ts`: 24 casos Demo preparados, no ejecutados. Incluyen listado/vacío, creación/NIT opcional, detalle, nombre, cambio/eliminación NIT, máscaras/permisos, validación, errores, cambio de contexto, foco/tamaños, doble envío y respuesta tardía.
- `tests/auth/workspace.spec.ts`: fixture de lista de entidades vacía para los casos que seleccionan espacios.

## Verificación y límites

Resultados finales de esta fase:

- `npm run lint`: aprobado, sin errores en la revisión final.
- `npm run build`: aprobado; TypeScript y Vite/PWA completados. JavaScript principal 650,95 kB / 189,88 kB gzip; CSS 33,17 kB / 7,38 kB gzip. Se conserva la advertencia de tamaño superior a 500 kB.
- Las dos lecturas de ref en render detectadas por lint se corrigieron con un estado inicial estable; el formulario no sobrescribe el nombre durante un refetch.
- Playwright: no ejecutado. Los 24 casos son cobertura preparada, no resultados de ejecución.

No se ejecutó Playwright, respetando codex.md. No hay comprobación funcional/visual actual en navegador ni afirmación de que los 24 casos pasaron. No se certifican API publicado, SQL remoto, RLS real, instalación del sistema operativo, Safari/iOS ni todos los lectores de pantalla.

El propietario debe ejecutar manualmente el SQL pendiente del API según sus instrucciones (incluido 003 después de 001/002) y validar aislamiento con usuarios reales. No se ejecutó SQL remoto ni se implementaron grants, invitaciones, portal, FEL, libros o módulos financieros.


## Actualización — navegación por rutas, 2026-11-12

La fase de separación por rutas autorizada está implementada. La cartera y detalle ya no se incrustan en inicio; el perfil vive en `/account`. Estado actual, decisiones y límites en [ROUTING.md](ROUTING.md). Los resultados de fases anteriores no validan esta navegación.
