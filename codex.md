# Codex — estado y continuidad de Nuvora Web

Actualizado el 2026-11-13. **Este archivo es la fuente única para determinar qué
se implementó, qué se verificó y qué falta.** La documentación temática anterior
queda como referencia histórica; no es necesario consultarla para continuar el
trabajo. Los bloques de historial al final conservan decisiones y contratos,
pero no reemplazan las secciones vigentes que siguen.

## Índice vigente

- [Base compartida](#base-compartida)
- [Portal de contadores](#portal-de-contadores)
- [Portal de clientes](#portal-de-clientes)
- [Verificación y pendientes compartidos](#verificación-y-pendientes-compartidos)
- [Historial y contratos de referencia](#historial-y-contratos-de-referencia)

## Base compartida

Modelo: espacio/workspace → N clientes/entities → N personas por entidad.
Membresía de entidad no equivale a membresía del despacho; aceptar una invitación
no prueba acceso activo. Los datos financieros pertenecen a la entity, no a una
persona o pantalla. No se impone exclusividad de un despacho sobre una entity.

React 19, TypeScript, Vite, React Router, Tailwind 3.4, Axios y TanStack Query
conservados, sin nuevas dependencias. SDK Supabase gestiona sesión; Query gestiona
datos remotos. Queries por usuario/contexto con cancelación y limpieza de sesión.
Eventos repetidos del mismo usuario verificado no deben desmontar la UI ni vaciar
Query. Data router estable permite useBlocker; no restaurar BrowserRouter sin
preservar la protección de borradores. No hay loaders remotos nuevos del router.

Autenticación, Google, recuperación, logout, perfil de lectura y PWA conservados.
Entrada por profile/entities y workspaces: solo cliente entra a su entidad; con
ambos accesos se elige explícitamente; sin accesos se conserva Crear espacio.
Errores no se interpretan como listas vacías. Identidad, tokens índigo/azul/slate,
temas, safe areas y controles de cuenta conservados. Diseño con emil-design-eng
y guía local UI/UX Pro Max ya leída; no se atribuyen búsquedas a Python ausente.

API es autoridad de permisos. Selección, URL, nombre, avatar, NIT y rol histórico
no autorizan. Sin cambios de backend, SQL, entornos, secretos, Git ni dependencias.
No reintentar automáticamente mutaciones: cancelar HTTP no revierte el servidor.
En futuras entregas actualizar este archivo separando cambios de cada portal,
resultados reales y pendientes; no crear otro documento de continuidad del portal.

## Portal de contadores

### Última entrega — consulta y solicitud de corrección, 2026-11-13

Integrados los contratos nuevos sin cambiar backend, SQL, entornos ni dependencias.
La sección Comprobantes del cliente autorizado vive en
/workspaces/:workspaceId/clients/:entityId/documents; su detalle usa
?document=:documentId. El workspace y la entity se confirman por el API antes de
montar consultas. Se reutilizan listado y detalle completos con rutas del contador,
sin enviar al portal aislado ni ofrecer creación/edición del cliente en este panel.

Solicitar corrección aparece solo en pending_review y con canReview o canManage
de la entity confirmada. Abre un diálogo con observación obligatoria, comprueba
el estado actual y consume POST return-to-draft con { observation }. La respuesta
esperada es needs_correction. El API mantiene la autoridad sobre permisos y
transiciones. Cliente uploader nunca recibe esta acción. No se implementaron
aprobación, rechazo, libros ni borrado físico; approved y rejected se reconocen
únicamente si los devuelve el servidor.

Nuevo EntityPurchaseDocuments; integración en EntityDetailPage, EntityHeader y
WorkspaceRoutes, con breadcrumb, submenú y retorno autenticado seguro. Filtros,
foco y retorno al listado reutilizan la experiencia ya implementada. La jerarquía
mantiene el nombre del cliente como h1 y la consulta como h2.

Estado vigente: administración del despacho y sus clientes. Rutas / para espacios,
/account para perfil de lectura y /workspaces/:workspaceId/clients para cartera.
Menú lateral desde 1024 px y panel modal nativo en móvil; perfil, apariencia y
logout permanecen en el avatar. No se incorporan secciones futuras vacías.

Perfil/workspaces incluyen lectura, búsqueda y alta; cartera incluye búsqueda,
filtro por acceso, alta, detalle y edición. Creación según owner/admin del espacio;
edición por canManage de entity. Workspace confirmado por API antes de consultar
cartera. NIT enmascarado no se reconstruye: mantener/cambiar/quitar explícitos,
PATCH solo de cambios y taxId:null para eliminar. Nunca usar NIT como permiso.

### Modelo y alcance autorizado

La experiencia del contador respeta la jerarquía **workspace → N clientes/entities
→ N personas por entity**. Una persona accede a la entidad mediante su membresía;
no se incorpora al equipo del workspace por aceptar una invitación. La entity
puede estar asociada a varios espacios según el modelo vigente: esta UI no
impone propiedad exclusiva de un despacho ni convierte el NIT en identidad o permiso.

El propietario autorizó desarrollar la propuesta auditada de emil-design-eng.
Se conserva la paleta, los tokens, la ficha por filas semánticas, las rutas previas,
el transporte y los contratos actuales. UI/UX Pro Max se aplica desde su guía
local ya leída; Python no está disponible y no se instaló. Sin nuevas dependencias,
backend/SQL/env/Git, endpoints ni indicadores simulados. El portal del contador incorpora consulta y solicitud de corrección; la captura/edición manual permanece en el portal de clientes. No incorpora aprobación, rechazo ni libros.

### Experiencia aplicada

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

#### Datos del cliente

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

#### Personas y accesos

Consulta exclusivamente memberships del contexto confirmado. Filtro inicial de
activos, opciones todos/revocados y búsqueda local por nombre o rol. Incluye
perfiles ausentes con fallback seguro, avatar reutilizado con fallback de imagen,
rol y estado textual. Los identificadores y fechas quedan bajo Detalles del acceso.

Se admiten múltiples personas sin establecer cupos locales. Las cantidades se
refieren al listado cargado y no a un total comercial del servidor. Un vacío
ofrece crear una invitación; un filtro sin coincidencias permite ver todos los
accesos. Revocar identifica cliente, persona y rol, pide confirmación y conserva
historial. Se revalida el detalle de entity y ambos listados después del éxito.

#### Invitaciones

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

### Rutas y permisos

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
usuario, workspace y entity. El shell del invitado permanece independiente; su estado actual se describe en Portal de clientes.

### Componentes

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

### Comprobantes y aportaciones posteriores

Comprobantes ya está incorporado al submenú para consultar y solicitar correcciones; el seguimiento avanzado por colaborador continúa pendiente. Las facturas pertenecerán a la entity y el colaborador será su autor o
cargador trazable; una persona no es un contenedor separado de facturas. Filtros
por colaborador/período/estado y el vínculo desde una persona se desarrollarán
solo con los contratos y permisos de esa fase. Revocar acceso no se presentará
como eliminación de documentos o autoría. No se implementó ni simuló esa fase.

### Verificación histórica de esta fase (2026-11-12)

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

## Portal de clientes

### Última entrega — ciclo de vida completo en UI, 2026-11-13

Se continuó sobre los tipos, parser y transporte parciales encontrados al comenzar;
no se reconstruyeron entidades ni endpoints. Integrados seis estados y las acciones
discard y return-to-draft con sesión SDK, Bearer y AbortSignal existentes.

| Antes                                            | Después                                                                                       | Motivo                                        |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Nuevos estados con una apariencia común          | Etiquetas textuales: neutro, revisión azul, corrección ámbar, aprobado verde y rechazado rojo | Distinguir estado sin depender solo del color |
| Descarte junto a acciones frecuentes del listado | Sección separada en el detalle y confirmación danger                                          | Evitar retiradas accidentales y saturación    |
| Observación solo parcial                         | Observación en detalle y formulario, con fecha e identificador del revisor cuando existen     | Corregir con contexto, sin inventar nombres   |
| Descartados mezclados en la vista inicial        | Sin descartar por defecto; historial y todos disponibles por filtro                           | No confundir historial con pendientes         |
| Reintento de transición potencialmente ambiguo   | GET del mismo ID antes de cada confirmación y validación del estado devuelto                  | No repetir un POST que el servidor ya aceptó  |

Cliente con canUpload: draft editable/enviable/descartable; needs_correction
muestra observación y permite guardar cambios y reenviar. pending_review,
approved, rejected y discarded son consulta bloqueada. No hay acciones de
aprobar, rechazar ni solicitar corrección en el portal cliente. La observación
se muestra como texto seguro, conserva saltos de línea y ofrece metadatos en
un disclosure; observed_by es identificador, nunca un nombre o correo supuesto.

Descartar solo se ofrece en el detalle de draft, con contexto emisor/importe y
confirmación explícita. Explica la conservación en historial. El diálogo tiene
foco inicial en conservar/cancelar, Escape y restauración de foco al cerrar;
si la transición retira el botón, el resultado accesible recibe foco. Los errores
aparecen dentro del diálogo. Comprobación y escritura bloquean doble envío.
No se usa DELETE ni se simula aprobación contable.

Las acciones comprueban el estado del ID guardado antes del POST. Si ya está en
el destino, actualizan la vista sin repetirlo. Un estado incompatible bloquea
confirmación hasta cerrar y actualizar. Un fallo incierto permite reintento
explícito precedido por GET; no hay reintentos automáticos ni garantía frontend
de idempotencia frente a carreras del servidor. La observación escrita permanece
si falla la operación; no es necesario volver a escribirla.

PATCH envía campos modificados; guardar y enviar conservan el mismo ID. Se
invalidan listado y detalle en transiciones. Para crear/editar/enviar, el detalle
se marca obsoleto sin refetch activo que desmonte el editor entre los dos pasos;
al abrirlo se revalida. Descarte/devolución revalidan el detalle activo. Se
rechazan respuestas cuyo estado no corresponde a la acción. Consultas aisladas
por usuario/workspace/entity/documento y cancelación/limpieza existentes conservadas.

Componentes nuevos: PurchaseStatus, PurchaseObservation y PurchaseLifecycleAction.
PurchaseDiscardDialog conserva confirmación y añade observación para el flujo del
contador; PurchaseDocumentRow prioriza consulta/corrección y deja descarte en el
detalle. Ajustados PurchaseDocumentDetail/List/Documents, ManualPurchaseForm,
usePurchaseEditor, usePurchaseDocuments, mensajes API y CSS local. Paleta/tokens,
temas, responsive, foco y botones existentes conservados. Se aplicó emil-design-eng;
sin animaciones decorativas ni librerías nuevas.

Casos Demo preparados en tests/auth/client-purchases.spec.ts: descarte confirmado,
foco al cancelar, resultado incierto ya aceptado sin repetir POST, historial,
corrección y reenvío sin duplicar, estados bloqueados y devolución del contador
con observación obligatoria. NO ejecutados por restricción de Playwright.
Lint final salida 0 sin errores/avisos y build final salida 0. Cifras actuales
abajo. Visual, API/RLS reales y validación del ciclo con dos usuarios pendientes.

### Antecedente parcial — ciclo de vida de compras manuales, 2026-11-13

Implementado exclusivamente en `nuvora-web` el consumo de los seis estados del
ciclo de vida: `draft`, `pending_review`, `needs_correction`, `approved`,
`rejected` y `discarded`. El parser conserva `review_observation`, `observed_by`
y `observed_at`. La API web añade `discard` y `return-to-draft` con
`AbortSignal`; la UI del cliente solo ofrece descarte para `draft`, con
confirmación explícita, variante danger roja, icono, texto de historial y
restauración de foco. No hay borrado físico.

`needs_correction` muestra la observación, fecha y actor cuando el API los
devuelve, permite editar y guarda el cambio antes de reenviar. `pending_review`,
`approved` y `rejected` son consulta bloqueada; `discarded` permanece visible en
el listado/historial, pero no ofrece acciones ni se presenta como activo. Se
invalidan listado y detalle tras transiciones y se mantienen claves por usuario,
workspace y entity.

Archivos principales: `purchaseDocument.types.ts`, `purchaseDocumentsApi.ts`,
`usePurchaseDocuments.ts`, `PurchaseDocumentDetail.tsx`,
`PurchaseDocumentRow.tsx`, `PurchaseDiscardDialog.tsx`,
`ManualPurchaseForm.tsx`, `usePurchaseEditor.ts` y `client.module.css`.
La interfaz usa tokens actuales, movimiento sutil bajo 300 ms y
foco/teclado/Escape con `prefers-reduced-motion`; no se usó `ui-ux-pro-max` en
esta entrega, por instrucción posterior, y se aplicó `emil-design-eng`.

Verificación real: `npm run lint` salida 0 y `npm run build` salida 0. Build:
CSS 75,10 kB (13,78 kB gzip), JS principal 801,86 kB (230,73 kB gzip), PWA
21 entradas / 889,66 KiB; persiste el aviso de chunk superior a 500 kB.
Playwright no ejecutado. Visual, integración real API/RLS y casos Demo siguen
pendientes.

### Entrega anterior — retorno visible y consulta compacta, 2026-11-13

Tras el reporte del propietario de no encontrar cómo regresar, se ajustó la
navegación del detalle con emil-design-eng. El detalle permanece como pantalla
propia; no se transformó en modal ni se expanden facturas completas en el listado.
Portal del contador sin cambios.

| Antes                                         | Después                                                       | Motivo                                               |
| --------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------- |
| Volver como enlace gris discreto              | Botón secundario visible encima del título                    | Encontrar el retorno inmediatamente                  |
| Único retorno arriba                          | Volver a comprobantes repetido al final                       | Salir sin volver a subir tras leer                   |
| Ver detalle con borde de botón de formulario  | Enlace compacto azul con flecha y área táctil mínima de 44 px | Reducir peso visual en listas sin dificultar tocarlo |
| Filtro y foco se perdían al salir de la lista | Filtro en el coordinador y punto de retorno en memoria        | Continuar revisando desde el mismo registro          |

Al abrir un detalle desde el listado se conserva ID de fila y posición vertical.
Al regresar y terminar la consulta de lista se restituye foco en Ver detalle y
scroll, sin animación, si el registro sigue visible bajo el filtro. Si dejó de
estar disponible no se intenta enfocar otra fila. El estado está limitado al
usuario/workspace/entity montado, sin storage, URL nueva ni datos fiscales en
historial. Recargar el documento o abrirlo directamente no recupera ese contexto:
Volver lleva al listado por defecto. Entrar al registro manual limpia el punto
de retorno. El filtro puede conservarse mientras el coordinador siga montado.
Abrir enlace en otra pestaña no captura el punto de retorno en la pestaña actual.

Cambios en PurchaseDocuments, PurchaseDocumentList, PurchaseDocumentRow,
PurchaseDocumentDetail y client.module.css. Estados hover para ratón, foco visible
y disabled conservados. Sin cambios de API/permisos, backend/SQL, env, Git o
nuevas dependencias. Casos Demo adaptados para ambos retornos, filtro/foco y
recarga; Playwright NO ejecutado. Lint sin errores/avisos y build salida 0.
Visual e integración real pendientes; aviso de bundle >500 kB conservado.

### Entrega anterior — consulta completa de comprobantes, 2026-11-13

Autorizada e implementada la vista de detalle tanto de borradores como enviados a
revisión, aplicando emil-design-eng. Portal del contador sin cambios. Cada fila
del listado ofrece Ver detalle, incluida una cuenta con capacidad solo de lectura.
Es una pantalla propia con enlace Volver a comprobantes, no un modal o formulario
deshabilitado. La confirmación de envío también permite abrir el detalle.

| Antes                                        | Después                                                        | Motivo                               |
| -------------------------------------------- | -------------------------------------------------------------- | ------------------------------------ |
| Listado con emisor, fecha, categoría y total | Ver detalle con toda la captura guardada                       | Consultar sin entrar a editar        |
| Enviados sin vista completa                  | Consulta de borradores y pending_review                        | Mantener acceso al contenido enviado |
| Datos al mismo nivel                         | Cabecera con estado, emisor/receptor, compra y total destacado | Facilitar lectura y comprobación     |
| Registro técnico en contenido principal      | Identificador y fechas en disclosure                           | Conservar trazabilidad sin saturar   |

Ruta canónica: /client/entities/:entityId?workspaceId=:workspaceId&document=:documentId.
UUID validado; document no se combina con draft o view. La whitelist de retorno
al autenticar admite esta variante. Comprobantes permanece como sección activa;
la carga de detalle no necesita consultar previamente el listado. Se reutiliza
GET del comprobante existente, usePurchaseDocument y su parser con comprobación
de usuario/contexto/ID. La URL y el contenido de la lista no autorizan el detalle.
Query por usuario/workspace/entity/documento, cancelación y manejo seguro de errores
conservados. No se inventaron endpoints ni se cambió backend/SQL.

Contenido: tipo, fecha del comprobante, estado, nombre y NIT del emisor (No registrado
si está ausente), nombre y NIT capturado del receptor, descripción completa con
saltos de línea, categoría, total exacto y moneda GTQ. Información del registro
incluye ID, creado y última actualización, con horarios de Guatemala. No se
muestran impuestos, serie, número o partidas inexistentes en el contrato, ni se
presenta la captura como una factura fiscal verificada.

Borrador muestra Editar borrador solo con canUpload; pending_review es consulta
sin edición y explica que revisión no significa aprobación. Estados carga,
401/403/404/red/servicio, reintento y retorno al listado. Un fallo del GET oculta
el documento incluso si había datos previos; no se usa la fila como fallback de
autorización. Foco programático al título tras cargar; enlaces reales, labels,
contraste por tokens, iconos SVG existentes y distribución móvil de una columna.
Sin animaciones decorativas ni nuevas dependencias.

Archivos: PurchaseDocumentDetail nuevo; integración en PurchaseDocuments,
PurchaseDocumentList, PurchaseDocumentRow y ManualPurchaseForm; validación en
ClientEntityPage y returnPath; estilos locales en client.module.css.
Casos Demo preparados en tests/auth/client-purchases.spec.ts para ambos estados,
recarga, retorno, lectura sin edición, errores del GET y respuesta de otra entidad.
NO Playwright ejecutado. Lint sin errores/avisos y build salida 0; tamaños actuales
en Verificación y pendientes compartidos. Visual y API/RLS reales pendientes.

### Entrega anterior — composición documental del formulario, 2026-11-13

Propuesta de diseño autorizada e implementada con emil-design-eng. Cambios
acotados a ManualPurchaseForm.tsx y client.module.css; el portal del contador
no cambió en esta entrega. Conservados campos, contratos, capacidades, validación,
guardado, envío, recuperación por ID y protección del borrador.

| Antes                                                   | Después                                                              | Motivo                                               |
| ------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------- |
| Grupos con peso visual similar                          | Cabecera documental compacta e iconos discretos en encabezados       | Reconocer la estructura de captura                   |
| Descripción dentro de Emisor y categoría en Comprobante | Detalle de la compra con descripción y categoría                     | Agrupar datos relacionados                           |
| Total al inicio como campo común                        | Bloque neutro de importe al cierre, cifras más grandes y GTQ visible | Facilitar comprobación del importe                   |
| Receptor solo con nombre                                | Nombre y NIT capturado o C/F en resumen, con desplegable             | Revisar el dato sin abrir campos secundarios         |
| Formulario uniforme                                     | Superficie con sombra existente, separadores y espaciado consistente | Mejorar jerarquía sin introducir colores arbitrarios |

Orden actual: Datos del comprobante → Emisor → Detalle de la compra → Importe →
Receptor secundario → Guardar borrador / Enviar a revisión. En escritorio,
descripción y categoría comparten fila y el importe tiene composición en dos
columnas; en móvil pasan a una columna. Labels, IDs y mensajes por campo
conservados. No se agregaron campos fiscales, cálculos, numeración ni sellos.

Color: tokens existentes, índigo para acción principal y foco; acento azul discreto
en identificación del documento y neutros para el bloque de importe. Iconos SVG
existentes, decorativos y sin sustituir etiquetas. Borrador secundario y envío
principal con flecha. Hover solo para ratón; estados focus/error/disabled y feedback
de botones existentes conservados. Sin nuevas animaciones de entrada o escritura.
El NIT mostrado es dato capturado, no NIT derivado ni verificado de la entidad.

Verificación después del formateo: lint sin errores/avisos y build con salida 0.
Cifras en Verificación y pendientes compartidos. No se ejecutó Playwright;
revisión visual en navegador y dispositivos, temas, foco e integración API/RLS
siguen pendientes. No se declara aceptación visual por compilar correctamente.

### Entrega y criterio

Reorganizado el portal aislado existente con emil-design-eng. La tarea principal
es registrar una factura de compra; los comprobantes guardados tienen una vista
propia y la información del acceso queda en un disclosure secundario. Se conserva
el nombre autorizado de la empresa junto a la navegación. No se añadieron módulos
futuros, botones de foto/galería inoperantes ni promesas de extracción con IA.

| Antes                                      | Después                                                         | Motivo                                        |
| ------------------------------------------ | --------------------------------------------------------------- | --------------------------------------------- |
| Identidad y acceso dominaban la entrada    | Contexto compacto y formulario como contenido principal         | Empezar la tarea sin buscar la acción         |
| Formulario y listado en una misma pantalla | Registrar factura / Comprobantes                                | Separar captura y seguimiento                 |
| Captura en un componente extenso           | Grupos de comprobante, emisor y receptor secundario             | Reducir carga visual conservando los campos   |
| Error después de guardar y enviar          | Borrador conservado y consulta del mismo ID antes del reintento | Evitar crear otra factura al repetir el envío |

### Rutas y permisos

- `/client/entities/:entityId?workspaceId=:workspaceId`: registro manual cuando
  `permissions.canUpload` lo permite; consulta de comprobantes en caso contrario.
- La misma ruta con `&view=documents`: listado, filtros locales de estado y actualización explícita.
- La misma ruta con `&draft=:documentId`: GET autorizado del borrador y edición.
- UUIDs y combinaciones de parámetros se validan. El destino de login admite estas
  variantes canónicas; los IDs no conceden permisos.

La entrada sigue usando `GET /api/v1/profile/entities`; no consulta ni crea una
membresía del workspace. La capacidad proyectada por el API manda sobre el nombre
del rol. Las operaciones conservan los cinco endpoints `purchase-documents` ya
integrados, con queries por usuario/workspace/entity/documento y cancelación.
El parser rechaza respuestas de otro contexto o ID. No se cambiaron contratos,
backend, SQL, entornos, dependencias ni Git.

### Captura y recuperación

Factura es el tipo inicial; se conservan recibo, recibo de servicio y comprobante
de pago. Fecha inicial en America/Guatemala, moneda GTQ, total decimal enviado como
string y representación mediante enteros/decimales sin cálculos monetarios con float.
Validación por campo, foco en el primer error al intentar guardar/enviar y bloqueo
de doble envío durante toda la operación.

Guardar conserva un borrador. Enviar guarda si es necesario y solicita revisión:
`pending_review` nunca significa aprobado. El ID se conserva antes del segundo
paso. Si falla el envío, el reintento explícito consulta ese ID: solo vuelve a
enviar si continúa como borrador. Si ya fue recibido, muestra éxito sin repetir
el POST; advierte si quedaron cambios posteriores sin guardar. Un guardado con
resultado incierto bloquea nuevas escrituras y dirige a revisar/actualizar la lista.
No hay reintentos automáticos de mutaciones ni garantía de idempotencia del servidor.

Los cambios sin guardar y las operaciones pendientes bloquean la navegación SPA;
recargar/cerrar usa el aviso nativo. Un borrador ya guardado puede reabrirse desde
Comprobantes. Los enviados no se editan desde este formulario. Carga, vacío, error,
éxito, sesión inválida y ausencia de permisos tienen respuestas explícitas.

El receptor comienza con el nombre autorizado y C/F. El NIT es dato de captura,
no derivación autorizada del NIT de la entidad. El requisito coordinado pendiente
de codex.md sigue vigente: no desenmascarar ni afirmar autocompletado fiscal.

### Componentes

En `src/features/client/`: `ClientEntityPage` valida contexto; `ClientLayout`
conserva cuenta/PWA; `ClientEntityContext`, `ClientAccessDetails` y
`ClientAccessState` separan contexto y acceso. `PurchaseDocuments` coordina vistas;
`ManualPurchaseForm` y `usePurchaseEditor` gestionan captura;
`PurchaseDocumentList`/`PurchaseDocumentRow` presentan seguimiento y acciones;
`PurchaseDraftGuard` protege cambios. `purchasePresentation` agrupa validación,
normalización, fechas y formato monetario. Estilos locales usan tokens existentes,
foco visible, grupos responsive y estados sin animación decorativa.

### Verificación y límites

Resultados finales de lint/build en Verificación y pendientes compartidos de este documento.
Casos Demo preparados en `tests/auth/client-purchases.spec.ts`: entrada manual,
carga diferida, reintento con y sin aceptación previa, validación, bloqueo de
navegación y lectura sin captura. Se adaptaron selectores de las suites de cliente
y aceptación. **Playwright no ejecutado** por restricción vigente.

Revisión visual en navegador/dispositivos, teclado y temas e integración API/RLS
con dos usuarios pendientes. Build no certifica esas pruebas. XML/PDF, cámara,
galería, IA, aprobaciones, libros y trazabilidad por colaborador en el panel del
contador quedan para contratos/fases posteriores. No se simularon resultados.

## Verificación y pendientes compartidos

Última verificación de código: integración del ciclo de vida en ambos portales,
2026-11-13. Lint/build ejecutados después de los cambios de integración y UI.
La actualización posterior de este archivo no repitió checks de código.

| Comprobación  | Resultado registrado                                              |
| ------------- | ----------------------------------------------------------------- |
| npm run lint  | Salida 0, sin errores ni avisos                                   |
| npm run build | Salida 0; TypeScript, Vite y generación PWA completos             |
| CSS           | 76,23 kB; 13,94 kB gzip                                           |
| JS principal  | 808,16 kB; 232,13 kB gzip                                         |
| PWA           | 21 entradas; 896,92 KiB; generación no certifica instalación real |
| Bundle        | Aviso de chunk superior a 500 kB pendiente                        |
| Playwright    | NO ejecutado; test:auth y test:pwa no autorizados                 |
| Visual        | Pendiente en móvil/escritorio, claro/oscuro, teclado y foco       |
| API/RLS       | Integración real y aislamiento con dos usuarios pendientes        |

Casos Demo del contador preparados para rutas directas, recarga, Atrás/Adelante,
borrador, viewer y múltiples personas. Casos del cliente en
tests/auth/client-purchases.spec.ts cubren entrada manual, carga diferida,
reintento con/sin aceptación previa, validación, protección del borrador y lectura
sin captura; suites de aceptación/cliente adaptadas. Preparados no significa aprobados.

Pendientes del contador: ampliar la consulta de documentos con autoría y filtros por
colaborador/período/estado, aprobación y libros, sujetos a contratos autorizados.
Pendientes del cliente: foto, galería/computadora, extracción/IA y XML/PDF;
no se implementaron ni se simulan como disponibles. NIT del receptor sigue sin
derivación segura desde backend; no desenmascararlo ni declarar completado ese
requisito. No comenzar esa integración solo por estar documentada.

Comprobar navegación, recuperación ante red incierta, sesión/permisos, revocación
y aislamiento reales cuando se autoricen esas verificaciones. Revalidar instalación,
actualización y shell offline PWA en dispositivos. Evaluar división de bundle en
una tarea de rendimiento. El build no certifica ninguno de esos comportamientos.

## Historial y contratos de referencia

Los cierres siguientes se conservan íntegros como antecedentes. Sus títulos
«vigente», restricciones de fase, cifras y bloqueos describen su momento; las
secciones anteriores prevalecen para el estado actual. La antigua referencia
CLIENT-PORTAL fue absorbida aquí y su archivo se eliminó por solicitud del propietario.

# Último cierre — portal del cliente centrado en captura, 2026-11-13

Implementada la reorganización autorizada de ClientEntityPage y sus componentes:
Registrar factura como entrada principal, Comprobantes como vista independiente,
empresa activa compacta e información de acceso secundaria. Formulario agrupado,
borradores reabribles por URL, validaciones por campo y protección de cambios.
El envío conserva el ID guardado y consulta su estado antes del reintento explícito;
un guardado incierto exige revisar la lista. Permisos por canUpload del API.
Se conservaron los cinco endpoints existentes y el aislamiento por contexto.
No se implementaron fotos, galería, IA, aprobaciones ni funciones del contador.
El autocompletado fiscal del receptor descrito más abajo continúa pendiente.

Resultado final: npm run lint y npm run build con salida 0. CSS 68,77 kB
(12,86 gzip); JS principal 787,92 kB (227,60 gzip); PWA generada, 21 entradas,
869,86 KiB. Persiste el aviso de chunk superior a 500 kB.
Casos Demo nuevos preparados y selectores anteriores adaptados; Playwright NO
se ejecutó. Revisión visual e integración API/RLS pendientes. Sin cambios de
backend/SQL, entornos, dependencias ni Git.

Detalle, decisiones, archivos y límites: [Portal de clientes](#portal-de-clientes).
Este cierre sustituye las descripciones históricas de la presentación del portal.

# Estado vigente — administración del cliente por secciones, 2026-11-12

## Captura manual de compras — entrega frontend, 2026-11-12

Integrada exclusivamente en el portal aislado la primera captura manual contra
los cinco endpoints `purchase-documents`. La pantalla lista `draft` y
`pending_review`; `can_upload` puede crear/editar borradores y enviar explícitamente
a revisión, mientras `client_viewer` solo consulta. Campos: tipo, fecha,
emisor/NIT opcional, receptor/NIT con `C/F` inicial, nombre de entity,
descripción, categoría, total decimal como string y GTQ. No se incluyen
aprobación, SAT, libros, pagos ni campos avanzados.

Tipos, parser, API, hooks y componentes viven en `src/features/client/`. Las
queries se indexan por usuario/workspace/entity; mutaciones no se reintentan,
abortan al desmontar y revalidan el scope tras guardar/editar/enviar. Se
ejecutaron `npm run lint` y `npm run build` con salida 0; build conserva el aviso
de chunk mayor a 500 kB. No se ejecutó Playwright ni se declara validación visual
o integración real.

## Autocompletado del receptor en compras manuales — pendiente coordinado

La entity del cliente tiene nombre y puede tener NIT en el backend. Sin embargo,
el contrato actual de `purchase-documents` todavía no deriva el NIT del receptor
desde `entity_tax_identifiers`: acepta el valor enviado por el cliente y solo
normaliza un valor vacío a `C/F`. El frontend no debe asumir que puede obtener o
revelar el NIT completo de una cuenta cliente.

Cuando se autorice la siguiente tarea de integración, el flujo debe ser:

```text
entity autorizada
→ nombre de entity para receiver_name
→ backend busca su NIT autorizado
→ receiver_tax_id = NIT de la entity o C/F si no existe
```

### Instrucciones para el futuro trabajo frontend

- Autocompletar `receiver_name` con el nombre autorizado de la entity.
- Mostrar el NIT como dato informativo enmascarado o `C/F`; no intentar
  desenmascararlo desde el frontend.
- No usar el NIT como autorización ni enviarlo como autoridad de permisos.
- No permitir cambiar el `entityId` para seleccionar otra empresa.
- Mantener `C/F` cuando la entity no tenga NIT.
- Si el API continúa aceptando un NIT enviado por el navegador, tratarlo solo
  como dato de captura; la validación/derivación final debe pertenecer al
  backend.
- No declarar este autocompletado completo hasta que el backend derive de forma
  segura el NIT de la entity receptora y documente el contrato.

No iniciar todavía esta implementación frontend; esta sección registra el
requisito y el bloqueo exacto para la próxima tarea autorizada.

## Contrato frontend — compras manuales

El backend ya expone estos endpoints para consultar compras de la entity
autorizada. Todas las rutas usan el prefijo `/api/v1` y Bearer mediante el
transporte existente; `VITE_API_BASE_URL` contiene únicamente el origen.

```http
POST  /api/v1/workspaces/:workspaceId/entities/:entityId/purchase-documents
GET   /api/v1/workspaces/:workspaceId/entities/:entityId/purchase-documents
GET   /api/v1/workspaces/:workspaceId/entities/:entityId/purchase-documents/:documentId
PATCH /api/v1/workspaces/:workspaceId/entities/:entityId/purchase-documents/:documentId
POST  /api/v1/workspaces/:workspaceId/entities/:entityId/purchase-documents/:documentId/submit-review
```

### Respuestas

Listado:

```json
{
  "documents": [
    {
      "id": "uuid",
      "entity_id": "uuid",
      "workspace_id": "uuid",
      "document_type": "invoice",
      "issue_date": "2026-11-13",
      "issuer_name": "Proveedor Demo",
      "issuer_tax_id": null,
      "receiver_tax_id": "C/F",
      "receiver_name": "Cliente Demo",
      "description": "Servicio de energía eléctrica",
      "category": "servicios",
      "total": "125.50",
      "currency": "GTQ",
      "status": "draft",
      "created_by": "uuid",
      "updated_by": "uuid",
      "submitted_by": null,
      "submitted_at": null,
      "created_at": "timestamp",
      "updated_at": "timestamp",
      "version": 1
    }
  ]
}
```

El detalle devuelve el mismo objeto dentro de:

```json
{ "document": { "...": "..." } }
```

No convertir `total` a `number` para cálculos financieros; conservarlo como
string decimal y mostrarlo con formato de moneda únicamente en la interfaz.

### Creación y edición

`POST` requiere:

```json
{
  "documentType": "invoice",
  "issueDate": "2026-11-13",
  "issuerName": "Proveedor Demo",
  "receiverName": "Cliente Demo",
  "description": "Compra de suministros",
  "category": "suministros",
  "total": "250.00",
  "currency": "GTQ"
}
```

Tipos permitidos:

```text
invoice
receipt
service_receipt
payment_proof
```

`issuerTaxId` y `receiverTaxId` son opcionales. Si `receiverTaxId` falta o
está vacío, el backend guarda `C/F`. La entity autorizada debe ser el receptor;
no cambiar `entityId` desde el frontend para seleccionar otra empresa. El
backend continúa siendo la autoridad y actualmente acepta el NIT enviado por
el cliente; todavía no lo deriva automáticamente desde la entity.

`PATCH` utiliza los mismos nombres en camelCase, acepta únicamente campos
modificados y solo permite editar documentos con estado `draft`.

### Estados y permisos

```text
draft          → borrador editable
pending_review → enviado al contador; no editable por esta fase
```

- `client_owner` y `client_contributor` con `can_upload`: crear, editar y
  enviar borradores a revisión.
- `client_viewer`: consultar, sin formulario ni acciones de carga.
- Contador autorizado: consultar compras de la entity; para enviar a revisión
  requiere `can_review` o `can_manage`.
- La aprobación, rechazo, observaciones, XML/PDF, IA, pagos y libros todavía no
  forman parte de este contrato.

Para enviar a revisión:

```http
POST /api/v1/workspaces/:workspaceId/entities/:entityId/purchase-documents/:documentId/submit-review
```

Respuesta:

```json
{ "document": { "status": "pending_review", "...": "..." } }
```

La transición válida es únicamente `draft → pending_review`. Un segundo envío
debe mostrar el conflicto seguro del API, no reintentarse automáticamente.

### Reglas frontend

- Query keys aisladas por usuario, workspace y entity.
- Cancelar lecturas/mutaciones al desmontar, cerrar sesión o cambiar de entity.
- Invalidar listado y detalle después de crear, editar o enviar a revisión.
- Mostrar estados de carga, vacío, error, 401, 403, 404, 409 y 503 con reintento
  explícito.
- No mostrar una compra como aprobada ni como registrada en libros.
- No inventar campos de SAT, impuestos, pagos o revisión.
- `created_by`, `updated_by` y `submitted_by` son identificadores; no asumir que
  incluyen nombres o correos.
- Errores del API siguen el formato `{ "error": "CODE", "message": "..." }`.

## Ciclo de vida de compras manuales — contratos nuevos

El backend ya tiene aplicada la migración manual `013_manual_purchase_document_lifecycle.sql`.
El frontend debe consumir el ciclo de vida sin borrar físicamente documentos ni
simular aprobación contable.

### Estados

```text
draft             editable y descartable
pending_review    enviado al contador; bloqueado para edición del cliente
needs_correction  observado por el contador; permite corrección
approved          reservado para aprobación; bloqueado
rejected          rechazado; bloqueado y conservado en historial
discarded         descartado lógicamente; no debe aparecer como pendiente
```

### Acciones nuevas

```http
POST /api/v1/workspaces/:workspaceId/entities/:entityId/purchase-documents/:documentId/return-to-draft
POST /api/v1/workspaces/:workspaceId/entities/:entityId/purchase-documents/:documentId/discard
```

Las acciones devuelven:

```json
{ "document": { "...": "...", "status": "needs_correction" } }
```

El contrato vigente de envío sigue siendo:

```http
POST /api/v1/workspaces/:workspaceId/entities/:entityId/purchase-documents/:documentId/submit-review
```

### Reglas de permisos y estados

- Solo `draft` puede editarse o descartarse directamente.
- `pending_review` no debe mostrar formulario de edición ni descarte al cliente.
- `needs_correction` debe mostrar la observación del contador, permitir editar y
  volver a enviar a revisión.
- `approved` y `rejected` son estados bloqueados; no mostrar acciones de edición,
  descarte o reenvío.
- `discarded` se conserva para auditoría y no debe tratarse como documento activo.
- El cliente uploader no aprueba, rechaza ni devuelve documentos a corrección.
- El contador autorizado puede usar las acciones de revisión según sus permisos.
- El API es la autoridad; ocultar botones no sustituye autorización.

### UX/UI obligatoria para acciones destructivas

- Descartar, cancelar o cualquier acción que retire un documento del flujo debe
  usar variante visual `danger` roja, igual que revocar accesos.
- Mostrar confirmación explícita antes de descartar.
- El texto debe explicar que el documento no se elimina físicamente y que queda
  en historial como `discarded`.
- Usar `aria-label`, foco visible, soporte de teclado y restauración de foco al
  cerrar el diálogo.
- No depender únicamente del color: usar texto claro e icono semántico.
- No usar rojo para guardar, editar, enviar a revisión o acciones informativas.
- Las observaciones y errores deben tener estados accesibles y no confundirse
  con acciones destructivas.

### Implementación frontend pendiente

El futuro trabajo debe:

- Actualizar tipos y parsers para todos los estados.
- Consumir `return-to-draft` y `discard` con transporte autenticado.
- Mostrar el detalle completo de cada compra según su estado.
- Mostrar `review_observation`, `observed_by` y `observed_at` cuando existan.
- Separar visualmente acciones de edición, envío a revisión y descarte.
- Invalidar listado/detalle después de cada transición.
- Manejar 401, 403, 404, 409 y 503 con mensajes seguros y reintento explícito.
- Mantener Query keys por usuario/workspace/entity y cancelar peticiones al
  cambiar usuario, workspace o entity.
- Añadir estados de carga, vacío, error y éxito sin doble envío.
- Aplicar `ui-ux-pro-max` y `emil-design-eng`: diseño minimalista moderno,
  microinteracciones sutiles, `prefers-reduced-motion`, responsive y dark mode.
- Actualizar `codex.md`, `docs/CLIENT.md`, `docs/STATUS.md` y documentación
  relevante con archivos modificados y resultados reales.

No ejecutar Playwright sin autorización expresa. Ejecutar únicamente `npm run
lint` y `npm run build` al finalizar.

**Resumen histórico; el estado actual está al inicio de este mismo documento.** El propietario
dio conformidad a la reorganización y solicitó consolidar la documentación. Esa
conformidad no se registra como prueba visual/funcional. Esta actualización es
solo Markdown: no se modificó código ni se repitieron verificaciones; los
resultados siguientes corresponden al último cierre de implementación.

El propietario autorizó implementar la propuesta auditada con la jerarquía
workspace → N clientes/entities → N personas por entity. `EntityDetailPage`
coordina cabecera con nombre autorizado y submenú Datos del cliente, Personas y
accesos e Invitaciones. Se agregan sufijos frontend `/people` y `/invitations` a
la ruta actual del cliente. No se agregan endpoints, módulos financieros ni
permisos. Owner/admin + canManage sigue siendo obligatorio para accesos.

Se separaron ficha/edición, personas, invitaciones, identidad y confirmaciones.
Personas carga al visitar su sección, permite búsqueda/filtros y muestra UUID y
fechas en detalles. Invitaciones consulta su propia historia al visitarse, prioriza
pendientes y no equipara aceptación con acceso actual. Crear/compartir/revocar
tienen estados independientes. Los enlaces siguen fuera de Query/storage/logs;
cerrar el resultado o salir de Invitaciones elimina las referencias locales.

`EntityDraftGuard` protege datos sin guardar con `useBlocker`; para soportar
enlaces y Atrás/Adelante se sustituyó el wrapper BrowserRouter por el data router
de la misma dependencia instalada. AppRoutes, Auth/Query, SDK y rutas anteriores
se conservan. Los datos remotos siguen en Query, sin loaders del router. Recarga
usa confirmación nativa `beforeunload`, cuando el navegador la admite.

Skills: emil-design-eng y guía local de UI/UX Pro Max, sin instalar Python.
Sin Git/env/backend/SQL/dependencias nuevas ni implementación de facturas.
Detalles, decisiones, archivos y límites: [docs/CLIENT-ADMINISTRATION.md](docs/CLIENT-ADMINISTRATION.md).

Verificación final: `npm run lint` terminó sin errores ni avisos y `npm run build`
terminó con salida 0 después del refactor y del formateo acotado. TypeScript,
Vite y generación PWA completos. CSS 60,39 kB (11,77 kB gzip), JS principal
764,33 kB (221,16 kB gzip). El data router habilita el bloqueo de navegación y
aumenta el bundle frente al anterior; permanece el aviso superior a 500 kB.
Casos Demo adaptados y cinco casos nuevos preparados sin ejecutar Playwright.
Sin revisión visual o integración real certificadas. El build no valida el
bloqueo, sesiones ni permisos reales en navegador.

---

# Estado anterior — rediseño integral de UI/UX, 2026-11-12

El propietario autorizó modernizar la experiencia de las funcionalidades actuales.
Se aplicaron emil-design-eng y la guía local de UI/UX Pro Max: sistema de ritmo,
tipografía, radios y movimiento centralizado; navegación con marca/contexto,
listados en una superficie, búsqueda desde el primer registro, filtro local de
clientes por acceso y resumen de resultados. La ficha pone editar junto a la
identidad y conserva filas semánticas. Autenticación comparte jerarquía y estados
de carga estables; perfil y cliente aislado siguen esa misma composición.

Compartir conserva su formulario directo y la opción de cerrar/desmontar los
enlaces de esta visita; historial/personas son desplegables y de lectura diferida.
El color de estados depende de `data-state`, no de la forma del SVG. La pulsación
y entrada de overlays solo tienen movimiento con puntero y sin preferencia de
movimiento reducido. Teclado, rutas y listas responden sin animación.

La autorización visual actual sustituye las restricciones históricas de no
reestructurar componentes; se mantienen la paleta vigente, rutas, contratos,
permisos, sesión/cancelación, tratamiento del NIT y continuidad segura de enlaces.
Sin backend/SQL/env/Git, dependencias ni módulos financieros nuevos. Python no
está disponible: se leyó la guía de UI/UX Pro Max directamente, sin atribuir
resultados al buscador. Documentación completa: [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md).

Verificación final: `npm run lint` y `npm run build` terminaron con salida 0
después de los cambios y el formateo acotado. TypeScript y generación Vite/PWA
completos; CSS 57,12 kB (11,40 kB gzip), JS principal 700,82 kB (202,27 kB gzip).
Permanece el aviso de chunk superior a 500 kB. Se adaptó el selector de rol en los
casos Demo y se prepararon casos de búsqueda/filtro/restablecimiento y consulta
diferida de historial/personas; no se ejecutaron. Revisión visual intentada pero
no completada por indisponibilidad del host de navegador/captura de la aplicación.
No se ejecutó Playwright; integración real y aceptación visual siguen pendientes.

---

# Estado anterior — identidad visible en accesos, 2026-11-12

## Integración de perfiles en el panel de accesos

`EntityAccessPanel` integra los contratos actualizados: memberships conserva
`user_id` y proyecta `user`; invitations conserva `accepted_by` y proyecta
`accepted_by_profile` solo si la invitación fue aceptada. El parser valida la
proyección no sensible y mantiene la autoridad del API: nombre, avatar e
identificador nunca deciden permisos.

La jerarquía visual prioriza nombre visible, avatar o iniciales y rol/estado;
UUID queda como dato secundario. Perfiles ausentes, nombres nulos y avatares
normalizados como nulos usan “Usuario sin nombre” sin inventar una persona.
Pending, expired y revoked sin aceptación no muestran identidad aceptante.
Ingreso y revocación permanecen visibles, y las revocaciones conservan acción
danger, confirmación y retorno de foco.

Se actualizaron mocks no ejecutados para perfiles presentes, ausentes/nulos,
avatar inválido, aceptación y pending. `npm run lint` y `npm run build` se
ejecutarán al cierre; Playwright, validación visual e integración real no forman
parte de la validación.

---

## Listado completo de invitaciones

Se integró exclusivamente en `nuvora-web` el listado administrativo confirmado
por backend:

```text
GET /api/v1/workspaces/:workspaceId/entities/:entityId/invitations?limit=100
PATCH /api/v1/workspaces/:workspaceId/entities/:entityId/invitations/:invitationId/revoke
```

El parser acepta únicamente la proyección no sensible (`id`, contexto, rol,
estado, fechas, `accepted_by` y revocación); nunca agrega tokens, hashes,
correos o `acceptUrl`. El estado pendiente vencido se muestra como `expired`
cuando así lo proyecta el servidor, sin escribir en la base de datos.

`useInvitations` mantiene una query con clave por usuario/workspace/entity y
límite, sin secretos, `gcTime: 0`, sin retries y con `AbortSignal`. El panel la
monta al abrirse y ofrece loading, vacío, error y retry. Las respuestas se
invalidan junto con memberships después de revocar una invitación o una
membresía; Auth y el cambio de contexto mantienen la cancelación/limpieza
existentes.

La UI usa disclosure accesible para historial y personas, conserva roles/fechas
y enlaza visualmente `accepted_by` con `user_id` cuando ambos listados lo
permiten. Distingue invitación aceptada con acceso activo, acceso revocado,
pendiente, expirada y revocada sin inventar identidades. Revocar cualquiera de
los dos recursos requiere diálogo/foco y confirmación; las acciones destructivas
usan el token danger y texto explícito, no solo color. Los links de creación
siguen siendo memoria efímera fuera de Query/Mutation cache, por lo que no se
confunden con la historia ni se inventan enlaces históricos.

Diseño aplicado: minimalismo SaaS dashboard, disclosure/lista compacta,
responsive, dark mode y tokens existentes; sin cards excesivas, gradientes,
dependencias nuevas ni cambios de arquitectura. Archivos: `src/features/access`
(tipos/API/hook/panel/CSS), `src/shared/ui/components/Button.tsx` y el token
danger ya existente en `src/styles/globals.css`. Documentación ampliada también
en `docs/ACCESS.md`. Se agregaron estados y contratos a la implementación
existente; no se ejecutó Playwright ni se declara validación visual. Al cierre,
`npm run lint` y `npm run build` finalizaron correctamente. El build generó un
chunk JS de 695.38 kB y conserva el aviso superior a 500 kB; no se ejecutó
Playwright ni se declara validación visual o integración real.

---

# Estado vigente — cliente aislado y enlaces compactos, 2026-11-12

## Continuidad link-first de invitaciones — 2026-11-12

Implementado exclusivamente en `nuvora-web`: una invitación abierta antes de
autenticar conserva el contexto suficiente para login/registro por correo y para
Google OAuth. El callback adopta la sesión y vuelve a `/invitations/accept` en vez
de enviar al dashboard de creación de workspace. La aceptación continúa siendo
un POST explícito posterior a mostrar contexto, rol y vencimiento; el portal se
abre únicamente después de una respuesta exitosa del API.

- `invitationToken.ts` captura y limpia el token de la URL, valida su formato y,
  solo al iniciar una continuidad desde invitación, usa un sobre
  `sessionStorage` tab-scoped con TTL de 10 minutos. No usa localStorage/cookies,
  Query/Mutation cache, analytics, breadcrumbs, logs ni URLs de tracking.
- `AuthCallbackPage` distingue el flujo normal (vuelve a `/`) del flujo de
  invitación (vuelve a `/invitations/accept`). Cancelaciones/fallos muestran
  mensaje, reintento y opción de volver a la invitación mientras el sobre sea
  vigente. El login normal no escribe el sobre.
- Aceptar, cancelar definitivamente, logout/cambio explícito de cuenta, estados
  no pendientes y expiración/410 limpian el contexto. Recargar después del TTL o
  abrir un token inválido exige el enlace original. El token no se convierte en
  autorización local: el API sigue inspeccionando y aceptando el bearer link.

**Tradeoff:** `sessionStorage` es el mínimo mecanismo para atravesar la navegación
completa de OAuth, está limitado a la pestaña y a una ventana breve, pero sigue
siendo legible por JavaScript de esa pestaña. No reemplaza HTTPS/CSP ni la
validación del API. `npm run lint` y `npm run build` pasaron; Playwright no se
ejecutó (requiere autorización expresa) y la integración real/validación visual
siguen pendientes.

## Descubrimiento de contexto tras autenticación — 2026-11-12

Implementado únicamente en `nuvora-web`: después de autenticar se consume `GET /api/v1/profile/entities` con Bearer mediante `features/access/api/profileAccessApi.ts` y `hooks/useProfileEntities.ts`. La query está aislada por `userId`, se cancela/limpia con Auth y no convierte roles o permisos en autoridad local.

- Solo workspaces activos: se conserva la experiencia actual de contador, lista, búsqueda y creación.
- Solo memberships directas de entity: una entity entra directamente a `/client/entities/:entityId?workspaceId=:workspaceId`; varias se eligen explícitamente. No se muestra crear workspace ni gestión del despacho.
- Ambos accesos: se exige una elección visible entre área del despacho y portal cliente; no hay redirección silenciosa.
- Ningún acceso: se conserva el flujo existente de crear workspace.
- Carga, lista vacía, 401, 503 y red: estados seguros y reintento sin bucles ni redirecciones repetidas.

El portal cliente usa el entity detail devuelto por `/profile/entities` y no autoriza mediante `GET /api/v1/workspaces/:workspaceId` ni el detalle anidado; no crea `workspace_membership`. Mocks/casos Demo en `tests/auth/workspace.spec.ts` cubren contador, cliente, ambos, ninguno y 401/503; logout y cambio de usuario conservan la limpieza existente. Playwright no fue ejecutado.

Verificación: `npm run lint` y `npm run build` aprobados; se conserva el aviso de bundle principal superior a 500 kB. Sin cambios en API, SQL, backend, `.env`, secretos, Git, commits, pushes ni deploys.

**Entrada y pantalla frontend implementadas; lectura real de entity bloqueada por API.** Tras POST accept exitoso se abre `/client/entities/:entityId?workspaceId=:workspaceId`, con guard y cabecera propios, sin shell de contador, sin GET/lista/detalle de workspaces y sin crear workspace_membership. Contadores conservan sus rutas. Solo se intenta el GET de entity documentado, con IDs y sesión actuales.

**Bloqueo exacto comprobado por inspección:** `nuvora-api/src/modules/entities/entity.service.ts:getEntity` exige findWorkspaceMembership antes de evaluar membresía directa y devuelve 404 ENTITY_NOT_FOUND si no existe. No hay endpoint alternativo documentado para leer entity/rol/despacho solo por entity_membership. No se modificó API ni se eludió ese control. No declarar el acceso de datos del cliente completamente funcional hasta coordinar este contrato. La pantalla muestra rechazo/reintento seguros, sin WORKSPACE_NOT_FOUND del shell ni datos inventados.

POST acceptance conserva únicamente metadata no sensible por usuario/workspace/entity, nunca tokens/enlaces; el rol se etiqueta como rol aceptado, no permiso actual. GET independiente revalida el acceso; nombre solo si devuelve 200. Contexto se limpia/cancela al salir, cerrar sesión o cambiar usuario. Rol/nombre de despacho actuales no se inventan si el API no los devuelve; referencia de despacho solo informativa.

UI/UX Pro Max aplicada: vista moderna mínima con bienvenida, consulta autorizada/error, cuenta y área informativa futura sin documentos implementados. Compartir acceso con selector+Crear enlace inmediato, iconos, Copiar/WhatsApp visibles; opciones y miembros desplegables, estos últimos consultados al abrir. Sin cambiar colores/tokens/tema/splash/PWA ni incorporar dependencias.

Estado, archivos y límites: [docs/CLIENT.md](docs/CLIENT.md), [docs/ACCESS.md](docs/ACCESS.md). **Lint y build aprobados (salida 0)**, TypeScript y generación Vite/PWA completos. Tipos de mocks también aprobados con tsc --noEmit, sin ejecutar Playwright. JS 684,67 kB (198,68 kB gzip); CSS 46,59 kB (9,58 kB gzip); permanece el aviso de chunk superior a 500 kB. Mocks de cliente aislado/destino/errores/logout preparados; revisión visual e integración real pendientes. Sin backend/SQL/env/secretos/Git/commits/push/despliegues. No implementar otros módulos ni crear membresías de workspace como solución.

## Entrega frontend y bloqueo pendiente

**Entregado en nuvora-web:** ruta protegida de cliente aislado, redirección posterior a aceptación, cabecera sin navegación del despacho, consultas/cachés separadas por usuario y entidad, estados seguros y compartir enlaces compacto con iconos. Archivos principales: `src/features/client/`, `src/app/routes.tsx`, `InvitationPage.tsx`, `EntityAccessPanel.tsx`, `ShareInvitation.tsx`, `useAccess.ts`, `WorkspaceAccount.tsx`, `ProtectedRoute.tsx`, `returnPath.ts` e `Icon.tsx`. Mocks adaptados en `tests/auth/client.spec.ts`, `access.spec.ts` y `access.fixture.ts`.

**Bloqueo para coordinar con el responsable del API:**

1. La aceptación crea únicamente `entity_membership`, como corresponde.
2. El frontend ya no solicita el workspace completo, pero el GET existente `GET /api/v1/workspaces/:workspaceId/entities/:entityId` todavía exige `workspace_membership` en `getEntity`.
3. Por eso un cliente aceptado puede recibir `404 ENTITY_NOT_FOUND` y la web no puede mostrar el nombre/datos de la empresa. El contrato tampoco proporciona su rol actual ni el nombre del despacho sin ese acceso.
4. Debe confirmarse un contrato de lectura autorizado por la membresía directa de la entidad, sin conceder acceso al workspace ni a otras entidades. Este documento no autoriza a modificar backend o SQL desde esta tarea.
5. Cuando exista ese contrato, adaptar el transporte frontend si corresponde y validar aceptación → pantalla cliente, recarga, rol, revocación y denegación de una entidad ajena. No asumir que el bloqueo quedó resuelto por pasar lint/build.

**Estado de verificación:** lint/build y tipos de mocks aprobados en la implementación anterior; Playwright, revisión visual e integración real pendientes. Esta actualización es exclusivamente documental: no volvió a ejecutar checks de código ni modificó la implementación.

Los estados siguientes son históricos y su redirección al área del contador queda reemplazada por esta ruta aislada.

---

# Estado vigente — link-only coherente, 2026-11-12

**Adaptación frontend finalizada:** invitaciones con `{ role }` exclusivamente. Retirados campo de destinatario, delivery/estados de envío y mensajes de coincidencia de email. Create consume acceptUrl de la respuesta del API y lo muestra directamente para copiar/WhatsApp/Web Share, sin paso adicional de generación. Rotación opcional en Opciones del enlace, con advertencia.

Cualquier usuario autenticado puede confirmar explícitamente la aceptación. Inspección muestra workspace/entity/rol/vencimiento; no se acepta automáticamente. Se conservan estados expirado/revocado/usado, errores seguros, permisos, cancelación y limpieza temprana de URL. Tokens/enlaces solo en memoria local, nunca almacenamiento persistente, Query/Mutation cache, analytics o logs. Los datos de correo de Auth identifican la sesión, no un destinatario de invitación.

UI/UX Pro Max aplicada para labels/feedback y un único paso de creación con rol por defecto de solo lectura. No se cambiaron colores, tokens, dark mode, splash, PWA, rutas ni diseño; sin nuevas pantallas/módulos/endpoints. Se eliminaron estilos de entrega ya sin uso y se permite wrapping de IDs de contexto en el callback.

Estado y archivos en [docs/ACCESS.md](docs/ACCESS.md). **Lint y build aprobados (salida 0)**, TypeScript y generación Vite/PWA completos. Tipos de mocks aprobados con tsc --noEmit. JS 678,06 kB (196,86 kB gzip); CSS 43,31 kB (9,11 kB gzip). Permanece el aviso de chunk superior a 500 kB. Mocks actualizados sin ejecutar Playwright; integración real y revisión visual pendientes. Sin API/backend/SQL/env/secretos/Git/commits/push/deploy ni dependencias nuevas. Detenerse aquí y esperar nueva indicación.

Los cierres de implementación anteriores son históricos. Sus referencias al flujo de correo/SMTP o comparación de destinatario quedan reemplazadas por este estado y por la sección Cambio de contrato vigente al final de este archivo.

---

# Estado vigente — invitaciones, membresías y compartir, 2026-11-12

**Implementación frontend finalizada para la fase adicional autorizada por el usuario.** Solo nuvora-web, sin modificar API/SQL/backend/env/secretos/dependencias/Git. Se reutilizaron entidades, rutas, sesión, diseño y colores existentes.

- Administración de accesos en detalle del cliente para owner/admin con canManage: invitación link-only con rol directo, membresías aceptadas y revocación con confirmación/historial. El panel distingue "Invitación aceptada · Acceso activo", "Acceso activo" y "Acceso revocado".
- Compartir por acción explícita: generación/rotación del enlace, advertencia de invalidación anterior, copiar con feedback/fallback, WhatsApp y Web Share. Sin mensajes automáticos ni enlaces en almacenamiento/caché/analytics/logs.
- Callback /invitations/accept: token capturado y URL limpiada antes de Router, acceso/registro sin persistirlo, inspección autenticada, estados pending/expired/revoked/accepted, error de correo y aceptación explícita. Redirección al contexto del API solo tras POST exitoso; la ruta vuelve a comprobar permisos.
- Consultas por usuario/workspace/entity y cancelación/descartes al desmontar o limpiar sesión; operaciones sensibles sin Mutation cache ni retries. Tokens solo en memoria de la visita, errores saneados.
- UI/UX Pro Max aplicada; ficha minimalista, tokens y temas preservados. Solo ajustes de seguridad PWA: referrer no-referrer y callback fuera del fallback offline; sin rediseño de instalación/splash.
- Mocks adicionales preparados, **sin ejecutar Playwright**. Las pruebas existentes de entidades reutilizan la fixture extraída; no se rehizo su funcionalidad.

**Límites explícitos:** API no lista invitaciones existentes ni nombres/correos de memberships; UI muestra invitaciones creadas en la vista actual e identificadores de cuenta. Por eso una invitación pendiente creada en otra visita no se presenta como aceptada. Google/confirmación/recarga requieren reabrir enlace original para no persistir token. Enlace devuelto debe corresponder a esta origin y /invitations/accept. Integración real, SMTP, SQL 004/005, RLS y validación visual siguen pendientes; no se tocaron remotamente.

Detalles de contratos, archivos, seguridad y resultados en [docs/ACCESS.md](docs/ACCESS.md). En esta mejora se ejecutaron **lint y build correctamente**; el build conserva el aviso de chunk principal superior a 500 kB. No se ejecutó Playwright ni se modificaron API, SQL, env, secretos, dependencias o Git. No avanzar portal/FEL/libros u otra fase mayor sin indicación. Los apartados históricos que prohíben invitaciones/memberships quedaron sustituidos por la fase adicional autorizada, cuya especificación se conserva al final de este documento.

---

# Estado vigente — ficha minimalista por filas, 2026-11-12

**Documentación sincronizada:** README, AGENTS, docs/ENTITIES, docs/PLAN y docs/PALETTE reflejan rutas, menú, acento azul y ficha por filas. Revisión exclusivamente documental: no se volvieron a ejecutar checks de código ni se modificó la implementación.

**Rediseño implementado por solicitud del usuario:** sin cards por dato. Una superficie de lectura con cabecera sin fondo decorativo, iniciales y lista semántica `dl` de NIT, acceso y fechas. Filas etiqueta/valor con separadores horizontales discretos; móvil apila contenido. Permiso como texto azul, sin badge/caja. Acción de edición conserva texto y añade icono.

Skill UI/UX Pro Max aplicada: búsqueda UX inicial poco específica, refinada a `minimalism whitespace typography --domain style`, coincidencia `minimalism-and-swiss-style` apropiada para herramientas profesionales/SaaS. Se aplican jerarquía, espacio, grilla y eliminación de decoraciones, respetando colores aprobados. Iconos SVG de identificación, calendario, reloj y edición amplían la familia existente, todos decorativos con etiquetas textuales. Sin dependencias nuevas.

Se revisó la composición del detalle y se conservaron controles existentes de formulario, carga/error y permisos; no es una auditoría integral de cada componente de la app. No se cambian API, datos, sesión, NIT protegido ni autorizaciones. Conservado padding exterior responsive y foco visible. Sin cambios de PWA ni paleta global.

**Lint y build aprobados (salida 0)**, TypeScript y generación Vite/PWA completos. Bundle principal 658,62 kB (191,62 kB gzip); se conserva el aviso superior a 500 kB. Playwright no ejecutado y revisión visual en navegador pendiente. Los bloques históricos que describen cards por campo o cabeceras con fondo quedan reemplazados.

---

# Estado vigente — ficha sin borde y acento azul, 2026-11-12

Ajuste solicitado sobre la captura: retirados borde exterior/línea superior de la ficha, borde de su cabecera y línea superior de edición. Distribución, padding y bloques de datos conservados. Cabecera neutra azulada, avatar/acento azul en lugar de teal; éxito mantiene verde y acciones mantienen índigo.

Skill UI/UX Pro Max consultada: `B2B Service professional navy --domain color`, coincidencia B2B Service (navy/azul). Adaptación a marca índigo existente; tokens de acento centrales #0369A1 claro / #7DD3FC oscuro, fondos #F0F9FF / #132F43. Cambia también el acento compartido en lista de clientes/contexto para conservar coherencia. Sin cambios de API, datos, permisos o foco.

Contraste numérico actualizado en docs/PALETTE-CONTRAST.md. **Lint y build aprobados (salida 0)**. Permanece el aviso de chunk superior a 500 kB. Las 6 combinaciones nuevas de acento superan 4,5:1. Playwright y validación visual del resultado pendientes. Los apartados de teal siguientes son históricos y quedan reemplazados por esta decisión.

---

# Estado vigente — correcciones por capturas del usuario, 2026-11-12

**Implementado:** quitar el contorno de foco del contenedor de lectura `.content` (main), conservando su destino de foco/tabindex para navegación y skip link. No se eliminaron los indicadores de foco de botones, enlaces, campos o títulos enfocados al guardar/cancelar.

Ficha de cliente rediseñada: tarjeta con fondo de superficie y padding responsive de 20–32 px, cabecera teal con iniciales, bloques de datos con padding propio, etiqueta azul de permisos y pie independiente con acción/explicación. Formulario de edición también dentro de tarjeta acolchada. Sin cambios de datos, autorización, sesión o API. El color no implica aprobación fiscal.

UI/UX Pro Max consultada: jerarquía tipográfica y espaciado/padding responsive. La consulta de stack devuelve guía Tailwind 4.3; solo se aplicaron principios de espaciado en CSS compatible con el proyecto 3.4, sin migración. Nuevo token `--on-accent` para texto sobre teal: contraste sRGB 5,47:1 claro y 12,07:1 oscuro.

**Lint y build aprobados (salida 0)**; TypeScript y generación Vite/PWA completos. Bundle principal 657,85 kB (191,37 kB gzip); permanece el aviso superior a 500 kB. Playwright no ejecutado. Las capturas del usuario muestran el problema anterior; no equivalen a aceptación de la corrección ni a revisión del resultado en navegador. Solo `nuvora-web`; sin Git, env, dependencias o API. Historial a continuación.

---

# Estado vigente — paleta complementaria, 2026-11-12

**Paleta implementada por solicitud del usuario**, conservando índigo de marca. UI/UX Pro Max consultada y refinada a paleta Micro SaaS índigo/esmeralda; adaptación operativa documentada en [docs/PALETTE.md](docs/PALETTE.md).

Fondo gris azulado, superficies secundarias neutras y navegación diferenciada; teal para contexto/iniciales de clientes; verde semántico en confirmaciones de creación/guardado/Auth y azul en etiquetas de acceso. Advertencia ámbar disponible en tokens sin inventar estados. Temas claro/oscuro centralizados en globals.css y mapeados en Tailwind 3.4. Meta claro alineado con fondo; PWA nativa oscura conservada.

**24 combinaciones de texto verificadas numéricamente, todas ≥4,5:1**, incluyendo selección con transparencia. Ver [docs/PALETTE-CONTRAST.md](docs/PALETTE-CONTRAST.md). No equivale a auditoría completa ni validación visual. Playwright no ejecutado. **Lint y build aprobados (salida 0)**; permanece el aviso de chunk superior a 500 kB. Resultados en la guía de paleta.

Solo `nuvora-web`; sin API, entornos, dependencias o Git. La corrección de continuidad de sesión anterior fue confirmada funcional por el usuario; esa confirmación no valida otros escenarios de sesión ni estos cambios visuales. Historial a continuación.

---

# Estado vigente — continuidad al recuperar foco, 2026-11-12

**Corrección implementada:** `AuthProvider` ya no limpia caché ni desmonta la aplicación ante `SIGNED_IN` repetido o `TOKEN_REFRESHED` del mismo usuario previamente verificado por `/auth/me`. La sesión más reciente se conserva en la referencia; Supabase continúa como único gestor de renovación. Inicio inicial, cambio de identidad, recuperación, error/reintento y logout mantienen su resolución/limpieza.

La causa se comprobó por inspección del proveedor y del código local del SDK: la recuperación de visibilidad puede emitir `SIGNED_IN`; anteriormente todos los eventos ejecutaban `resolve`, que limpiaba Query y ponía auth en loading. No se observó el síntoma en un dispositivo real. No hay evidencia de recarga de documento provocada por foco; PWA continúa con actualización por confirmación. Las consultas mantienen revalidación en segundo plano y autorización del API.

Caso Demo añadido en `tests/auth/auth.spec.ts` para evento real del SDK tras visibilidad simulada, preservación del diálogo/borrador y ausencia de nueva petición `/me`; **no ejecutado** por restricción de Playwright. La liberación de pestañas/procesos por el navegador/SO todavía puede causar recargas reales; esta corrección no afirma evitarlo.

**Lint y build aprobados (salida 0)**; permanece el aviso de chunk superior a 500 kB. Verificación final en [docs/SESSION-CONTINUITY.md](docs/SESSION-CONTINUITY.md). Solo frontend, sin API, secretos, dependencias o Git. Historial de fases a continuación.

---

# Estado vigente — menú responsive, 2026-11-12

**Menú implementado para la fase autorizada por el usuario.** Solo `nuvora-web`; sin cambios de API, endpoints, entornos, dependencias o Git.

- Escritorio desde 1024 px: lateral compacto con espacio activo, Espacios, Clientes y Cambiar espacio. Clientes solo aparece tras confirmar acceso al workspace mediante la query existente; permanece activo en el detalle.
- Móvil/PWA: botón de menú y panel lateral modal nativo; cierre con botón, Escape, fondo o navegación. Control de foco, bloqueo de scroll de fondo y cierre al ampliar a escritorio. Safe areas y alto dinámico; sin animación de entrada ni tiempos de espera añadidos.
- Perfil, apariencia y logout permanecen en el avatar. Las migas de ubicación y rutas existentes se conservan. No se añadieron secciones futuras vacías ni navegación inferior.
- UI/UX Pro Max consultada para navegación con teclado/foco; estilos locales con los tokens actuales, iconos SVG coherentes y estados activos con texto, borde y `aria-current`.
- Nuevos componentes: `features/workspace/components/WorkspaceNavigation.tsx` y `navigation.module.css`. Integración en `WorkspaceLayout.tsx` y `app/WorkspaceRoutes.tsx`. Sin llamadas a nuevos endpoints; TanStack Query comparte la consulta del workspace con el control de acceso existente.
- Se adaptaron selectores de las suites a la navegación duplicada escritorio/móvil y se prepararon tres casos Demo para Escape/navegación, lateral activo y cambio de ancho. **Playwright no ejecutado**; validación visual, navegadores y dispositivos reales siguen pendientes.

**Lint y build aprobados (salida 0).** Permanece el aviso de chunk superior a 500 kB. Resultados documentados en [docs/NAVIGATION.md](docs/NAVIGATION.md). No avanzar otra fase mayor sin nueva indicación. Los estados siguientes son históricos.

---

# Estado vigente — navegación por rutas, 2026-11-12

**Fase de separación por rutas implementada**, autorizada por el usuario después del cierre de clientes. Este estado reemplaza la indicación anterior de que no había otra fase autorizada. Solo se trabajó en `nuvora-web`; no se cambiaron contratos ni endpoints del API.

- `/`: selección y creación de espacios, sin cartera ni perfil incrustados.
- `/workspaces/:workspaceId/clients`: cartera del espacio autorizado.
- `/workspaces/:workspaceId/clients/:entityId`: detalle y edición según `canManage`.
- `/account`: perfil, accesible desde el menú de cuenta. Apariencia y cierre de sesión conservan su ubicación en ese menú.
- Layout privado persistente, enlaces jerárquicos y foco del contenido al navegar. Los diálogos se conservan para crear espacios/clientes.
- Los enlaces directos validan UUID y revalidan workspace antes de montar datos de clientes. La edición directa utiliza la query del detalle, sin depender de visitar la lista antes.
- Cambio de espacio cancela y elimina las queries de clientes del contexto anterior; desmontar cancela escrituras pendientes. Autenticación por correo conserva destinos internos conocidos; no admite redirecciones externas. Google conserva su retorno anterior al inicio.
- UI/UX Pro Max consultada localmente: navegación jerárquica y headings secuenciales. Se preservan paleta, tokens, splash, PWA y controles de apariencia.

Verificación: **lint y build aprobados (salida 0)**. Permanece el aviso de chunk superior a 500 kB. Detalles en [docs/ROUTING.md](docs/ROUTING.md). Playwright y revisión visual en navegador pendientes; no afirmar que enlaces directos, permisos, responsive o recorridos E2E pasaron pruebas ejecutadas. Las suites existentes se adaptaron y se añadieron casos Demo de recarga/Atrás/Adelante e identificador inválido, sin ejecutarlos.

No adelantar otra fase mayor sin indicación del usuario. Los cierres siguientes son históricos.

---

# Frontend — Perfil, Workspaces y Clientes

## Estado actual — clientes/entidades implementados, 2026-11-12

**Implementación frontend finalizada para la fase autorizada de clientes/entidades.** Trabajo realizado exclusivamente en `nuvora-web`; no se modificó `nuvora-api`, SQL, backend, `.env`, secretos, dependencias, Git ni despliegues. No volver a implementar los endpoints ni reconstruir las fases ya cerradas.

### Cambios realizados

- Cartera del workspace confirmado: listado, carga, vacío, errores, reintento y búsqueda local por nombre. No se consultan clientes sin confirmar primero el workspace seleccionado.
- Alta de cliente con nombre legal y NIT opcional; body exacto `{ legalName, taxId? }`, validación y prevención de doble envío.
- Detalle mediante el endpoint existente y edición solo con canManage. Crear se ofrece según rol owner/admin del detalle confirmado de workspace; el API mantiene la autoridad de autorización.
- NIT completo únicamente si el API lo devuelve autorizado; máscara conservada para consulta. Los valores enmascarados no se reconstruyen ni se prefijan en formularios de sustitución.
- Acciones explícitas para mantener, cambiar o quitar NIT. PATCH omite campos no cambiados; cambiar solo nombre no toca NIT y quitar NIT envía null. Normalización de espacios/mayúsculas y formato existente, sin dígito verificador ni verificación fiscal externa.
- Contexto de workspace visible en cartera y diálogos, foco/labels/resumen de errores, estados de guardado y confirmaciones. Diseño con UI/UX Pro Max, reutilizando layout, tarjetas, diálogos, paleta/tokens y controles anteriores. Sin cambios de splash, PWA o estilos globales.
- Transporte SDK/Axios extraído a `src/shared/api/authenticatedRequest.ts` para compartirlo con workspaces y entities, conservando los aliases existentes. Sin almacenamiento manual de tokens ni refresh paralelo.
- Queries por usuario/workspace/entity, cancelación y eliminación al cambiar espacio; escrituras pendientes descartadas si cambió la identidad de la Query de lista tras limpiar caché. Sin reintentos automáticos de creación/edición.

### Archivos principales de esta fase

| Responsabilidad                             | Ubicación                                                                   |
| ------------------------------------------- | --------------------------------------------------------------------------- |
| Contratos, transporte y queries de clientes | `src/features/entities/types/`, `api/`                                      |
| Cartera, detalle y formularios              | `src/features/entities/components/`                                         |
| Validación y NIT de presentación            | `src/features/entities/utils/entityPresentation.ts`                         |
| Estilos locales                             | `src/features/entities/entities.module.css`                                 |
| Integración con el espacio activo           | `src/features/workspace/pages/WorkspacePage.tsx`                            |
| Transporte compartido y UUID                | `src/shared/api/authenticatedRequest.ts`, `src/shared/utils/identifiers.ts` |
| Compatibilidad de workspace                 | `src/features/workspace/api/workspaceApi.ts`                                |
| Pruebas nuevas y fixture adaptada           | `tests/auth/entities.spec.ts`, `tests/auth/workspace.spec.ts`               |

### Verificación final y estatus

- **Lint aprobado:** `npm run lint`, sin errores en la revisión final.
- **Build aprobado:** `npm run build`, con TypeScript y compilación Vite/PWA completados.
- Bundle principal 650,95 kB / 189,88 kB gzip; CSS 33,17 kB / 7,38 kB gzip. Permanece el aviso de chunk superior a 500 kB, sin ocultarlo cambiando el umbral.
- **24 casos Demo escritos, no ejecutados**, para lista/vacío, creación/NIT opcional, detalle/edición, validación, errores, máscaras/permisos, cambio de contexto, foco/responsive, doble envío y respuesta tardía.
- **Playwright no ejecutado**, conforme a la restricción explícita de esta guía. No declarar aprobados esos casos ni revisión visual, integración real, RLS o dispositivos por pasar lint/build.
- Pendientes: revisión en navegador, ejecución autorizada de suites, integración real y SQL/RLS manuales del API (003 después de 001/002, a cargo del propietario). Ninguno se ejecutó remotamente.
- No hay otra fase de implementación autorizada por este cierre. No adelantar grants, invitaciones, entity_memberships, portal, FEL, libros ni módulos financieros.

Informe y continuidad: [docs/ENTITIES.md](docs/ENTITIES.md), [AGENTS.md](AGENTS.md) y [fase de clientes del plan](docs/PLAN.md#entities-vigente).

## Cierre anterior — perfil/workspaces, 2026-11-12

**Implementación frontend finalizada para el alcance de esta guía.** No volver a construir esta fase desde cero ni restaurar el intento anterior eliminado por el propietario. Conservar los cambios actuales y atender únicamente correcciones o una nueva fase indicada por el usuario.

Este cierre corresponde a implementación y compilación; no declara aprobadas las pruebas de navegador, la revisión visual, la integración real ni el aislamiento RLS que siguen pendientes.

### Funcionalidades implementadas

- Consulta del perfil autenticado: nombre, correo de sesión, avatar HTTPS o iniciales, idioma y zona horaria. Nombre/avatar nulos y perfil inexistente tienen presentación alternativa, sin bloquear los espacios disponibles.
- Lista de workspaces accesibles con roles devueltos por el API, estado vacío y búsqueda local cuando hay más de cuatro espacios.
- Creación en diálogo nativo: nombre, identificador generado editable, validación, prevención de doble envío, errores de conflicto y confirmación de éxito. El POST envía exclusivamente `{ name, slug }`.
- Selección explícita con consulta de detalle al servidor. Nombre y rol del contexto se presentan como confirmados solo tras respuesta correcta. La selección es temporal; no concede permisos ni abre módulos futuros.
- Estados de carga, error, reintento, sesión inválida, permisos, recurso no disponible y proveedor caído, con mensajes seguros.
- Peticiones cancelables, caché por usuario/espacio y protección frente a respuestas tardías tras logout/cambio de sesión. Sin reintentos automáticos de creación ni almacenamiento manual de tokens.

### Diseño entregado

Se aplicó la skill local UI/UX Pro Max y se adoptó una composición SaaS minimalista: pantalla privada de ancho completo, lista principal y perfil lateral, una columna en móvil, menú de cuenta con apariencia/logout y creación mediante diálogo. El layout privado se separó del formulario de login para evitar su límite de 416px.

Se preservaron la identidad índigo/lavanda, los tokens, el tema, el splash, Auth, las rutas públicas y la PWA. Los estilos nuevos son locales mediante CSS Module; no se introdujeron otra paleta, gradientes, fuentes externas ni dependencias. Labels, errores asociados, foco, Escape y alternativas de avatar están implementados; su existencia no sustituye una comprobación de accesibilidad en navegador.

### Archivos principales

| Responsabilidad                                    | Ubicación                                               |
| -------------------------------------------------- | ------------------------------------------------------- |
| Tipos y contratos                                  | `src/features/workspace/types/workspace.types.ts`       |
| Transporte y errores                               | `src/features/workspace/api/workspaceApi.ts`            |
| Queries, mutación y límites de caché               | `src/features/workspace/api/useWorkspaceQueries.ts`     |
| Pantalla inicial protegida                         | `src/features/workspace/pages/WorkspacePage.tsx`        |
| Layout, cuenta, perfil, avatar, feedback y diálogo | `src/features/workspace/components/`                    |
| Presentación y validación                          | `src/features/workspace/utils/workspacePresentation.ts` |
| Estilos locales                                    | `src/features/workspace/workspace.module.css`           |
| Separación de rutas públicas/privadas              | `src/app/routes.tsx`                                    |
| Familia de iconos existente ampliada               | `src/shared/ui/components/Icon.tsx`                     |
| Casos mockeados nuevos                             | `tests/auth/workspace.spec.ts`                          |
| Regresiones Auth adaptadas                         | `tests/auth/auth.spec.ts`                               |

### Verificación realizada y pendientes

- **Lint aprobado:** `npm run lint`, sin errores reportados.
- **Build aprobado:** `npm run build`, con TypeScript y compilación Vite/PWA completados.
- **Advertencia conservada:** bundle principal de 632,90 kB / 185,52 kB gzip, superior al umbral de 500 kB. No se ocultó modificando el límite del aviso.
- **16 casos nuevos Demo preparados**, más adaptación de los casos Auth: perfil/nulos, lista/vacío, creación, validación, 409, 401/403/503, detalle 404, foco/Escape, responsive/oscuro, doble envío y logout entre pestañas durante creación.
- **Playwright no ejecutado:** `test:auth` y `test:pwa` permanecen pendientes de autorización expresa; no declarar aprobados esos casos.
- Pendientes: revisión visual móvil/escritorio y claro/oscuro, pruebas funcionales, integración real del API, instalación por dispositivo y validación RLS con dos usuarios.
- Sin cambios en `.env`, claves, dependencias o backend; sin comandos Git, migraciones remotas ni despliegue.

Detalle de decisiones, implementación y límites: [docs/WORKSPACES.md](docs/WORKSPACES.md). Instrucciones de continuidad: [AGENTS.md](AGENTS.md) y [fase vigente del plan](docs/PLAN.md#workspaces-vigente).

## Especificación de referencia

Las secciones siguientes conservan los contratos y criterios usados para implementar esta fase. No son una nueva orden de reconstrucción ni autorización para ejecutar Playwright.

## Objetivo

Objetivo implementado: integrar en `nuvora-web` los endpoints actuales de perfil y workspaces de
`nuvora-api`, con una experiencia inicial para ver el perfil, consultar los espacios
de trabajo, crear uno nuevo y seleccionar su contexto autorizado.

Para futuras correcciones de esta fase:

1. Leer `AGENTS.md`, `README.md` y la documentación relevante dentro de
   `docs/`.
2. Leer la documentación coordinada del API:
   `../nuvora-api/docs/frontend-handoff.md`,
   `../nuvora-api/docs/multi-tenant-foundation.md` y los contratos actuales.
3. Leer y aplicar `.opencode/skills/ui-ux-pro-max/SKILL.md`.
4. Inspeccionar los componentes, tokens y patrones existentes antes de crear
   nuevos.

## API base

`VITE_API_BASE_URL` debe contener únicamente el origen del API:

```text
https://nuvora-api-pil.onrender.com
```

No agregar `/api`, `/api/v1` ni una barra final. El cliente HTTP existente debe
construir las rutas versionadas.

Todas las rutas de este documento requieren:

```http
Authorization: Bearer <access_token>
```

El SDK oficial de Supabase es el único responsable de obtener y renovar la
sesión. El frontend no debe guardar tokens manualmente ni implementar un
refresh paralelo.

## Endpoints disponibles

### 1. Consultar el perfil autenticado

```http
GET /api/v1/profile
```

Devuelve el perfil de la identidad autenticada. Respuesta esperada:

```json
{
  "profile": {
    "id": "uuid",
    "display_name": "Nombre visible",
    "avatar_url": "https://...",
    "locale": "es-GT",
    "timezone": "America/Guatemala",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

`display_name` y `avatar_url` pueden ser `null`. El nombre y avatar de Google
son datos de presentación, no permisos ni identidad fiscal.

Estados relevantes:

- `200`: perfil obtenido.
- `401 UNAUTHORIZED`: sesión ausente o inválida.
- `404 PROFILE_NOT_FOUND`: el perfil todavía no existe.
- `503 PROFILE_PROVIDER_ERROR`: proveedor no disponible.

### 2. Listar workspaces accesibles

```http
GET /api/v1/workspaces
```

Devuelve únicamente workspaces donde el usuario tiene una membresía activa.

Respuesta esperada:

```json
{
  "workspaces": [
    {
      "id": "uuid",
      "owner_id": "uuid",
      "name": "Despacho Demo",
      "slug": "despacho-demo",
      "created_at": "timestamp",
      "updated_at": "timestamp",
      "role": "owner"
    }
  ]
}
```

La lista puede estar vacía. No mostrar workspaces de otros usuarios ni asumir
que conocer un `workspaceId` concede acceso.

### 3. Crear un workspace

```http
POST /api/v1/workspaces
Content-Type: application/json
```

Body permitido:

```json
{
  "name": "Despacho Demo",
  "slug": "despacho-demo"
}
```

Reglas:

- `name`: entre 2 y 160 caracteres.
- `slug`: minúsculas, números y guiones; formato `despacho-demo`.
- No enviar `owner_id`, `userId` ni IDs de otro usuario.
- El backend deriva el propietario del Bearer autenticado.

Respuesta exitosa: `201`.

```json
{
  "workspace": {
    "id": "uuid",
    "owner_id": "uuid",
    "name": "Despacho Demo",
    "slug": "despacho-demo",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

Estados relevantes:

- `201`: workspace creado.
- `400 VALIDATION_ERROR`: datos inválidos.
- `401 UNAUTHORIZED`: sesión ausente o inválida.
- `409 WORKSPACE_SLUG_CONFLICT`: slug ya utilizado.
- `503 WORKSPACE_PROVIDER_ERROR`: proveedor no disponible.

### 4. Consultar un workspace específico

```http
GET /api/v1/workspaces/:workspaceId
```

`workspaceId` debe ser un UUID. Solo responde si el usuario tiene membresía
activa; de lo contrario devuelve `404 WORKSPACE_NOT_FOUND` para no revelar la
existencia de recursos ajenos.

Respuesta esperada:

```json
{
  "workspace": {
    "id": "uuid",
    "owner_id": "uuid",
    "name": "Despacho Demo",
    "slug": "despacho-demo",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  },
  "role": "owner"
}
```

## Reglas de implementación frontend

- Usar Axios y TanStack Query existentes.
- Centralizar tipos en `src/features/workspace/types`.
- Centralizar transporte en `src/features/workspace/api`.
- Las query keys deben incluir el usuario/contexto cuando corresponda.
- Limpiar/cancelar consultas al cerrar sesión o cambiar de usuario.
- Evitar doble envío al crear un workspace.
- Mostrar estados de carga, vacío, error, reintento y éxito.
- Tratar `401`, `403`, `404`, `409` y `503` con mensajes seguros.
- No consultar directamente tablas de Supabase.
- No usar nombres, avatares o NIT para autorización.
- No inventar todavía entidades, clientes, documentos, libros ni portal.

## Diseño y UX

Mantener sin cambios la identidad visual ya trabajada por el propietario del
proyecto: colores, tokens, dark mode, splash, PWA, navegación y componentes
existentes. No introducir otra paleta, gradientes ni estilos globales nuevos.

La nueva interfaz debe reutilizar el sistema actual y aplicar la skill
`ui-ux-pro-max` para:

- Jerarquía visual clara.
- Responsive móvil/escritorio.
- Foco visible y navegación por teclado.
- Labels y mensajes accesibles.
- Estados de carga, vacío, error y permisos.
- Confirmación clara al crear un workspace.
- Contexto del workspace seleccionado visible y preparado para futuras vistas.

## Pruebas

Casos solicitados, ya preparados en las pruebas mockeadas (sin ejecutar):

- Perfil cargado correctamente.
- Perfil sin avatar o nombre.
- Lista con workspaces.
- Lista vacía.
- Creación exitosa.
- Validación de nombre y slug.
- Slug duplicado (`409`).
- Sesión inválida (`401`).
- Error del proveedor (`503`).

Verificaciones ya ejecutadas en el cierre de esta fase:

```bash
npm run lint
npm run build
```

Ambas aprobaron. `npm run test:auth` y `npm run test:pwa` usan Playwright y no se ejecutaron. No ejecutar Playwright sin autorización explícita. Esta actualización es solo documental y no volvió a ejecutar verificaciones de código.

## Límites actuales

- El API ya tiene los endpoints descritos, pero la validación RLS real con dos
  usuarios todavía debe realizarse en Supabase.
- El SQL de foundation multi-tenant y metadata de proveedor se ejecuta
  manualmente en Supabase; no asumir que una instalación nueva ya lo contiene.
- `entity_memberships`, invitaciones y documentos todavía no tienen contrato implementado. Entidades/clientes sí tienen los cuatro contratos de la fase siguiente, ya integrados en el frontend.

## Especificación de la fase entidades/clientes — implementada

Esta fase tiene contratos backend implementados y su frontend ya está entregado, según el estado actual de este archivo. Para correcciones, Codex debe trabajar
únicamente en este repositorio (`nuvora-web`). No modificar `nuvora-api`, SQL,
backend, `.env`, secretos, Git, commits, pushes ni despliegues.

Antes de editar, leer este archivo, `AGENTS.md`, la documentación relevante de
`docs/` y aplicar obligatoriamente:

```text
.opencode/skills/ui-ux-pro-max/SKILL.md
```

Integrar estos endpoints usando Axios, TanStack Query y la sesión Supabase ya
existentes:

```text
GET   /api/v1/workspaces/:workspaceId/entities
POST  /api/v1/workspaces/:workspaceId/entities
GET   /api/v1/workspaces/:workspaceId/entities/:entityId
PATCH /api/v1/workspaces/:workspaceId/entities/:entityId
```

### Funcionalidad frontend

- Lista de clientes/entities del workspace activo.
- Estado vacío, carga, error y reintento.
- Crear cliente con `{ legalName, taxId? }`.
- Ver detalle y editar `legalName` y `taxId`.
- Validar campos antes de enviar y evitar doble envío.
- Manejar `401`, `403`, `404`, `409` y `503` con mensajes seguros.
- No consultar entities hasta confirmar un workspace activo.
- Reutilizar la selección y el contexto de workspace existentes.
- Mostrar el NIT completo solo si el API lo devuelve autorizado; respetar el
  valor enmascarado y no reconstruirlo.

### Reglas de dominio

- Una entity puede estar asociada a varios workspaces.
- El NIT no es permiso, selector de autorización ni identificador global único.
- No implementar grants, invitaciones, `entity_memberships`, portal,
  documentos FEL, libros ni módulos financieros en esta fase.
- No inventar endpoints ni modificar contratos del API.

### Diseño y pruebas

- Mantener sin cambios la paleta, tokens, dark mode, splash, PWA y layout
  existentes.
- Reutilizar componentes y patrones de la fase workspaces; no crear otra
  identidad visual ni estilos globales innecesarios.
- Mantener foco, teclado, responsive y estados accesibles.
- Agregar pruebas mockeadas para lista, lista vacía, creación, edición, detalle,
  validación, `401`, `403`, `404`, `409` y `503`.
- No ejecutar Playwright sin autorización explícita.
- Ejecutar `npm run lint` y `npm run build`.

## Flujo cliente aislado — frontend implementado; contrato de lectura bloqueado

El modelo vigente separa al contador del cliente:

```text
Contador → workspace_membership
Cliente  → entity_membership directa
```

Después de aceptar una invitación, el cliente **no** debe intentar cargar ni
seleccionar el workspace completo del contador. Si el frontend llama a:

```text
GET /api/v1/workspaces/:workspaceId
```

para el usuario cliente, puede recibir correctamente `404 WORKSPACE_NOT_FOUND`,
porque no tiene `workspace_membership`. No solucionar esto creando membresías de
workspace ni modificando el API.

### Flujo esperado

1. El cliente abre `/invitations/accept?token=...`.
2. Inicia sesión o se registra con cualquier correo/proveedor.
3. Si OAuth redirige fuera de la página, conservar el flujo seguro para que el
   usuario pueda volver a abrir el enlace original sin perder la invitación.
4. El cliente confirma la invitación.
5. El API crea únicamente `entity_membership`.
6. El frontend redirige a una pantalla propia de cliente, por ejemplo:
   `/client/entities/:entityId`.
7. Esa pantalla carga solo el contexto de la entity autorizada y no muestra la
   lista general de workspaces del contador.

### Pantalla inicial del cliente

Crear una pantalla protegida y responsive que muestre inicialmente:

- Nombre de la empresa/entity.
- Rol del usuario en esa entity.
- Workspace/despacho como contexto informativo mínimo, sin otorgar permisos.
- Estado de acceso y bienvenida.
- Área preparada para cargar XML, PDF, imágenes/fotos y gastos en fases futuras.
- Estados de carga, error, sesión inválida, entity no disponible y reintento.

No implementar todavía procesamiento IA, documentos ni reportes; solo preparar
la estructura sin inventar datos ni endpoints.

### Reglas de autorización frontend

- No usar `GET /workspaces` para resolver el acceso del cliente.
- No asumir que el cliente es miembro del workspace.
- Usar el `workspaceId` y `entityId` devueltos por la aceptación únicamente como
  contexto; el API sigue siendo la autoridad.
- No guardar tokens de invitación ni credenciales.
- Limpiar el token de la URL después de capturarlo/aceptarlo.
- Si un endpoint existente no permite consultar la entity a un usuario con
  `entity_membership`, no modificar el API: documentar el bloqueo exacto para
  revisión posterior.
- No agregar datos simulados que parezcan clientes, facturas o permisos reales.

### Criterios de aceptación

- Un contador sigue viendo su pantalla de workspaces sin cambios.
- Un cliente aceptado no ve workspaces del despacho como propios.
- Un cliente puede llegar a su pantalla de entity sin recibir `WORKSPACE_NOT_FOUND`
  por intentar cargar el workspace completo.
- Un usuario sin invitación no puede entrar a la pantalla de cliente.
- Logout y cambio de usuario limpian el contexto anterior.
- La pantalla funciona en claro/oscuro y móvil/escritorio usando los tokens
  existentes.

### Identificación y experiencia del usuario cliente

Un usuario se considera cliente por una fila activa en
`entity_memberships`, no por su correo, NIT, metadata de Google ni por
`auth.users` directamente.

```text
user_id → entity_id → workspace_id → role → status
```

La interfaz debe distinguir:

- **Miembro del despacho:** tiene `workspace_membership` y puede usar el área
  de workspaces según su rol.
- **Cliente de una entity:** tiene `entity_membership` activa y debe entrar al
  portal de esa entity, sin ser miembro del workspace del contador.

El portal cliente no debe mostrar ni permitir:

- Crear workspaces.
- Seleccionar o administrar workspaces del despacho.
- Crear o gestionar otros clientes.
- Invitar usuarios del despacho.
- Administrar permisos generales.

El cliente debe entrar directamente a su entity y posteriormente podrá:

- Registrar gastos.
- Cargar XML, PDF o fotografías de facturas.
- Consultar el estado de sus documentos.
- Ver observaciones y reportes autorizados.

Roles actuales de `entity_memberships`:

- `client_owner`: titular/responsable de la entity; no es owner del workspace.
- `client_contributor`: puede colaborar con información de la entity cuando
  el endpoint correspondiente lo permita.
- `client_viewer`: solo consulta información autorizada.

El rol debe venir del API. No convertir un rol de cliente en permisos de
workspace desde el frontend. Si una acción todavía no tiene endpoint o permiso
backend, mostrarla como pendiente o no mostrarla; no simularla.

## Descubrimiento de acceso al iniciar sesión

El API dispone de este endpoint para detectar clientes sin
`workspace_membership`:

```http
GET /api/v1/profile/entities
```

Requiere Bearer y devuelve únicamente memberships directas activas cruzadas
con grants activos `can_view`:

```json
{
  "entity_memberships": [
    {
      "workspace_id": "uuid",
      "entity_id": "uuid",
      "role": "client_viewer",
      "entity": {
        "id": "uuid",
        "kind": "tax_entity",
        "legal_name": "Cliente Demo",
        "taxId": "*****789",
        "permissions": {
          "can_view": true,
          "can_upload": true,
          "can_review": false,
          "can_manage": false
        }
      }
    }
  ]
}
```

### Reglas de entrada

- Consultar este endpoint después de que la sesión esté autenticada.
- No usar `GET /workspaces` como única forma de decidir el dashboard.
- Usuario contador: tiene workspaces activos y debe ver el dashboard de
  workspaces.
- Usuario cliente: puede no tener workspaces, pero sí memberships en
  `/profile/entities`; debe entrar directamente a su portal entity y nunca al
  formulario de crear workspace.
- Usuario sin workspaces ni entity memberships: puede ver el flujo de crear
  workspace, si corresponde a la experiencia actual.
- Usuario con ambos tipos de acceso: no elegir silenciosamente; mostrar una
  elección clara entre continuar al área de despacho o al portal de cliente.
- No guardar tokens ni convertir la respuesta en autorización local: el API
  sigue validando cada petición.
- Al cerrar sesión, limpiar el contexto y las queries de ambos perfiles.

El endpoint no requiere SQL adicional. Fue validado en backend con usuarios
con membership, sin membership, acceso revocado, entidad ajena y error de
proveedor. El backend no debe modificarse para esta integración frontend.

Documentar la decisión y el flujo final en este archivo y en la documentación
frontend relevante cuando termine la implementación.

## Fase adicional autorizada: invitaciones y compartir enlace

El backend ya implementó estos contratos. Codex debe integrarlos únicamente en
`nuvora-web`; no modificar `nuvora-api`, SQL, backend, `.env`, secretos, Git,
commits, pushes ni despliegues.

### Endpoints de entidades ya disponibles

```text
GET   /api/v1/workspaces/:workspaceId/entities
POST  /api/v1/workspaces/:workspaceId/entities
GET   /api/v1/workspaces/:workspaceId/entities/:entityId
PATCH /api/v1/workspaces/:workspaceId/entities/:entityId
```

Crear entity:

```json
{
  "legalName": "Cliente Demo, S. A.",
  "taxId": "1234567-8"
}
```

Editar acepta `legalName` y `taxId`; `taxId: null` elimina el NIT si el API
autoriza la operación. El NIT puede aparecer enmascarado. No reconstruirlo ni
usarlo como autorización.

### Crear invitación

```http
POST /api/v1/workspaces/:workspaceId/entities/:entityId/invitations
```

Body actual:

```json
{
  "role": "client_owner"
}
```

Roles disponibles:

```text
client_owner
client_contributor
client_viewer
```

El API verifica permisos, entity y workspace. La invitación no depende de un
correo destinatario. El frontend no debe crear usuarios ni memberships
directamente, ni mostrar o guardar tokens en almacenamiento persistente.

### Validar y aceptar invitación

```http
GET  /api/v1/invitations/:token
POST /api/v1/invitations/:token/accept
```

La aceptación requiere sesión Bearer. El usuario autenticado puede utilizar el
correo que prefiera; el acceso se concede únicamente a la entity de la
invitación. El frontend debe:

1. Leer el token únicamente de la URL de callback.
2. Mostrar una pantalla de invitación válida, expirada, revocada o usada.
3. Pedir iniciar sesión o registrarse si no hay sesión.
4. Después de autenticarse, llamar a `POST .../accept`.
5. Limpiar el token de la URL y no guardarlo en localStorage, Query cache,
   analytics, logs ni errores.
6. Redirigir al workspace/entity autorizado solo después de una respuesta exitosa.

No asumir que ver una invitación concede acceso: el API debe confirmarlo.
El enlace es un bearer link: cualquiera que lo posea puede intentar aceptarlo,
por lo que debe compartirse únicamente con el destinatario correcto.

### Consultar y revocar memberships

```http
GET   /api/v1/workspaces/:workspaceId/entities/:entityId/memberships
PATCH /api/v1/workspaces/:workspaceId/entities/:entityId/memberships/:membershipId/revoke
```

Estas vistas son administrativas. Mostrar solo las acciones que el API permita,
pero recordar que ocultar botones no sustituye autorización del backend.
La revocación no debe presentarse como eliminación permanente del historial.

### Generar enlace para compartir

```http
POST /api/v1/workspaces/:workspaceId/entities/:entityId/invitations/:invitationId/share-link
```

Uso:

- Acción explícita del contador autorizado.
- Requiere permiso administrativo/`can_manage` según el API.
- El API rota el token e invalida el enlace anterior.
- El enlace se devuelve únicamente en esa respuesta.
- No guardar el enlace en almacenamiento persistente ni enviarlo a analytics.
- No mostrarlo en logs ni incluirlo en mensajes de error.
- Si la invitación está expirada, usada o revocada, mostrar el estado seguro
  recibido (`410 INVITATION_UNAVAILABLE`).

El frontend puede ofrecer:

1. **Copiar enlace:** Clipboard API y confirmación accesible.
2. **Compartir por WhatsApp:** abrir una URL externa construida con
   `https://wa.me/?text=${encodeURIComponent(message + "\\n" + acceptUrl)}`.
3. **Compartir móvil:** Web Share API cuando esté disponible, con fallback a
   copiar enlace.

No enviar automáticamente mensajes sin acción del usuario. Advertir que
cualquiera con el enlace puede intentar iniciar la aceptación y que debe
compartirse únicamente con el destinatario correcto.
El backend no usa SMTP ni envía correos; el enlace se genera para copiarlo o
compartirlo manualmente.

## Cambio de contrato vigente: no usar correo ni SMTP

El flujo anterior basado en email destinatario quedó reemplazado por
invitaciones link-only. Si existe código frontend que todavía:

- solicite un email para crear la invitación;
- muestre estados de envío de correo;
- dependa de Nodemailer, SMTP o entrega por email;
- compare el email del usuario con un email guardado en la invitación;

debe revertirse o adaptarse para usar únicamente `{ role }`, enlace compartible
y aceptación por cualquier usuario autenticado. No inventar una alternativa ni
implementar una nueva fase sin instrucciones posteriores del propietario.

Después de dejar el frontend coherente con este contrato, detener el trabajo y
esperar la siguiente indicación. No implementar todavía documentos, IA, grants
adicionales ni nuevas pantallas.

### Estados y seguridad

Manejar de forma segura:

- `401`: iniciar sesión o pedir autenticación.
- `403`: no tienes permisos.
- `404`: recurso no disponible.
- `409`: conflicto de datos o invitación existente.
- `410`: invitación expirada, revocada o ya utilizada.
- `429`: demasiadas solicitudes; no reintentar automáticamente compartir.
- `503`: proveedor no disponible.

No mostrar tokens, NIT completo no autorizado, passwords, Bearer ni datos
internos del proveedor. No consultar tablas Supabase directamente.

### UX requerida

- Lista y detalle de entidades dentro del workspace confirmado.
- Acciones de invitar, consultar miembros y compartir solo cuando corresponda.
- Formularios con labels, validación, foco, teclado y prevención de doble envío.
- Estados de carga, vacío, éxito, error, expiración y permiso.
- Confirmación antes de revocar una membresía.
- Diseño responsive para móvil y escritorio.
- Mantener exactamente la paleta, tokens, dark mode, splash, PWA y layouts
  existentes; no crear una nueva identidad visual.
- Leer y aplicar `.opencode/skills/ui-ux-pro-max/SKILL.md` antes de editar.

### Pruebas frontend

Agregar mocks para:

- Lista/creación/edición/detalle de entities.
- Crear invitación.
- Invitación válida, expirada, revocada y usada.
- Usuario sin sesión y aceptación por cualquier usuario autenticado, sin comparación de email.
- Aceptación exitosa.
- Listado y revocación de membership.
- Generación de share-link y rotación.
- Copiar enlace, WhatsApp y Web Share con fallback.
- `401`, `403`, `404`, `409`, `410`, `429` y `503`.
- Limpieza del token de la URL y ausencia de almacenamiento persistente.

Ejecutar en `nuvora-web`:

```bash
npm run lint
npm run build
```

No ejecutar Playwright sin autorización explícita.
