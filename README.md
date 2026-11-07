# Adiviná la música

Juego web para adivinar de qué **película, serie o videojuego** es una música. Cada día se desbloquean 10 canciones nuevas, que suenan de corrido hasta **30 segundos**: cuanto antes la reconozcas, más puntos vale. Cada acierto se guarda en tu **estante** y suma puntos en el **ranking**.

Trabajo práctico 2 de Desarrollo Frontend II (UADE). Pensado para quienes disfrutan de las bandas sonoras y quieren un desafío corto todos los días.

**App publicada:** https://adivina-la-musica.vercel.app

## Tecnologías

- **React + Vite**: interfaz, componentes, eventos y estado.
- **Firebase Authentication**: sesión anónima automática para jugadores y correo/contraseña para el administrador.
- **Cloud Firestore** (sin backend propio), con la versión `firebase/firestore/lite`: títulos, jugadas, ranking y configuración.
- **Vercel**: publicación, con despliegue automático en cada push a `main`.
- **Deezer API** (fragmentos de 30 s) para el audio y **TMDB** para los datos de películas y series.

## Cómo jugar

1. Tocá **Reproducir**: la canción suena de corrido hasta 30 segundos y los puntos van bajando.
2. Cuando la reconozcas, tocá **¡La sé!**. La canción y los puntos se frenan, y tenés 10 segundos para escribir y elegir el nombre de la lista (vale en español o en inglés).
3. Tenés 3 intentos. Si fallás, la canción sigue desde donde estaba. A los 10 segundos se muestra el tipo de contenido y a los 20, el año.
4. **Saltear canción** muestra la respuesta, pero no suma puntos.

La canción vale 100 puntos hasta el segundo 3 y después pierde 3 por segundo, hasta 19 en el segundo 30. Los días pasados ("ponte al día") valen la mitad, redondeada para abajo.

## Modos de juego

- **Popurrí:** el juego del día, con las mismas canciones para todos. Es el único que guarda jugadas: suma al ranking y graba cintas en el estante.
- **Por contenido:** 10 canciones al azar de películas, series, anime o videojuegos. Usa todo el catálogo.
- **Tranqui:** se elige entre 4 opciones, sin escribir.

Los modos libres usan todo el catálogo y no guardan nada.

## Instalación y ejecución local

Requisitos: **Node.js 20.19 o superior** y una cuenta de Firebase.

```bash
npm install
cp .env.example .env   # y completar los valores (ver abajo)
npm run dev            # abre http://localhost:5173
```

Otros comandos: `npm run build` (genera `dist/`), `npm run preview`, `npm run lint` y `npm test` (pruebas de la cuenta de puntos).

> Después de cambiar el archivo `.env` hay que reiniciar `npm run dev`.

### Probar sin tocar la base real

`npm run test:rules` prueba `firestore.rules` contra el emulador de Firebase (necesita Java 21 o superior). Para usar la app completa con datos de prueba:

```bash
npx firebase-tools emulators:start --only auth,firestore --project demo-adivina
node scripts/emulator-seed.mjs
VITE_EMULATOR=true VITE_FIREBASE_PROJECT_ID=demo-adivina npm run dev
```

## Configurar Firebase

1. En [Firebase Console](https://console.firebase.google.com/) crear un proyecto (Google Analytics no hace falta).
2. Registrar una **app web** (`</>`) y copiar los valores de `firebaseConfig` al archivo `.env`, una variable por línea y sin comillas ni comas:

   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

   Estas variables con prefijo `VITE_` quedan en el código del navegador: es normal para la configuración web de Firebase. **Nunca** se deben agregar claves privadas ni cuentas de servicio. Los permisos los controlan las reglas de Firestore. El `.env` está en `.gitignore`; en el repositorio solo está `.env.example`, sin valores.
3. **Firestore Database** → crear la base `(default)`, edición **Standard**, región `southamerica-east1` (São Paulo), en **modo producción**.
4. **Authentication** → Método de acceso: activar **Anónimo** y **Correo electrónico/contraseña**.
5. **Cuenta de administrador**:
   - Authentication → Usuarios → *Agregar usuario* con un correo genérico (por ejemplo `admin@tu-proyecto.test`) y una contraseña segura. No hace falta un correo real.
   - Copiar su **UID** y, en Firestore, crear la colección `admins` con un documento cuyo id sea ese UID (puede tener un campo cualquiera, por ejemplo `rol: "admin"`).
6. Authentication → Configuración → **Dominios autorizados**: agregar el dominio de Vercel (por ejemplo `adivina-la-musica.vercel.app`).

### Publicar las reglas y los índices

Las reglas e índices se publican **en Firebase**, no en Vercel (desplegar en Vercel no las actualiza):

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules,firestore:indexes --project TU_PROJECT_ID
```

El archivo `.firebaserc` tiene el proyecto por defecto (`adivina-la-musica`); si usás otro, pasalo con `--project`.

### Importar los títulos

1. Entrar a `/admin` con la cuenta de administrador.
2. En **Calendario**, guardar la **fecha de inicio** (día 1, a las 00:00 de Argentina).
3. En **Importar títulos**, elegir `seed/titles.json` (o un `.csv` con los mismos encabezados y los alias separados por `|`), revisar la vista previa y tocar **Importar**.

La importación valida cada fila, escribe en lotes de hasta 500 y es **idempotente**: el id de cada documento sale del archivo, así que importar dos veces no duplica nada. Cambiar la fecha de inicio recalcula cuándo se desbloquea cada día (sirve para la demo o para reiniciar el juego).

#### Sumar títulos sin mover los ya publicados

`scripts/add-titles.mjs` agrega los títulos de su lista al final de `seed/titles.json` y actualiza `src/data/answer-names.json` y `src/data/day-sizes.json`. Después hay que importar el archivo desde `/admin`. Necesita `.env.tmdb`.

#### Regenerar `seed/titles.json` (opcional)

`scripts/build-titles.mjs` arma el archivo desde `seed/questions.json` (los temas, verificados en Deezer), elige un tema por título, reparte los títulos en días de 10 y completa año, dirección, género, sinopsis y póster con la API de TMDB. Necesita un token de TMDB en un archivo `.env.tmdb` (ignorado por git):

```bash
echo "TMDB_TOKEN=tu_token" > .env.tmdb
node scripts/build-titles.mjs
node scripts/add-titles.mjs
```

Regenerar todo vuelve a repartir los días; usarlo solo antes de publicar.

## Publicar en Vercel

1. Importar el repositorio de GitHub en Vercel (o `npx vercel link`). Root Directory: la carpeta de `package.json`.
2. `vercel.json` ya fija **framework Vite**, build `npm run build`, salida `dist` y el *rewrite* a `index.html` que necesita React Router.
3. **Settings → Environment Variables**: cargar las 4 variables `VITE_FIREBASE_*` en **Production** y **Preview**, como **Config** (no Secret).
4. Con GitHub conectado, cada push a `main` despliega solo. Si se cambian las variables, hacer **Redeploy**.

`.vercelignore` evita que la CLI de Vercel suba archivos `.env` locales. `vercel.json` también guarda un año en caché los archivos de `/assets`, que cambian de nombre en cada versión.

## Dónde se conecta Firebase

| Archivo | Qué hace |
|---|---|
| `src/services/firebase.js` | **Único punto de conexión**: lee `import.meta.env`, inicializa Firebase (Auth y Firestore lite) y exporta `auth` y `db`. |
| `src/services/cache.js` | Caché en memoria de lo ya leído, para no repetir consultas mientras la pestaña está abierta. |
| `src/services/authService.js` | Sesión anónima, ingreso del admin y chequeo de `admins/{uid}`. |
| `src/context/AuthContext.jsx` | Escucha la sesión (`onAuthStateChanged`) y abre una anónima si no hay ninguna. |
| `src/services/titlesService.js` | **Consulta** los títulos del día (`where day == n` y `unlockAt <=` la apertura de ese día), el catálogo completo para los modos libres y el detalle de una cinta. |
| `src/services/guessesService.js` | **Agrega**, consulta y **elimina** jugadas (`setDoc`, `getDocs`, `deleteDoc`). |
| `src/services/leaderboardService.js` | Top 20 del ranking; **crea, modifica y elimina** la entrada propia. |
| `src/services/configService.js` | Lee `config/game` (fecha de inicio). |
| `src/services/adminService.js` | Importación en lotes (`writeBatch`) y cambio de fecha de inicio. |
| `firestore.rules` | Permisos de cada colección (comentados). |

## Modelo de datos (Firestore)

| Colección | Documento | Contenido |
|---|---|---|
| `config` | `game` | `startDate` (Timestamp), `timezone` |
| `titles` | `{slug del título}` | `day`, `order`, `title`, `aliases[]`, `category`, `year`, `director`, `genre`, `synopsis`, `posterUrl`, `deezerTrackId`, `unlockAt`, … |
| `guesses` | `{uid}_{titleId}` | `uid`, `titleId`, `secondsUsed` (0–30; las jugadas viejas tienen `cluesUsed`, 1–3), `points`, `late`, `solved`, `createdAt` y una copia mínima para el estante (`title`, `year`, `posterUrl`, `day`) |
| `leaderboard` | `{uid}` | `nickname`, `totalPoints`, `guessesCount`, `updatedAt` (sin email ni nombre real) |
| `admins` | `{uid}` | Documento creado a mano; marca quién es administrador |

No se guarda audio: de Deezer solo se guarda el id del tema y el fragmento se pide al momento de jugar (sus links vencen a los 15 minutos).

## Seguridad (resumen de `firestore.rules`)

- Todo lo que no está permitido está denegado; sin sesión no se puede leer nada.
- `titles`: cualquier jugador con sesión lee el catálogo; solo el admin escribe. Popurrí no se puede adelantar: una jugada solo se guarda si el título ya está desbloqueado según la hora del servidor.
- `guesses`: cada jugador lee, crea y borra solo las suyas. Al crear se valida el id, el rango de `secondsUsed`, los puntos exactos según segundos y atraso, que el título esté desbloqueado, que `late` coincida con la hora del servidor y que `createdAt` sea la hora del servidor. No se pueden editar.
- `leaderboard`: lectura con sesión; cada uno escribe solo su entrada; apodo de 3 a 20 caracteres validado con expresión regular.
- `admins` y `config`: solo el admin; nadie escribe en `admins` desde la app.

## Limitaciones conocidas

- **`totalPoints` del ranking lo calcula el navegador.** Las jugadas sí están validadas por las reglas, pero sin un backend propio no se puede verificar que el total del ranking coincida con la suma de las jugadas.
- **Rejugar un título:** si un jugador borra una jugada de su estante, puede volver a jugar ese título.
- **Sesión anónima por navegador:** cada navegador tiene su propia identidad; desde otro dispositivo no se recupera el mismo progreso.
- **Respuestas futuras:** como los modos libres usan todo el catálogo, alguien con conocimientos técnicos puede leer las respuestas de días que todavía no abrieron.
- **Tiempo de respuesta:** lo mide el navegador. Las reglas validan el rango y que los puntos coincidan con esos segundos, pero sin un backend propio no pueden comprobar cuánto tardó de verdad el jugador.
- **Reloj del navegador:** se usa para calcular qué día mostrar; lo que se puede leer y si una jugada es atrasada lo deciden las reglas con la hora del servidor. Con el reloj muy corrido (por ejemplo, un día adelantado), las reglas rechazan la operación y la app pide revisar la fecha y la hora.
- **Días cargados:** hay 15 días de Popurrí y 15 animes siempre abiertos para los modos libres (157 títulos). Cuando pasan, Jugar abre en el último día y todos valen la mitad de puntos; se pueden sumar días importando más títulos o reiniciar el calendario cambiando la fecha de inicio desde `/admin`.

## Atribuciones y términos de terceros

- **Audio:** fragmentos de 30 s de la [API de Deezer](https://developers.deezer.com/). Sus términos limitan el uso a fines no comerciales y no mencionan juegos; este es un trabajo académico sin fines de lucro.
- **Datos y pósters de películas y series:** [TMDB](https://www.themoviedb.org/). Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB. Sus términos piden mostrar su logo y no guardar sus datos más de 6 meses.
- **Videos de la revelación:** primero se muestra la miniatura; al tocar play se carga el reproductor embebido de YouTube, completo y sin tapar.
- **Tipografías:** Archivo e IBM Plex Mono (Google Fonts).

## Estructura

```
src/
  components/   game/ (tablero, pista de música, respuesta), vhs/ (cinta, estante, popup),
                ui/ (estados de carga, vacío y error), admin/, layout/
  context/      sesión del usuario (AuthContext)
  data/         nombres para el autocompletado y cantidad de títulos por día
  hooks/        useAuth, useSongPlayer, useTheme
  pages/        Home, ModeSelect, Play (Popurrí), FreePlay (modos libres), Ranking, Profile, Admin, NotFound
  services/     Firebase y acceso a datos (Firestore, Deezer)
  styles/       tokens.css (variables de diseño y temas), vhs.css (cintas y mueble)
  utils/        calendario, puntos, respuestas, validaciones, aspecto de las cintas
docs/           capturas y evidencias de cada versión
seed/           datos para importar
scripts/        generación de seed/titles.json
```

## Versiones

Cada versión está marcada con un tag de Git:

| Tag | Qué tiene |
|---|---|
| `v1` | Primera versión funcional publicada |
| `v2` | Diseño "Mi videoteca" (iteraciones A, B y C) |
| `v3` | Arreglos del reloj y de los días cargados, informe y documentación |
| `v3.1` | Optimización de la velocidad de carga |
| `v3.2` | Canción de corrido, puntaje por segundo, modos de juego y más contenido |

## Documentación del proceso

- [`BITACORA.md`](BITACORA.md): evolución de la app, versión por versión.
- [`INFORME.md`](INFORME.md): idea, funciones, datos guardados y uso de IA.
