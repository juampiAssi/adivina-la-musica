import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Inicio' },
  { to: '/jugar', label: 'Jugar' },
  { to: '/ranking', label: 'Ranking' },
  { to: '/perfil', label: 'Perfil' },
]

// NavLink agrega la clase "active" al enlace de la página actual.
export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand">
          🎵 Adiviná la música
        </NavLink>
        <nav className="nav-links" aria-label="Navegación principal">
          {links.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/'}>
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
