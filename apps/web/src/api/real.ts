// Implementación real: llama al backend en /api/*. Cada endpoint devuelve los tipos de types.ts.
import type { Api } from './types'

async function post<T>(ruta: string, cuerpo: unknown): Promise<T> {
  const res = await fetch(`/api/${ruta}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  })
  if (!res.ok) throw new Error(`El servidor respondió ${res.status} en /api/${ruta}`)
  return res.json() as Promise<T>
}

export const realApi: Api = {
  async prepararFicha(entrada) {
    const datos = new FormData()
    datos.set('tipo', entrada.tipo)
    datos.set('gradoId', entrada.gradoId)
    datos.set('areaId', entrada.areaId)
    datos.set('grado', entrada.grado)
    datos.set('area', entrada.area)
    if (entrada.duracion) datos.set('duracion', entrada.duracion)
    if (entrada.texto) datos.set('texto', entrada.texto)
    if (entrada.archivo) datos.set('archivo', entrada.archivo)
    const res = await fetch('/api/ficha', { method: 'POST', body: datos })
    if (!res.ok) throw new Error(`El servidor respondió ${res.status} en /api/ficha`)
    return res.json()
  },
  generarCancion: (ficha, opciones) => post('cancion', { ficha, opciones }),
  generarAudio: (cancion) => post('audio', { cancion }),
  async generarExamen(ficha, { examenPropio, ...opciones }) {
    if (!examenPropio) return post('examen', { ficha, opciones })
    const datos = new FormData()
    datos.set('ficha', JSON.stringify(ficha))
    datos.set('opciones', JSON.stringify(opciones))
    datos.set('examen', examenPropio)
    const res = await fetch('/api/examen', { method: 'POST', body: datos })
    if (!res.ok) throw new Error(`El servidor respondió ${res.status} en /api/examen`)
    return res.json()
  },
  generarIlustraciones: (examen) => post('ilustraciones', { examen }),
  generarJuego: (ficha) => post('juego', { ficha }),
  adaptar: (ficha, necesidades) => post('adaptar', { ficha, necesidades }),
  async biblioteca() {
    const res = await fetch('/api/biblioteca')
    if (!res.ok) throw new Error(`El servidor respondió ${res.status} en /api/biblioteca`)
    return res.json()
  },
}
