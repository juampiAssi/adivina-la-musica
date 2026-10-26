import { useState } from 'react'
import { isCorrectAnswer } from '../../utils/answers.js'
import { CLUES, MAX_LEVEL } from '../../utils/scoring.js'
import AnswerForm from './AnswerForm.jsx'
import MusicClue from './MusicClue.jsx'

// Qué componente dibuja la pista según el tipo de pregunta.
// En V3 se agrega acá, por ejemplo: cover: CoverClue
const clueByType = { music: MusicClue }

// Lógica del juego, independiente del tipo de pista: nivel actual, intentos y puntos.
// Cuando termina la ronda avisa con onFinish({ points, attempts, correct, skipped }).
export default function GameBoard({ question, answerOptions, onFinish, onNext, isLast }) {
  const [level, setLevel] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [result, setResult] = useState(null) // null mientras se juega
  const [message, setMessage] = useState('')

  const Clue = clueByType[question.type]

  function finish(correct, skipped = false) {
    const points = correct ? CLUES[level].points : 0
    const outcome = { points, attempts: attempts + (correct ? 1 : 0), correct, skipped }
    setResult(outcome)
    onFinish?.(outcome)
  }

  function handleAnswer(answer) {
    if (isCorrectAnswer(answer, question)) {
      finish(true)
      return
    }
    setAttempts((n) => n + 1)
    if (level < MAX_LEVEL) {
      setLevel(level + 1)
      setMessage('Incorrecto. Desbloqueaste una pista más larga, pero vale menos puntos.')
    } else {
      finish(false)
    }
  }

  function handleNextClue() {
    setMessage('')
    setLevel(level + 1)
  }

  // Saltear: termina la ronda sin puntos y muestra la respuesta.
  function handleGiveUp() {
    finish(false, true)
  }

  if (!Clue) {
    return <p className="alert alert-error">Tipo de pregunta no soportado: {question.type}</p>
  }

  return (
    <div className="card song-enter">
      {!result && (
        <ol className="clue-steps" aria-label="Pistas">
          {CLUES.map(({ seconds, points }, i) => (
            <li key={seconds} className={i === level ? 'is-current' : i < level ? 'is-used' : ''}>
              {seconds} seg · {points}
            </li>
          ))}
        </ol>
      )}
      <Clue question={question} level={level} finished={Boolean(result)} />
      {message && !result && <p className="alert alert-info">{message}</p>}

      {result ? (
        <div className="result">
          <p className="eyebrow">La respuesta era</p>
          <h2 className="answer-title pop">{question.title}</h2>
          <p
            className={`alert ${result.correct ? 'alert-success' : result.skipped ? 'alert-info' : 'alert-error'}`}
            role="status"
          >
            {result.correct
              ? `¡Correcto! Ganaste ${result.points} puntos.`
              : result.skipped
                ? 'Salteaste esta canción.'
                : 'Se acabaron las pistas.'}
          </p>
          <button type="button" className="btn btn-primary" onClick={onNext}>
            {isLast ? 'Ver resultado' : 'Siguiente canción'}
          </button>
        </div>
      ) : (
        <AnswerForm
          options={answerOptions}
          onSubmit={handleAnswer}
          onNextClue={handleNextClue}
          canNextClue={level < MAX_LEVEL}
          onGiveUp={handleGiveUp}
        />
      )}
    </div>
  )
}
