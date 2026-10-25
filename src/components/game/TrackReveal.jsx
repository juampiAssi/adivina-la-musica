// Revelación cuando la pregunta no tiene video: portada y nombre del tema (datos de Deezer).
export default function TrackReveal({ track }) {
  if (!track) return null
  return (
    <div className="track-reveal">
      {track.cover && <img src={track.cover} alt="" width="120" height="120" />}
      <div>
        <p className="track-title">{track.trackTitle}</p>
        <p className="muted">{track.artist}</p>
      </div>
    </div>
  )
}
