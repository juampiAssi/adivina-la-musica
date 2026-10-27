import { useContext } from 'react'
import { AuthContext } from '../context/authContext.js'

// Devuelve la sesión actual desde cualquier componente.
export function useAuth() {
  return useContext(AuthContext)
}
