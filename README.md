# Adiviná la música

Juego web para adivinar de qué **película, serie o videojuego** es una música. Cada día se desbloquean 10 canciones nuevas: primero suenan **3 segundos**; si no la reconocés, podés pedir **6** y después **10 segundos**, pero cada pista extra vale menos puntos. Cada acierto se guarda en tu **estante** y suma puntos en el **ranking**.

Trabajo práctico 2 de Desarrollo Frontend II (UADE). Pensado para quienes disfrutan de las bandas sonoras y quieren un desafío corto todos los días.

**App publicada:** https://adivina-la-musica.vercel.app

## Tecnologías

- **React + Vite**: interfaz, componentes, eventos y estado.
- **Firebase Authentication**: sesión anónima automática para jugadores y correo/contraseña para el administrador.
- **Cloud Firestore** (sin backend propio): títulos, jugadas, ranking y configuración.
- **Vercel**: publicación, con despliegue automático en cada push a `main`.
- **Deezer API** (fragmentos de 30 s) para el audio y **TMDB** para los datos de películas y series.

## Cómo jugar

1. Tocá **Escuchar** y prestá atención al fragmento.
2. Escribí de qué es y elegí el nombre de la lista (vale en español o en inglés).
3. Si no la sabés, pedí **Siguiente pista**; una respuesta incorrecta también te da la pista siguiente.
4. **Saltear canción** muestra la respuesta, pero no suma puntos.

| Pista | Puntos | Días pasados ("ponte al día") |
|---|---|---|
| 3 segundos | 100 | 50 |
| 6 segundos | 60 | 30 |
| 10 segundos | 30 | 15 |

## Instalación y ejecución local

Requisitos: **Node.js 20.19 o superior** y una cuenta de Firebase.

```bash
npm install
cp .env.example .env   # y completar los valores (ver abajo)
npm run dev            # abre http://localhost:5173
```

Otros comandos: `npm run build` (genera `dist/`), `npm run preview` y `npm run lint`.

> Después de cambiar el archivo `.env` hay que reiniciar `npm run dev`.

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

#### Regenerar `seed/titles.json` (opcional)

`scripts/build-titles.mjs` arma el archivo desde `seed/questions.json` (los temas, verificados en Deezer), elige un tema por título, reparte los títulos en días de 10 y completa año, dirección, género, sinopsis y póster con la API de TMDB. Necesita un token de TMDB en un archivo `.env.tmdb` (ignorado por git):

```bash
echo "TMDB_TOKEN=tu_token" > .env.tmdb
node scripts/build-titles.mjs
```

## Publicar en Vercel

1. Importar el repositorio de GitHub en Vercel (o `npx vercel link`). Root Directory: la carpeta de `package.json`.
2. `vercel.json` ya fija **framework Vite**, build `npm run build`, salida `dist` y el *rewrite* a `index.html` que necesita React Router.
3. **Settings → Environment Variables**: cargar las 4 variables `VITE_FIREBASE_*` en **Production** y **Preview**, como **Config** (no Secret).
4. Con GitHub conectado, cada push a `main` despliega solo. Si se cambian las variables, hacer **Redeploy**.

`.vercelignore` evita que la CLI de Vercel suba archivos `.env` locales.

## Dónde se conecta Firebase

| Archivo | Qué hace |
|---|---|
| `src/services/firebase.js` | **Único punto de conexión**: lee `import.meta.env`, inicializa Firebase y exporta `auth` y `db`. |
| `src/services/authService.js` | Sesión anónima, ingreso del admin y chequeo de `admins/{uid}`. |
| `src/context/AuthContext.jsx` | Escucha la sesión (`onAuthStateChanged`) y abre una anónima si no hay ninguna. |
| `src/services/titlesService.js` | **Consulta** los 10 títulos del día (`where day == n` y `unlockAt <= ahora`). |
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
| `guesses` | `{uid}_{titleId}` | `uid`, `titleId`, `cluesUsed` (1–3), `points`, `late`, `solved`, `createdAt` y una copia mínima para el estante (`title`, `year`, `posterUrl`, `day`) |
| `leaderboard` | `{uid}` | `nickname`, `totalPoints`, `guessesCount`, `updatedAt` (sin email ni nombre real) |
| `admins` | `{uid}` | Documento creado a mano; marca quién es administrador |

No se guarda audio: de Deezer solo se guarda el id del tema y el fragmento se pide al momento de jugar (sus links vencen a los 15 minutos).

## Seguridad (resumen de `firestore.rules`)

- Todo lo que no está permitido está denegado; sin sesión no se puede leer nada.
- `titles`: un jugador solo lee títulos ya desbloqueados (`unlockAt <= request.time`, la hora del servidor); solo el admin escribe.
- `guesses`: cada jugador lee, crea y borra solo las suyas. Al crear se valida el id, `cluesUsed`, los puntos exactos según pistas y atraso, que el título esté desbloqueado, que `late` coincida con la hora del servidor y que `createdAt` sea la hora del servidor. No se pueden editar.
- `leaderboard`: lectura con sesión; cada uno escribe solo su entrada; apodo de 3 a 20 caracteres validado con expresión regular.
- `admins` y `config`: solo el admin; nadie escribe en `admins` desde la app.

## Limitaciones conocidas

- **`totalPoints` del ranking lo calcula el navegador.** Las jugadas sí están validadas por las reglas, pero sin un backend propio no se puede verificar que el total del ranking coincida con la suma de las jugadas.
- **Rejugar un título:** si un jugador borra una jugada de su estante, puede volver a jugar ese título.
- **Sesión anónima por navegador:** cada navegador tiene su propia identidad; desde otro dispositivo no se recupera el mismo progreso.
- **Reloj del navegador:** se usa solo para mostrar el día; lo que se puede leer y si una jugada es atrasada lo deciden las reglas con la hora del servidor.

## Atribuciones y términos de terceros

- **Audio:** fragmentos de 30 s de la [API de Deezer](https://developers.deezer.com/). Sus términos limitan el uso a fines no comerciales y no mencionan juegos; este es un trabajo académico sin fines de lucro.
- **Datos y pósters de películas y series:** [TMDB](https://www.themoviedb.org/). Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB. Sus términos piden mostrar su logo y no guardar sus datos más de 6 meses.
- **Videos de la revelación:** reproductor embebido de YouTube, mostrado completo y sin tapar.
- **Tipografías:** Bebas Neue y Montserrat (Google Fonts).

## Estructura

```
src/
  components/   game/ (tablero, pista de música, respuesta), admin/, layout/
  pages/        Home, Play, Ranking, Profile, Admin
  services/     Firebase y acceso a datos
  hooks/        useAuth, useAudioClip
  utils/        calendario, puntos, respuestas, validaciones
seed/           datos para importar
scripts/        generación de seed/titles.json
```
