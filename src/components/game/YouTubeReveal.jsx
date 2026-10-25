import { isValidYoutubeId } from '../../utils/youtube.js'

// Al terminar la ronda se muestra el video de YouTube completo y visible
// (sin taparlo), como "revelación" de la respuesta.
export default function YouTubeReveal({ youtubeId, startSeconds = 0, title }) {
  if (!isValidYoutubeId(youtubeId)) return null
  return (
    <div className="reveal-frame">
      <iframe
        src={`https://www.youtube.com/embed/${youtubeId}?start=${startSeconds}&rel=0`}
        title={`Video de ${title}`}
        allow="encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}
