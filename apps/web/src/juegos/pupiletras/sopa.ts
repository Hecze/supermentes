// Arma un pupiletras (sopa de letras): ubica las palabras en la grilla y rellena el resto con letras al azar.
import { barajar, entero } from '../motor/azar'

export type Celda = { f: number; c: number }
export type Ubicada = { palabra: string; celdas: Celda[] }

const RECTAS: [number, number][] = [
  [0, 1],
  [1, 0],
]
const DIAGONALES: [number, number][] = [
  [1, 1],
  [-1, 1],
]
const AL_REVES: [number, number][] = [
  [0, -1],
  [-1, 0],
  [-1, -1],
  [1, -1],
]

/** Más chicos: solo de izquierda a derecha y de arriba abajo. Más grandes: diagonales y al revés. */
export const direcciones = (ritmo: 1 | 2 | 3) => (ritmo === 1 ? RECTAS : ritmo === 2 ? [...RECTAS, ...DIAGONALES] : [...RECTAS, ...DIAGONALES, ...AL_REVES])

// Letras de relleno con la frecuencia del castellano, para que la grilla no delate las palabras.
const RELLENO = 'AAAAAAEEEEEEOOOOOIIIIUUUSSSSRRRRNNNNLLLTTTCCCDDDMMPPBGVYHQFZJÑ'

export function armarSopa(palabras: string[], lado: number, dirs: [number, number][], azar: () => number) {
  const grilla: (string | null)[][] = Array.from({ length: lado }, () => Array<string | null>(lado).fill(null))
  const ubicadas: Ubicada[] = []

  for (const palabra of [...palabras].sort((a, b) => b.length - a.length)) {
    if (palabra.length > lado) continue
    for (let intento = 0; intento < 300; intento++) {
      const [df, dc] = dirs[Math.floor(azar() * dirs.length)]
      const f0 = entero(azar, 0, lado - 1)
      const c0 = entero(azar, 0, lado - 1)
      const fFin = f0 + df * (palabra.length - 1)
      const cFin = c0 + dc * (palabra.length - 1)
      if (fFin < 0 || fFin >= lado || cFin < 0 || cFin >= lado) continue
      const celdas = [...palabra].map((_, i) => ({ f: f0 + df * i, c: c0 + dc * i }))
      if (!celdas.every(({ f, c }, i) => grilla[f][c] === null || grilla[f][c] === palabra[i])) continue
      celdas.forEach(({ f, c }, i) => (grilla[f][c] = palabra[i]))
      ubicadas.push({ palabra, celdas })
      break
    }
  }

  const letras = grilla.map((fila) => fila.map((l) => l ?? RELLENO[Math.floor(azar() * RELLENO.length)]))
  return { letras, ubicadas: barajar(azar, ubicadas) }
}

/** Celdas entre dos puntos, si están en una recta horizontal, vertical o diagonal. */
export function linea(a: Celda, b: Celda): Celda[] | null {
  const df = b.f - a.f
  const dc = b.c - a.c
  if (df !== 0 && dc !== 0 && Math.abs(df) !== Math.abs(dc)) return null
  const n = Math.max(Math.abs(df), Math.abs(dc))
  return Array.from({ length: n + 1 }, (_, i) => ({ f: a.f + Math.sign(df) * i, c: a.c + Math.sign(dc) * i }))
}

/** Lleva el punto final a la recta más cercana (horizontal, vertical o diagonal) desde el inicio. */
export function ajustar(a: Celda, b: Celda): Celda {
  const df = b.f - a.f
  const dc = b.c - a.c
  if (df === 0 || dc === 0 || Math.abs(df) === Math.abs(dc)) return b
  const angulo = Math.round(Math.atan2(df, dc) / (Math.PI / 4)) * (Math.PI / 4)
  const n = Math.max(Math.abs(df), Math.abs(dc))
  return { f: a.f + Math.round(Math.sin(angulo)) * n, c: a.c + Math.round(Math.cos(angulo)) * n }
}
