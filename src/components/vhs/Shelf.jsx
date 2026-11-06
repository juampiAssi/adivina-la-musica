import { preloadPoster } from '../../utils/poster.js'
import VhsTape from './VhsTape.jsx'

// Mueble con un estante por día. Cada fila tiene tantas cintas como títulos tiene
// ese día: primero las grabadas (adivinadas) y el resto negras, sin datos.
// Cada lomo es un <button>: con el mouse o con Tab se "asoma" y con click/Enter
// llama a onOpen(datos, botón) para abrir el popup.
// days: días desbloqueados · daySizes: { día: cantidad } · recordedByDay: { día: [aciertos] }
// lockedFrom/lockedTo: rango de días futuros (cerrados).
const HALF = 5 // en pantallas chicas cada día se parte en 5 + 5

export default function Shelf({ days, daySizes, recordedByDay, lockedFrom, lockedTo, onOpen }) {
  return (
    <div className="mueble">
      {days.map((day) => {
        const recorded = recordedByDay[day] ?? []
        const size = daySizes[day] ?? 10
        const tapes = [
          ...recorded.map((g) => ({ key: g.id, recorded: true, guess: g })),
          ...Array.from({ length: Math.max(size - recorded.length, 0) }, (_, i) => ({ key: `blank-${day}-${i}`, recorded: false, day })),
        ]
        const halves = [tapes.slice(0, HALF), tapes.slice(HALF)]
        return (
          <section key={day} className="shelf-row" aria-label={`Día ${day}: ${recorded.length} de ${size} adivinadas`}>
            <div className="shelf-tapes">
              {halves.map((half, h) => (
                <div key={h} className="shelf-half">
                  {half.map((tape) => (
                    <button
                      key={tape.key}
                      type="button"
                      className={`tape-btn ${tape.recorded ? 'is-recorded' : 'is-blank'}`}
                      aria-label={
                        tape.recorded
                          ? `${tape.guess.title}${tape.guess.year ? ` (${tape.guess.year})` : ''}. Ver detalles`
                          : `Cinta sin grabar del día ${day}`
                      }
                      onPointerEnter={() => preloadPoster(tape.guess?.posterUrl)}
                      onFocus={() => preloadPoster(tape.guess?.posterUrl)}
                      onClick={(e) => onOpen?.(tape, e.currentTarget)}
                    >
                      <VhsTape
                        id={tape.recorded ? tape.guess.titleId : tape.key}
                        title={tape.guess?.title}
                        year={tape.guess?.year}
                        state={tape.recorded ? 'recorded' : 'blank'}
                      />
                      {/* Cartelito que aparece al "asomar" la cinta (hover o foco) */}
                      <span className="tape-flag" aria-hidden="true">
                        {tape.recorded ? (
                          <>
                            <strong>{tape.guess.title}</strong>
                            {tape.guess.year && <span className="vhs-tech">{tape.guess.year}</span>}
                          </>
                        ) : (
                          <span className="vhs-tech">Sin grabar</span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <div className="shelf-plank">
              <span className="shelf-day">DÍA {day}</span>
              <span className="shelf-count">
                {recorded.length}/{size}
              </span>
            </div>
          </section>
        )
      })}
      {lockedFrom <= lockedTo && (
        <div className="shelf-locked">
          <span>
            {lockedFrom === lockedTo ? `DÍA ${lockedFrom}` : `DÍAS ${lockedFrom}–${lockedTo}`} · CERRADO
          </span>
          <span className="vhs-tech">Se abre un estante nuevo cada día</span>
        </div>
      )}
    </div>
  )
}
