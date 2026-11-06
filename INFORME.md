# Informe — Adiviná la música

Trabajo práctico 2 · Desarrollo Frontend II (UADE) · 2026

**Autor/es:** _[completar nombre y L.U.]_

## Enlaces

- **Aplicación publicada:** https://adivina-la-musica.vercel.app
- **Repositorio:** https://github.com/juampiAssi/adivina-la-musica
- **Bitácora del proceso:** [`BITACORA.md`](BITACORA.md)
- **Demostración (mini video):** _[completar enlace]_

## Idea y público

Juego diario para adivinar de qué película, serie o videojuego es una música. Suena un fragmento de 3 segundos; si no se reconoce, se puede pedir uno de 6 y después uno de 10, pero cada pista extra vale menos puntos. Cada acierto "graba" una cinta VHS en la videoteca personal del jugador.

**Necesidad que resuelve:** un desafío corto y repetible para quienes disfrutan de las bandas sonoras, que además deja un registro de lo que fueron adivinando.

**Público:** personas que consumen películas, series y videojuegos, y buscan una partida breve para jugar todos los días.

## Funciones implementadas

- **Juego por días:** cada día abre un grupo de títulos nuevos. Los días pasados se pueden jugar con la mitad de puntos ("ponte al día").
- **Pistas de audio** de 3, 6 y 10 segundos (100, 60 y 30 puntos), con autocompletado de respuestas en español o inglés y opción de saltear.
- **Revelación** de la respuesta con el video de YouTube, que carga al tocar play, o la portada del tema.
- **Mi videoteca:** mueble con un estante por día. Las cintas se graban al acertar; las demás son negras, sin datos que adelanten la respuesta. Cada cinta abre un popup con póster, ficha, pista usada y puntos.
- **Ranking** de los 20 mejores puntajes, con apodo a elección.
- **Perfil:** crear, cambiar y borrar el apodo, y sacar cintas del estante.
- **Panel de administración:** ingreso con correo y contraseña, fecha de inicio del calendario e importación de títulos por JSON o CSV.
- **Experiencia de uso:** validaciones, estados de carga, vacío y error, mensajes de éxito y de error, tema claro y oscuro, diseño para compu y celular, uso con teclado.

**Versiones:** `v1` (primera versión funcional), `v2` (diseño "Mi videoteca"), `v3` (correcciones a partir de pruebas reales y documentación) y `v3.1` (velocidad). El detalle está en la bitácora.

## Operaciones sobre Firestore

| Operación | Dónde se hace en la app | Código |
|---|---|---|
| Consultar | Títulos del día, ranking, jugadas propias | `titlesService.js`, `leaderboardService.js`, `guessesService.js` |
| Agregar | Guardar una jugada; entrar al ranking con un apodo | `saveGuess`, `saveMyEntry` |
| Modificar | Cambiar el apodo; recalcular los puntos del ranking | `saveMyEntry` |
| Eliminar | Sacar una cinta del estante; salir del ranking | `deleteGuess`, `deleteMyEntry` |

La conexión con Firebase está en `src/services/firebase.js`, que lee las variables `VITE_FIREBASE_*` con `import.meta.env`.

## Información guardada en Firebase

| Colección | Qué guarda |
|---|---|
| `config` | Fecha de inicio del calendario y zona horaria |
| `titles` | Títulos de cada día: nombre, alternativas válidas, ficha, id del tema en Deezer y fecha de apertura |
| `guesses` | Jugadas de cada jugador: pistas usadas, puntos, si acertó, si fue atrasada y una copia mínima para el estante |
| `leaderboard` | Apodo, puntos totales y cantidad de aciertos |
| `admins` | Qué cuenta es administradora |

**Privacidad:** los jugadores entran con sesión anónima. No se guardan correos ni nombres reales, y la app avisa que no se use el nombre real como apodo. No se guarda audio: de Deezer solo se guarda el id del tema.

**Permisos:** las reglas de `firestore.rules` rechazan todo lo que no está permitido. Cada jugador solo lee y borra sus jugadas, los títulos se pueden leer recién cuando abre su día según la hora del servidor, y los puntos de cada jugada se validan.

## Herramientas de IA utilizadas

**Claude Code** (Claude, de Anthropic), en la app de escritorio de Claude. Se usó para planificar, generar código, investigar términos de uso de APIs, interpretar errores, probar la app en el navegador y ejecutar comandos de `firebase-tools`, `vercel` y `gh`.

**Cómo se revisó lo generado:** se trabajó por pasos chicos, con pruebas en `npm run dev` antes de cada commit. Cada commit y cada publicación necesitaron una aprobación explícita. Los pasos sobre cuentas (ingresos, términos, consola de Firebase, permisos de GitHub) los hizo el autor.

### Ejemplos representativos de instrucciones

- **Forma de trabajo:** *"Trabajá por pasos pequeños y frená después de cada uno para que yo pueda probar antes de seguir."*
- **Función del juego:** *"Cuando escribe una letra, que aparezca un menú desplegable para poner bien el nombre, porque a veces lo puse mal aunque lo sabía."*
- **Privacidad:** *"No quiero guardar datos ni mails de usuarios ni hacer cosas ilegales."* De acá salió el ingreso genérico para el administrador, sin Google.
- **Seguridad:** *"Nunca imprimas valores de claves en tus respuestas. Nunca commitees .env, JSON de cuentas de servicio ni claves privadas."*
- **Verificación:** *"Si no estás seguro de que un comando o flag exista, verificalo con --help; no asumas."*
- **Diseño:** *"Mi videoteca: un mueble de madera con estantes llenos de cintas VHS vistas de lomo. Cada fila = un día."* El diseño se trabajó en tres iteraciones (sistema base, interacción y pulido), para que no quedara en la primera propuesta de la IA.

## Por qué tiene esta apariencia

La app pasó por un prototipo con atardecer y neón inspirado en un videojuego, y después se reemplazó por "Mi videoteca". El coleccionismo de cintas le da sentido al estante: cada acierto se ve como un objeto. La interfaz queda sobria y el color vive en las cintas, para que el estante sea lo que llama la atención. El detalle de cada decisión y las alternativas descartadas están en la bitácora.

_[Completar con tus palabras: qué te gustó, qué pediste cambiar y qué decidiste vos. Es lo que evalúa la consigna como elaboración propia.]_

## Dificultades y soluciones principales

- **Audio:** la API de Deezer no permite llamadas directas desde el navegador y sus enlaces vencen a los 15 minutos. Se pide el fragmento al momento de jugar, usando JSONP.
- **Base abierta:** Firestore quedó en modo de prueba al crearla. Se detectó con una lectura sin sesión y se publicaron las reglas antes de cargar datos.
- **Archivos sensibles:** una prueba en seco mostró que la CLI de Vercel iba a subir los `.env`. Se agregó `.vercelignore`.
- **Error con un usuario real:** a un compañero no le cargaba el juego porque la consulta usaba la hora de su compu y las reglas, la del servidor. Se reprodujo simulando el reloj y se corrigió la consulta.
- **Días agotados:** al pasar los 14 días cargados, Jugar abría vacío. Ahora abre en el último día disponible.
- **Velocidad:** se midió antes de cambiar nada. La conexión de Firestore y la primera respuesta de Deezer eran lo más lento. Con Firestore lite, una caché en memoria y datos adelantados, abrir una pantalla bajó de 195–537 ms a 86–98 ms en la misma compu. Separar cada pantalla en un archivo aparte empeoraba la carga, y se descartó después de medirlo.

El resto está en [`BITACORA.md`](BITACORA.md).
