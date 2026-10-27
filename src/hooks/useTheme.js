import { useCallback, useState } from 'react'

const STORAGE_KEY = 'theme' // solo guarda una preferencia de interfaz, nunca datos del juego

// Tema claro/oscuro. El valor inicial ya lo puso index.html en <html data-theme>;
// acá solo lo leemos y lo cambiamos (y recordamos la elección en localStorage).
export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark')

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark'
      document.documentElement.dataset.theme = next
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // si el navegador bloquea localStorage, el tema igual cambia en esta visita
      }
      return next
    })
  }, [])

  return { theme, toggleTheme }
}
