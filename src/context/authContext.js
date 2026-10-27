import { createContext } from 'react'

// Contexto con la sesión actual: { user, isAdmin, loading, error }.
export const AuthContext = createContext(null)
