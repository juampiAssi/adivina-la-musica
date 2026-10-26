// Pantalla final, cuando ya se jugaron todas las canciones.
export default function GameSummary({ results, onRestart }) {
  const total = results.length
  const guessed = results.filter((r) => r.correct).length
  const points = results.reduce((sum, r) => sum + r.points, 0)
  const skipped = results.filter((r) => r.skipped).length
  const perfect = guessed === total

  return (
    <div className="card summary sunset palms vignette">
      <p className="eyebrow">{perfect ? 'Partida perfecta' : 'Partida terminada'}</p>
      <h2 className="answer-title pop">
        {perfect ? '¡Muy bien! Adivinaste todas las canciones' : '¡Terminaste la partida!'}
      </h2>
      <ul className="tiles">
        <li className="tile">
          <strong>
            {guessed}/{total}
          </strong>
          <span>Adivinadas</span>
        </li>
        <li className="tile">
          <strong>{points}</strong>
          <span>Puntos</span>
        </li>
        <li className="tile">
          <strong>{skipped}</strong>
          <span>Salteadas</span>
        </li>
      </ul>
      <button type="button" className="btn" onClick={onRestart}>
        Volver a jugar
      </button>
    </div>
  )
}
