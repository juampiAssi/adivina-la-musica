// Deja el texto en minúsculas, sin tildes, sin signos y con espacios simples,
// para que "Harry Potter!" y "harry   potter" cuenten como la misma respuesta.
export function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Igual que normalize pero sin espacios: así "Spiderman" y "Spider-Man" coinciden.
function compact(text) {
  return normalize(text).replace(/ /g, '')
}

// La respuesta es correcta si coincide con el título o con algún alias.
export function isCorrectAnswer(answer, question) {
  const given = compact(answer)
  if (!given) return false
  const valid = [question.title, ...(question.aliases ?? [])].map(compact)
  return valid.includes(given)
}

// Lista de sugerencias para el autocompletado: una por respuesta (sin repetir),
// pero se puede encontrar escribiendo el título o cualquiera de sus alias.
export function buildAnswerOptions(questions) {
  const byTitle = new Map()
  for (const q of questions) {
    const entry = byTitle.get(q.title) ?? { label: q.title, search: new Set() }
    for (const text of [q.title, ...(q.aliases ?? [])]) entry.search.add(normalize(text))
    byTitle.set(q.title, entry)
  }
  return [...byTitle.values()]
    .map(({ label, search }) => ({ label, search: [...search] }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'))
}

// Filtra las sugerencias según lo que se escribió. Orden de prioridad:
// 1) el título empieza con ese texto, 2) algún alias empieza así,
// 3) alguna palabra empieza así, 4) lo contiene en cualquier parte.
export function filterAnswerOptions(options, text, limit = 6) {
  const query = normalize(text)
  if (!query) return []
  const groups = [[], [], [], []]
  for (const option of options) {
    if (normalize(option.label).startsWith(query)) groups[0].push(option)
    else if (option.search.some((s) => s.startsWith(query))) groups[1].push(option)
    else if (option.search.some((s) => s.includes(' ' + query))) groups[2].push(option)
    else if (option.search.some((s) => s.includes(query))) groups[3].push(option)
  }
  return groups.flat().slice(0, limit)
}
