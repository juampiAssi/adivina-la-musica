// Lectura de títulos (películas/series/juegos) de un día. Solo se piden los 10
// del día elegido, para gastar pocas lecturas del plan gratuito.
import { collection, doc, getDoc, getDocs, query, Timestamp, where } from 'firebase/firestore'
import { db } from './firebase.js'

export async function getTitlesForDay(day) {
  // La condición unlockAt <= ahora hace que la consulta coincida con la regla
  // de seguridad (que no deja leer títulos bloqueados).
  const q = query(collection(db, 'titles'), where('day', '==', day), where('unlockAt', '<=', Timestamp.now()))
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ id: d.id, type: 'music', ...d.data() }))
    .sort((a, b) => a.order - b.order)
}

// Detalle de UN título (director, sinopsis...) para el popup del estante.
// Se pide solo cuando el jugador abre una cinta grabada (1 lectura) y queda en
// memoria, así abrir la misma cinta otra vez no vuelve a leer de Firestore.
// Las reglas lo permiten porque una cinta grabada es siempre de un día desbloqueado.
const detailsCache = new Map()

export async function getTitleDetails(titleId) {
  if (!detailsCache.has(titleId)) {
    const snap = await getDoc(doc(db, 'titles', titleId))
    detailsCache.set(titleId, snap.exists() ? snap.data() : null)
  }
  return detailsCache.get(titleId)
}
