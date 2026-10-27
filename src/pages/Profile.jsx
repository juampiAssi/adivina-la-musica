import { useEffect, useRef, useState } from 'react'
import daySizes from '../data/day-sizes.json'
import Shelf from '../components/vhs/Shelf.jsx'
import TapeDialog from '../components/vhs/TapeDialog.jsx'
import VhsTape from '../components/vhs/VhsTape.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { getGameConfig } from '../services/configService.js'
import { deleteGuess, getMyGuesses } from '../services/guessesService.js'
import { deleteMyEntry, getMyEntry, saveMyEntry, totalsFrom } from '../services/leaderboardService.js'
import { currentDay } from '../utils/calendar.js'
import { toUserMessage } from '../utils/firebaseErrors.js'
import { validateNickname } from '../utils/nickname.js'

// Perfil del jugador: apodo para el ranking (crear/editar/borrar) y estante con
// sus aciertos (leer/borrar). El estante sale de guesses, sin leer titles.
export default function Profile() {
  const { user } = useAuth()
  const [guesses, setGuesses] = useState([])
  const [entry, setEntry] = useState(null)
  const [today, setToday] = useState(0) // número de día actual del calendario
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(null) // { type: 'success' | 'error', text }
  const [busy, setBusy] = useState(false)
  const [opened, setOpened] = useState(null) // { tape, origin } de la cinta abierta en el popup
  const triggerRef = useRef(null) // el lomo que abrió el popup, para devolverle el foco

  useEffect(() => {
    Promise.all([getMyGuesses(user.uid), getMyEntry(user.uid), getGameConfig().catch(() => null)])
      .then(([myGuesses, myEntry, config]) => {
        setGuesses(myGuesses)
        setToday(config ? currentDay(config.startDate.toDate()) : 0)
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

  // Borra un acierto (desde el popup). Devuelve true si salió bien.
  async function handleDeleteGuess(guess) {
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
      setNotice({ type: 'success', text: `Se sacó "${guess.title}" del estante.` })
      return true
    } catch (err) {
      setNotice({ type: 'error', text: toUserMessage(err, 'No se pudo borrar.') })
      return false
    } finally {
      setBusy(false)
    }
  }

  function openTape(tape, button) {
    triggerRef.current = button
    setOpened({ tape, origin: button.getBoundingClientRect() })
  }

  function closeTape() {
    setOpened(null)
    triggerRef.current?.focus() // el foco vuelve al lomo que abrió el popup
  }

  if (loading) return <p className="muted">Cargando tu perfil…</p>
  if (error) return <p className="alert alert-error" role="alert">{error}</p>

  const shelf = guesses.filter((g) => g.solved).sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
  const { totalPoints } = totalsFrom(guesses)

  // Datos del estante: días desbloqueados y aciertos agrupados por día.
  const totalDays = Object.keys(daySizes).length
  const openDays = Array.from({ length: Math.min(Math.max(today, 0), totalDays) }, (_, i) => i + 1)
  const recordedByDay = {}
  for (const g of [...shelf].reverse()) (recordedByDay[g.day] ??= []).push(g) // del más viejo al más nuevo
  const last = shelf[0]

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

      <div className="home-section">
        <div className="last-recording">
          {last ? (
            <VhsTape id={last.titleId} title={last.title} year={last.year} state="recorded" view="cover" />
          ) : (
            <VhsTape id="vacia" state="blank" view="cover" />
          )}
          <div>
            <p className="eyebrow">Mi videoteca</p>
            <h2>
              {shelf.length} {shelf.length === 1 ? 'cinta grabada' : 'cintas grabadas'}
            </h2>
            <p className="muted">
              {last ? `Última grabación: ${last.title}.` : 'Cada canción que adivinás graba una cinta en tu estante.'}
            </p>
          </div>
        </div>
        {openDays.length > 0 ? (
          <Shelf
            days={openDays}
            daySizes={daySizes}
            recordedByDay={recordedByDay}
            lockedFrom={openDays.length + 1}
            lockedTo={totalDays}
            onOpen={openTape}
          />
        ) : (
          <p className="muted">El calendario todavía no empezó.</p>
        )}
      </div>

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

      {opened && (
        <TapeDialog tape={opened.tape} origin={opened.origin} onClose={closeTape} onDelete={handleDeleteGuess} />
      )}
    </section>
  )
}
