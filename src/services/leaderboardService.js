// Ranking: leaderboard/{uid} { nickname, totalPoints, guessesCount, updatedAt }.
// Sin email ni nombre real. Ojo: totalPoints lo calcula el navegador (sin backend
// no se puede verificar del todo); está documentado como limitación en el README.
import { collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore/lite'
import { cached, invalidate, patchCached } from './cache.js'
import { db } from './firebase.js'

export const TOP_SIZE = 20
const TOP_TTL_MS = 30_000 // el ranking cambia con las jugadas de todos: se refresca seguido

export function getTopScores() {
  return cached(
    'top',
    async () => {
      const q = query(collection(db, 'leaderboard'), orderBy('totalPoints', 'desc'), limit(TOP_SIZE))
      const snap = await getDocs(q)
      return snap.docs.map((d) => ({ uid: d.id, ...d.data() }))
    },
    TOP_TTL_MS,
  )
}

export function getMyEntry(uid) {
  return cached(`entry:${uid}`, async () => {
    const snap = await getDoc(doc(db, 'leaderboard', uid))
    return snap.exists() ? snap.data() : null
  })
}

// Recalcula los totales a partir de las jugadas guardadas.
export function totalsFrom(guesses) {
  return {
    totalPoints: guesses.reduce((sum, g) => sum + (g.points ?? 0), 0),
    guessesCount: guesses.filter((g) => g.solved).length,
  }
}

export async function saveMyEntry(uid, { nickname, totalPoints, guessesCount }) {
  const data = { nickname: nickname.trim(), totalPoints, guessesCount }
  await setDoc(doc(db, 'leaderboard', uid), { ...data, updatedAt: serverTimestamp() })
  patchCached(`entry:${uid}`, () => data)
  invalidate('top')
}

export async function deleteMyEntry(uid) {
  await deleteDoc(doc(db, 'leaderboard', uid))
  patchCached(`entry:${uid}`, () => null)
  invalidate('top')
}
