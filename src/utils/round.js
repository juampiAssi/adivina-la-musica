import { shuffle } from './shuffle.js'

export const ROUND_SIZE = 10

// Arma una partida: mezcla las preguntas y toma hasta `size`, sin repetir
// respuesta (hay varias canciones de Cars, por ejemplo, y saldría una sola).
export function buildRound(questions, size = ROUND_SIZE) {
  const round = []
  const usedTitles = new Set()
  for (const q of shuffle(questions)) {
    if (usedTitles.has(q.title)) continue
    usedTitles.add(q.title)
    round.push(q)
    if (round.length === size) break
  }
  return round
}
