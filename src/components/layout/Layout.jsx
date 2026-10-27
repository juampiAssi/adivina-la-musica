import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import StatusMessage from '../ui/StatusMessage.jsx'
import Navbar from './Navbar.jsx'

// Estructura común a todas las pantallas: barra de anuncio, navegación y contenido.
// <Outlet /> es el lugar donde se dibuja la página de la ruta actual.
export default function Layout() {
  const { pathname } = useLocation()
  const { loading, error } = useAuth()
  return (
    <>
      <div className="announce">Películas · Series · Videojuegos</div>
      <Navbar />
      {/* key: al cambiar de página se vuelve a montar y repite la entrada "desde la oscuridad" */}
      <main key={pathname} className="container screen">
        {/* Hasta que no hay sesión no se puede leer Firestore: esperamos o mostramos el error. */}
        {error ? (
          <StatusMessage kind="error" title="No se pudo conectar">
            {error}
          </StatusMessage>
        ) : loading ? (
          <StatusMessage kind="loading" title="Conectando…" />
        ) : (
          <Outlet />
        )}
      </main>
      {/* Atribución obligatoria: TMDB (datos y pósters) y Deezer (audio). */}
      <footer className="site-footer">
        <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer" className="tmdb-logo">
          <img src="/tmdb-logo.svg" alt="TMDB" width="110" height="14" />
        </a>
        <p>
          Audio: fragmentos de 30 s de Deezer. Datos y pósters de películas y series: TMDB. Este producto usa la API de
          TMDB pero no está avalado ni certificado por TMDB.
        </p>
      </footer>
    </>
  )
}
