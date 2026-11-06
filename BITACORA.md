# Bitácora — Adiviná la música

Registro de la evolución de la app, versión por versión: qué cambió, cómo se verificó, qué dificultades aparecieron y cómo se resolvieron.

- **App:** https://adivina-la-musica.vercel.app
- **Repositorio:** https://github.com/juampiAssi/adivina-la-musica

---

## Idea

Un juego diario estilo Wordle para fanáticos de las bandas sonoras: suena un fragmento de música y hay que adivinar de qué película, serie o videojuego es. Cuanto menos se escucha (3, 6 o 10 segundos), más puntos se ganan. Los aciertos se guardan en un estante personal y suman en un ranking.

**Público:** personas que consumen películas, series y videojuegos y disfrutan de su música; partidas cortas para jugar todos los días.

**Información que se guarda en Firebase:** los títulos de cada día, las jugadas de cada jugador (aciertos y fallos), el ranking (apodo y puntos, sin datos personales) y la fecha de inicio del calendario.

---

## Antes de V1: prototipos

### Prototipo 1 — juego con YouTube (25/10, commit `26df6d6`)

- Proyecto React + Vite, rutas y layout.
- Juego con fragmentos de 3, 6 y 10 s usando el reproductor embebido de YouTube.
- **Problema:** el reproductor muestra el título y la portada del video, y eso revela la respuesta.
- Se probó una capa borrosa encima del reproductor. Funcionaba visualmente, pero **las políticas de YouTube prohíben tapar u ocultar el reproductor**, así que se buscó otra solución.

### Prototipo 2 — audio con Deezer (25/10, commit `9d12ba5`)

- El audio pasó a salir de los **fragmentos de 30 s de la API de Deezer**, reproducidos con un `<audio>` propio: no se ve nada que revele la respuesta.
- YouTube quedó solo para la **revelación** al final, visible y sin tapar.
- Las preguntas salieron de una playlist propia de 300 temas: se buscaron en Deezer y quedaron 222 temas de 138 títulos (se descartaron los que no estaban o no tenían una película/serie/juego claro).
- Se agregaron: instrucciones al inicio, partidas sin repetir, pantalla final, autocompletado de respuestas (porque a veces se sabía la respuesta pero se escribía mal) y botón para saltear.

### Prototipo 3 — diseño "Vice" (26/10, commit `fca23f2`)

- Primera iteración de diseño, inspirada en la estética de atardecer de Miami del sitio de GTA VI (sin usar imágenes, logos ni tipografías de Rockstar).
- Paleta azul noche / violeta / rosa, tipografías Bebas Neue y Montserrat, palmeras propias en SVG, ecualizador animado, entradas "desde la oscuridad" y efectos atados al scroll, todo con CSS.
- **Por qué:** el juego es de música y cine; un clima de "noche de cine/neón" acompaña mejor que la interfaz genérica inicial. El diseño final se va a seguir iterando (V2/V3).

**Capturas** (`docs/capturas/`):

| Prototipo 1 — YouTube | Prototipo 2 — Deezer | Prototipo 3 — Vice |
|---|---|---|
| ![Título visible](docs/capturas/p1-01-youtube-titulo-visible.jpg) | ![Deezer jugando](docs/capturas/p2-01-deezer-jugando.jpg) | ![Inicio Vice](docs/capturas/p3-01-vice-inicio.jpg) |
| El título del video revela la respuesta | Audio de Deezer sin pistas visuales | Primera iteración de diseño |
| ![Capa borrosa](docs/capturas/p1-02-youtube-capa-borrosa.jpg) | ![Autocompletado](docs/capturas/p2-04-autocompletado.jpg) | ![Jugando Vice](docs/capturas/p3-02-vice-jugando.jpg) |
| Capa borrosa (descartada por las políticas de YouTube) | Autocompletado de respuestas | Recuadro de atardecer y ecualizador |

---

## V1 — Primera versión funcional publicada (27/10)

Commits: `277c637` (Firebase) y `80bb9ea` (Vercel).

### Qué se hizo

**Firebase**
- Proyecto `adivina-la-musica`, app web, Firestore Standard en `southamerica-east1` y Authentication (Anónimo + Correo/contraseña).
- `src/services/firebase.js`: único punto de conexión, con las variables `VITE_FIREBASE_*` leídas desde `import.meta.env`.
- **Sesión anónima automática** para jugadores. El administrador entra con **correo y contraseña de una cuenta genérica** (sin email real). Se decidió no usar Google para no guardar datos personales.
- Servicios para `config`, `titles`, `guesses` y `leaderboard`, con mensajes de error reales en la interfaz.

**Juego por día**
- 138 títulos repartidos en 14 días de 10 (el último de 8). Datos de año, dirección, género, sinopsis y póster obtenidos de TMDB con `scripts/build-titles.mjs`; los videojuegos se cargaron a mano.
- Cada día se desbloquea a las 00:00 de Argentina. Los días pasados se pueden jugar con la mitad de puntos ("ponte al día").
- Cada jugada (acierto o fallo) se guarda en `guesses/{uid}_{titleId}`, así no se puede jugar dos veces el mismo título.
- **Perfil:** apodo para el ranking (crear, editar, borrar) y estante con los aciertos (consultar, borrar).
- **Ranking:** top 20.

**Seguridad**
- `firestore.rules` comentadas: sin sesión no se lee nada, los títulos bloqueados no se pueden leer, las jugadas se validan contra el título real (puntos, atraso, hora del servidor) y cada jugador solo toca sus datos.
- Índice compuesto para la consulta "títulos del día".

**Panel admin** (`/admin`)
- Fecha de inicio del calendario (recalcula los desbloqueos de todos los títulos).
- Importador de JSON/CSV con vista previa, validación por fila y escritura en lotes de hasta 500, idempotente.

**Vercel**
- Proyecto conectado al repositorio de GitHub: cada push a `main` despliega solo.
- Variables `VITE_FIREBASE_*` como Config en Production y Preview; `vercel.json` con Vite, salida `dist` y rewrite para React Router.
- Dominio de Vercel agregado a los dominios autorizados de Firebase Authentication.

### Cómo se verificó

**Reglas de Firestore** (probadas contra el proyecto real con usuarios anónimos de prueba, que se borraron después):

| Prueba | Resultado esperado | Resultado |
|---|---|---|
| Leer sin sesión | Rechazado | ✔ |
| Escribir en `titles` o `config` sin ser admin | Rechazado | ✔ |
| Leer un título de un día bloqueado | Rechazado | ✔ |
| Crear una jugada con el uid de otro jugador | Rechazado | ✔ |
| Mandar puntos inventados, `cluesUsed` inválido o marcar "atrasada" una jugada de hoy | Rechazado | ✔ |
| Jugar dos veces el mismo título | Rechazado | ✔ |
| Leer o borrar la jugada de otro jugador | Rechazado | ✔ |
| Apodo de 2 caracteres o con caracteres no permitidos | Rechazado | ✔ |
| Escribir en una colección no prevista | Rechazado | ✔ |
| Jugada válida, apodo válido, borrar lo propio | Permitido | ✔ |

**CRUD en la app** (en local y en la URL de Vercel), comprobando cada cambio al recargar:

| Operación | Prueba | Local | Vercel |
|---|---|---|---|
| Consultar | El día 1 carga sus 10 canciones desde Firestore | ✔ | ✔ |
| Agregar | Adivinar una canción guarda la jugada (100 pts) | ✔ | ✔ |
| Recargar | La jugada sigue en el estante y la canción no se repite | ✔ | ✔ |
| Agregar | Elegir un apodo crea la entrada en el ranking | ✔ | ✔ |
| Modificar | Cambiar el apodo lo actualiza en el ranking | ✔ | ✔ |
| Eliminar | Borrar la jugada del estante descuenta los puntos | ✔ | ✔ |
| Eliminar | "Salir del ranking" borra la entrada | ✔ | ✔ |
| Errores | Formularios vacíos, apodo inválido, credenciales incorrectas y falta de índice muestran el error real | ✔ | — |
| Admin | Login, fecha de inicio e importación de 138 títulos | ✔ | ✔ (login) |

**Celular** (URL publicada, pantalla de 375 × 812): sin scroll horizontal; el audio suena, la lista de sugerencias se usa con el dedo, el acierto se guarda y el perfil, el estante y el ranking se ven bien. ✔

**"Ponte al día"** (URL publicada): con la fecha de inicio movida un día atrás desde el panel admin, el día 1 pasó a ser un día pasado. Las pistas mostraron 50 / 30 / 15, el acierto dio **"Ganaste 50 puntos"** y el estante lo marcó como **(atrasada)**. Además, contra las reglas: mandar una jugada atrasada como "a tiempo" o con 100 puntos se **rechaza**; con 50 puntos se acepta. ✔

**Actualización y despliegue:** cada push a `main` generó un despliegue nuevo en Vercel que terminó en estado *Ready*; los cambios (por ejemplo, el logo de TMDB) aparecieron en la URL publicada. Listado en `docs/evidencias/vercel-despliegues.txt`; la configuración de la base, en `docs/evidencias/firestore-base.txt`.

**Capturas de V1** (`docs/capturas/`):

| Compu | Celular | Celular |
|---|---|---|
| ![Inicio](docs/capturas/v1-01-inicio-escritorio.jpg) | ![Sonando](docs/capturas/v1-04-celular-sonando.jpg) | ![Acierto](docs/capturas/v1-06-celular-acierto.jpg) |
| Inicio | Fragmento sonando | Acierto con revelación |
| ![Admin](docs/capturas/v1-02-admin-ingreso.jpg) | ![Estante](docs/capturas/v1-08-celular-estante.jpg) | ![Ranking](docs/capturas/v1-09-celular-ranking.jpg) |
| Ingreso al panel admin | Estante | Ranking |
| ![Atrasada](docs/capturas/v1-10-estante-con-jugada-atrasada.jpg) | ![Autocompletado](docs/capturas/v1-05-celular-autocompletado.jpg) | ![Perfil](docs/capturas/v1-07-celular-perfil-apodo.jpg) |
| Jugada atrasada (mitad de puntos) | Autocompletado | Apodo guardado |

### Dificultades y cómo se resolvieron

| Dificultad | Cómo se investigó | Solución |
|---|---|---|
| La CLI no pudo crear el proyecto: *"Callers must accept Terms of Service"* | Se leyó el log de depuración de `firebase-tools` | Aceptar los términos de Google Cloud en la consola y reintentar |
| Error 403 al agregar Firebase al proyecto de Google Cloud | Mismo log; reintento tras unos segundos | Crear el proyecto desde la consola de Firebase (aceptando sus términos) |
| No se podía crear Firestore desde la CLI: API desactivada | Mensaje de error de la CLI | Crear la base desde la consola, que activa la API |
| **La base quedó en "modo de prueba", abierta a cualquiera** | Una lectura sin sesión respondió 404 (permitido) en vez de 403 | Publicar las reglas antes de cargar cualquier dato |
| TMDB devolvió películas equivocadas (remake de 2025, una de Hitchcock con el mismo título en español, una película duplicada) | Revisión manual de los 138 resultados | Años de referencia y correcciones en el script |
| "Falta un índice" al abrir el juego | Error mostrado en pantalla y mensaje de Firestore | Publicar el índice compuesto y esperar a que se construya |
| Vercel detectó el proyecto como "Other" con salida `public` | `vercel project inspect` | Fijar Vite y `dist` en `vercel.json` |
| **La CLI de Vercel iba a subir `.env` y el token de TMDB** | Prueba en seco (`vercel deploy --dry`) | Agregar `.vercelignore` |
| Vercel agregó una regla `.env*` al `.gitignore` que anulaba la excepción de `.env.example` | Revisión del diff | Quitar esa regla |
| Vercel no podía conectar el repo privado | Mensajes de `vercel git connect` | Conectar GitHub al login de Vercel e instalar la app de Vercel solo para este repositorio |
| Las instrucciones de un día pasado mostraban los puntos completos | Prueba de "ponte al día" en la URL publicada | Pasarle a las instrucciones si el día es atrasado |
| Las capturas salían oscuras | Se revisaron los estilos de la página: estaban bien | La animación de entrada todavía no había terminado; se esperó antes de capturar |

### Decisiones sobre datos y terceros

- **Privacidad:** los jugadores son anónimos; no se guardan emails ni nombres. El apodo tiene el aviso "No uses tu nombre real".
- **YouTube:** no se tapa el reproductor (lo prohíben sus políticas); se usa solo para la revelación.
- **Deezer:** uso no comercial; sus términos no mencionan juegos. Se guarda solo el id del tema, nunca audio.
- **TMDB:** uso no comercial con atribución en el pie de página; sus datos no deben guardarse más de 6 meses.
- **Limitación conocida:** el total del ranking lo calcula el navegador y no se puede verificar sin backend (documentado en el README).

### Uso de IA

Herramienta: **Claude Code** (Claude, de Anthropic), dentro de la app de escritorio de Claude. Se usó para planificar, generar código, investigar términos de uso de APIs, interpretar errores y ejecutar comandos de las CLIs (`firebase-tools`, `vercel`, `gh`). Cada paso se revisó y probó antes de seguir; los pasos sobre cuentas (logins, términos, consola de Firebase, permisos de GitHub) los hice yo.

Ejemplos representativos de instrucciones dadas a la IA:

- *"Trabajá por pasos pequeños y frená después de cada uno para que yo pueda probar antes de seguir."*
- *"No quiero que se repitan las canciones; una vez que se terminen, que aparezca algo como 'muy bien, adivinaste todas las canciones del día'. Y al principio, un instructivo de cómo jugar."*
- *"Cuando escribe una letra, que aparezca un menú desplegable para poner bien el nombre, porque a veces lo puse mal aunque lo sabía."*
- *"Mirá la página de GTA VI, sus transiciones, movimientos y difuminados; me gustaría un diseño similar."*
- *"No quiero retener datos de usuarios ni mails; nada de cosas ilegales."* (de acá salió el login genérico para el admin)
- *"Nunca imprimas valores de claves. Antes de cada commit mostrame los archivos."*

También se agregó el **logo oficial de TMDB** en el pie de página, como piden sus términos.

### Pendientes para V2

- Rediseño a partir de bocetos propios en Figma (estante tipo VHS, pantalla de juego).
- Capturas de las consolas de Firebase y Vercel (requieren iniciar sesión).
- Revisar el título dudoso (*Cuenta conmigo*) y ajustar el segundo de inicio de los fragmentos poco reconocibles.
- Mostrar los puntos del día recién al guardar la jugada (hoy se actualizan al pasar a la siguiente canción).

---

## V2 — Diseño "Mi videoteca"

Concepto: el perfil es un mueble de madera con estantes llenos de cintas VHS vistas de lomo. Cada estante es un día (10 cintas). Adivinar un título "graba" su cinta; las no adivinadas son cintas negras lisas, sin ningún dato que adelante la respuesta. Esta etapa es solo diseño y front: no cambian las reglas de Firestore, el modelo de datos ni la lógica del juego. Se trabaja en tres iteraciones (A, B y C).

### Iteración A — Sistema base

**Qué cambió**
- **Variables de diseño** en `src/styles/tokens.css`: colores, radios, sombras, espaciados y tipografías. La interfaz pasa a ser sobria (grafito en oscuro, crema en claro); el color fuerte queda solo en las cintas y en los estados de acierto/error.
- **Tema claro y oscuro** con botón en la barra de navegación. El valor inicial sale de la preferencia del sistema (`prefers-color-scheme`) o de la última elección guardada en `localStorage` (solo esa preferencia de interfaz, nunca datos del juego). Un script chico en `index.html` aplica el tema antes de que cargue React, para que la página no "parpadee". El mueble es igual en los dos temas; cambia la "habitación" (fondo y luz).
- **Tipografías**: Archivo (variable, con eje de ancho: condensada para títulos y lomos, normal para el texto) e IBM Plex Mono para los datos técnicos ("T-120", "DÍA 1"). Se cargan desde Google Fonts con `font-display: swap`.
- **Componente `<VhsTape />`** dibujado solo con CSS, con dos vistas: lomo (estante) y carátula. Cinco combinaciones de colores y franjas; cada título recibe siempre la misma, calculada con un hash de su id (`utils/tapeLook.js`). Del mismo hash salen pequeñas variaciones de alto, ancho e inclinación, para que el estante no parezca una grilla perfecta.
- **Estante** en el perfil, con datos reales: un estante por día desbloqueado, las cintas grabadas primero y el resto negras; los días futuros aparecen como un hueco cerrado. Arriba, la carátula de la última grabación.

**Por qué**
- Variables primero: todas las pantallas cambian juntas y el tema claro/oscuro es solo cambiar valores.
- Archivo tiene eje de ancho: con una sola familia salen el título condensado del lomo y el texto normal (menos archivos para descargar).
- Hash determinista y no azar: si fuera al azar, cada recarga cambiaría los colores de la misma película.

**Alternativas descartadas**
- Tipografías: Oswald + Space Mono (Space Mono es muy ancha para datos chicos en el lomo) y Barlow Condensed + JetBrains Mono (bien, pero son dos familias más y Barlow no tiene eje de ancho). Bebas Neue (V1) solo tiene mayúsculas y un peso.
- Reescribir todo el CSS anterior de una vez: se optó por que los nombres de variables viejos apunten a los nuevos y limpiar en la iteración C, para avanzar en pasos chicos.
- Leer los títulos de cada día para dibujar las cintas negras: habría gastado lecturas y revelado qué títulos hay en cada día. Se usa un archivo con la cantidad de títulos por día (`src/data/day-sizes.json`, sin nombres).

**Dificultades**
- El texto crema sobre la cinta verde no llegaba al contraste mínimo (3,4:1): se oscureció el verde hasta 4,9:1. Se midió el contraste de todas las combinaciones de texto en los dos temas.
- En la carátula angosta el título se cortaba en medio de una palabra: se usó un tamaño relativo al ancho de la carátula (container queries) y corte solo entre palabras.
- Varios colores del diseño anterior estaban escritos a mano (no en variables) y rompían el tema claro: se pasaron a variables.

**Capturas:** `docs/capturas/v2a-*` (perfil y estante en los dos temas, pantalla de juego).

### Iteración B — Interacción

**Qué cambió**
- **Cada lomo es un `<button>`**: se usa con mouse, dedo o teclado y tiene un nombre accesible ("El Rey León (1994). Ver detalles" o "Cinta sin grabar del día 2").
- **"Asomar" la cinta**: con el mouse encima (solo en dispositivos con `hover: hover`) o con Tab, la cinta sube 12 px, se inclina 4° desde la base, queda por encima de las vecinas y muestra un cartel con el título y el año. Si no está grabada, el cartel dice solo "Sin grabar".
- **Popup con `<dialog>` modal** (`showModal()`): póster grande, título, año, dirección, género, sinopsis corta (máx. 6 renglones), en qué pista se adivinó (3, 6 o 10 s), el día y los puntos (con "atrasada" si fue de un día pasado). Se cierra con Esc, con el botón o tocando el fondo oscuro; el foco vuelve al lomo que lo abrió.
- **Cinta sin grabar**: el popup es más chico, no muestra ningún dato y ofrece "Ir a jugar".
- **Borrar un acierto** pasó al popup ("Sacar del estante"); se sacó la lista de aciertos que había debajo del estante.
- **Transición**: el popup sale desde la posición del lomo, achicado y transparente, y viaja hasta el centro (340 ms); al cerrar se desvanece (160 ms).
- **Responsive**: debajo de 640 px cada día se parte en dos estantes de 5 cintas.

**Por qué**
- `<dialog>` con `showModal()` ya resuelve Esc, fondo oscuro y foco atrapado (el resto de la página queda inerte), sin librerías.
- 5 + 5 en vez de scroll horizontal: con 10 cintas en 320 px cada lomo quedaba de unos 25 px; partido en dos mide 47 px (más que los 44 px mínimos para tocar) y se ven todas las cintas sin un scroll escondido. La contra: en celular cada día ocupa dos estantes y el mueble es más alto.
- En pantallas táctiles no hay "asomar": el toque abre el popup directo (el efecto queda dentro de `@media (hover: hover)`).

**Alternativas descartadas**
- **View Transitions API** para animar del lomo al popup: según los datos de compatibilidad de MDN la tienen Chrome 111+, Safari 18+ y Firefox 144+ (muy reciente). Se eligió una animación CSS propia que funciona en todos y se deja View Transitions como posible mejora.
- **Scroll horizontal por fila** en celular: esconde cintas y compite con el scroll de la página.
- **Guardar dirección y sinopsis en cada jugada** para no leerlas: cambiaba el modelo de datos y las reglas. En su lugar, el popup pide el detalle del título **solo al abrir una cinta grabada** (1 lectura, que queda en memoria si se vuelve a abrir).

**Dificultades**
- Con el botón de tema agregado en A, la barra de navegación no entraba en 320 px y la página quedaba más ancha que la pantalla: el botón pasó al lado de la marca y los links bajan a una segunda línea.
- Los carteles invisibles de las cintas del borde ensanchaban la página: el mueble recorta solo hacia los costados (`overflow-x: clip`) y en pantallas táctiles los carteles no se dibujan.
- En la carátula chica del celular el texto técnico ocupaba 4 renglones: se oculta cuando la carátula mide menos de 150 px (container query).

**Pruebas**: 320, 375, 768 y 1280 px sin scroll horizontal (lomos de 47, 58, 52 y 52 px); mouse, Tab + Enter, Esc, click en el fondo, toque en celular; "Sacar del estante" borra en Firestore y sigue borrado al recargar.

**Capturas:** `docs/capturas/v2b-*`.

### Iteración C — Pulido, consistencia y auditoría

**Qué cambió**
- **Madera y luz**: el mueble tiene veta (ruido SVG con `feTurbulence`, generado por código, sin imágenes) y una luz que cambia con el tema: lámpara cálida desde arriba en oscuro, luz de ventana en diagonal en claro.
- **Micro-detalles**: etiquetas de papel con bordes apenas amarillentos y grano fino; etiqueta del día "pegada a mano" (levemente torcida). La carátula sin grabar quedó igual de apagada que el lomo.
- **Mismo sistema en todas las pantallas**: se reescribió el CSS general sin los restos del diseño anterior (atardecer, palmeras, neón).
  - Inicio: tarjeta sobria con una fila de cintas decorativas con textos genéricos ("3 segundos", "Banda sonora", "¿De qué es?") que no adelantan respuestas.
  - Jugar: el recuadro del audio es ahora una **casetera (VCR)** con display ámbar "▶ PLAY / ■ STOP", ecualizador y contador del fragmento.
  - Fichas de puntos como etiquetas de cinta con franjas de color; el podio del ranking lleva la franja de color de una cinta.
- **Estados de carga, vacío y error** con un componente común (`StatusMessage`): un cassette chico cuyas bobinas giran mientras carga; el error se anuncia a lectores de pantalla (`role="alert"`). Se usa en todas las pantallas.

**Auditoría de accesibilidad**
- Se escribió un script propio que recorre los textos visibles y calcula el contraste real con los colores computados (fórmula WCAG). Resultado: todos los textos pasan AA en las 5 pantallas y en los 2 temas. Los textos sobre degradados (etiquetas, madera) se calcularon aparte: el más justo es el contador "2/10" sobre la madera más clara (4,7:1); por eso se le sacó la opacidad que tenía.
- Todo lo interactivo tiene nombre accesible, las imágenes tienen `alt`, los títulos siguen un orden (h1 > h2) y hay foco visible de 3 px en links, botones, campos y lomos. Los botones y áreas táctiles miden al menos 44 px.
- `prefers-reduced-motion`: sin animaciones, sin transiciones y sin inclinaciones.

**Auditoría de rendimiento**
- Prueba del peor caso: 270 cintas (27 días × 10). Insertarlas y calcular el layout tarda unos 20 ms una sola vez, y "asomar" una cinta cuesta 0,09 ms. **No hizo falta virtualizar ni `content-visibility`**; además `content-visibility` recortaría los carteles que suben por encima de cada fila.
- No se agregaron lecturas a Firestore en esta iteración. El paquete de JavaScript (270 KB comprimido) es casi todo Firebase y React; se verificó que no incluya datos del juego (respuestas, ids de Deezer).

**Alternativas descartadas**
- **axe-core** para la auditoría: la herramienta del navegador de pruebas no permite cargar código externo en la página; se reemplazó por un script propio que mide lo mismo para contraste, nombres accesibles, `alt` y títulos.
- **Imágenes de textura de madera**: se prefirió ruido SVG generado por código (pesa unos bytes y se adapta a cualquier tamaño).
- **Separar el panel admin en otro archivo** (carga diferida): ahorraba pocos KB frente a Firebase; no justificaba la complejidad.

**Dificultades**
- El primer chequeo de contraste del tema claro "falló" en la barra de navegación: el navegador devuelve los colores de `color-mix()` en formato `color(srgb …)` con valores de 0 a 1, y el script los leía como 0–255. Se corrigió el script, no el diseño.
- Al reemplazar el recuadro del audio quedó un `<div>` mal cerrado y el build falló; se corrigió antes de seguir.
- La captura del ranking mostraba el apodo de un jugador real: no se guardó en el repositorio.

**Capturas:** `docs/capturas/v2c-*`.

### Publicación y verificación de V2 (27/10)

`diseno-videoteca` pasó a `main` sin reescribir el historial (commit `7c37241`). El push generó un despliegue de producción que terminó en *Ready*. Se abrió la URL pública sin iniciar sesión y mostró el diseño nuevo. La V1 sigue guardada en el tag `v1`.

**Dificultad con las vistas previas:** una compañera no pudo abrir el link de la vista previa porque Vercel las protege con inicio de sesión. Se decidió publicar en producción, que ya era pública, en lugar de quitar esa protección.

**Dificultad con el despliegue:** Vercel bloqueó las vistas previas porque los commits A y B tenían un correo de autor sin cuenta asociada. Se configuró el correo correcto y se agregó un commit nuevo, sin *force push*.

---

## V3 — Versión final

Partió de una prueba real y de revisar la app contra la consigna del TP y del final.

### Correcciones

**1. "No tenés permiso" al abrir Jugar (4/11)**
- **Cómo apareció:** un compañero mandó una captura del error; en mi compu el juego andaba bien.
- **Cómo se investigó:** se simuló el reloj del navegador en la URL publicada. Con el reloj 1 minuto atrasado o en hora, cargaba; con 5 segundos o 1 minuto adelantado, aparecía el mismo mensaje. Queda como causa más probable; falta confirmar la hora de su compu.
- **Causa:** la consulta pedía títulos "desbloqueados hasta ahora" según la compu, y la regla no permite pedir nada posterior a la hora del servidor. Si el reloj está adelantado, Firestore rechaza toda la consulta. La regla estaba bien; el error estaba en la consulta y venía desde la V1.
- **Solución:** el límite de la consulta es ahora la apertura de ese día (`unlockAtFor`), que se calcula con la fecha de inicio. Las reglas no cambiaron.
- **Reloj muy corrido:** si la compu cree que ya es otro día, las reglas siguen rechazando, y la app ahora pide revisar la fecha y la hora en lugar de decir "No tenés permiso".

**2. Jugar vacío al pasar los días cargados (6/11)**
- **Cómo apareció:** al revisar la app contra las fechas de entrega. Hay 14 días cargados, y simulando el 13/11 Jugar abría en el "Día 19" con "No hay canciones para este día".
- **Solución:** el calendario llega hasta el último día cargado (`day-sizes.json`). Después de eso, Jugar abre en ese día y avisa que ya se abrieron todos y que valen la mitad de puntos.

### Cómo se verificó

Pruebas de solo lectura en local, contra la base real:

| Caso | Antes | Ahora |
|---|---|---|
| Reloj 1 minuto atrasado o en hora | Carga | Carga |
| Reloj 5 segundos o 1 minuto adelantado | "No tenés permiso" | Carga |
| Reloj 30 minutos adelantado | — | Carga |
| Reloj 2 días atrasado | — | Carga |
| Reloj 2 días adelantado | — | Pide revisar la fecha y la hora |
| Calendario más allá de los días cargados | Día vacío | Abre en el último día, con pistas de 50, 30 y 15 puntos |

El último caso no se pudo probar con los 14 días, porque en la fecha de la prueba el servidor todavía no los había abierto. Se redujeron a 10 los días cargados solo en local, se simuló el 13/11 y después se restauró el archivo.

**Sin probar:** guardar una jugada con el reloj muy corrido. Queda como limitación conocida en el README.

**Capturas:** `docs/capturas/v3-*`.

### Documentación

- **README:** se corrigieron las tipografías, la estructura de carpetas y la limitación del reloj, que decía algo incorrecto.
- **Informe:** se agregó `INFORME.md`, con lo que pide la entrega.

### Publicación de V3 y marcas de versión (6/11)

`main` avanzó hasta `6ce3fdc` sin merge ni reescribir el historial, y Vercel lo publicó. En la URL pública, con el reloj en hora y adelantado 5 segundos o 1 minuto, Jugar cargó bien; antes, adelantado, mostraba "No tenés permiso". Ranking y Perfil también cargaron. El tope de días en el sitio público recién se ve desde el 9/11; antes se probó en local.

Se marcó cada versión con un tag de Git:

| Tag | Commit | Qué tiene |
|---|---|---|
| `v1` | `0991e43` | Primera versión funcional publicada |
| `v2` | `7c37241` | Diseño "Mi videoteca" (iteraciones A, B y C) |
| `v3` | `6ce3fdc` | Arreglos del reloj y de los días, informe y documentación |
| `v3.1` | `718250e` y su registro | Optimización de la velocidad de carga |

La optimización quedó fuera de `v3` a propósito: cambiaba cómo se guarda todo en la base real, y antes había que probar las escrituras.

---

## V3.1 — Velocidad de carga (6/11)

**Cómo apareció:** la pantalla de juego se sentía lenta. Primero se midió, para no optimizar a ciegas.

| Medición | Antes | Ahora |
|---|---|---|
| Código JavaScript (comprimido) | 270 KB | 158 KB |
| Datos del perfil listos al recargar | ~1280 ms | ~380 ms |
| Abrir una pantalla por primera vez | 195–537 ms | 86–98 ms |
| Volver a una pantalla ya abierta | 135–299 ms | 13–21 ms |
| Canción lista al empezar | Hasta 2,7 s la primera consulta a Deezer | Al instante si ya se adelantó |

Medido en una sola compu y conexión, contra la base real: "antes", en la URL publicada; "ahora", con la versión compilada en local. Son referencias, no valores exactos.

**Qué se cambió**
- **Firestore "lite":** consulta por HTTP en lugar de abrir una conexión permanente, que tardaba unos 750 ms. La app no escucha cambios en vivo, así que no se pierde nada.
- **Auth sin ventana emergente:** `initializeAuth` con los mismos lugares de guardado, para que nadie pierda su sesión. Se comprobó que la sesión anónima siguió siendo la misma.
- **Caché en memoria** (`services/cache.js`): lo ya leído se reutiliza mientras la pestaña está abierta y se actualiza al guardar o borrar. No guarda nada en el navegador.
- **Datos adelantados:** al pasar el mouse o tocar un enlace ya se piden los datos de esa pantalla.
- **Audio adelantado:** se piden la canción actual y la siguiente antes de que el jugador las necesite.
- **Inicio:** no espera a que se abra la sesión, porque no lee datos.
- **YouTube:** se muestra una miniatura y el reproductor, que es pesado, se carga recién al tocar play.
- **Pósters:** se pide el de 342 px en lugar del de 500 px y se adelanta al acercarse a la cinta.
- **Vercel:** los archivos con nombre único se guardan un año en la caché del navegador.
- **Fuentes:** ya no frenan el primer dibujo de la página.
- **CSS:** barra de navegación sin desenfoque, cintas que animan solo `transform` y entradas de pantalla más cortas.
- **Versión nueva con la pestaña abierta:** si faltan archivos viejos, la página se recarga sola en lugar de quedar en blanco (`vite:preloadError`).
- **Botones de día:** el texto quedó centrado; estaba pegado a la izquierda.

**Alternativas descartadas**
- **Un archivo por pantalla (`React.lazy`):** ahorraba solo unos 11 KB y sumaba unos 300 ms, porque React demora mostrar contenido justo después de un estado de carga. Se midió y se dejó aparte solo el panel admin.
- **Reemplazar el ruido SVG de la madera:** dibujarlo tarda 3–6 ms; no era el problema.
- **Guardar datos en `localStorage`:** se descartó para seguir usándolo solo para el tema.

**Limitaciones:** un jugador nuevo sigue esperando la creación de su sesión anónima (cerca de 1,5 s en la prueba), porque la hace Firebase. Tampoco se controla cuánto tarda Deezer en responder la primera vez.

**Sin verificar:** la miniatura de YouTube no cargó desde la compu de las pruebas, ni desde el navegador ni desde la terminal; el botón y la carga del reproductor sí funcionaron. Si la imagen no llega, se ve un fondo negro con el botón de play.

**Dificultades**
- Las escrituras no se podían probar con el navegador automático, porque la base es la real y la herramienta las bloqueó. Por eso la prueba de guardar y borrar se hizo a mano antes de publicar.
- `initializeAuth` falla si se vuelve a ejecutar al editar `firebase.js` con el servidor de desarrollo abierto (`auth/already-initialized`). Solo pasa al editar ese archivo; se resuelve recargando la página.
- El servidor de desarrollo no respondía si se abría desde la herramienta de la IA; arrancó desde una terminal normal.

**Prueba manual antes de publicar** (el autor, en local, contra la base real): guardar una jugada y recargar, elegir y cambiar el apodo, sacar la cinta, salir del ranking y abrir `/admin`.

**Publicación y verificación en producción:** `main` avanzó hasta `718250e` sin merge ni reescribir el historial, y Vercel lo publicó. En la URL pública:

| Prueba | Resultado |
|---|---|
| El sitio sirve el código nuevo | Sí, el mismo archivo que la compilación local |
| JavaScript comprimido que se descarga | 161 KB (276 KB antes, en la misma medición) |
| Caché de `/assets` | `public, max-age=31536000, immutable` |
| Caché de las páginas | `max-age=0`: cada visita recibe la versión vigente |
| Datos del perfil, desde la respuesta de la sesión | Unos 160 ms |
| Abrir una pantalla por primera vez | 93–116 ms |
| Volver a una pantalla ya abierta | 12–13 ms |
| Reloj adelantado 5 segundos o 1 minuto | Jugar carga |
| Audio | La casetera pasa a PLAY al tocar Escuchar |
| Lectura de `titles` sin sesión | Rechazada (403) |
| Errores en la consola | Ninguno |

En la URL pública no se escribieron datos de prueba: guardar y borrar se probó a mano en local, contra la misma base y con el mismo código.

**Pendiente de esta entrega:** hacer público el repositorio o sumar al profesor, grabar el mini video y completar en `INFORME.md` lo marcado con [completar]. Siguen abiertos de V1 el título dudoso (*Cuenta conmigo*) y el ajuste de los fragmentos poco reconocibles.

---

## Prueba aparte — Estilo a partir de un DESIGN.md (rama `prueba-design-md`, 6/11)

**Qué es:** un experimento para ver cómo queda la app con un documento de diseño ajeno. No es parte de la versión entregada: vive solo en esta rama y `main` no cambió.

**Fuente:** `design-md/spotify/DESIGN.md` de [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) (licencia MIT). Se eligió porque es una app de música oscura, donde el color lo aporta el contenido, igual que las cintas acá.

**Qué se aplicó** (todo en `src/styles/design-md.css`, sin tocar la lógica ni los datos): fondo casi negro, verde solo en acciones principales y en lo que suena, botones en forma de píldora, títulos compactos sin mayúsculas, superficies sin bordes y reproductor sin aparato. Las cintas y el mueble no cambiaron.

**Qué se adaptó**
- **Tipografía:** la original es propia de la marca; se usó Figtree, de Google Fonts.
- **Marca:** no se usa su logo ni su nombre en la interfaz.
- **Tema claro:** se ocultó el selector, porque el documento pide fondo oscuro siempre.

**Pruebas:** a 320 px sin scroll horizontal en las 4 pantallas; todos los textos fuera de las cintas pasan AA con el script propio de contraste; botones de al menos 44 px; el popup abre. Solo lectura: no se probó guardar datos, aunque no se tocó ese código.

**Para volver atrás:** borrar `src/styles/design-md.css` y su `import` en `main.jsx`.

**Capturas:** `docs/capturas/prueba-design-md-*`.
