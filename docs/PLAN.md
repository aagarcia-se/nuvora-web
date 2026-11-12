# Plan vigente — Login Nuvora Web

**Estado de cierre:** login correo/contraseña, sesión, rutas protegidas, bienvenida y logout implementados. El usuario confirmó que el login real funciona tras corregir la URL del API y posteriormente dio conformidad a sus pruebas del banner/interfaz. No especificó navegador, dispositivo ni cada caso ejecutado: esa confirmación no certifica todas las plataformas ni toda la matriz de pruebas.

Registro por correo/contraseña está implementado en `/auth/register`, junto con el enlace desde login. Google OAuth se reutiliza para registro/inicio con URL emitida por el API, callback PKCE/hash y adopción de sesión Supabase. La recuperación web está implementada con solicitud genérica, adopción PKCE/hash y actualización final de contraseña.

El frontend y backend están alineados para contraseñas nuevas: 8–128 caracteres, mayúscula, minúscula, número, carácter especial y confirmación coincidente en web. Se permiten letras Unicode; los espacios no cuentan como carácter especial. Signin conserva compatibilidad con cuentas antiguas de 8–128.

## 1. Objetivo y prioridad

Implementar los flujos Auth web coordinados: login y registro por correo/contraseña consumiendo el API existente, Google, gestión de sesión, bienvenida protegida y logout. Diseño responsive con verde lima **#D5F454**, tema claro, oscuro y sistema.

Este es el punto de entrada vigente del plan frontend. Reemplaza la propuesta anterior de esmeralda y la entrega conjunta de todos los flujos Auth. Registro, recuperación y Google están implementados; cartera, libros y portal siguen en el roadmap y no se muestran enlaces a flujos inexistentes.

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

## 11. Recuperación de contraseña

- `/auth/forgot-password` llama `POST /api/v1/auth/password-reset/request` con `{ email }` y mantiene una respuesta genérica, incluso cuando el correo no existe o el API responde `AUTH_RATE_LIMITED`.
- `/auth/reset-password` adopta enlaces PKCE (`code`) o recovery hash (`access_token`/`refresh_token`) mediante el SDK oficial Supabase. Limpia query/hash antes de continuar y nunca muestra ni persiste tokens o contraseñas.
- La actualización obtiene la sesión vigente desde Supabase en el momento del envío y llama `POST /api/v1/auth/password-reset/update` con Bearer únicamente al API. Tras `204`, cierra la sesión local y ofrece volver a iniciar sesión.
- Estados de validación, carga, éxito, enlace vencido/cancelado, errores de red/429 y validación de contraseña tienen feedback accesible. El marcador de recuperación en `sessionStorage` no contiene tokens y solo permite recuperar el estado de la pantalla después de limpiar la URL.
- Verificación automatizada actual: 14 pruebas Auth simuladas, incluyendo solicitud/429 sin reintento, hash, limpieza de URL, Bearer al API, enlace inválido y regresiones de login/guards/logout. No certifica envío real de correo ni recuperación con una cuenta autorizada.

## 12. Registro de usuarios

- `/auth/register` consume `POST /api/v1/auth/signup` y adopta la sesión Supabase cuando el API la devuelve.
- Si Supabase exige confirmación de correo y no devuelve sesión, muestra un mensaje genérico y permite volver al login sin revelar información sensible.
- El formulario incluye correo, contraseña, confirmación, checklist accesible y estados de carga/error/rate limit/doble envío.
- La política coordinada para contraseñas nuevas es 8–128 caracteres, mayúscula, minúscula, número y carácter especial. Las letras Unicode se permiten; los espacios no cuentan como carácter especial. Signin mantiene compatibilidad con cuentas antiguas de 8–128.
- Google reutiliza el flujo OAuth existente: una cuenta Google nueva puede registrarse mediante el proveedor y una existente iniciar sesión. No se implementan Microsoft ni LinkedIn.
- Validación frontend/backend completada; falta probar registro real con confirmación de correo y SMTP del proyecto Supabase de cada ambiente.

## 13. Cierre visual y PWA

- Identidad lima `#D5F454`, claro/oscuro con control sol/luna; sistema por defecto hasta elección manual persistida.
- Banner compacto superior fijo, con icono, título, subtítulo, acción Instalar y cierre. Se muestra como promoción antes de recibir `beforeinstallprompt`; solo habilita instalación cuando puede abrir la confirmación nativa y no reserva espacio para el formulario.
- Sin evento, informa brevemente disponibilidad/desarrollo/HTTPS/plataforma; no simula instalación ni ofrece instrucciones manuales extensas. Oculto en standalone o instalación confirmada; respeta nuevos cierres persistidos.
- Última revisión visual reportada: lint/build correctos, 6 pruebas PWA y 2 de promoción/temas aprobadas. Estos resultados corresponden a ejecuciones distintas de las 10 pruebas Auth, no a una única suite conjunta.
- Manifest/service worker comprobados en preview. El diálogo se verificó mediante eventos sintéticos; el navegador automatizado no emitió el evento nativo. El usuario después confirmó sus pruebas satisfactorias sin detallar dispositivos ni instalación nativa.
- Persisten el aviso de bundle superior a 500 kB y la verificación por plataforma de instalación, teclado virtual y safe areas. No bloquean el cierre del alcance visual aceptado.

Esta actualización documental no volvió a ejecutar pruebas ni implica publicación, commits o despliegues.

## 14. Google OAuth — configuración y estado

- `GET /api/v1/auth/oauth/google/url` se consume mediante el cliente versionado como `auth/oauth/google/url`; el cliente no duplica `/api/v1`.
- El botón «Continuar con Google» usa el logotipo oficial multicolor en SVG, estados de carga/error recuperable y foco visible. La URL solo se abre si proviene del origen del API configurado o de un host Google HTTPS permitido.
- `/auth/callback` elimina `code`, errores y tokens hash de la barra de direcciones antes del trabajo asíncrono. Adopta `?code=` con `exchangeCodeForSession` o `access_token`/`refresh_token` con `setSession`; no guarda tokens manualmente. Después deja que el provider valide `/auth/me` y redirige a `/`.
- Para habilitarlo: activar Google en Supabase Authentication → Providers → Google; registrar el Client ID y Client Secret de Google en Supabase. En local usar `http://localhost:5173/auth/callback`; en el ambiente publicado usar `https://nuvorapil.vercel.app/auth/callback` y configurar el mismo valor en `AUTH_REDIRECT_URL` del backend. La recuperación publicada usa `https://nuvorapil.vercel.app/auth/reset-password` en `PASSWORD_RESET_REDIRECT_URL`. El API publicado está en `https://nuvora-api-pil.onrender.com`; el usuario confirmó registro, Google y recuperación reales después de corregir CORS y redirects.
- La integración real requiere un proveedor configurado y una cuenta autorizada. No se considera validada por una respuesta simulada del endpoint ni por la compilación.
