import { useCallback, useEffect, useRef, useState } from 'react'
import { getDeezerTrack } from '../services/deezerService.js'
import { SONG_SECONDS } from '../utils/scoring.js'

const TICK_MS = 200 // cada cuánto se actualiza el contador

// Reproduce el fragmento de Deezer de corrido. El tiempo sale del propio audio
// (currentTime), así el contador no avanza si la canción se frena para cargar.
// Se usa con un trackId fijo: al cambiar de pregunta, GameBoard se vuelve a
// montar (por su "key") y el hook arranca de cero.
export function useSongPlayer(trackId, startSeconds = 0) {
  const audioRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [ended, setEnded] = useState(false)
  const [seconds, setSeconds] = useState(0) // segundos enteros escuchados
  const [error, setError] = useState(null)
  const [track, setTrack] = useState(null) // datos del tema (para la revelación)
  const missingTrack = !trackId

  useEffect(() => {
    if (missingTrack) return
    let cancelled = false
    const audio = new Audio()
    audio.preload = 'auto'
    audioRef.current = audio

    const finishSong = () => {
      audio.pause()
      setSeconds(SONG_SECONDS)
      setEnded(true)
    }
    const onPlaying = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onError = () => {
      if (!cancelled) setError('No se pudo reproducir el fragmento de audio.')
    }
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', finishSong)
    audio.addEventListener('error', onError)

    // Corta a los 30 s aunque el fragmento sea más largo.
    const timer = setInterval(() => {
      if (audio.paused) return
      const heard = audio.currentTime - startSeconds
      if (heard >= SONG_SECONDS) finishSong()
      else setSeconds(Math.floor(heard))
    }, TICK_MS)

    getDeezerTrack(trackId)
      .then(({ previewUrl, ...info }) => {
        if (cancelled) return
        setTrack(info)
        audio.src = previewUrl
        audio.currentTime = startSeconds
        setReady(true)
      })
      .catch(() => {
        if (!cancelled) setError('No se pudo obtener la canción. Revisá tu conexión o salteala.')
      })

    return () => {
      cancelled = true
      clearInterval(timer)
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', finishSong)
      audio.removeEventListener('error', onError)
      audio.pause()
      audioRef.current = null
    }
  }, [trackId, missingTrack, startSeconds])

  // Arranca o sigue desde donde quedó. Tiene que llamarse desde un click:
  // los navegadores no dejan reproducir audio sin un gesto del usuario.
  const play = useCallback(() => {
    audioRef.current?.play().catch(() => setError('El navegador no permitió reproducir el audio.'))
  }, [])

  const pause = useCallback(() => audioRef.current?.pause(), [])

  return {
    ready,
    playing,
    ended,
    seconds,
    track,
    error: missingTrack ? 'Esta pregunta no tiene una canción asignada.' : error,
    play,
    pause,
  }
}
