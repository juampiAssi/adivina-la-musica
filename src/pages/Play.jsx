import { useCallback, useEffect, useState } from 'react'
import GameBoard from '../components/game/GameBoard.jsx'
import { getQuestions } from '../services/questionsService.js'

function pickRandom(list, exceptId) {
  const options = list.length > 1 ? list.filter((q) => q.id !== exceptId) : list
  return options[Math.floor(Math.random() * options.length)]
}

export default function Play() {
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [total, setTotal] = useState(0)

  // Carga las preguntas una vez al entrar a la pantalla.
  useEffect(() => {
    getQuestions('music')
      .then((list) => {
        setQuestions(list)
        setCurrent(list.length ? pickRandom(list) : null)
      })
      .catch(() => setError('No se pudieron cargar las preguntas. Intentá de nuevo más tarde.'))
      .finally(() => setLoading(false))
  }, [])

  const handleFinish = useCallback((outcome) => setTotal((t) => t + outcome.points), [])
  const handleNext = () => setCurrent(pickRandom(questions, current?.id))

  if (loading) return <p>Cargando preguntas…</p>
  if (error) return <p className="alert alert-error" role="alert">{error}</p>
  if (!current) return <p>Todavía no hay preguntas cargadas.</p>

  return (
    <section>
      <h1>Jugar</h1>
      <p className="muted">Puntos acumulados en esta sesión: {total}</p>
      {/* key: al cambiar de pregunta se reinicia todo el estado del tablero */}
      <GameBoard key={current.id} question={current} onFinish={handleFinish} onNext={handleNext} />
    </section>
  )
}
