// Lo que se comparte con los alumnos: qué juego y con qué contenido. El servidor lo guarda con un código corto
// (/api/juegos-compartidos); si no responde, todo viaja dentro del link y funciona igual.
import { contenidoMatematica } from '../contenido'
import type { Contenido, JuegoId, Ritmo } from '../tipos'

export type ContenidoGuardado = Omit<Contenido, 'generar'>

export type Publicado = {
  v: 1
  juego: JuegoId
  ritmo: Ritmo
  /** Título del tema, para saludar al alumno. */
  tema: string
  /** Grado del tema: ordena los juegos por edad cuando el alumno elige "Otro juego". */
  grado?: string
  /** El cálculo se guarda como habilidad y nivel: el celular del alumno genera los ejercicios. */
  fuente: { tipo: 'calculo'; habilidad: string; nivel: number } | { tipo: 'tema'; contenido: ContenidoGuardado }
}

const ALFABETO = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/

/** Los códigos no usan letras que se confunden (I, L, O, 0, 1). */
export const codigoValido = (c: string) => ALFABETO.test(c)

export function contenidoDe(p: Publicado): Contenido | null {
  if (p.fuente.tipo === 'calculo') return contenidoMatematica(p.fuente)
  return p.fuente.contenido
}

/** Origen para los links: el dominio real si la app corre fuera de él (vista previa, visor embebido). */
export function origen() {
  try {
    const o = window.location.origin
    if (/^https?:\/\//.test(o) && !/claude|usercontent/.test(o)) return o
  } catch {
    // Sin location se usa el dominio de producción.
  }
  return 'https://www.supermentes.app'
}

export const enlaceConCodigo = (codigo: string) => `${origen()}/j/${codigo}`

/** Publica el juego. La clave es solo del docente: con ella ve los resultados de sus alumnos. */
export async function publicar(p: Publicado): Promise<{ codigo: string; clave: string }> {
  const res = await fetch('/api/juegos-compartidos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(p),
  })
  if (!res.ok) throw new Error(`El servidor respondió ${res.status}`)
  const { codigo, clave } = (await res.json()) as { codigo?: string; clave?: string }
  if (!codigo || !codigoValido(codigo) || !clave) throw new Error('Respuesta sin código')
  return { codigo, clave }
}

export async function cargar(codigo: string): Promise<Publicado> {
  const res = await fetch(`/api/juegos-compartidos?codigo=${encodeURIComponent(codigo)}`)
  if (res.status === 404) throw new Error('no-existe')
  if (!res.ok) throw new Error(`El servidor respondió ${res.status}`)
  return (await res.json()) as Publicado
}

// ---------- Links que llevan todo adentro ----------

const aBase64Url = (bytes: Uint8Array) => {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const deBase64Url = (texto: string) => {
  const s = atob(texto.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(s, (c) => c.charCodeAt(0))
}

async function transformar(bytes: Uint8Array, flujo: CompressionStream | DecompressionStream) {
  const salida = new Blob([bytes as BlobPart]).stream().pipeThrough(flujo)
  return new Uint8Array(await new Response(salida).arrayBuffer())
}

/** "z" + datos comprimidos, o "j" + JSON plano si el navegador no sabe comprimir. */
export async function enlaceAutonomo(p: Publicado) {
  const json = new TextEncoder().encode(JSON.stringify(p))
  let datos = `j${aBase64Url(json)}`
  if (typeof CompressionStream !== 'undefined') {
    try {
      datos = `z${aBase64Url(await transformar(json, new CompressionStream('deflate-raw')))}`
    } catch {
      // Queda el JSON plano.
    }
  }
  return `${origen()}/j/#d=${datos}`
}

export async function leerAutonomo(datos: string): Promise<Publicado> {
  const bytes = deBase64Url(datos.slice(1))
  const json = datos[0] === 'z' ? await transformar(bytes, new DecompressionStream('deflate-raw')) : bytes
  return JSON.parse(new TextDecoder().decode(json)) as Publicado
}
