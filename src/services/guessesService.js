// Aciertos (y fallos) de cada jugador: guesses/{uid_titleId}.
// El id es determinista para que no se pueda jugar dos veces el mismo título.
import { collection, deleteDoc, doc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore'
import { db } from './firebase.js'

export function guessId(uid, titleId) {
  return `${uid}_${titleId}`
}

// title: el título jugado (se copia lo mínimo para armar el estante sin leer titles).
export function saveGuess(uid, title, { cluesUsed, points, late, solved }) {
  return setDoc(doc(db, 'guesses', guessId(uid, title.id)), {
    uid,
    titleId: title.id,
    cluesUsed,
    points,
    late,
    solved,
    createdAt: serverTimestamp(), // hora del servidor, no la del navegador
    title: title.title,
    year: title.year ?? null,
    posterUrl: title.posterUrl ?? '',
    day: title.day,
  })
}

export async function getMyGuesses(uid) {
  const snap = await getDocs(query(collection(db, 'guesses'), where('uid', '==', uid)))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export function deleteGuess(id) {
  return deleteDoc(doc(db, 'guesses', id))
}
