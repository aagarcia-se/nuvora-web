# Perfil y Workspaces — implementación frontend finalizada

## Estado de cierre — 2026-11-12

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
- `entity_memberships`, invitaciones, entidades/clientes y documentos todavía
  no tienen contrato implementado.
