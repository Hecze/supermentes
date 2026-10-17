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

async function post<T>(ruta: string, cuerpo: unknown): Promise<T> {
  const res = await fetch(`/api/${ruta}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  })
  return leer<T>(res)
}

export const realApi: Api = {
  async prepararFicha(entrada) {
    const datos = new FormData()
    datos.set('tipo', entrada.tipo)
    datos.set('gradoId', entrada.gradoId)
    datos.set('areaId', entrada.areaId)
    datos.set('grado', entrada.grado)
    datos.set('area', entrada.area)
    if (entrada.competencia) datos.set('competencia', entrada.competencia)
    if (entrada.capacidad) datos.set('capacidad', entrada.capacidad)
    if (entrada.desempenos?.length) datos.set('desempenos', JSON.stringify(entrada.desempenos))
    if (entrada.duracion) datos.set('duracion', entrada.duracion)
    if (entrada.texto) datos.set('texto', entrada.texto)
    if (entrada.archivo) datos.set('archivo', await achicar(entrada.archivo))
    return leer(await fetch('/api/ficha', { method: 'POST', body: datos }))
  },
  generarCancion: (ficha, opciones) => post('cancion', { ficha, opciones }),
  generarAudio: (cancion) => post('audio', { cancion }),
  async adaptarExamen(ficha, { examen, ...opciones }) {
    const datos = new FormData()
    datos.set('ficha', JSON.stringify(ficha))
    datos.set('opciones', JSON.stringify(opciones))
    datos.set('examen', await achicar(examen))
    return leer(await fetch('/api/examen', { method: 'POST', body: datos }))
  },
  generarJuego: (ficha) => post('juego', { ficha }),
  async biblioteca() {
    return leer(await fetch('/api/biblioteca'))
  },
}
