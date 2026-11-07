// Suma animes y videojuegos a seed/titles.json SIN cambiar los días ya publicados:
// los títulos nuevos completan el último día y siguen en los días siguientes.
// Es idempotente: si un título ya está en el archivo, no se vuelve a agregar.
// Si se regenera todo con build-titles.mjs, después hay que volver a ejecutar este.
//
// Uso:  node scripts/add-titles.mjs
// Necesita TMDB_TOKEN en .env.tmdb (ignorado por git). El valor nunca se imprime.
import { readFileSync, writeFileSync } from 'node:fs'

const PER_DAY = 10
const token = readFileSync('.env.tmdb', 'utf8')
  .split('\n')
  .find((l) => l.startsWith('TMDB_TOKEN='))
  ?.slice('TMDB_TOKEN='.length)
  .trim()
if (!token) throw new Error('Falta TMDB_TOKEN en .env.tmdb')

const slug = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

async function tmdb(path, params = {}) {
  const url = new URL(`https://api.themoviedb.org/3${path}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`TMDB ${res.status} en ${path}`)
  return res.json()
}

async function deezerTrack(id) {
  const data = await (await fetch(`https://api.deezer.com/track/${id}`)).json()
  if (data.error || !data.preview) throw new Error(`Deezer no tiene fragmento del tema ${id}`)
  return data
}

// [título, búsqueda en TMDB, año de estreno, creación, tema de Deezer, alias]
const ANIME = [
  ['Dragon Ball Z', 'Dragon Ball Z', 1989, 'Akira Toriyama', '1576033002', ['DBZ', 'Dragon Ball']],
  ['Naruto', 'Naruto', 2002, 'Masashi Kishimoto', '1100592452', []],
  ['One Piece', 'One Piece', 1999, 'Eiichiro Oda', '3033808841', []],
  ['Attack on Titan', 'Attack on Titan', 2013, 'Hajime Isayama', '472698952', ['Ataque a los titanes', 'Shingeki no Kyojin']],
  ['Death Note', 'Death Note', 2006, 'Tsugumi Ohba y Takeshi Obata', '2665292502', []],
  ['Sailor Moon', 'Sailor Moon', 1992, 'Naoko Takeuchi', '2413507195', ['Sailor Scouts', 'Bishoujo Senshi Sailor Moon']],
  ['Pokémon', 'Pokémon', 1997, 'Satoshi Tajiri', '433396562', ['Pokemon']],
  ['Neon Genesis Evangelion', 'Neon Genesis Evangelion', 1995, 'Hideaki Anno', '889803782', ['Evangelion']],
  ['Demon Slayer', 'Demon Slayer: Kimetsu no Yaiba', 2019, 'Koyoharu Gotouge', '1093334492', ['Kimetsu no Yaiba', 'Guardianes de la noche']],
  ['Fullmetal Alchemist: Brotherhood', 'Fullmetal Alchemist: Brotherhood', 2009, 'Hiromu Arakawa', '975952742', ['Fullmetal Alchemist', 'FMA']],
  ['Cowboy Bebop', 'Cowboy Bebop', 1998, 'Shinichiro Watanabe', '1006888182', []],
  ['Jujutsu Kaisen', 'Jujutsu Kaisen', 2020, 'Gege Akutami', '1143848452', []],
  ['My Hero Academia', 'My Hero Academia', 2016, 'Kohei Horikoshi', '543429922', ['Boku no Hero Academia']],
  ['Hunter x Hunter', 'Hunter x Hunter', 2011, 'Yoshihiro Togashi', '2665357712', ['HxH']],
  ['Los Caballeros del Zodiaco', 'Saint Seiya', 1986, 'Masami Kurumada', '472487152', ['Saint Seiya', 'Caballeros del Zodiaco']],
]

// [título, año, estudio, género, tema de Deezer, alias, sinopsis]
const GAMES = [
  ['The Legend of Zelda', 1986, 'Nintendo', 'Aventura', '639180472', ['Zelda', 'La leyenda de Zelda'], 'Link recorre el reino de Hyrule en busca de los fragmentos de la Trifuerza para enfrentar a Ganon y rescatar a la princesa Zelda.'],
  ['God of War', 2018, 'Santa Monica Studio', 'Acción y aventura', '484077812', [], 'Kratos deja atrás su pasado en Grecia y viaja por las tierras nórdicas junto a su hijo Atreus para cumplir el último deseo de su esposa.'],
  ['Final Fantasy VII', 1997, 'Square', 'Rol', '83087336', ['Final Fantasy 7', 'FF7', 'FFVII'], 'Cloud Strife se suma a un grupo rebelde que enfrenta a la corporación Shinra y termina persiguiendo a Sefirot para salvar al planeta.'],
  ['GTA San Andreas', 2004, 'Rockstar North', 'Mundo abierto', '2461610925', ['Grand Theft Auto: San Andreas', 'San Andreas', 'GTA'], 'CJ vuelve a Los Santos tras la muerte de su madre y se ve envuelto en una guerra de pandillas, policías corruptos y traiciones.'],
]

async function findAnime(query, year) {
  const { results } = await tmdb('/search/tv', { query, first_air_date_year: year, language: 'es-MX' })
  const match = results[0]
  if (!match) throw new Error(`TMDB no encontró ${query} (${year})`)
  const details = await tmdb(`/tv/${match.id}`, { language: 'es-MX' })
  let synopsis = details.overview
  if (!synopsis) synopsis = (await tmdb(`/tv/${match.id}`, { language: 'es-ES' })).overview
  return { tmdbId: match.id, name: match.name, firstAir: match.first_air_date, synopsis, poster: details.poster_path }
}

const titles = JSON.parse(readFileSync('seed/titles.json', 'utf8'))
const known = new Set(titles.map((t) => t.id))
const fresh = []

for (const [title, query, year, creator, trackId, aliases] of ANIME) {
  if (known.has(slug(title))) continue
  const [found] = await Promise.all([findAnime(query, year), deezerTrack(trackId)])
  console.log(`anime: ${title} -> ${found.name} (${found.firstAir}), sinopsis ${found.synopsis ? 'sí' : 'NO'}, póster ${found.poster ? 'sí' : 'NO'}`)
  fresh.push({
    id: slug(title),
    title,
    aliases,
    category: 'anime',
    year,
    director: creator,
    creditLabel: 'Creación',
    genre: 'Anime',
    synopsis: found.synopsis ?? '',
    posterUrl: found.poster ? `https://image.tmdb.org/t/p/w500${found.poster}` : '',
    deezerTrackId: trackId,
    deezerStartSeconds: 0,
    youtubeId: '',
    tmdbId: found.tmdbId,
    needsReview: false,
  })
}

for (const [title, year, studio, genre, trackId, aliases, synopsis] of GAMES) {
  if (known.has(slug(title))) continue
  const track = await deezerTrack(trackId)
  console.log(`juego: ${title} -> ${track.title} — ${track.artist?.name}`)
  fresh.push({
    id: slug(title),
    title,
    aliases,
    category: 'videojuego',
    year,
    director: studio,
    creditLabel: 'Estudio',
    genre,
    synopsis,
    posterUrl: track.album?.cover_xl ?? '',
    deezerTrackId: trackId,
    deezerStartSeconds: 0,
    youtubeId: '',
    tmdbId: null,
    needsReview: false,
  })
}

// Mezcla fija para no dejar todos los animes juntos: siempre da el mismo orden.
const mixed = fresh
  .map((t, i) => [t, (i * 7 + 3) % fresh.length])
  .sort((a, b) => a[1] - b[1])
  .map(([t]) => t)

for (const t of mixed) {
  const lastDay = Math.max(...titles.map((x) => x.day))
  const inLastDay = titles.filter((x) => x.day === lastDay).length
  const day = inLastDay < PER_DAY ? lastDay : lastDay + 1
  titles.push({ ...t, day, order: inLastDay < PER_DAY ? inLastDay + 1 : 1 })
}

writeFileSync('seed/titles.json', JSON.stringify(titles, null, 2) + '\n')
const names = titles.map((t) => ({ title: t.title, aliases: t.aliases })).sort((a, b) => a.title.localeCompare(b.title, 'es'))
writeFileSync('src/data/answer-names.json', JSON.stringify(names, null, 2) + '\n')
const daySizes = {}
for (const t of titles) daySizes[t.day] = (daySizes[t.day] ?? 0) + 1
writeFileSync('src/data/day-sizes.json', JSON.stringify(daySizes) + '\n')
console.log(`\nSe agregaron ${fresh.length}. Total: ${titles.length} títulos en ${Object.keys(daySizes).length} días.`)
