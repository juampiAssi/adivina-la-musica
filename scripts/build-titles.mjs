// Genera seed/titles.json (lo que se importa desde el panel admin) a partir de
// seed/questions.json: elige un tema por título, reparte los títulos en días de 10
// y completa año, director, género, sinopsis y póster con la API de TMDB.
//
// Uso:  node scripts/build-titles.mjs
// Necesita el archivo .env.tmdb (ignorado por git) con UNA de estas líneas:
//   TMDB_TOKEN=<"Token de acceso de lectura de la API">   (recomendado)
//   TMDB_API_KEY=<"Clave de la API">
// Los videojuegos no están en TMDB: sus datos están cargados a mano más abajo.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const PER_DAY = 10
const SEED = 2026 // semilla fija: siempre sale el mismo reparto de días

// ---------- Credenciales de TMDB (nunca se imprimen) ----------
const envFile = existsSync('.env.tmdb') ? readFileSync('.env.tmdb', 'utf8') : ''
const env = Object.fromEntries(
  envFile
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
)
const TOKEN = env.TMDB_TOKEN || process.env.TMDB_TOKEN
const API_KEY = env.TMDB_API_KEY || process.env.TMDB_API_KEY
if (!TOKEN && !API_KEY) {
  console.error('Falta TMDB_TOKEN o TMDB_API_KEY en .env.tmdb')
  process.exit(1)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function tmdb(path, params = {}) {
  const url = new URL(`https://api.themoviedb.org/3${path}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  if (!TOKEN) url.searchParams.set('api_key', API_KEY)
  const res = await fetch(url, { headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {} })
  await sleep(60)
  if (!res.ok) throw new Error(`TMDB ${res.status} en ${path}`)
  return res.json()
}

async function deezerCover(trackId) {
  const res = await fetch(`https://api.deezer.com/track/${trackId}`)
  const data = await res.json()
  return data.album?.cover_xl ?? ''
}

// ---------- Utilidades ----------
const normalize = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
const slug = (s) => normalize(s).replace(/ /g, '-')

// Mezcla determinista (mulberry32 + Fisher-Yates).
function seededShuffle(list, seed) {
  let a = seed
  const rand = () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// Año de referencia para títulos que en TMDB tienen homónimos.
const YEAR_HINTS = {
  'Home: no hay lugar como el hogar': 2015, Maverick: 1994, 'Up: una aventura de altura': 2009, Cars: 2006,
  Coco: 2017, Soul: 2020, Luca: 2021, Klaus: 2019, Joker: 2019, Titanic: 1997, Río: 2011, Valiente: 2012,
  'Robin Hood': 1973, 'The Flash': 2014, Transformers: 2007, 'Mi pobre angelito': 1990, 'La Sirenita': 1989,
  'El Rey León': 1994, Tarzán: 1999, 'Mary Poppins': 1964, 'Lilo & Stitch': 2002, 'Hombres de negro': 1997,
  F1: 2025, 'Marty Supreme': 2025, Oppenheimer: 2023, Skyfall: 2012, Gladiador: 2000, 'Top Gun': 1986,
  'La historia sin fin': 1984, 'Cuenta conmigo': 1986, 'Rocky IV': 1985, 'The Batman': 2022, 'La terminal': 2004,
  Náufrago: 2000, Zootopia: 2016, 'Monsters, Inc.': 2001, 'Toy Story': 1995, 'Piratas del Caribe': 2003,
  'Volver al futuro': 1985, 'Los Vengadores': 2012, 'Jurassic Park': 1993, 'Jurassic World': 2015, Frozen: 2013,
  'Hora de Aventura': 2010, Friends: 1994, 'Little Einsteins': 2005, 'Thomas y sus amigos': 1984, Caillou: 1997,
  'Los Backyardigans': 2004, 'Peter Punk': 2011, 'Corazón valiente': 1995, 'Forrest Gump': 1994, Intensamente: 2015,
  '1917': 2019, Ratatouille: 2007, 'Teen Beach Movie': 2013, 'High School Musical': 2006, Shrek: 2001,
  'Cómo entrenar a tu dragón': 2010, 'La sospecha': 2013, 'Piratas del Caribe: el cofre de la muerte': 2006,
}

// Correcciones de títulos de seed/questions.json (el tema "Jack Sparrow" es de la 2.ª película).
const RENAMES = {
  'Piratas del Caribe': {
    title: 'Piratas del Caribe: el cofre de la muerte',
    aliases: ['Piratas del Caribe', "Pirates of the Caribbean: Dead Man's Chest", 'Pirates of the Caribbean'],
  },
}

// TMDB devuelve algunos géneros de series sin traducir.
const GENRE_ES = {
  'Action & Adventure': 'Acción y aventura',
  'Sci-Fi & Fantasy': 'Ciencia ficción y fantasía',
  Kids: 'Infantil',
  'War & Politics': 'Bélica',
  Reality: 'Reality',
  Soap: 'Telenovela',
  Talk: 'Entrevistas',
  News: 'Noticias',
}

// Videojuegos: TMDB no los tiene. Datos cargados a mano (sinopsis propias).
const GAMES = {
  'Halo 3': [2007, 'Bungie', 'Shooter', 'El Jefe Maestro vuelve a la Tierra para frenar la invasión del Covenant y terminar la guerra contra el Flood.'],
  Minecraft: [2011, 'Mojang Studios', 'Mundo abierto', 'Un mundo hecho de bloques para explorar, juntar recursos y construir cualquier cosa, mientras se sobrevive a las criaturas de la noche.'],
  'Red Dead Redemption 2': [2018, 'Rockstar Games', 'Acción y aventura', 'En 1899, Arthur Morgan y la banda de Van der Linde huyen de la ley por un Oeste que se está terminando.'],
  'Subway Surfers': [2012, 'Kiloo y SYBO Games', 'Corredor infinito', 'Un grafitero escapa del inspector y su perro corriendo sin parar entre las vías y los trenes.'],
  'The Elder Scrolls V: Skyrim': [2011, 'Bethesda Game Studios', 'Rol', 'Un prisionero descubre que es el Sangre de Dragón, el único capaz de enfrentar el regreso de los dragones a Skyrim.'],
  'The Last of Us': [2013, 'Naughty Dog', 'Acción y aventura', 'Veinte años después de una pandemia, Joel debe cruzar Estados Unidos escoltando a Ellie, que podría ser la clave de una cura.'],
  'The Last of Us Parte II': [2020, 'Naughty Dog', 'Acción y aventura', 'Cinco años después del primer viaje, Ellie emprende una búsqueda de venganza que la lleva hasta Seattle.'],
  'Uncharted 4: el desenlace del ladrón': [2016, 'Naughty Dog', 'Acción y aventura', 'Nathan Drake deja el retiro para buscar, junto a su hermano Sam, el tesoro perdido del pirata Henry Avery.'],
  Undertale: [2015, 'Toby Fox', 'Rol', 'Un chico cae al mundo subterráneo de los monstruos y puede elegir pelear o perdonar a cada criatura que encuentra.'],
}

// ---------- Búsqueda en TMDB ----------
async function findInTmdb(q) {
  const kind = q.category === 'serie' ? 'tv' : 'movie'
  const hint = YEAR_HINTS[q.title]
  const names = [q.title, ...q.aliases]
  const candidates = new Map()
  for (const name of [q.title, ...q.aliases.slice(0, 2)]) {
    const params = { query: name, language: 'es-MX', include_adult: 'false' }
    if (hint) params[kind === 'tv' ? 'first_air_date_year' : 'year'] = String(hint)
    const { results = [] } = await tmdb(`/search/${kind}`, params)
    for (const r of results.slice(0, 8)) candidates.set(r.id, r)
  }
  const wanted = names.map(normalize)
  let best = null
  let bestScore = -1
  for (const r of candidates.values()) {
    const rNames = [r.title, r.original_title, r.name, r.original_name].filter(Boolean).map(normalize)
    const exact = rNames.some((n) => wanted.includes(n))
    const year = Number((r.release_date || r.first_air_date || '').slice(0, 4))
    const score = (exact ? 1000 : 0) + (hint && year === hint ? 500 : 0) + Math.min(r.vote_count ?? 0, 400)
    if (score > bestScore) [best, bestScore] = [r, score]
  }
  if (!best) return null
  const confident = bestScore >= 1000
  if (kind === 'movie') {
    const d = await tmdb(`/movie/${best.id}`, { language: 'es-MX', append_to_response: 'credits' })
    const directors = (d.credits?.crew ?? []).filter((c) => c.job === 'Director').map((c) => c.name)
    return { kind, confident, tmdbId: d.id, year: Number(d.release_date?.slice(0, 4)) || null, director: directors.join(', '), genre: d.genres?.[0]?.name ?? '', synopsis: d.overview || (await tmdb(`/movie/${d.id}`, { language: 'en-US' })).overview, poster: d.poster_path }
  }
  const d = await tmdb(`/tv/${best.id}`, { language: 'es-MX' })
  return { kind, confident, tmdbId: d.id, year: Number(d.first_air_date?.slice(0, 4)) || null, director: (d.created_by ?? []).map((c) => c.name).join(', '), genre: d.genres?.[0]?.name ?? '', synopsis: d.overview || (await tmdb(`/tv/${d.id}`, { language: 'en-US' })).overview, poster: d.poster_path }
}

// ---------- Armado ----------
const questions = JSON.parse(readFileSync('seed/questions.json', 'utf8')).map((q) => ({ ...q, ...RENAMES[q.title] }))

// Un tema por título: preferimos el que tiene video y no está marcado para revisar.
const byTitle = new Map()
for (const q of questions) {
  const prev = byTitle.get(q.title)
  const rank = (x) => (x.youtubeId ? 2 : 0) + (x.needsReview ? 0 : 1)
  if (!prev || rank(q) > rank(prev)) byTitle.set(q.title, q)
}
const picked = seededShuffle([...byTitle.values()].sort((a, b) => a.title.localeCompare(b.title)), SEED)

const titles = []
for (const [i, q] of picked.entries()) {
  const id = slug(q.title)
  let meta
  if (q.category === 'videojuego') {
    const [year, studio, genre, synopsis] = GAMES[q.title]
    meta = { year, director: studio, genre, synopsis, posterUrl: await deezerCover(q.deezerTrackId), source: 'manual', confident: true }
  } else {
    const t = await findInTmdb(q).catch((e) => ({ error: e.message }))
    meta = t && !t.error
      ? { year: t.year, director: t.director, genre: t.genre, synopsis: t.synopsis, posterUrl: t.poster ? `https://image.tmdb.org/t/p/w500${t.poster}` : await deezerCover(q.deezerTrackId), tmdbId: t.tmdbId, source: 'tmdb', confident: t.confident }
      : { year: null, director: '', genre: '', synopsis: '', posterUrl: await deezerCover(q.deezerTrackId), source: 'sin datos', confident: false, error: t?.error }
  }
  titles.push({
    id,
    day: Math.floor(i / PER_DAY) + 1,
    order: (i % PER_DAY) + 1,
    title: q.title,
    aliases: q.aliases,
    category: q.category,
    year: meta.year,
    director: meta.director,
    creditLabel: q.category === 'película' ? 'Dirección' : q.category === 'serie' ? 'Creación' : 'Estudio',
    genre: GENRE_ES[meta.genre] ?? meta.genre,
    synopsis: meta.synopsis,
    posterUrl: meta.posterUrl,
    deezerTrackId: q.deezerTrackId,
    deezerStartSeconds: q.deezerStartSeconds ?? 0,
    youtubeId: q.youtubeId ?? '',
    tmdbId: meta.tmdbId ?? null,
    needsReview: q.needsReview || !meta.confident,
  })
  if ((i + 1) % 20 === 0) console.log(`${i + 1}/${picked.length}`)
}

const ids = new Set(titles.map((t) => t.id))
if (ids.size !== titles.length) throw new Error('Hay ids repetidos')

writeFileSync('seed/titles.json', JSON.stringify(titles, null, 2) + '\n')
// Solo los nombres (título + alias), para el autocompletado del juego. No incluye
// días ni temas, así el navegador no tiene que leer todos los títulos de Firestore.
const answerNames = titles.map((t) => ({ title: t.title, aliases: t.aliases })).sort((a, b) => a.title.localeCompare(b.title, 'es'))
writeFileSync('src/data/answer-names.json', JSON.stringify(answerNames, null, 2) + '\n')
const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
const cols = ['day', 'order', 'id', 'title', 'category', 'year', 'director', 'genre', 'needsReview', 'tmdbId', 'synopsis']
writeFileSync('seed/titles-revision.csv', '﻿' + [cols.join(','), ...titles.map((t) => cols.map((c) => csvCell(t[c])).join(','))].join('\n') + '\n')
const review = titles.filter((t) => t.needsReview)
console.log(`\n${titles.length} títulos en ${Math.ceil(titles.length / PER_DAY)} días. Para revisar: ${review.length}`)
for (const t of review) console.log(`  - ${t.title} (${t.category}) → ${t.year ?? '?'} ${t.director || ''}`)
