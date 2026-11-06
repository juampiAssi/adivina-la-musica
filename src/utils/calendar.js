import daySizes from '../data/day-sizes.json'

// Calendario del juego: un día nuevo cada 24 h desde config/game.startDate.
// startDate se guarda como la medianoche de Argentina (UTC-3, sin horario de verano),
// así que sumar 24 h siempre cae en la medianoche siguiente.
// Ojo: esto usa el reloj del navegador para calcular qué día mostrar; quien decide
// qué se puede leer y si una jugada es "atrasada" son las reglas de Firestore
// (request.time). Si el reloj de la compu está muy corrido, las reglas rechazan.
export const DAY_MS = 24 * 60 * 60 * 1000
export const TOTAL_DAYS = Object.keys(daySizes).length // días con canciones cargadas

// 'AAAA-MM-DD' → Date a las 00:00 de Argentina.
export function argentinaMidnight(isoDate) {
  return new Date(`${isoDate}T00:00:00-03:00`)
}

// Fecha en formato 'AAAA-MM-DD' (hora argentina), para mostrar en inputs de fecha.
export function toArgentinaIsoDate(date) {
  return new Date(date.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

// Número de día de hoy (1 = el día de startDate). Puede ser 0 o negativo si todavía no empezó.
export function currentDay(startDate, now = new Date()) {
  return Math.floor((now.getTime() - startDate.getTime()) / DAY_MS) + 1
}

// Momento en que se desbloquea un día.
export function unlockAtFor(startDate, day) {
  return new Date(startDate.getTime() + (day - 1) * DAY_MS)
}

// Una jugada es "atrasada" si pasó más de un día desde que se desbloqueó el título.
export function isLate(unlockAt, now = new Date()) {
  return now.getTime() >= unlockAt.getTime() + DAY_MS
}
