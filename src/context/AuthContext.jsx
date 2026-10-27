import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase.js'
import { checkIsAdmin, ensureAnonymousSession } from '../services/authService.js'
import { AuthContext } from './authContext.js'

// Mantiene la sesión actual disponible para toda la app.
// Si no hay nadie logueado, abre una sesión anónima automáticamente.
export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, isAdmin: false, loading: true, error: '' })

  useEffect(() => {
    // onAuthStateChanged avisa cada vez que cambia la sesión (entrar, salir, recargar).
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        ensureAnonymousSession().catch(() =>
          setState({ user: null, isAdmin: false, loading: false, error: 'No se pudo iniciar la sesión. Revisá tu conexión y recargá la página.' }),
        )
        return
      }
      // Solo una cuenta con correo puede ser admin; para las anónimas ni lo consultamos.
      let isAdmin = false
      if (!user.isAnonymous) {
        isAdmin = await checkIsAdmin(user.uid).catch(() => false)
      }
      setState({ user, isAdmin, loading: false, error: '' })
    })
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}
