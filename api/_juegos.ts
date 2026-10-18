// Lo común de los juegos compartidos y sus resultados. El "_" hace que Vercel no lo publique como endpoint.
import { timingSafeEqual } from 'node:crypto'
import { leer } from './_almacen.js'

export const CODIGO = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/
export const JUEGOS = new Set(['globos', 'rapido', 'soga', 'memoria', 'carrera', 'palabra', 'pupiletras', 'topo', 'ruleta', 'duelo', 'invasion', 'concurso', 'verdad', 'une', 'condor', 'carriles', 'michi'])

export function json(datos: unknown, estado = 200, cabeceras: Record<string, string> = {}) {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cabeceras },
  })
}

export const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '')
export const entero = (v: unknown, min: number, max: number) =>
  Number.isInteger(v) && (v as number) >= min && (v as number) <= max ? (v as number) : null
export const objeto = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {})

export const rutaJuego = (codigo: string) => `juegos/${codigo}.json`

export const leerJson = <T>(ruta: string) => leer<T>(ruta)

/** El juego guardado tal cual, con la clave del docente (nunca se manda a los alumnos). */
export type JuegoGuardado = { juego: string; tema: string; clave?: string; creado: string } & Record<string, unknown>

export const leerJuego = (codigo: string) => leerJson<JuegoGuardado>(rutaJuego(codigo))

/** Compara la clave sin delatar por el tiempo cuántos caracteres coinciden. */
export function claveCorrecta(guardada: string | undefined, dada: string | null) {
  if (!guardada || !dada) return false
  const a = Buffer.from(guardada)
  const b = Buffer.from(dada)
  return a.length === b.length && timingSafeEqual(a, b)
}

// Tope de escrituras por conexión, en la memoria de cada instancia: frena a un bot antes de gastar operaciones
// de Blob (como en api/lista-espera.ts). Es holgado porque en un colegio muchos comparten la misma red.
const escrituras = new Map<string, number[]>()
const VENTANA = 10 * 60_000

export function demasiadas(request: Request, tipo: string, maximo: number) {
  const ip = (request.headers.get('x-vercel-forwarded-for') ?? request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'sin-ip'
  const clave = `${tipo}:${ip}`
  const ahora = Date.now()
  const recientes = (escrituras.get(clave) ?? []).filter((t) => ahora - t < VENTANA)
  recientes.push(ahora)
  if (escrituras.size > 10_000) escrituras.clear()
  escrituras.set(clave, recientes)
  return recientes.length > maximo
}
