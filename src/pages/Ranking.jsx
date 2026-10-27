import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
        <p className="muted">Cargando ranking…</p>
      ) : error ? (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      ) : !rows.length ? (
        <p className="muted">Todavía nadie entró al ranking. ¡Sé el primero!</p>
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
