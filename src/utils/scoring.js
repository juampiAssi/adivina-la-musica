// Fragmento (en segundos) y puntos de cada pista. La pista 0 es la más corta
// y la que más puntos da; cada pista extra da menos.
export const CLUES = [
  { seconds: 3, points: 100 },
  { seconds: 6, points: 60 },
  { seconds: 10, points: 30 },
]

export const MAX_LEVEL = CLUES.length - 1

// "Ponte al día": jugar un día que ya pasó vale la mitad (100/60/30 → 50/30/15).
// La misma cuenta está en firestore.rules, así que no se puede hacer trampa
// mandando más puntos desde el navegador.
export const LATE_FACTOR = 0.5

// cluesUsed va de 1 a 3 (cuántas pistas se escucharon hasta acertar).
export function pointsFor(cluesUsed, late) {
  const base = CLUES[cluesUsed - 1].points
  return late ? base * LATE_FACTOR : base
}
