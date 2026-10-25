// DATOS TEMPORALES (paso 2). Se reemplazan por Cloud Firestore en el paso de Firebase.
// youtubeId: lo que va después de "v=" en el link. startSeconds: dónde empieza el fragmento.
export const sampleQuestions = [
  {
    id: 'demo-1',
    title: 'Buscando a Nemo',
    aliases: ['Finding Nemo', 'Nemo'],
    youtubeId: 'sKljOD5B71k', // Thomas Newman - "Nemo Egg (Main Title)"
    startSeconds: 0,
    type: 'music',
    difficulty: 'medium',
  },
  {
    id: 'demo-2',
    title: 'Piratas del Caribe',
    aliases: ['Pirates of the Caribbean', 'Piratas del Caribe: La maldición del Perla Negra'],
    youtubeId: 'JZeNYaTmVP4', // Hans Zimmer - "Jack Sparrow"
    startSeconds: 0,
    type: 'music',
    difficulty: 'easy',
  },
  {
    id: 'demo-3',
    title: 'Skyfall',
    aliases: ['007 Skyfall', 'Operación Skyfall'],
    youtubeId: 'DeumyOzKqgI', // Adele - "Skyfall" (Official Lyric Video)
    startSeconds: 0,
    type: 'music',
    difficulty: 'easy',
  },
  {
    id: 'demo-4',
    title: 'Marty Supreme',
    aliases: [],
    youtubeId: 'hFrmzMBlCAg', // Daniel Lopatin - "The Call"
    startSeconds: 0,
    type: 'music',
    difficulty: 'hard',
  },
]
