import { useEffect, useState } from 'react'
import { changeStartDate, countTitlesByDay, importTitles } from '../../services/adminService.js'
import { getGameConfig } from '../../services/configService.js'
import { argentinaMidnight, currentDay, toArgentinaIsoDate } from '../../utils/calendar.js'
import { toUserMessage } from '../../utils/firebaseErrors.js'
import { parseTitlesFile, validateTitles } from '../../utils/titleImport.js'

// Lee la fecha de inicio (null si todavía no hay config) y cuántos títulos hay cargados.
async function loadAdminState() {
  const config = await getGameConfig().catch((err) => (err.code === 'not-found' ? null : Promise.reject(err)))
  const counts = await countTitlesByDay()
  return { start: config ? config.startDate.toDate() : null, counts }
}

// Herramientas del admin: estado del juego, fecha de inicio e importador de títulos.
export default function AdminTools() {
  const [startDate, setStartDate] = useState(null) // Date o null si no hay config
  const [stats, setStats] = useState(null) // { total, byDay }
  const [loadError, setLoadError] = useState('')
  const [dateInput, setDateInput] = useState(() => toArgentinaIsoDate(new Date()))
  const [preview, setPreview] = useState(null) // { fileName, titles, errors }
  const [progress, setProgress] = useState('')
  const [notice, setNotice] = useState(null)
  const [busy, setBusy] = useState(false)

  function applyState({ start, counts }) {
    setLoadError('')
    setStartDate(start)
    if (start) setDateInput(toArgentinaIsoDate(start))
    setStats(counts)
  }

  function refresh() {
    return loadAdminState()
      .then(applyState)
      .catch((err) => setLoadError(toUserMessage(err, 'No se pudo leer el estado del juego.')))
  }

  useEffect(() => {
    loadAdminState()
      .then(applyState)
      .catch((err) => setLoadError(toUserMessage(err, 'No se pudo leer el estado del juego.')))
  }, [])

  async function handleSaveDate(e) {
    e.preventDefault()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      setNotice({ type: 'error', text: 'Elegí una fecha válida.' })
      return
    }
    setBusy(true)
    setNotice(null)
    try {
      const updated = await changeStartDate(argentinaMidnight(dateInput), (done, total) =>
        setProgress(`Recalculando desbloqueos: ${done} de ${total}…`),
      )
      setNotice({ type: 'success', text: `Fecha guardada. Se recalcularon ${updated} títulos.` })
      await refresh()
    } catch (err) {
      setNotice({ type: 'error', text: toUserMessage(err, 'No se pudo guardar la fecha.') })
    } finally {
      setBusy(false)
      setProgress('')
    }
  }

  async function handleFile(e) {
    const file = e.target.files?.[0]
    setNotice(null)
    setPreview(null)
    if (!file) return
    try {
      const raw = parseTitlesFile(await file.text(), file.name)
      setPreview({ fileName: file.name, ...validateTitles(raw) })
    } catch (err) {
      setNotice({ type: 'error', text: `No se pudo leer el archivo: ${err.message}` })
    }
  }

  async function handleImport() {
    setBusy(true)
    setNotice(null)
    try {
      await importTitles(preview.titles, startDate, (done, total) => setProgress(`Escribiendo: ${done} de ${total}…`))
      setNotice({ type: 'success', text: `Se importaron ${preview.titles.length} títulos.` })
      setPreview(null)
      await refresh()
    } catch (err) {
      setNotice({ type: 'error', text: toUserMessage(err, 'No se pudo importar.') })
    } finally {
      setBusy(false)
      setProgress('')
    }
  }

  return (
    <div className="profile">
      {loadError && <p className="alert alert-error" role="alert">{loadError}</p>}
      {notice && (
        <p className={`alert alert-${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>
          {notice.text}
        </p>
      )}
      {progress && <p className="alert alert-info">{progress}</p>}

      <div className="card">
        <p className="eyebrow">Estado</p>
        <p>
          Inicio:{' '}
          <strong>{startDate ? `${toArgentinaIsoDate(startDate)} (hoy es el día ${currentDay(startDate)})` : 'sin configurar'}</strong>
        </p>
        <p>
          Títulos cargados: <strong>{stats ? stats.total : '…'}</strong>
          {stats?.total > 0 && (
            <span className="muted">
              {' '}
              ({Object.entries(stats.byDay)
                .sort((a, b) => a[0] - b[0])
                .map(([day, n]) => `día ${day}: ${n}`)
                .join(' · ')})
            </span>
          )}
        </p>
      </div>

      <form className="card answer-form" onSubmit={handleSaveDate} noValidate>
        <p className="eyebrow">Calendario</p>
        <label htmlFor="start-date">Fecha de inicio (día 1, a las 00:00 de Argentina)</label>
        <input id="start-date" type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} />
        <p className="muted">Cambiarla recalcula cuándo se desbloquea cada día. Sirve para la demo o para reiniciar el juego.</p>
        <div className="row">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Guardar fecha
          </button>
        </div>
      </form>

      <div className="card answer-form">
        <p className="eyebrow">Importar títulos</p>
        <label htmlFor="titles-file">Archivo .json (como seed/titles.json) o .csv</label>
        <input id="titles-file" type="file" accept=".json,.csv,application/json,text/csv" onChange={handleFile} disabled={busy} />
        {!startDate && <p className="alert alert-info">Primero guardá la fecha de inicio: se usa para calcular los desbloqueos.</p>}

        {preview && (
          <>
            <p>
              <strong>{preview.fileName}</strong>: {preview.titles.length} títulos válidos
              {preview.errors.length > 0 && `, ${preview.errors.length} con errores`}.
            </p>
            {preview.errors.length > 0 && (
              <ul className="alert alert-error import-errors">
                {preview.errors.slice(0, 20).map((e) => (
                  <li key={e.fila}>
                    Fila {e.fila} ({e.title}): {e.problems.join('; ')}
                  </li>
                ))}
              </ul>
            )}
            <div className="table-wrap">
              <table className="import-table">
                <thead>
                  <tr>
                    <th>Día</th>
                    <th>#</th>
                    <th>Título</th>
                    <th>Tipo</th>
                    <th>Año</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.titles.slice(0, 15).map((t) => (
                    <tr key={t.id}>
                      <td>{t.day}</td>
                      <td>{t.order}</td>
                      <td>{t.title}</td>
                      <td>{t.category}</td>
                      <td>{t.year ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.titles.length > 15 && <p className="muted">…y {preview.titles.length - 15} más.</p>}
            <div className="row">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleImport}
                disabled={busy || !startDate || preview.errors.length > 0 || !preview.titles.length}
              >
                Importar {preview.titles.length} títulos
              </button>
            </div>
            {preview.errors.length > 0 && <p className="muted">Corregí los errores del archivo para poder importar.</p>}
          </>
        )}
      </div>
    </div>
  )
}
