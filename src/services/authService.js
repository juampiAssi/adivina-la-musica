// Inicio y cierre de sesión. Jugadores: sesión anónima automática (sin datos
// personales). Admin: correo y contraseña de una cuenta creada a mano en la consola.
import { signInAnonymously, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore/lite'
import { auth, db } from './firebase.js'

// Evita crear dos usuarios anónimos si se llama dos veces seguidas
// (por ejemplo, con StrictMode en desarrollo).
let anonymousPromise = null

export function ensureAnonymousSession() {
  if (auth.currentUser) return Promise.resolve(auth.currentUser)
  anonymousPromise ??= signInAnonymously(auth)
    .then((cred) => cred.user)
    .finally(() => {
      anonymousPromise = null
    })
  return anonymousPromise
}

export function signInAdmin(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

// Al cerrar la sesión de admin, AuthContext vuelve a abrir una anónima.
export function signOutAdmin() {
  return signOut(auth)
}

// Es admin si existe el documento admins/{uid} (lo crea el dueño a mano en la consola).
// Las reglas solo dejan leer el documento propio.
export async function checkIsAdmin(uid) {
  const snap = await getDoc(doc(db, 'admins', uid))
  return snap.exists()
}
