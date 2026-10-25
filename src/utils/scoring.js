// Fragmento (en segundos) y puntos de cada pista. La pista 0 es la más corta
// y la que más puntos da; cada pista extra da menos.
export const CLUES = [
  { seconds: 3, points: 100 },
  { seconds: 6, points: 60 },
  { seconds: 10, points: 30 },
]

export const MAX_LEVEL = CLUES.length - 1
