import { NavLink } from 'react-router-dom'
import { preloadPage } from '../../utils/preload.js'
import ThemeToggle from './ThemeToggle.jsx'

const links = [
  { to: '/', label: 'Inicio' },
  { to: '/jugar', label: 'Jugar' },
  { to: '/ranking', label: 'Ranking' },
  { to: '/perfil', label: 'Perfil' },
]

// NavLink agrega la clase "active" al enlace de la página actual.
// Al acercarse a un enlace ya se adelantan los datos de esa pantalla.
export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand">
          Adiviná la música
        </NavLink>
        <nav className="nav-links" aria-label="Navegación principal">
          {links.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/'} onPointerEnter={() => preloadPage(to)} onFocus={() => preloadPage(to)}>
              {label}
            </NavLink>
          ))}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  )
}
