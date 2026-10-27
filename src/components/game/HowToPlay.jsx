import { CLUES, pointsFor } from '../../utils/scoring.js'

// Instrucciones que se muestran antes de empezar a jugar.
// late: día pasado ("ponte al día"), los puntos valen la mitad.
export default function HowToPlay({ total, late = false, onStart }) {
  return (
    <div className="card">
      <p className="eyebrow">Cómo se juega</p>
      <h2>Escuchá, adiviná, sumá</h2>
      <ol className="steps">
        <li>Tocá <strong>Escuchar</strong> y prestá atención al fragmento de música.</li>
        <li>
          Escribí de qué película, serie o videojuego es y elegí el nombre de la lista. Vale el nombre en
          español o en inglés.
        </li>
        <li>
          Si no la sabés, pedí una pista más larga con <strong>Siguiente pista</strong>. Una respuesta
          incorrecta también te da la pista siguiente.
        </li>
        <li>
          Si no tenés idea, <strong>Saltear canción</strong> te muestra la respuesta, pero no suma puntos.
        </li>
      </ol>
      <ul className="tiles">
        {CLUES.map(({ seconds }, i) => (
          <li key={seconds} className="tile">
            <strong>{pointsFor(i + 1, late)}</strong>
            <span>{seconds} segundos</span>
          </li>
        ))}
      </ul>
      <p className="muted">
        {late && 'Es un día pasado: los puntos valen la mitad. '}
        {total === 1 ? 'Te queda 1 canción.' : `Te quedan ${total} canciones.`} ¡Suerte!
      </p>
      <button type="button" className="btn btn-primary" onClick={onStart}>
        Empezar
      </button>
    </div>
  )
}
