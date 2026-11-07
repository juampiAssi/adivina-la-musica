// Modos de juego libres (fuera del calendario). Popurrí es el juego del día y tiene
// su propia pantalla; estos modos no guardan nada: no suman al ranking ni al estante.
export const ROUND_SIZE = 10
export const CHOICES = 4

// slug: lo que va en la URL · category: el valor guardado en cada título.
export const CONTENT_TYPES = [
  { slug: 'peliculas', category: 'película', label: 'Películas' },
  { slug: 'series', category: 'serie', label: 'Series' },
  { slug: 'anime', category: 'anime', label: 'Anime' },
  { slug: 'videojuegos', category: 'videojuego', label: 'Videojuegos' },
]

export function contentTypeBySlug(slug) {
  return CONTENT_TYPES.find((type) => type.slug === slug) ?? null
}

// Mezcla sin cambiar la lista original (algoritmo de Fisher-Yates).
export function shuffle(list, random = Math.random) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// Las opciones de Tranqui: la correcta y otras del mismo tipo de contenido.
// Si no alcanzan, completa con títulos de otros tipos.
export function pickChoices(title, pool, random = Math.random) {
  const others = shuffle(pool.filter((t) => t.title !== title.title), random)
  const sameType = others.filter((t) => t.category === title.category)
  const otherType = others.filter((t) => t.category !== title.category)
  const wrong = [...new Set([...sameType, ...otherType].map((t) => t.title))].slice(0, CHOICES - 1)
  return shuffle([title.title, ...wrong], random)
}
