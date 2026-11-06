// TMDB sirve cada póster en varios tamaños; el popup lo muestra chico, así que
// se pide el de 342 px en lugar del de 500 px (y el grande solo en pantallas densas).
export function posterAt(url, width) {
  return url.replace('/w500/', `/w${width}/`)
}

// Lo baja por adelantado: al abrir el popup, el póster ya está en la caché del navegador.
export function preloadPoster(url) {
  if (url) new Image().src = posterAt(url, 342)
}
