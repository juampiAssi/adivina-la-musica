import { useState } from 'react'
import { isValidYoutubeId } from '../../utils/youtube.js'

// Al terminar la ronda se muestra el video de YouTube completo y visible (sin taparlo),
// como "revelación" de la respuesta. El reproductor pesa mucho, así que primero va la
// miniatura y recién se carga si el jugador toca play.
export default function YouTubeReveal({ youtubeId, startSeconds = 0, title }) {
  const [playing, setPlaying] = useState(false)
  if (!isValidYoutubeId(youtubeId)) return null
  return (
    <div className="reveal-frame">
      {playing ? (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?start=${startSeconds}&rel=0&autoplay=1`}
          title={`Video de ${title}`}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button type="button" className="reveal-facade" aria-label={`Reproducir el video de ${title}`} onClick={() => setPlaying(true)}>
          <img src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`} alt="" decoding="async" />
          <span aria-hidden="true">▶</span>
        </button>
      )}
    </div>
  )
}
