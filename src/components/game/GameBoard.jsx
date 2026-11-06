import { useState } from 'react'
import { useSongPlayer } from '../../hooks/useSongPlayer.js'
import { isCorrectAnswer } from '../../utils/answers.js'
import { MAX_ATTEMPTS, pointsAt } from '../../utils/scoring.js'
import AnswerForm from './AnswerForm.jsx'
import MusicClue from './MusicClue.jsx'

const HINT_CATEGORY_AT = 10 // segundo en que se muestra el tipo de contenido
const HINT_YEAR_AT = 20 // segundo en que se muestra el año

const CATEGORY_HINTS = {
  película: 'Es una película',
  serie: 'Es una serie',
  anime: 'Es un anime',
  videojuego: 'Es un videojuego',
}

// Una ronda tiene tres fases:
//  - "ready": la canción está lista y espera el primer click.
//  - "listening": suena de corrido y los puntos van bajando.
//  - "answering": se tocó "¡La sé!": la canción y los puntos se frenan y hay
//    unos segundos para escribir. Si falla, la canción sigue desde donde estaba.
// Cuando termina avisa con onFinish({ points, secondsUsed, attempts, correct, skipped }).
// late: si es un día pasado ("ponte al día"), los puntos valen la mitad.
export default function GameBoard({ question, answerOptions, late = false, onFinish, onNext, isLast }) {
  const player = useSongPlayer(question.deezerTrackId, question.deezerStartSeconds ?? 0)
  const { ended, play, pause } = player
  const [phase, setPhase] = useState('ready')
  const [attempts, setAttempts] = useState(0)
  const [result, setResult] = useState(null) // null mientras se juega
  const [message, setMessage] = useState('')

  const points = pointsAt(player.seconds, late)
  // Si la canción termina sin respuesta, queda la última oportunidad de escribir.
  const answering = phase === 'answering' || (phase === 'listening' && ended)

  function finish(correct, skipped = false) {
    pause()
    const outcome = {
      points: correct ? points : 0,
      secondsUsed: player.seconds,
      attempts: attempts + 1,
      correct,
      skipped,
    }
    setResult(outcome)
    onFinish?.(outcome)
  }

  function handleStart() {
    play()
    setPhase('listening')
  }

  function handleBuzz() {
    pause()
    setMessage('')
    setPhase('answering')
  }

  // Respuesta incorrecta o tiempo agotado: gasta un intento.
  function handleMiss(text) {
    const used = attempts + 1
    if (used >= MAX_ATTEMPTS) {
      finish(false)
      return
    }
    setAttempts(used)
    const left = MAX_ATTEMPTS - used
    setMessage(`${text} ${left === 1 ? 'Te queda 1 intento.' : `Te quedan ${left} intentos.`}`)
    if (!ended) {
      play()
      setPhase('listening')
    }
  }

  function handleAnswer(answer) {
    if (isCorrectAnswer(answer, question)) finish(true)
    else handleMiss('Incorrecto.')
  }

  return (
    <div className="card song-enter">
      {!result && (
        <div className="song-meter">
          <div>
            <p className="eyebrow">Vale ahora</p>
            <strong className="song-points">{points} pts</strong>
          </div>
          <p className="muted">
            Intento {Math.min(attempts + 1, MAX_ATTEMPTS)} de {MAX_ATTEMPTS}
          </p>
        </div>
      )}

      <MusicClue question={question} player={player} finished={Boolean(result)} />

      {!result && (player.seconds >= HINT_CATEGORY_AT || ended) && (
        <ul className="song-hints" aria-live="polite">
          <li>{CATEGORY_HINTS[question.category] ?? 'Pista: mirá la lista de opciones'}</li>
          {(player.seconds >= HINT_YEAR_AT || ended) && question.year && <li>Del año {question.year}</li>}
        </ul>
      )}

      {message && !result && (
        <p className="alert alert-info" role="status">
          {message}
        </p>
      )}

      {result ? (
        <div className="result">
          <p className="eyebrow">La respuesta era</p>
          <h2 className="answer-title pop">{question.title}</h2>
          <p
            className={`alert ${result.correct ? 'alert-success' : result.skipped ? 'alert-info' : 'alert-error'}`}
            role="status"
          >
            {result.correct
              ? `¡Correcto! La sacaste en ${result.secondsUsed} segundos y ganaste ${result.points} puntos.`
              : result.skipped
                ? 'Salteaste esta canción.'
                : 'Se acabaron los intentos.'}
          </p>
          <button type="button" className="btn btn-primary" onClick={onNext}>
            {isLast ? 'Ver resultado' : 'Siguiente canción'}
          </button>
        </div>
      ) : answering ? (
        <AnswerForm
          key={attempts} // cada intento reinicia el campo y la cuenta regresiva
          options={answerOptions}
          onSubmit={handleAnswer}
          onTimeout={() => handleMiss('Se acabó el tiempo.')}
          onGiveUp={() => finish(false, true)}
        />
      ) : (
        <div className="row song-actions">
          {phase === 'ready' ? (
            <button type="button" className="btn btn-primary" disabled={!player.ready} onClick={handleStart}>
              {player.ready ? '▶ Reproducir' : 'Cargando canción…'}
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={handleBuzz} autoFocus>
              ¡La sé!
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={() => finish(false, true)}>
            Saltear canción
          </button>
        </div>
      )}
    </div>
  )
}
