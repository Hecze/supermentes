// Implementación real: llama al backend en /api/*. Cada endpoint devuelve los tipos de types.ts.
import type { Api } from './types'

// El backend responde { error } con un mensaje para el docente; si no hay, uno genérico.
async function leer<T>(res: Response): Promise<T> {
  if (res.ok) return res.json() as Promise<T>
  const cuerpo = (await res.json().catch(() => null)) as { error?: string } | null
  throw new Error(cuerpo?.error ?? 'No pudimos conectar con Supermentes. Vuelve a intentarlo.')
}

// Vercel acepta hasta 4,5 MB por pedido y una foto de celular suele pasarlo: se achica a 1600 px en JPEG.
async function achicar(archivo: File): Promise<File> {
  if (!archivo.type.startsWith('image/') || archivo.size < 1_500_000) return archivo
  const imagen = await createImageBitmap(archivo)
  const escala = Math.min(1, 1600 / Math.max(imagen.width, imagen.height))
  const lienzo = document.createElement('canvas')
  lienzo.width = Math.round(imagen.width * escala)
  lienzo.height = Math.round(imagen.height * escala)
  lienzo.getContext('2d')!.drawImage(imagen, 0, 0, lienzo.width, lienzo.height)
  const blob = await new Promise<Blob | null>((r) => lienzo.toBlob(r, 'image/jpeg', 0.85))
  return blob ? new File([blob], archivo.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }) : archivo
}

// La IA no puede dejar al docente esperando para siempre: pasado este tiempo se avisa y se puede reintentar.
const LIMITE_MS = 90_000

async function pedir<T>(ruta: string, init: RequestInit, limite = LIMITE_MS): Promise<T> {
  try {
    return leer<T>(await fetch(`/api/${ruta}`, { ...init, signal: AbortSignal.timeout(limite) }))
  } catch (e) {
    if (e instanceof DOMException && (e.name === 'TimeoutError' || e.name === 'AbortError')) {
      throw new Error('La IA está tardando demasiado. Vuelve a intentarlo en un momento.')
    }
    throw e
  }
}

const post = <T,>(ruta: string, cuerpo: unknown, limite?: number) =>
  pedir<T>(ruta, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) }, limite)

export const realApi: Api = {
  prepararFicha: (entrada) => post('ficha', entrada),
  generarCancion: (ficha, opciones) => post('cancion', { ficha, opciones }),
  generarAudio: (cancion) => post('audio', { cancion }),
  async adaptarExamen(ficha, { examen, ...opciones }) {
    const datos = new FormData()
    datos.set('ficha', JSON.stringify(ficha))
    datos.set('opciones', JSON.stringify(opciones))
    datos.set('examen', await achicar(examen))
    return pedir('examen', { method: 'POST', body: datos })
  },
  generarJuego: (ficha) => post('juego', { ficha }),
  // La sesión es el texto más largo que se genera: tiene un poco más de tiempo.
  generarSesion: (ficha, opciones) => post('sesion', { ficha, opciones }, 150_000),
  async biblioteca() {
    return pedir('biblioteca', {})
  },
}
