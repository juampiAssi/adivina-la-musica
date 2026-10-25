// Deja el texto en minúsculas, sin tildes, sin signos y con espacios simples,
// para que "Harry Potter!" y "harry   potter" cuenten como la misma respuesta.
export function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// La respuesta es correcta si coincide con el título o con algún alias.
export function isCorrectAnswer(answer, question) {
  const given = normalize(answer)
  if (!given) return false
  const valid = [question.title, ...(question.aliases ?? [])].map(normalize)
  return valid.includes(given)
}
