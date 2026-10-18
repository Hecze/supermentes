// Tipos de pregunta de números de cuatro cifras (4.º de primaria), con dibujos: el dinero del Perú, el ábaco, el
// material Base Diez y el tablero de valor posicional. Cada versión trae otros números, y las alternativas
// incorrectas son los errores que más cometen los alumnos (olvidar las monedas, saltarse el cero, leer al revés).
import { entero } from '../../juegos/motor/azar'
import { distractores, num } from '../../juegos/matematica/formato'
import { CLARO, GRIS, TINTA, casilla, circulo, elipse, grupo, linea, poligono, rect, svg, texto } from '../dibujos'
import type { Azar, Dibujo, TipoPregunta } from '../tipos'
import { alternativas, nombre, soles } from '../util'

const P4 = 'primaria-4'

/** Algunos generadores descartan casos feos y vuelven a intentar. */
export function hasta<T>(intento: () => T | null): T {
  for (let i = 0; i < 60; i++) {
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

// ---------- El dinero del Perú ----------

const BILLETES: Record<number, { fondo: string; borde: string }> = {
  200: { fondo: '#eadcf2', borde: '#6f4a8c' },
  100: { fondo: '#d6e2f5', borde: '#36598f' },
  50: { fondo: '#f6d6d2', borde: '#a34a3f' },
  20: { fondo: '#f8e1c6', borde: '#9a5b1c' },
  10: { fondo: '#d8eedd', borde: '#3c7a4e' },
}

const BW = 150
const BH = 74

function billete(valor: number) {
  const b = BILLETES[valor]
  const v = String(valor)
  return [
    rect(0, 0, BW, BH, { relleno: b.fondo, trazo: TINTA, grosor: 1.6, redondeo: 6 }),
    rect(5, 5, BW - 10, BH - 10, { trazo: b.borde, grosor: 0.8, redondeo: 4 }),
    texto(13, 26, 'S/', { tam: 13, peso: 700, ancla: 'start', color: b.borde }),
    texto(31, 26, v, { tam: 24, peso: 700, ancla: 'start' }),
    // Medallón con una silueta, para que se lea como billete.
    circulo(112, 36, 21, { relleno: '#ffffff', trazo: b.borde, grosor: 1.2 }),
    circulo(112, 30, 7, { relleno: CLARO, trazo: b.borde, grosor: 1 }),
    `<path d="M98,50 Q112,36 126,50" fill="${CLARO}" stroke="${b.borde}" stroke-width="1"/>`,
    texto(13, BH - 16, v, { tam: 15, peso: 700, ancla: 'start', color: b.borde }),
  ].join('')
}

const MONEDAS: Record<number, { r: number; anillo: string; centro: string }> = {
  5: { r: 31, anillo: '#e3cf86', centro: '#d9d9d9' },
  2: { r: 28, anillo: '#d9d9d9', centro: '#e3cf86' },
  1: { r: 27, anillo: '#dcdcdc', centro: '#dcdcdc' },
}

function moneda(valor: number) {
  const m = MONEDAS[valor]
  return [
    circulo(0, 0, m.r, { relleno: m.anillo, grosor: 1.6 }),
    circulo(0, 0, m.r * 0.7, { relleno: m.centro, trazo: GRIS, grosor: 1 }),
    texto(0, 1, `S/ ${valor}`, { tam: 16, peso: 700 }),
  ].join('')
}

/** Billetes de mayor a menor, de tres en tres, y debajo las monedas, como en las fichas del MINEDU. */
export function dibujoDinero(billetes: number[], monedas: number[]): Dibujo {
  const POR_FILA = 3
  const GAP = 14
  const filas = Math.ceil(billetes.length / POR_FILA)
  const partes: string[] = []
  billetes.forEach((b, i) => partes.push(grupo(billete(b), (i % POR_FILA) * (BW + GAP) + 4, Math.floor(i / POR_FILA) * (BH + 12) + 4)))
  const yMonedas = filas * (BH + 12) + 4 + 32
  monedas.forEach((m, i) => partes.push(grupo(moneda(m), 4 + 32 + i * 76, yMonedas)))
  const ancho = Math.max(Math.min(billetes.length, POR_FILA) * (BW + GAP) - GAP, monedas.length * 76) + 8
  const alto = yMonedas + (monedas.length ? 36 : -32) + 4
  const cuenta = (xs: number[], cosa: string) =>
    [...new Set(xs)].map((v) => `${xs.filter((x) => x === v).length} ${cosa} de S/ ${v}`).join(', ')
  return svg(ancho, alto, partes.join(''), `${cuenta(billetes, 'billetes')}; ${cuenta(monedas, 'monedas')}`)
}

type Bolsillo = { billetes: number[]; monedas: number[]; total: number; enMonedas: number }

/** Un montón de dinero de 4 cifras: varios billetes de 3 o más valores y algunas monedas. */
function bolsillo(azar: Azar, min = 1000, max = 2999): Bolsillo {
  return hasta(() => {
    const cant: Record<number, number> = { 200: entero(azar, 2, 7), 100: entero(azar, 0, 3), 50: entero(azar, 0, 2), 20: entero(azar, 0, 2), 10: entero(azar, 0, 2) }
    const billetes = [200, 100, 50, 20, 10].flatMap((v) => Array(cant[v]).fill(v))
    const monedas = [5, 2, 1].flatMap((v) => Array(entero(azar, 0, 2)).fill(v))
    const tipos = [200, 100, 50, 20, 10].filter((v) => cant[v] > 0).length
    const total = [...billetes, ...monedas].reduce((s, x) => s + x, 0)
    const enMonedas = monedas.reduce((s, x) => s + x, 0)
    if (billetes.length > 9 || tipos < 3 || monedas.length < 2 || monedas.length > 5 || total < min || total > max) return null
    return { billetes, monedas, total, enMonedas }
  })
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
  generar({ azar }) {
    const b = bolsillo(azar)
    const quien = nombre(azar)
    // Olvidar las monedas, contar un billete dos veces, equivocarse en las decenas, contar un billete de menos.
    const malas = distractores(b.total, [b.total - b.enMonedas, b.total + 200, b.total - 30, b.total + 10, b.total - 200, b.total + 100], { min: 1 })
    const alt = alternativas(azar, num(b.total), malas, 3)
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `dinero:${b.billetes.join('-')}|${b.monedas.join('-')}`,
      enunciado: `Observa el dinero que tiene ${quien}.`,
      dibujo: dibujoDinero(b.billetes, b.monedas),
      pregunta: `Ahora responde: ¿Cuánto dinero tiene ${quien}?`,
      ...alt,
      alternativas: alt.alternativas.map((a) => `S/ ${a}`),
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
  generar({ azar }) {
    const b = hasta(() => {
      const x = bolsillo(azar, 1100, 2950)
      return x.total % 1000 === 0 ? null : x
    })
    const meta = Math.ceil(b.total / 1000) * 1000
    const falta = meta - b.total
    const quien = nombre(azar)
    const cosa = azar() < 0.5 ? 'una bicicleta' : azar() < 0.5 ? 'una laptop para su familia' : 'un viaje con su familia'
    const malas = distractores(falta, [falta + b.enMonedas, falta + 10, falta - 10, falta + 100, falta - 100, b.total], { min: 1 })
    const alt = alternativas(azar, num(falta), malas, 4)
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `falta:${b.billetes.join('-')}|${b.monedas.join('-')}`,
      enunciado: `${quien} está ahorrando para ${cosa}. Este es el dinero que juntó.`,
      dibujo: dibujoDinero(b.billetes, b.monedas),
      pregunta: `¿Cuánto le falta para tener ${soles(meta)}?`,
      ...alt,
      alternativas: alt.alternativas.map((a) => `S/ ${a}`),
    }
  },
}

// ---------- El ábaco ----------

const POSICIONES = ['UM', 'C', 'D', 'U']

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

export const abaco: TipoPregunta = {
  id: 'abaco',
  nombre: 'Lee el ábaco',
  queHacen: 'Leen o representan en el ábaco un número de cuatro cifras, según el valor de cada posición.',
  citas: { [P4]: 'el valor posicional de un dígito en números de cuatro cifras' },
  area: 'matematica',
  competencia: 1,
  cambia: 'numeros',
  generar({ azar }) {
    const c = numeroConCero(azar)
    const n = deCifras(c)
    if (azar() < 0.3) {
      return {
        forma: 'abierta',
        clave: `abaco:${n}`,
        enunciado: `Dibuja las cuentas en el ábaco para representar el número ${num(n)}.`,
        dibujo: dibujoAbaco(null),
        respuesta: POSICIONES.map((p, i) => `${c[i]} en ${p}`).join(', '),
        espacio: 'dibujo',
      }
    }
    const alt = alternativas(azar, num(n), distractores(n, erroresDeLectura(n), { min: 1 }).filter((x) => x.length >= 3), 4)
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `abaco:${n}`,
      enunciado: 'Observa el ábaco.',
      dibujo: dibujoAbaco(c),
      pregunta: '¿Qué número representa?',
      ...alt,
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

export const baseDiez: TipoPregunta = {
  id: 'base-diez',
  nombre: 'Material Base Diez',
  queHacen: 'Leen números formados con cubos de mil, placas de cien, barras de diez y cubitos, o dicen sus equivalencias.',
  citas: { [P4]: 'La unidad de millar como unidad del sistema de numeración decimal, sus equivalencias entre unidades menores' },
  area: 'matematica',
  competencia: 1,
  cambia: 'numeros',
  generar({ azar }) {
    if (azar() < 0.3) {
      const cubos = entero(azar, 2, 4)
      const que = azar() < 0.5 ? { cosa: 'placas de 100', vale: 10 } : { cosa: 'barras de 10', vale: 100 }
      const r = cubos * que.vale
      const alt = alternativas(azar, num(r), distractores(r, [cubos, cubos * que.vale * 10, cubos * 1000, cubos + que.vale], { min: 1 }), 4)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `equivale:${cubos}:${que.vale}`,
        enunciado: `Observa: son ${cubos} cubos de 1000 del material Base Diez.`,
        dibujo: dibujoBaseDiez([cubos, 0, 0, 0]),
        pregunta: `¿Cuántas ${que.cosa} necesitas para formar la misma cantidad?`,
        ...alt,
      }
    }
    const c = [entero(azar, 1, 3), entero(azar, 0, 6), entero(azar, 0, 9), entero(azar, 0, 9)]
    if (c[1] + c[2] + c[3] < 6) return null
    const n = deCifras(c)
    const alt = alternativas(azar, num(n), distractores(n, erroresDeLectura(n), { min: 1 }).filter((x) => x.length >= 3), 4)
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `base10:${n}`,
      enunciado: 'Observa el material Base Diez: cubos de 1000, placas de 100, barras de 10 y cubitos de 1.',
      dibujo: dibujoBaseDiez(c),
      pregunta: '¿Qué número se formó?',
      ...alt,
    }
  },
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

export const tablero: TipoPregunta = {
  id: 'tablero',
  nombre: 'Tablero de valor posicional',
  queHacen: 'Ubican cada cifra en el tablero (UM, C, D, U) y dicen cuánto vale según su posición.',
  citas: { [P4]: 'el valor posicional de un dígito en números de cuatro cifras' },
  area: 'matematica',
  competencia: 1,
  cambia: 'numeros',
  generar({ azar }) {
    const modo = azar()
    if (modo < 0.4) {
      // ¿Cuánto vale la cifra…? La cifra elegida no se repite en el número.
      const c = hasta(() => {
        const x = [entero(azar, 1, 9), entero(azar, 0, 9), entero(azar, 0, 9), entero(azar, 0, 9)]
        return new Set(x).size === 4 ? x : null
      })
      const p = hasta(() => {
        const i = entero(azar, 0, 2)
        return c[i] !== 0 ? i : null
      })
      const d = c[p]
      const v = d * 10 ** (3 - p)
      // Los errores son confundir la posición: la cifra sola o con un cero de más o de menos.
      const alt = alternativas(azar, num(v), [0, 1, 2, 3].map((k) => num(d * 10 ** k)), 4)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `valor:${deCifras(c)}:${p}`,
        enunciado: `Observa el número ${num(deCifras(c))} en el tablero.`,
        dibujo: dibujoTablero(c),
        pregunta: `¿Cuánto vale la cifra ${d}?`,
        ...alt,
      }
    }
    if (modo < 0.7) {
      const c = numeroConCero(azar)
      const n = deCifras(c)
      const alt = alternativas(azar, num(n), distractores(n, erroresDeLectura(n), { min: 1 }).filter((x) => x.length >= 3), 4)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `fichas:${n}`,
        enunciado: 'Observa las fichas en el tablero de valor posicional.',
        dibujo: dibujoTablero(c, true),
        pregunta: '¿Qué número se formó?',
        ...alt,
      }
    }
    const c = numeroConCero(azar)
    const n = deCifras(c)
    return {
      forma: 'abierta',
      clave: `escribe:${n}`,
      enunciado: `Escribe cada cifra del número ${num(n)} en su lugar del tablero.`,
      dibujo: dibujoTablero(['', '', '', '']),
      respuesta: POSICIONES.map((p, i) => `${p}: ${c[i]}`).join(' · '),
      espacio: 'dibujo',
    }
  },
}

export const TIPOS_NUMEROS = [dineroContar, dineroFalta, abaco, baseDiez, tablero]
