// Pruebas de la cuenta de puntos. Se ejecutan con: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { guessSeconds, pointsAt } from './scoring.js'

test('conserva los 100 puntos hasta el segundo 3', () => {
  for (const seconds of [0, 1, 2, 3]) assert.equal(pointsAt(seconds), 100)
})

test('pierde 3 puntos por segundo desde el segundo 3', () => {
  assert.equal(pointsAt(4), 97)
  assert.equal(pointsAt(15), 64)
  assert.equal(pointsAt(30), 19)
})

test('un día pasado vale la mitad, redondeada para abajo', () => {
  assert.equal(pointsAt(3, true), 50)
  assert.equal(pointsAt(4, true), 48)
  assert.equal(pointsAt(30, true), 9)
})

test('los puntos siempre son enteros, como exigen las reglas', () => {
  for (let seconds = 0; seconds <= 30; seconds++) {
    assert.ok(Number.isInteger(pointsAt(seconds)))
    assert.ok(Number.isInteger(pointsAt(seconds, true)))
  }
})

test('entiende las jugadas nuevas y las viejas', () => {
  assert.equal(guessSeconds({ secondsUsed: 7 }), 7)
  assert.equal(guessSeconds({ secondsUsed: 0 }), 0)
  assert.equal(guessSeconds({ cluesUsed: 1 }), 3)
  assert.equal(guessSeconds({ cluesUsed: 2 }), 6)
  assert.equal(guessSeconds({ cluesUsed: 3 }), 10)
})
