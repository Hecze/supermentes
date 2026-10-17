// Cómo se escriben los números en la escuela peruana: coma decimal, espacio para los millares desde 10 000
// y el signo menos tipográfico.

const ESPACIO = ' '

export function num(n: number): string {
  if (n < 0) return `−${num(-n)}`
  const [ent, dec] = String(Math.round(n * 1e6) / 1e6).split('.')
  const entero = ent.length > 4 ? ent.replace(/\B(?=(\d{3})+(?!\d))/g, ESPACIO) : ent
  return dec ? `${entero},${dec}` : entero
}

/** Valor numérico de una respuesta ("3/4", "0,75", "−2", "12"), o null si no es un número. */
export function valor(texto: string): number | null {
  const t = texto.replace(/[\s ]/g, '').replace('−', '-').replace(',', '.')
  const f = /^(-?\d+)\/(\d+)$/.exec(t)
  if (f) return Number(f[2]) === 0 ? null : Number(f[1]) / Number(f[2])
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : null
}

const igual = (a: number, b: number) => Math.abs(a - b) < 1e-9

/**
 * Deja solo respuestas incorrectas y distintas entre sí, en el orden dado (las primeras son los errores
 * más frecuentes). Compara por valor: 2/4 no puede ser distractor de 1/2, ni 0,50 de 0,5.
 */
export function soloIncorrectas(correcta: string, candidatas: string[]): string[] {
  const vc = valor(correcta)
  const vistos: number[] = []
  const textos = new Set([correcta])
  const res: string[] = []
  for (const c of candidatas) {
    if (textos.has(c)) continue
    const v = valor(c)
    if (v !== null && vc !== null && igual(v, vc)) continue
    if (v !== null && vistos.some((x) => igual(x, v))) continue
    textos.add(c)
    if (v !== null) vistos.push(v)
    res.push(c)
  }
  return res
}

/**
 * Distractores numéricos: primero los errores frecuentes que se pasan, luego vecinos cercanos.
 * Así cualquier juego puede pedir hasta 11 opciones incorrectas.
 */
export function distractores(
  correcta: number,
  frecuentes: number[],
  { min = 0, cuantos = 11, paso = 1, decimales = false }: { min?: number; cuantos?: number; paso?: number; decimales?: boolean } = {},
): string[] {
  const valido = (n: number) => Number.isFinite(n) && n >= min && (decimales || Number.isInteger(n))
  const cerca: number[] = []
  for (let k = 1; cerca.length < cuantos * 2 && k < 60; k++) cerca.push(correcta + k * paso, correcta - k * paso)
  return soloIncorrectas(num(correcta), [...frecuentes, ...cerca].filter(valido).map(num)).slice(0, cuantos)
}

/** Fracción como texto. */
export const frac = (a: number, b: number) => `${a}/${b}`

export function mcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : mcd(b, a % b)
}

/** Fracción simplificada como texto. */
export function fracSimple(a: number, b: number) {
  const d = mcd(a, b) || 1
  return frac(a / d, b / d)
}

const SUPER: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }
export const exponente = (n: number) => String(n).replace(/\d/g, (d) => SUPER[d])
