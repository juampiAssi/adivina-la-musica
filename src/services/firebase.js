// ÚNICO punto de conexión con Firebase. Todo el resto de la app importa
// `auth` y `db` desde acá. Los valores salen del archivo .env (ver .env.example);
// Vite solo expone al navegador las variables que empiezan con VITE_.
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Si falta alguna variable, avisamos con un error claro en vez de fallar más adelante.
const missing = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key)
if (missing.length) {
  throw new Error(`Falta configurar Firebase en .env: ${missing.join(', ')}`)
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app) // sesiones (anónima para jugadores, correo para el admin)
export const db = getFirestore(app) // base de datos Cloud Firestore
