import { Link } from 'react-router-dom'
import VhsTape from '../components/vhs/VhsTape.jsx'
import { preloadPage } from '../utils/preload.js'
import { CLUES } from '../utils/scoring.js'

// Cintas decorativas del inicio: textos genéricos (no son títulos reales, no adelantan nada).
const HERO_TAPES = [
  { title: '3 segundos', scheme: 0 },
  { title: 'Banda sonora', scheme: 1 },
  { title: '6 segundos', scheme: 2 },
  { blank: true },
  { title: '10 segundos', scheme: 3 },
  { title: '¿De qué es?', scheme: 4 },
  { blank: true },
]

// Pantalla de inicio. Los efectos de scroll están en index.css (.hero-card y .on-scroll).
export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-card">
          <div className="hero-copy">
            <p className="eyebrow">Videoclub de bandas sonoras</p>
            <h1>
              Adiviná
              <br />
              la música
            </h1>
            <p>Unos segundos de una canción. ¿De qué película, serie o videojuego es?</p>
            <Link to="/jugar" className="btn btn-primary" onPointerEnter={() => preloadPage('/jugar')}>
              Jugar ahora
            </Link>
          </div>
          <div className="hero-tapes" aria-hidden="true">
            {HERO_TAPES.map((t, i) => (
              <VhsTape
                key={i}
                id={`hero-${i}`}
                title={t.title}
                state={t.blank ? 'blank' : 'recorded'}
                colorScheme={t.blank ? undefined : t.scheme}
              />
            ))}
          </div>
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
          Cada día hay 10 canciones nuevas. Si te perdiste algún día, lo podés jugar después por la mitad de
          puntos.
        </p>
      </section>

      <section className="home-section">
        <div className="card cta-card on-scroll">
          <p className="eyebrow">¿Listo?</p>
          <h2>Bandas sonoras que conocés de memoria</h2>
          <p className="muted">De Pixar a The Last of Us, pasando por Stranger Things y El Señor de los Anillos.</p>
          <Link to="/jugar" className="btn btn-primary" onPointerEnter={() => preloadPage('/jugar')}>
            Empezar partida
          </Link>
        </div>
      </section>
    </>
  )
}
