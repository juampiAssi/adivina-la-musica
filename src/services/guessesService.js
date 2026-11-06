// Aciertos (y fallos) de cada jugador: guesses/{uid_titleId}.
// El id es determinista para que no se pueda jugar dos veces el mismo título.
import { collection, deleteDoc, doc, getDocs, query, serverTimestamp, setDoc, Timestamp, where } from 'firebase/firestore/lite'
import { cached, patchCached } from './cache.js'
import { db } from './firebase.js'

export function guessId(uid, titleId) {
  return `${uid}_${titleId}`
}

// title: el título jugado (se copia lo mínimo para armar el estante sin leer titles).
export async function saveGuess(uid, title, { cluesUsed, points, late, solved }) {
  const id = guessId(uid, title.id)
  const data = {
    uid,
    titleId: title.id,
    cluesUsed,
    points,
    late,
    solved,
    title: title.title,
    year: title.year ?? null,
    posterUrl: title.posterUrl ?? '',
    day: title.day,
  }
  await setDoc(doc(db, 'guesses', id), {
    ...data,
    createdAt: serverTimestamp(), // hora del servidor, no la del navegador
  })
  // Ya se guardó: se suma a la copia en memoria en lugar de volver a leer todo.
  // La fecha local solo sirve para ordenar el estante hasta la próxima recarga.
  patchCached(`guesses:${uid}`, (list) => [...list, { id, ...data, createdAt: Timestamp.now() }])
}

export function getMyGuesses(uid) {
  return cached(`guesses:${uid}`, async () => {
    const snap = await getDocs(query(collection(db, 'guesses'), where('uid', '==', uid)))
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  })
}

export async function deleteGuess(uid, id) {
  await deleteDoc(doc(db, 'guesses', id))
  patchCached(`guesses:${uid}`, (list) => list.filter((g) => g.id !== id))
}
