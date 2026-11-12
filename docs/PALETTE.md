# Ajuste vigente — azul y cabecera neutra

Por solicitud del usuario sobre la captura, se sustituyó teal por azul B2B: #0369A1 claro y #7DD3FC oscuro; fondos #F0F9FF y #132F43. Cabecera de ficha usa superficie secundaria neutra. Sin borde exterior ni línea superior decorativa; cabecera sin borde. Se conservan espaciado y distribución. Verde reservado a éxito e índigo a marca/acciones. Skill consultada: paleta B2B Service, adaptación a identidad aprobada. Contraste actualizado en PALETTE-CONTRAST.md. La propuesta teal inferior es histórica.

---

# Paleta complementaria — 2026-11-12

## Decisión aplicada

Conservar índigo como marca/acción y selección; separar superficies neutras, acento de identidad y estados semánticos. UI/UX Pro Max consultada: la búsqueda inicial de sistema devolvió una landing con glassmorphism poco adecuada para la app operativa, por lo que se refinó a `B2B SaaS indigo --domain color`. La coincidencia Micro SaaS propone índigo + esmeralda y superficies neutras. Se tomó esa relación cromática conservando la marca aprobada, sin aplicar su CTA verde ni recomendaciones de landing. Consulta UX adicional `status color contrast`: contraste 4,5:1 y texto/iconos además del color.

| Uso | Claro | Oscuro |
| --- | --- | --- |
| Marca | #4F46E5 | #A5B4FC |
| Fondo general | #F1F5F9 | #0F172A |
| Tarjetas | #FFFFFF | #1E293B |
| Navegación | #E8EEF5 | #141F30 |
| Acento teal | #0F766E sobre #F0FDFA | #5EEAD4 sobre #123432 |
| Éxito | #166534 sobre #F0FDF4 | #86EFAC sobre #122E24 |
| Información | #075985 sobre #F0F9FF | #7DD3FC sobre #132F43 |
| Advertencia | #92400E sobre #FFFBEB | #FCD34D sobre #332810 |

Rojo de errores conservado. Fondos, bordes y textos semánticos centralizados en `src/styles/globals.css`, expuestos en Tailwind 3.4. Los cambios de tema resuelven tokens automáticamente. Para probar otra paleta, editar esos tokens; Tailwind referencia esas variables, no contiene hex duplicados.

## Aplicación

- Fondo general más diferenciado de tarjetas; superficie secundaria neutralizada, reduciendo lavanda decorativo.
- Lateral de escritorio y panel móvil comparten fondo de navegación. Contexto e iniciales de clientes usan teal como identidad, no como estado de aprobación.
- Confirmaciones de creación de espacios/clientes, guardado de cliente y mensajes Auth de éxito comparten fondo/borde/texto verdes. El contenido y el icono siguen indicando el resultado.
- Etiquetas de rol/permisos usan azul informativo; nunca equivalen a validación fiscal o aprobación.
- Ámbar disponible como token para advertencias reales; no se añadieron avisos ficticios para mostrar un color.
- Metadato de tema claro alineado con el fondo #F1F5F9. Fondo nativo oscuro, iconos, instalación y lógica del service worker conservados.

## Validación

[Contrastes calculados](PALETTE-CONTRAST.md): 24 combinaciones sRGB, todas superiores a 4,5:1, incluyendo alfa real de selección al 8 % sobre navegación/tarjetas. No constituye auditoría integral de accesibilidad. No se ejecutó Playwright ni revisión visual en navegador por la restricción vigente. No se añadió suite para cambios puramente de estilos.

**Lint y build aprobados**, `npm run lint` y `npm run build` con salida 0; TypeScript y generación Vite/PWA completos. Bundle principal 657,10 kB (191,20 kB gzip); CSS 38,85 kB (8,37 kB gzip). Permanece el aviso de chunk superior a 500 kB. Sin cambios de API, env, dependencias o Git. Pendiente aceptación visual en temas claro/oscuro y escritorio/móvil/PWA instalada.


## Corrección a partir de capturas — 2026-11-12

Ficha ahora con fondo surface, padding responsive 20–32 px y separación interna: cabecera teal/iniciales, campos en bloques neutros, permiso azul y footer con explicación/botón. La edición también tiene tarjeta propia con padding. Nuevo token on-accent para las iniciales en teal, contraste 5,47:1 claro y 12,07:1 oscuro. No se usan colores para inventar estado fiscal.

El cuadro índigo de la captura era foco programático sobre main, no borde de layout. Se limita `outline:none` a `.content:focus` (contenedor de lectura no interactivo), preservando navegación/skip link y foco visible de todos los controles y títulos. Sin cambios del ciclo de sesión, contratos o permisos. Skill consultada para jerarquía y padding responsive, sin introducir Tailwind 4.3 de la guía devuelta por la búsqueda.

Pendiente validación visual de la corrección; Playwright no ejecutado. Resultados de lint/build en codex.md.
