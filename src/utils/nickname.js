// Apodo del ranking: de 3 a 20 caracteres; letras (con tildes y ñ), números,
// espacios, guion, guion bajo y punto. La misma regla está en firestore.rules.
export const NICKNAME_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 ._-]{3,20}$/

export function validateNickname(value) {
  const nickname = value.trim()
  if (nickname.length < 3 || nickname.length > 20) return 'El apodo tiene que tener entre 3 y 20 caracteres.'
  if (!NICKNAME_PATTERN.test(nickname)) return 'Usá solo letras, números, espacios, punto, guion o guion bajo.'
  return ''
}
