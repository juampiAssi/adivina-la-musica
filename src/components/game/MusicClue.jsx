import { useAudioClip } from '../../hooks/useAudioClip.js'
import { CLUES } from '../../utils/scoring.js'
import TrackReveal from './TrackReveal.jsx'
import YouTubeReveal from './YouTubeReveal.jsx'

// Pista de tipo "music": el audio sale del fragmento de 30 s de Deezer y se corta
// según el nivel de pista actual (3 s, 6 s o 10 s). Al terminar la ronda
// (finished) se muestra el video de YouTube o, si no hay, la portada del tema.
export default function MusicClue({ question, level, finished }) {
  const { ready, playing, track, error, playClip } = useAudioClip(question.deezerTrackId)
  const { seconds } = CLUES[level]

  if (finished) {
    return (
      <div className="clue">
        {question.youtubeId ? (
          <YouTubeReveal youtubeId={question.youtubeId} startSeconds={question.startSeconds} title={question.title} />
        ) : (
          <TrackReveal track={track} />
        )}
      </div>
    )
  }

  return (
    <div className="clue">
      <div className={`audio-visual ${playing ? 'is-playing' : ''}`} aria-hidden="true">
        {playing ? '♪ ♪ ♪' : '🎧'}
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
          onClick={() => playClip(question.deezerStartSeconds ?? 0, seconds)}
        >
          {!ready ? 'Cargando canción…' : playing ? 'Sonando…' : `▶ Escuchar ${seconds} segundos`}
        </button>
      )}
    </div>
  )
}
