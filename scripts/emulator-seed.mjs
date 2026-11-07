// Carga los títulos de seed/titles.json en el emulador, para probar la app sin la base real.
// Uso: con el emulador abierto, node scripts/emulator-seed.mjs
import { readFileSync } from 'node:fs'

const DOCS = 'http://127.0.0.1:8080/v1/projects/demo-adivina/databases/(default)/documents'
const DAY_MS = 86_400_000
const DAYS_AGO = 11 // el día 12 queda como "hoy"

const today = new Date(`${new Date(Date.now() - 3 * 3_600_000).toISOString().slice(0, 10)}T00:00:00-03:00`).getTime()
const start = today - DAYS_AGO * DAY_MS

function toValue(value) {
  if (value === null || value === undefined) return { nullValue: null }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toValue) } }
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: value } : { doubleValue: value }
  if (typeof value === 'boolean') return { booleanValue: value }
  return { stringValue: String(value) }
}

async function put(path, fields) {
  const res = await fetch(`${DOCS}/${path}`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
  if (!res.ok) throw new Error(`${path}: ${res.status}`)
}

await put('config/game', {
  startDate: { timestampValue: new Date(start).toISOString() },
  timezone: { stringValue: 'America/Argentina/Buenos_Aires' },
})
const titles = JSON.parse(readFileSync('seed/titles.json', 'utf8'))
for (const { id, ...data } of titles) {
  const fields = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, toValue(v)]))
  fields.unlockAt = { timestampValue: new Date(start + (data.day - 1) * DAY_MS).toISOString() }
  await put(`titles/${id}`, fields)
}
console.log(`Listo: ${titles.length} títulos`)
