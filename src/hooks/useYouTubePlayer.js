import { useCallback, useEffect, useRef, useState } from 'react'
import { isValidYoutubeId } from '../utils/youtube.js'

// Carga el script de la IFrame Player API una sola vez para toda la app.
let apiPromise
function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (!apiPromise) {
    apiPromise = new Promise((resolve, reject) => {
      window.onYouTubeIframeAPIReady = () => resolve(window.YT)
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.onerror = () => {
        apiPromise = undefined // permite reintentar
        reject(new Error('api'))
      }
      document.head.appendChild(script)
    })
  }
  return apiPromise
}

// Códigos de error documentados de la IFrame Player API.
function errorMessage(code) {
  if (code === 101 || code === 150) {
    return 'Este video no permite reproducirse fuera de YouTube. Probá con otra pregunta.'
  }
  if (code === 100) return 'El video no existe o es privado.'
  if (code === 2) return 'El identificador del video no es válido.'
  return 'No se pudo reproducir el video.'
}

// Crea un reproductor de YouTube dentro de containerRef y permite
// reproducir un fragmento: playClip(segundoDeInicio, duraciónEnSegundos).
// Se usa con un videoId fijo: al cambiar de pregunta, GameBoard se vuelve a
// montar (por su "key") y el hook arranca de cero.
export function useYouTubePlayer(videoId) {
  const containerRef = useRef(null)
  const playerRef = useRef(null)
  const timerRef = useRef(null)
  const pendingRef = useRef(null) // fragmento que espera a que empiece la reproducción
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState(null)
  // Un id mal escrito se detecta sin llamar a YouTube.
  const invalidId = !isValidYoutubeId(videoId)

  useEffect(() => {
    if (invalidId) return
    let cancelled = false
    // YT.Player reemplaza el nodo que recibe, así que le damos uno propio
    // para no pelear con el DOM que maneja React.
    const target = document.createElement('div')
    containerRef.current.appendChild(target)

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return
        playerRef.current = new YT.Player(target, {
          videoId,
          width: '100%',
          height: '100%',
          playerVars: { controls: 0, disablekb: 1, playsinline: 1, rel: 0 },
          events: {
            onReady: () => setReady(true),
            onError: (e) => setError(errorMessage(e.data)),
            onStateChange: (e) => {
              setPlaying(e.data === YT.PlayerState.PLAYING)
              // Recién cuando el video arranca (ya sin buffering) empezamos a contar.
              if (e.data === YT.PlayerState.PLAYING && pendingRef.current) {
                const { seconds } = pendingRef.current
                pendingRef.current = null
                clearTimeout(timerRef.current)
                timerRef.current = setTimeout(() => playerRef.current?.pauseVideo(), seconds * 1000)
              }
            },
          },
        })
      })
      .catch(() => {
        if (!cancelled) setError('No se pudo cargar el reproductor de YouTube. Revisá tu conexión.')
      })

    return () => {
      cancelled = true
      clearTimeout(timerRef.current)
      pendingRef.current = null
      playerRef.current?.destroy()
      playerRef.current = null
      target.remove()
    }
  }, [videoId, invalidId])

  const playClip = useCallback((startSeconds, seconds) => {
    const player = playerRef.current
    if (!player) return
    clearTimeout(timerRef.current)
    player.pauseVideo() // así el próximo playVideo siempre dispara el evento PLAYING
    pendingRef.current = { seconds }
    player.seekTo(startSeconds, true)
    player.playVideo()
  }, [])

  return { containerRef, ready, playing, error: invalidId ? errorMessage(2) : error, playClip }
}
