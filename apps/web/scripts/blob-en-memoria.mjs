// Vercel Blob de mentira para desarrollo: guarda todo en memoria mientras corre `npm run dev`.
// vite.config.ts lo usa en lugar de @vercel/blob solo para las funciones de juegos que atiende en local.
const tienda = new Map()

export async function put(ruta, cuerpo, opciones = {}) {
  if (tienda.has(ruta) && opciones.allowOverwrite === false) throw new Error(`Ya existe ${ruta}`)
  // Texto como texto y binario (el mp3 de una canción) tal cual: String() lo rompería.
  tienda.set(ruta, { cuerpo: typeof cuerpo === 'string' ? cuerpo : Buffer.from(cuerpo), subido: new Date() })
  return { pathname: ruta, url: `memoria://${ruta}` }
}

export async function get(ruta) {
  const b = tienda.get(ruta)
  if (!b) return null
  return { statusCode: 200, stream: new Blob([b.cuerpo]).stream(), headers: new Headers(), blob: { pathname: ruta } }
}

export async function list({ prefix = '' } = {}) {
  const blobs = [...tienda.entries()].filter(([r]) => r.startsWith(prefix)).map(([r, b]) => ({ pathname: r, uploadedAt: b.subido }))
  return { blobs, hasMore: false, cursor: undefined }
}

export async function del(ruta) {
  tienda.delete(ruta)
}
