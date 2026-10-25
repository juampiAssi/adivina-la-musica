// Un id de video de YouTube tiene exactamente 11 caracteres: letras, números, _ o -.
const ID_REGEX = /^[\w-]{11}$/

export function isValidYoutubeId(id) {
  return ID_REGEX.test(id ?? '')
}

// Acepta un id suelto o un link (watch?v=, youtu.be/, embed/, shorts/)
// y devuelve el id, o null si no se puede extraer.
export function extractYoutubeId(input) {
  const text = (input ?? '').trim()
  if (isValidYoutubeId(text)) return text
  const match = text.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/)
  return match ? match[1] : null
}
