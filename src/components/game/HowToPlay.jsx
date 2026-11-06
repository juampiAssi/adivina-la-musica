import { ANSWER_SECONDS, MAX_ATTEMPTS, POINT_EXAMPLES, pointsAt, SONG_SECONDS } from '../../utils/scoring.js'

// Instrucciones que se muestran antes de empezar a jugar.
// late: día pasado ("ponte al día"), los puntos valen la mitad.
export default function HowToPlay({ total, late = false, onStart }) {
  return (
    <div className="card">
      <p className="eyebrow">Cómo se juega</p>
      <h2>Escuchá, adiviná, sumá</h2>
      <ol className="steps">
        <li>
          Tocá <strong>Reproducir</strong>: la canción suena de corrido hasta {SONG_SECONDS} segundos y los puntos van
          bajando.
        </li>
        <li>
          Cuando la reconozcas, tocá <strong>¡La sé!</strong>. La canción y los puntos se frenan, y tenés{' '}
          {ANSWER_SECONDS} segundos para escribir y elegir el nombre de la lista.
        </li>
        <li>
          Tenés {MAX_ATTEMPTS} intentos. Si fallás, la canción sigue desde donde estaba. A los 10 segundos te decimos el
          tipo de contenido y a los 20, el año.
        </li>
        <li>
          Si no tenés idea, <strong>Saltear canción</strong> te muestra la respuesta, pero no suma puntos.
        </li>
      </ol>
      <ul className="tiles">
        {POINT_EXAMPLES.map((seconds) => (
          <li key={seconds} className="tile">
            <strong>{pointsAt(seconds, late)}</strong>
            <span>a los {seconds} seg</span>
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
