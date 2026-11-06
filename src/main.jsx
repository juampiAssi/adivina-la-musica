import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/tokens.css'
import './index.css'
import './styles/vhs.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

// Si se publicó una versión nueva con la pestaña abierta, los archivos viejos de las
// pantallas ya no existen: recargar trae los nuevos en vez de dejar la página en blanco.
window.addEventListener('vite:preloadError', () => window.location.reload())

// BrowserRouter habilita la navegación por URL en toda la app.
// AuthProvider abre la sesión (anónima o de admin) y la comparte con todas las pantallas.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
