# Estado consolidado — Nuvora Web

Actualizado el 2026-11-12 tras la reorganización de la administración de clientes
y la solicitud del propietario de consolidar la documentación. Este resumen
describe el código entregado y la evidencia disponible; los cierres anteriores
de codex.md y del plan conservan valor histórico.

## Producto y jerarquía

**Espacio de trabajo → múltiples clientes/entities → múltiples personas por entidad.**
Las membresías de entidad y de workspace son diferentes. Aceptar una invitación
de cliente no incorpora a la persona al equipo del despacho. La entidad puede
estar asociada a varios espacios según los contratos actuales; no se impuso una
relación exclusiva ni se usó NIT como identidad o autorización.

El propietario dio conformidad a la reorganización y pidió documentar su estado.
Esto no se registra como prueba visual o funcional del producto en navegador.

## Funcionalidades entregadas

| Área | Estado del frontend | Evidencia y límites |
| --- | --- | --- |
| Autenticación | Login, registro, Google, recuperación, sesión SDK y logout implementados | Hay confirmaciones históricas del propietario sobre flujos reales; no equivalen a una regresión del estado actual |
| Continuidad de sesión | Eventos repetidos del mismo usuario verificado conservan UI/caché | Caso Demo preparado; validación automatizada actual pendiente |
| Perfil | Lectura de identidad, avatar/fallback, idioma y zona horaria | No incluye edición de perfil |
| Workspaces | Lista, búsqueda desde el primer espacio, alta en diálogo y contexto confirmado por API | Seleccionar no autoriza; consultas y datos aislados por contexto |
| Cartera de clientes | Listado, búsqueda por nombre, filtro local por acceso, alta y detalle | Solo después de confirmar workspace; permisos y NIT dependen del API |
| Datos del cliente | Cabecera con nombre, ficha por filas y edición de campos cambiados | NIT mantener/cambiar/quitar explícitos; fechas en Información de registro |
| Protección del borrador | Bloqueo de navegación SPA y aviso nativo al recargar/cerrar | Implementado con data router; comportamiento en navegador pendiente de probar |
| Personas y accesos | Listado al visitar, búsqueda por nombre/rol, filtro activos/todos/revocados y detalles por registro | Owner/admin del workspace y canManage de entity; revocación con confirmación |
| Invitaciones | Creación link-only, compartir inmediato, historial por estado y revocación | Enviar solo `{ role }`; aceptación no prueba acceso activo actual |
| Enlaces sensibles | Estado React efímero, URL controlada por resultado y limpieza al salir/cerrar | Fuera de Query/Mutation cache, logs y storage persistente; excepción OAuth descrita abajo |
| Entrada por tipo de acceso | Descubrimiento mediante `/profile/entities` y workspaces; elección explícita si hay ambos accesos | Sin accesos conserva el flujo de crear espacio; errores no se convierten en lista vacía |
| Cliente invitado | Shell separado y consulta autorizada mediante `/profile/entities` | No consulta el workspace general ni crea workspace_membership; integración real actual pendiente |
| Sistema visual | Paleta índigo/azul/slate, temas, escala común, controles y estados coherentes | Revisión visual actual y auditoría integral de accesibilidad pendientes |
| PWA | Identidad, instalación, actualización y shell estático existentes conservados | La generación de build funciona; instalación, offline y actualización reales no se volvieron a validar |

## Organización y rutas actuales

| Ruta | Responsabilidad |
| --- | --- |
| `/` | Selección de contexto y espacios |
| `/workspaces/:workspaceId/clients` | Cartera del workspace confirmado |
| `/workspaces/:workspaceId/clients/:entityId` | Datos del cliente y edición |
| `/workspaces/:workspaceId/clients/:entityId/people` | Personas y accesos de esa entity |
| `/workspaces/:workspaceId/clients/:entityId/invitations` | Invitaciones de esa entity |
| `/account` | Perfil de lectura |
| `/client/entities/:entityId?workspaceId=:workspaceId` | Área independiente del cliente invitado |
| `/invitations/accept` | Validación y aceptación explícita de una invitación |

Las rutas Auth existentes se conservan. El callback de invitación captura y
limpia el token antes del Router. La navegación del contador usa enlaces reales
con historial; el submenú del cliente no añade otro sidebar ni pestañas de módulos
todavía inexistentes.

## Trabajo de diseño y arquitectura

Se aplicó emil-design-eng y se leyó la guía local de UI/UX Pro Max. No se instaló
Python y no se atribuyeron resultados al buscador no disponible en estas entregas.

El rediseño común centralizó tipografía, ritmo, radios, elevación y movimiento;
mejoró formularios, estados, listados, búsqueda y navegación. El último refactor
separó `EntityHeader`, `EntityDataSection`, `EntityDraftGuard`, `EntityMembersPage`,
`EntityInvitationsPage`, identidad compartida y diálogo de revocación. El antiguo
`EntityAccessPanel` se retiró. Los UUID quedan en detalles por registro y la
aceptación histórica se muestra separada de la membresía actual.

`createBrowserRouter` y `RouterProvider` sustituyen el wrapper BrowserRouter de
la misma dependencia para habilitar `useBlocker`. `AppRoutes`, Auth SDK y Query
se conservan; no hay nuevos loaders remotos ni dependencias. El cambio aumentó
el bundle, que mantiene el aviso de tamaño. Detalles: [CLIENT-ADMINISTRATION.md](CLIENT-ADMINISTRATION.md).

## Seguridad y contratos conservados

- API como autoridad de acceso; no se autoriza mediante nombre, avatar, correo, NIT o selección.
- Queries por usuario/workspace/entity y cancelación/limpieza al cambiar de contexto o sesión.
- Sin reintentos automáticos de escrituras; abortar HTTP no revierte una operación ya aceptada.
- Solo roles y contratos existentes; sin destinatario ni entrega por correo en invitaciones.
- Enlaces nuevos se copian/comparten desde su respuesta. El historial no recupera tokens ni acceptUrl.
- Cerrar resultado o salir de Invitaciones limpia el enlace local; no revoca por sí mismo la invitación remota.
- Revocar membresía o invitación requiere confirmación y conserva el historial.
- OAuth de invitación usa únicamente el sobre tab-scoped de sessionStorage con TTL de 10 minutos, validado y limpiado al terminar/cancelar/expirar; no es autorización.
- Sin cambios en backend, SQL, secretos, entornos, dependencias o Git durante estas entregas.

El antiguo 404 de `getEntity` para una cuenta sin workspace_membership es un
antecedente del GET anidado. La entrada aislada actual consume `/profile/entities`.
Esto documenta la implementación frontend presente; no certifica el aislamiento
real del servidor con dos usuarios.

## Verificaciones reales

Último cierre de código registrado, después de la administración por secciones:

| Comprobación | Resultado |
| --- | --- |
| `npm run lint` | Salida 0, sin errores ni avisos |
| `npm run build` | Salida 0; TypeScript, Vite y generación PWA completos |
| CSS generado | 60,39 kB; 11,77 kB gzip |
| JS principal | 764,33 kB; 221,16 kB gzip |
| Aviso de bundle | Sigue presente: chunk superior a 500 kB |
| Casos Demo | Suites adaptadas y cinco casos nuevos de navegación, borrador, viewer y múltiples personas; sin ejecutar |
| Playwright | No ejecutado; requiere autorización expresa |
| Revisión visual | Pendiente; el intento del rediseño anterior no produjo una captura válida de la aplicación |
| API/RLS reales | Sin nueva certificación de integración ni aislamiento con dos usuarios |

La actualización documental posterior no volvió a ejecutar lint/build ni pruebas.
Se revisaron consistencia, referencias locales y correspondencia con los archivos
existentes; no se detectaron enlaces a archivos faltantes en la revisión documental.
Las cifras anteriores pertenecen al último cierre de código, no a una
nueva ejecución motivada por editar Markdown.

## Pendientes y fases futuras

1. Aceptación visual en móvil/escritorio, claro/oscuro, teclado, foco y movimiento reducido.
2. Validación funcional de navegación directa, recarga, Atrás/Adelante y protección del borrador.
3. Ejecutar los casos Demo cuando el propietario autorice Playwright; no ejecutar `test:auth` o `test:pwa` automáticamente.
4. Integración real de roles, aceptación, revocación, expiración, cambio de usuario/espacio y aislamiento entre entidades, coordinada con el propietario del API.
5. Revalidar instalación, actualización y shell offline de la PWA en dispositivos reales.
6. Evaluar la división del bundle en un trabajo de rendimiento autorizado; no se implementó en esta entrega.

Documentos/facturas XML, PDF, fotografías, captura manual, extracción, clasificación,
revisión, libros, períodos, exportaciones y módulos financieros siguen pendientes
de sus fases/contratos. La futura factura pertenecerá a la entity y conservará la
autoría del colaborador que la cargue; no se construyeron pantallas ni endpoints
para simular ese flujo.

## Mapa documental

| Documento | Uso |
| --- | --- |
| [codex.md](../codex.md) | Último cierre e historial de entregas |
| [PLAN.md](PLAN.md) | Secuencia y fases; sección 19 para el último refactor |
| [CLIENT-ADMINISTRATION.md](CLIENT-ADMINISTRATION.md) | Submenú, componentes, rutas, borrador y accesos del contador |
| [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) | Tokens, composición y decisiones de movimiento |
| [ACCESS.md](ACCESS.md) | Contratos, invitaciones, membresías y enlaces |
| [ENTITIES.md](ENTITIES.md) | Cartera, NIT y permisos de entidades |
| [WORKSPACES.md](WORKSPACES.md) | Perfil y contexto de workspace |
| [ROUTING.md](ROUTING.md) / [NAVIGATION.md](NAVIGATION.md) | Rutas, shell y menú responsive |
| [CLIENT.md](CLIENT.md) | Shell y descubrimiento del cliente invitado |
| [PALETTE.md](PALETTE.md) / [PALETTE-CONTRAST.md](PALETTE-CONTRAST.md) | Paleta y cálculos de contraste registrados |
| [SESSION-CONTINUITY.md](SESSION-CONTINUITY.md) | Continuidad del usuario verificado |

Los antecedentes no sustituyen el estado inicial de cada documento ni autorizan
restaurar diseños anteriores o avanzar fases futuras.
