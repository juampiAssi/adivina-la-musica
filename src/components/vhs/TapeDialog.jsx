import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTitleDetails } from '../../services/titlesService.js'
import { toUserMessage } from '../../utils/firebaseErrors.js'
import { CLUES } from '../../utils/scoring.js'
import VhsTape from './VhsTape.jsx'

const CLOSE_MS = 160 // duración de la animación de cierre (y respaldo si no hay animación)

// Popup de una cinta. Usa <dialog> con showModal(), que ya trae:
//  - Esc para cerrar (evento "cancel"),
//  - fondo oscurecido (::backdrop),
//  - el resto de la página inerte: el foco no puede salir del popup.
// tape: { recorded, guess?, day } · origin: rectángulo del lomo (para la animación)
// onClose(): se llama al terminar de cerrar · onDelete(guess): promesa que borra el acierto
export default function TapeDialog({ tape, origin, onClose, onDelete }) {
  const ref = useRef(null)
  const [closing, setClosing] = useState(false)
  const [details, setDetails] = useState(null)
  const [detailsError, setDetailsError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const guess = tape.guess

  // Al montar: calculamos desde dónde "sale" el popup y lo abrimos como modal.
  useEffect(() => {
    const dialog = ref.current
    if (origin) {
      // Distancia desde el centro de la pantalla hasta el centro del lomo:
      // la animación arranca ahí (achicado) y viaja hasta el centro.
      const dx = origin.left + origin.width / 2 - window.innerWidth / 2
      const dy = origin.top + origin.height / 2 - window.innerHeight / 2
      dialog.style.setProperty('--from-x', `${dx}px`)
      dialog.style.setProperty('--from-y', `${dy}px`)
    }
    dialog.showModal()
  }, [origin])

  // Director y sinopsis: no están en la jugada, se piden al abrir (1 lectura, con caché).
  useEffect(() => {
    if (!tape.recorded) return
    let cancelled = false
    getTitleDetails(guess.titleId)
      .then((data) => !cancelled && setDetails(data))
      .catch((err) => !cancelled && setDetailsError(toUserMessage(err, 'No se pudieron cargar los detalles.')))
    return () => {
      cancelled = true
    }
  }, [tape.recorded, guess?.titleId])

  // Cierre animado: marcamos "closing", esperamos la animación y recién ahí close().
  function requestClose() {
    if (closing) return
    setClosing(true)
    window.setTimeout(() => {
      ref.current?.close()
      onClose()
    }, CLOSE_MS)
  }

  async function handleDelete() {
    if (!window.confirm(`¿Sacar "${guess.title}" de tu estante? Se descuentan sus puntos.`)) return
    setDeleting(true)
    const ok = await onDelete(guess)
    setDeleting(false)
    if (ok) requestClose()
  }

  return (
    <dialog
      ref={ref}
      className={`tape-dialog ${tape.recorded ? '' : 'is-blank'} ${closing ? 'is-closing' : ''}`}
      aria-labelledby="tape-dialog-title"
      // Esc dispara "cancel": lo frenamos para cerrar con animación.
      onCancel={(e) => {
        e.preventDefault()
        requestClose()
      }}
      // Click en el fondo oscuro: el target es el propio <dialog> (no su contenido).
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose()
      }}
    >
      {tape.recorded ? (
        <div className="tape-dialog__body">
          <div className="tape-dialog__poster">
            {guess.posterUrl ? (
              <img src={guess.posterUrl} alt={`Póster de ${guess.title}`} />
            ) : (
              <VhsTape id={guess.titleId} title={guess.title} year={guess.year} state="recorded" view="cover" />
            )}
          </div>
          <div className="tape-dialog__info">
            <p className="eyebrow">Cinta grabada · Día {guess.day}</p>
            <h2 id="tape-dialog-title">{guess.title}</h2>
            <p className="vhs-tech tape-dialog__meta">
              {[guess.year, details?.director && `${details.creditLabel ?? 'Dirección'}: ${details.director}`, details?.genre]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {detailsError ? (
              <p className="alert alert-error">{detailsError}</p>
            ) : details ? (
              details.synopsis && <p className="tape-dialog__synopsis">{details.synopsis}</p>
            ) : (
              <p className="muted">Cargando detalles…</p>
            )}
            <dl className="tape-dialog__stats">
              <div>
                <dt>Pista</dt>
                <dd>{CLUES[(guess.cluesUsed ?? 1) - 1].seconds} s</dd>
              </div>
              <div>
                <dt>Día</dt>
                <dd>{guess.day}</dd>
              </div>
              <div>
                <dt>Puntos</dt>
                <dd>
                  {guess.points}
                  {guess.late && <small> (atrasada)</small>}
                </dd>
              </div>
            </dl>
            <div className="row">
              <button type="button" className="btn btn-primary" onClick={requestClose} autoFocus>
                Cerrar
              </button>
              <button type="button" className="btn btn-ghost" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Sacando…' : 'Sacar del estante'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="tape-dialog__body is-blank">
          <div className="tape-dialog__poster">
            <VhsTape id={`blank-${tape.day}`} state="blank" view="cover" />
          </div>
          <div className="tape-dialog__info">
            <p className="eyebrow">Cinta sin grabar · Día {tape.day}</p>
            <h2 id="tape-dialog-title">Todavía no la adivinaste</h2>
            <p className="muted">Jugá el día {tape.day} para grabar esta cinta.</p>
            <div className="row">
              <Link to="/jugar" className="btn btn-primary">
                Ir a jugar
              </Link>
              <button type="button" className="btn btn-ghost" onClick={requestClose} autoFocus>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </dialog>
  )
}
