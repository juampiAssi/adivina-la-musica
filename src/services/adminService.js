// Operaciones del panel admin. Las reglas de Firestore solo las permiten si
// existe admins/{uid}, así que un jugador no puede usarlas aunque las llame.
import { collection, doc, getDocs, setDoc, Timestamp, writeBatch } from 'firebase/firestore/lite'
import { invalidate } from './cache.js'
import { db } from './firebase.js'
import { TIMEZONE } from './configService.js'
import { unlockAtFor } from '../utils/calendar.js'

const BATCH_SIZE = 500 // máximo de escrituras por lote que usamos

// Escribe en lotes de hasta 500 operaciones. onProgress(escritos, total).
async function inBatches(items, apply, onProgress) {
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = writeBatch(db)
    items.slice(i, i + BATCH_SIZE).forEach((item) => apply(batch, item))
    await batch.commit()
    onProgress?.(Math.min(i + BATCH_SIZE, items.length), items.length)
  }
}

// Importa (o vuelve a importar) títulos. Es idempotente: el id de cada documento
// sale del archivo, así que importar dos veces el mismo archivo pisa lo mismo.
export function importTitles(titles, startDate, onProgress) {
  return inBatches(
    titles,
    (batch, t) => {
      const { id, ...data } = t
      batch.set(doc(db, 'titles', id), { ...data, unlockAt: Timestamp.fromDate(unlockAtFor(startDate, t.day)) })
    },
    onProgress,
  ).finally(() => {
    invalidate('titles:')
    invalidate('details:')
  })
}

// Cambia la fecha de inicio y recalcula unlockAt de TODOS los títulos.
export async function changeStartDate(startDate, onProgress) {
  await setDoc(doc(db, 'config', 'game'), { startDate: Timestamp.fromDate(startDate), timezone: TIMEZONE })
  invalidate('config')
  const snap = await getDocs(collection(db, 'titles')) // el admin puede leer todos
  await inBatches(
    snap.docs,
    (batch, d) => batch.update(d.ref, { unlockAt: Timestamp.fromDate(unlockAtFor(startDate, d.data().day)) }),
    onProgress,
  )
  return snap.size
}

// Cuántos títulos hay cargados por día (para mostrar en el panel).
export async function countTitlesByDay() {
  const snap = await getDocs(collection(db, 'titles'))
  const byDay = {}
  snap.docs.forEach((d) => {
    const day = d.data().day
    byDay[day] = (byDay[day] ?? 0) + 1
  })
  return { total: snap.size, byDay }
}
