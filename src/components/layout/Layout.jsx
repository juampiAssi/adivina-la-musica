import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'

// Estructura común a todas las pantallas: barra de navegación + contenido.
// <Outlet /> es el lugar donde se dibuja la página de la ruta actual.
export default function Layout() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Outlet />
      </main>
    </>
  )
}
