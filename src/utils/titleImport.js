// Lectura y validación del archivo de títulos que sube el admin (JSON o CSV).
// Formato JSON: el mismo de seed/titles.json (un array de objetos).
// Formato CSV: una fila por título, con encabezados; los alias separados por "|".

export const MAX_DAY = 27
export const PER_DAY = 10
const CATEGORIES = ['película', 'serie', 'anime', 'videojuego']

// Id determinista a partir del título: "El Rey León" → "el-rey-leon".
export function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Parser de CSV simple que respeta comillas ("texto, con coma" y "" para comillas).
export function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  const src = text.replace(/^﻿/, '') // saca el BOM que agrega Excel
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(cell)
      if (row.some((c) => c.trim() !== '')) rows.push(row)
      row = []
      cell = ''
    } else cell += ch
  }
  row.push(cell)
  if (row.some((c) => c.trim() !== '')) rows.push(row)
  const [header, ...data] = rows
  if (!header) return []
  const keys = header.map((h) => h.trim())
  return data.map((cells) => Object.fromEntries(keys.map((k, i) => [k, (cells[i] ?? '').trim()])))
}

// Convierte el texto del archivo en una lista de objetos "crudos".
export function parseTitlesFile(text, fileName) {
  if (fileName.toLowerCase().endsWith('.json')) {
    const data = JSON.parse(text)
    if (!Array.isArray(data)) throw new Error('El JSON tiene que ser una lista ([ ... ]).')
    return data
  }
  if (fileName.toLowerCase().endsWith('.csv')) return parseCsv(text)
  throw new Error('El archivo tiene que ser .json o .csv')
}

const toInt = (v) => (v === '' || v === null || v === undefined ? NaN : Number(v))
const toAliases = (v) =>
  Array.isArray(v)
    ? v.map(String).map((s) => s.trim()).filter(Boolean)
    : String(v ?? '')
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean)

// Normaliza y valida. Devuelve { titles, errors } (errors con el número de fila).
export function validateTitles(rawList) {
  const titles = []
  const errors = []
  const ids = new Set()
  const slots = new Set()

  rawList.forEach((raw, index) => {
    const rowErrors = []
    const fila = index + 1
    const title = String(raw.title ?? '').trim()
    const t = {
      id: String(raw.id ?? '').trim() || slugify(title),
      day: toInt(raw.day),
      order: toInt(raw.order),
      title,
      aliases: toAliases(raw.aliases),
      category: String(raw.category ?? 'película').trim(),
      year: raw.year === '' || raw.year === null || raw.year === undefined ? null : toInt(raw.year),
      director: String(raw.director ?? '').trim(),
      creditLabel: String(raw.creditLabel ?? '').trim() || 'Dirección',
      genre: String(raw.genre ?? '').trim(),
      synopsis: String(raw.synopsis ?? '').trim(),
      posterUrl: String(raw.posterUrl ?? '').trim(),
      deezerTrackId: String(raw.deezerTrackId ?? '').trim(),
      deezerStartSeconds: toInt(raw.deezerStartSeconds || 0),
      youtubeId: String(raw.youtubeId ?? '').trim(),
    }

    if (!t.title) rowErrors.push('falta el título')
    if (!/^[a-z0-9-]{1,80}$/.test(t.id)) rowErrors.push(`id inválido "${t.id}"`)
    if (!Number.isInteger(t.day) || t.day < 0 || t.day > MAX_DAY) rowErrors.push(`day tiene que ser un entero de 0 a ${MAX_DAY}`)
    // Día 0: títulos solo para los modos libres, siempre abiertos y sin límite por día.
    if (!Number.isInteger(t.order) || t.order < 1 || (t.day > 0 && t.order > PER_DAY)) rowErrors.push(`order tiene que ser un entero de 1 a ${PER_DAY}`)
    if (!/^\d{1,15}$/.test(t.deezerTrackId)) rowErrors.push('deezerTrackId tiene que ser un número')
    if (!CATEGORIES.includes(t.category)) rowErrors.push(`category tiene que ser ${CATEGORIES.join(', ')}`)
    if (t.year !== null && (!Number.isInteger(t.year) || t.year < 1880 || t.year > 2100)) rowErrors.push('year inválido')
    if (!Number.isInteger(t.deezerStartSeconds) || t.deezerStartSeconds < 0 || t.deezerStartSeconds > 29) rowErrors.push('deezerStartSeconds tiene que ir de 0 a 29')
    if (t.youtubeId && !/^[\w-]{11}$/.test(t.youtubeId)) rowErrors.push('youtubeId inválido')
    if (t.posterUrl && !/^https:\/\//.test(t.posterUrl)) rowErrors.push('posterUrl tiene que empezar con https://')
    if (ids.has(t.id)) rowErrors.push(`id repetido "${t.id}"`)
    const slot = `${t.day}-${t.order}`
    if (slots.has(slot)) rowErrors.push(`ya hay otro título en el día ${t.day}, orden ${t.order}`)

    ids.add(t.id)
    slots.add(slot)
    if (rowErrors.length) errors.push({ fila, title: title || '(sin título)', problems: rowErrors })
    else titles.push(t)
  })
  return { titles, errors }
}
