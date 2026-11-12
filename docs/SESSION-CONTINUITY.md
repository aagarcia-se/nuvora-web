# Continuidad al recuperar foco — 2026-11-12

## Hallazgo

El callback de `onAuthStateChange` ignoraba el tipo de evento y llamaba siempre a `resolve(session)`. Este limpia toda la caché y pone auth en loading, desmontando rutas y formularios. El código instalado de Supabase Auth confirma que `_onVisibilityChanged` llama a `_recoverAndRefresh`, que puede emitir `SIGNED_IN` con una sesión vigente. Es una causa concreta de reinicio de UI al volver, identificada por inspección, sin reproducción real en navegador/dispositivo.

## Corrección

`src/features/auth/store/AuthProvider.tsx` registra identidad verificada solo tras `/auth/me` exitoso. `SIGNED_IN` o `TOKEN_REFRESHED` con esa misma identidad actualizan la referencia de sesión y conservan UI/caché; no deshabilitan autoRefreshToken. La función clear invalida inmediatamente la identidad verificada, así que bootstrap, login explícito, cambio de usuario, recuperación, logout y reintento resuelven normalmente. Se añadió además el retorno ante una respuesta `/me` de generación anterior para no modificar initializing desde una petición obsoleta.

No se desactivó refetchOnWindowFocus: las queries pueden revalidar datos/permisos en segundo plano. No se modificó la actualización PWA: `registerType: prompt` y activación explícita desde Actualizar. No se tocó API, entornos, tokens persistidos, dependencias ni Git.

## Verificación

Lint aprobado (`npm run lint`, salida 0). Build aprobado (`npm run build`, salida 0), con TypeScript y generación Vite/PWA. Bundle principal 657,04 kB / 191,16 kB gzip; se mantiene el aviso de chunk superior a 500 kB.

Caso de regresión preparado en `tests/auth/auth.spec.ts`, sin ejecutar: instancia real del SDK en servidor Vite de prueba, ciclo de visibility simulado y espera de SIGNED_IN, diálogo y borrador conservados y sin otra llamada `/auth/me`. Playwright sigue sin autorización de ejecución. Se mantienen pruebas anteriores de auth; su existencia no constituye validación ejecutada de este cambio.

Pendiente manual: cambiar pestaña/app con formulario abierto, volver tras renovar token, cambiar identidad/cerrar sesión y comprobar API rechazando accesos revocados. La recuperación real del proceso por descarte de pestañas o memoria del SO puede recargar el documento y no queda impedida por esta corrección.
