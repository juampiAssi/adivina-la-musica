import { sampleQuestions } from '../data/sampleQuestions.js'

// Capa de acceso a las preguntas. Por ahora devuelve datos locales, pero es
// asíncrona a propósito: cuando conectemos Firestore solo se cambia este archivo
// y las pantallas no se tocan.
export async function getQuestions(type = 'music') {
  return sampleQuestions.filter((q) => q.type === type)
}
