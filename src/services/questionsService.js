import seedQuestions from '../../seed/questions.json'

// Capa de acceso a las preguntas. Por ahora lee el archivo seed/questions.json
// (220 temas sacados de la playlist y verificados en Deezer), pero es asíncrona
// a propósito: cuando conectemos Firestore solo se cambia este archivo.
export async function getQuestions(type = 'music') {
  return seedQuestions.filter((q) => q.type === type)
}
