import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import GameBoard from '../components/game/GameBoard.jsx'
import StatusMessage from '../components/ui/StatusMessage.jsx'
import { preloadTrack } from '../services/deezerService.js'
import { getAllTitles } from '../services/titlesService.js'
import { buildAnswerOptions } from '../utils/answers.js'
import { toUserMessage } from '../utils/firebaseErrors.js'
import { contentTypeBySlug, pickChoices, ROUND_SIZE, shuffle } from '../utils/modes.js'

// Modos libres: "Por contenido" (con :slug) y "Tranqui" (sin :slug, con 4 opciones).
// Usan todo el catálogo y no guardan nada: los puntos duran hasta terminar la partida.
export default function FreePlay() {
  const { slug } = useParams()
  const type = slug ? contentTypeBySlug(slug) : null
  const relaxed = !slug // Tranqui
  const [pool, setPool] = useState(null)
  const [error, setError] = useState('')
  const [round, setRound] = useState(0) // cuántas partidas se empezaron: cambia las canciones
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [hits, setHits] = useState(0)

  useEffect(() => {
    let cancelled = false
    getAllTitles()
      .then((titles) => !cancelled && setPool(titles))
      .catch((err) => !cancelled && setError(toUserMessage(err, 'No se pudieron cargar las canciones.')))
    return () => {
      cancelled = true
    }
  }, [])

  const candidates = useMemo(
    () => (pool && type ? pool.filter((t) => t.category === type.category) : pool),
    [pool, type],
  )
  // round no se usa en la cuenta: está para volver a mezclar en cada partida nueva.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const queue = useMemo(() => (candidates ? shuffle(candidates).slice(0, ROUND_SIZE) : []), [candidates, round])
  const answerOptions = useMemo(() => buildAnswerOptions(candidates ?? []), [candidates])

  const current = queue[index]
  const nextTrackId = queue[index + 1]?.deezerTrackId
  // Las opciones se calculan por canción, no en cada render: si no, cambiarían mientras suena.
  const choices = useMemo(() => (relaxed && current ? pickChoices(current, pool) : null), [relaxed, current, pool])

  useEffect(() => {
    preloadTrack(current?.deezerTrackId)
    preloadTrack(nextTrackId)
  }, [current?.deezerTrackId, nextTrackId])

  function handleFinish({ correct, points }) {
    if (!correct) return
    setHits((n) => n + 1)
    setScore((n) => n + points)
  }

  function playAgain() {
    setRound((n) => n + 1)
    setIndex(0)
    setScore(0)
    setHits(0)
  }

  const name = relaxed ? 'Tranqui' : type?.label

  if (!relaxed && !type) {
    return (
      <StatusMessage
        kind="empty"
        title="Ese modo no existe"
        action={
          <Link to="/jugar" className="btn">
            Elegir otro juego
          </Link>
        }
      />
    )
  }
  if (error) {
    return (
      <StatusMessage kind="error" title="No se pudo cargar el juego">
        {error}
      </StatusMessage>
    )
  }
  if (!pool) return <StatusMessage kind="loading" title="Cargando canciones…" />
  if (!queue.length) {
    return (
      <StatusMessage
        kind="empty"
        title={`Todavía no hay canciones de ${name}`}
        action={
          <Link to="/jugar" className="btn">
            Elegir otro juego
          </Link>
        }
      />
    )
  }

  return (
    <section>
      <div className="play-header">
        <div>
          <p className="eyebrow">{relaxed ? 'Elegí entre 4 opciones' : 'Por contenido'}</p>
          <h1>{name}</h1>
        </div>
        <span className="score-pill">{score} pts</span>
      </div>

      {current ? (
        <>
          <div className="progress" aria-hidden="true">
            <span style={{ width: `${(index / queue.length) * 100}%` }} />
          </div>
          <p className="muted free-count">
            Canción {index + 1} de {queue.length}
          </p>
          <GameBoard
            key={`${round}-${current.id}`}
            question={current}
            answerOptions={answerOptions}
            choices={choices}
            showCategoryHint={relaxed}
            onFinish={handleFinish}
            onNext={() => setIndex((n) => n + 1)}
            isLast={index === queue.length - 1}
          />
        </>
      ) : (
        <div className="card summary screen">
          <p className="eyebrow">Partida terminada</p>
          <h2>
            {hits} de {queue.length} aciertos
          </h2>
          <p className="muted">Sumaste {score} puntos. Los modos libres no cuentan para el ranking.</p>
          <div className="row">
            <button type="button" className="btn btn-primary" onClick={playAgain}>
              Jugar otra
            </button>
            <Link to="/jugar" className="btn">
              Cambiar de juego
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}
