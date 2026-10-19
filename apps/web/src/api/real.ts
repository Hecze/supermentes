// Implementación real: llama al backend en /api/*. Cada endpoint devuelve los tipos de types.ts.
import type { Api } from './types'

// El backend responde { error } con un mensaje para el docente; si no hay, uno genérico.
async function leer<T>(res: Response): Promise<T> {
  if (res.ok) return res.json() as Promise<T>
  const cuerpo = (await res.json().catch(() => null)) as { error?: string } | null
  if (cuerpo?.error) throw new Error(cuerpo.error)
  // Sin mensaje propio (la función no cargó o Vercel la cortó por tiempo): se dice el código para poder rastrearlo.
  throw new Error(res.status === 504 ? 'La IA tardó demasiado en responder. Vuelve a intentarlo.' : `No pudimos conectar con Supermentes (error ${res.status}). Vuelve a intentarlo.`)
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
    // Sin internet o sin respuesta, fetch falla con un mensaje en inglés ("Failed to fetch").
    if (e instanceof TypeError) throw new Error('No pudimos conectar con Supermentes. Revisa tu internet y vuelve a intentarlo.')
    throw e
  }
}

const post = <T,>(ruta: string, cuerpo: unknown, limite?: number) =>
  pedir<T>(ruta, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) }, limite)

export const realApi: Api = {
  prepararFicha: (entrada) => post('ficha', entrada),
  generarJuego: (ficha) => post('juego', { ficha }),
  // La sesión es el texto más largo que se genera: tiene un poco más de tiempo.
  generarSesion: (ficha, opciones) => post('sesion', { ficha, opciones }, 150_000),
  async biblioteca() {
    return pedir('biblioteca', {})
  },
  buscarRecursos: (ficha) =>
    pedir(`recursos?${new URLSearchParams({ tema: ficha.titulo, grado: ficha.grado, area: ficha.area })}`, {}, 20_000),
}
