import { lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import FreePlay from './pages/FreePlay.jsx'
import Home from './pages/Home.jsx'
import ModeSelect from './pages/ModeSelect.jsx'
import NotFound from './pages/NotFound.jsx'
import Play from './pages/Play.jsx'
import Profile from './pages/Profile.jsx'
import Ranking from './pages/Ranking.jsx'

// Solo el panel admin va en un archivo aparte: los jugadores nunca lo usan.
const Admin = lazy(() => import('./pages/Admin.jsx'))

// Tabla de rutas: cada URL muestra una página dentro del Layout común.
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/jugar" element={<ModeSelect />} />
        <Route path="/jugar/popurri" element={<Play />} />
        <Route path="/jugar/contenido/:slug" element={<FreePlay />} />
        <Route path="/jugar/tranqui" element={<FreePlay />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
