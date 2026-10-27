// Traduce los códigos de error de Firebase a mensajes para mostrar en pantalla.
const MESSAGES = {
  'permission-denied': 'No tenés permiso para hacer esto.',
  unavailable: 'No hay conexión con el servidor. Probá de nuevo en un rato.',
  'resource-exhausted': 'Se alcanzó el límite de uso gratuito de hoy. Probá más tarde.',
  'not-found': 'No se encontró el dato pedido.',
  'already-exists': 'Ese dato ya existe.',
  'failed-precondition': 'Falta configurar algo en la base de datos (por ejemplo, un índice).',
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/invalid-email': 'El correo no tiene un formato válido.',
  'auth/too-many-requests': 'Demasiados intentos. Esperá unos minutos.',
  'auth/network-request-failed': 'No hay conexión. Revisá tu internet.',
}

export function toUserMessage(error, fallback = 'Ocurrió un error inesperado.') {
  return MESSAGES[error?.code] ?? fallback
}
