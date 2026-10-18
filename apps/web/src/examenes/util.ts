// Ayudas comunes para armar preguntas al azar.
import { barajar, elegir } from '../juegos/motor/azar'
import { num, soloIncorrectas, valor } from '../juegos/matematica/formato'
import type { Azar } from './tipos'

/** Nombres del Perú, de la costa, la sierra y la selva. Las frases no cambian según el nombre (nada de "contento/a"). */
export const NOMBRES = [
  'Daniel',
  'Lucía',
  'Mateo',
  'Valeria',
  'Yaku',
  'Killa',
  'Inti',
  'Sumaq',
  'Rosa',
  'Kevin',
  'Ximena',
  'Thiago',
  'Nayeli',
  'Camila',
  'Piero',
  'Milagros',
  'Ángel',
  'Kiara',
  'Fernando',
  'Luz',
]

export const nombre = (azar: Azar) => elegir(azar, NOMBRES)

/** Dos nombres distintos. */
export function dosNombres(azar: Azar): [string, string] {
  const [a, b] = barajar(azar, NOMBRES)
  return [a, b]
}

export const letra = (i: number) => String.fromCharCode(97 + i)

/**
 * Alternativas de una pregunta: la correcta y los primeros distractores válidos (vienen ordenados del error más
 * frecuente al menos). Si todas son números, van de menor a mayor, como en las pruebas del MINEDU; si no, barajadas.
 */
export function alternativas(azar: Azar, correcta: string, distractores: string[], cuantas = 4): { alternativas: string[]; correcta: number } | null {
  // Entre los errores más frecuentes se eligen algunos al azar: así la correcta no cae siempre en el mismo lugar.
  const malas = barajar(azar, soloIncorrectas(correcta, distractores).slice(0, cuantas + 1)).slice(0, cuantas - 1)
  if (malas.length < Math.min(2, cuantas - 1)) return null
  const todas = [correcta, ...malas]
  const numeros = todas.every((t) => valor(t.replace(/^S\/\s*/, '')) !== null)
  const orden = numeros ? [...todas].sort((a, b) => valor(a.replace(/^S\/\s*/, ''))! - valor(b.replace(/^S\/\s*/, ''))!) : barajar(azar, todas)
  return { alternativas: orden, correcta: orden.indexOf(correcta) }
}

/** "S/ 1473" (el signo del sol va antes y separado, como en las boletas). */
export const soles = (n: number) => `S/ ${num(n)}`
