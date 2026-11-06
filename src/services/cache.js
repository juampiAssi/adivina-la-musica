// Caché en memoria: evita repetir consultas mientras la pestaña está abierta, así
// volver a una pantalla es instantáneo y se gastan menos lecturas de Firestore.
// Vive solo en la memoria de la página: se borra al recargar y no guarda nada en
// el navegador. Si una consulta falla, no queda guardada y se reintenta.
const store = new Map() // clave → { promise, expires }

export function cached(key, load, ttlMs = Infinity) {
  const hit = store.get(key)
  if (hit && hit.expires > Date.now()) return hit.promise
  const promise = load().catch((err) => {
    store.delete(key)
    throw err
  })
  store.set(key, { promise, expires: Date.now() + ttlMs })
  return promise
}

// Cambia un dato ya guardado sin volver a leerlo. Si no estaba en memoria, no hace nada.
export function patchCached(key, update) {
  const hit = store.get(key)
  if (hit) hit.promise = hit.promise.then(update)
}

// Olvida todas las claves que empiezan con ese prefijo.
export function invalidate(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key)
  }
}
