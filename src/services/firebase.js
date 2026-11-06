// ÚNICO punto de conexión con Firebase. Todo el resto de la app importa
// `auth` y `db` desde acá. Los valores salen del archivo .env (ver .env.example);
// Vite solo expone al navegador las variables que empiezan con VITE_.
import { initializeApp } from 'firebase/app'
import { browserLocalPersistence, browserSessionPersistence, indexedDBLocalPersistence, initializeAuth } from 'firebase/auth'
// Versión "lite" de Firestore: consulta por HTTP en vez de abrir una conexión
// permanente. La app no escucha cambios en vivo, así que abre mucho más rápido y pesa menos.
import { getFirestore } from 'firebase/firestore/lite'

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

// Sesiones (anónima para jugadores, correo para el admin). Es como getAuth, con los
// mismos lugares de guardado (así nadie pierde su sesión), pero sin el código del
// ingreso por ventana emergente, que acá no se usa.
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence],
})
export const db = getFirestore(app) // base de datos Cloud Firestore
