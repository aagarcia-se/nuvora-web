# Plan vigente — Login Nuvora Web

**Estado de cierre:** login correo/contraseña, sesión, rutas protegidas, bienvenida y logout implementados. El usuario confirmó que el login real funciona tras corregir la URL del API y posteriormente dio conformidad a sus pruebas del banner/interfaz. No especificó navegador, dispositivo ni cada caso ejecutado: esa confirmación no certifica todas las plataformas ni toda la matriz de pruebas.

Registro, Google y recuperación en web siguen pendientes de autorización. No reiniciar esta entrega ni ampliar automáticamente su alcance.

## 1. Objetivo y prioridad

Implementar únicamente login por correo/contraseña consumiendo el API existente, gestión de sesión, bienvenida protegida y logout. Diseño responsive con verde lima **#D5F454**, tema claro, oscuro y sistema.

Este es el punto de entrada vigente del plan frontend. Reemplaza la propuesta anterior de esmeralda y la entrega conjunta de todos los flujos Auth. El usuario indicará qué trabajar después. Registro, recuperación, Google, cartera, libros y portal siguen en el roadmap, pero no se implementan en esta entrega ni se muestran enlaces a flujos inexistentes.

Referencias:
- [AGENTS.md](../AGENTS.md): reglas permanentes.
- [README.md](../README.md): desarrollo y PWA.
- [Plan de producto/API](../../nuvora-api/docs/PLAN.md): roadmap general, no tareas adicionales de esta entrega.
- [Handoff](../../nuvora-api/docs/frontend-handoff.md): coordinación y contratos.

El borrador detallado de esta entrega se creó en `C:/Users/agarcia/.opencode/plan/plan.md`. Este documento deja las decisiones operativas dentro del repositorio, sin depender de esa ruta personal. Si difieren, seguir este plan y las instrucciones más recientes del usuario.

## 2. Base a conservar

- React, TypeScript, Vite, React Router, Tailwind 3.4, Axios y TanStack Query.
- Arquitectura `app`, `features`, `shared`, `styles` y alias `@/`.
- PWA existente: instalación, manifest, iconos, service worker, aviso de actualización y shell offline; pruebas Playwright.
- API Express/Supabase: signin, validación Bearer y `/auth/me`, seguridad y logs existentes. No reconstruir ni modificar el backend dentro de esta tarea sin coordinación.
- Inspeccionar git y dependencias antes de trabajar y conservar cambios del usuario. No instalar paquetes ni generar módulos ajenos al login.

## 3. UI/UX Pro Max

Leer y aplicar `.opencode/skills/ui-ux-pro-max/SKILL.md` para sistema visual, componentes, experiencia, accesibilidad y React/Tailwind.

La skill está instalada. Aunque Python no estaba disponible en la primera planificación, el agente reportó haber consultado su buscador durante la implementación. Revalidar disponibilidad en futuras tareas; no instalar Python automáticamente ni atribuir resultados a búsquedas no ejecutadas.

El agente define componentes, colores complementarios, tipografía y recursos visuales. La elección explícita del usuario de lima y ambos temas prevalece sobre recomendaciones automáticas.

## 4. Diseño aprobado como dirección

Inspiración: imagen compartida de Dapta por su lima, contraste y tipografía marcada. No copiar marca, textos, métricas, logos de clientes ni estructura de landing. Crear una interfaz de acceso profesional para Nuvora Contadores.

| Token | Claro | Oscuro |
| --- | --- | --- |
| Marca / botón primario | `#D5F454` | `#D5F454` |
| Texto del botón primario | `#17200A` | `#17200A` |
| Hover primario | `#C6E544` | `#E1FA83` |
| Fondo | `#F7F8F2` | `#10120D` |
| Superficie | `#FFFFFF` | `#191D14` |
| Superficie secundaria | `#EEF2E4` | `#23291B` |
| Texto principal | `#1B2114` | `#F5F7EF` |
| Texto secundario | `#556047` | `#B5BEA6` |
| Borde decorativo | `#DCE3CE` | `#3C4630` |
| Enlace / foco propuesto | `#48620D` | `#D5F454` |

- Verificar contraste sobre componentes reales: texto normal 4.5:1, grande y controles relevantes 3:1. Bordes decorativos no sustituyen indicadores de foco/límites de input suficientemente contrastados.
- No texto blanco sobre botón lima ni texto lima esencial sobre blanco. Estados error/éxito/advertencia/información tienen tokens propios y texto/icono, no solo color.
- Centralizar tokens en Tailwind y `globals.css`. Conservar Inter/sistema si adecuada, espaciado consistente, radios moderados y sombras discretas.
- Escritorio: formulario protagonista con panel lateral discreto de marca. Móvil: columna única y decoración reducida.
- Formulario: correo, contraseña, mostrar/ocultar, Iniciar sesión y mensajes de estado. Labels visibles, teclado, foco, errores asociados y carga sin doble envío.
- Permitir pegado, gestores de contraseñas y autocomplete `username`/`current-password`. No aplicar trim a contraseña.
- Iconos SVG consistentes, preferiblemente Lucide tras revisar dependencias; nombre accesible en botones y decorativos ocultos al lector.
- Si se necesita decoración, composición ligera SVG/CSS propia; no se requiere fotografía. Recursos externos con licencia, optimización y autorización aplicable.
- Control accesible de iconos sol/luna: sistema por defecto hasta elección manual claro/oscuro, persistida y aplicada antes del primer render. Respetar reduced motion.
- Unificar favicon/iconos PWA/metadatos con lima usando scripts existentes, sin reemplazar el mecanismo PWA. Verificar legibilidad y tamaños; no afirmar soporte de integración del sistema operativo sin probar.

## 5. Contratos verificados

```http
POST /api/v1/auth/signin
Content-Type: application/json

{ "email": "contador@example.com", "password": "..." }
```

- Correo válido con trim; contraseña entre 8 y 128 caracteres según esquema actual.
- 200: `{ user, session }` de Supabase.
- 400: `{ error: "VALIDATION_ERROR", message, details }`.
- 401: `{ error: "AUTH_SIGNIN_FAILED", message: "Correo o contraseña inválidos." }`.
- `GET /api/v1/auth/me` con Bearer responde `{ user }`.
- Revisar esquemas/controladores/Postman antes de implementar por si cambiaron. Manejar timeout, red, 429 y 5xx; no reintentar signin automáticamente.

## 6. Integración y sesión

1. Incorporar SDK oficial Supabase y validar variables públicas `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_APP_NAME`.
2. Adoptar origen del API como base URL y rutas explícitas `/api/v1/...`, actualizando configuración y ejemplos para evitar prefijos duplicados. Mantener timeout Axios.
3. Enviar credenciales a signin mediante Axios, sin Bearer previo ni logs sensibles.
4. Validar respuesta y entregar `access_token`/`refresh_token` a `supabase.auth.setSession`; SDK es único responsable de persistencia/renovación.
5. Consultar `/auth/me` con token vigente y mostrar bienvenida con identidad real.
6. Restaurar sesión al recargar, con loading inicial y limpieza de listeners. Evitar carreras/duplicación por StrictMode.
7. Diferenciar fallo de red/servidor de sesión rechazada: ofrecer reintento para timeout/5xx sin borrar sesión válida. Token definitivamente inválido conduce a reautenticación, sin bucles de refresh.
8. Logout con SDK, cancelar peticiones y limpiar datos/cache. Manejar fallos de cierre sin afirmar éxito falso ni permitir repoblación por respuestas tardías.

No guardar tokens manualmente o en Query ni implementar refresh paralelo usando `/auth/refresh`. Bearer solo al API configurado, nunca a archivos o servicios externos. No incorporar secret keys. Supabase web y API deben apuntar al mismo proyecto no productivo en pruebas.

El orquestador reporta Auth backend aislado por operación y 27 pruebas aprobadas.
Persiste una limitación: `/me` responde 401 también ante indisponibilidad del
proveedor; el frontend no puede distinguirla de un rechazo de sesión.

## 7. Navegación y archivos

- `/login`: público, usuario autenticado va a `/` tras resolver sesión.
- `/`: bienvenida mínima protegida con usuario y Cerrar sesión. Sin dashboard ficticio.
- Sin sesión: redirigir al login. Mantener página no encontrada y UI PWA pertinente.

Áreas a crear/modificar según convenciones vigentes:

- `src/features/auth/`: API tipada, provider/context/hook, formulario, páginas y guards.
- `src/shared/lib/`: SDK Supabase.
- `src/shared/ui/`: Button, campo, PasswordField, InlineAlert y loading según necesidad.
- `src/shared/theme/`: selector y resolución de tema.
- `src/shared/config/`, `src/vite-env.d.ts`, `.env.example`: configuración pública.
- `src/shared/api/httpClient.ts`: token restringido al API.
- `src/app/providers.tsx`, `src/app/routes.tsx`: composición y rutas.
- `src/styles/globals.css`, `tailwind.config.ts` y punto de inicialización del tema.
- Favicon/iconos PWA y pruebas; README con instrucciones locales.

No crear carpetas vacías para funcionalidades futuras. Ajustar nombres tras inspección.

## 8. Pruebas y aceptación

- Login válido → SDK → `/auth/me` → bienvenida.
- Credenciales inválidas y validación visibles; corregir y reenviar funciona; sin doble envío.
- Recarga conserva sesión; rutas y redirecciones correctas durante carga/inicio/expiración.
- Logout limpia estado y peticiones tardías no repueblan datos.
- Fallos de red/429/5xx recuperables y sin bucles de refresh.
- Claro/oscuro/sistema persistentes, sin flash; contraste y teclado verificados en móvil/escritorio.
- API, callbacks, tokens y documentos excluidos del caché PWA. Shell offline se conserva.
- Ejecutar `npm run lint`, `npm run build`, pruebas funcionales login/temas y `npm run test:pwa` cuando se afecte PWA/iconos.
- Mocks para casos de comportamiento y login real con usuario de prueba autorizado y Supabase no productivo. No versionar credenciales ni atribuir a mocks una integración real.

## 9. Orden de trabajo y entrega

1. Leer AGENTS y skill, inspeccionar estado/dependencias/contratos.
2. Implementar tokens lima, temas y formulario accesible.
3. Integrar signin/Supabase, sesión, guards, bienvenida y logout.
4. Completar errores, identidad PWA y pruebas.
5. Entregar cambios, checks reales, configuración local y pendientes. Detenerse tras esta entrega y esperar la siguiente indicación.

Sin commit/push, despliegue ni cambios remotos sin autorización.

## 10. Revisión de integración y estructura

Auth implementado y reorganizado siguiendo la referencia San Gabriel:
`api/authApi.ts`, `api/useLogin.ts`, `components`, `pages` (nombre real plural),
`store` y `types/auth.types.ts`. Supabase permanece como único gestor de sesión;
no se copia el JWT propio ni la persistencia manual de la referencia.

Lint/build y 10 pruebas Auth simuladas aprobadas en la entrega de integración.
El bloqueo de configuración se resolvió: el usuario corrigió `VITE_API_BASE_URL`
y confirmó login real funcional. La URL inválida se rechazaba localmente; no
demostraba caída del API. Los agentes no modificaron `.env` ni sus claves.

## 11. Cierre visual y PWA

- Identidad lima `#D5F454`, claro/oscuro con control sol/luna; sistema por defecto hasta elección manual persistida.
- Banner compacto superior con icono, título, subtítulo, acción Instalar y cierre. Se muestra como promoción antes de recibir `beforeinstallprompt`; solo habilita instalación cuando puede abrir la confirmación nativa.
- Sin evento, informa brevemente disponibilidad/desarrollo/HTTPS/plataforma; no simula instalación ni ofrece instrucciones manuales extensas. Oculto en standalone o instalación confirmada; respeta nuevos cierres persistidos.
- Última revisión visual reportada: lint/build correctos, 6 pruebas PWA y 2 de promoción/temas aprobadas. Estos resultados corresponden a ejecuciones distintas de las 10 pruebas Auth, no a una única suite conjunta.
- Manifest/service worker comprobados en preview. El diálogo se verificó mediante eventos sintéticos; el navegador automatizado no emitió el evento nativo. El usuario después confirmó sus pruebas satisfactorias sin detallar dispositivos ni instalación nativa.
- Persisten el aviso de bundle superior a 500 kB y la verificación por plataforma de instalación, teclado virtual y safe areas. No bloquean el cierre del alcance visual aceptado.

Esta actualización documental no volvió a ejecutar pruebas ni implica publicación, commits o despliegues.
