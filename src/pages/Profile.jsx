import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { deleteGuess, getMyGuesses } from '../services/guessesService.js'
import { deleteMyEntry, getMyEntry, saveMyEntry, totalsFrom } from '../services/leaderboardService.js'
import { toUserMessage } from '../utils/firebaseErrors.js'
import { validateNickname } from '../utils/nickname.js'

// Perfil del jugador: apodo para el ranking (crear/editar/borrar) y estante con
// sus aciertos (leer/borrar). El estante sale de guesses, sin leer titles.
export default function Profile() {
  const { user } = useAuth()
  const [guesses, setGuesses] = useState([])
  const [entry, setEntry] = useState(null)
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(null) // { type: 'success' | 'error', text }
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    Promise.all([getMyGuesses(user.uid), getMyEntry(user.uid)])
      .then(([myGuesses, myEntry]) => {
        setGuesses(myGuesses)
        setEntry(myEntry)
        setNickname(myEntry?.nickname ?? '')
      })
      .catch((err) => setError(toUserMessage(err, 'No se pudo cargar tu perfil.')))
      .finally(() => setLoading(false))
  }, [user.uid])

  async function handleSaveNickname(e) {
    e.preventDefault()
    const problem = validateNickname(nickname)
    if (problem) {
      setNotice({ type: 'error', text: problem })
      return
    }
    setBusy(true)
    try {
      const data = { nickname: nickname.trim(), ...totalsFrom(guesses) }
      await saveMyEntry(user.uid, data)
      setEntry(data)
      setNotice({ type: 'success', text: entry ? 'Apodo actualizado.' : 'Listo, ya aparecés en el ranking.' })
    } catch (err) {
      setNotice({ type: 'error', text: toUserMessage(err, 'No se pudo guardar el apodo.') })
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteEntry() {
    if (!window.confirm('¿Borrar tu apodo y tus puntos del ranking? Tus aciertos siguen en el estante.')) return
    setBusy(true)
    try {
      await deleteMyEntry(user.uid)
      setEntry(null)
      setNickname('')
      setNotice({ type: 'success', text: 'Saliste del ranking.' })
    } catch (err) {
      setNotice({ type: 'error', text: toUserMessage(err, 'No se pudo borrar tu entrada del ranking.') })
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteGuess(guess) {
    if (!window.confirm(`¿Borrar "${guess.title}" de tu estante? Se descuentan sus puntos.`)) return
    setBusy(true)
    try {
      await deleteGuess(guess.id)
      const remaining = guesses.filter((g) => g.id !== guess.id)
      setGuesses(remaining)
      if (entry) {
        const data = { nickname: entry.nickname, ...totalsFrom(remaining) }
        await saveMyEntry(user.uid, data)
        setEntry(data)
      }
      setNotice({ type: 'success', text: `Se borró "${guess.title}".` })
    } catch (err) {
      setNotice({ type: 'error', text: toUserMessage(err, 'No se pudo borrar.') })
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p className="muted">Cargando tu perfil…</p>
  if (error) return <p className="alert alert-error" role="alert">{error}</p>

  const shelf = guesses.filter((g) => g.solved).sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
  const { totalPoints } = totalsFrom(guesses)

  return (
    <section className="profile">
      <div className="play-header">
        <div>
          <p className="eyebrow">Tu perfil</p>
          <h1>{entry?.nickname ?? 'Jugador anónimo'}</h1>
        </div>
        <span className="score-pill">{totalPoints} pts</span>
      </div>

      {notice && (
        <p className={`alert alert-${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>
          {notice.text}
        </p>
      )}

      <form className="card answer-form" onSubmit={handleSaveNickname} noValidate>
        <label htmlFor="nickname">Apodo para el ranking</label>
        <input
          id="nickname"
          type="text"
          value={nickname}
          maxLength={20}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="De 3 a 20 caracteres"
          autoComplete="off"
        />
        <p className="muted">No uses tu nombre real: el apodo lo ven todos los jugadores.</p>
        <div className="row">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {entry ? 'Guardar apodo' : 'Entrar al ranking'}
          </button>
          {entry && (
            <button type="button" className="btn btn-ghost" onClick={handleDeleteEntry} disabled={busy}>
              Salir del ranking
            </button>
          )}
        </div>
      </form>

      <div className="home-section">
        <p className="eyebrow">Tu estante</p>
        <h2>{shelf.length ? `${shelf.length} ${shelf.length === 1 ? 'película adivinada' : 'adivinadas'}` : 'Todavía vacío'}</h2>
        {!shelf.length && <p className="muted">Cada canción que adivinás se guarda acá.</p>}
        <ul className="shelf">
          {shelf.map((g) => (
            <li key={g.id} className="shelf-item">
              {g.posterUrl ? <img src={g.posterUrl} alt="" loading="lazy" /> : <div className="shelf-blank" />}
              <div>
                <p className="track-title">{g.title}</p>
                <p className="muted">
                  {g.year ? `${g.year} · ` : ''}Día {g.day} · {g.points} pts{g.late ? ' (atrasada)' : ''}
                </p>
              </div>
              <button type="button" className="btn btn-ghost" onClick={() => handleDeleteGuess(g)} disabled={busy}>
                Borrar
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
