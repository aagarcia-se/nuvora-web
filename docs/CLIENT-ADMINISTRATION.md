# Administración del cliente por secciones — 2026-11-12

## Modelo y alcance autorizado

La experiencia del contador respeta la jerarquía **workspace → N clientes/entities
→ N personas por entity**. Una persona accede a la entidad mediante su membresía;
no se incorpora al equipo del workspace por aceptar una invitación. La entity
puede estar asociada a varios espacios según el modelo vigente: esta UI no
impone propiedad exclusiva de un despacho ni convierte el NIT en identidad o permiso.

El propietario autorizó desarrollar la propuesta auditada de emil-design-eng.
Se conserva la paleta, los tokens, la ficha por filas semánticas, las rutas previas,
el transporte y los contratos actuales. UI/UX Pro Max se aplica desde su guía
local ya leída; Python no está disponible y no se instaló. Sin nuevas dependencias,
backend/SQL/env/Git, endpoints, documentos, facturas ni indicadores simulados.

## Experiencia aplicada

| Before                                                            | After                                                                                 | Why                                                                   |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| «Detalle del cliente» como título y nombre en segundo nivel       | Nombre autorizado de la entity como h1 persistente; iniciales y workspace de contexto | Identificar el cliente en cualquier sección                           |
| Datos, personas e invitaciones en una columna larga               | Submenú de Datos del cliente, Personas y accesos e Invitaciones                       | Un destino por tarea, preparado para crecer                           |
| Personas e historial dentro de un panel de compartir              | Páginas con URL propia y lectura al visitarlas                                        | Acceso directo, recarga e historial del navegador                     |
| Invitación aceptada vinculada a membresías cargadas opcionalmente | Invitaciones muestra aceptación; Personas muestra acceso actual                       | No derivar acceso vigente de un hecho histórico                       |
| UUID y fechas en todas las filas                                  | Nombre/rol/estado primero; detalle desplegable por registro                           | Escanear listas con muchas personas sin perder trazabilidad           |
| Una operación compartida para crear y revocar                     | Creación, cada resultado compartible y diálogo de revocación con estado propio        | Cargas y errores locales, sin interferencias entre acciones           |
| URL original en estado padre y copia en hijo                      | URL actual controlada por el propietario del resultado                                | Ocultar, reemplazar y cerrar también eliminan la referencia del padre |
| Edición sin bloqueo de navegación                                 | Confirmación antes de descartar cambios en enlaces y Atrás/Adelante                   | Evitar pérdida accidental del borrador                                |

### Datos del cliente

El nombre y las iniciales permanecen en cabecera; la ficha muestra NIT y acceso.
Las fechas se consultan en Información de registro. Edición contenida en esta
sección, con `canManage`, PATCH de campos cambiados y NIT mantener/cambiar/quitar
conservados. No se prefija un NIT enmascarado.

`EntityDraftGuard` usa `useBlocker` de la versión instalada de React Router para
proteger cambios sin guardar. Se habilitó `createBrowserRouter`/`RouterProvider`
en lugar del wrapper `BrowserRouter`, conservando `AppRoutes`, las rutas previas
y los proveedores de Query/Auth. No se modificó el SDK ni el ciclo de sesión.
La creación del router es estable, fuera del render. No se incorporan loaders ni
acciones remotas del router: los datos continúan en TanStack Query.

El diálogo permite seguir editando o descartar y continuar. Durante un guardado
pendiente no ofrece descartar/salir; se puede permanecer y esperar. Recargar o
cerrar una pestaña con cambios solicita la confirmación nativa mediante
`beforeunload`, sujeta al comportamiento del navegador. Perder permisos desmonta
la sección y su guard; no se bloquea la limpieza de sesión por conservar borradores.

### Personas y accesos

Consulta exclusivamente memberships del contexto confirmado. Filtro inicial de
activos, opciones todos/revocados y búsqueda local por nombre o rol. Incluye
perfiles ausentes con fallback seguro, avatar reutilizado con fallback de imagen,
rol y estado textual. Los identificadores y fechas quedan bajo Detalles del acceso.

Se admiten múltiples personas sin establecer cupos locales. Las cantidades se
refieren al listado cargado y no a un total comercial del servidor. Un vacío
ofrece crear una invitación; un filtro sin coincidencias permite ver todos los
accesos. Revocar identifica cliente, persona y rol, pide confirmación y conserva
historial. Se revalida el detalle de entity y ambos listados después del éxito.

### Invitaciones

Formulario corto con rol y Crear enlace. Solo envía `{ role }`. La respuesta
proporciona copiar y WhatsApp inmediatamente. Enlaces recién creados y registro
histórico permanecen separados. El historial ordena pendientes primero y ofrece
filtros por estado; no consulta memberships para reinterpretar una aceptación.

Los enlaces son estado React efímero, fuera de Query/Mutation cache y storage.
No entran en URLs del submenú, logs ni tracking. Salir de esta sección, cambiar de
cliente/espacio/usuario o perder autorización desmonta el contenido y cancela sus
operaciones. La UI indica copiar antes de salir; la invitación del servidor
sigue existiendo. Cerrar resultado elimina su estado local; Ocultar enlace quita
la URL también en el padre sin revocarla. Rotación sigue siendo explícita y
advertida, y nunca reconstruye un enlace del historial.

401/403/404 en el listado reemplazan el contenido por un estado seguro y destruyen
los resultados anteriores. Revocar una invitación también quita cualquier enlace
local asociado. Los errores de revocación aparecen solo en su diálogo; los de
creación solo en el formulario. Se conserva el tratamiento de resultado incierto:
cancelar HTTP no revierte escrituras ya aceptadas y no dispara reintentos.

## Rutas y permisos

| URL                                                      | Vista              | Condición para consultar                                   |
| -------------------------------------------------------- | ------------------ | ---------------------------------------------------------- |
| `/workspaces/:workspaceId/clients`                       | Cartera            | Workspace confirmado por API                               |
| `/workspaces/:workspaceId/clients/:entityId`             | Datos del cliente  | Entity autorizada por API                                  |
| `/workspaces/:workspaceId/clients/:entityId/people`      | Personas y accesos | Owner/admin del workspace y `entity.permissions.canManage` |
| `/workspaces/:workspaceId/clients/:entityId/invitations` | Invitaciones       | La misma condición administrativa                          |

La URL no autoriza. Las entradas directas a subsecciones administrativas sin la
capacidad requerida muestran un estado de permiso sin montar queries de accesos.
Una subsección desconocida muestra enlace no disponible. La selección y los
estados se reinician al cambiar workspace/entity; las claves existentes incluyen
usuario, workspace y entity. El shell `/client/entities/:entityId` del invitado
permanece independiente y no cambia en esta entrega.

## Componentes

- `EntityDetailPage`: consulta y permiso del cliente, coordinación de secciones y escritura.
- `EntityHeader`: identidad y submenú responsive mediante enlaces y `aria-current`.
- `EntityDataSection` / `EntityForm`: ficha y edición explícita.
- `EntityDraftGuard`: protección del borrador y foco al continuar la edición.
- `EntityMembersPage`: consulta, búsqueda y filtro de memberships.
- `EntityInvitationsPage`: creación, resultados efímeros y listado de invitaciones.
- `AccessIdentity`: avatar/nombre compartidos, sin autorizar mediante identidad.
- `RevokeAccessDialog`: confirmación y operación aislada de revocación.
- `ShareInvitation`: URL controlada y acciones de compartir/rotar/limpiar.
- `useRefreshEntityAccess`: invalidación de queries existentes, sin almacenar enlaces.

El antiguo `EntityAccessPanel` se retiró al distribuir sus responsabilidades.
Se eliminaron sus estilos obsoletos y los de la ficha anterior que ya no se usan.
No se agregó otro sidebar ni animación de navegación. Se conservan foco visible,
diálogos nativos, teclado, safe areas y el tratamiento de movimiento reducido.
Los tres enlaces se adaptan en móvil sin exigir una segunda barra lateral.

## Facturas y aportaciones posteriores

Cuando exista el contrato autorizado, Documentos podrá incorporarse al mismo
submenú. Las facturas pertenecerán a la entity y el colaborador será su autor o
cargador trazable; una persona no es un contenedor separado de facturas. Filtros
por colaborador/período/estado y el vínculo desde una persona se desarrollarán
solo con los contratos y permisos de esa fase. Revocar acceso no se presentará
como eliminación de documentos o autoría. No se implementó ni simuló esa fase.

## Verificación

`npm run lint` terminó sin errores ni avisos; `npm run build` completó TypeScript,
Vite y generación PWA con salida 0. CSS 60,39 kB (11,77 kB gzip), JS principal
764,33 kB (221,16 kB gzip). El data router incorpora soporte para bloquear la
navegación y aumenta el bundle; se conserva el aviso superior a 500 kB.
Se adaptaron los casos Demo de
accesos y el helper de apertura de cliente. Casos nuevos preparados para URLs,
recarga, Atrás, borrador, acceso directo de viewer y múltiples personas con filtros.
No se ejecutó Playwright por instrucción del propietario. No hay nueva validación
visual, integración real del API ni certificación de RLS. La compilación no prueba
el comportamiento real del bloqueo de navegación o la sesión en navegador.
