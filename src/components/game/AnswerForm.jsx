import { useState } from 'react'

// Campo de respuesta con validación básica (no se acepta vacío).
export default function AnswerForm({ onSubmit, onSkip, canSkip }) {
  const [value, setValue] = useState('')
  const [validation, setValidation] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!value.trim()) {
      setValidation('Escribí una respuesta antes de enviar.')
      return
    }
    setValidation('')
    onSubmit(value)
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className="answer-form" noValidate>
      <label htmlFor="answer">¿De qué película o serie es?</label>
      <input
        id="answer"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Escribí tu respuesta"
        autoComplete="off"
      />
      {validation && (
        <p className="alert alert-error" role="alert">
          {validation}
        </p>
      )}
      <div className="row">
        <button type="submit" className="btn btn-primary">
          Responder
        </button>
        <button type="button" className="btn" onClick={onSkip} disabled={!canSkip}>
          Siguiente pista
        </button>
      </div>
    </form>
  )
}
