import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import answerNames from '../data/answer-names.json'
import GameBoard from '../components/game/GameBoard.jsx'
import HowToPlay from '../components/game/HowToPlay.jsx'
import StatusMessage from '../components/ui/StatusMessage.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { getGameConfig } from '../services/configService.js'
import { getMyGuesses, saveGuess } from '../services/guessesService.js'
import { preloadTrack } from '../services/deezerService.js'
import { getMyEntry, saveMyEntry, totalsFrom } from '../services/leaderboardService.js'
import { getTitlesForDay } from '../services/titlesService.js'
import { buildAnswerOptions } from '../utils/answers.js'
import { currentDay, isLate, TOTAL_DAYS, unlockAtFor } from '../utils/calendar.js'
import { toUserMessage } from '../utils/firebaseErrors.js'

// Las reglas comparan contra la hora del servidor: si rechazan algo que debería
// andar, lo más probable es que el reloj de la compu esté corrido.
const CLOCK_HINT = 'Revisá que la fecha y la hora de tu compu o celular sean correctas.'

// Juego por día: cada día tiene 10 títulos. Los días pasados se pueden jugar
// con la mitad de puntos ("ponte al día"). Cada jugada se guarda en Firestore.
export default function Play() {
  const { user } = useAuth()
  const [today, setToday] = useState(null)
  const [startDate, setStartDate] = useState(null)
  const [day, setDay] = useState(null)
  const [titles, setTitles] = useState([])
  const [guesses, setGuesses] = useState([]) // jugadas guardadas del jugador (todas)
  const [started, setStarted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  // Jugada recién terminada: { title, data, saved }. Mientras existe se muestra su resultado.
  const [finished, setFinished] = useState(null)

  // Sugerencias del autocompletado: todos los nombres posibles (no revela cuáles son del día).
  const answerOptions = useMemo(() => buildAnswerOptions(answerNames), [])

  // 1) Configuración (fecha de inicio) y jugadas del jugador.
  useEffect(() => {
    Promise.all([getGameConfig(), getMyGuesses(user.uid)])
      .then(([config, myGuesses]) => {
        const start = config.startDate.toDate()
        const n = currentDay(start)
        setStartDate(start)
        setToday(n)
        // Cuando pasan los días cargados, abre en el último en vez de uno vacío.
        setDay(n >= 1 ? Math.min(n, TOTAL_DAYS) : null)
        setGuesses(myGuesses)
        if (n < 1) setLoading(false)
      })
      .catch((err) => {
        setError(
          err.code === 'not-found'
            ? 'El juego todavía no está configurado (falta la fecha de inicio).'
            : toUserMessage(err, 'No se pudo cargar el juego.'),
        )
        setLoading(false)
      })
  }, [user.uid])

  // 2) Títulos del día elegido.
  useEffect(() => {
    if (!day) return
    let cancelled = false
    getTitlesForDay(day, unlockAtFor(startDate, day))
      .then((list) => !cancelled && setTitles(list))
      .catch((err) => {
        if (cancelled) return
        setError(
          err.code === 'permission-denied'
            ? `Este día todavía no abrió. ${CLOCK_HINT}`
            : toUserMessage(err, 'No se pudieron cargar las canciones del día.'),
        )
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [day, startDate])

  function chooseDay(n) {
    if (n === day) return
    setLoading(true)
    setError('')
    setStarted(false)
    setTitles([])
    setDay(n)
  }

  const playedIds = new Set(guesses.map((g) => g.titleId))
  const pending = titles.filter((t) => !playedIds.has(t.id))
  const current = pending[0]
  const nextTrackId = pending[1]?.deezerTrackId
  const shown = finished?.title ?? current // la canción que está en pantalla

  // Adelanta el audio de esta canción y de la siguiente, para que no haya que esperarlo.
  useEffect(() => {
    preloadTrack(current?.deezerTrackId)
    preloadTrack(nextTrackId)
  }, [current?.deezerTrackId, nextTrackId])

  const late = shown ? isLate(shown.unlockAt.toDate()) : false
  const dayGuesses = guesses.filter((g) => g.day === day)
  // Incluye la jugada recién guardada, que se suma a la lista al pasar a la siguiente.
  const dayPoints = dayGuesses.reduce((sum, g) => sum + g.points, 0) + (finished?.saved ? finished.data.points : 0)

  // Guarda la jugada y, si el jugador ya tiene apodo, actualiza su fila del ranking.
  async function persist(title, data) {
    setSaveError('')
    try {
      await saveGuess(user.uid, title, data)
      setFinished({ title, data, saved: true })
      const updated = [...guesses, { ...data, titleId: title.id, day: title.day }]
      const entry = await getMyEntry(user.uid)
      if (entry) await saveMyEntry(user.uid, { nickname: entry.nickname, ...totalsFrom(updated) })
    } catch (err) {
      const reason = err.code === 'permission-denied' ? CLOCK_HINT : toUserMessage(err, 'No se pudo guardar tu jugada.')
      setSaveError(`${reason} Tocá el botón para reintentar.`)
    }
  }

  function handleFinish(outcome) {
    const data = { secondsUsed: outcome.secondsUsed, points: outcome.points, late, solved: outcome.correct }
    setFinished({ title: current, data, saved: false })
    persist(current, data)
  }

  // "Siguiente": si no se pudo guardar, reintenta; si ya se guardó, pasa a la próxima.
  function handleNext() {
    if (!finished.saved) {
      persist(finished.title, finished.data)
      return
    }
    setGuesses((prev) => [...prev, { ...finished.data, titleId: finished.title.id, day: finished.title.day }])
    setFinished(null)
  }

  if (error)
    return (
      <StatusMessage kind="error" title="No se pudo cargar el juego">
        {error}
      </StatusMessage>
    )
  if (today !== null && today < 1)
    return <StatusMessage kind="empty" title="El juego todavía no empezó">¡Volvé pronto!</StatusMessage>

  const lastDay = Math.min(today ?? 0, TOTAL_DAYS)
  const days = Array.from({ length: lastDay }, (_, i) => lastDay - i)

  return (
    <section>
      <div className="play-header">
        <div>
          <p className="eyebrow">Popurrí · {day === today ? 'Hoy' : `Ponte al día · mitad de puntos`}</p>
          <h1>Día {day ?? '…'}</h1>
        </div>
        <span className="score-pill">{dayPoints} pts</span>
      </div>

      {days.length > 1 && (
        <ol className="clue-steps day-picker" aria-label="Elegir día">
          {days.map((n) => (
            <li key={n} className={n === day ? 'is-current' : ''}>
              <button type="button" onClick={() => chooseDay(n)}>
                {n === today ? 'Hoy' : `Día ${n}`}
              </button>
            </li>
          ))}
        </ol>
      )}

      {today > TOTAL_DAYS && (
        <p className="alert alert-info">Ya se abrieron todos los días. Podés jugar cualquiera con la mitad de puntos.</p>
      )}

      {saveError && <p className="alert alert-error" role="alert">{saveError}</p>}

      {loading ? (
        <StatusMessage kind="loading" title="Cargando canciones…" />
      ) : !titles.length ? (
        <StatusMessage kind="empty" title="No hay canciones para este día" />
      ) : !shown ? (
        <div className="card summary screen">
          <p className="eyebrow">Día completo</p>
          <h2>Ya jugaste las {titles.length} canciones de este día</h2>
          <p className="muted">Sumaste {dayPoints} puntos. Mirá tus aciertos en el estante.</p>
          <Link to="/perfil" className="btn">
            Ir a mi estante
          </Link>
        </div>
      ) : !started ? (
        <div className="screen">
          <HowToPlay total={pending.length} late={late} onStart={() => setStarted(true)} />
        </div>
      ) : (
        <>
          <div className="progress" aria-hidden="true">
            <span style={{ width: `${(dayGuesses.length / titles.length) * 100}%` }} />
          </div>
          <GameBoard
            key={shown.id}
            question={shown}
            answerOptions={answerOptions}
            late={late}
            onFinish={handleFinish}
            onNext={handleNext}
            isLast={pending.length <= 1}
          />
        </>
      )}
    </section>
  )
}
