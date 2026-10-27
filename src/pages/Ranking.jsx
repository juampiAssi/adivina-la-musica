import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StatusMessage from '../components/ui/StatusMessage.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { getTopScores, TOP_SIZE } from '../services/leaderboardService.js'
import { toUserMessage } from '../utils/firebaseErrors.js'

// Ranking: los mejores puntajes, leídos de Firestore (solo el top, para gastar pocas lecturas).
export default function Ranking() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getTopScores()
      .then(setRows)
      .catch((err) => setError(toUserMessage(err, 'No se pudo cargar el ranking.')))
      .finally(() => setLoading(false))
  }, [])

  const inTop = rows.some((r) => r.uid === user.uid)

  return (
    <section>
      <p className="eyebrow">Top {TOP_SIZE}</p>
      <h1>Ranking</h1>
      {loading ? (
        <StatusMessage kind="loading" title="Cargando ranking…" />
      ) : error ? (
        <StatusMessage kind="error" title="No se pudo cargar el ranking">
          {error}
        </StatusMessage>
      ) : !rows.length ? (
        <StatusMessage
          kind="empty"
          title="Todavía nadie entró al ranking"
          action={
            <Link to="/perfil" className="btn">
              Elegir mi apodo
            </Link>
          }
        >
          ¡Sé el primero!
        </StatusMessage>
      ) : (
        <ol className="ranking">
          {rows.map((r, i) => (
            <li key={r.uid} className={r.uid === user.uid ? 'is-me' : ''}>
              <span className="ranking-pos">{i + 1}</span>
              <span className="ranking-name">{r.nickname}</span>
              <span className="muted">
                {r.guessesCount} {r.guessesCount === 1 ? 'acierto' : 'aciertos'}
              </span>
              <strong>{r.totalPoints}</strong>
            </li>
          ))}
        </ol>
      )}
      {!loading && !error && !inTop && (
        <p className="muted">
          ¿No aparecés? Elegí un apodo en <Link to="/perfil">tu perfil</Link>.
        </p>
      )}
    </section>
  )
}
