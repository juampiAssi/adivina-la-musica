import { useEffect, useMemo, useState } from 'react'
import GameBoard from '../components/game/GameBoard.jsx'
import GameSummary from '../components/game/GameSummary.jsx'
import HowToPlay from '../components/game/HowToPlay.jsx'
import { getQuestions } from '../services/questionsService.js'
import { buildAnswerOptions } from '../utils/answers.js'
import { buildRound } from '../utils/round.js'

// Fases de la pantalla: "intro" (instrucciones) → "playing" → "done" (resumen).
export default function Play() {
  const [allQuestions, setAllQuestions] = useState([])
  const [questions, setQuestions] = useState([]) // las de esta partida, en el orden en que se juegan
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState([])
  const [phase, setPhase] = useState('intro')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Carga las preguntas una vez al entrar a la pantalla.
  useEffect(() => {
    getQuestions('music')
      .then((list) => {
        setAllQuestions(list)
        setQuestions(buildRound(list))
      })
      .catch(() => setError('No se pudieron cargar las preguntas. Intentá de nuevo más tarde.'))
      .finally(() => setLoading(false))
  }, [])

  function handleFinish(outcome) {
    setResults((prev) => [...prev, outcome])
  }

  // Pasa a la canción siguiente; si no quedan, muestra el resumen.
  function handleNext() {
    if (index + 1 < questions.length) {
      setIndex(index + 1)
    } else {
      setPhase('done')
    }
  }

  function handleRestart() {
    setQuestions(buildRound(allQuestions))
    setIndex(0)
    setResults([])
    setPhase('intro')
  }

  // Sugerencias del autocompletado: todas las respuestas posibles, no solo las de la partida.
  const answerOptions = useMemo(() => buildAnswerOptions(allQuestions), [allQuestions])

  if (loading) return <p>Cargando preguntas…</p>
  if (error) return <p className="alert alert-error" role="alert">{error}</p>
  if (!questions.length) return <p>Todavía no hay preguntas cargadas.</p>

  const current = questions[index]
  const points = results.reduce((sum, r) => sum + r.points, 0)

  return (
    <section>
      <h1>Jugar</h1>
      {phase === 'intro' && <HowToPlay total={questions.length} onStart={() => setPhase('playing')} />}
      {phase === 'playing' && (
        <>
          <p className="muted">
            Canción {index + 1} de {questions.length} · {points} puntos
          </p>
          {/* key: al cambiar de pregunta se reinicia todo el estado del tablero */}
          <GameBoard
            key={current.id}
            question={current}
            answerOptions={answerOptions}
            onFinish={handleFinish}
            onNext={handleNext}
            isLast={index === questions.length - 1}
          />
        </>
      )}
      {phase === 'done' && <GameSummary results={results} onRestart={handleRestart} />}
    </section>
  )
}
