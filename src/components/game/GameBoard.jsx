import { useState } from 'react'
import { isCorrectAnswer } from '../../utils/answers.js'
import { CLUES, MAX_LEVEL } from '../../utils/scoring.js'
import AnswerForm from './AnswerForm.jsx'
import MusicClue from './MusicClue.jsx'

// Qué componente dibuja la pista según el tipo de pregunta.
// En V3 se agrega acá, por ejemplo: cover: CoverClue
const clueByType = { music: MusicClue }

// Lógica del juego, independiente del tipo de pista: nivel actual, intentos y puntos.
// Cuando termina la ronda avisa con onFinish({ points, attempts, correct }).
export default function GameBoard({ question, onFinish, onNext }) {
  const [level, setLevel] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [result, setResult] = useState(null) // null mientras se juega
  const [message, setMessage] = useState('')

  const Clue = clueByType[question.type]

  function finish(correct) {
    const points = correct ? CLUES[level].points : 0
    const outcome = { points, attempts: attempts + (correct ? 1 : 0), correct }
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

  function handleSkip() {
    setMessage('')
    setLevel(level + 1)
  }

  if (!Clue) {
    return <p className="alert alert-error">Tipo de pregunta no soportado: {question.type}</p>
  }

  return (
    <div className="card">
      <p className="muted">
        Pista {level + 1} de {CLUES.length} · vale {CLUES[level].points} puntos
      </p>
      <Clue question={question} level={level} />
      {message && !result && <p className="alert alert-info">{message}</p>}

      {result ? (
        <div className="result">
          <p className={`alert ${result.correct ? 'alert-success' : 'alert-error'}`} role="status">
            {result.correct ? `¡Correcto! Ganaste ${result.points} puntos.` : 'Se acabaron las pistas.'}{' '}
            La respuesta era <strong>{question.title}</strong>.
          </p>
          <button type="button" className="btn btn-primary" onClick={onNext}>
            Siguiente canción
          </button>
        </div>
      ) : (
        <AnswerForm onSubmit={handleAnswer} onSkip={handleSkip} canSkip={level < MAX_LEVEL} />
      )}
    </div>
  )
}
