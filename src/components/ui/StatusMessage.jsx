// Mensaje de estado común a todas las pantallas:
//  - kind="loading": cinta girando (carga)
//  - kind="empty":   no hay datos todavía
//  - kind="error":   algo falló (se anuncia a lectores de pantalla con role="alert")
// title: texto principal · children: detalle opcional · action: botón o link opcional
export default function StatusMessage({ kind = 'loading', title, children, action }) {
  return (
    <div className={`status status--${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <span className="status__tape" aria-hidden="true">
        <span className="status__reel" />
        <span className="status__reel" />
      </span>
      <div className="status__text">
        <p className="status__title">{title}</p>
        {children && <p className="muted">{children}</p>}
        {action}
      </div>
    </div>
  )
}
