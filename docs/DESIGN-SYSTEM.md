# Rediseño de la experiencia — 2026-11-12

La organización posterior de la ficha y accesos se documenta en
[CLIENT-ADMINISTRATION.md](CLIENT-ADMINISTRATION.md): submenú de Datos del cliente,
Personas y accesos e Invitaciones. Reemplaza la distribución anterior en un panel
único descrita aquí, conservando este sistema visual.

## Alcance vigente

El propietario autorizó un rediseño integral de las pantallas y flujos existentes.
Esta decisión amplía el alcance visual de las fases anteriores; conserva React,
TypeScript, Tailwind 3.4, CSS Modules, las rutas, la sesión, los permisos y los
contratos del API. No introduce módulos financieros, indicadores simulados,
dependencias, cambios de backend/SQL, entornos, Git ni despliegue.

Se aplicaron `emil-design-eng` y la guía local de `ui-ux-pro-max`. Python no está
disponible para ejecutar el buscador de la segunda skill; no se instaló y no se
atribuyen resultados a búsquedas no ejecutadas. Se usó su guía directamente.

## Criterio de producto

Una herramienta de trabajo contable necesita hacer evidente dónde se está
trabajando, cuál es la siguiente acción y qué datos están disponibles. La entrada
sigue siendo la selección de espacio, sin convertirla en un dashboard financiero:
el producto actual no tiene contratos para esos indicadores. No se agregan
secciones vacías para simular una plataforma más extensa.

| Before                                                                 | After                                                                        | Why                                                                                       |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Navegación con título genérico y contexto repetido en la cartera       | Identidad de marca en lateral, contexto confirmado y título breve «Clientes» | Orientar sin competir con el contenido; el nombre accesible del título incluye el espacio |
| Cada fila de espacio/cliente tiene borde propio dentro de otra tarjeta | Una superficie por listado, filas compactas y hover de superficie            | Facilitar recorrer información sin anidar tarjetas visualmente                            |
| Búsqueda aparece después de cuatro registros                           | Barra de búsqueda desde el primer registro, limpieza y resumen de resultados | Una herramienta predecible al crecer la cartera                                           |
| Solo búsqueda por nombre en clientes                                   | Búsqueda combinada con filtro local «Con edición / Solo consulta»            | Encontrar clientes según la capacidad ya proyectada por el API                            |
| Acción de editar al final de la ficha                                  | Acción junto a la identidad del cliente                                      | Evitar recorrer fechas y datos secundarios antes de actuar                                |
| Historial de invitaciones abierto al entrar                            | Compartir primero; historial y personas desplegables con consulta diferida   | Dar prioridad al enlace y evitar lecturas que el usuario aún no necesita                  |
| Encabezados de autenticación compuestos de manera distinta             | Patrón común de encabezado, explicación y formulario                         | Continuidad entre login, registro y recuperación                                          |
| Botón cambia su ancho con textos de carga                              | Dos etiquetas en la misma celda de grid; solo una visible y accesible        | Reservar el ancho necesario y conservar el feedback existente                             |
| Inputs sin tratamiento propio para disabled/readonly                   | Superficie y cursor diferenciados, texto legible                             | Comunicar disponibilidad sin depender de opacidad excesiva                                |
| Color de estado enlazado a la geometría del SVG                        | `data-state` explícito                                                       | Mantener la semántica al sustituir un icono                                               |

## Sistema visual

La paleta semántica vigente se mantiene: índigo/lavanda para marca y acciones,
slate para superficies, azul para identidad/información, verde para éxito,
ámbar para advertencias y rojo para acciones destructivas/errores. Valores en
`src/styles/globals.css`; Tailwind continúa mapeando estos tokens. No se cambiaron
los pares cromáticos de [PALETTE.md](PALETTE.md) ni se repitió su auditoría de contraste.

| Fundamento        | Regla                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Tipografía        | `system-ui` y fallbacks del sistema; sin descargar otra fuente. Se retiró la referencia a Inter, que no estaba distribuida por el proyecto |
| Títulos de página | `--text-title`: 28–34 px, peso 650, tracking −0.035 em                                                                                     |
| Texto             | 14 px para interfaz, 13 px para metadatos y 12 px para auxiliares; inputs 16 px                                                            |
| Espaciado         | Escala de 4, 8, 12, 16, 20, 24, 32, 40 y 48 px                                                                                             |
| Radios            | 10 px controles, 16 px superficies, 20 px diálogos                                                                                         |
| Controles         | Altura mínima de 44 px; campos de autenticación 48 px                                                                                      |
| Elevación         | Sombra mínima para superficies; sombra mayor solo para overlays                                                                            |
| Foco              | Contorno existente de 2 px con separación de 3 px; main conserva su excepción programática                                                 |
| Responsive        | Lateral desde 1024 px; panel nativo debajo; campos y acciones apilados donde se requiere                                                   |

La ficha mantiene filas semánticas etiqueta/valor, iconos, separadores, cabecera
neutra e iniciales. No agrega tarjetas por dato, borde exterior ni badge de acceso.
El perfil usa identidad horizontal y atributos alineados. El cliente aislado
conserva su shell independiente; el aviso de funciones futuras se presenta como
información secundaria, sin botón inoperante ni área de carga ficticia.

## Flujos y estados

| Objetivo                | Experiencia aplicada                                                                                    | Reglas conservadas                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Abrir el área correcta  | Elección explícita cuando hay acceso de despacho y cliente; enlace directo a cartera desde cada espacio | La selección nunca autoriza; el detalle del workspace confirma el contexto                        |
| Localizar un cliente    | Buscar y filtrar en una barra común, ver cantidad mostrada y restablecer desde vacío                    | Filtro de datos ya cargados, sin peticiones ni persistencia de NIT; no implica nuevas capacidades |
| Crear un espacio        | Nombre y slug autocompletado existente, ayuda más directa y acción de carga estable                     | Validaciones, edición manual del slug, cancelación y resultado incierto existentes                |
| Crear/editar un cliente | Diálogo para el alta corta; edición en su ruta; acción de editar visible arriba                         | `canManage`, campos cambiados y NIT mantener/cambiar/quitar intactos                              |
| Compartir               | Seleccionar rol, crear enlace, copiar/WhatsApp inmediatamente                                           | Solo `{ role }`; enlace en memoria, confirmación explícita al aceptar y rotación advertida        |
| Revisar/revocar accesos | Historial/personas bajo disclosure; color asociado al estado explícito                                  | Consultas diferidas, confirmación antes de revocar, historial y retorno de foco                   |
| Recuperar un error      | Mensajes y acciones existentes dentro de la misma jerarquía de formularios y superficies                | Sin reintentos automáticos de escrituras ni pérdida deliberada del borrador                       |

Listas vacías conservan explicación y alta cuando el rol lo permite. Sin resultados,
se ofrece limpiar/restablecer. Skeletons estáticos evitan movimiento repetitivo.
Errores, confirmaciones y permisos continúan comunicándose mediante texto e iconos.
No se inventó paginación ni filtros remotos: los contratos actuales no los ofrecen.

Cerrar accesos conserva el desmontaje de su contenido y la limpieza de enlaces de
esa vista. El historial empieza cerrado y su consulta se habilita al abrirlo.
No se eliminó la acción de cerrar, aunque visualmente pasa a ser un control
secundario más discreto.

## Movimiento y feedback

La frecuencia y propósito determinan la animación. No se animan rutas, listas,
búsquedas, cambios de tema ni skeletons. La pulsación de botones con puntero usa
escala 0.98 durante 120 ms; modales/menú de cuenta entran desde escala 0.98 y
opacidad con 180 ms; el panel móvil usa desplazamiento corto y 220 ms.

Curvas compartidas de la skill: `--ease-out` y `--ease-drawer`. El menú de cuenta
parte de arriba a la derecha; el modal mantiene su centro. CSS usa transiciones
de transform/opacity y `@starting-style`, con apertura instantánea si el navegador
no soporta esta última. El cierre es inmediato, conservando la semántica nativa y
la cancelación; no se demora el desmontaje para mostrar una salida.

`AppProviders` registra únicamente modalidad de entrada en `data-input` y limpia
sus listeners al desmontar. Las entradas y escalas están restringidas al puntero
y a `prefers-reduced-motion: no-preference`. Un keydown vuelve la respuesta
instantánea; no se almacena esta preferencia ni se añade un gestor global.
Hover solo en dispositivos con hover y puntero fino. Disabled no recibe feedback
de hover/pressed. La regla global de movimiento reducido permanece.

## Verificación y límites

La revisión de código cubre composición, estados, breakpoints, semántica y
conservación de permisos/transporte. La revisión visual intentada no pudo
completarse: el host de navegador estaba indisponible y la captura nativa no
correspondió a la ventana de la aplicación. No se usó esa captura como evidencia.

`npm run lint` y `npm run build` finalizaron con salida 0 tras el formateo acotado.
Vite y la generación PWA completaron: CSS 57,12 kB (11,40 kB gzip), JS principal
700,82 kB (202,27 kB gzip). Se conserva el aviso del chunk superior a 500 kB.
Los casos Demo adaptados para el filtro y la lectura diferida se conservan sin ejecutar.
Playwright no se ejecuta por instrucción del propietario. Quedan pendientes la
aceptación visual móvil/escritorio y claro/oscuro, el comportamiento real de las
animaciones y la integración real del API/RLS. El rediseño no certifica preparación
comercial, cumplimiento fiscal ni módulos todavía no implementados.
