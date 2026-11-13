# Estado vigente — cliente aislado y enlaces compactos, 2026-11-12

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

- Administración de accesos en detalle del cliente para owner/admin con canManage: invitación por correo y rol directo, entrega sent/not_configured diferenciada, membresías y revocación con confirmación/historial.
- Compartir por acción explícita: generación/rotación del enlace, advertencia de invalidación anterior, copiar con feedback/fallback, WhatsApp y Web Share. Sin mensajes automáticos ni enlaces en almacenamiento/caché/analytics/logs.
- Callback /invitations/accept: token capturado y URL limpiada antes de Router, acceso/registro sin persistirlo, inspección autenticada, estados pending/expired/revoked/accepted, error de correo y aceptación explícita. Redirección al contexto del API solo tras POST exitoso; la ruta vuelve a comprobar permisos.
- Consultas por usuario/workspace/entity y cancelación/descartes al desmontar o limpiar sesión; operaciones sensibles sin Mutation cache ni retries. Tokens solo en memoria de la visita, errores saneados.
- UI/UX Pro Max aplicada; ficha minimalista, tokens y temas preservados. Solo ajustes de seguridad PWA: referrer no-referrer y callback fuera del fallback offline; sin rediseño de instalación/splash.
- Mocks adicionales preparados, **sin ejecutar Playwright**. Las pruebas existentes de entidades reutilizan la fixture extraída; no se rehizo su funcionalidad.

**Límites explícitos:** API no lista invitaciones existentes ni nombres/correos de memberships; UI muestra invitaciones creadas en la vista actual e identificadores de cuenta. Google/confirmación/recarga requieren reabrir enlace original para no persistir token. Enlace devuelto debe corresponder a esta origin y /invitations/accept. Integración real, SMTP, SQL 004/005, RLS y validación visual siguen pendientes; no se tocaron remotamente.

Detalles de contratos, archivos, seguridad y resultados en [docs/ACCESS.md](docs/ACCESS.md). **Lint y build aprobados (salida 0)**, con TypeScript y generación Vite/PWA completados. También aprobó la comprobación de tipos de los mocks mediante tsc --noEmit, sin ejecutar Playwright. JS 679,33 kB / 197,31 kB gzip; CSS 43,49 kB / 9,15 kB gzip. Permanece el aviso de chunk superior a 500 kB. 24 casos Demo nuevos preparados, no ejecutados. No avanzar portal/FEL/libros u otra fase mayor sin indicación. Los apartados históricos que prohíben invitaciones/memberships quedaron sustituidos por la fase adicional autorizada, cuya especificación se conserva al final de este documento.

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

| Responsabilidad | Ubicación |
| --- | --- |
| Contratos, transporte y queries de clientes | `src/features/entities/types/`, `api/` |
| Cartera, detalle y formularios | `src/features/entities/components/` |
| Validación y NIT de presentación | `src/features/entities/utils/entityPresentation.ts` |
| Estilos locales | `src/features/entities/entities.module.css` |
| Integración con el espacio activo | `src/features/workspace/pages/WorkspacePage.tsx` |
| Transporte compartido y UUID | `src/shared/api/authenticatedRequest.ts`, `src/shared/utils/identifiers.ts` |
| Compatibilidad de workspace | `src/features/workspace/api/workspaceApi.ts` |
| Pruebas nuevas y fixture adaptada | `tests/auth/entities.spec.ts`, `tests/auth/workspace.spec.ts` |

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

| Responsabilidad | Ubicación |
| --- | --- |
| Tipos y contratos | `src/features/workspace/types/workspace.types.ts` |
| Transporte y errores | `src/features/workspace/api/workspaceApi.ts` |
| Queries, mutación y límites de caché | `src/features/workspace/api/useWorkspaceQueries.ts` |
| Pantalla inicial protegida | `src/features/workspace/pages/WorkspacePage.tsx` |
| Layout, cuenta, perfil, avatar, feedback y diálogo | `src/features/workspace/components/` |
| Presentación y validación | `src/features/workspace/utils/workspacePresentation.ts` |
| Estilos locales | `src/features/workspace/workspace.module.css` |
| Separación de rutas públicas/privadas | `src/app/routes.tsx` |
| Familia de iconos existente ampliada | `src/shared/ui/components/Icon.tsx` |
| Casos mockeados nuevos | `tests/auth/workspace.spec.ts` |
| Regresiones Auth adaptadas | `tests/auth/auth.spec.ts` |

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
