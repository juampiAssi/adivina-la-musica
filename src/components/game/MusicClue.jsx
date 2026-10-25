import { useYouTubePlayer } from '../../hooks/useYouTubePlayer.js'
import { CLUES } from '../../utils/scoring.js'

// Pista de tipo "music": reproductor de YouTube que corta el fragmento
// según el nivel de pista actual (3 s, 6 s o 10 s).
export default function MusicClue({ question, level }) {
  const { containerRef, ready, playing, error, playClip } = useYouTubePlayer(question.youtubeId)
  const { seconds } = CLUES[level]

  return (
    <div className="clue">
      {/* El hook agrega el iframe de YouTube dentro de este div.
          La capa borrosa va por delante para que no se vea el título ni la portada.
          OJO: las políticas de YouTube prohíben tapar el reproductor (ver BITACORA). */}
      <div className="player-frame" ref={containerRef}>
        <div className="player-blur" aria-hidden="true">
          <span>{playing ? '♪ ♪ ♪' : '🎧'}</span>
        </div>
      </div>
      {error ? (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      ) : (
        <button
          type="button"
          className="btn btn-primary"
          disabled={!ready || playing}
          onClick={() => playClip(question.startSeconds, seconds)}
        >
          {!ready ? 'Cargando reproductor…' : playing ? 'Sonando…' : `▶ Escuchar ${seconds} segundos`}
        </button>
      )}
    </div>
  )
}
