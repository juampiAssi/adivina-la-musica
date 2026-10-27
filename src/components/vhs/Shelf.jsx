import VhsTape from './VhsTape.jsx'

// Mueble con un estante por día. Cada fila tiene tantas cintas como títulos tiene
// ese día: primero las grabadas (adivinadas) y el resto negras, sin datos.
// days: números de los días desbloqueados. daySizes: { día: cantidad }.
// recordedByDay: { día: [jugadas acertadas] }. lockedFrom/lockedTo: días futuros.
export default function Shelf({ days, daySizes, recordedByDay, lockedFrom, lockedTo }) {
  return (
    <div className="mueble">
      {days.map((day) => {
        const recorded = recordedByDay[day] ?? []
        const size = daySizes[day] ?? 10
        const blanks = Math.max(size - recorded.length, 0)
        return (
          <div key={day} className="shelf-row">
            <div className="shelf-tapes" role="list" aria-label={`Día ${day}: ${recorded.length} de ${size} adivinadas`}>
              {recorded.map((g) => (
                <div key={g.id} role="listitem">
                  <VhsTape id={g.titleId} title={g.title} year={g.year} state="recorded" />
                </div>
              ))}
              {Array.from({ length: blanks }, (_, i) => (
                <div key={`blank-${i}`} role="listitem" aria-label="Sin grabar">
                  <VhsTape id={`blank-${day}-${i}`} state="blank" />
                </div>
              ))}
            </div>
            <div className="shelf-plank">
              <span className="shelf-day">DÍA {day}</span>
              <span className="shelf-count">
                {recorded.length}/{size}
              </span>
            </div>
          </div>
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
