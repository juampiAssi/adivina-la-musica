// Lectura de títulos (películas/series/juegos) de un día. Solo se piden los 10
// del día elegido, para gastar pocas lecturas del plan gratuito.
import { collection, getDocs, query, Timestamp, where } from 'firebase/firestore'
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
