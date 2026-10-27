// Aspecto de cada cinta, calculado a partir de un texto (el titleId).
// Es DETERMINISTA: el mismo id da siempre el mismo resultado, así una película
// tiene siempre la misma cinta, en cualquier navegador y en cada recarga.

export const TAPE_SCHEMES = ['rojo', 'azul', 'amarillo', 'verde', 'naranja']

// Hash FNV-1a de 32 bits: convierte un texto en un número entero "mezclado".
// Cambiar una sola letra del texto cambia todo el número.
export function hashString(text) {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0 // a entero sin signo
}

// Del mismo hash sacamos varios valores usando distintos "trozos" de bits
// (>>> desplaza los bits), así cada variación es independiente de las otras.
export function tapeLook(id) {
  const h = hashString(id)
  return {
    scheme: h % TAPE_SCHEMES.length, // 5 combinaciones de franjas
    heightStep: ((h >>> 4) % 5) - 2, // -2..2 → ±8 px de alto
    widthStep: ((h >>> 9) % 3) - 1, // -1..1 → ±2 px de ancho
    // Casi todas derechas; 1 de cada 5 un poco inclinada a cada lado.
    tilt: [0, 0, 0, -0.8, 0.8][(h >>> 13) % 5], // grados
  }
}
