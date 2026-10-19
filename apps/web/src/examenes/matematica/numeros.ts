// Tipos de pregunta de números de cuatro cifras (4.º de primaria), con dibujos: el dinero del Perú, el ábaco, el
// material Base Diez y el tablero de valor posicional. Cada versión trae otros números, y las alternativas
// incorrectas son los errores que más cometen los alumnos (olvidar las monedas, saltarse el cero, leer al revés).
import { barajar, elegir, entero } from '../../juegos/motor/azar'
import { distractores, num, valor } from '../../juegos/matematica/formato'
import { CLARO, GRIS, casilla, circulo, el, elipse, grupo, linea, poligono, rect, svg, texto } from '../dibujos'
import { BILLETES, DIAMETRO_MONEDA, MONEDAS, PROPORCION_BILLETE } from '../peru/dinero'
import type { Azar, Dibujo, Nivel, TipoPregunta } from '../tipos'
import { alternativas, nombre, soles } from '../util'

const P4 = 'primaria-4'

/**
 * Algunos generadores descartan casos feos y vuelven a intentar. Con 60 intentos, ¿Cuánto le falta? se rendía en 1 de
 * cada 400 semillas y el examen no se armaba; los intentos de más solo cambian esas semillas (las demás salen igual).
 */
export function hasta<T>(intento: () => T | null): T {
  for (let i = 0; i < 300; i++) {
    const r = intento()
    if (r !== null) return r
  }
  throw new Error('No se pudo generar la pregunta')
}

const cifrasDe = (n: number) => String(n).padStart(4, '0').split('').map(Number) // [UM, C, D, U]
const deCifras = (c: number[]) => c.reduce((s, d) => s * 10 + d, 0)

/** Errores típicos al leer un número representado: saltarse los ceros, leerlo al revés, contar una pieza de más. */
function erroresDeLectura(n: number) {
  const c = cifrasDe(n)
  const sinCeros = Number(c.filter((d) => d !== 0).join('') || 0)
  const alReves = deCifras([...c].reverse())
  return [sinCeros, alReves, n + 100, n - 10, n + 10, n - 100, n + 1000, deCifras([c[0], c[2], c[1], c[3]])]
}

/** Los mismos errores, pero los más finos primero: sin los ceros, el cero corrido a otro lugar, una cuenta de más o de menos. */
function erroresFinos(n: number) {
  const c = cifrasDe(n)
  const sinCeros = Number(c.filter((d) => d !== 0).join('') || 0)
  // 4037 → 4307 o 4370: el cero cambia de lugar con la cifra de al lado.
  const corridos = c.flatMap((d, i) =>
    d === 0 && i > 0
      ? [i - 1, i + 1]
          .filter((j) => j > 0 && j < 4 && c[j] !== 0)
          .map((j) => {
            const x = [...c]
            ;[x[i], x[j]] = [x[j], x[i]]
            return deCifras(x)
          })
      : [],
  )
  return [sinCeros, ...corridos, n + 10, n - 10, n + 1, n - 1, n + 100, n - 100]
}

/** Las alternativas incorrectas al leer un número representado, según la dificultad (siempre de 4 cifras o menos). */
function lecturasMal(n: number, nivel: Nivel): string[] {
  if (nivel === 2) return distractores(n, erroresDeLectura(n), { min: 1 }).filter((x) => x.length >= 3)
  const hasta9999 = (xs: string[]) => xs.filter((x) => (valor(x) ?? 0) <= 9999)
  // Más fácil: errores lejanos (leerlo al revés, mil o cien de más o de menos), todos de 4 cifras.
  if (nivel === 1) return hasta9999(distractores(n, [deCifras([...cifrasDe(n)].reverse()), n + 1000, n - 1000, n + 100, n - 100], { min: 1000, paso: 100 }))
  return hasta9999(distractores(n, erroresFinos(n), { min: 1 }).filter((x) => x.length >= 3))
}

// ---------- Pasos de resolución (clave del docente) ----------

/** "a", "a y b", "a, b y c". */
const y = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}` : xs[0])

const POSICIONES = ['UM', 'C', 'D', 'U']
const VALOR_POS = [1000, 100, 10, 1]

/** "3000 + 0 + 40 + 5 = 3045": el número armado con lo que vale cada cifra, ceros incluidos. */
const sumaDeValores = (c: number[]) => `${c.map((d, i) => num(d * VALOR_POS[i])).join(' + ')} = ${num(deCifras(c))}`

/** "3 en UM, 0 en C, 4 en D, 5 en U". */
const porPosicion = (c: number[]) => c.map((d, i) => `${d} en ${POSICIONES[i]}`).join(', ')

const UNIDADES: [string, string][] = [
  ['unidad de millar', 'unidades de millar'],
  ['centena', 'centenas'],
  ['decena', 'decenas'],
  ['unidad', 'unidades'],
]

/** "3045 tiene 3 unidades de millar, 0 centenas, 4 decenas y 5 unidades". */
const desglose = (c: number[]) => `${num(deCifras(c))} tiene ${y(c.map((d, i) => `${d} ${UNIDADES[i][d === 1 ? 0 : 1]}`))}`

/** El cero del medio es donde más se equivocan: "En C no hay cuentas: se escribe 0". */
function ceroEn(c: number[], texto: (lugares: string) => string): string[] {
  const vacias = POSICIONES.filter((_, i) => i > 0 && c[i] === 0)
  return vacias.length ? [texto(y(vacias))] : []
}

// ---------- El dinero del Perú ----------

// Los billetes y monedas de verdad (imágenes oficiales del BCRP, en ../peru): así el alumno reconoce el dinero que
// usa en la bodega. Se ven más chicos que los reales, como en los libros.
/** Las imágenes del dinero son del BCRP: se dice al pie de la hoja. */
export const CREDITO_DINERO = 'Billetes y monedas: imágenes del Banco Central de Reserva del Perú (BCRP)'

const BW = 176
const BH = Math.round(BW / PROPORCION_BILLETE)

function billete(valor: number) {
  return [
    el('image', { href: BILLETES[valor], x: 0, y: 0, width: BW, height: BH, preserveAspectRatio: 'xMidYMid meet' }),
    // Un filo fino: en la fotocopia, el billete no se pierde en la hoja.
    rect(0.5, 0.5, BW - 1, BH - 1, { trazo: GRIS, grosor: 0.8, redondeo: 3 }),
  ].join('')
}

/** El radio de cada moneda en el dibujo, en su tamaño relativo real (la de S/ 1 es la más grande). */
const R_MONEDA = 36
const radioMoneda = (valor: number) => Math.round((DIAMETRO_MONEDA[valor] / DIAMETRO_MONEDA[1]) * R_MONEDA)

function moneda(valor: number) {
  const r = radioMoneda(valor)
  return el('image', { href: MONEDAS[valor], x: -r, y: -r, width: 2 * r, height: 2 * r, preserveAspectRatio: 'xMidYMid meet' })
}

/** Billetes de mayor a menor, de tres en tres, y debajo las monedas, como en las fichas del MINEDU. */
export function dibujoDinero(billetes: number[], monedas: number[]): Dibujo {
  const POR_FILA = 3
  const GAP = 14
  const filas = Math.ceil(billetes.length / POR_FILA)
  const partes: string[] = []
  billetes.forEach((b, i) => partes.push(grupo(billete(b), (i % POR_FILA) * (BW + GAP) + 4, Math.floor(i / POR_FILA) * (BH + 12) + 4)))
  const paso = 2 * R_MONEDA + 10
  const yMonedas = filas * (BH + 12) + 4 + R_MONEDA
  monedas.forEach((m, i) => partes.push(grupo(moneda(m), 4 + R_MONEDA + i * paso, yMonedas)))
  const ancho = Math.max(Math.min(billetes.length, POR_FILA) * (BW + GAP) - GAP, monedas.length * paso) + 8
  const alto = yMonedas + (monedas.length ? R_MONEDA : -R_MONEDA) + 4
  const cuenta = (xs: number[], cosa: string) =>
    [...new Set(xs)].map((v) => `${xs.filter((x) => x === v).length} ${cosa} de S/ ${v}`).join(', ')
  return { ...svg(ancho, alto, partes.join(''), `${cuenta(billetes, 'billetes')}; ${cuenta(monedas, 'monedas')}`), credito: CREDITO_DINERO }
}

type Bolsillo = { billetes: number[]; monedas: number[]; total: number; enMonedas: number }

/** Cómo se arma un montón de dinero: cuántos billetes de cada valor, qué monedas y cuántas cosas en total. */
type Reglas = {
  /** Cuántos billetes de S/ 200, 100, 50, 20 y 10, cada uno [mínimo, máximo]. */
  billetes: [number, number][]
  monedas: (azar: Azar) => number[]
  maxBilletes: number
  /** Mínimo de valores distintos de billete. */
  minTipos: number
  /** Cuántas monedas, [mínimo, máximo]. */
  cuantasMonedas: [number, number]
}

/** De 0 a k monedas de S/ 5, de S/ 2 y de S/ 1. */
const monedasHasta = (k: number) => (azar: Azar) => [5, 2, 1].flatMap((v) => Array(entero(azar, 0, k)).fill(v))

/** Lo de siempre: varios billetes de 3 o más valores y de 2 a 5 monedas. */
const NORMAL: Reglas = { billetes: [[2, 7], [0, 3], [0, 2], [0, 2], [0, 2]], monedas: monedasHasta(2), maxBilletes: 9, minTipos: 3, cuantasMonedas: [2, 5] }
/** Más fácil: pocos billetes, casi todos de S/ 200 y S/ 100 (a veces uno de S/ 50), y solo dos monedas distintas. */
const POCO: Reglas = { billetes: [[3, 7], [0, 3], [0, 1], [0, 0], [0, 0]], monedas: monedasHasta(1), maxBilletes: 7, minTipos: 2, cuantasMonedas: [2, 2] }
/** Como POCO, pero las monedas suman S/ 10: lo que falta para el millar es un número redondo (de decenas). */
const POCO_REDONDO: Reglas = { ...POCO, billetes: [[1, 6], [0, 3], [0, 1], [0, 0], [0, 0]], monedas: (azar) => [...elegir(azar, [[5, 5], [5, 2, 2, 1]])], cuantasMonedas: [2, 4] }
/** Más difícil: billetes de 4 o 5 valores (siempre de 20 y de 10) y más monedas: más cosas que contar y agrupar. */
const MUCHO: Reglas = { billetes: [[3, 5], [0, 2], [0, 2], [1, 2], [1, 2]], monedas: monedasHasta(2), maxBilletes: 9, minTipos: 4, cuantasMonedas: [4, 6] }

/** Un montón de dinero de 4 cifras: varios billetes de 3 o más valores y algunas monedas. */
function bolsillo(azar: Azar, min = 1000, max = 2999, reglas = NORMAL): Bolsillo {
  return hasta(() => {
    const valores = [200, 100, 50, 20, 10]
    const cant: Record<number, number> = Object.fromEntries(valores.map((v, i) => [v, entero(azar, ...reglas.billetes[i])]))
    const billetes = valores.flatMap((v) => Array(cant[v]).fill(v))
    const monedas = reglas.monedas(azar)
    const tipos = valores.filter((v) => cant[v] > 0).length
    const total = [...billetes, ...monedas].reduce((s, x) => s + x, 0)
    const enMonedas = monedas.reduce((s, x) => s + x, 0)
    const [minMonedas, maxMonedas] = reglas.cuantasMonedas
    if (billetes.length > reglas.maxBilletes || tipos < reglas.minTipos || monedas.length < minMonedas || monedas.length > maxMonedas || total < min || total > max) return null
    return { billetes, monedas, total, enMonedas }
  })
}

/**
 * Cómo se cuenta el dinero: "Billetes: 6 × 200 = 1200; 2 × 100 = 200", "Monedas: 5 + 5 + 2 + 1 = 13" y la suma de
 * esos subtotales ("1200 + 200 + 13", sin el resultado) para cerrar con el total.
 */
function contarDinero(b: Bolsillo): { pasos: string[]; suma: string } {
  const valores = [...new Set(b.billetes)]
  const subtotales = valores.map((v) => b.billetes.filter((x) => x === v).length * v)
  const billetes = valores.map((v, i) => `${num(subtotales[i] / v)} × ${num(v)} = ${num(subtotales[i])}`).join('; ')
  return {
    pasos: [`Billetes: ${billetes}`, `Monedas: ${b.monedas.map(num).join(' + ')} = ${num(b.enMonedas)}`],
    suma: [...subtotales, b.enMonedas].map(num).join(' + '),
  }
}

export const dineroContar: TipoPregunta = {
  id: 'dinero-contar',
  nombre: 'Cuenta el dinero',
  queHacen: 'Cuentan billetes y monedas del Perú y eligen cuánto dinero hay en total.',
  citas: {
    [P4]: 'Expresa con diversas representaciones y lenguaje numérico (números, signos y expresiones verbales) su comprensión de: La unidad de millar como unidad del sistema de numeración decimal, sus equivalencias entre unidades menores',
  },
  area: 'matematica',
  competencia: 1,
  cambia: 'numeros',
  niveles: true,
  generar({ azar, nivel = 2 }) {
    const b = bolsillo(azar, 1000, 2999, { 1: POCO, 2: NORMAL, 3: MUCHO }[nivel])
    const quien = nombre(azar)
    const t = b.total
    const malas = {
      // Más fácil: errores lejanos, de un billete de 100 o de 200.
      1: () => distractores(t, [t - 200, t + 200, t + 100, t - 100, t - b.enMonedas], { min: 1, paso: 100 }),
      // Olvidar las monedas, contar un billete dos veces, equivocarse en las decenas, contar un billete de menos.
      2: () => distractores(t, [t - b.enMonedas, t + 200, t - 30, t + 10, t - 200, t + 100], { min: 1 }),
      // Más difícil: errores finos, de un billete chico o de una moneda; y una alternativa más.
      3: () => distractores(t, [t - b.enMonedas, t - 10, t + 10, t - 30, t + 20, t - 5, t + 5], { min: 1 }),
    }[nivel]()
    const alt = alternativas(azar, num(b.total), malas, nivel === 3 ? 4 : 3)
    if (!alt) return null
    const cuenta = contarDinero(b)
    return {
      forma: 'opciones',
      clave: `dinero:${b.billetes.join('-')}|${b.monedas.join('-')}`,
      enunciado: `Observa el dinero que tiene ${quien}.`,
      dibujo: dibujoDinero(b.billetes, b.monedas),
      pregunta: `Ahora responde: ¿Cuánto dinero tiene ${quien}?`,
      ...alt,
      alternativas: alt.alternativas.map((a) => `S/ ${a}`),
      pasos: [...cuenta.pasos, `Total: ${cuenta.suma} = ${soles(b.total)}`],
    }
  },
}

export const dineroFalta: TipoPregunta = {
  id: 'dinero-falta',
  nombre: '¿Cuánto le falta?',
  queHacen: 'Cuentan el dinero y calculan cuánto le falta para completar el millar siguiente.',
  citas: { [P4]: 'completar al millar más cercano' },
  area: 'matematica',
  competencia: 1,
  cambia: 'numeros',
  niveles: true,
  generar({ azar, nivel = 2 }) {
    const b = hasta(() => {
      // Más fácil: también menos de mil (S/ 760 para tener S/ 1000).
      const x = nivel === 1 ? bolsillo(azar, 500, 1990, POCO_REDONDO) : bolsillo(azar, 1100, 2950, nivel === 3 ? MUCHO : NORMAL)
      // Más difícil: con unidades (las monedas no suman un número redondo), hay que completar cada columna.
      return x.total % 1000 === 0 || (nivel === 3 && x.total % 10 === 0) ? null : x
    })
    const meta = Math.ceil(b.total / 1000) * 1000
    const falta = meta - b.total
    const quien = nombre(azar)
    const cosa = azar() < 0.5 ? 'una bicicleta' : azar() < 0.5 ? 'una laptop para su familia' : 'un viaje con su familia'
    const malas = {
      // Más fácil: errores lejanos, de cien o de doscientos, o confundir lo que falta con lo que juntó.
      1: () => distractores(falta, [falta + 100, falta - 100, b.total, falta + 200, falta - 200], { min: 1, paso: 100 }),
      2: () => distractores(falta, [falta + b.enMonedas, falta + 10, falta - 10, falta + 100, falta - 100, b.total], { min: 1 }),
      // Más difícil: el error típico de completar cada cifra a 10 sin canjear (2000 − 1637 → 473), olvidar las monedas
      // y errores de una decena o una unidad.
      3: () => distractores(falta, [falta + 110, falta + b.enMonedas, falta + 10, falta - 10, falta + 1, falta - 1, falta + 100, b.total], { min: 1 }),
    }[nivel]()
    const alt = alternativas(azar, num(falta), malas, 4)
    if (!alt) return null
    const cuenta = contarDinero(b)
    const pasos = [...cuenta.pasos, `Juntó: ${cuenta.suma} = ${soles(b.total)}`, `Le falta: ${num(meta)} − ${num(b.total)} = ${soles(falta)}`]
    if (nivel === 3) {
      // Más difícil: el precio va en el texto y hay un dato que no se usa.
      const meses = entero(azar, 3, 8)
      return {
        forma: 'opciones',
        clave: `falta:${b.billetes.join('-')}|${b.monedas.join('-')}`,
        enunciado: `${quien} ahorra para ${cosa}, que cuesta ${soles(meta)}. En ${meses} meses juntó este dinero.`,
        dibujo: dibujoDinero(b.billetes, b.monedas),
        pregunta: '¿Cuánto dinero le falta?',
        ...alt,
        alternativas: alt.alternativas.map((a) => `S/ ${a}`),
        pasos: [`Los ${meses} meses no se usan: se compara lo que juntó con el precio`, ...pasos],
      }
    }
    return {
      forma: 'opciones',
      clave: `falta:${b.billetes.join('-')}|${b.monedas.join('-')}`,
      enunciado: `${quien} está ahorrando para ${cosa}. Este es el dinero que juntó.`,
      dibujo: dibujoDinero(b.billetes, b.monedas),
      pregunta: `¿Cuánto le falta para tener ${soles(meta)}?`,
      ...alt,
      alternativas: alt.alternativas.map((a) => `S/ ${a}`),
      pasos,
    }
  },
}

// ---------- El ábaco ----------

export function dibujoAbaco(cifras: number[] | null): Dibujo {
  const W = 340
  const base = 186
  const xs = [55, 130, 205, 280]
  const partes = [
    rect(15, base, W - 30, 22, { relleno: '#e6d2ad', redondeo: 4 }),
    ...xs.map((x) => linea(x, 22, x, base, { grosor: 3 })),
    ...xs.map((x, i) => texto(x, base + 40, POSICIONES[i], { tam: 18, peso: 700 })),
  ]
  if (cifras) {
    cifras.forEach((d, i) => {
      for (let k = 0; k < d; k++) partes.push(elipse(xs[i], base - 9 - k * 16, 22, 7.5, { relleno: k % 2 ? '#bdbdbd' : '#8f8f8f', grosor: 1.4 }))
    })
  }
  return svg(W, base + 56, partes.join(''), cifras ? `Ábaco con ${cifras.map((d, i) => `${d} en ${POSICIONES[i]}`).join(', ')}` : 'Ábaco vacío con UM, C, D y U')
}

/** Un número de 4 cifras; a veces con un cero en el medio, que es donde más se equivocan. */
function numeroConCero(azar: Azar, maxMillar = 9) {
  const c = [entero(azar, 1, maxMillar), entero(azar, 1, 9), entero(azar, 1, 9), entero(azar, 1, 9)]
  if (azar() < 0.45) c[entero(azar, 1, 3)] = 0
  return c
}

/**
 * Las cifras de un número de 4 cifras según la dificultad. Más fácil: sin ceros y con cifras chicas (pocas cuentas o
 * fichas que contar). Normal: como siempre. Más difícil: con uno o dos ceros en C, D o U (4007, 3060), que es donde
 * más se equivocan.
 */
function numeroDeNivel(azar: Azar, nivel: Nivel, maxFacil = 5): number[] {
  if (nivel === 2) return numeroConCero(azar)
  if (nivel === 1) {
    // Se salta un número del azar: si no, con cifras hasta 9 saldría el mismo número de la normal cuando esta no trae cero.
    azar()
    return [entero(azar, 1, maxFacil), entero(azar, 1, maxFacil), entero(azar, 1, maxFacil), entero(azar, 1, maxFacil)]
  }
  const c = [entero(azar, 1, 9), entero(azar, 1, 9), entero(azar, 1, 9), entero(azar, 1, 9)]
  for (const i of barajar(azar, [1, 2, 3]).slice(0, azar() < 0.5 ? 1 : 2)) c[i] = 0
  return c
}

export const abaco: TipoPregunta = {
  id: 'abaco',
  nombre: 'Lee el ábaco',
  queHacen: 'Leen o representan en el ábaco un número de cuatro cifras, según el valor de cada posición.',
  citas: { [P4]: 'el valor posicional de un dígito en números de cuatro cifras' },
  area: 'matematica',
  competencia: 1,
  cambia: 'numeros',
  niveles: true,
  generar({ azar, nivel = 2 }) {
    const c = numeroDeNivel(azar, nivel)
    const n = deCifras(c)
    if (azar() < 0.3) {
      return {
        forma: 'abierta',
        clave: `abaco:${n}`,
        enunciado: `Dibuja las cuentas en el ábaco para representar el número ${num(n)}.`,
        dibujo: dibujoAbaco(null),
        respuesta: porPosicion(c),
        espacio: 'dibujo',
        pasos: [desglose(c), ...ceroEn(c, (l) => `En ${l} no se dibuja ninguna cuenta`), `En el ábaco: ${porPosicion(c)}`],
      }
    }
    const alt = alternativas(azar, num(n), lecturasMal(n, nivel), 4)
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `abaco:${n}`,
      enunciado: 'Observa el ábaco.',
      dibujo: dibujoAbaco(c),
      pregunta: '¿Qué número representa?',
      ...alt,
      pasos: [`En el ábaco: ${porPosicion(c)}`, ...ceroEn(c, (l) => `En ${l} no hay cuentas: se escribe 0`), sumaDeValores(c)],
    }
  },
}

// ---------- Material Base Diez ----------

/** Lado del cubo, de la placa y largo de la barra (iguales, como en el material). */
const L = 44
const PROF = 13

function rejilla(w: number, h: number, columnas: number, filas: number) {
  const partes: string[] = []
  for (let k = 1; k < columnas; k++) partes.push(linea(k * (w / columnas), 0, k * (w / columnas), h, { trazo: GRIS, grosor: 0.5 }))
  for (let k = 1; k < filas; k++) partes.push(linea(0, k * (h / filas), w, k * (h / filas), { trazo: GRIS, grosor: 0.5 }))
  return partes.join('')
}

const MADERA = '#f1e3b8'

function cubo() {
  const frente = rect(0, PROF, L, L, { relleno: MADERA, grosor: 1.4 }) + grupo(rejilla(L, L, 10, 10), 0, PROF)
  const arriba = poligono([[0, PROF], [PROF, 0], [L + PROF, 0], [L, PROF]], { relleno: '#f8efd2', grosor: 1.4 })
  const costado = poligono([[L, PROF], [L + PROF, 0], [L + PROF, L], [L, L + PROF]], { relleno: '#dcc78d', grosor: 1.4 })
  return frente + arriba + costado
}

const placa = () => rect(0, 0, L, L, { relleno: MADERA, grosor: 1.4 }) + rejilla(L, L, 10, 10)
const barra = () => rect(0, 0, 6, L, { relleno: MADERA, grosor: 1.3 }) + rejilla(6, L, 1, 10)

/** Cubos de 1000, placas de 100 (en dos filas de tres), barras de 10 y cubitos de 1, apoyados en una misma línea. */
export function dibujoBaseDiez(c: number[]): Dibujo {
  const ALTO = 2 * L + 6
  const piso = 4 + ALTO
  const GAP = 24
  const partes: string[] = []
  let x = 4
  for (let i = 0; i < c[0]; i++) {
    partes.push(grupo(cubo(), x, piso - L - PROF))
    x += L + PROF + 8
  }
  if (c[0]) x += GAP - 8
  for (let i = 0; i < c[1]; i++) partes.push(grupo(placa(), x + (i % 3) * (L + 6), piso - L - Math.floor(i / 3) * (L + 6)))
  if (c[1]) x += Math.min(3, c[1]) * (L + 6) - 6 + GAP
  for (let i = 0; i < c[2]; i++) partes.push(grupo(barra(), x + i * 11, piso - L))
  if (c[2]) x += c[2] * 11 - 5 + GAP
  for (let i = 0; i < c[3]; i++) partes.push(rect(x + (i % 3) * 13, piso - 10 - Math.floor(i / 3) * 13, 10, 10, { relleno: MADERA, grosor: 1.3 }))
  if (c[3]) x += Math.min(3, c[3]) * 13 - 3
  const nombres = ['cubos de mil', 'placas de cien', 'barras de diez', 'cubitos']
  return svg(x + 4, piso + 4, partes.join(''), c.map((d, i) => `${d} ${nombres[i]}`).join(', '))
}

const PIEZAS: [string, string][] = [
  ['cubo', 'cubos'],
  ['placa', 'placas'],
  ['barra', 'barras'],
  ['cubito', 'cubitos'],
]

export const baseDiez: TipoPregunta = {
  id: 'base-diez',
  nombre: 'Material Base Diez',
  queHacen: 'Leen números formados con cubos de mil, placas de cien, barras de diez y cubitos, o dicen sus equivalencias.',
  citas: { [P4]: 'La unidad de millar como unidad del sistema de numeración decimal, sus equivalencias entre unidades menores' },
  area: 'matematica',
  competencia: 1,
  cambia: 'numeros',
  niveles: true,
  generar({ azar, nivel = 2 }) {
    if (azar() < 0.3) {
      if (nivel === 3) return equivalenciaDoble(azar)
      // Más fácil: de 1 a 3 cubos, siempre en placas (cada cubo, 10 placas).
      const cubos = nivel === 1 ? entero(azar, 1, 3) : entero(azar, 2, 4)
      const que = nivel === 1 || azar() < 0.5 ? { cosa: 'placas de 100', vale: 10 } : { cosa: 'barras de 10', vale: 100 }
      const r = cubos * que.vale
      const alt = alternativas(azar, num(r), distractores(r, [cubos, cubos * que.vale * 10, cubos * 1000, cubos + que.vale], { min: 1 }), 4)
      if (!alt) return null
      const losCubos = cubos === 1 ? '1 cubo' : `${cubos} cubos`
      return {
        forma: 'opciones',
        clave: `equivale:${cubos}:${que.vale}`,
        enunciado: `Observa: ${cubos === 1 ? 'es' : 'son'} ${losCubos} de 1000 del material Base Diez.`,
        dibujo: dibujoBaseDiez([cubos, 0, 0, 0]),
        pregunta: `¿Cuántas ${que.cosa} necesitas para formar la misma cantidad?`,
        ...alt,
        pasos: [
          `${num(1000)} = ${que.vale} × ${num(1000 / que.vale)}: cada cubo equivale a ${que.vale} ${que.cosa}`,
          `${losCubos}: ${cubos} × ${que.vale} = ${num(r)} ${que.cosa}`,
        ],
      }
    }
    if (nivel === 3) return baseDiezConCanje(azar)
    // Más fácil: pocas piezas y de todas (sin lugares vacíos).
    const c = nivel === 1 ? [entero(azar, 1, 2), entero(azar, 1, 4), entero(azar, 1, 5), entero(azar, 1, 5)] : [entero(azar, 1, 3), entero(azar, 0, 6), entero(azar, 0, 9), entero(azar, 0, 9)]
    if (nivel === 2 && c[1] + c[2] + c[3] < 6) return null
    const n = deCifras(c)
    const alt = alternativas(azar, num(n), lecturasMal(n, nivel), 4)
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `base10:${n}`,
      enunciado: 'Observa el material Base Diez: cubos de 1000, placas de 100, barras de 10 y cubitos de 1.',
      dibujo: dibujoBaseDiez(c),
      pregunta: '¿Qué número se formó?',
      ...alt,
      pasos: [c.map((d, i) => `${d} ${PIEZAS[i][d === 1 ? 0 : 1]} = ${num(d * VALOR_POS[i])}`).join('; '), sumaDeValores(c)],
    }
  },
}

/** Más difícil: cubos y placas juntos, todo en barras (2 cubos y 3 placas son 230 barras). Un paso más. */
function equivalenciaDoble(azar: Azar) {
  const cubos = entero(azar, 2, 4)
  const placas = entero(azar, 1, 5)
  const r = cubos * 100 + placas * 10
  // Errores: contar las placas como barras sueltas, olvidarlas, o cambiar cubos y placas por decenas.
  const alt = alternativas(azar, num(r), distractores(r, [cubos * 100 + placas, cubos * 100, cubos * 10 + placas, r * 10, r + 10, r - 10, cubos + placas], { min: 1 }), 4)
  if (!alt) return null
  const lasPlacas = `${placas} ${placas === 1 ? 'placa' : 'placas'}`
  return {
    forma: 'opciones' as const,
    clave: `equivale:${cubos}:${placas}:barras`,
    enunciado: `Observa: son ${cubos} cubos de 1000 y ${lasPlacas} de 100 del material Base Diez.`,
    dibujo: dibujoBaseDiez([cubos, placas, 0, 0]),
    pregunta: '¿Cuántas barras de 10 necesitas para formar la misma cantidad?',
    ...alt,
    pasos: [
      `Cada cubo equivale a 100 barras: ${cubos} × 100 = ${num(cubos * 100)} barras`,
      `Cada placa equivale a 10 barras: ${placas} × 10 = ${placas * 10} barras`,
      `${num(cubos * 100)} + ${placas * 10} = ${num(r)} barras`,
    ],
  }
}

/**
 * Más difícil: 10 o más barras (o cubitos) que hay que canjear por una placa (o una barra). 1 cubo, 3 placas,
 * 12 barras y 5 cubitos son 1425, no 1325.
 */
function baseDiezConCanje(azar: Azar) {
  const c = [entero(azar, 1, 3), entero(azar, 1, 6), entero(azar, 1, 8), entero(azar, 1, 9)]
  const k = azar() < 0.5 ? 2 : 3
  c[k] = entero(azar, 10, 14)
  const n = deCifras(c)
  // El error típico es quedarse con la última cifra de cada montón, sin canjear.
  const sinCanje = deCifras(c.map((d) => d % 10))
  const alt = alternativas(azar, num(n), [num(sinCanje), ...lecturasMal(n, 3)], 4)
  if (!alt) return null
  const sobran = c[k] - 10
  const canje =
    sobran === 0 ? `10 ${PIEZAS[k][1]} forman 1 ${PIEZAS[k - 1][0]}` : `${c[k]} ${PIEZAS[k][1]} = 1 ${PIEZAS[k - 1][0]} y ${sobran} ${PIEZAS[k][sobran === 1 ? 0 : 1]}`
  return {
    forma: 'opciones' as const,
    clave: `base10:${c.join('-')}`,
    enunciado: 'Observa el material Base Diez: cubos de 1000, placas de 100, barras de 10 y cubitos de 1.',
    dibujo: dibujoBaseDiez(c),
    pregunta: '¿Qué número se formó?',
    ...alt,
    pasos: [c.map((d, i) => `${d} ${PIEZAS[i][d === 1 ? 0 : 1]} = ${num(d * VALOR_POS[i])}`).join('; '), canje, sumaDeValores(c)],
  }
}

// ---------- Tablero de valor posicional ----------

export function dibujoTablero(contenido: (string | number)[], fichas = false): Dibujo {
  const CW = 84
  const partes: string[] = []
  POSICIONES.forEach((p, i) => {
    partes.push(rect(4 + i * CW, 4, CW, 34, { relleno: CLARO, grosor: 1.6 }))
    partes.push(texto(4 + i * CW + CW / 2, 21, p, { tam: 17, peso: 700 }))
    partes.push(rect(4 + i * CW, 38, CW, 78, { relleno: '#ffffff', grosor: 1.6 }))
    const v = contenido[i]
    if (fichas && typeof v === 'number') {
      for (let k = 0; k < v; k++) partes.push(circulo(4 + i * CW + 18 + (k % 3) * 24, 38 + 16 + Math.floor(k / 3) * 23, 9, { relleno: '#9a9a9a', grosor: 1.3 }))
    } else if (v === '') {
      partes.push(casilla(4 + i * CW + CW / 2 - 22, 38 + 21))
    } else partes.push(texto(4 + i * CW + CW / 2, 38 + 40, String(v), { tam: 38, peso: 700 }))
  })
  const alt = fichas ? `Tablero con fichas: ${contenido.map((v, i) => `${v} en ${POSICIONES[i]}`).join(', ')}` : `Tablero de valor posicional: ${contenido.map((v, i) => `${v === '' ? 'vacío' : v} en ${POSICIONES[i]}`).join(', ')}`
  return svg(4 * CW + 8, 120, partes.join(''), alt)
}

/**
 * El número y la posición de la cifra por la que se pregunta, que no se repite en el número. Más fácil: sin ceros y la
 * cifra en UM o C. Más difícil: con un cero y la cifra en C o D, las del medio, que más se confunden.
 */
function cifraPorValorar(azar: Azar, nivel: Nivel): { c: number[]; p: number } {
  if (nivel === 1) return { c: barajar(azar, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4), p: entero(azar, 0, 1) }
  if (nivel === 3) {
    const [um, ...resto] = barajar(azar, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4)
    const c = [um, ...resto.slice(0, 2)]
    c.splice(entero(azar, 1, 3), 0, 0)
    return { c, p: elegir(azar, [1, 2].filter((i) => c[i] !== 0)) }
  }
  const c = hasta(() => {
    const x = [entero(azar, 1, 9), entero(azar, 0, 9), entero(azar, 0, 9), entero(azar, 0, 9)]
    return new Set(x).size === 4 ? x : null
  })
  const p = hasta(() => {
    const i = entero(azar, 0, 2)
    return c[i] !== 0 ? i : null
  })
  return { c, p }
}

export const tablero: TipoPregunta = {
  id: 'tablero',
  nombre: 'Tablero de valor posicional',
  queHacen: 'Ubican cada cifra en el tablero (UM, C, D, U) y dicen cuánto vale según su posición.',
  citas: { [P4]: 'el valor posicional de un dígito en números de cuatro cifras' },
  area: 'matematica',
  competencia: 1,
  cambia: 'numeros',
  niveles: true,
  generar({ azar, nivel = 2 }) {
    const modo = azar()
    if (modo < 0.4) {
      // ¿Cuánto vale la cifra…? La cifra elegida no se repite en el número.
      const { c, p } = cifraPorValorar(azar, nivel)
      const d = c[p]
      const v = d * 10 ** (3 - p)
      const n = deCifras(c)
      // Más difícil, también los errores de leer desde esa cifra (en 3605, «el 6 vale 605») o hasta ella (3600).
      const finos = nivel === 3 ? [num(n % 10 ** (4 - p)), num(n - (n % 10 ** (3 - p)))] : []
      // Los errores son confundir la posición: la cifra sola o con un cero de más o de menos.
      const alt = alternativas(azar, num(v), [...finos, ...[0, 1, 2, 3].map((k) => num(d * 10 ** k))], 4)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `valor:${deCifras(c)}:${p}`,
        enunciado: `Observa el número ${num(deCifras(c))} en el tablero.`,
        dibujo: dibujoTablero(c),
        pregunta: `¿Cuánto vale la cifra ${d}?`,
        ...alt,
        pasos: [`En ${num(deCifras(c))}, el ${d} está en las ${UNIDADES[p][1]} (${POSICIONES[p]})`, `Vale ${d} × ${num(VALOR_POS[p])} = ${num(v)}`],
      }
    }
    if (modo < 0.7) {
      const c = numeroDeNivel(azar, nivel)
      const n = deCifras(c)
      const alt = alternativas(azar, num(n), lecturasMal(n, nivel), 4)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `fichas:${n}`,
        enunciado: 'Observa las fichas en el tablero de valor posicional.',
        dibujo: dibujoTablero(c, true),
        pregunta: '¿Qué número se formó?',
        ...alt,
        pasos: [`Fichas: ${porPosicion(c)}`, ...ceroEn(c, (l) => `En ${l} no hay fichas: se escribe 0`), sumaDeValores(c)],
      }
    }
    const c = numeroDeNivel(azar, nivel, 9)
    const n = deCifras(c)
    const respuesta = POSICIONES.map((p, i) => `${p}: ${c[i]}`).join(' · ')
    return {
      forma: 'abierta',
      clave: `escribe:${n}`,
      enunciado: `Escribe cada cifra del número ${num(n)} en su lugar del tablero.`,
      dibujo: dibujoTablero(['', '', '', '']),
      respuesta,
      espacio: 'dibujo',
      pasos: [desglose(c), `En el tablero va ${respuesta}`],
    }
  },
}

export const TIPOS_NUMEROS = [dineroContar, dineroFalta, abaco, baseDiez, tablero]
