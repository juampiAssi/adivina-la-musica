// Configuración del juego: config/game { startDate, timezone }.
import { doc, getDoc } from 'firebase/firestore/lite'
import { cached } from './cache.js'
import { db } from './firebase.js'

export const TIMEZONE = 'America/Argentina/Buenos_Aires'

export function getGameConfig() {
  return cached('config', async () => {
    const snap = await getDoc(doc(db, 'config', 'game'))
    if (!snap.exists()) throw Object.assign(new Error('Sin configuración'), { code: 'not-found' })
    return snap.data()
  })
}
