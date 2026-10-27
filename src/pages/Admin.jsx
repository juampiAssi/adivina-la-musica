import { useState } from 'react'
import AdminTools from '../components/admin/AdminTools.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { signInAdmin, signOutAdmin } from '../services/authService.js'
import { toUserMessage } from '../utils/firebaseErrors.js'

// Panel de administración: inicio de sesión con correo y contraseña y, si la cuenta
// es admin, las herramientas (fecha de inicio e importación de títulos).
export default function Admin() {
  const { user, isAdmin } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Completá correo y contraseña.')
      return
    }
    setSending(true)
    setError('')
    try {
      await signInAdmin(email.trim(), password)
      setPassword('')
    } catch (err) {
      setError(toUserMessage(err, 'No se pudo iniciar sesión.'))
    } finally {
      setSending(false)
    }
  }

  if (user && !user.isAnonymous) {
    return (
      <section className="card">
        <p className="eyebrow">Administración</p>
        <h1>Panel</h1>
        {isAdmin ? (
          <AdminTools />
        ) : (
          <p className="alert alert-error">
            Esta cuenta no tiene permisos de admin (falta el documento admins/{'{uid}'}).
          </p>
        )}
        <div className="row">
          <button type="button" className="btn btn-ghost" onClick={() => signOutAdmin()}>
            Cerrar sesión
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="card">
      <p className="eyebrow">Administración</p>
      <h1>Ingresar</h1>
      <form onSubmit={handleSubmit} className="answer-form" noValidate>
        <label htmlFor="admin-email">Correo</label>
        <input id="admin-email" type="text" inputMode="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="admin-password">Contraseña</label>
        <input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && (
          <p className="alert alert-error" role="alert">
            {error}
          </p>
        )}
        <div className="row">
          <button type="submit" className="btn btn-primary" disabled={sending}>
            {sending ? 'Ingresando…' : 'Ingresar'}
          </button>
        </div>
      </form>
    </section>
  )
}
