import { useEffect, useState } from 'react'
import { filterAnswerOptions } from '../../utils/answers.js'
import { ANSWER_SECONDS } from '../../utils/scoring.js'

// Campo de respuesta con autocompletado, validación básica (no se acepta vacío)
// y cuenta regresiva. GameBoard lo vuelve a montar en cada intento.
// options: sugerencias armadas con buildAnswerOptions (todas las respuestas posibles).
export default function AnswerForm({ options = [], onSubmit, onTimeout, onGiveUp }) {
  const [value, setValue] = useState('')
  const [validation, setValidation] = useState('')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1) // sugerencia marcada con el teclado
  const [left, setLeft] = useState(ANSWER_SECONDS)

  const suggestions = open ? filterAnswerOptions(options, value) : []

  useEffect(() => {
    const timer = setInterval(() => setLeft((n) => n - 1), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (left <= 0) onTimeout()
    // Solo depende de la cuenta: onTimeout cambia en cada render de GameBoard.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left])

  function submit(answer) {
    if (!answer.trim()) {
      setValidation('Escribí una respuesta antes de enviar.')
      return
    }
    setValidation('')
    setOpen(false)
    onSubmit(answer)
    setValue('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    // Si hay una sugerencia marcada con las flechas, Enter la elige.
    submit(highlighted >= 0 && suggestions[highlighted] ? suggestions[highlighted].label : value)
  }

  function handleChange(e) {
    setValue(e.target.value)
    setOpen(true)
    setHighlighted(-1)
  }

  // Flechas para moverse por la lista y Escape para cerrarla.
  function handleKeyDown(e) {
    if (!suggestions.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="answer-form" noValidate>
      <div className="answer-head">
        <label htmlFor="answer">¿De qué es esta canción?</label>
        <span className="answer-timer" role="timer">
          {Math.max(left, 0)} s
        </span>
      </div>
      <div className="autocomplete">
        <input
          id="answer"
          type="text"
          autoFocus
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={() => setOpen(false)}
          placeholder="Escribí y elegí de la lista"
          autoComplete="off"
          role="combobox"
          aria-expanded={suggestions.length > 0}
          aria-controls="answer-suggestions"
          aria-activedescendant={highlighted >= 0 ? `suggestion-${highlighted}` : undefined}
        />
        {suggestions.length > 0 && (
          <ul id="answer-suggestions" className="suggestions" role="listbox">
            {suggestions.map((option, i) => (
              <li
                key={option.label}
                id={`suggestion-${i}`}
                role="option"
                aria-selected={i === highlighted}
                className={i === highlighted ? 'is-highlighted' : ''}
                // onMouseDown (y no onClick) para que se ejecute antes del onBlur del input.
                onMouseDown={(e) => {
                  e.preventDefault()
                  submit(option.label)
                }}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      {validation && (
        <p className="alert alert-error" role="alert">
          {validation}
        </p>
      )}
      <div className="row">
        <button type="submit" className="btn btn-primary">
          Responder
        </button>
        <button type="button" className="btn btn-ghost" onClick={onGiveUp}>
          Saltear canción
        </button>
      </div>
    </form>
  )
}
