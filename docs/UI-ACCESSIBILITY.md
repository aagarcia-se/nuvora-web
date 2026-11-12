# Identidad y revisión de accesibilidad — 2026-11-12

Solicitud vigente: sustituir lima por una identidad SaaS moderna. Se aplicó UI/UX Pro Max desde `.opencode/skills/ui-ux-pro-max/SKILL.md`, con búsquedas locales de sistema SaaS contable, contraste y formularios React. Se verificó que los resultados pertenecían a los dominios solicitados. La recomendación azul/slate se adaptó a índigo: la composición es de acceso, no una landing con CTA repetidos. Se evitan transparencias sobre texto y dependencias de fuentes externas.

## Sistema visual

- Primario: índigo #4F46E5, texto blanco. Hover #4338CA.
- Oscuro: acción #A5B4FC, texto #1E1B4B. Hover #C7D2FE.
- Fondos #F8FAFC / #0F172A; superficies #FFFFFF / #1E293B.
- Tipografía: pila sans existente del sistema; escala de títulos y jerarquía conservadas.
- Controles de 48px; radios 12px, tarjetas 24px, panel de identidad 32px; espaciado basado en 4px. Foco separado 2px con offset 3px. Animación limitada a color y desactivable.
- Panel de identidad en escritorio y formulario prioritario en móvil. Sin métricas ficticias ni promesas fiscales.
- Tokens centrales en `src/styles/globals.css`, mapeados a Tailwind 3.4. Metadatos en `src/shared/config/brand.ts`; arranque previo a React y generador de iconos sincronizados.

## Contraste

Cálculo de luminancia relativa sRGB. Umbral AA: texto normal 4.5:1 y controles/foco 3:1. Los bordes decorativos de tarjetas no son límites de controles. El texto del panel mantiene contraste incluso con el gradiente de baja intensidad.

| Uso         |   Claro |  Oscuro |
| ----------- | ------: | ------: |
| Texto       | 17.06:1 | 17.06:1 |
| Secundario  |  7.58:1 |  9.85:1 |
| Banner      |  6.78:1 |  8.45:1 |
| Botón       |  6.29:1 |  8.02:1 |
| Hover botón |  7.90:1 | 10.72:1 |
| Error       |  5.97:1 |  9.13:1 |
| Borde campo |  4.76:1 |  5.71:1 |
| Foco        |  6.29:1 |  7.34:1 |
| Panel       | 10.72:1 | 10.72:1 |

La paleta anterior tenía contrastes adecuados en las parejas principales (lima con texto oscuro y texto secundario con superficies); el cambio de marca responde a la nueva dirección del usuario, no a una afirmación de que toda la paleta anterior fallaba. La revisión detectó asociaciones de error ausentes en registro/recuperación, validación de contraseña inconsistente en recuperación y posibilidad de lanzar acceso por correo durante OAuth.

## Correcciones y límites

Se comparten reglas de contraseña entre registro y recuperación, alineadas con Unicode y exclusión de espacios como símbolos según el schema local del API, se asocian mensajes mediante aria-describedby y se bloquean acciones alternativas durante el envío. Se preservan Supabase, contratos API, control sol/luna, reducción de movimiento y banner PWA superior en flujo. Se actualizaron pruebas que esperaban colores y posicionamiento antiguos. El callback incluye h1 en espera/error y el logotipo de Google vive en un componente compartido, sin importar una página desde otra.

La prueba de contraste automatizada comprueba tokens resueltos en Chromium para ambos temas; no es una certificación integral WCAG. Quedan fuera lectores de pantalla reales, instalación del SO, Safari/iOS y pruebas contra servicios reales. El build conserva advertencia de tamaño del bundle (~600 kB antes de gzip); dividir rutas requiere comprobar el comportamiento offline de los chunks y no se aplica a ciegas.


## Verificación realizada

- Prueba adicional de política Unicode y rechazo de espacios como símbolo: 1 aprobada.
- Lint y build correctos. Permanece aviso de bundle ~600 kB (176 kB gzip).
- 22 pruebas Auth/temas/contraste/responsive aprobadas en Google Chrome headless mediante configuración temporal basada en la configuración original. Fixtures Demo; no prueba servicios reales.
- 6 pruebas PWA aprobadas en preview de producción, incluyendo shell offline y exclusión de peticiones API de la caché.
- El manifest no presenta errores de instalabilidad salvo `in-incognito`, restricción del contexto automatizado Chrome que se excluye explícitamente. No se observó beforeinstallprompt nativo; las interacciones de instalación se verifican con eventos sintéticos.
- Chromium headless-shell falló al arrancar (`spawn UNKNOWN`), y Chromium completo terminó antes de abrir una página. Se utilizó Chrome instalado como alternativa, sin cambiar la configuración habitual del proyecto.
- Capturas de login escritorio claro y móvil oscuro inspeccionadas visualmente; formularios públicos comprobados a 375/768/1440 px en ambos temas. La prueba de teclado/tema también recorre 320 px y orientación horizontal.
- No se modificaron entornos ni se ejecutaron comandos Git.


## Ajuste minimalista solicitado — 2026-11-12

Esta revisión sustituye el panel lateral descrito arriba por un formulario centrado sin tarjeta, sombra ni bloque de color. Se aplicó la búsqueda local `minimalism login whitespace` de UI/UX Pro Max (resultado verificado: Minimalism & Swiss Style), conservando jerarquía, controles y temas existentes. El shell compartido mantiene coherencia en las pantallas de autenticación.

Los iconos instalables ahora se generan desde `public/splash-logo.svg`, con la N sobre #0F172A, coincidente con el fondo del manifest. El favicon conserva su placa de marca para navegador y cabecera. Se regeneran los PNG, sin pruebas, lint ni build por instrucción expresa del usuario. Los resultados anteriores corresponden a la revisión previa y no validan estos ajustes.


## Monograma geométrico — 2026-11-12

Por autorización del usuario se sustituye la N tipográfica por una silueta geométrica de trazo ancho, diagonal continua y esquinas suavizadas. SVG original, sin fuentes ni recursos externos. La búsqueda UI/UX Pro Max `geometric brand logo minimal` devuelve Minimalism & Swiss Style, coherente con la dirección minimalista vigente.

`public/brand-mark.svg` contiene la versión independiente. Cabecera: máscara SVG con el token principal para adaptarse al tema, sin placa. Favicon, splash y PNG instalables: símbolo lavanda sobre #0F172A uniforme. La silueta inline de `index.html` mantiene el mismo trazado sin peticiones adicionales durante el arranque. El símbolo se incluye entre los recursos PWA. Conservar sincronizados estos SVG y el trazado inline al editar la geometría.

Solo se regeneran recursos gráficos; no se ejecutan pruebas, lint ni build por instrucción vigente. La actualización de iconos de una PWA ya instalada depende del navegador y puede requerir reinstalación tras publicar.


## Refinamiento de jerarquía y proporciones — 2026-11-12

Se conserva el acceso centrado y sin panel lateral. Formulario de hasta 416px útiles con encabezados de escala fluida, párrafos de medida corta y espaciado coherente. El contexto «Contadores» acompaña la marca en cabecera; una línea neutra estructura el área superior. El login agrupa recuperación con contraseña, separa la invitación a crear cuenta y elimina el espacio del resumen de errores cuando no hay mensajes. Se mantienen etiquetas, errores asociados, estados de envío y nombres de acciones.

Promoción PWA secundaria con icono neutro y acción de instalación de menor peso visual. Conserva ubicación superior en flujo, disponibilidad, cierre y comportamiento de instalación. El selector sol/luna utiliza selección tonal y objetivos de 44px, sin etiqueta visible. La tipografía y los controles compartidos propagan la coherencia a las otras pantallas de autenticación. Se aplicaron búsquedas locales de UI/UX Pro Max para formularios y estilo minimalista, con resultados compatibles con web SaaS; no se añaden fuentes externas ni dependencias.

No se ejecutaron pruebas, lint, build ni validación visual en navegador por la indicación vigente del usuario. La lectura del código no sustituye esas verificaciones; los resultados automatizados de apartados anteriores corresponden a la revisión previa.
