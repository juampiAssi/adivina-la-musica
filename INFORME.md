# Informe — Adiviná la música

Trabajo práctico 2 · Desarrollo Frontend II (UADE) · 2026

**Integrantes:** Juan Pablo Assirio y Belén Florio

## Enlaces

- **Aplicación publicada:** https://adivina-la-musica.vercel.app
- **Repositorio:** https://github.com/juampiAssi/adivina-la-musica
- **Bitácora del proceso:** [`BITACORA.md`](BITACORA.md)
- **Demostración (mini video):** https://drive.google.com/drive/folders/1VkWWnroAxH0vQDt6pGbEh_a9SKH4spSp?usp=sharing

## Idea y público

Juego para adivinar de qué película, serie, anime o videojuego es una música. La canción suena de corrido hasta 30 segundos y, cuanto antes se la reconoce, más puntos vale. Hay un juego del día (Popurrí) y modos libres para practicar. Cada acierto de Popurrí "graba" una cinta VHS en la videoteca personal del jugador.

**Necesidad que resuelve:** un desafío corto y repetible para quienes disfrutan de las bandas sonoras, que además deja un registro de lo que fueron adivinando.

**Público:** personas que consumen películas, series y videojuegos, y buscan una partida breve para jugar todos los días.

## Funciones implementadas

- **Tres modos de juego:**
  - **Popurrí:** el juego del día, con las mismas canciones para todos. Los días pasados se pueden jugar con la mitad de puntos ("ponte al día").
  - **Por contenido:** 10 canciones al azar de películas, series, anime o videojuegos.
  - **Tranqui:** se elige entre 4 opciones, sin escribir.
  Solo Popurrí guarda jugadas y suma al ranking.
- **Canción de corrido:** suena hasta 30 segundos. Vale 100 puntos hasta el segundo 3 y pierde 3 por segundo, hasta 19 en el 30.
- **"¡La sé!":** frena la canción y los puntos, y da 10 segundos para escribir con autocompletado, en español o inglés. Hay 3 intentos; si se falla, la canción sigue desde donde estaba. A los 10 segundos se muestra el tipo de contenido y a los 20, el año.
- **Catálogo:** 157 títulos: 112 películas, 17 series, 15 animes y 13 videojuegos.
- **Revelación** de la respuesta con el video de YouTube, que carga al tocar play, o la portada del tema.
- **Mi videoteca:** mueble con un estante por día. Las cintas se graban al acertar; las demás son negras, sin datos que adelanten la respuesta. Cada cinta abre un popup con póster, ficha, segundos que tardó y puntos.
- **Ranking** de los 20 mejores puntajes, con apodo a elección.
- **Perfil:** crear, cambiar y borrar el apodo, y sacar cintas del estante.
- **Panel de administración:** ingreso con correo y contraseña, fecha de inicio del calendario e importación de títulos por JSON o CSV.
- **Experiencia de uso:** validaciones, estados de carga, vacío y error, mensajes de éxito y de error, tema claro y oscuro, diseño para compu y celular, uso con teclado.

**Versiones** (cada una es un tag de Git):

| Versión | Qué cambió |
|---|---|
| `v1` | Primera versión funcional, con Firebase y Vercel |
| `v2` | Diseño "Mi videoteca", en tres iteraciones |
| `v3` | Correcciones a partir de pruebas reales y documentación |
| `v3.1` | Velocidad de carga |
| `v3.2` | Canción de corrido, puntaje por segundo, modos de juego, anime y más videojuegos |

El detalle está en la bitácora.

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
| `titles` | Catálogo: nombre, alternativas válidas, tipo de contenido, ficha, id del tema en Deezer, día de Popurrí y fecha de apertura |
| `guesses` | Jugadas de Popurrí: segundos que tardó, puntos, si acertó, si fue atrasada y una copia mínima para el estante |
| `leaderboard` | Apodo, puntos totales y cantidad de aciertos |
| `admins` | Qué cuenta es administradora |

**Privacidad:** los jugadores entran con sesión anónima. No se guardan correos ni nombres reales, y la app avisa que no se use el nombre real como apodo. No se guarda audio: de Deezer solo se guarda el id del tema.

**Permisos:** las reglas de `firestore.rules` rechazan todo lo que no está permitido. Cada jugador solo lee y borra sus jugadas, y solo puede guardar una jugada de un título que ya abrió según la hora del servidor. Los puntos se validan con la misma cuenta que usa la app. El catálogo se puede leer con sesión, porque lo usan los modos libres.

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
- **Mecánica nueva:** *"El juego a partir de ahora no va a ser por segundos, sino que vamos a dejar que la canción corra de corrido; mientras los segundos vayan bajando, el puntaje vaya bajando."* Surgió de un comentario del profesor sobre la dificultad del juego.
- **Velocidad:** *"Quiero que todo cargue rapidísimo y que no haya lag."* Antes de cambiar nada, se midió qué tardaba.

## Por qué tiene esta apariencia

La app pasó por un prototipo con atardecer y neón inspirado en un videojuego, y después se reemplazó por "Mi videoteca". El coleccionismo de cintas le da sentido al estante: cada acierto se ve como un objeto. La interfaz queda sobria y el color vive en las cintas, para que el estante sea lo que llama la atención. El detalle de cada decisión y las alternativas descartadas están en la bitácora.

_[Completar con tus palabras: qué te gustó, qué pediste cambiar y qué decidiste vos. Es lo que evalúa la consigna como elaboración propia.]_

## Dificultades y soluciones principales

- **Audio:** la API de Deezer no permite llamadas directas desde el navegador y sus enlaces vencen a los 15 minutos. Se pide el fragmento al momento de jugar, usando JSONP.
- **Base abierta:** Firestore quedó en modo de prueba al crearla. Se detectó con una lectura sin sesión y se publicaron las reglas antes de cargar datos.
- **Archivos sensibles:** una prueba en seco mostró que la CLI de Vercel iba a subir los `.env`. Se agregó `.vercelignore`.
- **Error con un usuario real:** a un compañero no le cargaba el juego porque la consulta usaba la hora de su compu y las reglas, la del servidor. Se reprodujo simulando el reloj y se corrigió la consulta.
- **Días agotados:** al pasar los 14 días cargados, Jugar abría vacío. Ahora abre en el último día disponible.
- **Probar sin tocar la base real:** la herramienta de IA no puede escribir en la base real. Se instaló el emulador de Firebase para probar las reglas (9 pruebas automáticas) y la app completa con datos de prueba.
- **Pocas canciones al reiniciar el calendario:** los modos libres quedaron casi vacíos. Se decidió que usen todo el catálogo, aceptando que se puedan leer respuestas futuras en un juego sin premios.
- **Velocidad:** se midió antes de cambiar nada. La conexión de Firestore y la primera respuesta de Deezer eran lo más lento. Con Firestore lite, una caché en memoria y datos adelantados, abrir una pantalla bajó de 195–537 ms a 86–98 ms en la misma compu. Separar cada pantalla en un archivo aparte empeoraba la carga, y se descartó después de medirlo.

El resto está en [`BITACORA.md`](BITACORA.md).
