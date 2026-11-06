// Consulta la API pública de Deezer (sin clave) para obtener el fragmento de 30 s
// de un tema. La API no permite CORS, así que usamos JSONP: se agrega un <script>
// cuya respuesta llama a una función global que definimos nosotros.
import { cached } from './cache.js'

let counter = 0
const TRACK_TTL_MS = 10 * 60 * 1000 // los enlaces de los fragmentos vencen a los 15 minutos

// Busca el tema una sola vez: si ya se adelantó, la canción aparece lista al instante.
export function getDeezerTrack(trackId) {
  return cached(`deezer:${trackId}`, () => requestTrack(trackId), TRACK_TTL_MS)
}

// Adelanta los datos y el audio de un tema, para que después suene sin esperar.
// Es solo una ayuda: si falla, la pantalla de juego lo vuelve a pedir y muestra el error.
export function preloadTrack(trackId) {
  if (!trackId) return
  getDeezerTrack(trackId)
    .then(({ previewUrl }) => {
      const audio = new Audio()
      audio.preload = 'auto'
      audio.src = previewUrl
    })
    .catch(() => {})
}

function requestTrack(trackId) {
  return new Promise((resolve, reject) => {
    const callbackName = `deezerCallback_${Date.now()}_${counter++}`
    const script = document.createElement('script')
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error('timeout'))
    }, 8000)

    function cleanup() {
      clearTimeout(timer)
      delete window[callbackName]
      script.remove()
    }

    window[callbackName] = (data) => {
      cleanup()
      if (data.error || !data.preview) {
        reject(new Error('not-found'))
      } else {
        // Las URLs de preview vencen a los pocos minutos: se piden al momento de jugar.
        resolve({
          previewUrl: data.preview,
          trackTitle: data.title,
          artist: data.artist?.name,
          cover: data.album?.cover_medium,
        })
      }
    }
    script.onerror = () => {
      cleanup()
      reject(new Error('network'))
    }
    script.src = `https://api.deezer.com/track/${encodeURIComponent(trackId)}?output=jsonp&callback=${callbackName}`
    document.body.appendChild(script)
  })
}
