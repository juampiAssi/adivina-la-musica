// Revisa que los datos para importar estén completos. Se ejecuta con: npm test
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { CONTENT_TYPES } from '../utils/modes.js'

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const titles = read('../../seed/titles.json')
const daySizes = read('./day-sizes.json')
const answerNames = read('./answer-names.json')

test('cada título tiene id, tema y tipo de contenido válidos', () => {
  const categories = CONTENT_TYPES.map((type) => type.category)
  assert.equal(new Set(titles.map((t) => t.id)).size, titles.length)
  for (const t of titles) {
    assert.ok(t.title && t.deezerTrackId && t.posterUrl, `incompleto: ${t.id}`)
    assert.ok(categories.includes(t.category), `tipo desconocido: ${t.id}`)
  }
})

test('los días no tienen más de 10 títulos ni órdenes repetidos', () => {
  for (const [day, size] of Object.entries(daySizes)) {
    const inDay = titles.filter((t) => t.day === Number(day))
    assert.equal(inDay.length, size)
    assert.ok(size <= 10)
    assert.equal(new Set(inDay.map((t) => t.order)).size, size)
  }
})

test('todos los títulos aparecen en el autocompletado', () => {
  const names = new Set(answerNames.map((n) => n.title))
  for (const t of titles) assert.ok(names.has(t.title), `falta: ${t.title}`)
})

test('hay suficientes títulos de anime y videojuegos', () => {
  assert.equal(titles.filter((t) => t.category === 'anime').length, 15)
  assert.equal(titles.filter((t) => t.category === 'videojuego').length, 13)
})
