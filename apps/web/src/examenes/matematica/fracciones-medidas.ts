// Tipos de pregunta de 4.º de primaria. Competencia 1 (cantidad), fracciones y medidas: fracciones con dibujos (la
// barra de chocolate, la chacra, las frutas, las tiras), fracción de una colección y del dinero, comparar, sumar y
// restar, equivalentes, amplificar y simplificar; el reloj de agujas y la balanza. Las alternativas incorrectas son
// los errores que más cometen los alumnos: contar las partes pintadas contra las no pintadas, sumar también los
// denominadores, creer que 1/5 es mayor que 1/3, leer «1 kg» como si fuera 1 g, confundir «y cuarto» con «menos cuarto».
//
// Dificultad (`ctx.nivel`): el 2 es la pregunta de siempre. El 1 trae menos partes o cosas, números más chicos, un paso
// menos o menos alternativas; el 3, más partes o cosas, un paso más (lo que falta, lo que queda, cuánto más), datos de
// más o sin la ayuda del dibujo. Siempre con fracciones usuales (medios, tercios, cuartos, quintos, sextos, octavos y
// décimos) y con kilogramos, gramos, horas, medias horas y cuartos de hora, como dice el desempeño de 4.º.
import { barajar, elegir, entero } from '../../juegos/motor/azar'
import { distractores, frac, mcd, num } from '../../juegos/matematica/formato'
import { CLARO, GRIS, TINTA, anchoTexto, casilla, circulo, el, grupo, linea, poligono, rect, ruta, svg, texto } from '../dibujos'
import type { Azar, Dibujo, Grupo, Nivel, TipoPregunta } from '../tipos'
import { NOMBRES, alternativas, dosNombres, nombre, soles } from '../util'
import { dibujoDinero, hasta } from './numeros'

const P4 = 'primaria-4'
const BASE = { area: 'matematica', competencia: 1, cambia: 'numeros' } as const

/** Fragmentos, letra por letra, de los desempeños de 4.º (competencia 1). */
const CITA = {
  parteTodo: 'La fracción como parte-todo (cantidad discreta o continua)',
  partir: 'partir una unidad o una colección de objetos en partes iguales y las transforma en expresiones numéricas (modelo) de fracciones usuales',
  sumar: 'las transforma en expresiones numéricas (modelo) de fracciones usuales, adición y sustracción de estas',
  sumarEquivalentes: 'operaciones de adición y sustracción entre fracciones usuales usando fracciones equivalentes',
  equivalentes: 'Realiza afirmaciones sobre las equivalencias entre fracciones y las explica con ejemplos concretos.',
  comparar: 'Asimismo, explica la comparación entre fracciones',
  amplificar: 'amplificación y simplificación de fracciones',
  masa: 'Mide, estima y compara la masa (kilogramo, gramo)',
  tiempo: 'el tiempo (año, hora, media hora y cuarto de hora)',
}

type Fr = [number, number]
const ft = ([a, b]: Fr) => frac(a, b)
const valorDe = ([a, b]: Fr) => a / b
/** Las fracciones que sirven de alternativa: numerador y denominador enteros y positivos. */
const fracciones = (xs: Fr[]) => xs.filter(([a, b]) => a > 0 && b > 0 && Number.isInteger(a) && Number.isInteger(b)).map(ft)
/** Igual, pero solo menores que la unidad y con denominador usual: las que se trabajan en 4.º (en lo nuevo de los niveles). */
const propias = (xs: Fr[]) => fracciones(xs.filter(([a, b]) => a < b && USUALES.includes(b)))

const USUALES = [2, 3, 4, 5, 6, 8, 10]
const PARTES: Record<number, string> = { 2: 'medios', 3: 'tercios', 4: 'cuartos', 5: 'quintos', 6: 'sextos', 8: 'octavos', 10: 'décimos' }
const PARTE: Record<number, string> = { 2: 'medio', 3: 'tercio', 4: 'cuarto', 5: 'quinto', 6: 'sexto', 8: 'octavo', 10: 'décimo' }

/** Varios nombres distintos. */
const nombres = (azar: Azar, n: number) => barajar(azar, NOMBRES).slice(0, n)

/** «1 parte pintada», «3 partes pintadas». */
const pl = (n: number, uno: string, varios: string) => `${num(n)} ${n === 1 ? uno : varios}`

const mayus = (s: string) => s[0].toUpperCase() + s.slice(1)

/** Las alternativas de una pregunta de este grupo. */
function conError(azar: Azar, correcta: string, candidatas: string[], cuantas = 4) {
  // alternativas() ya prioriza los errores más frecuentes de cada lado y sortea el lugar de la correcta.
  return alternativas(azar, correcta, candidatas, cuantas)
}

/** Dos fracciones equivalentes a/b = ka/kb con denominadores usuales, de la más simple a la amplificada. */
const AMPLIADAS: { base: Fr; k: number }[] = [
  { base: [1, 2], k: 2 },
  { base: [1, 2], k: 3 },
  { base: [1, 2], k: 4 },
  { base: [1, 2], k: 5 },
  { base: [1, 3], k: 2 },
  { base: [2, 3], k: 2 },
  { base: [1, 4], k: 2 },
  { base: [3, 4], k: 2 },
  { base: [1, 5], k: 2 },
  { base: [2, 5], k: 2 },
  { base: [3, 5], k: 2 },
  { base: [4, 5], k: 2 },
]

// ---------- Dibujos: tiras, chocolate, chacra, frutas ----------

const PINTADO = '#b4b4b4'

/** Rayas en diagonal dentro de un rectángulo, sin salirse de él. */
function rayas(x: number, y: number, w: number, h: number, paso = 9) {
  const out: string[] = []
  for (let c = -h + paso / 2; c < w; c += paso) {
    const t0 = Math.max(0, -c)
    const t1 = Math.min(h, w - c)
    if (t1 - t0 > 1) out.push(linea(x + c + t0, y + h - t0, x + c + t1, y + h - t1, { grosor: 1.4 }))
  }
  return out.join('')
}

/** Cómo va cada parte: vacía, pintada de gris, con rayas (la segunda parte de una suma) o pintada y tachada (lo que se quita). */
type Celda = 'vacia' | 'gris' | 'rayas' | 'tachada'

function celda(x: number, y: number, w: number, h: number, c: Celda) {
  const partes = [rect(x, y, w, h, { relleno: c === 'gris' || c === 'tachada' ? PINTADO : '#ffffff', grosor: 1.6 })]
  if (c === 'rayas') partes.push(rayas(x, y, w, h))
  if (c === 'tachada') {
    const m = Math.min(w, h) * 0.2
    partes.push(linea(x + m, y + m, x + w - m, y + h - m, { grosor: 2.6 }), linea(x + w - m, y + m, x + m, y + h - m, { grosor: 2.6 }))
  }
  return partes.join('')
}

type Subdivision = { punteadas?: number; gruesas?: number }

/**
 * Una tira partida en n partes iguales. `punteadas`: cada parte se vuelve a partir en ese número con líneas punteadas
 * (amplificar). `gruesas`: una línea gruesa cada tantas partes (simplificar: se juntan las partes).
 */
function tira(x: number, y: number, w: number, h: number, n: number, como: (i: number) => Celda, o: Subdivision = {}) {
  const cw = w / n
  const partes: string[] = []
  for (let i = 0; i < n; i++) partes.push(celda(x + i * cw, y, cw, h, como(i)))
  if (o.punteadas && o.punteadas > 1)
    for (let i = 0; i < n; i++)
      for (let k = 1; k < o.punteadas; k++) {
        const xl = x + i * cw + (k * cw) / o.punteadas
        partes.push(linea(xl, y + 3, xl, y + h - 3, { grosor: 1.8, punteado: true }))
      }
  if (o.gruesas && o.gruesas > 1) for (let i = o.gruesas; i < n; i += o.gruesas) partes.push(linea(x + i * cw, y - 6, x + i * cw, y + h + 6, { grosor: 4.5 }))
  partes.push(rect(x, y, w, h, { grosor: 2.8 }))
  return partes.join('')
}

/** Recuadros para escribir una fracción: numerador, raya y denominador. */
const plantilla = (x: number, cy: number) => casilla(x, cy - 38, 42, 32) + linea(x - 3, cy, x + 45, cy, { grosor: 2.4 }) + casilla(x, cy + 6, 42, 32)

type FilaTira = Subdivision & { izq: string; der?: string; n: number; como: (i: number) => Celda; plantilla?: boolean }

/** Tiras del mismo tamaño, una debajo de otra, con su nombre a la izquierda y, si hace falta, la fracción a la derecha. */
function dibujoTiras(filas: FilaTira[], alt: string, { ancho = 360, alto = 48, gap = 26 } = {}): Dibujo {
  const izq = Math.max(...filas.map((f) => anchoTexto(f.izq, 19) * 1.1)) + 28
  const der = Math.max(0, ...filas.map((f) => (f.plantilla ? 66 : f.der ? anchoTexto(f.der, 19) * 1.1 + 22 : 0)))
  const arriba = 12
  const partes: string[] = []
  filas.forEach((f, i) => {
    const y = arriba + i * (alto + gap)
    partes.push(texto(izq - 14, y + alto / 2, f.izq, { tam: 19, peso: 700, ancla: 'end' }))
    partes.push(tira(izq, y, ancho, alto, f.n, f.como, f))
    if (f.der) partes.push(texto(izq + ancho + 16, y + alto / 2, f.der, { tam: 19, peso: 700, ancla: 'start' }))
    if (f.plantilla) partes.push(plantilla(izq + ancho + 18, y + alto / 2))
  })
  const extra = filas[filas.length - 1].plantilla ? 16 : 0
  return svg(izq + ancho + der + 10, 2 * arriba + filas.length * alto + (filas.length - 1) * gap + extra, partes.join(''), alt)
}

/** Las primeras `k` partes pintadas de gris. */
const primeras = (k: number) => (i: number): Celda => (i < k ? 'gris' : 'vacia')

const CHOCO = '#a97c55'
const CHOCO_LUZ = '#c99c70'

/** Una barra de chocolate en filas × columnas de pedazos; los que se comieron quedan con línea punteada. */
function dibujoChocolate(filas: number, cols: number, comidas: Set<number> | null): Dibujo {
  const cw = Math.min(78, 400 / cols)
  const ch = filas === 1 ? 74 : 60
  const partes: string[] = []
  for (let r = 0; r < filas; r++)
    for (let c = 0; c < cols; c++) {
      const x = 6 + c * cw
      const y = 6 + r * ch
      if (comidas === null) partes.push(rect(x + 2, y + 2, cw - 4, ch - 4, { relleno: '#ffffff', grosor: 2, redondeo: 7 }))
      else if (comidas.has(r * cols + c)) partes.push(rect(x + 3, y + 3, cw - 6, ch - 6, { relleno: '#ffffff', grosor: 1.8, punteado: true, redondeo: 7 }))
      else partes.push(rect(x + 2, y + 2, cw - 4, ch - 4, { relleno: CHOCO, grosor: 2, redondeo: 7 }), rect(x + 11, y + 10, cw - 22, ch - 20, { relleno: CHOCO_LUZ, trazo: '#5e4128', grosor: 1.4, redondeo: 4 }))
    }
  const n = filas * cols
  const alt = comidas === null ? `Barra de chocolate partida en ${n} pedazos iguales, sin pintar` : `Barra de chocolate de ${n} pedazos iguales; faltan ${comidas.size}, marcados con línea punteada`
  return svg(cols * cw + 12, filas * ch + 12, partes.join(''), alt)
}

/** Una plantita: tallo y dos hojas. */
const plantita = (x: number, y: number) =>
  [linea(x, y + 9, x, y - 8, { grosor: 1.8 }), linea(x, y + 1, x - 7, y - 6, { grosor: 1.8 }), linea(x, y + 1, x + 7, y - 6, { grosor: 1.8 })].join('')

/** Un terreno partido en parcelas iguales; las sembradas tienen plantitas. */
function dibujoChacra(filas: number, cols: number, sembradas: Set<number>): Dibujo {
  const cw = Math.min(86, 420 / cols)
  const ch = filas === 1 ? 108 : 72
  const partes: string[] = []
  for (let r = 0; r < filas; r++)
    for (let c = 0; c < cols; c++) {
      const x = 6 + c * cw
      const y = 6 + r * ch
      const si = sembradas.has(r * cols + c)
      partes.push(rect(x, y, cw, ch, { relleno: si ? '#dcebc9' : '#f7f1e3', grosor: 1.8 }))
      if (si) {
        const pc = cw >= 70 ? 3 : 2
        const pf = ch >= 100 ? 3 : 2
        for (let i = 0; i < pc; i++) for (let j = 0; j < pf; j++) partes.push(plantita(x + ((i + 0.5) * cw) / pc, y + ((j + 0.5) * ch) / pf))
      }
    }
  partes.push(rect(6, 6, cols * cw, filas * ch, { grosor: 3 }))
  const n = filas * cols
  const alt = sembradas.size ? `Terreno partido en ${n} parcelas iguales; ${sembradas.size} tienen plantitas` : `Terreno partido en ${n} parcelas iguales, sin sembrar`
  return svg(cols * cw + 12, filas * ch + 12, partes.join(''), alt)
}

type Cosa = 'mango' | 'naranja' | 'limon' | 'canica-gris' | 'canica-blanca' | 'canica-negra' | 'huevo' | 'pan'

const NOMBRE_COSA: Record<Cosa, [string, string]> = {
  mango: ['mango', 'mangos'],
  naranja: ['naranja', 'naranjas'],
  limon: ['limón', 'limones'],
  'canica-gris': ['canica gris', 'grises'],
  'canica-blanca': ['canica blanca', 'blancas'],
  'canica-negra': ['canica negra', 'negras'],
  huevo: ['huevo', 'huevos'],
  pan: ['pan', 'panes'],
}

const rot = (g: number, x: number, y: number) => `rotate(${g} ${Math.round(x * 10) / 10} ${Math.round(y * 10) / 10})`

function cosa(t: Cosa, cx: number, cy: number) {
  switch (t) {
    case 'naranja':
      return [
        circulo(cx, cy + 2, 19, { relleno: '#f8d7a4', grosor: 1.8 }),
        linea(cx, cy - 16, cx + 1, cy - 21, { grosor: 1.8 }),
        el('ellipse', { cx: cx + 7, cy: cy - 19, rx: 7, ry: 3.5, transform: rot(-28, cx + 7, cy - 19), fill: '#a9c98a', stroke: TINTA, 'stroke-width': 1.4 }),
        circulo(cx - 6, cy - 4, 2, { relleno: '#ffffff', trazo: 'none' }),
      ].join('')
    case 'mango':
      return [
        el('ellipse', { cx, cy, rx: 24, ry: 15, transform: rot(-28, cx, cy), fill: '#a3b65a', stroke: TINTA, 'stroke-width': 1.8 }),
        linea(cx + 17, cy - 11, cx + 21, cy - 17, { grosor: 1.8 }),
      ].join('')
    case 'canica-gris':
      return circulo(cx, cy, 17, { relleno: '#8a8a8a', grosor: 1.8 }) + circulo(cx - 6, cy - 6, 4, { relleno: '#ffffff', trazo: 'none' })
    case 'canica-blanca':
      return circulo(cx, cy, 17, { relleno: '#ffffff', grosor: 1.8 }) + circulo(cx - 6, cy - 6, 4, { relleno: CLARO, trazo: 'none' })
    case 'canica-negra':
      return circulo(cx, cy, 17, { relleno: '#3a3a3a', grosor: 1.8 }) + circulo(cx - 6, cy - 6, 4, { relleno: '#ffffff', trazo: 'none' })
    case 'limon':
      // Más chico que la naranja, ovalado y con una puntita a cada lado.
      return [
        el('ellipse', { cx: cx - 17, cy, rx: 4, ry: 3, fill: '#e3eb8a', stroke: TINTA, 'stroke-width': 1.4 }),
        el('ellipse', { cx: cx + 17, cy, rx: 4, ry: 3, fill: '#e3eb8a', stroke: TINTA, 'stroke-width': 1.4 }),
        el('ellipse', { cx, cy, rx: 17, ry: 13, fill: '#e3eb8a', stroke: TINTA, 'stroke-width': 1.8 }),
        circulo(cx - 6, cy - 4, 2, { relleno: '#ffffff', trazo: 'none' }),
      ].join('')
    case 'huevo':
      return el('ellipse', { cx, cy, rx: 13, ry: 17, fill: '#fffaf0', stroke: TINTA, 'stroke-width': 1.6 })
    case 'pan':
      return [
        el('ellipse', { cx, cy, rx: 22, ry: 14, fill: '#e8c48e', stroke: TINTA, 'stroke-width': 1.8 }),
        linea(cx - 9, cy - 8, cx - 4, cy + 7, { grosor: 1.6 }),
        linea(cx, cy - 9, cx + 4, cy + 8, { grosor: 1.6 }),
        linea(cx + 9, cy - 7, cx + 12, cy + 5, { grosor: 1.6 }),
      ].join('')
  }
}

/**
 * Una colección de cosas en filas; `grupos` dibuja un recuadro suave alrededor de cada fila (grupos iguales). Debajo,
 * la leyenda con cada cosa y su nombre.
 */
function dibujoColeccion(cosas: Cosa[], porFila: number, leyenda: Cosa[], alt: string, grupos = false): Dibujo {
  const paso = 62
  const nGrupos = Math.ceil(cosas.length / porFila)
  // Con más grupos que cosas por grupo, cada grupo va en una columna (así el dibujo no crece hacia abajo).
  const enColumnas = grupos && nGrupos > porFila
  const [cols, filas] = enColumnas ? [nGrupos, porFila] : [porFila, nGrupos]
  const partes: string[] = []
  const anchoLeyenda = leyenda.reduce((s, c) => s + 52 + anchoTexto(NOMBRE_COSA[c][0], 16) + 28, -28)
  const anchoCosas = cols * paso + 16
  const W = Math.max(anchoCosas, anchoLeyenda + 28)
  const x0 = (W - anchoCosas) / 2 + 8
  if (grupos)
    for (let g = 0; g < nGrupos; g++)
      partes.push(
        enColumnas
          ? rect(x0 + g * paso + 3, 2, paso - 6, filas * paso + 2, { relleno: '#f4f4f4', trazo: GRIS, grosor: 1.4, redondeo: 14 })
          : rect(x0 - 4, 6 + g * paso, porFila * paso + 8, paso - 6, { relleno: '#f4f4f4', trazo: GRIS, grosor: 1.4, redondeo: 14 }),
      )
  cosas.forEach((c, i) => {
    const [col, fila] = enColumnas ? [Math.floor(i / porFila), i % porFila] : [i % porFila, Math.floor(i / porFila)]
    partes.push(cosa(c, x0 + paso / 2 + col * paso, 3 + paso / 2 + fila * paso))
  })
  if (!leyenda.length) return svg(W, filas * paso + 6, partes.join(''), alt)
  // La leyenda va en su propio recuadro, separada, para que no se cuente como una cosa más.
  const yl = filas * paso + 44
  const xl = (W - anchoLeyenda) / 2
  partes.push(rect(xl - 10, yl - 26, anchoLeyenda + 20, 52, { relleno: '#ffffff', trazo: GRIS, grosor: 1.4, redondeo: 8 }))
  let x = xl
  for (const c of leyenda) {
    partes.push(grupo(cosa(c, 0, 0), x + 24, yl, 0.8))
    partes.push(texto(x + 48, yl, NOMBRE_COSA[c][0], { tam: 16, ancla: 'start' }))
    x += 52 + anchoTexto(NOMBRE_COSA[c][0], 16) + 28
  }
  return svg(W, yl + 30, partes.join(''), alt)
}

/** «1 mango», «3 mangos», «2 canicas grises». */
function cuantasCosas(n: number, c: Cosa) {
  const [uno, varios] = NOMBRE_COSA[c]
  if (c.startsWith('canica')) return n === 1 ? `1 ${uno}` : `${n} canicas ${varios}`
  return n === 1 ? `1 ${uno}` : `${n} ${varios}`
}

/** Huevos en su bandeja, naranjas en su caja o panes en su canasta, en filas iguales. */
function dibujoBandeja(c: 'huevo' | 'naranja' | 'pan', total: number, cols: number): Dibujo {
  const paso = c === 'huevo' ? 46 : c === 'pan' ? 58 : 50
  const filas = Math.ceil(total / cols)
  const pad = 12
  const W = cols * paso + 2 * pad
  const H = filas * paso + 2 * pad
  const partes = [rect(3, 3, W, H, { relleno: c === 'huevo' ? '#e6e6e6' : c === 'pan' ? '#f0e2c4' : '#f3ead6', grosor: 2.2, redondeo: c === 'pan' ? 24 : 8 })]
  for (let i = 0; i < total; i++) {
    const cx = 3 + pad + paso / 2 + (i % cols) * paso
    const cy = 3 + pad + paso / 2 + Math.floor(i / cols) * paso + (c === 'naranja' ? 2 : 0)
    if (c === 'huevo') partes.push(circulo(cx, cy, 19, { relleno: '#cdcdcd', grosor: 1.4 }))
    partes.push(cosa(c, cx, cy))
  }
  const donde = c === 'huevo' ? 'una bandeja' : c === 'pan' ? 'una canasta' : 'una caja'
  return svg(W + 6, H + 6, partes.join(''), `${total} ${NOMBRE_COSA[c][1]} en ${donde}, en ${filas} filas de ${cols}`)
}

// ---------- La fracción como parte-todo ----------

/** Filas × columnas de la barra o del terreno (denominadores usuales). */
const FORMAS: [number, number][] = [
  [1, 3],
  [1, 4],
  [2, 2],
  [1, 5],
  [2, 3],
  [1, 6],
  [2, 4],
  [2, 5],
]

/** Errores típicos al escribir la fracción de c partes de n: contra las otras partes, la parte que no es, al revés. */
const erroresParteTodo = (c: number, n: number): Fr[] => [
  [c, n - c],
  [n - c, n],
  [n, c],
  [c + 1, n],
  [c - 1, n],
]

/**
 * Por nivel: las formas de la barra o del terreno, cuántas veces se pide lo que queda (un paso más) y si lo comido o
 * sembrado va salteado (hay que contar una por una) o junto, desde una punta.
 */
const NIVEL_BARRA: Record<Nivel, { formas: [number, number][]; resto: number; salteadas: boolean }> = {
  1: { formas: [[1, 3], [1, 4], [2, 2], [1, 5]], resto: 0, salteadas: false },
  2: { formas: FORMAS, resto: 0.4, salteadas: false },
  3: { formas: [[2, 3], [1, 8], [2, 4], [2, 5], [1, 10]], resto: 0.7, salteadas: true },
}

export const barra: TipoPregunta = {
  id: 'fr-barra',
  nombre: '¿Qué parte se comió?',
  queHacen: 'Miran una barra de chocolate o un terreno partido en partes iguales y escriben la fracción que se comió, que queda o que se sembró.',
  citas: { [P4]: CITA.parteTodo },
  ...BASE,
  niveles: true,
  generar({ azar, nivel = 2 }) {
    const P = NIVEL_BARRA[nivel]
    const [filas, cols] = elegir(azar, P.formas)
    const n = filas * cols
    const k = entero(azar, 1, n - 1)
    const quien = nombre(azar)
    const chocolate = azar() < 0.6
    if (azar() < 0.22) {
      return {
        forma: 'abierta',
        clave: `barra-pinta:${chocolate ? 'choco' : 'chacra'}:${filas}x${cols}:${k}`,
        enunciado: chocolate
          ? `La barra de chocolate está partida en ${n} partes iguales. Pinta ${frac(k, n)} de la barra.`
          : `El terreno de ${quien} está partido en ${n} parcelas iguales. Sembrará habas en ${frac(k, n)} del terreno. Pinta esa parte.`,
        dibujo: chocolate ? dibujoChocolate(filas, cols, null) : dibujoChacra(filas, cols, new Set()),
        respuesta: `${k} de las ${n} partes pintadas (cualquiera de ellas).`,
        espacio: 'dibujo',
        pasos: [
          `${chocolate ? 'La barra tiene' : 'El terreno tiene'} ${n} partes iguales: el denominador es ${n}`,
          `El numerador es ${k}: se ${k === 1 ? 'pinta' : 'pintan'} ${pl(k, 'parte', 'partes')} de ${n}, cualquiera de ellas`,
        ],
      }
    }
    // Se come (o se siembra) desde una punta, columna por columna.
    const orden: number[] = []
    for (let c = 0; c < cols; c++) for (let r = 0; r < filas; r++) orden.push(r * cols + (chocolate ? cols - 1 - c : c))
    const marcadas = new Set((P.salteadas ? barajar(azar, orden) : orden).slice(0, k))
    const pideResto = azar() < P.resto
    const c = pideResto ? n - k : k
    // Fácil: también contar una parte de más (así la correcta no queda siempre primera). Difícil: solo fracciones
    // menores que la unidad y cercanas (sin la fracción al revés, que se descarta rápido).
    const errores = erroresParteTodo(c, n)
    const candidatas = nivel === 1 ? fracciones([...errores, [c, n + 1]]) : nivel === 3 ? propias([...errores, [c + 2, n], [c - 2, n]]) : fracciones(errores)
    const alt = conError(azar, frac(c, n), candidatas, 4)
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `barra:${chocolate ? 'choco' : 'chacra'}:${filas}x${cols}:${k}:${pideResto ? 'resto' : 'parte'}`,
      enunciado: chocolate
        ? `${quien} partió una barra de chocolate en ${n} pedazos iguales. Se comió los pedazos que ahora tienen línea punteada.`
        : `El terreno de ${quien} está partido en ${n} parcelas iguales. Sembró papa en las parcelas que tienen plantitas.`,
      dibujo: chocolate ? dibujoChocolate(filas, cols, marcadas) : dibujoChacra(filas, cols, marcadas),
      pregunta: chocolate
        ? pideResto
          ? '¿Qué fracción de la barra le queda?'
          : '¿Qué fracción de la barra se comió?'
        : pideResto
          ? '¿Qué fracción del terreno falta sembrar?'
          : '¿Qué fracción del terreno sembró con papa?',
      ...alt,
      pasos: [
        `${chocolate ? 'Pedazos' : 'Parcelas'}: ${filas > 1 ? `${filas} × ${cols} = ` : ''}${n}; ${chocolate ? 'con línea punteada' : 'con plantitas'}: ${k}`,
        ...(pideResto ? [`${chocolate ? (c === 1 ? 'Le queda' : 'Le quedan') : 'Falta sembrar'}: ${n} − ${k} = ${c}`] : []),
        chocolate
          ? `${pideResto ? (c === 1 ? 'Le queda' : 'Le quedan') : 'Se comió'} ${c} de ${n} pedazos: ${frac(c, n)}`
          : `${pideResto ? 'Falta sembrar' : 'Sembró'} ${c} de ${n} parcelas: ${frac(c, n)}`,
      ],
    }
  },
}

/**
 * Por nivel: cuántas cosas hay; si van ordenadas por clase (fácil de contar) o mezcladas; y si hay una tercera clase
 * que también cuenta en el total (un dato de más: el error es contar solo contra la otra clase).
 */
const NIVEL_COLECCION: Record<Nivel, { n: number[]; ordenadas: boolean; tres: boolean }> = {
  1: { n: [3, 4, 5, 6], ordenadas: true, tres: false },
  2: { n: [3, 4, 5, 6, 8, 10], ordenadas: false, tres: false },
  3: { n: [6, 8, 10], ordenadas: false, tres: true },
}

export const coleccion: TipoPregunta = {
  id: 'fr-coleccion',
  nombre: 'Fracción de una colección',
  queHacen: 'Cuentan frutas o canicas de un grupo y escriben qué fracción del total son de una clase.',
  citas: { [P4]: CITA.parteTodo },
  ...BASE,
  niveles: true,
  generar({ azar, nivel = 2 }) {
    const P = NIVEL_COLECCION[nivel]
    const n = elegir(azar, P.n)
    const k = entero(azar, 1, n - (P.tres ? 2 : 1))
    const porFila = n <= 5 ? n : n / 2
    const quien = nombre(azar)
    if (azar() < 0.22) {
      return {
        forma: 'abierta',
        clave: `coleccion-pinta:${n}:${k}`,
        enunciado: `${quien} tiene ${n} canicas blancas. Pinta ${frac(k, n)} de las canicas.`,
        dibujo: dibujoColeccion(Array(n).fill('canica-blanca'), porFila, [], `${n} canicas blancas`),
        respuesta: `${k} canicas pintadas de las ${n} (cualquiera de ellas).`,
        espacio: 'dibujo',
        pasos: [
          `Hay ${n} canicas en total: el denominador es ${n}`,
          `El numerador es ${k}: se ${k === 1 ? 'pinta' : 'pintan'} ${pl(k, 'canica', 'canicas')} de ${n}, cualquiera de ellas`,
        ],
      }
    }
    const frutas = azar() < 0.6
    if (P.tres) {
      // Tres clases: k de la que se pregunta, m de otra y el resto de la tercera.
      const clases: Cosa[] = frutas ? ['mango', 'naranja', 'limon'] : ['canica-gris', 'canica-blanca', 'canica-negra']
      const [a, c, b] = barajar(azar, clases)
      const m = entero(azar, 1, n - k - 1)
      const r = n - k - m
      const cosas = barajar(azar, [...Array<Cosa>(k).fill(a), ...Array<Cosa>(m).fill(c), ...Array<Cosa>(r).fill(b)])
      // Contra las otras, contra una sola clase (olvidar la tercera), la clase que no es, las otras dos juntas.
      const alt = conError(azar, frac(k, n), propias([[k, n - k], [k, k + r], [k, k + m], [m, n], [r, n], [n - k, n], [k + 1, n], [k - 1, n]]), 4)
      if (!alt) return null
      const total = frutas ? 'frutas' : 'canicas'
      const porClase = `${cuantasCosas(k, a)}, ${cuantasCosas(m, c)} y ${cuantasCosas(r, b)}`
      return {
        forma: 'opciones',
        clave: `coleccion3:${cosas.join('-')}`,
        enunciado: frutas ? `Observa las frutas que ${quien} trajo del mercado.` : `Observa las canicas de ${quien}.`,
        dibujo: dibujoColeccion(cosas, porFila, clases, porClase),
        pregunta: `¿Qué fracción de las ${total} son ${NOMBRE_COSA[a][1]}?`,
        ...alt,
        pasos: [`Se cuentan todas: ${porClase}`, `En total: ${k} + ${m} + ${r} = ${n} ${total}`, `${cuantasCosas(k, a)} de ${n}: ${frac(k, n)}`],
      }
    }
    const [a, b]: Cosa[] = frutas ? barajar(azar, ['mango', 'naranja'] as Cosa[]) : barajar(azar, ['canica-gris', 'canica-blanca'] as Cosa[])
    const juntas = [...Array<Cosa>(k).fill(a), ...Array<Cosa>(n - k).fill(b)]
    const cosas = P.ordenadas ? juntas : barajar(azar, juntas)
    const alt = conError(azar, frac(k, n), fracciones(erroresParteTodo(k, n)), 4)
    if (!alt) return null
    const leyenda: Cosa[] = frutas ? ['mango', 'naranja'] : ['canica-gris', 'canica-blanca']
    return {
      forma: 'opciones',
      clave: `coleccion:${cosas.join('-')}`,
      enunciado: frutas ? `Observa las frutas que ${quien} trajo del mercado.` : `Observa las canicas de ${quien}.`,
      dibujo: dibujoColeccion(cosas, porFila, leyenda, `${cuantasCosas(k, a)} y ${cuantasCosas(n - k, b)}`),
      pregunta: frutas ? `¿Qué fracción de las frutas son ${NOMBRE_COSA[a][1]}?` : `¿Qué fracción de las canicas son ${NOMBRE_COSA[a][1]}?`,
      ...alt,
      pasos: [`Se cuentan: ${n} ${frutas ? 'frutas' : 'canicas'} en total y ${cuantasCosas(k, a)}`, `${cuantasCosas(k, a)} de ${n}: ${frac(k, n)}`],
    }
  },
}

// ---------- Fracción de una cantidad ----------

const BANDEJAS: { total: number; cols: number }[] = [
  { total: 6, cols: 3 },
  { total: 8, cols: 4 },
  { total: 10, cols: 5 },
  { total: 12, cols: 6 },
  { total: 12, cols: 4 },
  { total: 15, cols: 5 },
  { total: 16, cols: 8 },
  { total: 18, cols: 6 },
  { total: 20, cols: 5 },
  { total: 24, cols: 6 },
  { total: 30, cols: 6 },
]

/**
 * Una fracción a/d de un total, con d que lo divide exacto. `unitaria`: cuántas veces es 1/d (fácil: siempre). `desde`:
 * el numerador más chico cuando no es unitaria (difícil: 2, así hay que dividir y luego multiplicar).
 */
function fraccionDe(azar: Azar, total: number, dens: number[], unitaria = 0.4, desde = 1): Fr | null {
  const posibles = dens.filter((d) => total % d === 0 && d <= total && d - 1 >= desde)
  if (!posibles.length) return null
  const d = elegir(azar, posibles)
  return [azar() < unitaria ? 1 : entero(azar, desde, d - 1), d]
}

/** Los pasos de «a/d de T»: T ÷ d (un grupo) y, si a > 1, × a; luego, si se pide, lo que queda. `hizo` y `queda` nombran cada parte. */
function pasosFraccionDe(T: number, [a, d]: Fr, resto: boolean, hizo: string, queda: string, unidad: (n: number) => string): string[] {
  const g = T / d
  const parte = g * a
  const pasos =
    a === 1
      ? [`${hizo} ${frac(1, d)}: ${num(T)} ÷ ${d} = ${unidad(parte)}`]
      : [`${frac(1, d)} de ${num(T)}: ${num(T)} ÷ ${d} = ${num(g)}`, `${hizo} ${frac(a, d)}: ${num(g)} × ${a} = ${unidad(parte)}`]
  if (resto) pasos.push(`${queda}: ${num(T)} − ${num(parte)} = ${unidad(T - parte)}`)
  return pasos
}

const CONTEXTOS_CANTIDAD = {
  huevo: {
    enunciado: (q: string, t: number, f: string) => `${q} compró una bandeja de ${t} huevos. Usó ${f} de los huevos para hacer un queque.`,
    parte: '¿Cuántos huevos usó?',
    resto: '¿Cuántos huevos le quedan?',
    donde: 'la bandeja',
    hizo: 'Usó',
    queda: 'Le quedan',
  },
  naranja: {
    enunciado: (q: string, t: number, f: string) => `En la caja hay ${t} naranjas. ${q} vendió ${f} de las naranjas en el mercado.`,
    parte: '¿Cuántas naranjas vendió?',
    resto: '¿Cuántas naranjas quedan en la caja?',
    donde: 'la caja',
    hizo: 'Vendió',
    queda: 'Quedan',
  },
  pan: {
    enunciado: (q: string, t: number, f: string) => `En la canasta hay ${t} panes. En el desayuno, la familia de ${q} se comió ${f} de los panes.`,
    parte: '¿Cuántos panes se comieron?',
    resto: '¿Cuántos panes quedan en la canasta?',
    donde: 'la canasta',
    hizo: 'Se comieron',
    queda: 'Quedan',
  },
}

/**
 * Por nivel: las bandejas, si la fracción es unitaria (fácil: solo dividir) o no (difícil: dividir y multiplicar), y
 * hasta dónde llega `modo` para «encierra» y para «cuántos quedan» (un paso más).
 */
const NIVEL_CANTIDAD: Record<Nivel, { bandejas: typeof BANDEJAS; unitaria: number; desde: number; encierra: number; resto: number }> = {
  1: { bandejas: BANDEJAS.filter((b) => b.total <= 12), unitaria: 1, desde: 1, encierra: 0.3, resto: 0.3 },
  2: { bandejas: BANDEJAS, unitaria: 0.4, desde: 1, encierra: 0.25, resto: 0.5 },
  3: { bandejas: BANDEJAS.filter((b) => b.total >= 12 && b.cols >= 4), unitaria: 0, desde: 2, encierra: 0.2, resto: 0.65 },
}

export const deCantidad: TipoPregunta = {
  id: 'fr-de-cantidad',
  nombre: 'Fracción de una cantidad',
  queHacen: 'Parten una colección (huevos, naranjas, panes) en partes iguales y calculan cuántos son la fracción pedida o cuántos quedan.',
  citas: { [P4]: CITA.partir },
  ...BASE,
  niveles: true,
  generar({ azar, nivel = 2 }) {
    const P = NIVEL_CANTIDAD[nivel]
    const c = elegir(azar, ['huevo', 'naranja', 'pan'] as const)
    const b = hasta(() => {
      const x = elegir(azar, P.bandejas)
      return c !== 'huevo' && x.total > 24 ? null : x
    })
    const fr = fraccionDe(azar, b.total, USUALES, P.unitaria, P.desde)
    if (!fr) return null
    const [a, d] = fr
    const T = b.total
    const parte = (T / d) * a
    const quien = nombre(azar)
    const cosas = NOMBRE_COSA[c][1]
    const ctx = CONTEXTOS_CANTIDAD[c]
    const conteo = `En ${ctx.donde}: ${T / b.cols} × ${b.cols} = ${num(T)} ${cosas}`
    const modo = azar()
    if (modo < P.encierra) {
      return {
        forma: 'abierta',
        clave: `de-cantidad:encierra:${c}:${T}:${a}/${d}`,
        enunciado: `Encierra ${frac(a, d)} de ${c === 'naranja' ? 'las' : 'los'} ${cosas}.`,
        dibujo: dibujoBandeja(c, T, b.cols),
        pregunta: `¿${c === 'naranja' ? 'Cuántas' : 'Cuántos'} ${cosas} encerraste?`,
        respuesta: `${cuantasCosas(parte, c)}${a > 1 ? ` (${a} grupos de ${T / d})` : ''}.`,
        espacio: 'dibujo',
        nota: `${T} ÷ ${d} = ${T / d}${a > 1 ? ` y ${T / d} × ${a} = ${parte}` : ''}.`,
        pasos: [
          conteo,
          `${num(T)} ÷ ${d} = ${num(T / d)}: se hacen ${d} grupos de ${num(T / d)}`,
          a === 1
            ? `${frac(1, d)} es 1 grupo: se ${parte === 1 ? 'encierra' : 'encierran'} ${cuantasCosas(parte, c)}`
            : `${frac(a, d)} son ${a} grupos: ${num(T / d)} × ${a} = ${num(parte)}; se encierran ${cuantasCosas(parte, c)}`,
        ],
      }
    }
    const pideResto = modo < P.resto
    const r = pideResto ? T - parte : parte
    // Quedarse con 1/d sin multiplicar, dar lo que queda en vez de la parte (o al revés), dividir entre el numerador.
    const frecuentes = pideResto ? [parte, T - T / d, T / d, T, r + T / d, r - T / d] : [T / d, T - parte, T / a, d, parte + T / d, parte - T / d]
    const alt = conError(azar, num(r), distractores(r, frecuentes.filter((x) => x !== T), { min: 1 }), 4)
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `de-cantidad:${c}:${T}:${a}/${d}:${pideResto ? 'resto' : 'parte'}`,
      enunciado: ctx.enunciado(quien, T, frac(a, d)),
      dibujo: dibujoBandeja(c, T, b.cols),
      pregunta: pideResto ? ctx.resto : ctx.parte,
      ...alt,
      pasos: [conteo, ...pasosFraccionDe(T, fr, pideResto, ctx.hizo, ctx.queda, (x) => cuantasCosas(x, c))],
    }
  },
}

/** El dinero: billetes de un mismo valor (hasta 9) o monedas de un mismo valor (hasta 7). */
const BOLSAS_DINERO: { valor: number; billete: boolean; cuantos: number[] }[] = [
  { valor: 10, billete: true, cuantos: [3, 4, 6, 8, 9] },
  { valor: 20, billete: true, cuantos: [3, 4, 5, 6, 8] },
  { valor: 50, billete: true, cuantos: [2, 4, 6] },
  { valor: 5, billete: false, cuantos: [3, 4, 5, 6] },
  { valor: 2, billete: false, cuantos: [4, 6] },
]

const USOS_DINERO = [
  { hizo: (f: string) => `Gastó ${f} de su dinero en el quiosco del colegio.`, parte: '¿Cuánto dinero gastó?', resto: '¿Cuánto dinero le queda?', usa: 'Gastó', queda: 'Le queda' },
  { hizo: (f: string) => `Guardó ${f} de su dinero en su alcancía.`, parte: '¿Cuánto dinero guardó en la alcancía?', resto: '¿Cuánto dinero no guardó?', usa: 'Guardó', queda: 'No guardó' },
  { hizo: (f: string) => `Pagó con ${f} de su dinero los pasajes de la combi.`, parte: '¿Cuánto pagó por los pasajes?', resto: '¿Cuánto dinero le queda?', usa: 'Pagó', queda: 'Le queda' },
]

/** Más fácil: pocos billetes o monedas, todos del mismo valor. */
const BOLSAS_FACILES: typeof BOLSAS_DINERO = [
  { valor: 10, billete: true, cuantos: [2, 3, 4] },
  { valor: 20, billete: true, cuantos: [2, 3, 4] },
  { valor: 50, billete: true, cuantos: [2, 4] },
  { valor: 5, billete: false, cuantos: [2, 3, 4] },
  { valor: 2, billete: false, cuantos: [2, 4] },
]

/** Más difícil: billetes de dos valores (primero hay que contar cuánto dinero hay). */
const PARES_BILLETES: [number, number][] = [
  [100, 50],
  [100, 20],
  [50, 20],
  [50, 10],
  [20, 10],
  [200, 100],
]

/** «1 billete de S/ 50», «3 billetes de S/ 20». */
const billetes = (c: number, v: number) => `${pl(c, 'billete', 'billetes')} de ${soles(v)}`

/** Nivel 3 de «Fracción del dinero»: billetes de dos valores, fracción no unitaria y, a veces, cuánto queda. */
function dineroMixto(azar: Azar): ReturnType<TipoPregunta['generar']> {
  const { v1, c1, v2, c2, total, a, d } = hasta(() => {
    const [v1, v2] = elegir(azar, PARES_BILLETES)
    const c1 = entero(azar, 1, 4)
    const c2 = entero(azar, 1, 4)
    const total = v1 * c1 + v2 * c2
    const dens = [3, 4, 5, 6, 8].filter((x) => total % x === 0)
    if (!dens.length || c1 + c2 > 7) return null
    const d = elegir(azar, dens)
    return { v1, c1, v2, c2, total, a: entero(azar, 2, d - 1), d }
  })
  const fr: Fr = [a, d]
  const parte = (total / d) * a
  const pideResto = azar() < 0.5
  const r = pideResto ? total - parte : parte
  // Quedarse con 1/d, dar lo que queda (o lo que se usó), contar solo los billetes de un valor, una parte de más o de menos.
  const frecuentes = [total / d, total - r, v1 * c1, v2 * c2, r + total / d, r - total / d]
  const alt = conError(azar, num(r), distractores(r, frecuentes.filter((x) => x !== total), { min: 1, paso: total / d }), 4)
  if (!alt) return null
  const quien = nombre(azar)
  const uso = elegir(azar, USOS_DINERO)
  const cosa = `${billetes(c1, v1)} y ${billetes(c2, v2)}`
  const d0 = dibujoDinero([...Array<number>(c1).fill(v1), ...Array<number>(c2).fill(v2)], [])
  return {
    forma: 'opciones',
    clave: `de-dinero:${v1}x${c1}+${v2}x${c2}:${a}/${d}:${pideResto ? 'resto' : 'parte'}`,
    enunciado: `${quien} tiene este dinero. ${uso.hizo(frac(a, d))}`,
    dibujo: { ...d0, alt: cosa, svg: d0.svg.replace(/aria-label="[^"]*"/, `aria-label="${cosa}"`) },
    pregunta: pideResto ? uso.resto : uso.parte,
    ...alt,
    alternativas: alt.alternativas.map((x) => `S/ ${x}`),
    pasos: [`Tiene ${c1} × ${v1} + ${c2} × ${v2} = ${num(v1 * c1)} + ${num(v2 * c2)} = ${soles(total)}`, ...pasosFraccionDe(total, fr, pideResto, uso.usa, uso.queda, soles)],
  }
}

export const deDinero: TipoPregunta = {
  id: 'fr-de-dinero',
  nombre: 'Fracción del dinero',
  queHacen: 'Parten un grupo de billetes o monedas iguales en partes iguales y calculan cuánto dinero es la fracción pedida o cuánto queda.',
  citas: { [P4]: CITA.partir },
  ...BASE,
  niveles: true,
  generar({ azar, nivel = 2 }) {
    if (nivel === 3) return dineroMixto(azar)
    // Más fácil: pocos billetes o monedas, fracción unitaria (solo dividir) y sin «cuánto queda».
    const facil = nivel === 1
    const bolsa = elegir(azar, facil ? BOLSAS_FACILES : BOLSAS_DINERO)
    const cuantos = elegir(azar, bolsa.cuantos)
    const fr = fraccionDe(azar, cuantos, [2, 3, 4, 5, 6, 8], facil ? 1 : 0.4)
    if (!fr) return null
    const [a, d] = fr
    const total = cuantos * bolsa.valor
    const parte = (total / d) * a
    const pideResto = azar() < (facil ? 0 : 0.35)
    const r = pideResto ? total - parte : parte
    const piezas = (cuantos / d) * (pideResto ? d - a : a)
    // Contar billetes en vez de soles, quedarse con 1/d, dar lo que queda (o lo que se usó).
    const frecuentes = [piezas, total / d, total - r, total, r + bolsa.valor, r - bolsa.valor]
    const alt = conError(azar, num(r), distractores(r, frecuentes.filter((x) => x !== total), { min: 1, paso: bolsa.valor }), 4)
    if (!alt) return null
    const quien = nombre(azar)
    const uso = elegir(azar, USOS_DINERO)
    const cosa = `${cuantos} ${bolsa.billete ? 'billetes' : 'monedas'} de ${soles(bolsa.valor)}`
    const d0 = bolsa.billete ? dibujoDinero(Array(cuantos).fill(bolsa.valor), []) : dibujoDinero([], Array(cuantos).fill(bolsa.valor))
    const dibujo = { ...d0, alt: cosa, svg: d0.svg.replace(/aria-label="[^"]*"/, `aria-label="${cosa}"`) }
    return {
      forma: 'opciones',
      clave: `de-dinero:${bolsa.valor}x${cuantos}:${a}/${d}:${pideResto ? 'resto' : 'parte'}`,
      enunciado: `${quien} tiene este dinero. ${uso.hizo(frac(a, d))}`,
      dibujo,
      pregunta: pideResto ? uso.resto : uso.parte,
      ...alt,
      alternativas: alt.alternativas.map((x) => `S/ ${x}`),
      pasos: [
        `${cuantos} ${bolsa.billete ? 'billetes' : 'monedas'} de ${soles(bolsa.valor)}: ${cuantos} × ${bolsa.valor} = ${soles(total)}`,
        ...pasosFraccionDe(total, fr, pideResto, uso.usa, uso.queda, soles),
      ],
    }
  },
}

// ---------- Comparación de fracciones ----------

type Par = { p: Fr; q: Fr; caso: 'den' | 'num' | 'igual' | 'rel' }

/**
 * Qué pares salen en cada nivel: `r` por debajo de `den` da el mismo denominador; de `num`, el mismo numerador; de
 * `igual`, equivalentes; y si no, denominadores distintos donde uno cabe en el otro (3/4 y 5/8: se pasa a octavos).
 */
type NivelPar = { den: number; num: number; igual: number; dens: number[]; nums: number[]; numDens: number[] }

const PAR_NORMAL: NivelPar = { den: 0.4, num: 0.82, igual: 1, dens: [3, 4, 5, 6, 8, 10], nums: [1, 1, 2, 3], numDens: USUALES }

/** Denominadores donde uno cabe en el otro: el chico se pasa al grande con una fracción equivalente. */
const RELACIONADOS: [number, number][] = [
  [2, 4],
  [2, 6],
  [2, 8],
  [2, 10],
  [3, 6],
  [4, 8],
  [5, 10],
]

/** Dos fracciones para comparar: con el mismo denominador, con el mismo numerador o equivalentes. */
function parParaComparar(azar: Azar, P: NivelPar = PAR_NORMAL): Par {
  const r = azar()
  if (r < P.den) {
    const b = elegir(azar, P.dens)
    const [a1, a2] = barajar(azar, Array.from({ length: b - 1 }, (_, i) => i + 1))
    return { p: [a1, b], q: [a2, b], caso: 'den' }
  }
  if (r < P.num) {
    const a = elegir(azar, P.nums)
    const [b1, b2] = barajar(azar, P.numDens.filter((b) => b > a))
    return { p: [a, b1], q: [a, b2], caso: 'num' }
  }
  if (r < P.igual) {
    const { base, k } = elegir(azar, AMPLIADAS)
    const otra: Fr = [base[0] * k, base[1] * k]
    return azar() < 0.5 ? { p: base, q: otra, caso: 'igual' } : { p: otra, q: base, caso: 'igual' }
  }
  // Distinto numerador y distinto denominador, sin ser equivalentes: 1/2 y 3/8, 2/3 y 5/6.
  const [b, g] = elegir(azar, RELACIONADOS)
  const a = entero(azar, 1, b - 1)
  const c = elegir(azar, Array.from({ length: g - 1 }, (_, i) => i + 1).filter((x) => x !== (a * g) / b && x !== a))
  const x: Fr = [a, b]
  const y: Fr = [c, g]
  return azar() < 0.5 ? { p: x, q: y, caso: 'rel' } : { p: y, q: x, caso: 'rel' }
}

const signo = (p: Fr, q: Fr) => (Math.abs(valorDe(p) - valorDe(q)) < 1e-9 ? '=' : valorDe(p) > valorDe(q) ? '>' : '<')

/** Por qué una fracción es mayor que otra (o igual), terminando en la comparación: «… : 3/4 > 1/4». */
function porQue(p: Fr, q: Fr) {
  const s = signo(p, q)
  if (s === '=') return `Las dos tiras tienen pintado lo mismo: ${ft(p)} = ${ft(q)}`
  const [may, men] = s === '>' ? [p, q] : [q, p]
  // Con el mismo denominador, la mayor tiene al menos 2 partes.
  if (may[1] === men[1]) return `Mismo denominador: ${may[0]} partes son más que ${men[0]}: ${ft(may)} > ${ft(men)}`
  if (may[0] === men[0]) return `Mismo numerador: los ${PARTES[may[1]]} son más grandes que los ${PARTES[men[1]]}: ${ft(may)} > ${ft(men)}`
  // Un denominador cabe en el otro: la de denominador chico se pasa al grande (3/4 = 6/8) y se cuentan las partes.
  const [chica, grande] = may[1] < men[1] ? [may, men] : [men, may]
  if (grande[1] % chica[1] === 0) {
    const k = grande[1] / chica[1]
    const [m1, m2] = may === chica ? [chica[0] * k, grande[0]] : [grande[0], chica[0] * k]
    return `${ft(chica)} = ${frac(chica[0] * k, grande[1])}; ${m1} ${PARTES[grande[1]]} son más que ${m2}: ${ft(may)} > ${ft(men)}`
  }
  return `En las tiras, ${ft(may)} tiene más pintado: ${ft(may)} > ${ft(men)}`
}

/** Lo que se ve en una tira: «8 partes, 3 pintadas». */
const pintadas = ([a, b]: Fr) => `${b} partes, ${a} ${a === 1 ? 'pintada' : 'pintadas'}`

/**
 * Por nivel: qué pares salen y hasta dónde llega `modo` para «¿quién comió más?» y para «¿qué signo va?» (lo demás es
 * «¿tiene razón?»). Fácil: mismo denominador o fracciones de numerador 1 con partes grandes, sin «¿tiene razón?».
 * Difícil: mismo numerador mayor que 1, equivalentes y denominadores distintos (3/4 y 5/8), con más «¿tiene razón?».
 */
const NIVEL_COMPARAR: Record<Nivel, { par: NivelPar; nombres: number; signo: number }> = {
  1: { par: { den: 0.65, num: 1, igual: 1, dens: [3, 4, 5, 6], nums: [1], numDens: [2, 3, 4, 6] }, nombres: 0.55, signo: 1 },
  2: { par: PAR_NORMAL, nombres: 0.45, signo: 0.7 },
  3: { par: { den: 0.15, num: 0.45, igual: 0.7, dens: [8, 10], nums: [2, 3], numDens: USUALES }, nombres: 0.3, signo: 0.55 },
}

export const comparar: TipoPregunta = {
  id: 'fr-comparar',
  nombre: '¿Quién comió más?',
  queHacen: 'Comparan dos fracciones con tiras del mismo tamaño: dicen quién comió más, qué signo va o si una afirmación es correcta.',
  citas: { [P4]: CITA.comparar },
  ...BASE,
  niveles: true,
  generar({ azar, nivel = 2 }) {
    const N = NIVEL_COMPARAR[nivel]
    const { p, q, caso } = parParaComparar(azar, N.par)
    const tirasDe = (izq: [string, string], der: boolean) =>
      dibujoTiras(
        [
          { izq: izq[0], der: der ? ft(p) : undefined, n: p[1], como: primeras(p[0]) },
          { izq: izq[1], der: der ? ft(q) : undefined, n: q[1], como: primeras(q[0]) },
        ],
        `Dos tiras del mismo tamaño: ${ft(p)} y ${ft(q)} pintadas`,
      )
    const modo = azar()
    if (modo < N.nombres) {
      const [A, B] = dosNombres(azar)
      const mas = azar() < 0.65
      const s = signo(p, q)
      const correcta = s === '=' ? 'Comieron lo mismo' : (s === '>') === mas ? A : B
      const alt = alternativas(azar, correcta, [A, B, 'Comieron lo mismo'], 3)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `comparar:${ft(p)}:${ft(q)}`,
        enunciado: `${A} y ${B} tienen barras de chocolate del mismo tamaño. ${A} se comió ${ft(p)} de su barra y ${B} se comió ${ft(q)} de la suya. Lo pintado es lo que se comió cada quien.`,
        dibujo: tirasDe([A, B], true),
        pregunta: mas ? '¿Quién comió más chocolate?' : '¿Quién comió menos chocolate?',
        ...alt,
        pasos: [
          `${A}: ${pintadas(p)}; ${B}: ${pintadas(q)}`,
          porQue(p, q),
          s === '=' ? `Comieron lo mismo: ${ft(p)} = ${ft(q)}` : `${mas ? 'Comió más' : 'Comió menos'}: ${correcta}`,
        ],
      }
    }
    if (modo < N.signo) {
      const alt = alternativas(azar, signo(p, q), ['>', '<', '='], 3)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `comparar:${ft(p)}:${ft(q)}`,
        enunciado: 'Observa las tiras: son del mismo tamaño.',
        dibujo: tirasDe([ft(p), ft(q)], false),
        pregunta: `¿Qué signo va en el recuadro?   ${ft(p)} □ ${ft(q)}`,
        ...alt,
        pasos: [`${ft(p)}: ${pintadas(p)}; ${ft(q)}: ${pintadas(q)}`, porQue(p, q), `En el recuadro va ${signo(p, q)} (${ft(p)} ${signo(p, q)} ${ft(q)})`],
      }
    }
    // ¿Tiene razón? La afirmación de un compañero, con su razón (a veces el error típico).
    const quien = nombre(azar)
    let mayor: Fr
    let menor: Fr
    let razon: string
    let nota: string
    if (caso === 'num') {
      const [chica, grande] = valorDe(p) < valorDe(q) ? [p, q] : [q, p]
      if (azar() < 0.6) {
        mayor = chica
        menor = grande
        razon = `porque ${chica[1]} es mayor que ${grande[1]}`
      } else {
        mayor = grande
        menor = chica
        razon = `porque, si la tira se parte en menos partes, cada parte es más grande`
      }
      nota = `Con el mismo numerador, es mayor la fracción de menor denominador: ${ft(grande)} > ${ft(chica)}.`
    } else if (caso === 'den') {
      ;[mayor, menor] = valorDe(p) > valorDe(q) ? [p, q] : [q, p]
      razon = `porque las partes son del mismo tamaño y ${mayor[0]} partes son más que ${menor[0]}`
      nota = `Con el mismo denominador, es mayor la fracción de mayor numerador: ${ft(mayor)} > ${ft(menor)}.`
    } else if (caso === 'rel') {
      // Denominadores distintos: el error típico es mirar solo el numerador (5/8 > 3/4 «porque 5 es mayor que 3»).
      const [g, c] = valorDe(p) > valorDe(q) ? [p, q] : [q, p]
      const [chica, grande] = p[1] < q[1] ? [p, q] : [q, p]
      const k = grande[1] / chica[1]
      const enGrande = (f: Fr) => (f === chica ? f[0] * k : f[0])
      // El otro error típico: creer que es mayor la de denominador más grande (2/8 > 3/4 «porque 8 es mayor que 4»).
      const porNumerador = c[0] > g[0] && azar() < 0.6
      if (porNumerador || (c[1] > g[1] && azar() < 0.6)) {
        mayor = c
        menor = g
        razon = porNumerador ? `porque ${c[0]} es mayor que ${g[0]}` : `porque ${c[1]} es mayor que ${g[1]}`
      } else {
        mayor = g
        menor = c
        razon = `porque ${ft(chica)} es igual a ${frac(chica[0] * k, grande[1])} y ${enGrande(g)} ${PARTES[grande[1]]} son más que ${enGrande(c)}`
      }
      nota = `${ft(chica)} = ${frac(chica[0] * k, grande[1])}. En ${PARTES[grande[1]]}: ${ft(g)} > ${ft(c)}.`
    } else {
      ;[mayor, menor] = p[1] > q[1] ? [p, q] : [q, p]
      razon = `porque ${mayor[0]} es mayor que ${menor[0]}`
      nota = `Son equivalentes: ${ft(mayor)} = ${ft(menor)}. Las dos tiras tienen pintada la misma parte.`
    }
    const s = signo(mayor, menor)
    const si = `Sí, tiene razón: ${ft(mayor)} es mayor que ${ft(menor)}.`
    const noAlReves = `No: ${ft(menor)} es mayor que ${ft(mayor)}.`
    const noIguales = `No: ${ft(mayor)} y ${ft(menor)} son iguales.`
    const correcta = s === '>' ? si : s === '<' ? noAlReves : noIguales
    const alt = alternativas(azar, correcta, [si, noAlReves, noIguales], 3)
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `comparar:${ft(p)}:${ft(q)}`,
      enunciado: `${quien} dice: «${ft(mayor)} es mayor que ${ft(menor)}, ${razon}». Mira las tiras, que son del mismo tamaño.`,
      dibujo: dibujoTiras(
        [
          { izq: ft(mayor), n: mayor[1], como: primeras(mayor[0]) },
          { izq: ft(menor), n: menor[1], como: primeras(menor[0]) },
        ],
        `Dos tiras del mismo tamaño: ${ft(mayor)} y ${ft(menor)} pintadas`,
      ),
      pregunta: `¿Tiene razón ${quien}?`,
      ...alt,
      nota,
      pasos: [`${ft(mayor)}: ${pintadas(mayor)}; ${ft(menor)}: ${pintadas(menor)}`, porQue(mayor, menor), correcta],
    }
  },
}

/**
 * Por nivel, qué fracciones se ordenan: `unitarias` y `mismoDen` son los cortes de `r` (lo demás, el mismo numerador).
 * Fácil: tres, casi siempre del mismo denominador y con 3 alternativas. Difícil: cuatro fracciones.
 */
const NIVEL_ORDENAR: Record<Nivel, { cuantas: number; unitarias: number; mismoDen: number; unidades: number[]; dens: number[]; opciones: number }> = {
  1: { cuantas: 3, unitarias: 0.3, mismoDen: 1, unidades: [2, 3, 4, 6], dens: [4, 5, 6], opciones: 3 },
  2: { cuantas: 3, unitarias: 0.4, mismoDen: 0.7, unidades: USUALES, dens: [5, 6, 8, 10], opciones: 4 },
  3: { cuantas: 4, unitarias: 0.3, mismoDen: 0.65, unidades: USUALES, dens: [6, 8, 10], opciones: 4 },
}

/** Tres (o las que diga el nivel) fracciones distintas para ordenar: unitarias, con el mismo denominador o con el mismo numerador. */
function tresFracciones(azar: Azar, P = NIVEL_ORDENAR[2]): Fr[] {
  const r = azar()
  if (r < P.unitarias) return barajar(azar, P.unidades).slice(0, P.cuantas).map((b): Fr => [1, b])
  if (r < P.mismoDen) {
    const b = elegir(azar, P.dens)
    return barajar(azar, Array.from({ length: b - 1 }, (_, i) => i + 1))
      .slice(0, P.cuantas)
      .map((a): Fr => [a, b])
  }
  const a = elegir(azar, [2, 3])
  return barajar(azar, USUALES.filter((b) => b > a))
    .slice(0, P.cuantas)
    .map((b): Fr => [a, b])
}

const CUANTAS_TIRAS: Record<number, string> = { 3: 'Tres', 4: 'Cuatro' }

/** «A, B y C». */
const yLista = (xs: string[]) => `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`

/** Los órdenes equivocados de una lista (de 3 o 4): al revés primero y luego cambiando dos de lugar. */
function ordenesMal(azar: Azar, correcto: Fr[]): Fr[][] {
  const c = correcto
  if (c.length === 3)
    return barajar(azar, [
      [c[1], c[0], c[2]],
      [c[0], c[2], c[1]],
      [c[2], c[0], c[1]],
      [c[1], c[2], c[0]],
    ])
  const cambia = (i: number, j: number) => c.map((x, k) => (k === i ? c[j] : k === j ? c[i] : x))
  return barajar(azar, [cambia(0, 1), cambia(1, 2), cambia(2, 3), cambia(0, 3), [c[1], c[0], c[3], c[2]]])
}

export const ordenar: TipoPregunta = {
  id: 'fr-ordenar',
  nombre: 'Ordena las fracciones',
  queHacen: 'Comparan tres fracciones con tiras del mismo tamaño y las ordenan, o dicen quién comió más o menos.',
  citas: { [P4]: CITA.comparar },
  ...BASE,
  niveles: true,
  generar({ azar, nivel = 2 }) {
    const P = NIVEL_ORDENAR[nivel]
    const fs = tresFracciones(azar, P)
    const desc = [...fs].sort((x, y) => valorDe(y) - valorDe(x))
    const ultima = desc[desc.length - 1]
    const regla = `${desc.every((f) => f[1] === desc[0][1]) ? 'Mismo denominador: es mayor la de más partes' : 'Mismo numerador: es mayor la de partes más grandes'}: ${desc.map(ft).join(' > ')}`
    if (azar() < 0.6) {
      const deMayor = azar() < 0.6
      const correcto = deMayor ? desc : [...desc].reverse()
      const texto3 = (xs: Fr[]) => xs.map(ft).join(';  ')
      const otros = ordenesMal(azar, correcto)
      const alt = alternativas(azar, texto3(correcto), [texto3([...correcto].reverse()), ...otros.map(texto3)], P.opciones)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `ordenar:${fs.map(ft).sort().join(',')}`,
        enunciado: 'Observa las tiras: todas son del mismo tamaño.',
        dibujo: dibujoTiras(
          fs.map((f) => ({ izq: ft(f), n: f[1], como: primeras(f[0]) })),
          `${CUANTAS_TIRAS[fs.length]} tiras del mismo tamaño con ${fs.map(ft).join(', ')} pintadas`,
          { gap: 20, alto: 44 },
        ),
        pregunta: deMayor ? '¿Cuál es el orden de las fracciones, de mayor a menor?' : '¿Cuál es el orden de las fracciones, de menor a mayor?',
        ...alt,
        pasos: [
          `En las tiras, ${ft(desc[0])} tiene más pintado y ${ft(ultima)}, menos`,
          regla,
          `${deMayor ? 'De mayor a menor' : 'De menor a mayor'}: ${texto3(correcto)}`,
        ],
      }
    }
    const ns = nombres(azar, fs.length)
    const mas = azar() < 0.5
    const elegido = mas ? desc[0] : ultima
    const correcta = ns[fs.indexOf(elegido)]
    const alt = alternativas(azar, correcta, ns, ns.length)
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `ordenar:${fs.map(ft).sort().join(',')}`,
      enunciado: `${yLista(ns)} compraron una gelatina del mismo tamaño. ${yLista(fs.map((f, i) => `${ns[i]} se comió ${ft(f)}`))} de su gelatina.`,
      dibujo: dibujoTiras(
        fs.map((f, i) => ({ izq: ns[i], der: ft(f), n: f[1], como: primeras(f[0]) })),
        `${CUANTAS_TIRAS[fs.length]} tiras del mismo tamaño: ${fs.map((f, i) => `${ns[i]} ${ft(f)}`).join(', ')}`,
        { gap: 20, alto: 44 },
      ),
      pregunta: mas ? '¿Quién comió más gelatina?' : '¿Quién comió menos gelatina?',
      ...alt,
      pasos: [
        `En las tiras, ${ns[fs.indexOf(desc[0])]} tiene más pintado y ${ns[fs.indexOf(ultima)]}, menos`,
        regla,
        `${mas ? 'Comió más' : 'Comió menos'}: ${correcta} (${ft(elegido)})`,
      ],
    }
  },
}

// ---------- Suma y resta de fracciones ----------

/** Un cuadradito de muestra con su significado, para la leyenda de una tira. */
const muestra = (x: number, y: number, c: Celda, t: string) => celda(x, y, 28, 20, c) + texto(x + 38, y + 10, t, { tam: 15, ancla: 'start' })

/** Una jarra partida en n niveles iguales, llena hasta el nivel `a` (gris) y, si se da, `mas` niveles más (con rayas). */
function dibujoJarra(n: number, a: number, mas = 0): Dibujo {
  const x = 30
  const y = 16
  const w = 120
  const h = 230
  const nh = h / n
  const partes: string[] = [ruta(`M${x + w},${y + 40} C${x + w + 56},${y + 40} ${x + w + 56},${y + 170} ${x + w},${y + 170}`, { grosor: 7 })]
  for (let i = 0; i < n; i++) {
    const desdeAbajo = n - 1 - i
    partes.push(rect(x, y + i * nh, w, nh, { relleno: desdeAbajo < a ? PINTADO : '#ffffff', grosor: 1.6 }))
    if (desdeAbajo >= a && desdeAbajo < a + mas) partes.push(rayas(x, y + i * nh, w, nh))
  }
  partes.push(rect(x, y, w, h, { grosor: 3 }))
  partes.push(rect(x - 6, y - 7, w + 12, 9, { relleno: '#ffffff', grosor: 2.4, redondeo: 3 }))
  if (!mas) return svg(x + w + 70, y + h + 10, partes.join(''), `Jarra partida en ${n} partes iguales, con ${a} llenas`)
  partes.push(muestra(x + w + 76, y + 90, 'gris', 'primero'), muestra(x + w + 76, y + 126, 'rayas', 'después'))
  return svg(x + w + 200, y + h + 10, partes.join(''), `Jarra partida en ${n} partes iguales: ${a} llenas primero (grises) y ${mas} después (con rayas)`)
}

/**
 * Por nivel: en cuántas partes va la tira o la jarra y cuántas alternativas hay. En el 3, la suma y la jarra piden lo
 * que falta (un paso más: sumar y luego quitar del entero).
 */
const NIVEL_SUMAR: Record<Nivel, { n: number[]; opciones: number }> = {
  1: { n: [3, 4, 5, 6], opciones: 3 },
  2: { n: [4, 5, 6, 8, 10], opciones: 4 },
  3: { n: [6, 8, 10], opciones: 4 },
}

export const sumar: TipoPregunta = {
  id: 'fr-sumar',
  nombre: 'Suma y resta con tiras',
  queHacen: 'Suman y restan fracciones con el mismo denominador mirando una tira o una jarra partida en partes iguales.',
  citas: { [P4]: CITA.sumar },
  ...BASE,
  niveles: true,
  generar({ azar, nivel = 2 }) {
    const P = NIVEL_SUMAR[nivel]
    const n = elegir(azar, P.n)
    const quien = nombre(azar)
    const modo = azar()
    if (modo < 0.45) {
      const a = entero(azar, 1, n - 2)
      const b = entero(azar, 1, n - 1 - a)
      const s = a + b
      const pared = azar() < 0.5
      const como = (i: number): Celda => (i < a ? 'gris' : i < s ? 'rayas' : 'vacia')
      const [uno, dos] = pared ? ['en la mañana', 'en la tarde'] : ['el lunes', 'el martes']
      const t = tira(10, 10, 400, 56, n, como)
      const ley = muestra(40, 92, 'gris', uno) + muestra(230, 92, 'rayas', dos)
      if (nivel === 3) {
        // Un paso más: lo que falta pintar (o sembrar). Errores: quedarse con la suma, quitar solo una parte, contar mal.
        const f = n - s
        const alt = conError(azar, frac(f, n), propias([[s, n], [n - a, n], [n - b, n], [f + 1, n], [f - 1, n], [f + 2, n], [s - 1, n]]), 4)
        if (!alt) return null
        const hacer = pared ? 'pintar' : 'sembrar'
        return {
          forma: 'opciones',
          clave: `sumar-falta:${a}/${n}+${b}/${n}`,
          enunciado: pared
            ? `${quien} pintó ${frac(a, n)} de la pared del aula en la mañana y ${frac(b, n)} en la tarde.`
            : `${quien} sembró papa en ${frac(a, n)} de su chacra el lunes y en ${frac(b, n)} el martes.`,
          dibujo: svg(420, 124, t + ley, `Tira partida en ${n} partes: ${a} grises y ${b} con rayas`),
          pregunta: pared ? '¿Qué fracción de la pared le falta pintar?' : '¿Qué fracción de la chacra le falta sembrar?',
          ...alt,
          pasos: [
            `En la tira: ${pl(a, 'parte gris', 'partes grises')} y ${b} con rayas, de ${n}`,
            `${pared ? 'Pintó' : 'Sembró'}: ${frac(a, n)} + ${frac(b, n)} = ${frac(s, n)}`,
            `Le falta ${hacer}: ${frac(n, n)} − ${frac(s, n)} = ${frac(f, n)}`,
          ],
        }
      }
      // Sumar también los denominadores, dar lo que falta, contar mal una parte.
      const alt = conError(azar, frac(s, n), fracciones([[s, 2 * n], [n - s, n], [s + 1, n], [s - 1, n], [a * b, n]]), P.opciones)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `sumar:${a}/${n}+${b}/${n}`,
        enunciado: pared
          ? `${quien} pintó ${frac(a, n)} de la pared del aula en la mañana y ${frac(b, n)} en la tarde.`
          : `${quien} sembró papa en ${frac(a, n)} de su chacra el lunes y en ${frac(b, n)} el martes.`,
        dibujo: svg(420, 124, t + ley, `Tira partida en ${n} partes: ${a} grises y ${b} con rayas`),
        pregunta: pared ? '¿Qué fracción de la pared pintó en total?' : '¿Qué fracción de la chacra sembró en total?',
        ...alt,
        pasos: [
          `En la tira: ${pl(a, 'parte gris', 'partes grises')} y ${b} con rayas, de ${n}`,
          `Mismo denominador: se suman los numeradores: ${a} + ${b} = ${s}`,
          `${frac(a, n)} + ${frac(b, n)} = ${frac(s, n)}`,
        ],
      }
    }
    if (modo < 0.75) {
      const a = entero(azar, 2, n - 1)
      const b = entero(azar, 1, a - 1)
      const r = a - b
      const alt = alternativas(azar, frac(r, n), fracciones([[a + b, n], [b, n], [a, n], [n - r, n], [r + 1, n], [r, 2 * n]]), P.opciones)
      if (!alt) return null
      const como = (i: number): Celda => (i < r ? 'gris' : i < a ? 'tachada' : 'vacia')
      return {
        forma: 'opciones',
        clave: `restar:${a}/${n}-${b}/${n}`,
        enunciado: `Quedaban ${frac(a, n)} de un queque (lo pintado). En el recreo, ${quien} y sus amigos se comieron ${frac(b, n)} del queque (las partes con X).`,
        dibujo: svg(420, 76, tira(10, 10, 400, 56, n, como), `Tira partida en ${n} partes: ${a} pintadas y ${b} de ellas tachadas`),
        pregunta: '¿Qué fracción del queque queda ahora?',
        ...alt,
        pasos: [
          `En la tira: ${pl(a, 'parte pintada', 'partes pintadas')} de ${n}; ${b} con X`,
          `Mismo denominador: se restan los numeradores: ${a} − ${b} = ${r}`,
          `${frac(a, n)} − ${frac(b, n)} = ${frac(r, n)}`,
        ],
      }
    }
    if (nivel === 3) {
      // Llenó en dos veces: se suma lo que echó y se quita del entero.
      const a = entero(azar, 1, n - 2)
      const b = entero(azar, 1, n - 1 - a)
      const s = a + b
      const f = n - s
      const alt = conError(azar, frac(f, n), propias([[s, n], [n - a, n], [n - b, n], [f + 1, n], [f - 1, n], [f + 2, n], [s - 1, n]]), 4)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `falta2:${a}/${n}+${b}/${n}`,
        enunciado: `${quien} llenó ${frac(a, n)} de la jarra con chicha morada y después le echó ${frac(b, n)} más.`,
        dibujo: dibujoJarra(n, a, b),
        pregunta: '¿Qué fracción de la jarra le falta llenar?',
        ...alt,
        pasos: [
          `En la jarra: ${pl(a, 'parte gris', 'partes grises')} y ${b} con rayas, de ${n}`,
          `Llenó: ${frac(a, n)} + ${frac(b, n)} = ${frac(s, n)}`,
          `Le falta llenar: ${frac(n, n)} − ${frac(s, n)} = ${frac(f, n)}`,
        ],
      }
    }
    const a = entero(azar, 1, n - 1)
    const f = n - a
    const alt = conError(azar, frac(f, n), fracciones([[a, n], [f, a], [n, f], [f - 1, n], [f + 1, n]]), P.opciones)
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `falta:${a}/${n}`,
      enunciado: `${quien} llenó ${frac(a, n)} de la jarra con chicha morada.`,
      dibujo: dibujoJarra(n, a),
      pregunta: '¿Qué fracción de la jarra le falta llenar?',
      ...alt,
      pasos: [
        `En la jarra: ${pl(a, 'parte llena', 'partes llenas')} de ${n}`,
        `Faltan: ${n} − ${a} = ${pl(f, 'parte', 'partes')}`,
        `La jarra llena es ${frac(n, n)}: ${frac(n, n)} − ${frac(a, n)} = ${frac(f, n)}`,
      ],
    }
  },
}

/** Sumas y restas donde la primera fracción se cambia por una equivalente (1/2 = 2/4) para tener el mismo denominador. */
const CON_EQUIVALENTES: { p: Fr; q: Fr; op: '+' | '−' }[] = [
  { p: [1, 2], q: [1, 4], op: '+' },
  { p: [1, 2], q: [1, 8], op: '+' },
  { p: [1, 2], q: [3, 8], op: '+' },
  { p: [1, 4], q: [3, 8], op: '+' },
  { p: [1, 4], q: [1, 8], op: '+' },
  { p: [3, 4], q: [1, 8], op: '+' },
  { p: [1, 2], q: [1, 6], op: '+' },
  { p: [1, 3], q: [1, 6], op: '+' },
  { p: [2, 3], q: [1, 6], op: '+' },
  { p: [1, 2], q: [1, 10], op: '+' },
  { p: [1, 2], q: [3, 10], op: '+' },
  { p: [1, 5], q: [3, 10], op: '+' },
  { p: [2, 5], q: [1, 10], op: '+' },
  { p: [3, 4], q: [1, 2], op: '−' },
  { p: [1, 2], q: [1, 4], op: '−' },
  { p: [1, 2], q: [1, 8], op: '−' },
  { p: [3, 4], q: [3, 8], op: '−' },
  { p: [5, 6], q: [1, 2], op: '−' },
  { p: [2, 3], q: [1, 6], op: '−' },
  { p: [1, 2], q: [3, 10], op: '−' },
  { p: [4, 5], q: [3, 10], op: '−' },
]

/** El denominador común de una suma o resta de la lista: el mayor de los dos. */
const comunDe = ({ p, q }: (typeof CON_EQUIVALENTES)[number]) => Math.max(p[1], q[1])

/**
 * Por nivel, de qué sumas y restas se elige. Fácil: en cuartos o sextos (1/2 + 1/4). Difícil: en octavos o décimos, y
 * en las sumas casi siempre se pregunta lo que falta (un paso más).
 */
const NIVEL_SUMAR_EQ: Record<Nivel, { lista: typeof CON_EQUIVALENTES; falta: number; opciones: number }> = {
  1: { lista: CON_EQUIVALENTES.filter((e) => comunDe(e) <= 6), falta: 0, opciones: 3 },
  2: { lista: CON_EQUIVALENTES, falta: 0, opciones: 4 },
  3: { lista: CON_EQUIVALENTES.filter((e) => comunDe(e) >= 8), falta: 0.7, opciones: 4 },
}

export const sumarEquivalentes: TipoPregunta = {
  id: 'fr-sumar-equivalentes',
  nombre: 'Suma con fracciones equivalentes',
  queHacen: 'Suman o restan fracciones de distinto denominador (como 1/2 + 1/4) cambiando una por su equivalente, con tiras alineadas.',
  citas: { [P4]: CITA.sumarEquivalentes },
  ...BASE,
  niveles: true,
  generar({ azar, nivel = 2 }) {
    const N = NIVEL_SUMAR_EQ[nivel]
    const { p, q, op } = elegir(azar, N.lista)
    const [a, b] = p
    const [c, d] = q
    // La de denominador menor se pasa al mayor: siempre es la que no tiene el denominador común.
    const [chica, grande]: [Fr, Fr] = b < d ? [p, q] : [q, p]
    const k = grande[1] / chica[1]
    const comun = grande[1]
    const pa = b === comun ? a : a * k
    const qc = d === comun ? c : c * k
    const r = op === '+' ? pa + qc : pa - qc
    const quien = nombre(azar)
    const filaDe = (f: Fr, c0: Celda): FilaTira => ({ izq: ft(f), n: f[1], como: (i) => (i < f[0] ? c0 : 'vacia'), punteadas: f[1] === comun ? undefined : k })
    if (op === '+' && N.falta && azar() < N.falta) {
      // Un paso más: lo que falta pintar del mural. Errores: quedarse con la suma, sumar sin pasar a la equivalente,
      // quitar solo una de las dos partes, contar mal una parte.
      const f = comun - r
      const alt = conError(azar, frac(f, comun), propias([[r, comun], [comun - a - c, comun], [comun - pa, comun], [comun - qc, comun], [f + 1, comun], [f - 1, comun]]), 4)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `sumar-eq:${ft(p)}${op}${ft(q)}:falta`,
        enunciado: `${quien} pintó ${ft(p)} de un mural y luego ${ft(q)} del mismo mural. Las líneas punteadas parten la tira en ${PARTES[comun]}.`,
        dibujo: dibujoTiras(
          [filaDe(p, 'gris'), filaDe(q, 'rayas'), { izq: 'Total', n: comun, como: () => 'vacia' }],
          `Tiras del mismo tamaño: ${ft(p)}, ${ft(q)} y una tira vacía partida en ${PARTES[comun]}`,
          { gap: 18, alto: 44 },
        ),
        pregunta: `¿Qué fracción del mural le falta pintar?`,
        ...alt,
        nota: `${ft(chica)} = ${frac(chica[0] * k, comun)}; ${frac(pa, comun)} + ${frac(qc, comun)} = ${frac(r, comun)}; ${frac(comun, comun)} − ${frac(r, comun)} = ${frac(f, comun)}.`,
        pasos: [
          `Las líneas punteadas parten cada ${PARTE[chica[1]]} en ${k}: ${ft(chica)} = ${frac(chica[0] * k, comun)}`,
          `Pintó: ${frac(pa, comun)} + ${frac(qc, comun)} = ${frac(r, comun)}`,
          `Le falta pintar: ${frac(comun, comun)} − ${frac(r, comun)} = ${frac(f, comun)}`,
        ],
      }
    }
    // El error más común: operar numeradores y denominadores por separado; luego no convertir a la equivalente.
    const malas: Fr[] =
      op === '+'
        ? [[a + c, b + d], [a + c, comun], [a + c, Math.min(b, d)], [r + 1, comun], [r - 1, comun], [r, comun * 2]]
        : [[a - c, Math.abs(b - d)], [a - c, comun], [pa + qc, comun], [r, comun * 2], [comun - r, comun], [r + 1, comun], [r - 1, comun]]
    const alt = conError(azar, frac(r, comun), fracciones(malas), N.opciones)
    if (!alt) return null
    const dibujo = dibujoTiras(
      [filaDe(p, 'gris'), filaDe(q, op === '+' ? 'rayas' : 'gris'), { izq: op === '+' ? 'Total' : 'Queda', n: comun, como: () => 'vacia' }],
      `Tiras del mismo tamaño: ${ft(p)}, ${ft(q)} y una tira vacía partida en ${PARTES[comun]}`,
      { gap: 18, alto: 44 },
    )
    return {
      forma: 'opciones',
      clave: `sumar-eq:${ft(p)}${op}${ft(q)}`,
      enunciado:
        op === '+'
          ? `${quien} pintó ${ft(p)} de un mural y luego ${ft(q)} del mismo mural. Las líneas punteadas parten la tira en ${PARTES[comun]}.`
          : `A ${quien} le quedaban ${ft(p)} de una pizza. Le invitó ${ft(q)} de la pizza a su hermana. Las líneas punteadas parten la tira en ${PARTES[comun]}.`,
      dibujo,
      pregunta: op === '+' ? `¿Qué fracción del mural pintó en total?   ${ft(p)} + ${ft(q)} = ?` : `¿Qué fracción de la pizza le queda?   ${ft(p)} − ${ft(q)} = ?`,
      ...alt,
      nota: `${ft(chica)} = ${frac(chica[0] * k, comun)}; entonces ${frac(pa, comun)} ${op} ${frac(qc, comun)} = ${frac(r, comun)}.`,
      pasos: [
        `Las líneas punteadas parten cada ${PARTE[chica[1]]} en ${k}: ${ft(chica)} = ${frac(chica[0] * k, comun)}`,
        `Ya en ${PARTES[comun]}, se ${op === '+' ? 'suman' : 'restan'} los numeradores: ${pa} ${op} ${qc} = ${r}`,
        `${ft(p)} ${op} ${ft(q)} = ${frac(pa, comun)} ${op} ${frac(qc, comun)} = ${frac(r, comun)}`,
      ],
    }
  },
}

// ---------- Fracciones equivalentes ----------

/**
 * Nivel 3 de «Fracciones equivalentes con tiras», al revés: se parte de la fracción de partes chicas (6/8) y se busca la
 * de partes grandes (3/4) juntando partes, sin la segunda tira pintada.
 */
function equivalenteAlReves(azar: Azar, [a, b]: Fr, k: number): ReturnType<TipoPregunta['generar']> {
  const ka = a * k
  const kb = b * k
  const de: Fr = [ka, kb]
  const primera: FilaTira = { izq: ft(de), n: kb, como: primeras(ka) }
  const cadaUna = `cada ${PARTE[b]} es igual a ${k} ${PARTES[kb]} (${kb} ÷ ${b} = ${k})`
  const modo = azar()
  // Con medios, «¿cuántos medios?» se adivina: ahí se pregunta la fracción.
  if (modo < 0.45 || (modo < 0.75 && b === 2)) {
    // Dividir solo el numerador, restar en vez de dividir, una parte de más o de menos, contar mal las partes grandes.
    const alt = conError(azar, frac(a, b), propias([[a, kb], [ka - k, kb - k], [ka - 1, kb], [ka + 1, kb], [a + 1, b], [b - a, b], [a, b + 1]]), 4)
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `equivalentes:${ft(de)}:${b}`,
      enunciado: `Las dos tiras son del mismo tamaño. La segunda está partida en ${PARTES[b]}.`,
      dibujo: dibujoTiras([primera, { izq: '?', n: b, como: () => 'vacia' }], `Tira de ${ft(de)} pintada y tira vacía partida en ${b}`),
      pregunta: `¿Qué fracción es equivalente a ${ft(de)}?`,
      ...alt,
      pasos: [`En la segunda tira, ${cadaUna}`, `${ka} ÷ ${k} = ${a}: ${ka} ${PARTES[kb]} son ${pl(a, PARTE[b], PARTES[b])}`, `${ft(de)} = ${frac(a, b)}`],
    }
  }
  if (modo < 0.75) {
    const alt = alternativas(azar, num(a), distractores(a, [ka, b - a, a + 1, a - 1, k, ka - k], { min: 1 }).filter((x) => Number(x) <= b), 4)
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `equivalentes:${ft(de)}:${b}`,
      enunciado: `La segunda tira es del mismo tamaño y está partida en ${PARTES[b]}.`,
      dibujo: dibujoTiras([primera, { izq: '?', n: b, como: () => 'vacia' }], `Tira de ${ft(de)} pintada y tira vacía partida en ${b}`),
      pregunta: `¿Cuántos ${PARTES[b]} hay que pintar para tener lo mismo que ${ft(de)}?`,
      ...alt,
      pasos: [mayus(cadaUna), `${ka} ÷ ${k} = ${a}: hay que pintar ${pl(a, PARTE[b], PARTES[b])}`],
    }
  }
  return {
    forma: 'abierta',
    clave: `equivalentes:${ft(de)}:${b}`,
    enunciado: `Pinta en la segunda tira una fracción equivalente a ${ft(de)}. Luego escribe la fracción en los recuadros.`,
    dibujo: dibujoTiras([primera, { izq: '?', n: b, como: () => 'vacia', plantilla: true }], `Tira de ${ft(de)} pintada y tira vacía partida en ${b}, con recuadros para escribir la fracción`),
    respuesta: `${pl(a, 'parte pintada', 'partes pintadas')}: ${frac(a, b)}`,
    espacio: 'dibujo',
    pasos: [`La segunda tira está partida en ${b}: ${cadaUna}`, `${ka} ÷ ${k} = ${a}: se ${a === 1 ? 'pinta' : 'pintan'} ${pl(a, PARTE[b], PARTES[b])}`, `${ft(de)} = ${frac(a, b)}`],
  }
}

/** Por nivel, de qué fracciones se parte. Fácil: medios, tercios y cuartos que pasan a octavos como mucho, con 3 alternativas. */
const NIVEL_EQUIVALENTES: Record<Nivel, { lista: typeof AMPLIADAS; opciones: number }> = {
  1: { lista: AMPLIADAS.filter(({ base, k }) => base[1] <= 4 && base[1] * k <= 8), opciones: 3 },
  2: { lista: AMPLIADAS, opciones: 4 },
  3: { lista: AMPLIADAS.filter(({ base, k }) => base[1] * k >= 6), opciones: 4 },
}

export const equivalentes: TipoPregunta = {
  id: 'fr-equivalentes',
  nombre: 'Fracciones equivalentes con tiras',
  queHacen: 'Comparan dos tiras del mismo tamaño y encuentran, pintan o escriben la fracción equivalente.',
  citas: { [P4]: CITA.equivalentes },
  ...BASE,
  niveles: true,
  generar({ azar, nivel = 2 }) {
    const N = NIVEL_EQUIVALENTES[nivel]
    const { base, k } = elegir(azar, N.lista)
    if (nivel === 3) return equivalenteAlReves(azar, base, k)
    const [a, b] = base
    const ka = a * k
    const kb = b * k
    const primera: FilaTira = { izq: ft(base), n: b, como: primeras(a) }
    const modo = azar()
    if (modo < 0.45) {
      const alt = conError(azar, frac(ka, kb), fracciones([[a, kb], [ka, b], [b, a], [ka + 1, kb], [ka - 1, kb], [kb - ka, kb]]), N.opciones)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `equivalentes:${ft(base)}:${kb}`,
        enunciado: 'Las dos tiras son del mismo tamaño y tienen pintada la misma parte.',
        dibujo: dibujoTiras([primera, { izq: '?', n: kb, como: primeras(ka) }], `Tira de ${ft(base)} pintada y tira partida en ${kb} con ${ka} pintadas`),
        pregunta: `¿Qué fracción es equivalente a ${ft(base)}?`,
        ...alt,
        pasos: [
          `La segunda tira está partida en ${kb} partes y tiene ${ka} pintadas`,
          `Numerador y denominador por ${k}: ${a} × ${k} = ${ka}; ${b} × ${k} = ${kb}`,
          `${ft(base)} = ${frac(ka, kb)}`,
        ],
      }
    }
    if (modo < 0.75) {
      const alt = alternativas(azar, num(ka), distractores(ka, [a, kb - ka, ka + 1, ka - 1, kb, k], { min: 1 }), N.opciones)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `equivalentes:${ft(base)}:${kb}`,
        enunciado: `La segunda tira es del mismo tamaño y está partida en ${PARTES[kb]}.`,
        dibujo: dibujoTiras([primera, { izq: '?', n: kb, como: () => 'vacia' }], `Tira de ${ft(base)} pintada y tira vacía partida en ${kb}`),
        pregunta: `¿Cuántos ${PARTES[kb]} hay que pintar para tener lo mismo que ${ft(base)}?`,
        ...alt,
        pasos: [
          `Cada ${PARTE[b]} es igual a ${k} ${PARTES[kb]}: ${kb} ÷ ${b} = ${k}`,
          `${a} × ${k} = ${ka}: hay que pintar ${ka} ${PARTES[kb]}`,
        ],
      }
    }
    return {
      forma: 'abierta',
      clave: `equivalentes:${ft(base)}:${kb}`,
      enunciado: `Pinta en la segunda tira una fracción equivalente a ${ft(base)}. Luego escribe la fracción en los recuadros.`,
      dibujo: dibujoTiras([primera, { izq: '?', n: kb, como: () => 'vacia', plantilla: true }], `Tira de ${ft(base)} pintada y tira vacía partida en ${kb}, con recuadros para escribir la fracción`),
      respuesta: `${ka} partes pintadas: ${frac(ka, kb)}`,
      espacio: 'dibujo',
      pasos: [
        `La segunda tira está partida en ${kb}: cada ${PARTE[b]} es igual a ${k} ${PARTES[kb]} (${kb} ÷ ${b} = ${k})`,
        `${a} × ${k} = ${ka}: se pintan ${ka} ${PARTES[kb]}`,
        `${ft(base)} = ${frac(ka, kb)}`,
      ],
    }
  },
}

/**
 * Por nivel: de qué fracciones se parte y cómo se ven los grupos. Fácil: 2 grupos chicos, cada uno ordenado (primero
 * una clase y luego la otra). Difícil: más cosas y sin recuadros ni aviso de los grupos: cada fila es un grupo y el
 * alumno tiene que darse cuenta.
 */
const NIVEL_RAZON: Record<Nivel, { lista: typeof AMPLIADAS; ordenados: boolean; recuadros: boolean }> = {
  1: { lista: AMPLIADAS.filter(({ base, k }) => k === 2 && base[1] <= 4), ordenados: true, recuadros: true },
  2: { lista: AMPLIADAS, ordenados: false, recuadros: true },
  3: { lista: AMPLIADAS.filter(({ base, k }) => base[1] * k >= 6), ordenados: false, recuadros: false },
}

export const equivalentesRazon: TipoPregunta = {
  id: 'fr-equivalentes-razon',
  nombre: '¿Quién tiene razón?',
  queHacen: 'Miran un grupo de frutas o canicas en filas iguales y deciden si dos fracciones que dicen sus compañeros son equivalentes.',
  citas: { [P4]: CITA.equivalentes },
  ...BASE,
  niveles: true,
  generar({ azar, nivel = 2 }) {
    const N = NIVEL_RAZON[nivel]
    // Solo denominadores usuales: el total (ka/kb) y la fila (a/b) son medios, tercios, cuartos, quintos, sextos, octavos o décimos.
    const { base, k } = elegir(azar, N.lista)
    const [a, b] = base
    const n = b * k
    const ka = a * k
    const frutas = azar() < 0.6
    const [cA, cB]: Cosa[] = frutas ? barajar(azar, ['mango', 'naranja'] as Cosa[]) : barajar(azar, ['canica-gris', 'canica-blanca'] as Cosa[])
    // Cada grupo tiene la misma cantidad de cada clase, en otro orden: así se ve que a/b = ka/kb.
    const grupoDe = () => [...Array<Cosa>(a).fill(cA), ...Array<Cosa>(b - a).fill(cB)]
    const cosas = Array.from({ length: k }, () => (N.ordenados ? grupoDe() : barajar(azar, grupoDe()))).flat()
    const [X, Y] = dosNombres(azar)
    const caso = azar()
    // Con 1/2 no hay un error de X que no sea equivalente o mayor que 1: ahí X siempre tiene razón.
    const bienX = caso < 0.6 || b === 2 * a
    const bienY = caso < 0.4 || (caso >= 0.6 && caso < 0.8)
    // Errores: contar contra la otra clase (ka/(n−ka), si queda menor que 1) o contar la otra clase ((n−ka)/n); y
    // simplificar solo el numerador (a/n).
    const dichoX: Fr = bienX ? [ka, n] : 2 * a < b ? [ka, n - ka] : [n - ka, n]
    const dichoY: Fr = bienY ? [a, b] : [a, n]
    const correcta = bienX && bienY ? `${X} y ${Y}` : bienX ? `Solo ${X}` : bienY ? `Solo ${Y}` : `Ni ${X} ni ${Y}`
    const alt = alternativas(azar, correcta, [`${X} y ${Y}`, `Solo ${X}`, `Solo ${Y}`, `Ni ${X} ni ${Y}`], 4)
    if (!alt) return null
    const clase = NOMBRE_COSA[cA][1]
    const de = frutas ? 'las frutas' : 'las canicas'
    return {
      forma: 'opciones',
      clave: `equiv-razon:${a}/${b}x${k}:${bienX ? 1 : 0}${bienY ? 1 : 0}`,
      enunciado: `Observa ${de}${N.recuadros ? `: hay ${k} grupos de ${b}` : ''}. ${X} dice: «${ft(dichoX)} de ${de} son ${clase}». ${Y} dice: «${ft(dichoY)} de ${de} son ${clase}».`,
      dibujo: N.recuadros
        ? dibujoColeccion(cosas, b, frutas ? ['mango', 'naranja'] : ['canica-gris', 'canica-blanca'], `${k} grupos de ${b}; en cada grupo hay ${cuantasCosas(a, cA)}`, true)
        : dibujoColeccion(cosas, b, frutas ? ['mango', 'naranja'] : ['canica-gris', 'canica-blanca'], `${k} filas de ${b}; en cada fila hay ${cuantasCosas(a, cA)}`),
      pregunta: '¿Quién tiene razón?',
      ...alt,
      nota: `Son ${cuantasCosas(ka, cA)} de ${n}: ${frac(ka, n)}. En cada ${N.recuadros ? 'grupo' : 'fila'} hay ${a} de ${b}: ${ft([a, b])}. Las dos fracciones son equivalentes.`,
      pasos: [
        `En total: ${cuantasCosas(ka, cA)} de ${n}: ${frac(ka, n)}`,
        N.recuadros ? `En cada grupo, ${a} de ${b}: ${ft(base)} = ${frac(ka, n)}` : `Cada fila es un grupo de ${b} con ${cuantasCosas(a, cA)}: ${ft(base)} = ${frac(ka, n)}`,
        `${X}: ${ft(dichoX)} está ${bienX ? 'bien' : 'mal'}; ${Y}: ${ft(dichoY)} está ${bienY ? 'bien' : 'mal'}`,
        `${correcta} ${bienX !== bienY ? 'tiene' : 'tienen'} razón`,
      ],
    }
  },
}

// ---------- Amplificación y simplificación ----------

/** Flecha curva de (x0, y0) a (x1, y1) pasando cerca de (cx, cy), con su punta. */
function flecha(x0: number, y0: number, cx: number, cy: number, x1: number, y1: number) {
  const dx = x1 - cx
  const dy = y1 - cy
  const l = Math.hypot(dx, dy) || 1
  const ux = dx / l
  const uy = dy / l
  const punta = poligono([[x1, y1], [x1 - 11 * ux - 6 * uy, y1 - 11 * uy + 6 * ux], [x1 - 11 * ux + 6 * uy, y1 - 11 * uy - 6 * ux]], { relleno: TINTA, grosor: 1.4 })
  return ruta(`M${x0},${y0} Q${cx},${cy} ${x1 - 6 * ux},${y1 - 6 * uy}`, { grosor: 2.2 }) + punta
}

/** a/b → (× k o ÷ k) → c/d, con recuadros donde falta el número. */
function dibujoOperacion(de: Fr, op: string, a: (number | null)[]): Dibujo {
  // Numerador en y = 70, raya en 100 y denominador en 132; las flechas pasan por fuera, con la operación encima y debajo.
  const frac2 = (cx: number, n: number | null, d: number | null) =>
    [
      n === null ? casilla(cx - 25, 48, 50, 40) : texto(cx, 70, String(n), { tam: 34, peso: 700 }),
      linea(cx - 32, 100, cx + 32, 100, { grosor: 3 }),
      d === null ? casilla(cx - 25, 112, 50, 40) : texto(cx, 132, String(d), { tam: 34, peso: 700 }),
    ].join('')
  const partes = [
    frac2(60, de[0], de[1]),
    frac2(300, a[0], a[1]),
    flecha(100, 58, 180, 22, 260, 58),
    flecha(100, 142, 180, 178, 260, 142),
    texto(180, 22, op, { tam: 20, peso: 700 }),
    texto(180, 180, op, { tam: 20, peso: 700 }),
    texto(180, 100, '=', { tam: 30, peso: 700 }),
  ]
  const falta = a.map((x) => (x === null ? 'recuadro' : String(x)))
  return svg(360, 200, partes.join(''), `${ft(de)}, ${op} en el numerador y en el denominador, igual a ${falta[0]} sobre ${falta[1]}`)
}

/**
 * Por nivel, para amplificar y simplificar: hasta dónde llega `modo` para la tira, la operación y completar el
 * numerador (lo demás: completar el denominador). Fácil: sin completar y con 3 alternativas. Difícil: completar sin que
 * se diga el número por el que se multiplica o divide («× ?»), y simplificar hasta que ya no se pueda.
 */
type NivelFraccion = { tira: number; operacion: number; numerador: number; opciones: number; oculto: boolean }
const MODOS_FRACCION: Record<Nivel, NivelFraccion> = {
  1: { tira: 0.5, operacion: 1, numerador: 1, opciones: 3, oculto: false },
  2: { tira: 0.4, operacion: 0.75, numerador: 1, opciones: 4, oculto: false },
  3: { tira: 0.2, operacion: 0.45, numerador: 0.72, opciones: 4, oculto: true },
}

/** De qué fracciones se parte. Fácil: por 2 o por 3, hasta octavos. Difícil: hasta sextos, octavos o décimos. */
const LISTA_AMPLIFICAR: Record<Nivel, typeof AMPLIADAS> = {
  1: AMPLIADAS.filter(({ base, k }) => k <= 3 && base[1] * k <= 8),
  2: AMPLIADAS,
  3: AMPLIADAS.filter(({ base, k }) => base[1] * k >= 6),
}

export const amplificar: TipoPregunta = {
  id: 'fr-amplificar',
  nombre: 'Amplifica la fracción',
  queHacen: 'Amplifican una fracción multiplicando el numerador y el denominador por el mismo número, o partiendo cada parte de una tira.',
  citas: { [P4]: CITA.amplificar },
  ...BASE,
  niveles: true,
  generar({ azar, nivel = 2 }) {
    const M = MODOS_FRACCION[nivel]
    const { base, k } = elegir(azar, LISTA_AMPLIFICAR[nivel])
    const [a, b] = base
    const ka = a * k
    const kb = b * k
    const malas: Fr[] = [[ka, b], [a, kb], [a + k, b + k], [ka + 1, kb], [ka - 1, kb], [kb - ka, kb]]
    const modo = azar()
    const por = M.oculto ? '× ?' : `× ${k}`
    if (modo < M.tira) {
      const alt = conError(azar, frac(ka, kb), fracciones(malas), M.opciones)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `amplificar:${ft(base)}:${k}`,
        enunciado: `En la tira, ${ft(base)} está pintado. Cada parte se partió en ${k} partes iguales (las líneas punteadas).`,
        dibujo: svg(420, 76, tira(10, 10, 400, 56, b, primeras(a), { punteadas: k }), `Tira de ${ft(base)} pintada; cada parte partida en ${k} con líneas punteadas`),
        pregunta: 'Ahora, contando las partes chicas, ¿qué fracción de la tira está pintada?',
        ...alt,
        pasos: [`Cada parte se partió en ${k}: ${b} × ${k} = ${kb} partes chicas`, `Pintadas: ${a} × ${k} = ${ka} partes chicas`, `${ft(base)} = ${frac(ka, kb)}`],
      }
    }
    if (modo < M.operacion) {
      const alt = conError(azar, frac(ka, kb), fracciones(malas), M.opciones)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `amplificar:${ft(base)}:${k}`,
        enunciado: `Amplifica ${ft(base)} por ${k}: multiplica el numerador y el denominador por ${k}.`,
        dibujo: dibujoOperacion(base, `× ${k}`, [null, null]),
        pregunta: '¿Qué fracción obtienes?',
        ...alt,
        pasos: [`Numerador: ${a} × ${k} = ${ka}`, `Denominador: ${b} × ${k} = ${kb}`, `${ft(base)} = ${frac(ka, kb)}`],
      }
    }
    if (modo >= M.numerador) {
      // Completar el denominador (sin decir por cuánto): el error típico es sumar lo que creció el numerador.
      const alt = conError(azar, num(kb), distractores(kb, [b + (ka - a), b, ka, kb + 1, kb - 1, kb + b], { min: 2 }), M.opciones)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `amplificar-den:${ft(base)}:${k}`,
        enunciado: 'Completa para que las dos fracciones sean equivalentes.',
        dibujo: dibujoOperacion(base, por, [ka, null]),
        pregunta: `${ft(base)} = ${ka}/□. ¿Qué número va en el recuadro?`,
        ...alt,
        pasos: [
          `El numerador pasó de ${a} a ${ka}: ${a} × ${k} = ${ka}`,
          `El denominador también se multiplica por ${k}: ${b} × ${k} = ${kb}`,
          `${ft(base)} = ${frac(ka, kb)}: en el recuadro va ${kb}`,
        ],
      }
    }
    // Completar el numerador: el error típico es sumar lo que creció el denominador.
    const alt = conError(azar, num(ka), distractores(ka, [a + (kb - b), a, kb, ka + 1, ka - 1], { min: 1 }), M.opciones)
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `amplificar:${ft(base)}:${k}`,
      enunciado: `Completa para que las dos fracciones sean equivalentes.`,
      dibujo: dibujoOperacion(base, por, [null, kb]),
      pregunta: `${ft(base)} = □/${kb}. ¿Qué número va en el recuadro?`,
      ...alt,
      pasos: [
        `El denominador pasó de ${b} a ${kb}: ${b} × ${k} = ${kb}`,
        `El numerador también se multiplica por ${k}: ${a} × ${k} = ${ka}`,
        `${ft(base)} = ${frac(ka, kb)}: en el recuadro va ${ka}`,
      ],
    }
  },
}

/** Fracciones para simplificar: ka/kb → a/b (con denominadores usuales). */
const SIMPLIFICABLES: { de: Fr; k: number }[] = [
  ...AMPLIADAS.map(({ base, k }) => ({ de: [base[0] * k, base[1] * k] as Fr, k })),
  { de: [4, 8], k: 2 },
  { de: [2, 4], k: 2 },
]

/** De qué fracciones se parte. Fácil: entre 2, hasta octavos. Difícil: las que, divididas entre k, ya no se simplifican más. */
const LISTA_SIMPLIFICAR: Record<Nivel, typeof SIMPLIFICABLES> = {
  1: SIMPLIFICABLES.filter(({ de, k }) => k === 2 && de[1] <= 8),
  2: SIMPLIFICABLES,
  3: SIMPLIFICABLES.filter(({ de, k }) => k === mcd(de[0], de[1]) && de[1] >= 6),
}

export const simplificar: TipoPregunta = {
  id: 'fr-simplificar',
  nombre: 'Simplifica la fracción',
  queHacen: 'Simplifican una fracción dividiendo el numerador y el denominador entre el mismo número, o juntando partes de una tira.',
  citas: { [P4]: CITA.amplificar },
  ...BASE,
  niveles: true,
  generar({ azar, nivel = 2 }) {
    const M = MODOS_FRACCION[nivel]
    const { de, k } = elegir(azar, LISTA_SIMPLIFICAR[nivel])
    const [ka, kb] = de
    const a = ka / k
    const b = kb / k
    // Dividir solo el numerador o solo el denominador, o restar en vez de dividir.
    const malas: Fr[] = [[a, kb], [ka, b], [ka - k, kb - k], [a + 1, b], [b - a, b], [b, a]]
    const modo = azar()
    const entre = M.oculto ? '÷ ?' : `÷ ${k}`
    if (modo < M.tira) {
      const alt = conError(azar, frac(a, b), fracciones(malas), M.opciones)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `simplificar:${ft(de)}:${k}`,
        enunciado: `En la tira, ${ft(de)} está pintado. Las líneas gruesas juntan las partes de ${k} en ${k}.`,
        dibujo: svg(420, 84, tira(10, 14, 400, 56, kb, primeras(ka), { gruesas: k }), `Tira de ${ft(de)} pintada, con líneas gruesas cada ${k} partes`),
        pregunta: 'Si cuentas solo las partes grandes (entre líneas gruesas), ¿qué fracción de la tira está pintada?',
        ...alt,
        pasos: [
          `Las líneas gruesas juntan las partes de ${k} en ${k}: ${kb} ÷ ${k} = ${b} partes grandes`,
          `Pintadas: ${ka} ÷ ${k} = ${pl(a, 'parte grande', 'partes grandes')}`,
          `${ft(de)} = ${frac(a, b)}`,
        ],
      }
    }
    if (modo < M.operacion && M.oculto) {
      // Hasta que ya no se pueda, sin decir entre cuánto. Además de los errores de siempre: contar mal una parte.
      const alt = conError(azar, frac(a, b), propias([...malas, [a, b + 1], [ka - 1, kb], [a + 1, b + 1]]), M.opciones)
      if (!alt) return null
      const [ma, mb] = [ka / 2, kb / 2]
      return {
        forma: 'opciones',
        clave: `simplificar-max:${ft(de)}`,
        enunciado: `Simplifica ${ft(de)} hasta que ya no se pueda simplificar más.`,
        dibujo: dibujoOperacion(de, entre, [null, null]),
        pregunta: '¿Qué fracción obtienes?',
        ...alt,
        pasos: [
          ...(k === 4
            ? [`Entre 2: ${ft(de)} = ${frac(ma, mb)}`, `Otra vez entre 2: ${frac(ma, mb)} = ${frac(a, b)}`]
            : [`${ka} y ${kb} se pueden dividir entre ${k}: ${ka} ÷ ${k} = ${a}; ${kb} ÷ ${k} = ${b}`]),
          `${frac(a, b)} ya no se puede simplificar: ${ft(de)} = ${frac(a, b)}`,
        ],
      }
    }
    if (modo < M.operacion) {
      const alt = conError(azar, frac(a, b), fracciones(malas), M.opciones)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `simplificar:${ft(de)}:${k}`,
        enunciado: `Simplifica ${ft(de)}: divide el numerador y el denominador entre ${k}.`,
        dibujo: dibujoOperacion(de, `÷ ${k}`, [null, null]),
        pregunta: '¿Qué fracción obtienes?',
        ...alt,
        pasos: [`Numerador: ${ka} ÷ ${k} = ${a}`, `Denominador: ${kb} ÷ ${k} = ${b}`, `${ft(de)} = ${frac(a, b)}`],
      }
    }
    if (modo >= M.numerador) {
      // Completar el denominador (sin decir entre cuánto): el error típico es restar lo que bajó el numerador.
      const alt = conError(azar, num(b), distractores(b, [kb - (ka - a), kb, a, b + 1, b - 1], { min: 2 }), M.opciones)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `simplificar-den:${ft(de)}:${k}`,
        enunciado: 'Completa para que las dos fracciones sean equivalentes.',
        dibujo: dibujoOperacion(de, entre, [a, null]),
        pregunta: `${ft(de)} = ${a}/□. ¿Qué número va en el recuadro?`,
        ...alt,
        pasos: [
          `El numerador pasó de ${ka} a ${a}: ${ka} ÷ ${k} = ${a}`,
          `El denominador también se divide entre ${k}: ${kb} ÷ ${k} = ${b}`,
          `${ft(de)} = ${frac(a, b)}: en el recuadro va ${b}`,
        ],
      }
    }
    const alt = conError(azar, num(a), distractores(a, [ka - (kb - b), ka, b, a + 1, a - 1], { min: 1 }), M.opciones)
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `simplificar:${ft(de)}:${k}`,
      enunciado: 'Completa para que las dos fracciones sean equivalentes.',
      dibujo: dibujoOperacion(de, entre, [null, b]),
      pregunta: `${ft(de)} = □/${b}. ¿Qué número va en el recuadro?`,
      ...alt,
      pasos: [
        `El denominador pasó de ${kb} a ${b}: ${kb} ÷ ${k} = ${b}`,
        `El numerador también se divide entre ${k}: ${ka} ÷ ${k} = ${a}`,
        `${ft(de)} = ${frac(a, b)}: en el recuadro va ${a}`,
      ],
    }
  },
}

// ---------- Kilogramo y gramo: la balanza ----------

const PESAS: Record<number, { w: number; h: number; t: string }> = {
  1000: { w: 66, h: 48, t: '1 kg' },
  500: { w: 60, h: 40, t: '500 g' },
  200: { w: 56, h: 34, t: '200 g' },
  100: { w: 54, h: 30, t: '100 g' },
}

/** Una pesa con su masa escrita; null es la pesa que falta (punteada, con «?»). */
function pesa(cx: number, base: number, g: number | null) {
  const p = g === null ? { w: 60, h: 40, t: '?' } : PESAS[g]
  const cuerpo = poligono(
    [
      [cx - p.w / 2, base],
      [cx + p.w / 2, base],
      [cx + p.w / 2 - 6, base - p.h],
      [cx - p.w / 2 + 6, base - p.h],
    ],
    { relleno: g === null ? '#ffffff' : '#d6d6d6', grosor: 2, punteado: g === null },
  )
  const asa = rect(cx - 9, base - p.h - 9, 18, 9, { relleno: g === null ? '#ffffff' : '#bdbdbd', grosor: 1.8, redondeo: 3, punteado: g === null })
  return asa + cuerpo + texto(cx, base - p.h / 2, p.t, { tam: g === null ? 22 : 15, peso: 700 })
}

/** Alto de una pesa con su asa. */
const altoPesa = (g: number | null) => (g === null ? 40 : PESAS[g].h) + 9

/** Las pesas en el platillo: las 3 más grandes abajo y las demás encima de ellas. */
function pesasEnPlatillo(cx: number, base: number, gs: (number | null)[]) {
  const abajo = gs.slice(0, 3)
  const arriba = gs.slice(3)
  const ancho = (g: number | null) => (g === null ? 60 : PESAS[g].w)
  const total = abajo.reduce((s: number, g) => s + ancho(g), 0) + (abajo.length - 1) * 8
  const partes: string[] = []
  let x = cx - total / 2
  const centros: number[] = []
  abajo.forEach((g) => {
    centros.push(x + ancho(g) / 2)
    partes.push(pesa(x + ancho(g) / 2, base, g))
    x += ancho(g) + 8
  })
  arriba.forEach((g, i) => partes.push(pesa(centros[i], base - altoPesa(abajo[i]), g)))
  return partes.join('')
}

/** Un saco (bolsa de mercado) con el nombre del producto y, si se da, una etiqueta con su masa. */
function saco(cx: number, base: number, w: number, h: number, nombreP: string, etiqueta?: string) {
  const x0 = cx - w / 2
  const x1 = cx + w / 2
  const y0 = base - h
  const fondo = '#efe6d2'
  const cuello = w * 0.15
  const r = (n: number) => Math.round(n * 10) / 10
  // El saco: lados un poco abombados que se cierran en el cuello amarrado; arriba, la boca fruncida.
  const cuerpo = `M${r(x0 + 14)},${base} Q${r(x0)},${base} ${r(x0)},${base - 16} L${r(x0 + 3)},${r(y0 + 52)} Q${r(x0 + 6)},${r(y0 + 30)} ${r(cx - cuello)},${r(y0 + 22)} L${r(cx + cuello)},${r(y0 + 22)} Q${r(x1 - 6)},${r(y0 + 30)} ${r(x1 - 3)},${r(y0 + 52)} L${r(x1)},${base - 16} Q${r(x1)},${base} ${r(x1 - 14)},${base} Z`
  const boca: [number, number][] = [
    [cx - cuello, y0 + 22],
    [cx - cuello * 1.5, y0 + 4],
    [cx - cuello * 0.5, y0 + 12],
    [cx, y0 + 2],
    [cx + cuello * 0.5, y0 + 12],
    [cx + cuello * 1.5, y0 + 4],
    [cx + cuello, y0 + 22],
  ]
  const partes = [
    poligono(boca, { relleno: fondo, grosor: 2 }),
    ruta(cuerpo, { relleno: fondo, grosor: 2 }),
    linea(cx - cuello - 3, y0 + 21, cx + cuello + 3, y0 + 21, { grosor: 3.5 }),
    texto(cx, y0 + 22 + (h - 22) * (etiqueta ? 0.3 : 0.5), nombreP, { tam: 15, peso: 700 }),
  ]
  if (etiqueta) {
    const ew = Math.max(70, anchoTexto(etiqueta, 18) * 1.1 + 16)
    const ey = y0 + 22 + (h - 22) * 0.52
    partes.push(rect(cx - ew / 2, ey, ew, 30, { relleno: '#ffffff', grosor: 1.8, redondeo: 4 }), texto(cx, ey + 15, etiqueta, { tam: 18, peso: 700 }))
  }
  return partes.join('')
}

/** Balanza de dos platillos en equilibrio: a la izquierda el producto y a la derecha las pesas. */
function dibujoBalanza(producto: string, etiqueta: string | undefined, gs: (number | null)[], alt: string): Dibujo {
  const plato = 156
  const partes = [
    rect(180, 256, 160, 34, { relleno: CLARO, grosor: 2, redondeo: 8 }),
    rect(250, 206, 20, 52, { relleno: '#d0d0d0', grosor: 2 }),
    // El fiel: la aguja vertical marca que la balanza está en equilibrio.
    rect(234, 116, 52, 26, { relleno: '#ffffff', grosor: 1.8, redondeo: 4 }),
    linea(246, 120, 246, 128, { grosor: 1.6 }),
    linea(274, 120, 274, 128, { grosor: 1.6 }),
    linea(260, 118, 260, 132, { grosor: 2 }),
    linea(260, 204, 260, 124, { grosor: 2.6 }),
    rect(60, 198, 400, 14, { relleno: '#d9d9d9', grosor: 2, redondeo: 5 }),
    circulo(260, 205, 6, { relleno: TINTA, grosor: 1.4 }),
    rect(124, plato + 8, 12, 34, { relleno: '#d0d0d0', grosor: 1.8 }),
    rect(384, plato + 8, 12, 34, { relleno: '#d0d0d0', grosor: 1.8 }),
    el('ellipse', { cx: 130, cy: plato + 6, rx: 104, ry: 10, fill: '#cfcfcf', stroke: TINTA, 'stroke-width': 2 }),
    el('ellipse', { cx: 390, cy: plato + 6, rx: 104, ry: 10, fill: '#cfcfcf', stroke: TINTA, 'stroke-width': 2 }),
    saco(130, plato, 112, 124, producto, etiqueta),
    pesasEnPlatillo(390, plato, gs),
  ]
  return svg(520, 296, partes.join(''), alt)
}

const PRODUCTOS = ['ARROZ', 'AZÚCAR', 'QUINUA', 'PAPA', 'CAMOTE', 'MAÍZ', 'FREJOL', 'HARINA', 'OLLUCO', 'HABAS']
const deProducto = (p: string) => p.toLowerCase().replace('papa', 'papas').replace('olluco', 'ollucos').replace('camote', 'camotes')

/** Texto de una masa en gramos: «1 kg» si son kilos exactos, «1/2 kg» para 500 g de un lado en kilos. */
const kilos = (g: number) => (g === 500 ? '1/2 kg' : `${g / 1000} kg`)

/**
 * Por nivel: cuántas pesas hay (y cuántas de 1 kg) al sumar, y cuánto pesa la bolsa y qué pesas hay cuando falta una.
 * Fácil: 2 o 3 pesas, a lo más una de 1 kg; la bolsa de 1 kg. Difícil: de 4 a 6 pesas, hasta 3 kg; la bolsa de 2 o 3 kg.
 */
const NIVEL_BALANZA: Record<Nivel, { kilos: [number, number]; doscientos: number; pesas: [number, number]; bolsas: number[]; faltas: number[]; puestas: number[] }> = {
  1: { kilos: [0, 1], doscientos: 1, pesas: [2, 3], bolsas: [1000], faltas: [500, 600, 700, 800], puestas: [1000, 500, 200, 200, 100] },
  2: { kilos: [1, 2], doscientos: 2, pesas: [2, 6], bolsas: [1000, 1000, 2000], faltas: [100, 200, 300, 400, 500, 600, 700, 800], puestas: [1000, 500, 200, 200, 100] },
  3: { kilos: [1, 3], doscientos: 2, pesas: [4, 6], bolsas: [2000, 3000], faltas: [100, 200, 300, 400, 500, 600, 700, 800, 900], puestas: [1000, 1000, 1000, 500, 200, 200, 100] },
}

export const balanza: TipoPregunta = {
  id: 'fr-balanza',
  nombre: 'Lee la balanza',
  queHacen: 'Miran una balanza en equilibrio y calculan cuánto pesa un producto, o qué pesa falta, en kilogramos y gramos.',
  citas: { [P4]: CITA.masa },
  ...BASE,
  niveles: true,
  generar({ azar, nivel = 2 }) {
    const N = NIVEL_BALANZA[nivel]
    const producto = elegir(azar, PRODUCTOS)
    const bolsa = `la bolsa de ${deProducto(producto)}`
    if (azar() < 0.62) {
      const cant = hasta(() => {
        // En el nivel 2, 1 kg casi siempre (y a veces ninguno), como siempre.
        const kg = nivel === 2 ? entero(azar, azar() < 0.85 ? 1 : 0, 2) : entero(azar, N.kilos[0], N.kilos[1])
        const c = { 1000: kg, 500: entero(azar, 0, 1), 200: entero(azar, 0, N.doscientos), 100: entero(azar, 0, 1) }
        const total = c[1000] + c[500] + c[200] + c[100]
        return total >= N.pesas[0] && total <= N.pesas[1] && c[500] + c[200] + c[100] > 0 ? c : null
      })
      const gs = [1000, 500, 200, 100].flatMap((g) => Array<number>(cant[g as 1000]).fill(g))
      const T = gs.reduce((s, g) => s + g, 0)
      const gramos = T - 1000 * cant[1000]
      // Leer «1 kg» como 1 g o como 100 g, olvidar la pesa más chica, contar mal una pesa.
      const frecuentes = cant[1000] ? [gramos + cant[1000], gramos + 100 * cant[1000], T - gs[gs.length - 1], T + 100, T - 100] : [T - gs[gs.length - 1], T + 100, T - 100, T + 1000]
      const alt = conError(azar, num(T), distractores(T, frecuentes, { min: 50, paso: 100 }), 4)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `balanza:${producto}:${gs.join('-')}`,
        enunciado: `La balanza está en equilibrio: a un lado está ${bolsa} y al otro, las pesas.`,
        dibujo: dibujoBalanza(producto, undefined, gs, `Balanza en equilibrio: ${bolsa} y pesas de ${gs.map((g) => PESAS[g].t).join(', ')}`),
        pregunta: `¿Cuántos gramos pesa ${bolsa}?`,
        ...alt,
        alternativas: alt.alternativas.map((x) => `${x} g`),
        nota: `1 kg = 1000 g. ${gs.map((g) => num(g)).join(' + ')} = ${num(T)} g.`,
        pasos: [
          `Pesas: ${gs.map((g) => PESAS[g].t).join(', ')}`,
          ...(cant[1000] ? [`1 kg = ${num(1000)} g`] : []),
          `Total: ${gs.map((g) => num(g)).join(' + ')} = ${num(T)} g`,
        ],
      }
    }
    // ¿Qué pesa falta? La bolsa dice cuánto pesa; en el otro platillo falta una pesa.
    const M = elegir(azar, N.bolsas)
    const falta = elegir(azar, N.faltas)
    let resto = M - falta
    const gs: number[] = []
    for (const g of N.puestas) {
      if (g <= resto) {
        gs.push(g)
        resto -= g
      }
    }
    if (resto !== 0 || gs.length > 5) return null
    const S = M - falta
    const alt = conError(azar, num(falta), distractores(falta, [S, falta + 100, falta - 100, M - S + 1000, falta + 200], { min: 50, paso: 100 }), 4)
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `balanza-falta:${producto}:${M}:${gs.join('-')}`,
      enunciado: `${bolsa[0].toUpperCase()}${bolsa.slice(1)} pesa ${kilos(M)}. Para que la balanza quede en equilibrio, falta poner la pesa que tiene «?».`,
      dibujo: dibujoBalanza(producto, kilos(M), [...gs, null], `Balanza: ${bolsa} de ${kilos(M)} y pesas de ${gs.map((g) => PESAS[g].t).join(', ')} y una pesa con signo de pregunta`),
      pregunta: '¿Cuántos gramos debe pesar la pesa que falta?',
      ...alt,
      alternativas: alt.alternativas.map((x) => `${x} g`),
      nota: `${kilos(M)} = ${num(M)} g. ${num(M)} − ${num(S)} = ${num(falta)} g.`,
      pasos: [
        `La bolsa pesa ${kilos(M)} = ${num(M)} g`,
        `Pesas puestas: ${gs.length > 1 ? `${gs.map((g) => num(g)).join(' + ')} = ` : ''}${num(S)} g`,
        `Falta: ${num(M)} − ${num(S)} = ${num(falta)} g`,
      ],
    }
  },
}

/** Sacos en el mostrador del mercado, cada uno con su nombre y su etiqueta. */
function dibujoMostrador(sacos: { producto: string; etiqueta: string }[]): Dibujo {
  const paso = 170
  const W = sacos.length * paso + 20
  const partes = [rect(6, 168, W - 12, 14, { relleno: '#e2d3b5', grosor: 2, redondeo: 3 })]
  sacos.forEach((s, i) => partes.push(saco(10 + paso / 2 + i * paso, 168, 128, 150, s.producto, s.etiqueta)))
  return svg(W, 188, partes.join(''), sacos.map((s) => `bolsa de ${deProducto(s.producto)} de ${s.etiqueta}`).join(', '))
}

/**
 * Por nivel: hasta dónde llega `modo` para comparar dos bolsas y tres bolsas (lo demás: cuánto pesan juntas o, en el 3,
 * cuánto más pesa una que otra), y qué tan cerca están las masas. Fácil: diferencias grandes y sin tres bolsas.
 * Difícil: diferencias de 50 o 100 g, tres bolsas más seguido y «¿cuántos gramos más pesa?» (comparar y restar).
 */
const NIVEL_MASAS: Record<Nivel, { dos: number; tres: number; kilos: number[]; cerca: number[]; kilos3: number[]; cerca3: number[]; juntasK: number[]; juntasG: number[] }> = {
  1: { dos: 0.55, tres: 0.55, kilos: [1000, 2000], cerca: [-800, -700, -600, 500, 1000], kilos3: [1000, 2000], cerca3: [100, 200, 250, 500], juntasK: [1000, 2000], juntasG: [100, 200, 300, 400, 500] },
  2: { dos: 0.45, tres: 0.72, kilos: [1000, 1000, 2000, 3000, 500], cerca: [-500, -250, -200, -100, 0, 100, 200, 250, 500], kilos3: [1000, 2000], cerca3: [100, 200, 250, 500], juntasK: [1000, 2000, 500], juntasG: [100, 200, 250, 300, 400, 600, 750, 800] },
  3: { dos: 0.3, tres: 0.62, kilos: [1000, 2000, 3000], cerca: [-100, -50, 0, 50, 100, -250, 250], kilos3: [1000, 2000, 3000], cerca3: [50, 100, 200, 250], juntasK: [], juntasG: [] },
}

/** Nivel 3 de «¿Cuál pesa más?»: una bolsa en kilos y otra en gramos, y cuántos gramos más pesa la más pesada. */
function cuantoMasPesa(azar: Azar, productos: string[]): ReturnType<TipoPregunta['generar']> {
  const K = elegir(azar, [1000, 2000, 3000])
  const G = K + elegir(azar, [-750, -500, -250, -200, 300, 500, 800])
  const D = Math.abs(K - G)
  const enKilosPrimero = azar() < 0.5
  const sacos = [
    { producto: productos[0], etiqueta: kilos(K), g: K },
    { producto: productos[1], etiqueta: `${num(G)} g`, g: G },
  ]
  if (!enKilosPrimero) sacos.reverse()
  const [pesada, liviana] = sacos[0].g > sacos[1].g ? sacos : [sacos[1], sacos[0]]
  // Restar sin pasar los kilos a gramos, sumar en vez de restar, quedarse corto o pasarse.
  const frecuentes = [Math.abs(G - K / 1000), K + G, D + 100, D - 100, D + 50, D - 50]
  const alt = conError(azar, num(D), distractores(D, frecuentes, { min: 50, paso: 50 }), 4)
  if (!alt) return null
  const quien = nombre(azar)
  return {
    forma: 'opciones',
    clave: `masas-diferencia:${K}:${G}`,
    enunciado: `${quien} compró estas dos bolsas en el mercado.`,
    dibujo: dibujoMostrador(sacos),
    pregunta: `¿Cuántos gramos más pesa la bolsa de ${deProducto(pesada.producto)} que la de ${deProducto(liviana.producto)}?`,
    ...alt,
    alternativas: alt.alternativas.map((x) => `${x} g`),
    nota: `${kilos(K)} = ${num(K)} g. ${num(pesada.g)} − ${num(liviana.g)} = ${num(D)} g.`,
    pasos: [
      `En gramos: ${kilos(K)} = ${num(K)} g`,
      `${mayus(deProducto(pesada.producto))}: ${num(pesada.g)} g; ${deProducto(liviana.producto)}: ${num(liviana.g)} g`,
      `Diferencia: ${num(pesada.g)} − ${num(liviana.g)} = ${num(D)} g`,
    ],
  }
}

export const masas: TipoPregunta = {
  id: 'fr-masas',
  nombre: '¿Cuál pesa más?',
  queHacen: 'Comparan masas escritas en kilogramos y en gramos (1 kg = 1000 g) y dicen cuál pesa más, cuál menos o cuánto pesan juntas.',
  citas: { [P4]: CITA.masa },
  ...BASE,
  niveles: true,
  generar({ azar, nivel = 2 }) {
    const N = NIVEL_MASAS[nivel]
    const modo = azar()
    const productos = barajar(azar, PRODUCTOS)
    const bolsaDe = (p: string) => `La bolsa de ${deProducto(p)}`
    if (modo < N.dos) {
      // Una en kilos y otra en gramos: el error es creer que 800 g pesa más que 1 kg porque 800 > 1.
      const [K, G] = hasta(() => {
        const k = elegir(azar, N.kilos)
        const g = k + elegir(azar, N.cerca)
        return g <= 0 || g === 500 || (k === 500 && g < 200) ? null : [k, g]
      })
      const enKilos = azar() < 0.5 ? 0 : 1
      const sacos = [
        { producto: productos[0], etiqueta: enKilos === 0 ? kilos(K) : `${num(G)} g`, g: enKilos === 0 ? K : G },
        { producto: productos[1], etiqueta: enKilos === 0 ? `${num(G)} g` : kilos(K), g: enKilos === 0 ? G : K },
      ]
      const mas = azar() < 0.65
      const [x, y] = sacos
      const correcta = x.g === y.g ? 'Pesan lo mismo' : (x.g > y.g) === mas ? bolsaDe(x.producto) : bolsaDe(y.producto)
      const alt = alternativas(azar, correcta, [bolsaDe(x.producto), bolsaDe(y.producto), 'Pesan lo mismo'], 3)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `masas:${sacos.map((s) => s.etiqueta).join('|')}`,
        enunciado: 'Observa las bolsas en el mostrador del mercado.',
        dibujo: dibujoMostrador(sacos),
        pregunta: mas ? '¿Qué bolsa pesa más?' : '¿Qué bolsa pesa menos?',
        ...alt,
        nota: `${kilos(K)} = ${num(K)} g.`,
        pasos: [
          `En gramos: ${kilos(K)} = ${num(K)} g`,
          sacos.map((s, i) => `${i ? deProducto(s.producto) : mayus(deProducto(s.producto))}: ${num(s.g)} g`).join('; '),
          x.g === y.g
            ? `Pesan lo mismo: ${num(x.g)} g = ${num(y.g)} g`
            : `${correcta} pesa ${mas ? 'más' : 'menos'}: ${mas ? num(Math.max(x.g, y.g)) : num(Math.min(x.g, y.g))} g ${mas ? '>' : '<'} ${mas ? num(Math.min(x.g, y.g)) : num(Math.max(x.g, y.g))} g`,
        ],
      }
    }
    if (modo < N.tres) {
      const K = elegir(azar, N.kilos3)
      const gs = hasta(() => {
        const x = barajar(azar, [K, K - elegir(azar, N.cerca3), K + elegir(azar, N.cerca3)])
        return x.some((g) => g === 500) ? null : x
      })
      const sacos = gs.map((g, i) => ({ producto: productos[i], etiqueta: g === K ? kilos(K) : `${num(g)} g`, g }))
      const mas = azar() < 0.5
      const elegido = sacos.reduce((m, s) => ((mas ? s.g > m.g : s.g < m.g) ? s : m))
      const alt = alternativas(azar, bolsaDe(elegido.producto), sacos.map((s) => bolsaDe(s.producto)), 3)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `masas:${sacos.map((s) => s.etiqueta).join('|')}`,
        enunciado: 'Observa las bolsas en el mostrador del mercado.',
        dibujo: dibujoMostrador(sacos),
        pregunta: mas ? '¿Qué bolsa pesa más?' : '¿Qué bolsa pesa menos?',
        ...alt,
        nota: `${kilos(K)} = ${num(K)} g.`,
        pasos: [
          `En gramos: ${kilos(K)} = ${num(K)} g`,
          sacos.map((s, i) => `${i ? deProducto(s.producto) : mayus(deProducto(s.producto))}: ${num(s.g)} g`).join('; '),
          `${bolsaDe(elegido.producto)} pesa ${mas ? 'más' : 'menos'}: ${num(elegido.g)} g`,
        ],
      }
    }
    if (nivel === 3) return cuantoMasPesa(azar, productos)
    // ¿Cuánto pesan juntas?
    const K = elegir(azar, N.juntasK)
    const G = elegir(azar, N.juntasG)
    const T = K + G
    const kgComoUno = K === 500 ? null : K / 1000 + G
    const frecuentes = [kgComoUno ?? T + 1000, K / 10 + G, T + 100, T - 100, T + 1000]
    const alt = conError(azar, num(T), distractores(T, frecuentes, { min: 50, paso: 50 }), 4)
    if (!alt) return null
    const quien = nombre(azar)
    const sacos = [
      { producto: productos[0], etiqueta: kilos(K) },
      { producto: productos[1], etiqueta: `${num(G)} g` },
    ]
    return {
      forma: 'opciones',
      clave: `masas-juntas:${K}+${G}`,
      enunciado: `${quien} compró estas dos bolsas en el mercado.`,
      dibujo: dibujoMostrador(sacos),
      pregunta: '¿Cuántos gramos pesan las dos bolsas juntas?',
      ...alt,
      alternativas: alt.alternativas.map((x) => `${x} g`),
      nota: `${kilos(K)} = ${num(K)} g. ${num(K)} + ${num(G)} = ${num(T)} g.`,
      pasos: [`En gramos: ${kilos(K)} = ${num(K)} g`, `Juntas: ${num(K)} + ${num(G)} = ${num(T)} g`],
    }
  },
}

// ---------- Horas, medias horas y cuartos: el reloj de agujas ----------

const rad = (g: number) => (g * Math.PI) / 180

/** La cara de un reloj de agujas; sin hora, solo los números (para dibujar las agujas). */
function caraReloj(cx: number, cy: number, R: number, t: number | null) {
  const partes = [circulo(cx, cy, R, { relleno: '#ffffff', grosor: 3.4 })]
  for (let i = 0; i < 60; i++) {
    const g = rad(i * 6)
    const largo = i % 5 === 0 ? 10 : 5
    const r0 = R - 5
    partes.push(linea(cx + r0 * Math.sin(g), cy - r0 * Math.cos(g), cx + (r0 - largo) * Math.sin(g), cy - (r0 - largo) * Math.cos(g), { grosor: i % 5 === 0 ? 2.4 : 1.4 }))
  }
  for (let k = 1; k <= 12; k++) {
    const g = rad(k * 30)
    partes.push(texto(cx + (R - 26) * Math.sin(g), cy - (R - 26) * Math.cos(g) + 1, String(k), { tam: 18, peso: 700 }))
  }
  if (t !== null) {
    const h = Math.floor(t / 60) % 12
    const m = t % 60
    // Las agujas terminan en punta antes de los números, para que no tapen ninguno: la corta es gruesa y la larga, delgada.
    partes.push(aguja(cx, cy, rad((h + m / 60) * 30), R * 0.34, 10))
    partes.push(aguja(cx, cy, rad(m * 6), R - 34, 4.5))
  }
  partes.push(circulo(cx, cy, 6, { relleno: TINTA, grosor: 1.4 }))
  return partes.join('')
}

/** Una aguja del reloj: una flecha angosta desde el centro, de largo `l` y ancho `a` en la base. */
function aguja(cx: number, cy: number, g: number, l: number, a: number) {
  const ux = Math.sin(g)
  const uy = -Math.cos(g)
  const px = -uy
  const py = ux
  const cuello = l - a * 1.6
  return poligono(
    [
      [cx - (a / 2) * px - 6 * ux, cy - (a / 2) * py - 6 * uy],
      [cx + (cuello * ux) - (a / 2) * px, cy + cuello * uy - (a / 2) * py],
      [cx + cuello * ux - a * px, cy + cuello * uy - a * py],
      [cx + l * ux, cy + l * uy],
      [cx + cuello * ux + a * px, cy + cuello * uy + a * py],
      [cx + cuello * ux + (a / 2) * px, cy + cuello * uy + (a / 2) * py],
      [cx + (a / 2) * px - 6 * ux, cy + (a / 2) * py - 6 * uy],
    ],
    { relleno: TINTA, grosor: 1.4 },
  )
}

const R_RELOJ = 86

function dibujoReloj(t: number | null): Dibujo {
  const c = R_RELOJ + 6
  return svg(2 * c, 2 * c, caraReloj(c, c, R_RELOJ, t), t === null ? 'Reloj de agujas sin agujas' : `Reloj de agujas que marca ${horaTexto(t).toLowerCase()}`)
}

/** Dos relojes con su nombre debajo y una flecha entre ellos. */
function dibujoDosRelojes(t0: number, t1: number, etiquetas: [string, string]): Dibujo {
  const c = R_RELOJ + 6
  const x1 = 2 * c + 80
  const partes = [
    caraReloj(c, c, R_RELOJ, t0),
    caraReloj(x1 + c, c, R_RELOJ, t1),
    linea(2 * c + 14, c, x1 - 18, c, { grosor: 3 }),
    poligono([[x1 - 8, c], [x1 - 22, c - 8], [x1 - 22, c + 8]], { relleno: TINTA, grosor: 1.4 }),
    texto(c, 2 * c + 22, etiquetas[0], { tam: 17, peso: 700 }),
    texto(x1 + c, 2 * c + 22, etiquetas[1], { tam: 17, peso: 700 }),
  ]
  return svg(x1 + 2 * c, 2 * c + 36, partes.join(''), `Dos relojes: ${etiquetas[0].toLowerCase()} ${horaTexto(t0).toLowerCase()} y ${etiquetas[1].toLowerCase()} ${horaTexto(t1).toLowerCase()}`)
}

/** La hora como se dice en el aula: «Las 3 y cuarto», «La 1 en punto», «Las 5 menos cuarto». `t` en minutos. */
function horaTexto(t: number) {
  const doce = (x: number) => ((((x - 1) % 12) + 12) % 12) + 1
  const m = ((t % 60) + 60) % 60
  const H = Math.floor(t / 60)
  const h = m === 45 ? doce(H + 1) : doce(H)
  const cola = m === 0 ? 'en punto' : m === 15 ? 'y cuarto' : m === 30 ? 'y media' : 'menos cuarto'
  return `${h === 1 ? 'La' : 'Las'} ${h} ${cola}`
}

/** La hora, de 1 a 12, a los `t` minutos. */
const hora12 = (t: number) => ((((Math.floor(t / 60) - 1) % 12) + 12) % 12) + 1
/** «3:15», como en un reloj digital. */
const hhmm = (t: number) => `${hora12(t)}:${String(((t % 60) + 60) % 60).padStart(2, '0')}`
/** «las 3:15», «la 1:45». */
const alas = (t: number) => `${hora12(t) === 1 ? 'la' : 'las'} ${hhmm(t)}`

/** Dónde están las agujas a la hora `t` (en un cuarto de hora exacto): primero la larga y luego la corta. */
function agujas(t: number): [string, string] {
  const m = ((t % 60) + 60) % 60
  const h = hora12(t)
  const sig = (h % 12) + 1
  if (m === 0) return ['La aguja larga apunta al 12: en punto', `La aguja corta apunta al ${h}`]
  if (m === 15) return ['La aguja larga apunta al 3: 15 minutos, y cuarto', `La aguja corta pasó un poco del ${h}`]
  if (m === 30) return ['La aguja larga apunta al 6: 30 minutos, y media', `La aguja corta está entre el ${h} y el ${sig}`]
  return ['La aguja larga apunta al 9: 45 minutos, faltan 15 (menos cuarto)', `La aguja corta está casi en el ${sig}`]
}

/** Una duración en minutos (múltiplo de 15) como se dice: «Media hora», «1 hora y cuarto», «2 horas y media». */
function duracionTexto(min: number) {
  const h = Math.floor(min / 60)
  const r = min % 60
  if (h === 0) return r === 15 ? 'Un cuarto de hora' : r === 30 ? 'Media hora' : 'Tres cuartos de hora'
  const horas = h === 1 ? '1 hora' : `${h} horas`
  return r === 0 ? horas : `${horas} y ${r === 15 ? 'cuarto' : r === 30 ? 'media' : 'tres cuartos'}`
}

const MINUTOS = [0, 15, 15, 30, 30, 45, 45, 45]

/** Hora al azar en minutos, en un cuarto de hora exacto; más «y cuarto» y «menos cuarto», que es donde más se equivocan. */
const horaAlAzar = (azar: Azar, desde: number, hasta12: number, minutos = MINUTOS) => entero(azar, desde, hasta12) * 60 + elegir(azar, minutos)

const LECTURAS = [
  { enunciado: 'Observa el reloj del aula.', pregunta: '¿Qué hora marca el reloj?' },
  { enunciado: 'El recreo empieza a la hora que marca el reloj.', pregunta: '¿A qué hora empieza el recreo?' },
  { enunciado: 'La combi pasa por el paradero a la hora que marca el reloj.', pregunta: '¿A qué hora pasa la combi?' },
  { enunciado: 'La bodega de la esquina abre a la hora que marca el reloj.', pregunta: '¿A qué hora abre la bodega?' },
]

/**
 * Por nivel: qué minutos salen y, al leer, cuántas veces las alternativas van como en el reloj digital (3:45). Fácil:
 * solo en punto y y media, con errores de una hora o de media hora. Difícil: casi siempre y cuarto o menos cuarto, y la
 * mitad de las veces hay que pasar la hora a la forma digital (las 4 menos cuarto es 3:45, no 4:45).
 */
const NIVEL_RELOJ: Record<Nivel, { minutos: number[]; digital: number }> = {
  1: { minutos: [0, 0, 30, 30], digital: 0 },
  2: { minutos: MINUTOS, digital: 0 },
  3: { minutos: [15, 15, 30, 45, 45, 45], digital: 0.5 },
}

export const reloj: TipoPregunta = {
  id: 'fr-reloj',
  nombre: '¿Qué hora es?',
  queHacen: 'Leen en un reloj de agujas la hora en punto, y media, y cuarto o menos cuarto, o dibujan las agujas.',
  citas: { [P4]: CITA.tiempo },
  ...BASE,
  niveles: true,
  generar({ azar, nivel = 2 }) {
    const N = NIVEL_RELOJ[nivel]
    const t = horaAlAzar(azar, 1, 12, N.minutos)
    const m = t % 60
    const modo = azar()
    // Difícil: la hora se da (o se escoge) como en un reloj digital y hay que pasarla a las agujas (3:45 es «las 4 menos
    // cuarto»: la aguja corta casi en el 4).
    const digital = N.digital > 0 && azar() < N.digital
    if (modo < 0.25) {
      const h = Math.floor(t / 60)
      const sig = (h % 12) + 1
      const respuesta =
        m === 0
          ? `Aguja larga en el 12 y aguja corta en el ${h}.`
          : m === 15
            ? `Aguja larga en el 3 y aguja corta un poco después del ${h}.`
            : m === 30
              ? `Aguja larga en el 6 y aguja corta entre el ${h} y el ${sig}.`
              : `Aguja larga en el 9 y aguja corta cerca del ${sig}, sin llegar.`
      return {
        forma: 'abierta',
        clave: `reloj:${t}`,
        enunciado: `Dibuja las agujas del reloj para que marque ${digital ? alas(t) : horaTexto(t).toLowerCase()}.`,
        dibujo: dibujoReloj(null),
        respuesta,
        espacio: 'dibujo',
        pasos: [digital ? `${hhmm(t)} es ${horaTexto(t).toLowerCase()}` : `${horaTexto(t)}: ${hhmm(t)}`, ...agujas(t)],
      }
    }
    if (modo < 0.42) {
      const larga = m === 0 ? 12 : m / 5
      const alt = alternativas(azar, String(larga), ['12', '3', '6', '9'], 4)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `reloj-aguja:${m}`,
        enunciado: `Observa los números del reloj. Piensa en ${digital ? alas(t) : horaTexto(t).toLowerCase()}.`,
        dibujo: dibujoReloj(null),
        pregunta: `A ${digital ? alas(t) : horaTexto(t).toLowerCase()}, ¿a qué número apunta la aguja larga?`,
        ...alt,
        pasos:
          m === 0
            ? ['En punto: la aguja larga apunta al 12']
            : [
                digital
                  ? `${hhmm(t)}: la aguja larga marca los ${m} minutos`
                  : `${m === 15 ? 'Y cuarto' : m === 30 ? 'Y media' : 'Menos cuarto'}: ${m} minutos${m === 45 ? ' (faltan 15 para la hora)' : ''}`,
                `Cada número son 5 minutos: ${m} ÷ 5 = ${larga}; la aguja larga apunta al ${larga}`,
              ],
      }
    }
    // Confundir «y cuarto» con «menos cuarto», leer mal la hora por una, cambiar las agujas.
    const h = Math.floor(t / 60)
    const cambiadas = m === 0 && [3, 6, 9].includes(h) ? [12 * 60 + h * 5] : []
    // Fácil: con y media, los errores son de una hora o de media hora (sin cuartos).
    const errores =
      m === 0
        ? [...cambiadas, t + 60, t - 60, t + 30]
        : m === 15
          ? [t - 30, t + 60, t - 60, t + 15]
          : m === 30
            ? nivel === 1
              ? [t + 60, t - 30, t + 30, t - 60]
              : [t + 60, t - 15, t + 15, t - 60]
            : [t + 30, t - 60, t + 60, t - 15]
    const comoSeDice = digital ? hhmm : horaTexto
    const alt = conError(azar, comoSeDice(t), errores.map(comoSeDice), 4)
    if (!alt) return null
    const l = elegir(azar, LECTURAS)
    return {
      forma: 'opciones',
      clave: `reloj:${t}`,
      enunciado: l.enunciado,
      dibujo: dibujoReloj(t),
      pregunta: digital ? `${l.pregunta} Escoge la hora como se ve en un reloj digital.` : l.pregunta,
      ...alt,
      pasos: [...agujas(t), `${horaTexto(t)} (${hhmm(t)})`],
    }
  },
}

const DURACIONES = [15, 30, 45, 60, 60, 75, 90, 90, 105, 120, 135, 150, 180]

const EVENTOS: { que: string; etiquetas: [string, string]; pregunta: string }[] = [
  { que: 'el partido de fulbito', etiquetas: ['Empezó', 'Terminó'], pregunta: '¿Cuánto tiempo duró el partido?' },
  { que: 'la combi: salió del paradero y llegó a la plaza', etiquetas: ['Salió', 'Llegó'], pregunta: '¿Cuánto tiempo demoró el viaje?' },
  { que: 'la procesión de la fiesta patronal', etiquetas: ['Salió', 'Regresó'], pregunta: '¿Cuánto tiempo duró la procesión?' },
  { que: 'el taller de danza del colegio', etiquetas: ['Empezó', 'Terminó'], pregunta: '¿Cuánto tiempo duró el taller?' },
]

const CLASES = ['La clase de Arte', 'El ensayo de la banda del colegio', 'La reunión de padres', 'El taller de cuentos']

/**
 * Por nivel: qué duraciones y qué horas de inicio salen, y cuántas veces se pregunta a qué hora termina (sumar) en vez de
 * a qué hora empezó (restar, más difícil). Fácil: horas y medias horas, empezando en punto o y media, y solo «¿a qué hora
 * termina?». Difícil: duraciones con cuartos que pasan de una hora a otra, empezando y cuarto o menos cuarto.
 */
const NIVEL_DURACION: Record<Nivel, { duraciones: number[]; minutos: number[]; relojes: number; cortas: number[]; empieza: number; error: number }> = {
  1: { duraciones: [30, 60, 60, 90, 120], minutos: [0, 0, 30], relojes: 0.6, cortas: [30, 60], empieza: 1, error: 30 },
  2: { duraciones: DURACIONES, minutos: MINUTOS, relojes: 0.6, cortas: [15, 30, 45, 60, 90], empieza: 0.82, error: 15 },
  3: { duraciones: [45, 75, 105, 135, 165], minutos: [15, 30, 45, 45], relojes: 0.5, cortas: [45, 75, 90, 105], empieza: 0.7, error: 15 },
}

export const duracion: TipoPregunta = {
  id: 'fr-duracion',
  nombre: '¿Cuánto tiempo pasó?',
  queHacen: 'Miran dos relojes de agujas y dicen cuánto tiempo pasó en horas, medias horas y cuartos de hora, o a qué hora termina algo.',
  citas: { [P4]: CITA.tiempo },
  ...BASE,
  niveles: true,
  generar({ azar, nivel = 2 }) {
    const N = NIVEL_DURACION[nivel]
    const modo = azar()
    if (modo < N.relojes) {
      const d = elegir(azar, N.duraciones)
      const t0 = horaAlAzar(azar, 7, 15, N.minutos)
      const t1 = t0 + d
      // Contar solo las horas, quedarse corto o pasarse un cuarto de hora (media hora en el fácil), o una hora.
      const soloHoras = (Math.floor(t1 / 60) - Math.floor(t0 / 60)) * 60
      const malas = [soloHoras, d - N.error, d + N.error, d + 60, d - 60, d + 30, d - 30].filter((x) => x > 0 && x <= 240)
      const alt = conError(azar, duracionTexto(d), malas.map(duracionTexto), 4)
      if (!alt) return null
      const e = elegir(azar, EVENTOS)
      const horas = Math.floor(d / 60)
      const minutos = d % 60
      const conHoras = horas === 1 ? '1 hora' : `${horas} horas`
      return {
        forma: 'opciones',
        clave: `duracion:${t0}:${d}`,
        enunciado: `Los relojes muestran a qué hora empezó y terminó ${e.que}.`.replace('empezó y terminó la combi: salió del paradero y llegó a la plaza', 'salió la combi del paradero y a qué hora llegó a la plaza').replace('empezó y terminó la procesión', 'salió y regresó la procesión'),
        dibujo: dibujoDosRelojes(t0, t1, e.etiquetas),
        pregunta: e.pregunta,
        ...alt,
        nota: `De ${horaTexto(t0).toLowerCase()} a ${horaTexto(t1).toLowerCase()} pasan ${d} minutos.`,
        pasos: [
          `${e.etiquetas[0]} a ${alas(t0)} y ${e.etiquetas[1].toLowerCase()} a ${alas(t1)}`,
          horas && minutos
            ? `De ${hhmm(t0)} a ${hhmm(t0 + horas * 60)}: ${conHoras}; de ${hhmm(t0 + horas * 60)} a ${hhmm(t1)}: ${minutos} minutos`
            : `De ${hhmm(t0)} a ${hhmm(t1)}: ${horas ? conHoras : `${minutos} minutos`}`,
          `${duracionTexto(d)} (${d} minutos)`,
        ],
      }
    }
    const d = elegir(azar, N.cortas)
    const empieza = modo < N.empieza
    const t0 = horaAlAzar(azar, 8, 15, N.minutos)
    const t1 = t0 + d
    const t = empieza ? t1 : t0
    const visto = empieza ? t0 : t1
    // Sumar cuando hay que restar (o al revés), equivocarse en un cuarto de hora o en una hora.
    const errores = empieza ? [t0 - d, t + N.error, t - N.error, t + 60, t - 60] : [t1 + d, t + N.error, t - N.error, t - 60, t + 60]
    const alt = conError(azar, horaTexto(t), errores.filter((x) => x !== visto).map(horaTexto), 4)
    if (!alt) return null
    const clase = elegir(azar, CLASES)
    return {
      forma: 'opciones',
      clave: `duracion-${empieza ? 'fin' : 'inicio'}:${visto}:${d}`,
      enunciado: empieza
        ? `${clase} empieza a la hora que marca el reloj y dura ${duracionTexto(d).toLowerCase()}.`
        : `${clase} terminó a la hora que marca el reloj. Duró ${duracionTexto(d).toLowerCase()}.`,
      dibujo: dibujoReloj(visto),
      pregunta: empieza ? '¿A qué hora termina?' : '¿A qué hora empezó?',
      ...alt,
      pasos: [
        `El reloj marca ${horaTexto(visto).toLowerCase()}: ${hhmm(visto)}`,
        empieza ? `${duracionTexto(d)} después de ${alas(t0)}: ${hhmm(t1)}` : `${duracionTexto(d)} antes de ${alas(t1)}: ${hhmm(t0)}`,
        `${horaTexto(t)} (${hhmm(t)})`,
      ],
    }
  },
}

export const GRUPO_FRACCIONES_MEDIDAS: Grupo = {
  tipos: [barra, coleccion, deCantidad, deDinero, comparar, ordenar, sumar, sumarEquivalentes, equivalentes, equivalentesRazon, amplificar, simplificar, balanza, masas, reloj, duracion],
  temas: {
    'La fracción como parte-todo': ['fr-barra', 'fr-coleccion'],
    'Fracciones de una cantidad': ['fr-de-cantidad', 'fr-de-dinero'],
    'Comparación de fracciones': ['fr-comparar', 'fr-ordenar'],
    'Suma y resta de fracciones': ['fr-sumar', 'fr-sumar-equivalentes'],
    'Amplificación y simplificación de fracciones': ['fr-amplificar', 'fr-simplificar'],
    'Fracciones usuales': ['fr-de-cantidad', 'fr-sumar', 'fr-de-dinero'],
    'Fracciones equivalentes': ['fr-equivalentes', 'fr-equivalentes-razon'],
    'Kilogramo y gramo': ['fr-balanza', 'fr-masas'],
    'Horas, medias horas y cuartos': ['fr-reloj', 'fr-duracion'],
    'Medidas de masa y tiempo': ['fr-balanza', 'fr-reloj', 'fr-masas', 'fr-duracion'],
  },
}
