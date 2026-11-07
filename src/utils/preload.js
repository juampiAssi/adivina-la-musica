// Adelanta lo que va a necesitar una pantalla, para que se abra sin esperas.
// Las consultas quedan en la caché en memoria: la pantalla las reutiliza al montarse.
import { auth } from '../services/firebase.js'
import { getGameConfig } from '../services/configService.js'
import { getMyGuesses } from '../services/guessesService.js'
import { getMyEntry, getTopScores } from '../services/leaderboardService.js'
import { getTitlesForDay } from '../services/titlesService.js'
import { currentDay, TOTAL_DAYS, unlockAtFor } from './calendar.js'

async function preloadTitles() {
  const start = (await getGameConfig()).startDate.toDate()
  const day = Math.min(currentDay(start), TOTAL_DAYS)
  if (day >= 1) await getTitlesForDay(day, unlockAtFor(start, day))
}

const dataLoaders = {
  '/jugar/popurri': (uid) => [getMyGuesses(uid), preloadTitles()],
  '/ranking': () => [getTopScores()],
  '/perfil': (uid) => [getMyGuesses(uid), getMyEntry(uid), getGameConfig()],
}

// Se llama al pasar el mouse, tocar o enfocar un enlace. Es solo una ayuda:
// si algo falla acá, la pantalla lo vuelve a pedir y muestra el error.
export function preloadPage(path) {
  const uid = auth.currentUser?.uid
  if (uid) dataLoaders[path]?.(uid).forEach((request) => request.catch(() => {}))
}
