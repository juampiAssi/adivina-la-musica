import { SONG_SECONDS } from '../../utils/scoring.js'
import TrackReveal from './TrackReveal.jsx'
import YouTubeReveal from './YouTubeReveal.jsx'

const EQ_BARS = 9

// Lo que se ve de la canción: la casetera mientras se juega y, al terminar la
// ronda, el video de YouTube o, si no hay, la portada del tema.
// player: lo que devuelve useSongPlayer (la lógica está en GameBoard).
export default function MusicClue({ question, player, finished }) {
  if (finished) {
    return (
      <div className="clue reveal-enter">
        {question.youtubeId ? (
          <YouTubeReveal youtubeId={question.youtubeId} startSeconds={question.startSeconds} title={question.title} />
        ) : (
          <TrackReveal track={player.track} />
        )}
      </div>
    )
  }

  return (
    <div className="clue">
      {/* Casetera (VCR): no muestra nada de la respuesta, solo acompaña al audio */}
      <div className={`vcr ${player.playing ? 'is-playing' : ''}`} aria-hidden="true">
        <div className="vcr__screen">
          <span className="vcr__status">{player.playing ? '▶ PLAY' : player.seconds > 0 ? '❚❚ PAUSA' : '■ STOP'}</span>
          <div className="vcr__eq">
            {Array.from({ length: EQ_BARS }, (_, i) => (
              <span key={i} style={{ '--i': i }} />
            ))}
          </div>
          <span className="vcr__counter">0:{String(player.seconds).padStart(2, '0')}</span>
        </div>
        {/* La ranura de la cinta hace de barra de avance */}
        <div className="vcr__slot">
          <span style={{ width: `${(player.seconds / SONG_SECONDS) * 100}%` }} />
        </div>
      </div>
      {player.error && (
        <p className="alert alert-error" role="alert">
          {player.error}
        </p>
      )}
    </div>
  )
}
