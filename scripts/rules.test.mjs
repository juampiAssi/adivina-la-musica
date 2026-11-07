// Pruebas de firestore.rules contra el emulador de Firebase (nunca toca la base real).
// Se ejecutan con: npm run test:rules (necesita Java 21 o superior).
import assert from 'node:assert/strict'
import { before, test } from 'node:test'
import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, signInAnonymously } from 'firebase/auth'
import {
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore/lite'
import { pointsAt } from '../src/utils/scoring.js'

const PROJECT = 'demo-adivina' // el prefijo "demo-" garantiza que no existe ningún proyecto real
const DOCS = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`
const HOUR = 3_600_000

function client(name) {
  const app = initializeApp({ apiKey: 'demo', projectId: PROJECT, appId: 'demo' }, name)
  const auth = getAuth(app)
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  const db = getFirestore(app)
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  return { auth, db }
}

// "Bearer owner" es la forma del emulador de escribir sin pasar por las reglas (para preparar datos).
async function seedTitle(id, unlockAt, day) {
  const res = await fetch(`${DOCS}/titles/${id}`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        title: { stringValue: `Título ${id}` },
        day: { integerValue: day },
        year: { integerValue: 2000 },
        posterUrl: { stringValue: '' },
        unlockAt: { timestampValue: new Date(unlockAt).toISOString() },
      },
    }),
  })
  assert.ok(res.ok, `no se pudo preparar ${id}`)
}

const me = client('yo')
let uid

before(async () => {
  uid = (await signInAnonymously(me.auth)).user.uid
  const now = Date.now()
  await seedTitle('hoy', now - HOUR, 3)
  await seedTitle('pasado', now - 72 * HOUR, 1)
  await seedTitle('futuro', now + 24 * HOUR, 5)
})

const guessRef = (titleId, owner = uid) => doc(me.db, 'guesses', `${owner}_${titleId}`)

function guess(titleId, day, fields, owner = uid) {
  return {
    uid: owner,
    titleId,
    late: false,
    solved: true,
    createdAt: serverTimestamp(),
    title: `Título ${titleId}`,
    year: 2000,
    posterUrl: '',
    day,
    ...fields,
  }
}

const denied = (promise) => assert.rejects(promise, (err) => err.code === 'permission-denied')

// Guarda y borra, para poder repetir sobre el mismo título.
async function allowed(titleId, data) {
  await setDoc(guessRef(titleId), data)
  await deleteDoc(guessRef(titleId))
}

test('acepta los puntos exactos de cada segundo, y rechaza uno más', async () => {
  for (let secondsUsed = 0; secondsUsed <= 30; secondsUsed++) {
    const points = pointsAt(secondsUsed)
    await allowed('hoy', guess('hoy', 3, { secondsUsed, points }))
    await denied(setDoc(guessRef('hoy'), guess('hoy', 3, { secondsUsed, points: points + 1 })))
  }
})

test('un día pasado vale la mitad redondeada y debe marcarse atrasado', async () => {
  for (const secondsUsed of [0, 3, 4, 15, 30]) {
    const points = pointsAt(secondsUsed, true)
    await allowed('pasado', guess('pasado', 1, { secondsUsed, points, late: true }))
  }
  await denied(setDoc(guessRef('pasado'), guess('pasado', 1, { secondsUsed: 4, points: 97, late: false })))
  await denied(setDoc(guessRef('pasado'), guess('pasado', 1, { secondsUsed: 4, points: 97, late: true })))
  await denied(setDoc(guessRef('hoy'), guess('hoy', 3, { secondsUsed: 4, points: 48, late: true })))
})

test('una jugada sin acertar vale 0', async () => {
  await allowed('hoy', guess('hoy', 3, { secondsUsed: 12, points: 0, solved: false }))
  await denied(setDoc(guessRef('hoy'), guess('hoy', 3, { secondsUsed: 12, points: 73, solved: false })))
})

test('rechaza segundos fuera de rango o que no son enteros', async () => {
  await denied(setDoc(guessRef('hoy'), guess('hoy', 3, { secondsUsed: 31, points: 16 })))
  await denied(setDoc(guessRef('hoy'), guess('hoy', 3, { secondsUsed: -1, points: 100 })))
  await denied(setDoc(guessRef('hoy'), guess('hoy', 3, { secondsUsed: 3.5, points: 100 })))
  await denied(setDoc(guessRef('hoy'), guess('hoy', 3, { secondsUsed: '3', points: 100 })))
})

test('una jugada usa un solo sistema de puntos', async () => {
  await denied(setDoc(guessRef('hoy'), guess('hoy', 3, { secondsUsed: 3, cluesUsed: 1, points: 100 })))
  await denied(setDoc(guessRef('hoy'), guess('hoy', 3, { points: 100 })))
})

test('sigue aceptando el formato anterior durante el cambio', async () => {
  await allowed('hoy', guess('hoy', 3, { cluesUsed: 1, points: 100 }))
  await allowed('hoy', guess('hoy', 3, { cluesUsed: 2, points: 60 }))
  await allowed('pasado', guess('pasado', 1, { cluesUsed: 3, points: 15, late: true }))
  await denied(setDoc(guessRef('hoy'), guess('hoy', 3, { cluesUsed: 4, points: 30 })))
  await denied(setDoc(guessRef('hoy'), guess('hoy', 3, { cluesUsed: 1, points: 90 })))
})

test('no se puede jugar por otro, ni un título bloqueado, ni dos veces', async () => {
  await denied(setDoc(guessRef('hoy', 'otro'), guess('hoy', 3, { secondsUsed: 3, points: 100 }, 'otro')))
  await denied(setDoc(guessRef('futuro'), guess('futuro', 5, { secondsUsed: 3, points: 100 })))
  await denied(setDoc(guessRef('hoy'), guess('hoy', 3, { secondsUsed: 3, points: 100, createdAt: Timestamp.now() })))
  await setDoc(guessRef('hoy'), guess('hoy', 3, { secondsUsed: 3, points: 100 }))
  await denied(setDoc(guessRef('hoy'), guess('hoy', 3, { secondsUsed: 4, points: 97 })))
  await deleteDoc(guessRef('hoy'))
})

test('con sesión se lee todo el catálogo, sin sesión nada', async () => {
  const snap = await getDocs(collection(me.db, 'titles'))
  assert.deepEqual(snap.docs.map((d) => d.id).sort(), ['futuro', 'hoy', 'pasado'])
  const closed = await fetch(`${DOCS}/titles/hoy`)
  assert.equal(closed.status, 403)
})

test('nadie sin permiso de admin puede escribir títulos', async () => {
  await denied(setDoc(doc(me.db, 'titles', 'nuevo'), { title: 'x', day: 1 }))
})
