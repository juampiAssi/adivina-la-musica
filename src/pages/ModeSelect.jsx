import { Link } from 'react-router-dom'
import { CONTENT_TYPES } from '../utils/modes.js'
import { preloadPage } from '../utils/preload.js'

// Primera pantalla de "Jugar": elegir a qué jugar.
export default function ModeSelect() {
  return (
    <section className="modes">
      <div>
        <p className="eyebrow">Elegí tu juego</p>
        <h1>¿A qué jugamos?</h1>
      </div>

      <Link to="/jugar/popurri" className="card mode-card" onPointerEnter={() => preloadPage('/jugar/popurri')}>
        <p className="eyebrow">El juego del día</p>
        <h2>Popurrí</h2>
        <p className="muted">Las mismas canciones para todos. Suma al ranking y graba cintas en tu estante.</p>
      </Link>

      <div className="card mode-card">
        <p className="eyebrow">Práctica libre</p>
        <h2>Por contenido</h2>
        <p className="muted">10 canciones al azar de lo que más te guste. No suma al ranking.</p>
        <div className="row">
          {CONTENT_TYPES.map(({ slug, label }) => (
            <Link key={slug} to={`/jugar/contenido/${slug}`} className="btn">
              {label}
            </Link>
          ))}
        </div>
      </div>

      <Link to="/jugar/tranqui" className="card mode-card">
        <p className="eyebrow">Sin escribir</p>
        <h2>Tranqui</h2>
        <p className="muted">Elegís entre 4 opciones. Ideal para empezar. No suma al ranking.</p>
      </Link>
    </section>
  )
}
