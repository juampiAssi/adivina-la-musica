import { useAudioClip } from '../../hooks/useAudioClip.js'
import { CLUES } from '../../utils/scoring.js'
import TrackReveal from './TrackReveal.jsx'
import YouTubeReveal from './YouTubeReveal.jsx'

const EQ_BARS = 9

// Pista de tipo "music": el audio sale del fragmento de 30 s de Deezer y se corta
// según el nivel de pista actual (3 s, 6 s o 10 s). Al terminar la ronda
// (finished) se muestra el video de YouTube o, si no hay, la portada del tema.
export default function MusicClue({ question, level, finished }) {
  const { ready, playing, track, error, playClip } = useAudioClip(question.deezerTrackId)
  const { seconds } = CLUES[level]

  if (finished) {
    return (
      <div className="clue reveal-enter">
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
      {/* Casetera (VCR): no muestra nada de la respuesta, solo acompaña al audio */}
      <div className={`vcr ${playing ? 'is-playing' : ''}`} aria-hidden="true">
        <div className="vcr__screen">
          <span className="vcr__status">{playing ? '▶ PLAY' : '■ STOP'}</span>
          <div className="vcr__eq">
            {Array.from({ length: EQ_BARS }, (_, i) => (
              <span key={i} style={{ '--i': i }} />
            ))}
          </div>
          <span className="vcr__counter">0:{String(seconds).padStart(2, '0')}</span>
        </div>
        <div className="vcr__slot" />
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
