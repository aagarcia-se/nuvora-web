# Cliente aislado por entity_membership — 2026-11-12

## Estado real

Frontend de entrada aislada implementado; **lectura real de la empresa bloqueada por el contrato actual del API**. No declarar el flujo de datos completo ni probado con cuentas reales. Se cumplió la instrucción de no corregirlo en backend ni crear workspace_membership. Solo nuvora-web; sin API/SQL/env/secretos/Git/migraciones/despliegue ni dependencias nuevas.

## Hallazgo exacto del API (lectura solamente)

El único endpoint documentado para detalle es `GET /api/v1/workspaces/:workspaceId/entities/:entityId`. En `nuvora-api/src/modules/entities/entity.service.ts`, `getEntity` llama primero a `findWorkspaceMembership(userId, workspaceId)` y responde `404 ENTITY_NOT_FOUND` si no existe; solo después contempla membresías directas en la rama viewer. El router de app.ts solo expone entities bajo workspaces/:workspaceId/entities. No existe un contrato publicado alternativo de consulta del cliente aislado ni un contrato para resolver su rol/nombre del despacho actuales sin workspace_membership.

La aceptación vigente crea solo entity_membership. Por tanto, una cuenta de cliente correctamente aceptada puede ser rechazada por ese GET aunque su membresía directa sea activa. La web no añade membresías, no elude autorización con Supabase/Storage ni inventa un endpoint. No se ejecutó prueba real ni se cambió ese código del API. Debe coordinarse un contrato autorizado por entity_membership antes de declarar resuelta la lectura. No se ejecutaron SQL, incluida la migración 009 indicada en handoff.

## Ruta y separación

POST accept exitoso redirige a `/client/entities/:entityId?workspaceId=:workspaceId`. UUIDs son contexto público para construir el endpoint existente; nunca permiso. La ruta tiene guard de sesión independiente del shell/boundary de contador y no carga GET workspaces, detalle del workspace, listas de clientes o membresías administrativas.

Cliente tiene cabecera propia, cuenta/apariencia/logout, banner PWA existente y contenido de una empresa. Sin menú de despachos, Crear espacio, cartera, invitaciones, edición administrativa o enlaces a /account del contador. WorkspaceAccount conserva el comportamiento original para contadores; en cliente omite su enlace de perfil. Contador conserva sus rutas y shell.

El callback guarda solo la respuesta no sensible del POST (IDs/rol aceptado) en Query por usuario/workspace/entity, sin token ni enlace. Es evidencia histórica de aceptación, no autorización actual. La lectura real siempre se verifica con GET entity. Se descarta al abandonar el contexto (gcTime 0), cerrar sesión o cambiar identidad. Datos consultados del cliente se proyectan a id/legalName, sin NIT innecesario, con Query independiente del área contable y AbortSignal.

Return path de login por correo incluye el contexto cliente validado por una whitelist estricta de UUIDs; no permite redirecciones externas/tokens. Google/confirmación que salen de la visita mantienen su comportamiento anterior: abrir de nuevo el enlace original durante la aceptación. No se añadió persistencia de token/contexto secreto ni descubrimiento de entidades mediante workspaces.

## Pantalla y estados

- Carga: comprobación de acceso a la empresa.
- Lectura autorizada: nombre real y estado Consulta autorizada. Rol de invitación aceptada si procede de POST en esta visita; no se deduce un rol desde permisos ni URL.
- Sin contrato de rol actual: no se inventa; tras recarga no se reconstruye el rol histórico. Workspace/despacho se muestra como identificador informativo bajo Detalles del acceso, ya que el API no devuelve su nombre al cliente.
- 401: iniciar sesión de nuevo. 403/404: empresa no disponible para esta cuenta; sin datos anteriores ni afirmación de acceso activo. Fallo de red/servicio: mensaje seguro y reintento explícito.
- Si el POST ya tuvo éxito, se informa que la invitación fue aceptada aun cuando la lectura posterior falle; esa confirmación no equivale a autorizar datos.
- IDs inválidos o contexto ausente no montan la query de detalle.
- Solo con lectura autorizada hay área informativa para XML/PDF/fotografías/gastos de una fase posterior. Sin botón de carga inoperante, registros, documentos, IA o reportes simulados.

## Diseño de cliente y compartir

UI/UX Pro Max aplicada. Búsqueda de sistema `client portal minimal dashboard`: Minimalism & Swiss Style pertinente para jerarquía/espacio; su propuesta de landing/colores/tipografías se descartó por no ajustarse a la app existente. Refinada a `minimalism whitespace typography --domain style`; consulta UX adicional confirmó feedback de acciones. Mantener índigo/azul/verde, tipografía existente y tokens; CSS local, sin gradientes, fuentes externas o animaciones.

Compartir acceso se abre directamente en detalle autorizado: rol + Crear enlace en una fila en escritorio, apilados en móvil; POST único con role y acceptUrl inmediato. Copiar y WhatsApp con iconos, una advertencia breve del enlace bearer, y opciones de compartir nativo/ocultar/rotar bajo Opciones del enlace. Sin cuadro dentro de cuadro ni textos de contexto repetidos. Personas con acceso es desplegable y solo consulta sus membresías al abrirlo. Revocar conserva confirmación/historial/foco.

## Archivos principales

- src/features/client/api/useClientEntity.ts: keys por contexto, metadata de aceptación y lectura mínima.
- src/features/client/pages/ClientEntityPage.tsx y client.module.css: vista separada y estados.
- src/app/routes.tsx: ClientEntry protegido separado de WorkspaceEntry.
- src/features/access/pages/InvitationPage.tsx: destino y metadata seguros tras POST.
- src/shared/utils/returnPath.ts, ProtectedRoute.tsx: destino de login interno validado con IDs.
- WorkspaceAccount.tsx: enlace de perfil configurable, predeterminado conservado para contadores.
- EntityAccessPanel.tsx, ShareInvitation.tsx, access.module.css y hooks/useAccess.ts: composición compacta y carga diferida de miembros.
- Icon.tsx: SVG coherentes para compartir y documentos informativos.
- tests/auth/client.spec.ts: mocks de ruta aislada, bloqueo actual del endpoint, errores, recarga, contexto inválido, logout, ausencia de consultas/mutaciones de workspaces.
- tests/auth/access.spec.ts y access.fixture.ts: destino y selectores adaptados, fixture de memberships.

## Verificación

**Lint y build aprobados (salida 0)**: npm run lint y npm run build; TypeScript y generación Vite/PWA completos. JS 684,67 kB / 198,68 kB gzip, CSS 46,59 kB / 9,58 kB gzip. Advertencia de chunk superior a 500 kB conservada. Tipos de mocks aprobados con `npx --no-install tsc --noEmit --module esnext --moduleResolution bundler --target es2022 --lib ES2022,DOM --types node --skipLibCheck tests/auth/client.spec.ts tests/auth/access.spec.ts tests/auth/access.fixture.ts tests/auth/entities.spec.ts`. **Playwright NO ejecutado**, tampoco test:auth/test:pwa. Mocks preparados, sin afirmar recorridos reales aprobados. Pendientes visual/teclado/dispositivos y API/RLS con dos usuarios. Los casos con lectura 200 simulan un contrato que autorice la entity; no validan que el API actual permita a un cliente aislado leerla.
