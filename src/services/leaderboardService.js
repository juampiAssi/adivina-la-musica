// Ranking: leaderboard/{uid} { nickname, totalPoints, guessesCount, updatedAt }.
// Sin email ni nombre real. Ojo: totalPoints lo calcula el navegador (sin backend
// no se puede verificar del todo); está documentado como limitación en el README.
import { collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from './firebase.js'

export const TOP_SIZE = 20

export async function getTopScores() {
  const q = query(collection(db, 'leaderboard'), orderBy('totalPoints', 'desc'), limit(TOP_SIZE))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }))
}

export async function getMyEntry(uid) {
  const snap = await getDoc(doc(db, 'leaderboard', uid))
  return snap.exists() ? snap.data() : null
}

// Recalcula los totales a partir de las jugadas guardadas.
export function totalsFrom(guesses) {
  return {
    totalPoints: guesses.reduce((sum, g) => sum + (g.points ?? 0), 0),
    guessesCount: guesses.filter((g) => g.solved).length,
  }
}

export function saveMyEntry(uid, { nickname, totalPoints, guessesCount }) {
  return setDoc(doc(db, 'leaderboard', uid), {
    nickname: nickname.trim(),
    totalPoints,
    guessesCount,
    updatedAt: serverTimestamp(),
  })
}

export function deleteMyEntry(uid) {
  return deleteDoc(doc(db, 'leaderboard', uid))
}
