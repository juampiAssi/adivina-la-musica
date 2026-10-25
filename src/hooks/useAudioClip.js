import { useCallback, useEffect, useRef, useState } from 'react'
import { getDeezerTrack } from '../services/deezerService.js'

// Busca el fragmento de Deezer y permite reproducir un recorte:
// playClip(segundoDeInicio, duraciónEnSegundos).
// Se usa con un trackId fijo: al cambiar de pregunta, GameBoard se vuelve a
// montar (por su "key") y el hook arranca de cero.
export function useAudioClip(trackId) {
  const audioRef = useRef(null)
  const timerRef = useRef(null)
  const pendingRef = useRef(null) // segundos a reproducir cuando arranque el audio
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState(null)
  const [track, setTrack] = useState(null) // datos del tema (para la revelación)
  const missingTrack = !trackId

  useEffect(() => {
    if (missingTrack) return
    let cancelled = false
    const audio = new Audio()
    audio.preload = 'auto'
    audioRef.current = audio

    const onPlaying = () => {
      setPlaying(true)
      // Recién cuando el audio suena (ya cargado) empezamos a contar.
      if (pendingRef.current) {
        const seconds = pendingRef.current
        pendingRef.current = null
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => audio.pause(), seconds * 1000)
      }
    }
    const onPause = () => setPlaying(false)
    const onError = () => {
      if (!cancelled) setError('No se pudo reproducir el fragmento de audio.')
    }
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('error', onError)

    getDeezerTrack(trackId)
      .then(({ previewUrl, ...info }) => {
        if (cancelled) return
        setTrack(info)
        audio.src = previewUrl
        setReady(true)
      })
      .catch(() => {
        if (!cancelled) setError('No se pudo obtener la canción. Revisá tu conexión o probá otra pregunta.')
      })

    return () => {
      cancelled = true
      clearTimeout(timerRef.current)
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('error', onError)
      audio.pause()
      audioRef.current = null
    }
  }, [trackId, missingTrack])

  const playClip = useCallback((startSeconds, seconds) => {
    const audio = audioRef.current
    if (!audio) return
    clearTimeout(timerRef.current)
    audio.pause() // así el próximo play siempre dispara el evento "playing"
    pendingRef.current = seconds
    audio.currentTime = startSeconds
    audio.play().catch(() => setError('El navegador no permitió reproducir el audio.'))
  }, [])

  return {
    ready,
    playing,
    track,
    error: missingTrack ? 'Esta pregunta no tiene una canción asignada.' : error,
    playClip,
  }
}
