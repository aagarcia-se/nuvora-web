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

Se conserva /invitations/accept: limpieza temprana de URL, formulario de acceso/registro existente y consulta autenticada del estado. No se solicita ni compara correo de invitación; se muestra la cuenta actual solo para que el usuario sepa con cuál acepta. La confirmación explícita presenta workspace/entity (identificadores devueltos, sin inventar nombres), rol y vencimiento. Ver una invitación no concede acceso.

### Continuidad link-first

Antes de iniciar correo/registro u OAuth, la página de invitación puede escribir un
único sobre en `sessionStorage` (`nuvora.invitation.continuation.v1`) con el token
validado y su hora de creación. Es almacenamiento tab-scoped, con TTL de 10 minutos,
sin datos de usuario, y existe únicamente porque Google navega completamente a
`/auth/callback`. El callback limpia sus parámetros y vuelve a
`/invitations/accept` solo cuando hay un sobre vigente; una entrada normal a
`/login` nunca crea ese contexto. El token se recupera únicamente para consultar la
invitación después de autenticar y nunca se usa como permiso local.

El sobre se elimina al aceptar, cancelar definitivamente, cerrar sesión, detectar
estado expirado/revocado/usado o recibir `410`. Un fallo/cancelación de OAuth deja
una acción clara para reintentar o volver a la invitación mientras el TTL siga
vigente; el usuario puede reabrir el enlace original cuando el sobre expire. Este
tradeoff limita la exposición a una pestaña y una ventana breve, pero
`sessionStorage` sigue siendo accesible a JavaScript de esa pestaña: no sustituye
HTTPS, CSP ni la validación del bearer token por el API.

Pending permite confirmar; expired/revoked/accepted o POST 410 impiden continuar. 401/403/404/409/410/429/503 y red se tratan con mensajes seguros. Solo POST exitoso redirige al contexto devuelto y las rutas existentes vuelven a comprobar acceso. Sin aceptación automática al iniciar sesión.

Google regresa automáticamente al callback de invitación. Recuperación o confirmación de correo que abandone la visita puede requerir reabrir el enlace original; la referencia a confirmación por correo corresponde al registro Auth, no a invitaciones ni a una restricción del destinatario.

## Seguridad y límites conservados

- Token y acceptUrl únicamente en estado local/memoria efímera; el token solo usa `sessionStorage` en el sobre temporal de continuidad OAuth descrito arriba. Nunca se coloca en Query keys/data/Mutation cache, localStorage, cookies, logs, analytics, breadcrumbs, errores ni URLs de tracking.
- Create y share-link usan useAccessAction fuera de mutations de Query, sin retries, con AbortSignal y control de respuesta tardía/cambio de identidad. Membresías conservan keys por usuario/workspace/entity y limpieza al cambiar contexto.
- acceptUrl se valida: misma origin, HTTPS salvo localhost, callback esperado y un único token permitido. WhatsApp codifica el mensaje y no envía sin acción del usuario; Web Share cancelado no fuerza copia.
- Advertencia clara: cualquiera con el enlace puede aceptarlo tras autenticarse; compartir solo con la persona a quien se quiere dar acceso. La aceptación concede el rol solo a esa entity, no administración del despacho.
- El listado de invitaciones sigue limitado a las creadas en esta visita porque no hay contrato de listado. Los enlaces locales se descartan al salir/cerrar el panel. Ocultar un enlace de la vista no lo revoca; reemplazarlo invalida el anterior en el servidor.
- Membresías siguen mostrando identificadores de cuenta/rol/estado/fechas, sin nombres o correos inventados.
- El panel del contador distingue `Invitación aceptada · Acceso activo`,
  `Acceso activo` y `Acceso revocado`, y conserva la acción de revocar con
  confirmación. El listado sigue siendo de membresías aceptadas; no se presenta
  una invitación pendiente como aceptada.
- PWA/referrer/captura temprana ya existentes no se modificaron. Ningún servicio de entrega por correo forma parte de este flujo.

## Archivos de implementación modificados

- src/features/access/types/access.types.ts
- src/features/access/api/accessApi.ts
- src/features/access/components/EntityAccessPanel.tsx
- src/features/access/components/ShareInvitation.tsx
- src/features/access/pages/InvitationPage.tsx
- src/features/access/invitationToken.ts: captura temprana, validación, TTL y continuidad OAuth tab-scoped
- src/features/auth/pages/AuthCallbackPage.tsx: retorno condicional a la invitación y cancelación/reintento
- src/features/auth/pages/LoginPage.tsx y RegisterPage.tsx: preparación explícita de continuidad solo desde invitación
- src/features/access/access.module.css: retirada regla de entrega obsoleta y ajuste de wrapping de IDs, sin nuevos colores/tokens.
- tests/auth/access.spec.ts: mocks sin destinatario/delivery, URL inmediata sin rotación, roles, cualquier cuenta autenticada, confirmación explícita y ausencia de datos sensibles en almacenamiento/caché.

## Verificación

**Verificación de esta corrección:** `npm run lint` y `npm run build` aprobados (salida 0). El build conserva el aviso de chunk principal superior a 500 kB. Las pruebas mockeadas Playwright existentes/adaptadas permanecen sin ejecutar por autorización explícita; no se ejecutó Playwright, no hubo validación visual ni uso real del API. No se realizaron operaciones remotas, migraciones, cambios backend, env, secretos o Git.
