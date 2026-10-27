// Configuración del juego: config/game { startDate, timezone }.
import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase.js'

export const TIMEZONE = 'America/Argentina/Buenos_Aires'

export async function getGameConfig() {
  const snap = await getDoc(doc(db, 'config', 'game'))
  if (!snap.exists()) throw Object.assign(new Error('Sin configuración'), { code: 'not-found' })
  return snap.data()
}
