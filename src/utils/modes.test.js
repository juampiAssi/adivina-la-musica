// Pruebas de los modos de juego. Se ejecutan con: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CHOICES, contentTypeBySlug, pickChoices, shuffle } from './modes.js'

const pool = [
  { title: 'A', category: 'serie' },
  { title: 'B', category: 'serie' },
  { title: 'C', category: 'serie' },
  { title: 'D', category: 'serie' },
  { title: 'E', category: 'película' },
  { title: 'F', category: 'película' },
]

test('mezclar conserva los elementos y no cambia la lista original', () => {
  const list = [1, 2, 3, 4, 5]
  assert.deepEqual([...shuffle(list)].sort(), [1, 2, 3, 4, 5])
  assert.deepEqual(list, [1, 2, 3, 4, 5])
})

test('las opciones incluyen la correcta, sin repetir', () => {
  for (let i = 0; i < 50; i++) {
    const choices = pickChoices(pool[0], pool)
    assert.equal(choices.length, CHOICES)
    assert.equal(new Set(choices).size, CHOICES)
    assert.ok(choices.includes('A'))
  }
})

test('prefiere opciones del mismo tipo de contenido', () => {
  for (let i = 0; i < 50; i++) {
    assert.deepEqual([...pickChoices(pool[0], pool)].sort(), ['A', 'B', 'C', 'D'])
  }
})

test('completa con otros tipos, y no falla con pocos títulos', () => {
  assert.ok(pickChoices(pool[4], pool).includes('E'))
  assert.equal(pickChoices(pool[4], pool).length, CHOICES)
  assert.deepEqual(pickChoices(pool[0], [pool[0]]), ['A'])
})

test('reconoce los tipos de contenido de la URL', () => {
  assert.equal(contentTypeBySlug('anime').category, 'anime')
  assert.equal(contentTypeBySlug('otra-cosa'), null)
})
