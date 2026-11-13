# Administración por secciones — 2026-11-12

Estado vigente en [CLIENT-ADMINISTRATION.md](CLIENT-ADMINISTRATION.md). Personas
y accesos e Invitaciones son destinos separados del submenú del cliente y cargan
al visitarlos. Sustituyen el panel/disclosures generales descritos más abajo.
Historial por estado, personas con búsqueda/filtros, trazabilidad desplegable y
revocaciones con confirmación. Invitación aceptada no implica membresía activa.
Crear envía solo `{ role }`; resultado compartible inmediato. URL controlada por
un único propietario en memoria; cerrar resultado, salir de Invitaciones o perder
el contexto destruye enlaces locales sin revocar por ello el registro remoto.

---

# Estado anterior — rediseño de experiencia, 2026-11-12

Ver [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md). Compartir sigue visible de entrada;
cerrar el panel desmonta los enlaces efímeros como antes. Historial y personas
empiezan cerrados y consultan al desplegar. La etiqueta del selector de rol es
«Permiso del enlace». Colores de estado mediante `data-state`, confirmaciones
destructivas y botones con estado de carga estable. Contratos/link-only, memoria
efímera, permisos y continuidad OAuth intactos. Casos Demo preparados, no ejecutados.

---

# Actualización vigente — identidad visible en accesos, 2026-11-12

## Identidad visible en membresías e invitaciones

El panel consume las proyecciones visuales nuevas sin usarlas para autorizar:

```text
GET /api/v1/workspaces/:workspaceId/entities/:entityId/memberships
→ { memberships: [{ ..., user: { id, display_name, avatar_url } | null }] }

GET /api/v1/workspaces/:workspaceId/entities/:entityId/invitations?limit=100
→ { invitations: [{ ..., accepted_by, accepted_by_profile: { id, display_name, avatar_url } | null }] }
```

Los nombres se muestran como encabezado, con avatar o iniciales; cuando faltan
se usa “Usuario sin nombre” y el UUID queda como dato secundario de trazabilidad.
Las invitaciones pending/expired/revoked sin aceptación no muestran una persona.
Para una aceptación con perfil ausente o campos nulos se conserva el identificador
y se usa el fallback seguro. El parser no conserva emails, tokens, hashes ni NIT.
El backend normaliza avatares inválidos a `null` y el frontend solo presenta
URLs HTTP(S).

El panel mantiene roles, estado textual con icono, ingreso y revocación. Las
acciones de revocación siguen siendo danger, requieren confirmación y restauran
el foco al botón que las abrió. Diseño compacto, responsive, claro/oscuro y sin
cards por fila. No se declara validación visual ni integración real.

Los fixtures Demo cubren perfil presente, ausente/nulo, avatar inválido,
invitación aceptada y pending. No se ejecutó Playwright.

---

## Listado y revocación de invitaciones

`EntityAccessPanel` consulta al abrir el panel:

```text
GET /api/v1/workspaces/:workspaceId/entities/:entityId/invitations?limit=100
```

La respuesta se valida sin aceptar tokens, `acceptUrl`, correo o hashes. El
historial muestra `pending`, `accepted`, `expired` y `revoked`, fechas, rol,
`accepted_by` y datos de revocación. Una invitación pendiente vencida puede
llegar proyectada por el API como `expired`; la web no muta ese estado.

Las invitaciones pendientes se pueden revocar con:

```text
PATCH /api/v1/workspaces/:workspaceId/entities/:entityId/invitations/:invitationId/revoke
```

La acción es roja/danger, requiere confirmación accesible y conserva el
historial. Tras revocar se invalidan invitaciones y membresías del contexto.
401/403/404/410/429/503 se muestran mediante mensajes seguros y con reintento
explícito donde aplica; no hay reintentos automáticos de mutaciones.

La lista histórica usa Query con clave aislada por usuario, workspace, entity y
límite; se cancela al desmontar/cambiar identidad y el logout limpia la caché.
Los enlaces recién creados continúan fuera de Query, únicamente en memoria de la
visita, para que copiar/WhatsApp siga funcionando sin convertir el historial en
un almacén de secretos.

La interfaz usa disclosures nativos compactos para historial y personas, estados
de carga/vacío/error/reintento, botones con foco y etiquetas, y tokens actuales
en claro/oscuro. La invitación aceptada se relaciona visualmente con una
membresía cuando `accepted_by` coincide con `user_id`; no se inventan nombres ni
correos. Una invitación aceptada sin una membresía visible se presenta como tal,
sin afirmar acceso activo.

Archivos principales: `access.types.ts`, `accessApi.ts`, `useAccess.ts`,
`EntityAccessPanel.tsx`, `access.module.css`, `Button.tsx` y los tokens
existentes de `globals.css`. Los casos Demo existentes cubren compartir,
aceptación y revocación; `tests/auth/access.spec.ts` ahora mockea el GET/PATCH
del historial. No se ejecutó Playwright. La verificación autorizada de
esta fase queda limitada a lint y build. Resultado real: `npm run lint` y
`npm run build` finalizaron correctamente; build generó JS de 695.38 kB y
conserva el aviso existente de chunk superior a 500 kB. No se hizo validación
visual ni integración real contra el API.

---

# Entrada de cliente aislado

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
