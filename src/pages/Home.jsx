import { Link } from 'react-router-dom'
import { CLUES } from '../utils/scoring.js'

// Pantalla de inicio tipo "afiche". Los efectos de scroll están en index.css
// (.hero-poster y .on-scroll).
export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-poster sunset palms vignette">
          <p className="eyebrow">Escuchá · Adiviná · Sumá</p>
          <h1>
            Adiviná
            <br />
            la música
          </h1>
          <p>Unos segundos de una canción. ¿De qué película, serie o videojuego es?</p>
          <Link to="/jugar" className="btn btn-primary">
            Jugar ahora
          </Link>
        </div>
        <div className="scroll-cue" aria-hidden="true" />
      </section>

      <section className="home-section">
        <div className="on-scroll">
          <p className="eyebrow">Cómo funciona</p>
          <h2>Cuanto menos escuchás, más sumás</h2>
        </div>
        <ul className="tiles on-scroll">
          {CLUES.map(({ seconds, points }) => (
            <li key={seconds} className="tile">
              <strong>{seconds} seg</strong>
              <span>{points} puntos</span>
            </li>
          ))}
        </ul>
        <p className="muted on-scroll">
          Cada partida tiene 10 canciones elegidas al azar. Si no la reconocés, pedí una pista más larga o
          salteala para ver la respuesta.
        </p>
      </section>

      <section className="home-section">
        <div className="card cta-card on-scroll">
          <p className="eyebrow">¿Listo?</p>
          <h2>Bandas sonoras que conocés de memoria</h2>
          <p className="muted">De Pixar a The Last of Us, pasando por Stranger Things y El Señor de los Anillos.</p>
          <Link to="/jugar" className="btn btn-primary">
            Empezar partida
          </Link>
        </div>
      </section>
    </>
  )
}
