// Pantalla final, cuando ya se jugaron todas las canciones.
export default function GameSummary({ results, onRestart }) {
  const total = results.length
  const guessed = results.filter((r) => r.correct).length
  const points = results.reduce((sum, r) => sum + r.points, 0)
  const skipped = results.filter((r) => r.skipped).length
  const perfect = guessed === total

  return (
    <div className="card summary">
      <h2>{perfect ? '¡Muy bien! Adivinaste todas las canciones de la partida' : '¡Terminaste la partida!'}</h2>
      <p>
        Adivinaste <strong>{guessed}</strong> de <strong>{total}</strong> y sumaste{' '}
        <strong>{points} puntos</strong>.
      </p>
      {skipped > 0 && (
        <p className="muted">
          Salteaste {skipped} {skipped === 1 ? 'canción' : 'canciones'}.
        </p>
      )}
      <button type="button" className="btn" onClick={onRestart}>
        Volver a jugar
      </button>
    </div>
  )
}
