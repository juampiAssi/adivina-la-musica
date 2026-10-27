import { useTheme } from '../../hooks/useTheme.js'

// Botón para cambiar entre tema claro y oscuro.
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const next = theme === 'dark' ? 'claro' : 'oscuro'
  return (
    <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label={`Cambiar a tema ${next}`} title={`Tema ${next}`}>
      <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
    </button>
  )
}
