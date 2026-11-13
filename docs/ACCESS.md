# Actualización vigente — entrada de cliente aislado

## Descubrimiento de contexto tras login

La aplicación consulta `GET /api/v1/profile/entities` después de autenticar para
detectar memberships directas activas con `can_view`. Solo workspaces conserva el
flujo de contador; solo entity entra al portal sin crear workspace; ambos muestran
una elección explícita; sin ninguno conserva «Crear espacio». 401/503 y respuestas
vacías tienen estados separados, reintento explícito y limpieza normal de Auth.

POST accept ya redirige a `/client/entities/:entityId?workspaceId=:workspaceId`, sin consultar/workspace_membership ni montar navegación del contador. La consulta de entity está bloqueada para membresía directa por el API actual; detalles exactos y estado real en [CLIENT.md](CLIENT.md). No declarar la lectura real resuelta por pasar build.

Compartir acceso ahora abre selector+Crear enlace de inmediato. Copiar/WhatsApp visibles con iconos; Web Share/ocultar/rotar bajo opciones y membresías en Personas con acceso, consultadas solo al abrir. Colores y seguridad link-only preservados. Las referencias al panel desplegable inicialmente cerrado y a redirección a rutas de contador de la descripción anterior son históricas.

---

# Accesos al cliente — flujo solo por enlace

## Estado vigente — 2026-11-12

Frontend adaptado al cambio de contrato de codex.md. Las invitaciones ya no solicitan destinatario ni utilizan entrega por correo. Solo nuvora-web; sin cambios en nuvora-api, backend, SQL, env, secretos, Git, dependencias o despliegues. Colores, tokens, dark mode, splash, PWA, rutas y composición existentes preservados. No se añadieron pantallas, documentos, IA ni grants adicionales.

## Flujo optimizado

1. Abrir Administrar accesos en el detalle autorizado del cliente.
2. Elegir rol (Solo lectura por defecto) y pulsar Crear enlace.
3. Copiar el enlace devuelto por el API o abrir WhatsApp. Web Share sigue disponible con fallback a copiar.

El POST de creación ya devuelve acceptUrl, por lo que no se llama a share-link ni se pide un segundo clic de generación. Estados de procesamiento, éxito/error y foco en el resultado. La sustitución manual queda bajo Opciones del enlace, con aviso de que invalida el anterior. No se abre WhatsApp ni se envían mensajes automáticamente.

Skill UI/UX Pro Max leída; consulta inicial de progressive disclosure poco pertinente, refinada a `form fewer fields steps --domain ux`. Resultados relevantes: labels asociados y feedback de envío. Decisión de producto: un único selector y acción principal, resultado inmediatamente utilizable y opciones ocasionales separadas. No se cambió el sistema visual.

## Contratos

Todas las rutas usan el prefijo /api/v1 y transporte SDK/Axios existente con Bearer.

| Acción | Ruta y contrato |
| --- | --- |
| Crear | POST workspaces/:workspaceId/entities/:entityId/invitations con `{ role }` exclusivamente |
| Creación: respuesta | `{ invitation: { id, status: "pending", expiresAt, acceptUrl } }` |
| Inspeccionar | GET invitations/:token → status/expiresAt/workspaceId/entityId/role; requiere sesión |
| Aceptar | POST invitations/:token/accept con body vacío; cualquier usuario autenticado, sin email de destinatario |
| Membresías | GET workspaces/:workspaceId/entities/:entityId/memberships |
| Revocar membresía | PATCH workspaces/:workspaceId/entities/:entityId/memberships/:membershipId/revoke |
| Reemplazar enlace | POST workspaces/:workspaceId/entities/:entityId/invitations/:invitationId/share-link |

Roles: client_owner, client_contributor y client_viewer. La creación/admin exige owner/admin del workspace y canManage confirmado; el API autoriza todas las operaciones. Revocar confirma y conserva historial, como antes. No se implementaron otros endpoints o módulos publicados por el API fuera de este cambio.

## Aceptación

Se conserva /invitations/accept: limpieza temprana de URL, token únicamente en memoria, formulario de acceso/registro existente y consulta autenticada del estado. No se solicita ni compara correo de invitación; se muestra la cuenta actual solo para que el usuario sepa con cuál acepta. La confirmación explícita presenta workspace/entity (identificadores devueltos, sin inventar nombres), rol y vencimiento. Ver una invitación no concede acceso.

Pending permite confirmar; expired/revoked/accepted o POST 410 impiden continuar. 401/403/404/409/410/429/503 y red se tratan con mensajes seguros. Solo POST exitoso redirige al contexto devuelto y las rutas existentes vuelven a comprobar acceso. Sin aceptación automática al iniciar sesión.

Google, recuperación o confirmación de una cuenta que abandonan la visita requieren reabrir el enlace original después; no se persiste token para salvar esa transición. La referencia a confirmación por correo corresponde al registro Auth, no a invitaciones ni a una restricción del destinatario.

## Seguridad y límites conservados

- Token y acceptUrl únicamente en estado local/memoria efímera; nunca Query keys/data/Mutation cache, localStorage/sessionStorage, logs, analytics, errores o estado de navegación.
- Create y share-link usan useAccessAction fuera de mutations de Query, sin retries, con AbortSignal y control de respuesta tardía/cambio de identidad. Membresías conservan keys por usuario/workspace/entity y limpieza al cambiar contexto.
- acceptUrl se valida: misma origin, HTTPS salvo localhost, callback esperado y un único token permitido. WhatsApp codifica el mensaje y no envía sin acción del usuario; Web Share cancelado no fuerza copia.
- Advertencia clara: cualquiera con el enlace puede aceptarlo tras autenticarse; compartir solo con la persona a quien se quiere dar acceso. La aceptación concede el rol solo a esa entity, no administración del despacho.
- El listado de invitaciones sigue limitado a las creadas en esta visita porque no hay contrato de listado. Los enlaces locales se descartan al salir/cerrar el panel. Ocultar un enlace de la vista no lo revoca; reemplazarlo invalida el anterior en el servidor.
- Membresías siguen mostrando identificadores de cuenta/rol/estado/fechas, sin nombres o correos inventados.
- PWA/referrer/captura temprana ya existentes no se modificaron. Ningún servicio de entrega por correo forma parte de este flujo.

## Archivos de implementación modificados

- src/features/access/types/access.types.ts
- src/features/access/api/accessApi.ts
- src/features/access/components/EntityAccessPanel.tsx
- src/features/access/components/ShareInvitation.tsx
- src/features/access/pages/InvitationPage.tsx
- src/features/access/access.module.css: retirada regla de entrega obsoleta y ajuste de wrapping de IDs, sin nuevos colores/tokens.
- tests/auth/access.spec.ts: mocks sin destinatario/delivery, URL inmediata sin rotación, roles, cualquier cuenta autenticada, confirmación explícita y ausencia de datos sensibles en almacenamiento/caché.

## Verificación

**Lint y build aprobados (salida 0)**. También aprobó la comprobación de tipos con `npx --no-install tsc --noEmit --module esnext --moduleResolution bundler --target es2022 --lib ES2022,DOM --types node --skipLibCheck tests/auth/access.spec.ts tests/auth/access.fixture.ts`. JS 678,06 kB / 196,86 kB gzip; CSS 43,31 kB / 9,11 kB gzip. Aviso de chunk superior a 500 kB conservado; Playwright NO ejecutado. Las pruebas preparadas no se declaran aprobadas. Pendiente validación visual y uso real con el API desplegado; no se realizaron operaciones remotas, migraciones o envíos reales. Tras este cambio detener el trabajo y esperar otra indicación.
