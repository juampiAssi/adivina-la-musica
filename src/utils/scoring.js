// Puntaje por tiempo: la canción corre de corrido y, cuanto más tardás, menos vale.
// La misma cuenta está en firestore.rules, así que no se puede hacer trampa
// mandando otros puntos desde el navegador.
export const SONG_SECONDS = 30 // lo que dura el fragmento de Deezer
export const FREE_SECONDS = 3 // hasta acá se conserva el puntaje máximo
export const MAX_POINTS = 100
export const POINTS_PER_SECOND = 3
export const MAX_ATTEMPTS = 3 // respuestas por canción
export const ANSWER_SECONDS = 10 // tiempo para escribir después de tocar "¡La sé!"

// Momentos de ejemplo para mostrar en las instrucciones y en el inicio.
export const POINT_EXAMPLES = [FREE_SECONDS, 15, SONG_SECONDS]

// "Ponte al día": jugar un día que ya pasó vale la mitad, redondeado para abajo.
export function pointsAt(seconds, late = false) {
  const base = MAX_POINTS - Math.max(seconds - FREE_SECONDS, 0) * POINTS_PER_SECOND
  return late ? Math.floor(base / 2) : base
}

// Las jugadas anteriores a este sistema guardaban la pista usada (1, 2 o 3).
const OLD_CLUE_SECONDS = [3, 6, 10]

export function guessSeconds(guess) {
  return guess.secondsUsed ?? OLD_CLUE_SECONDS[(guess.cluesUsed ?? 1) - 1]
}
