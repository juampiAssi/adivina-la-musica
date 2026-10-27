import { tapeLook } from '../../utils/tapeLook.js'

// Cinta VHS dibujada solo con CSS (sin imágenes). Dos vistas:
//  - view="spine": el lomo, como se ve en el estante.
//  - view="cover": la carátula, para el popup.
// state: "recorded" (adivinada, muestra título) o "blank" (negra, sin datos).
// id: se usa para elegir de forma determinista colores y pequeñas variaciones.
// colorScheme (opcional): fuerza una de las 5 combinaciones (0..4).
export default function VhsTape({ id, title = '', year, state = 'blank', view = 'spine', colorScheme }) {
  const look = tapeLook(id)
  const scheme = colorScheme ?? look.scheme
  const recorded = state === 'recorded'
  const classes = `vhs vhs--s${scheme} ${recorded ? 'is-recorded' : 'is-blank'}`

  if (view === 'cover') {
    return (
      <div className={`${classes} vhs-cover`}>
        <div className="vhs-cover__stripes" aria-hidden="true" />
        <div className="vhs-cover__label">
          <p className="vhs-tech">
            HIGH QUALITY TAPE · <span className="nowrap">T-120</span>
          </p>
          {recorded ? (
            <>
              <p className="vhs-cover__title">{title}</p>
              {year && <p className="vhs-tech">{year}</p>}
            </>
          ) : (
            <p className="vhs-cover__empty">Sin grabar</p>
          )}
        </div>
        <div className="vhs-cover__foot">
          <span className="vhs-logo">VHS</span>
          <span className="vhs-tech">VIDEO CASSETTE</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`${classes} vhs-spine`}
      style={{ '--h-step': look.heightStep, '--w-step': look.widthStep, '--tilt': `${look.tilt}deg` }}
    >
      <span className="vhs-spine__tech" aria-hidden="true">
        T-120
      </span>
      <span className="vhs-spine__stripes" aria-hidden="true" />
      <span className="vhs-spine__label">{recorded && <span className="vhs-spine__title">{title}</span>}</span>
      <span className="vhs-logo" aria-hidden="true">
        VHS
      </span>
    </div>
  )
}
