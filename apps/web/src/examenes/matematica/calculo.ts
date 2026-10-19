// Las prácticas de cálculo de los juegos (juegos/matematica/habilidades.ts) como preguntas de examen: ya generan
// números al azar con los errores típicos como distractores, y cada nivel trae la cita del desempeño de cada grado.
import type { Fraccion } from '../../api'
import { frac, num, valor } from '../../juegos/matematica/formato'
import { habilidadPorId } from '../../juegos/matematica/habilidades'
import type { Reto } from '../../juegos/tipos'
import { TINTA, el, svg } from '../dibujos'
import type { Dibujo, TipoPregunta } from '../tipos'
import { alternativas } from '../util'

// ---------- Pasos de resolución (clave del docente) ----------
// Se leen del reto ya generado (consigna, pregunta, dibujo y respuesta), sin tocar las prácticas de los juegos. Cada
// función vuelve a hacer la cuenta con los números que lee y devuelve null si no le cuadra con la respuesta: entonces
// queda un solo paso seguro con la respuesta.

type Pasos = (r: Reto) => string[] | null

/** "a", "a y b", "a, b y c" (o "a, b ni c"). */
const y = (xs: string[], conjuncion = 'y') => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} ${conjuncion} ${xs[xs.length - 1]}` : xs[0])

/** Las cifras de un entero, de las unidades hacia arriba. */
const cifras = (n: number) => String(n).split('').reverse().map(Number)

const COLUMNAS = ['Unidades', 'Decenas', 'Centenas', 'Unidades de millar', 'Decenas de millar', 'Centenas de millar']
const LUGARES = ['unidades', 'decenas', 'centenas', 'unidades de millar', 'decenas de millar', 'centenas de millar']
const SIGLAS = ['U', 'D', 'C', 'UM', 'DM', 'CM']

/** "345 + 278 = ?" → [345, '+', 278]. */
function operacion(pregunta: string): [number, string, number] | null {
  const m = /^(.+?) ([+−×÷]) (.+?) = \?$/.exec(pregunta)
  const a = m && valor(m[1])
  const b = m && valor(m[3])
  return m && a !== null && b !== null ? [a, m[2], b] : null
}

const naturales = (...xs: number[]) => xs.every((x) => Number.isInteger(x) && x >= 0)

/** "Unidades: 5 + 8 = 13; escribo 3 y llevo 1", solo en las columnas donde se lleva. */
const sumar: Pasos = (r) => {
  const o = operacion(r.pregunta)
  if (!o || o[1] !== '+' || !naturales(o[0], o[2]) || o[0] + o[2] !== valor(r.respuesta)) return null
  const [a, , b] = o
  const [ca, cb] = [cifras(a), cifras(b)]
  const llevadas: string[] = []
  let lleva = 0
  for (let i = 0; i < Math.max(ca.length, cb.length); i++) {
    const sumandos = [ca[i], cb[i], lleva || undefined].filter((x): x is number => x !== undefined)
    const t = sumandos.reduce((s, x) => s + x, 0)
    if (t >= 10) llevadas.push(`${COLUMNAS[i]}: ${sumandos.join(' + ')} = ${t}; escribo ${t % 10} y llevo 1`)
    lleva = t >= 10 ? 1 : 0
  }
  const final = `${num(a)} + ${num(b)} = ${num(a + b)}`
  return llevadas.length <= 3 ? [...llevadas, final] : [final]
}

/** "Se canjea 1 D por 10 U y 1 C por 10 D", donde la cifra de arriba no alcanza. */
const restar: Pasos = (r) => {
  const o = operacion(r.pregunta)
  if (!o || o[1] !== '−' || !naturales(o[0], o[2], o[0] - o[2]) || o[0] - o[2] !== valor(r.respuesta)) return null
  const [a, , b] = o
  const [ca, cb] = [cifras(a), cifras(b)]
  const canjes: string[] = []
  let presta = 0
  for (let i = 0; i < ca.length; i++) {
    const falta = ca[i] - presta < (cb[i] ?? 0)
    if (falta) canjes.push(`1 ${SIGLAS[i + 1]} por 10 ${SIGLAS[i]}`)
    presta = falta ? 1 : 0
  }
  const final = `${num(a)} − ${num(b)} = ${num(a - b)}`
  return canjes.length ? [`Se canjea ${y(canjes)}`, final] : [final]
}

const multiplicar: Pasos = (r) => {
  const o = operacion(r.pregunta)
  if (!o || o[1] !== '×' || o[0] * o[2] !== valor(r.respuesta)) return null
  return [`${num(o[0])} × ${num(o[2])} = ${num(o[0] * o[2])}`]
}

const dividir: Pasos = (r) => {
  const o = operacion(r.pregunta)
  if (!o || o[1] !== '÷' || o[2] === 0) return null
  const [a, , d] = o
  const q = a / d
  if (!Number.isInteger(q) || q !== valor(r.respuesta)) return null
  return [`¿Qué número por ${num(d)} da ${num(a)}? ${num(d)} × ${num(q)} = ${num(a)}`, `${num(a)} ÷ ${num(d)} = ${num(q)}`]
}

/** "4 UM + 3 C + 5 U": lo que vale cada parte, los lugares vacíos con 0 y la suma. */
const valorPosicional: Pasos = (r) => {
  const partes = r.pregunta.split(' + ').map((p) => /^(\d+) (U|D|C|UM|DM|CM)$/.exec(p))
  if (!partes.length || partes.some((p) => !p)) return null
  const piezas = partes.map((p) => ({ d: Number(p![1]), k: SIGLAS.indexOf(p![2]) }))
  const total = piezas.reduce((s, x) => s + x.d * 10 ** x.k, 0)
  if (total !== valor(r.respuesta)) return null
  const alto = Math.max(...piezas.map((x) => x.k))
  const vacios = LUGARES.slice(0, alto).filter((_, k) => !piezas.some((x) => x.k === k)).reverse()
  return [
    piezas.map((x) => `${x.d} ${SIGLAS[x.k]} = ${num(x.d * 10 ** x.k)}`).join('; '),
    ...(vacios.length ? [`No hay ${y(vacios, 'ni')}: en ${vacios.length > 1 ? 'esos lugares' : 'ese lugar'} va 0`] : []),
    piezas.length > 1 ? `${piezas.map((x) => num(x.d * 10 ** x.k)).join(' + ')} = ${num(total)}` : `Se escribe ${num(total)}`,
  ]
}

/** Se mira de izquierda a derecha hasta la primera cifra distinta. */
const comparar: Pasos = (r) => {
  const lados = r.pregunta.split('▢').map((t) => valor(t))
  if (lados.length !== 2 || lados.some((x) => x === null || !Number.isInteger(x) || x < 0)) return null
  const [a, b] = lados as number[]
  const signo = a > b ? '>' : a < b ? '<' : '='
  if (signo !== r.respuesta) return null
  const final = `${num(a)} ${signo} ${num(b)}`
  if (a === b) return [`Tienen las mismas cifras en el mismo lugar: ${final}`]
  const [ta, tb] = [String(a), String(b)]
  if (ta.length !== tb.length) return [`${num(a)} tiene ${ta.length} cifras y ${num(b)} tiene ${tb.length}`, final]
  const i = [...ta].findIndex((c, k) => c !== tb[k])
  const lugar = (k: number) => LUGARES[ta.length - 1 - k]
  const cifra = `${ta[i]} ${ta[i] > tb[i] ? '>' : '<'} ${tb[i]}`
  const iguales = Array.from({ length: i }, (_, k) => lugar(k))
  return [i === 0 ? `Primero se comparan las ${lugar(0)}: ${cifra}` : `Son iguales las ${y(iguales)}; en las ${lugar(i)}: ${cifra}`, final]
}

/** "347 está entre 340 y 350", "Está más cerca de 350". */
const redondeo: Pasos = (r) => {
  const a = /decena/.test(r.consigna ?? '') ? 10 : /centena/.test(r.consigna ?? '') ? 100 : /millar/.test(r.consigna ?? '') ? 1000 : null
  const n = valor(r.pregunta)
  const res = valor(r.respuesta)
  if (!a || n === null || !Number.isInteger(n) || n % a === 0) return null
  const abajo = Math.floor(n / a) * a
  const arriba = abajo + a
  const medio = n - abajo === arriba - n
  if (res !== (medio || arriba - n < n - abajo ? arriba : abajo)) return null
  return [`${num(n)} está entre ${num(abajo)} y ${num(arriba)}`, medio ? `Está justo en medio: se redondea hacia arriba, a ${num(res)}` : `Está más cerca de ${num(res)}`]
}

const doblesMitades: Pasos = (r) => {
  const m = /^(Doble|Mitad) de (.+?) = \?$/.exec(r.pregunta)
  const n = m && valor(m[2])
  const res = valor(r.respuesta)
  if (!m || n === null || res === null) return null
  if (m[1] === 'Doble') return n * 2 === res ? [`Doble de ${num(n)}: ${num(n)} + ${num(n)} = ${num(res)}`] : null
  return res * 2 === n ? [`Mitad de ${num(n)}: ${num(n)} ÷ 2 = ${num(res)}`] : null
}

/** La fracción pintada del círculo (el dibujo del reto). */
const fraccionPintada: Pasos = (r) => {
  if (r.visual?.tipo !== 'fraccion') return null
  const [k, n] = r.visual.partes
  if (frac(k, n) !== r.respuesta) return null
  return [`El círculo está partido en ${n} partes iguales`, `${k} de ${n} partes ${k === 1 ? 'está pintada' : 'están pintadas'}: ${frac(k, n)}`]
}

/** "1/3 de 24": se reparte en 3 partes iguales y se toman las partes que pide el numerador. */
const fraccionDe: Pasos = (r) => {
  const m = /^(\d+)\/(\d+) de (.+?) = \?$/.exec(r.pregunta)
  const n = m && valor(m[3])
  if (!m || n === null) return null
  const [a, b] = [Number(m[1]), Number(m[2])]
  const parte = n / b
  if (!Number.isInteger(parte) || a * parte !== valor(r.respuesta)) return null
  if (a === 1) return [`Se reparte ${num(n)} en ${b} partes iguales`, `${num(n)} ÷ ${b} = ${num(parte)}`]
  return [`Se reparte ${num(n)} en ${b} partes iguales: ${num(n)} ÷ ${b} = ${num(parte)}`, `Se toman ${a} partes: ${a} × ${num(parte)} = ${num(a * parte)}`]
}

/** "2/3 = ?/12": por cuánto se multiplicó el denominador (o el numerador), y lo mismo al otro. */
const equivalentes: Pasos = (r) => {
  const m = /^(\d+)\/(\d+) = (\?|\d+)\/(\?|\d+)$/.exec(r.pregunta)
  if (!m || (m[3] === '?') === (m[4] === '?')) return null
  const [a, b] = [Number(m[1]), Number(m[2])]
  const res = valor(r.respuesta)
  if (res === null) return null
  if (m[3] === '?') {
    const d = Number(m[4])
    const k = d / b
    if (!Number.isInteger(k) || a * k !== res) return null
    return [`El denominador se multiplicó por ${k}: ${b} × ${k} = ${d}`, `El numerador también: ${a} × ${k} = ${res}`, `${frac(a, b)} = ${frac(res, d)}`]
  }
  const n = Number(m[3])
  const k = n / a
  if (!Number.isInteger(k) || b * k !== res) return null
  return [`El numerador se multiplicó por ${k}: ${a} × ${k} = ${n}`, `El denominador también: ${b} × ${k} = ${res}`, `${frac(a, b)} = ${frac(n, res)}`]
}

/** Con el mismo denominador se suman o restan los numeradores; con distinto, solo el resultado. */
const operarFracciones: Pasos = (r) => {
  const m = /^(\d+)\/(\d+) ([+−]) (\d+)\/(\d+) = \?$/.exec(r.pregunta)
  if (!m || m[2] !== m[5]) return null
  const [x, d, z] = [Number(m[1]), Number(m[2]), Number(m[4])]
  const suma = m[3] === '+'
  const n = suma ? x + z : x - z
  if (frac(n, d) !== r.respuesta) return null
  return [
    `Mismo denominador: se ${suma ? 'suman' : 'restan'} los numeradores, ${x} ${m[3]} ${z} = ${n}`,
    `El denominador queda igual: ${frac(x, d)} ${m[3]} ${frac(z, d)} = ${frac(n, d)}`,
  ]
}

/** El término desconocido, con la operación inversa. */
const ecuacion: Pasos = (r) => {
  const res = valor(r.respuesta)
  if (res === null) return null
  let m = /^x \+ (\d+) = (\d+)$/.exec(r.pregunta)
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])]
    return b - a === res ? [`¿Qué número más ${a} da ${b}? Se resta: ${b} − ${a} = ${b - a}`, `x = ${num(res)}`] : null
  }
  m = /^x − (\d+) = (\d+)$/.exec(r.pregunta)
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])]
    return b + a === res ? [`¿Qué número menos ${a} da ${b}? Se suma: ${b} + ${a} = ${b + a}`, `x = ${num(res)}`] : null
  }
  m = /^(\d+)x = (\d+)$/.exec(r.pregunta)
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])]
    return b / a === res ? [`¿Qué número por ${a} da ${b}? Se divide: ${b} ÷ ${a} = ${num(res)}`, `x = ${num(res)}`] : null
  }
  m = /^(\d+)x \+ (\d+) = (\d+)$/.exec(r.pregunta)
  if (m) {
    const [a, b, c] = [Number(m[1]), Number(m[2]), Number(m[3])]
    if ((c - b) / a !== res) return null
    return [`Primero se resta ${b}: ${c} − ${b} = ${c - b}, entonces ${a}x = ${c - b}`, `Luego se divide: ${c - b} ÷ ${a} = ${num(res)}`, `x = ${num(res)}`]
  }
  return null
}

/** La regla del patrón (suma, resta o multiplica siempre lo mismo) y el número que sigue. */
const secuencia: Pasos = (r) => {
  const t = r.pregunta.replace(/, \?$/, '').split(', ').map((x) => valor(x))
  if (t.length < 3 || t.some((x) => x === null)) return null
  const n = t as number[]
  const pares = n.slice(1).map((x, i) => [n[i], x])
  const ultimo = n[n.length - 1]
  const res = valor(r.respuesta)
  const paso = n[1] - n[0]
  let regla: string
  let cuenta: (x: number) => string
  if (paso !== 0 && pares.every(([p, q]) => q - p === paso)) {
    if (ultimo + paso !== res) return null
    const s = paso > 0 ? '+' : '−'
    regla = `${paso > 0 ? 'sumar' : 'restar'} ${num(Math.abs(paso))}`
    cuenta = (x) => `${num(x)} ${s} ${num(Math.abs(paso))} = ${num(x + paso)}`
  } else {
    const f = n[0] ? n[1] / n[0] : 0
    if (!Number.isInteger(f) || f < 2 || !pares.every(([p, q]) => p * f === q) || ultimo * f !== res) return null
    regla = `multiplicar por ${f}`
    cuenta = (x) => `${num(x)} × ${f} = ${num(x * f)}`
  }
  const primero = `La regla es ${regla}: ${pares.map(([p]) => cuenta(p)).join('; ')}`
  return [primero.length <= 90 ? primero : `La regla es ${regla}`, `Sigue: ${cuenta(ultimo)}`]
}

const EQUIVALENCIAS: Record<string, [string, number]> = { m: ['cm', 100], kg: ['g', 1000], h: ['min', 60] }

/** Conversiones de longitud, masa y tiempo, y vasos de medio o cuarto de litro. */
const medidas: Pasos = (r) => {
  const res = valor(r.respuesta)
  if (res === null) return null
  let m = /^(\d+) h (\d+) min = \? min$/.exec(r.pregunta)
  if (m) {
    const [h, mi] = [Number(m[1]), Number(m[2])]
    if (h * 60 + mi !== res) return null
    return [h === 1 ? '1 h = 60 min' : `1 h = 60 min, entonces ${h} h = ${h} × 60 = ${h * 60} min`, `${h * 60} min + ${mi} min = ${num(res)} min`]
  }
  m = /^(.+?) (m|kg|h) = \? (cm|g|min)$/.exec(r.pregunta)
  if (m && EQUIVALENCIAS[m[2]]?.[0] === m[3]) {
    const n = valor(m[1])
    const f = EQUIVALENCIAS[m[2]][1]
    if (n === null || n * f !== res) return null
    return [`1 ${m[2]} = ${num(f)} ${m[3]}`, `${num(n)} ${m[2]} = ${num(n)} × ${num(f)} = ${num(res)} ${m[3]}`]
  }
  m = /^(.+?) (cm|g|min) = \? (m|kg|h)$/.exec(r.pregunta)
  if (m && EQUIVALENCIAS[m[3]]?.[0] === m[2]) {
    const n = valor(m[1])
    const f = EQUIVALENCIAS[m[3]][1]
    if (n === null || n / f !== res) return null
    return [`1 ${m[3]} = ${num(f)} ${m[2]}`, `${num(n)} ${m[2]} = ${num(n)} ÷ ${num(f)} = ${num(res)} ${m[3]}`]
  }
  m = /^¿Cuántos vasos de 1\/(\d+) L llenan (\d+) L\?$/.exec(r.pregunta)
  if (m) {
    const [porLitro, litros] = [Number(m[1]), Number(m[2])]
    if (porLitro * litros !== res) return null
    return [`1 L = ${porLitro} vasos de ${frac(1, porLitro)} L`, `${litros} L: ${litros} × ${porLitro} = ${num(res)} vasos`]
  }
  return null
}

const PASOS: Record<string, Pasos> = {
  'valor-posicional': valorPosicional,
  comparar,
  redondeo,
  secuencias: secuencia,
  sumar,
  restar,
  tablas: multiplicar,
  dividir,
  'dobles-mitades': doblesMitades,
  'fracciones-reconocer': fraccionPintada,
  'fraccion-de': fraccionDe,
  'fracciones-equivalentes': equivalentes,
  'fracciones-operar': operarFracciones,
  ecuaciones: ecuacion,
  medidas,
}

/**
 * Los pasos de un reto de la práctica. Si la habilidad no tiene cómo deducirlos (o algo no cuadra), un solo paso con
 * la respuesta: el ejercicio resuelto ("7 × 8 = 56") o "Respuesta: …".
 */
export function pasosDe(habilidad: string, r: Reto): string[] {
  const p = PASOS[habilidad]?.(r)
  if (p && p.length >= 1 && p.length <= 4 && p[p.length - 1].includes(r.respuesta)) return p
  return /(^|\s)\?(\s|$)/.test(r.pregunta) ? [r.pregunta.replace(/(^|\s)\?(\s|$)/, `$1${r.respuesta}$2`)] : [`Respuesta: ${r.respuesta}`]
}

/** Un círculo partido en n partes con k pintadas (las fracciones de los juegos). */
export function dibujoPastel([k, n]: Fraccion): Dibujo {
  const R = 62
  const c = R + 4
  const partes =
    n <= 1
      ? el('circle', { cx: c, cy: c, r: R, fill: k >= 1 ? '#9a9a9a' : '#fff', stroke: TINTA, 'stroke-width': 2 })
      : Array.from({ length: n }, (_, i) => {
          const a0 = (i / n) * 2 * Math.PI - Math.PI / 2
          const a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2
          const d = `M${c},${c} L${(c + R * Math.cos(a0)).toFixed(1)},${(c + R * Math.sin(a0)).toFixed(1)} A${R},${R} 0 0 1 ${(c + R * Math.cos(a1)).toFixed(1)},${(c + R * Math.sin(a1)).toFixed(1)} Z`
          return el('path', { d, fill: i < k ? '#9a9a9a' : '#fff', stroke: TINTA, 'stroke-width': 2, 'stroke-linejoin': 'round' })
        }).join('')
  return svg(2 * c, 2 * c, partes, `Círculo partido en ${n} partes iguales con ${k} pintadas`)
}

/**
 * Un tipo de pregunta a partir de un nivel de práctica. Solo se ofrece en los grados donde ese nivel tiene cita.
 * `enunciado`: lo que se lee antes del ejercicio, cuando la consigna sola queda corta.
 */
export function deCalculo(o: { id: string; habilidad: string; nivel: string; nombre: string; queHacen: string; enunciado?: string }): TipoPregunta {
  const h = habilidadPorId(o.habilidad)
  const nivel = h?.niveles.find((n) => n.nombre === o.nivel)
  if (!h || !nivel) throw new Error(`No existe la práctica ${o.habilidad} · ${o.nivel}`)
  return {
    id: o.id,
    nombre: o.nombre,
    queHacen: o.queHacen,
    citas: nivel.citas,
    area: 'matematica',
    cambia: 'numeros',
    generar({ azar }) {
      const r = nivel.generar(azar)
      const alt = alternativas(azar, r.respuesta, r.distractores, 4)
      if (!alt) return null
      const dibujo = r.visual?.tipo === 'fraccion' ? dibujoPastel(r.visual.partes) : undefined
      if (r.visual && !dibujo) return null
      return {
        forma: 'opciones',
        clave: `${o.id}:${r.consigna ?? ''}|${r.pregunta}|${r.visual ? JSON.stringify(r.visual) : ''}`,
        // Sin consigna ("7 × 8 = ?"), el ejercicio mismo va como enunciado.
        enunciado: o.enunciado ?? r.consigna ?? r.pregunta,
        dibujo,
        pregunta: o.enunciado ? [r.consigna, r.pregunta].filter(Boolean).join(': ') : r.consigna ? r.pregunta || undefined : undefined,
        ...alt,
        pasos: pasosDe(o.habilidad, r),
      }
    },
  }
}

export const TIPOS_CALCULO = [
  deCalculo({ id: 'calc-valor-posicional', habilidad: 'valor-posicional', nivel: 'Millares', nombre: '¿Qué número es?', queHacen: 'Juntan millares, centenas, decenas y unidades en un solo número.' }),
  deCalculo({ id: 'calc-comparar', habilidad: 'comparar', nivel: 'Hasta 10 000', nombre: 'Mayor, menor o igual', queHacen: 'Comparan dos números de cuatro cifras y eligen el signo >, < o =.' }),
  deCalculo({ id: 'calc-redondeo-decena', habilidad: 'redondeo', nivel: 'A la decena', nombre: 'Redondea a la decena', queHacen: 'Redondean un número a la decena más cercana.' }),
  deCalculo({ id: 'calc-redondeo-centena', habilidad: 'redondeo', nivel: 'A la centena', nombre: 'Redondea a la centena', queHacen: 'Redondean un número a la centena más cercana.' }),
  deCalculo({ id: 'calc-sumar', habilidad: 'sumar', nivel: 'Hasta 10 000', nombre: 'Suma', queHacen: 'Suman números de hasta cuatro cifras.' }),
  deCalculo({ id: 'calc-restar', habilidad: 'restar', nivel: 'Hasta 10 000', nombre: 'Resta', queHacen: 'Restan números de hasta cuatro cifras.' }),
  deCalculo({ id: 'calc-tablas', habilidad: 'tablas', nivel: 'Todas', nombre: 'Multiplica', queHacen: 'Resuelven multiplicaciones de las tablas del 2 al 10.' }),
  deCalculo({ id: 'calc-dividir', habilidad: 'dividir', nivel: 'Todas', nombre: 'Divide', queHacen: 'Resuelven divisiones exactas entre 2 y 9.' }),
  deCalculo({ id: 'calc-dobles', habilidad: 'dobles-mitades', nivel: 'Dobles y mitades hasta 100', nombre: 'Dobles y mitades', queHacen: 'Calculan el doble o la mitad de un número.' }),
  deCalculo({ id: 'calc-fraccion-pintada', habilidad: 'fracciones-reconocer', nivel: 'Hasta octavos', nombre: '¿Qué fracción está pintada?', queHacen: 'Miran un círculo partido en partes iguales y escriben la fracción pintada.' }),
  deCalculo({ id: 'calc-fraccion-de', habilidad: 'fraccion-de', nivel: 'Mitad, tercio y cuarto', nombre: 'Mitad, tercio y cuarto', queHacen: 'Calculan la mitad, la tercera o la cuarta parte de una cantidad.' }),
  deCalculo({ id: 'calc-equivalentes', habilidad: 'fracciones-equivalentes', nivel: 'Medios, tercios y cuartos', nombre: 'Fracciones equivalentes', queHacen: 'Encuentran una fracción equivalente amplificando o simplificando.' }),
  deCalculo({ id: 'calc-sumar-fracciones', habilidad: 'fracciones-operar', nivel: 'Igual denominador', nombre: 'Suma y resta de fracciones', queHacen: 'Suman y restan fracciones con el mismo denominador.' }),
  deCalculo({ id: 'calc-ecuacion', habilidad: 'ecuaciones', nivel: 'x + a = b', nombre: 'Halla el número que falta', queHacen: 'Encuentran el término desconocido de una igualdad.' }),
  deCalculo({ id: 'calc-patron-suma', habilidad: 'secuencias', nivel: 'Sumando o restando', nombre: '¿Qué número sigue?', queHacen: 'Descubren la regla de un patrón que suma o resta y siguen la secuencia.' }),
  deCalculo({ id: 'calc-patron-multiplica', habilidad: 'secuencias', nivel: 'Multiplicando', nombre: 'Patrón que multiplica', queHacen: 'Descubren la regla de un patrón que multiplica y siguen la secuencia.' }),
  deCalculo({ id: 'calc-longitud', habilidad: 'medidas', nivel: 'Metros y centímetros', nombre: 'Convertir metros y centímetros', queHacen: 'Convierten metros a centímetros y al revés.' }),
  deCalculo({ id: 'calc-tiempo', habilidad: 'medidas', nivel: 'Horas y minutos', nombre: 'Horas y minutos', queHacen: 'Convierten horas, medias horas y cuartos de hora a minutos.' }),
  deCalculo({ id: 'calc-masa', habilidad: 'medidas', nivel: 'Kilos y gramos', nombre: 'Kilos y gramos', queHacen: 'Convierten kilogramos a gramos y al revés.' }),
  deCalculo({ id: 'calc-litro', habilidad: 'medidas', nivel: 'Medio y cuarto de litro', nombre: 'Medio y cuarto de litro', queHacen: 'Calculan cuántos vasos de medio o cuarto de litro llenan un recipiente.' }),
]
