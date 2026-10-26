import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar.jsx'

// Estructura común a todas las pantallas: barra de anuncio, navegación y contenido.
// <Outlet /> es el lugar donde se dibuja la página de la ruta actual.
export default function Layout() {
  const { pathname } = useLocation()
  return (
    <>
      <div className="announce">Películas · Series · Videojuegos</div>
      <Navbar />
      {/* key: al cambiar de página se vuelve a montar y repite la entrada "desde la oscuridad" */}
      <main key={pathname} className="container screen">
        <Outlet />
      </main>
    </>
  )
}
