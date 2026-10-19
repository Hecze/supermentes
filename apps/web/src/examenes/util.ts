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

const numero = (t: string) => valor(t.replace(/^S\/\s*/, ''))

/**
 * Alternativas de una pregunta: la correcta y algunos distractores válidos (vienen ordenados del error más frecuente
 * al menos). Si todas son números, van de menor a mayor, como en las pruebas del MINEDU; para que la correcta no caiga
 * casi siempre en el medio, primero se sortea su lugar y luego se eligen errores de abajo y de arriba. Si no son
 * números, van barajadas.
 */
export function alternativas(azar: Azar, correcta: string, distractores: string[], cuantas = 4): { alternativas: string[]; correcta: number } | null {
  const validas = soloIncorrectas(correcta, distractores)
  const vc = numero(correcta)
  const numeros = vc !== null && validas.every((t) => numero(t) !== null)
  let malas: string[] | null = null
  if (numeros) {
    const abajo = validas.filter((t) => numero(t)! < vc)
    const arriba = validas.filter((t) => numero(t)! > vc)
    const n = Math.min(cuantas - 1, validas.length)
    const desde = Math.max(0, n - arriba.length)
    const hasta = Math.min(n, abajo.length)
    if (desde <= hasta) {
      const k = desde + Math.floor(azar() * (hasta - desde + 1))
      // Entre los errores más frecuentes de cada lado, algunos al azar.
      malas = [...barajar(azar, abajo.slice(0, k + 1)).slice(0, k), ...barajar(azar, arriba.slice(0, n - k + 1)).slice(0, n - k)]
    }
  }
  // Entre los errores más frecuentes se eligen algunos al azar.
  malas ??= barajar(azar, validas.slice(0, cuantas + 1)).slice(0, cuantas - 1)
  if (malas.length < Math.min(2, cuantas - 1)) return null
  const todas = [correcta, ...malas]
  const orden = numeros ? [...todas].sort((a, b) => numero(a)! - numero(b)!) : barajar(azar, todas)
  return { alternativas: orden, correcta: orden.indexOf(correcta) }
}

/** "S/ 1473" (el signo del sol va antes y separado, como en las boletas). */
export const soles = (n: number) => `S/ ${num(n)}`
