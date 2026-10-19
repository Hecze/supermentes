// Tipos de pregunta de 4.º de primaria. Competencia 4 (gestión de datos e incertidumbre): tablas, pictogramas, gráficos de barras, moda, media, probabilidad y posibles resultados.
// Cada pregunta parte de una situación del Perú (la encuesta del aula, el mercado, la kermés, el menú del día) con un
// dibujo que se imprime en blanco y negro. Las alternativas incorrectas son los errores típicos: contar los símbolos
// en vez de multiplicar por su valor, leer la escala de uno en uno, sumar en vez de multiplicar las combinaciones,
// confundir la moda con su frecuencia o con el número más grande.
// Cada tipo tiene tres dificultades (`ctx.nivel`): con 2 sale la pregunta de siempre para esa semilla; con 1, menos
// datos, números más chicos y diferencias que se ven de lejos; con 3, más datos, valores parejos, un paso más o
// distractores más finos. Siempre dentro del desempeño citado.
import { barajar, elegir, entero } from '../../juegos/motor/azar'
import { distractores, num } from '../../juegos/matematica/formato'
import { GRIS, TINTA, anchoTexto, casilla, circulo, elipse, grupo, linea, poligono, r1, rect, ruta, svg, texto } from '../dibujos'
import type { Azar, Contexto, Dibujo, Generado, Grupo, Nivel, TipoPregunta } from '../tipos'
import { NOMBRES, alternativas, nombre, soles } from '../util'

const P4 = 'primaria-4'

/** Las citas, letra por letra, de los desempeños de 4.º (competencia 4). */
const CITA = {
  encuesta: 'Recopila datos mediante encuestas sencillas o entrevistas cortas con preguntas adecuadas', // D4
  organiza: 'los procesa y organiza en listas de datos, tablas de doble entrada o tablas de frecuencia', // D4
  leeTablas: 'Lee gráficos de barras con escala, tablas de doble entrada y pictogramas de frecuencias con equivalencias', // D3
  leePicto: 'pictogramas de frecuencias con equivalencias', // D3
  leeBarras: 'Lee gráficos de barras con escala', // D3
  hacePicto: 'a través de pictogramas verticales y horizontales (cada símbolo representa más de una unidad)', // D1
  haceBarras: 'gráficos de barras con escala dada (múltiplos de 10)', // D1
  moda: 'Expresa su comprensión de la moda como la mayor frecuencia', // D2
  media: 'para determinar la media aritmética como punto de equilibrio', // D5
  nociones: 'usando las nociones “seguro”, “más probable” y “menos probable”', // D2
  predice: 'Predice que la posibilidad de ocurrencia de un suceso es mayor que otro', // D6
  resultados: 'así como todos los posibles resultados de la ocurrencia de sucesos cotidianos', // D2
  diagrama: 'Selecciona y emplea procedimientos y recursos como el recuento, el diagrama', // D5
  conclusiones: 'explica sus decisiones y conclusiones a partir de la información obtenida con base en el análisis de datos', // D6
}

function tipo(id: string, nombreTipo: string, queHacen: string, cita: string, generar: (ctx: Contexto) => Generado | null): TipoPregunta {
  return { id, nombre: nombreTipo, queHacen, citas: { [P4]: cita }, area: 'matematica', competencia: 4, cambia: 'numeros', niveles: true, generar }
}

// ---------- Ayudas ----------

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const suma = (xs: number[]) => xs.reduce((s, x) => s + x, 0)
const f = r1

/** Algunos datos salen feos (empates, números que no cuadran): se vuelve a intentar y, si no sale, null. */
function intentar<T>(armar: () => T | null, veces = 80): T | null {
  for (let i = 0; i < veces; i++) {
    const r = armar()
    if (r !== null) return r
  }
  return null
}

/** n valores distintos entre min y max, de `paso` en `paso`. */
function distintos(azar: Azar, n: number, min: number, max: number, paso = 1): number[] {
  const todos: number[] = []
  for (let v = min; v <= max; v += paso) todos.push(v)
  return barajar(azar, todos).slice(0, n)
}

/** Índice del mayor (o del menor) si es único; -1 si hay empate. */
function unico(xs: number[], mayor = true) {
  const m = mayor ? Math.max(...xs) : Math.min(...xs)
  return xs.filter((x) => x === m).length === 1 ? xs.indexOf(m) : -1
}

/**
 * Votos distintos (de 3 a 18 en una tabla; de 10 en 10 hasta 80 en un gráfico) en los que el mayor (o el menor) le
 * saca al siguiente `pasos` votos o más (de 10 en 10 en el gráfico), o justo esos con `justo`: una moda que se ve de
 * lejos (más fácil) o reñida (más difícil).
 */
function votosCon(azar: Azar, n: number, enBarras: boolean, mayor: boolean, pasos: number, justo = false) {
  const paso = enBarras ? 10 : 1
  return intentar(() => {
    const v = enBarras ? distintos(azar, n, 10, 80, 10) : distintos(azar, n, 3, 18)
    const o = [...v].sort((a, b) => (mayor ? b - a : a - b))
    const d = Math.abs(o[0] - o[1]) / paso
    return (justo ? d === pasos : d >= pasos) ? v : null
  })
}

const opcionesNum = (azar: Azar, correcta: number, errores: number[], min = 0, paso = 1) =>
  alternativas(azar, num(correcta), distractores(correcta, errores, { min, paso }), 4)

type Alt = { alternativas: string[]; correcta: number }

/** Deja las alternativas en el orden del dibujo (bolsa A, B, C; las comidas como en la tabla). */
function ordenar(r: Alt | null, orden: string[]): Alt | null {
  if (!r) return null
  const buena = r.alternativas[r.correcta]
  const pos = (x: string) => {
    const i = orden.indexOf(x)
    return i < 0 ? 999 : i
  }
  const alt = [...r.alternativas].sort((a, b) => pos(a) - pos(b))
  return { alternativas: alt, correcta: alt.indexOf(buena) }
}

// ---------- Ayudas para los pasos de la clave ----------

/** "5 + 8 + 12" */
const sumados = (xs: number[]) => xs.map(num).join(' + ')
/** "1 vez", "3 veces" */
const veces = (n: number) => `${num(n)} ${n === 1 ? 'vez' : 'veces'}`
/** "Mango 5, Plátano 4 y Papaya 6" */
const conValores = (cats: string[], vs: number[]) => yLista(cats.map((c, i) => `${c} ${num(vs[i])}`))
/** "a, b y c" */
const yLista = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`)
/** "polo" de "un polo", "entrada" de "una entrada". */
const singular = (uno: string) => uno.replace(/^una? /, '')

/** Cómo se cuentan unos palotes: "Palotes de Mango: 3 grupos de 5 y 2 sueltos" y "3 × 5 = 15; 15 + 2 = 17". */
function cuentaPalotes(et: string, v: number): [string, string] {
  const g = Math.floor(v / 5)
  const s = v % 5
  const partes = [g ? `${num(g)} ${g === 1 ? 'grupo' : 'grupos'} de 5` : '', s ? `${num(s)} ${s === 1 ? 'suelto' : 'sueltos'}` : ''].filter(Boolean)
  const cuenta = g === 0 ? `${num(s)} ${s === 1 ? 'palote' : 'palotes'}: ${num(v)}` : s === 0 ? `${num(g)} × 5 = ${num(v)}` : `${num(g)} × 5 = ${num(g * 5)}; ${num(g * 5)} + ${num(s)} = ${num(v)}`
  return [`Palotes de ${et}: ${partes.join(' y ')}`, cuenta]
}

// ---------- Contextos del Perú ----------

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
const GRADOS = ['1.º', '2.º', '3.º', '4.º', '5.º', '6.º']

/** Una opción de una encuesta: cómo se escribe en el dibujo y con su artículo, para las frases. */
type Cat = { et: string; con: string }
/** `voto`: por qué votaron, para las frases ("su comida favorita"). */
type Tema = { titulo: string; pregunta: string; columna: string; voto: string; cats: Cat[] }
const cat = (et: string, con: string): Cat => ({ et, con })

const TEMAS: Tema[] = [
  {
    titulo: 'Comida favorita',
    pregunta: '¿Cuál es tu comida favorita?',
    columna: 'Comida',
    voto: 'su comida favorita',
    cats: [cat('Ceviche', 'el ceviche'), cat('Ají de gallina', 'el ají de gallina'), cat('Lomo saltado', 'el lomo saltado'), cat('Arroz con pollo', 'el arroz con pollo'), cat('Causa', 'la causa')],
  },
  {
    titulo: 'Deporte favorito',
    pregunta: '¿Qué deporte prefieres?',
    columna: 'Deporte',
    voto: 'su deporte favorito',
    cats: [cat('Fútbol', 'el fútbol'), cat('Vóley', 'el vóley'), cat('Básquet', 'el básquet'), cat('Atletismo', 'el atletismo'), cat('Natación', 'la natación')],
  },
  {
    titulo: 'Fruta favorita',
    pregunta: '¿Cuál es tu fruta favorita?',
    columna: 'Fruta',
    voto: 'su fruta favorita',
    cats: [cat('Mango', 'el mango'), cat('Plátano', 'el plátano'), cat('Papaya', 'la papaya'), cat('Piña', 'la piña'), cat('Fresa', 'la fresa')],
  },
  {
    titulo: 'Juego favorito del recreo',
    pregunta: '¿Qué juego prefieres en el recreo?',
    columna: 'Juego',
    voto: 'su juego favorito del recreo',
    cats: [cat('Matagente', 'el matagente'), cat('Salta soga', 'la salta soga'), cat('Chapadas', 'las chapadas'), cat('Canicas', 'las canicas'), cat('Trompo', 'el trompo')],
  },
  {
    titulo: 'Bebida para la fiesta del aula',
    pregunta: '¿Qué bebida prefieres?',
    columna: 'Bebida',
    voto: 'la bebida para la fiesta del aula',
    cats: [cat('Chicha morada', 'la chicha morada'), cat('Limonada', 'la limonada'), cat('Emoliente', 'el emoliente'), cat('Maracuyá', 'el maracuyá')],
  },
  {
    titulo: 'Lugar para el paseo',
    pregunta: '¿A qué lugar quieres ir de paseo?',
    columna: 'Lugar',
    voto: 'el lugar para el paseo',
    cats: [cat('Playa', 'la playa'), cat('Campo', 'el campo'), cat('Museo', 'el museo'), cat('Zoológico', 'el zoológico')],
  },
]

/** Elige n opciones de un tema, en el orden en que aparecen. */
function opcionesDe(azar: Azar, t: Tema, n: number): Cat[] {
  const idx = barajar(azar, t.cats.map((_, i) => i)).slice(0, Math.min(n, t.cats.length)).sort((a, b) => a - b)
  return idx.map((i) => t.cats[i])
}

const seccion = (azar: Azar) => `4.º ${elegir(azar, ['A', 'B', 'C'])}`

// ---------- Dibujo: tablas ----------

const CABECERA = '#d9d9d9'
const SUAVE = '#f2f2f2'
const BARRA = '#c6c6c6'
const REJILLA = '#b3b3b3'

type Celda = string | number | { palotes: number } | { casilla: true }
const CASILLA: Celda = { casilla: true }

/** Ancho de una columna para que quepa el texto más largo (en negrita). */
const anchoCol = (textos: string[], min = 64) => Math.max(min, Math.ceil(Math.max(...textos.map((t) => anchoTexto(t, 16.5)))) + 24)

/** Palotes de cinco en cinco: cuatro rayas y la quinta las cruza. */
function palotes(n: number, x: number, cy: number) {
  const p: string[] = []
  let cx = x
  for (let g = 0; g < Math.floor(n / 5); g++) {
    for (let k = 0; k < 4; k++) p.push(linea(cx + k * 6, cy - 10, cx + k * 6, cy + 10, { grosor: 2 }))
    p.push(linea(cx - 4, cy + 8, cx + 22, cy - 8, { grosor: 2 }))
    cx += 34
  }
  for (let k = 0; k < n % 5; k++) p.push(linea(cx + k * 6, cy - 10, cx + k * 6, cy + 10, { grosor: 2 }))
  return p.join('')
}
const anchoPalotes = (n: number) => Math.floor(n / 5) * 34 + (n % 5) * 6 + 22

type Pieza = { cuerpo: string; ancho: number; alto: number }

/** Una tabla: la primera fila es la cabecera y la primera columna, los nombres. `total`: la última fila va resaltada. */
function tabla(filas: Celda[][], anchos: number[], o: { alto?: number; total?: boolean } = {}): Pieza {
  const H = o.alto ?? 36
  const xs = [0]
  for (const w of anchos) xs.push(xs[xs.length - 1] + w)
  const partes: string[] = []
  filas.forEach((fila, r) =>
    fila.forEach((c, k) => {
      const x = xs[k]
      const y = r * H
      const w = anchos[k]
      const cab = r === 0
      const primera = k === 0
      const total = !!o.total && r === filas.length - 1
      partes.push(rect(x, y, w, H, { relleno: cab ? CABECERA : primera || total ? SUAVE : '#ffffff', grosor: 1.5 }))
      if (typeof c === 'object' && 'casilla' in c) partes.push(casilla(x + w / 2 - 22, y + (H - 28) / 2, 44, 28))
      else if (typeof c === 'object') partes.push(palotes(c.palotes, x + 16, y + H / 2))
      else if (c !== '') {
        const izq = primera && !cab
        partes.push(texto(izq ? x + 10 : x + w / 2, y + H / 2, typeof c === 'number' ? num(c) : c, { tam: 15, peso: cab || primera || total ? 700 : 400, ancla: izq ? 'start' : 'middle' }))
      }
    }),
  )
  return { cuerpo: partes.join(''), ancho: xs[xs.length - 1], alto: filas.length * H }
}

/** Una o más piezas, una debajo de otra y centradas, con un título arriba. */
function lamina(titulo: string, piezas: Pieza[], alt: string, gap = 18): Dibujo {
  const w = Math.max(...piezas.map((p) => p.ancho), titulo ? anchoTexto(titulo, 17) : 0) + 6
  let y = titulo ? 32 : 3
  const partes = titulo ? [texto(w / 2, 14, titulo, { tam: 16, peso: 700 })] : []
  piezas.forEach((p, i) => {
    partes.push(grupo(p.cuerpo, (w - p.ancho) / 2, y))
    y += p.alto + (i < piezas.length - 1 ? gap : 3)
  })
  return svg(w, y, partes.join(''), alt)
}

/** Tabla de frecuencias: opción, conteo con palotes y frecuencia (un número, una casilla o nada). */
function tablaFrecuencias(columna: string, cats: string[], valores: number[], frecuencia: 'numeros' | 'casillas' | 'vacia' | 'sin-conteo'): Pieza {
  const conConteo = frecuencia !== 'sin-conteo'
  const cab: Celda[] = [columna, ...(conConteo ? ['Conteo'] : []), 'Frecuencia']
  const filas: Celda[][] = cats.map((c, i) => [
    c,
    ...(conConteo ? [{ palotes: valores[i] } as Celda] : []),
    frecuencia === 'numeros' || frecuencia === 'sin-conteo' ? valores[i] : frecuencia === 'casillas' ? CASILLA : '',
  ])
  const anchos = [anchoCol([columna, ...cats], 90), ...(conConteo ? [Math.max(120, ...valores.map(anchoPalotes))] : []), anchoCol(['Frecuencia'])]
  return tabla([cab, ...filas], anchos)
}

// ---------- Dibujo: pictogramas ----------

type Simbolo = 'naranja' | 'libro' | 'carita' | 'pan'

/** Un símbolo de unos 28 px centrado en (cx, cy). `mitad`: solo la mitad izquierda (vale la mitad). */
function simbolo(s: Simbolo, cx: number, cy: number, mitad = false): string {
  const medio = (rx: number, ry: number, dy: number, t: Parameters<typeof ruta>[1]) => ruta(`M${f(cx)},${f(cy + dy - ry)} A${rx},${ry} 0 0 0 ${f(cx)},${f(cy + dy + ry)} Z`, t)
  if (s === 'naranja') {
    const t = { relleno: '#f8d6a2', grosor: 1.6 }
    const hoja = ruta(`M${f(cx + 1)},${f(cy - 12)} Q${f(cx + 8)},${f(cy - 19)} ${f(cx + 13)},${f(cy - 13)} Q${f(cx + 7)},${f(cy - 8)} ${f(cx + 1)},${f(cy - 12)} Z`, { relleno: '#d3e8c6', grosor: 1.4 })
    return (mitad ? medio(12, 12, 2, t) : circulo(cx, cy + 2, 12, t) + hoja) + linea(cx, cy - 10, cx + 1, cy - 14, { grosor: 1.6 })
  }
  if (s === 'libro') {
    const t = { relleno: '#d6e2f5', grosor: 1.6, redondeo: 2 }
    if (mitad) return rect(cx - 11, cy - 13, 11, 26, t) + linea(cx - 6, cy - 13, cx - 6, cy + 13, { grosor: 1.4 })
    return rect(cx - 11, cy - 13, 22, 26, t) + linea(cx - 6, cy - 13, cx - 6, cy + 13, { grosor: 1.4 }) + linea(cx - 2, cy - 5, cx + 7, cy - 5, { grosor: 1.4 }) + linea(cx - 2, cy + 1, cx + 7, cy + 1, { grosor: 1.4 })
  }
  if (s === 'carita') {
    const t = { relleno: '#f5e2c4', grosor: 1.6 }
    const ojo = (dx: number) => circulo(cx + dx, cy - 3, 1.8, { relleno: TINTA, grosor: 0.6 })
    if (mitad) return medio(13, 13, 0, t) + ojo(-4.5) + ruta(`M${f(cx - 6)},${f(cy + 4)} Q${f(cx - 3)},${f(cy + 6.5)} ${f(cx)},${f(cy + 6.5)}`, { grosor: 1.5 })
    return circulo(cx, cy, 13, t) + ojo(-4.5) + ojo(4.5) + ruta(`M${f(cx - 6)},${f(cy + 4)} Q${f(cx)},${f(cy + 9)} ${f(cx + 6)},${f(cy + 4)}`, { grosor: 1.5 })
  }
  const t = { relleno: '#ecd2a2', grosor: 1.6 }
  const corte = (dx: number) => linea(cx + dx - 2, cy + 4, cx + dx + 2, cy - 4, { grosor: 1.4 })
  if (mitad) return medio(14, 9, 0, t) + corte(-7)
  return elipse(cx, cy, 14, 9, t) + corte(-6) + corte(0) + corte(6)
}

type CtxPicto = {
  titulo: string
  cats: string[]
  simbolo: Simbolo
  unidad: string
  /** Si sus nombres son cortos y van bien en columnas. */
  vertical: boolean
  /** Se eligen seguidos (días, grados) o sueltos (juegos). */
  seguidos: boolean
  cuantos: (c: string) => string
  masQue: (a: string, b: string) => string
  total: string
  dato: (c: string, v: number) => string
  /** "el jueves", "el 4.º grado", "las canicas" */
  para: (c: string) => string
  /** El dato de dos filas juntas: "Entre el lunes y el martes se vendieron 30 naranjas." */
  entre: (a: string, b: string, v: number) => string
}

const minus = (s: string) => s.toLowerCase()
const JUEGO_CON: Record<string, string> = { Matagente: 'el matagente', 'Salta soga': 'la salta soga', Chapadas: 'las chapadas', Canicas: 'las canicas', Trompo: 'el trompo', Escondidas: 'las escondidas' }

const PICTOS: CtxPicto[] = [
  {
    titulo: 'Naranjas vendidas en un puesto del mercado',
    cats: DIAS,
    simbolo: 'naranja',
    unidad: 'naranjas',
    vertical: true,
    seguidos: true,
    cuantos: (c) => `¿Cuántas naranjas se vendieron el ${minus(c)}?`,
    masQue: (a, b) => `¿Cuántas naranjas más se vendieron el ${minus(a)} que el ${minus(b)}?`,
    total: '¿Cuántas naranjas se vendieron en total?',
    dato: (c, v) => `El ${minus(c)} se vendieron ${num(v)} naranjas.`,
    para: (c) => `el ${minus(c)}`,
    entre: (a, b, v) => `Entre el ${minus(a)} y el ${minus(b)} se vendieron ${num(v)} naranjas.`,
  },
  {
    titulo: 'Libros leídos en el mes',
    cats: GRADOS,
    simbolo: 'libro',
    unidad: 'libros',
    vertical: true,
    seguidos: true,
    cuantos: (c) => `¿Cuántos libros leyó el ${c} grado?`,
    masQue: (a, b) => `¿Cuántos libros más leyó el ${a} grado que el ${b} grado?`,
    total: '¿Cuántos libros se leyeron en total?',
    dato: (c, v) => `El ${c} grado leyó ${num(v)} libros.`,
    para: (c) => `el ${c} grado`,
    entre: (a, b, v) => `Entre el ${a} grado y el ${b} grado leyeron ${num(v)} libros.`,
  },
  {
    titulo: 'Juego favorito del recreo',
    cats: ['Matagente', 'Salta soga', 'Chapadas', 'Canicas', 'Trompo', 'Escondidas'],
    simbolo: 'carita',
    unidad: 'estudiantes',
    vertical: false,
    seguidos: false,
    cuantos: (c) => `¿Cuántos estudiantes prefieren ${JUEGO_CON[c]}?`,
    masQue: (a, b) => `¿Cuántos estudiantes más prefieren ${JUEGO_CON[a]} que ${JUEGO_CON[b]}?`,
    total: '¿Cuántos estudiantes votaron en total?',
    dato: (c, v) => `${num(v)} estudiantes prefieren ${JUEGO_CON[c]}.`,
    para: (c) => JUEGO_CON[c],
    entre: (a, b, v) => `Sumando ${JUEGO_CON[a]} y ${JUEGO_CON[b]}, son ${num(v)} estudiantes.`,
  },
  {
    titulo: 'Panes vendidos en la panadería',
    cats: DIAS,
    simbolo: 'pan',
    unidad: 'panes',
    vertical: false,
    seguidos: true,
    cuantos: (c) => `¿Cuántos panes se vendieron el ${minus(c)}?`,
    masQue: (a, b) => `¿Cuántos panes más se vendieron el ${minus(a)} que el ${minus(b)}?`,
    total: '¿Cuántos panes se vendieron en total?',
    dato: (c, v) => `El ${minus(c)} se vendieron ${num(v)} panes.`,
    para: (c) => `el ${minus(c)}`,
    entre: (a, b, v) => `Entre el ${minus(a)} y el ${minus(b)} se vendieron ${num(v)} panes.`,
  },
]

/** Un dato del pictograma: k símbolos enteros y, si `medio`, medio símbolo más. null: la fila está vacía. */
type FilaPicto = { cat: string; k: number; medio: boolean; vacia?: boolean }

const valorFila = (r: FilaPicto, vale: number) => r.k * vale + (r.medio ? vale / 2 : 0)
const simbolosDe = (r: FilaPicto) => r.k + (r.medio ? 1 : 0)

function dibujoPictograma(ctx: CtxPicto, filas: FilaPicto[], vale: number, vertical: boolean, leyendaOculta = false): Dibujo {
  const partes: string[] = []
  const top = 32
  const leyenda = `= ${leyendaOculta ? '?' : `${num(vale)} ${ctx.unidad}`}`
  let ancho: number
  let yLeyenda: number
  if (!vertical) {
    const ROW = 42
    const COL = 36
    const labW = anchoCol(filas.map((r) => r.cat), 92)
    const maxSim = Math.max(6, ...filas.map(simbolosDe))
    const gridW = labW + 14 + maxSim * COL
    filas.forEach((r, i) => {
      const y = top + i * ROW
      partes.push(rect(3, y, labW, ROW, { relleno: SUAVE, grosor: 1.5 }))
      partes.push(rect(3 + labW, y, gridW - labW, ROW, { relleno: '#ffffff', grosor: 1.5 }))
      partes.push(texto(13, y + ROW / 2, r.cat, { tam: 15, peso: 700, ancla: 'start' }))
      if (r.vacia) return
      for (let j = 0; j < simbolosDe(r); j++) partes.push(simbolo(ctx.simbolo, 3 + labW + 10 + COL / 2 + j * COL, y + ROW / 2, r.medio && j === r.k))
    })
    ancho = gridW + 6
    yLeyenda = top + filas.length * ROW + 30
  } else {
    const COL = 80
    const SIM = 32
    const maxSim = Math.max(5, ...filas.map(simbolosDe))
    const areaH = maxSim * SIM + 12
    filas.forEach((r, i) => {
      const x = 3 + i * COL
      partes.push(rect(x, top, COL, areaH, { relleno: '#ffffff', grosor: 1.5 }))
      partes.push(rect(x, top + areaH, COL, 32, { relleno: SUAVE, grosor: 1.5 }))
      partes.push(texto(x + COL / 2, top + areaH + 16, r.cat, { tam: 15, peso: 700 }))
      if (r.vacia) return
      for (let j = 0; j < simbolosDe(r); j++) partes.push(simbolo(ctx.simbolo, x + COL / 2, top + areaH - 6 - SIM / 2 - j * SIM, r.medio && j === r.k))
    })
    ancho = filas.length * COL + 6
    yLeyenda = top + areaH + 32 + 30
  }
  const anchoLeyenda = 54 + anchoTexto(leyenda, 16)
  ancho = Math.max(ancho, anchoLeyenda + 6, anchoTexto(ctx.titulo, 17) + 6)
  partes.push(rect(3, yLeyenda - 18, anchoLeyenda, 36, { relleno: '#ffffff', grosor: 1.5, redondeo: 6 }))
  partes.push(simbolo(ctx.simbolo, 3 + 22, yLeyenda))
  partes.push(texto(3 + 42, yLeyenda, leyenda, { tam: 15, peso: 700, ancla: 'start' }))
  partes.unshift(texto(ancho / 2, 14, ctx.titulo, { tam: 16, peso: 700 }))
  const desc = filas.map((r) => (r.vacia ? `${r.cat}: vacío` : `${r.cat}: ${r.k}${r.medio ? ' y medio' : ''}`)).join(', ')
  return svg(ancho, yLeyenda + 22, partes.join(''), `Pictograma «${ctx.titulo}» (${desc} símbolos); cada símbolo vale ${leyendaOculta ? '?' : vale}`)
}

/**
 * Por nivel: cuánto puede valer cada símbolo, cuántas filas, hasta cuántos símbolos (en columnas o en filas) y qué tan
 * seguido sale medio símbolo. Más fácil: cada símbolo vale 2 o 10, sin medios. Más difícil: vale 4, 6 o 20, con más
 * medios y 5 filas.
 */
const PICTO_NIVEL = {
  1: { vales: [2, 10], n: [3, 4], maxV: 5, maxH: 6, medio: 0 },
  2: { vales: [2, 5, 10, 10], n: [4, 5], maxV: 7, maxH: 8, medio: 0.4 },
  3: { vales: [4, 6, 20], n: [5, 5], maxV: 7, maxH: 8, medio: 0.6 },
}

/** Datos de un pictograma: n filas, cada símbolo vale lo que dé el nivel y medio símbolo solo si ese valor es par. */
function datosPicto(azar: Azar, ctx: CtxPicto, vertical: boolean, nivel: Nivel = 2) {
  const P = PICTO_NIVEL[nivel]
  const vale = elegir(azar, P.vales)
  const n = entero(azar, P.n[0], P.n[1])
  const maxSim = vertical ? P.maxV : P.maxH
  const inicio = ctx.seguidos ? entero(azar, 0, ctx.cats.length - n) : 0
  const cats = ctx.seguidos ? ctx.cats.slice(inicio, inicio + n) : barajar(azar, ctx.cats).slice(0, n)
  const filas: FilaPicto[] = cats.map((c) => {
    const medio = P.medio > 0 && vale % 2 === 0 && azar() < P.medio
    return { cat: c, k: entero(azar, 1, maxSim - (medio ? 1 : 0)), medio }
  })
  return { vale, filas, maxSim }
}

/** "3 símbolos y medio", "1 símbolo", "medio símbolo". */
function cuantosSimbolos(k: number, medio: boolean) {
  if (medio) return k === 0 ? 'Medio símbolo' : `${k} ${k === 1 ? 'símbolo' : 'símbolos'} y medio`
  return `${k} ${k === 1 ? 'símbolo' : 'símbolos'}`
}

/** El valor de una fila del pictograma: "3 × 10 = 30; 30 + 5 = 35" (con medio símbolo) o "3 × 10 = 30". */
function cuentaFila(r: FilaPicto, vale: number) {
  const enteros = r.k * vale
  if (!r.medio) return `${num(r.k)} × ${num(vale)} = ${num(enteros)}`
  return `${num(r.k)} × ${num(vale)} = ${num(enteros)}; ${num(enteros)} + ${num(vale / 2)} = ${num(enteros + vale / 2)}`
}

const leyendaPaso = (vale: number, medio: boolean) => (medio ? `Cada símbolo vale ${num(vale)} y medio símbolo, ${num(vale / 2)}` : `Cada símbolo vale ${num(vale)}`)

// ---------- Dibujo: gráfico de barras ----------

type CtxBarras = {
  titulo: string
  eje: string
  /** Qué son las barras, para la cabecera de la tabla: "Día", "Grado". */
  columna: string
  cats: string[]
  seguidos: boolean
  cuantos: (i: number) => string
  masQue: (i: number, j: number) => string
  total: string
  cual: (v: number) => string
  dato: (i: number, v: number) => string
}

const COMO = ['a pie', 'en combi', 'en mototaxi', 'en bicicleta', 'en auto']
const PASEO = ['la playa', 'el campo', 'el museo', 'el zoológico', 'el parque']

const BARRAS: CtxBarras[] = [
  {
    titulo: '¿Cómo llegan al colegio?',
    eje: 'Estudiantes',
    columna: 'Llegan',
    cats: ['A pie', 'Combi', 'Mototaxi', 'Bicicleta', 'Auto'],
    seguidos: false,
    cuantos: (i) => `¿Cuántos estudiantes llegan ${COMO[i]}?`,
    masQue: (i, j) => `¿Cuántos estudiantes más llegan ${COMO[i]} que ${COMO[j]}?`,
    total: '¿Cuántos estudiantes respondieron en total?',
    cual: (v) => `¿Cómo llegan ${num(v)} estudiantes?`,
    dato: (i, v) => `${num(v)} estudiantes llegan ${COMO[i]}.`,
  },
  {
    titulo: 'Botellas juntadas para reciclar',
    eje: 'Botellas',
    columna: 'Grado',
    cats: GRADOS,
    seguidos: true,
    cuantos: (i) => `¿Cuántas botellas juntó el ${GRADOS[i]} grado?`,
    masQue: (i, j) => `¿Cuántas botellas más juntó el ${GRADOS[i]} grado que el ${GRADOS[j]} grado?`,
    total: '¿Cuántas botellas juntaron en total?',
    cual: (v) => `¿Qué grado juntó ${num(v)} botellas?`,
    dato: (i, v) => `El ${GRADOS[i]} grado juntó ${num(v)} botellas.`,
  },
  {
    titulo: 'Visitantes a la feria de ciencias',
    eje: 'Personas',
    columna: 'Día',
    cats: DIAS,
    seguidos: true,
    cuantos: (i) => `¿Cuántas personas visitaron la feria el ${minus(DIAS[i])}?`,
    masQue: (i, j) => `¿Cuántas personas más visitaron la feria el ${minus(DIAS[i])} que el ${minus(DIAS[j])}?`,
    total: '¿Cuántas personas visitaron la feria en total?',
    cual: (v) => `¿Qué día visitaron la feria ${num(v)} personas?`,
    dato: (i, v) => `El ${minus(DIAS[i])} visitaron la feria ${num(v)} personas.`,
  },
  {
    titulo: 'Votos para el paseo de fin de año',
    eje: 'Votos',
    columna: 'Lugar',
    cats: ['Playa', 'Campo', 'Museo', 'Zoológico', 'Parque'],
    seguidos: false,
    cuantos: (i) => `¿Cuántos votos tuvo ${PASEO[i]}?`,
    masQue: (i, j) => `¿Cuántos votos más tuvo ${PASEO[i]} que ${PASEO[j]}?`,
    total: '¿Cuántos votos hubo en total?',
    cual: (v) => `¿Qué lugar tuvo ${num(v)} votos?`,
    dato: (i, v) => `${cap(PASEO[i])} tuvo ${num(v)} votos.`,
  },
]

/** Gráfico de barras verticales con escala de 10 en 10 (rótulos cada 10 o cada 20). */
function barras(o: { eje: string; cats: string[]; valores: (number | null)[]; max: number; cada: number; oculta?: number; alto?: number; slot?: number }): Pieza {
  const PH = o.alto ?? 220
  const SLOT = o.slot ?? 80
  const BW = Math.min(46, SLOT - 26)
  const L = 58
  const top = 30
  const y = (v: number) => top + PH - (v / o.max) * PH
  const derecha = L + o.cats.length * SLOT + 12
  const partes: string[] = [texto(6, 12, o.eje, { tam: 14, peso: 700, ancla: 'start' })]
  for (let v = 10; v <= o.max; v += 10) partes.push(linea(L, y(v), derecha, y(v), { trazo: REJILLA, grosor: 1 }))
  for (let v = 0; v <= o.max; v += o.cada) {
    if (v === o.oculta) partes.push(casilla(L - 50, y(v) - 12, 40, 24))
    else partes.push(texto(L - 8, y(v), num(v), { tam: 14, ancla: 'end' }))
    partes.push(linea(L - 5, y(v), L, y(v), { grosor: 1.6 }))
  }
  o.cats.forEach((c, i) => {
    const x = L + i * SLOT + (SLOT - BW) / 2 + 6
    const v = o.valores[i]
    if (v !== null && v > 0) partes.push(rect(x, y(v), BW, (v / o.max) * PH, { relleno: BARRA, grosor: 1.6 }))
    partes.push(texto(x + BW / 2, top + PH + 18, c, { tam: SLOT < 76 ? 13 : 14 }))
  })
  partes.push(linea(L, top - 8, L, top + PH, { grosor: 2 }))
  partes.push(linea(L, top + PH, derecha, top + PH, { grosor: 2 }))
  return { cuerpo: partes.join(''), ancho: derecha + 4, alto: top + PH + 32 }
}

/** Valores múltiplos de 10 y una escala que los contenga: hasta 80 (rótulos de 10 en 10) o hasta 120 (de 20 en 20). */
function datosBarras(azar: Azar, n: number, nivel: Nivel = 2) {
  // Más fácil: siempre de 10 en 10 (cada línea con su número). Más difícil: siempre de 20 en 20 (hay barras que
  // terminan entre dos números).
  const grande = nivel === 2 ? azar() < 0.45 : nivel === 3
  const max = grande ? elegir(azar, [100, 120]) : elegir(azar, [60, 80])
  const cada = grande ? 20 : 10
  const valores = distintos(azar, n, 10, max, 10)
  return { max, cada, valores }
}

/** Hasta dónde llega una barra: "La barra de Combi llega hasta el 40" o "… llega a la mitad entre 40 y 60: 50". */
function leeBarra(cat: string, v: number, cada: number) {
  if (v % cada === 0) return `La barra de ${cat} llega hasta el ${num(v)}`
  const abajo = v - (v % cada)
  return `La barra de ${cat} llega ${(v % cada) * 2 === cada ? 'a la mitad ' : ''}entre ${num(abajo)} y ${num(abajo + cada)}: ${num(v)}`
}

/** Cuántas barras (de cuántas a cuántas) por nivel. */
const BARRAS_NIVEL: Record<Nivel, [number, number]> = { 1: [3, 4], 2: [4, 5], 3: [5, 5] }

function ctxBarras(azar: Azar, n: number) {
  const ctx = elegir(azar, BARRAS)
  const k = Math.min(n, ctx.cats.length)
  const inicio = ctx.seguidos ? entero(azar, 0, ctx.cats.length - k) : 0
  const idx = ctx.seguidos ? Array.from({ length: k }, (_, i) => inicio + i) : barajar(azar, ctx.cats.map((_, i) => i)).slice(0, k).sort((a, b) => a - b)
  return { ctx, idx, cats: idx.map((i) => ctx.cats[i]) }
}

// ---------- Encuestas ----------

/**
 * `malas`: preguntas del mismo tema que no piden el dato. `finas` (más difícil): casi sirven, pero preguntan por otra
 * persona o por un solo día, o dejan fuera respuestas de la ficha.
 */
const ENCUESTAS = [
  {
    saber: 'qué fruta prefieren {g} para la lonchera',
    pregunta: '¿Cuál es tu fruta favorita?',
    opciones: ['Mango', 'Plátano', 'Papaya', 'Manzana'],
    malas: ['¿Te gusta la fruta?', '¿Cuántas frutas comes al día?', '¿Qué fruta vende el quiosco?'],
    finas: ['¿Cuál es la fruta favorita de tu mamá?', '¿Qué fruta comiste hoy?', '¿Te gusta más el mango o el plátano?'],
  },
  {
    saber: 'cómo llegan {g} al colegio',
    pregunta: '¿Cómo llegas al colegio?',
    opciones: ['A pie', 'En combi', 'En mototaxi', 'En bicicleta'],
    malas: ['¿Llegas temprano al colegio?', '¿A qué hora sales de tu casa?', '¿Te gusta tu colegio?'],
    finas: ['¿Cómo llega tu profesora al colegio?', '¿Cómo te gustaría llegar al colegio?', '¿Llegas al colegio a pie o en combi?'],
  },
  {
    saber: 'qué deporte prefieren {g} para el campeonato',
    pregunta: '¿Qué deporte prefieres?',
    opciones: ['Fútbol', 'Vóley', 'Básquet', 'Atletismo'],
    malas: ['¿Te gusta hacer deporte?', '¿Cuántas horas juegas al día?', '¿Quién es tu deportista favorito?'],
    finas: ['¿Qué deporte prefiere tu papá?', '¿Qué deporte jugaste ayer?', '¿Prefieres el fútbol o el vóley?'],
  },
  {
    saber: 'cuántos hermanos tienen {g}',
    pregunta: '¿Cuántos hermanos tienes?',
    opciones: ['Ninguno', '1', '2', '3 o más'],
    malas: ['¿Tienes hermanos?', '¿Cómo se llaman tus hermanos?', '¿Cuántos años tienes?'],
    finas: ['¿Cuántos hermanos tiene tu mamá?', '¿Cuántos primos tienes?', '¿Tienes hermanos mayores?'],
  },
  {
    saber: 'qué bebida prefieren {g} para la fiesta de fin de año',
    pregunta: '¿Qué bebida prefieres?',
    opciones: ['Chicha morada', 'Limonada', 'Emoliente', 'Maracuyá'],
    malas: ['¿Te gusta la chicha morada?', '¿Cuántos vasos de agua tomas al día?', '¿Quién prepara las bebidas?'],
    finas: ['¿Qué bebida prefiere tu profesora?', '¿Qué bebida tomaste en el desayuno?', '¿Prefieres chicha morada o limonada?'],
  },
  {
    saber: 'qué juego prefieren {g} en el recreo',
    pregunta: '¿Qué juego prefieres en el recreo?',
    opciones: ['Matagente', 'Salta soga', 'Chapadas', 'Canicas'],
    malas: ['¿Juegas en el recreo?', '¿Cuánto dura el recreo?', '¿Con quién juegas en tu casa?'],
    finas: ['¿Qué juego prefiere tu hermano?', '¿A qué jugaste ayer en el recreo?', '¿Prefieres el matagente o las canicas?'],
  },
  {
    saber: 'qué mascota tienen {g} en casa',
    pregunta: '¿Qué mascota tienes en casa?',
    opciones: ['Perro', 'Gato', 'Cuy', 'No tengo'],
    malas: ['¿Te gustan los animales?', '¿Cuántos años tiene tu perro?', '¿Qué animal vive en la selva?'],
    finas: ['¿Qué mascota tiene tu vecino?', '¿Qué mascota te gustaría tener?', '¿Tienes un perro o un gato?'],
  },
]

/** Ficha de encuesta en una tablilla: la pregunta (o una línea para escribirla) y las respuestas para marcar. */
function fichaEncuesta(pregunta: string | null, opciones: string[]): Dibujo {
  const W = Math.max(400, 118 + (pregunta ? anchoTexto(pregunta, 15.5) : 240) + 28)
  const H = 112 + opciones.length * 34
  const partes = [
    rect(4, 12, W - 8, H - 16, { relleno: '#ffffff', grosor: 1.8, redondeo: 8 }),
    rect(W / 2 - 42, 4, 84, 18, { relleno: '#bdbdbd', grosor: 1.6, redondeo: 4 }),
    texto(W / 2, 44, 'FICHA DE ENCUESTA', { tam: 16, peso: 700 }),
    texto(24, 80, 'Pregunta:', { tam: 15, peso: 700, ancla: 'start' }),
    pregunta ? texto(110, 80, pregunta, { tam: 15, ancla: 'start' }) : linea(110, 90, W - 28, 90, { grosor: 1.5, punteado: true }),
  ]
  opciones.forEach((o, i) => {
    const y = 118 + i * 34
    partes.push(rect(32, y - 11, 22, 22, { relleno: '#ffffff', grosor: 1.6, redondeo: 3 }))
    partes.push(texto(66, y, o, { tam: 15, ancla: 'start' }))
  })
  return svg(W, H, partes.join(''), `Ficha de encuesta${pregunta ? ` con la pregunta «${pregunta}»` : ' sin la pregunta'} y las respuestas: ${opciones.join(', ')}`)
}

const encuesta = tipo(
  'da-encuesta',
  'Pregunta de la encuesta',
  'Eligen la pregunta adecuada para una encuesta del aula y a quiénes hay que preguntar.',
  CITA.encuesta,
  ({ azar, nivel = 2 }) => {
    const e = elegir(azar, ENCUESTAS)
    const quien = nombre(azar)
    const modo = azar()
    // Más fácil: 3 alternativas y una de otra encuesta, que no tiene nada que ver. Más difícil: las que casi sirven.
    const cuantas = nivel === 1 ? 3 : 4
    if (modo < 0.45) {
      const malas = nivel === 1 ? [e.malas[0], elegir(azar, ENCUESTAS.filter((x) => x !== e)).pregunta] : nivel === 3 ? [...e.finas, e.malas[0]] : e.malas
      const alt = alternativas(azar, e.pregunta, malas, cuantas)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `encuesta:pregunta:${e.pregunta}`,
        enunciado: `${quien} quiere saber ${e.saber.replace('{g}', 'sus compañeros de aula')}. Preparó esta ficha, pero le falta la pregunta.`,
        dibujo: fichaEncuesta(null, e.opciones),
        pregunta: '¿Qué pregunta debe escribir en la ficha?',
        ...alt,
        nota: 'La pregunta debe pedir el dato que se quiere saber y tener como respuestas las opciones de la ficha.',
        pasos: [`Las respuestas de la ficha: ${yLista(e.opciones)}`, `Quiere saber ${e.saber.replace('{g}', 'sus compañeros')}`, `La pregunta que pide ese dato: ${e.pregunta}`],
      }
    }
    if (modo < 0.7) {
      // `lejos`: personas que no tienen nada que ver (más fácil); `finas`: solo una parte o más de la cuenta (más difícil).
      const grupos = [
        {
          g: 'los estudiantes de 4.º grado',
          bien: 'A los estudiantes de 4.º grado',
          malas: ['Solo a sus dos mejores amigos', 'A los profesores del colegio', 'A los estudiantes de 1.º grado'],
          lejos: ['A los profesores del colegio', 'A sus vecinos del barrio'],
          finas: ['Solo a los estudiantes de 4.º A', 'A todos los estudiantes del colegio', 'Solo a las niñas de 4.º grado'],
        },
        {
          g: 'sus compañeros de aula',
          bien: 'A todos sus compañeros de aula',
          malas: ['Solo a sus dos mejores amigos', 'A los estudiantes de otro colegio', 'Solo a su familia'],
          lejos: ['A los estudiantes de otro colegio', 'Solo a su familia'],
          finas: ['Solo a los compañeros de su fila', 'A todos los estudiantes del colegio', 'Solo a los niños del aula'],
        },
      ]
      const gr = elegir(azar, grupos)
      const alt = alternativas(azar, gr.bien, nivel === 1 ? gr.lejos : nivel === 3 ? gr.finas : gr.malas, cuantas)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `encuesta:quienes:${e.pregunta}:${gr.g}`,
        enunciado: `${quien} quiere saber ${e.saber.replace('{g}', gr.g)}. Esta es su ficha de encuesta.`,
        dibujo: fichaEncuesta(e.pregunta, e.opciones),
        pregunta: '¿A quiénes debe hacerles la encuesta?',
        ...alt,
        pasos: [`La ficha pregunta: ${e.pregunta}`, `Quiere saber la respuesta de ${gr.g}`, nivel === 3 ? `${gr.bien}: a todos ellos, ni solo a una parte ni a otras personas` : `${gr.bien}: a ellos, no a unos pocos ni a otras personas`],
      }
    }
    // Los resultados de una encuesta: ¿qué pregunta hicieron?
    const otra = elegir(
      azar,
      ENCUESTAS.filter((x) => x !== e),
    )
    const valores = distintos(azar, e.opciones.length, 2, 12)
    const malas = nivel === 1 ? [e.malas[0], otra.pregunta] : nivel === 3 ? [...e.finas, e.malas[0]] : [e.malas[0], e.malas[1], otra.pregunta, e.malas[2]]
    const alt = alternativas(azar, e.pregunta, malas, cuantas)
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `encuesta:resultados:${e.pregunta}`,
      enunciado: `${quien} hizo una encuesta en el aula. Estos son los resultados.`,
      dibujo: lamina('Resultados de la encuesta', [tablaFrecuencias('Respuesta', e.opciones, valores, 'sin-conteo')], `Tabla con las respuestas ${e.opciones.map((o, i) => `${o}: ${valores[i]}`).join(', ')}`),
      pregunta: '¿Qué pregunta hizo en la encuesta?',
      ...alt,
      pasos: [`Las respuestas de la tabla: ${yLista(e.opciones)}`, `La pregunta que tiene esas respuestas: ${e.pregunta}`],
    }
  },
)

// ---------- Tablas de frecuencia ----------

const frecuencias = tipo(
  'da-frecuencias',
  'Cuenta los palotes',
  'Cuentan los palotes de una tabla de frecuencias de una encuesta del aula y responden cuántos votaron.',
  CITA.organiza,
  ({ azar, nivel = 2 }) => {
    // Más fácil: 3 respuestas y hasta 10 palotes. Más difícil: hasta 5 respuestas, hasta 24 palotes y el total sin la
    // columna de frecuencias (primero se cuenta cada fila).
    const N = { 1: { ops: 3, min: 2, max: 10, uno: 5 }, 2: { ops: 4, min: 3, max: 16, uno: 6 }, 3: { ops: 5, min: 8, max: 24, uno: 11 } }[nivel]
    const t = elegir(azar, TEMAS)
    const ops = opcionesDe(azar, t, N.ops)
    const valores = distintos(azar, ops.length, N.min, N.max)
    const cats = ops.map((o) => o.et)
    const sec = seccion(azar)
    const enunciado = `En ${sec} hicieron una encuesta: «${t.pregunta}». Estos son los resultados.`
    const modo = azar()
    const titulo = `${t.titulo} en ${sec}`
    const alt = `Tabla de frecuencias con palotes: ${cats.map((c, i) => `${c}: ${valores[i]}`).join(', ')}`
    if (modo < 0.35) {
      const i = intentar(() => {
        const j = entero(azar, 0, ops.length - 1)
        return valores[j] >= N.uno && (nivel < 3 || valores[j] % 5 !== 0) ? j : null
      })
      if (i === null) return null
      const v = valores[i]
      const grupos = Math.floor(v / 5)
      const r = opcionesNum(azar, v, [grupos + (v % 5), grupos * 4 + (v % 5), v - 1, v + 1, v + 5, v - 5], 1)
      if (!r) return null
      return {
        forma: 'opciones',
        clave: `frec:${t.columna}:${valores.join('-')}:${i}`,
        enunciado,
        dibujo: lamina(titulo, [tablaFrecuencias(t.columna, cats, valores, 'vacia')], alt),
        pregunta: `¿Cuántos estudiantes votaron por ${ops[i].con}?`,
        ...r,
        pasos: cuentaPalotes(cats[i], v),
      }
    }
    if (modo < 0.6) {
      const tot = suma(valores)
      const errores = [tot - valores[valores.length - 1], tot + 10, tot - 10, tot + 1, tot - 1, ops.length]
      // En el difícil, otro error típico: contar cada grupo de cinco como un palote.
      const r = opcionesNum(azar, tot, nivel === 3 ? [errores[0], suma(valores.map((v) => Math.floor(v / 5) + (v % 5))), ...errores.slice(1)] : errores, 1)
      if (!r) return null
      return {
        forma: 'opciones',
        clave: `frec-total:${t.columna}:${valores.join('-')}`,
        enunciado,
        dibujo: lamina(titulo, [tablaFrecuencias(t.columna, cats, valores, nivel === 3 ? 'vacia' : 'numeros')], alt),
        pregunta: '¿Cuántos estudiantes respondieron la encuesta?',
        ...r,
        pasos: [nivel === 3 ? `Se cuentan los palotes de cada fila: ${conValores(cats, valores)}` : `Frecuencias: ${conValores(cats, valores)}`, `Se suman todas: ${sumados(valores)} = ${num(tot)}`],
      }
    }
    if (modo < 0.8) {
      const [a, b] = barajar(
        azar,
        ops.map((_, k) => k),
      )
        .slice(0, 2)
        .sort((x, y) => valores[y] - valores[x])
      const d = valores[a] - valores[b]
      const r = opcionesNum(azar, d, [valores[a] + valores[b], valores[a], valores[b], d + 1, d - 1, d + 5], 1)
      if (!r) return null
      return {
        forma: 'opciones',
        clave: `frec-mas:${t.columna}:${valores.join('-')}:${a}-${b}`,
        enunciado,
        dibujo: lamina(titulo, [tablaFrecuencias(t.columna, cats, valores, 'vacia')], alt),
        pregunta: `¿Cuántos estudiantes más votaron por ${ops[a].con} que por ${ops[b].con}?`,
        ...r,
        pasos: [`Se cuentan los palotes de 5 en 5: ${cats[a]} ${num(valores[a])} y ${cats[b]} ${num(valores[b])}`, `Diferencia: ${num(valores[a])} − ${num(valores[b])} = ${num(d)}`],
      }
    }
    const ejemplo = valores.indexOf(Math.max(...valores))
    return {
      forma: 'abierta',
      clave: `frec-completa:${t.columna}:${valores.join('-')}`,
      enunciado: `${enunciado} Cuenta los palotes y escribe la frecuencia de cada respuesta.`,
      dibujo: lamina(titulo, [tablaFrecuencias(t.columna, cats, valores, 'casillas')], alt),
      respuesta: cats.map((c, i) => `${c}: ${valores[i]}`).join(' · '),
      espacio: 'dibujo',
      pasos: ['Se cuentan los palotes de 5 en 5 y luego los sueltos', `Por ejemplo, ${cats[ejemplo]}: ${cuentaPalotes(cats[ejemplo], valores[ejemplo])[1]}`, `Frecuencias: ${conValores(cats, valores)}`],
    }
  },
)

/** Tarjetas con las respuestas de una entrevista, en filas. */
function tarjetas(palabras: string[], porFila: number, w = 80, h = 32): Pieza {
  const partes = palabras.map((p, i) => {
    const x = (i % porFila) * (w + 8) + 2
    const y = Math.floor(i / porFila) * (h + 8) + 2
    return rect(x, y, w, h, { relleno: '#ffffff', grosor: 1.5, redondeo: 6 }) + texto(x + w / 2, y + h / 2, p, { tam: 14 })
  })
  const filas = Math.ceil(palabras.length / porFila)
  return { cuerpo: partes.join(''), ancho: Math.min(palabras.length, porFila) * (w + 8) - 4, alto: filas * (h + 8) - 4 }
}

const RESPUESTAS_CORTAS = [
  { tema: 'fruta favorita', pregunta: '¿Cuál es tu fruta favorita?', columna: 'Fruta', cats: ['Mango', 'Plátano', 'Papaya', 'Piña', 'Fresa'] },
  { tema: 'deporte favorito', pregunta: '¿Qué deporte prefieres?', columna: 'Deporte', cats: ['Fútbol', 'Vóley', 'Básquet', 'Natación'] },
  { tema: 'mascota', pregunta: '¿Qué mascota tienes?', columna: 'Mascota', cats: ['Perro', 'Gato', 'Cuy', 'Conejo'] },
  { tema: 'juego favorito', pregunta: '¿Qué juego prefieres?', columna: 'Juego', cats: ['Canicas', 'Trompo', 'Chapadas', 'Ludo'] },
]

const organiza = tipo(
  'da-organiza',
  'Organiza los datos',
  'Cuentan las respuestas de una entrevista y las organizan en una tabla de frecuencias.',
  CITA.organiza,
  ({ azar, nivel = 2 }) => {
    // Más fácil: 3 respuestas y 10 o 12 tarjetas. Más difícil: 4 respuestas, 20 o 24 tarjetas y, al contar, cuántos
    // más respondieron una cosa que otra (un paso más).
    const N = {
      1: { n: [3, 3], totales: [10, 12], v: [2, 6], resto: [2, 6], uno: 3 },
      2: { n: [3, 4], totales: [15, 18], v: [2, 8], resto: [2, 9], uno: 4 },
      3: { n: [4, 4], totales: [20, 24], v: [2, 9], resto: [2, 10], uno: 4 },
    }[nivel]
    const e = elegir(azar, RESPUESTAS_CORTAS)
    const n = entero(azar, N.n[0], N.n[1])
    const cats = barajar(azar, e.cats).slice(0, n)
    const total = elegir(azar, N.totales)
    const valores = intentar(() => {
      const v = cats.map(() => entero(azar, N.v[0], N.v[1]))
      const resto = total - suma(v.slice(0, -1))
      v[v.length - 1] = resto
      return resto >= N.resto[0] && resto <= N.resto[1] && new Set(v).size === v.length ? v : null
    })
    if (!valores) return null
    const lista = barajar(azar, cats.flatMap((c, i) => Array(valores[i]).fill(c) as string[]))
    const quien = nombre(azar)
    const enunciado = `${quien} entrevistó a ${total} compañeros con la pregunta «${e.pregunta}». Estas son sus respuestas.`
    const alt = `${total} tarjetas con respuestas: ${cats.map((c, i) => `${valores[i]} ${c}`).join(', ')}`
    const modo = azar()
    if (modo < 0.4 && nivel === 3) {
      const [a, b] = barajar(
        azar,
        cats.map((_, k) => k),
      )
        .slice(0, 2)
        .sort((x, y) => valores[y] - valores[x])
      const d = valores[a] - valores[b]
      const r = opcionesNum(azar, d, [valores[a] + valores[b], valores[a], valores[b], d + 1, d - 1, d + 2], 1)
      if (!r) return null
      return {
        forma: 'opciones',
        clave: `organiza-mas:${cats.join(',')}:${valores.join('-')}:${a}-${b}`,
        enunciado,
        dibujo: lamina('', [tarjetas(lista, 6)], alt),
        pregunta: `¿Cuántos compañeros más respondieron «${cats[a]}» que «${cats[b]}»?`,
        ...r,
        pasos: [`Se cuentan las tarjetas de cada respuesta: ${conValores(cats, valores)}`, `Comprueba: ${sumados(valores)} = ${num(total)} tarjetas`, `Diferencia: ${num(valores[a])} − ${num(valores[b])} = ${num(d)}`],
      }
    }
    if (modo < 0.4) {
      const i = intentar(() => {
        const j = entero(azar, 0, n - 1)
        return valores[j] >= N.uno ? j : null
      })
      if (i === null) return null
      const v = valores[i]
      const r = opcionesNum(azar, v, [v - 1, v + 1, v - 2, v + 2, ...valores.filter((x) => x !== v)], 1)
      if (!r) return null
      return {
        forma: 'opciones',
        clave: `organiza:${cats.join(',')}:${valores.join('-')}:${i}`,
        enunciado,
        dibujo: lamina('', [tarjetas(lista, 6)], alt),
        pregunta: `¿Cuántos compañeros respondieron «${cats[i]}»?`,
        ...r,
        pasos: [`Se cuentan las tarjetas de cada respuesta: ${conValores(cats, valores)}`, `Comprueba: ${sumados(valores)} = ${num(total)} tarjetas`, `Respondieron «${cats[i]}»: ${num(v)}`],
      }
    }
    if (modo < 0.6) {
      const i = unico(valores, false)
      if (i < 0) return null
      const r = ordenar(alternativas(azar, cats[i], cats.filter((_, j) => j !== i), 4), cats)
      if (!r) return null
      return {
        forma: 'opciones',
        clave: `organiza-menos:${cats.join(',')}:${valores.join('-')}`,
        enunciado,
        dibujo: lamina('', [tarjetas(lista, 6)], alt),
        pregunta: '¿Qué respuesta eligieron menos compañeros?',
        ...r,
        pasos: [`Se cuentan las tarjetas de cada respuesta: ${conValores(cats, valores)}`, `La que tiene menos tarjetas (${num(valores[i])}): ${cats[i]}`],
      }
    }
    // En la tabla para completar, el conteo también va vacío: lo hacen ellos con palotes.
    const vacia = tabla(
      [[e.columna, 'Conteo', 'Frecuencia'], ...cats.map((c) => [c, '', CASILLA] as Celda[])],
      [anchoCol([e.columna, ...cats], 90), 150, anchoCol(['Frecuencia'])],
      { alto: 34 },
    )
    return {
      forma: 'abierta',
      clave: `organiza-tabla:${cats.join(',')}:${valores.join('-')}`,
      enunciado: `${enunciado} Organízalas en la tabla: haz el conteo con palotes y escribe la frecuencia.`,
      dibujo: lamina('', [tarjetas(lista, 6), vacia], `${alt}; debajo, una tabla de frecuencias vacía`, 16),
      respuesta: cats.map((c, i) => `${c}: ${valores[i]}`).join(' · '),
      espacio: 'dibujo',
      pasos: ['Por cada tarjeta se hace un palote en la fila de su respuesta', `Son ${num(total)} tarjetas: las frecuencias deben sumar ${num(total)}`, `Frecuencias: ${conValores(cats, valores)}`],
    }
  },
)

// ---------- Tablas de doble entrada ----------

type GrupoFila = { et: string; cuantos: string; quienes: string }
const FILAS_DOBLE: GrupoFila[][] = [
  [
    { et: 'Niñas', cuantos: 'Cuántas niñas', quienes: 'las niñas' },
    { et: 'Niños', cuantos: 'Cuántos niños', quienes: 'los niños' },
  ],
  [
    { et: '4.º A', cuantos: 'Cuántos estudiantes de 4.º A', quienes: 'los estudiantes de 4.º A' },
    { et: '4.º B', cuantos: 'Cuántos estudiantes de 4.º B', quienes: 'los estudiantes de 4.º B' },
  ],
  [
    { et: '4.º A', cuantos: 'Cuántos estudiantes de 4.º A', quienes: 'los estudiantes de 4.º A' },
    { et: '4.º B', cuantos: 'Cuántos estudiantes de 4.º B', quienes: 'los estudiantes de 4.º B' },
    { et: '4.º C', cuantos: 'Cuántos estudiantes de 4.º C', quienes: 'los estudiantes de 4.º C' },
  ],
]

function datosDoble(azar: Azar, nivel: Nivel = 2) {
  // Temas de nombres cortos, para que la tabla con su columna de totales quepa en la hoja.
  const t = elegir(
    azar,
    TEMAS.filter((x) => ['Deporte', 'Fruta', 'Juego', 'Lugar'].includes(x.columna)),
  )
  // Más fácil: 2 filas, 3 opciones y números de una cifra. Más difícil: 3 secciones, 4 opciones y números hasta 19.
  const ops = opcionesDe(azar, t, nivel === 2 ? 3 + (azar() < 0.5 ? 1 : 0) : nivel === 1 ? 3 : 4)
  const filas = nivel === 3 ? FILAS_DOBLE[2] : elegir(azar, nivel === 1 ? FILAS_DOBLE.slice(0, 2) : FILAS_DOBLE)
  const [lo, hi] = nivel === 1 ? [1, 9] : nivel === 3 ? [3, 19] : [2, 15]
  const m = filas.map(() => ops.map(() => entero(azar, lo, hi)))
  return { t, ops, filas, m }
}

function tablaDoble(ops: Cat[], filas: GrupoFila[], celdas: Celda[][], totales?: { filas: Celda[]; columnas: Celda[]; todo: Celda }) {
  const cab: Celda[] = ['', ...ops.map((o) => o.et), ...(totales ? ['Total'] : [])]
  const cuerpo: Celda[][] = filas.map((g, i) => [g.et, ...celdas[i], ...(totales ? [totales.filas[i]] : [])])
  if (totales) cuerpo.push(['Total', ...totales.columnas, totales.todo])
  const anchos = [anchoCol(filas.map((g) => g.et).concat(totales ? ['Total'] : []), 84), ...ops.map((o) => anchoCol([o.et], 76)), ...(totales ? [76] : [])]
  return tabla([cab, ...cuerpo], anchos, { total: !!totales })
}

const dobleEntrada = tipo(
  'da-doble-entrada',
  'Lee la tabla de doble entrada',
  'Leen una tabla de doble entrada: buscan un dato cruzando fila y columna, y suman una fila o una columna.',
  CITA.leeTablas,
  ({ azar, nivel = 2 }) => {
    const { t, ops, filas, m } = datosDoble(azar, nivel)
    const titulo = `${t.titulo}`
    const dibujo = lamina(titulo, [tablaDoble(ops, filas, m)], `Tabla de doble entrada: ${filas.map((g, i) => `${g.et}: ${ops.map((o, j) => `${o.et} ${m[i][j]}`).join(', ')}`).join('; ')}`)
    const enunciado = `En 4.º grado hicieron una encuesta: «${t.pregunta}». Observa la tabla.`
    const clave = `doble:${t.columna}:${m.map((r) => r.join('-')).join('|')}`
    const modo = azar()
    const i = entero(azar, 0, filas.length - 1)
    const j = entero(azar, 0, ops.length - 1)
    const col = filas.map((_, k) => m[k][j])
    const leeFila = `Fila ${filas[i].et}: ${conValores(
      ops.map((o) => o.et),
      m[i],
    )}`
    if (modo < 0.35 && nivel === 3) {
      // Un paso más: dos datos de la misma columna y su diferencia.
      const k = intentar(() => {
        const x = entero(azar, 0, filas.length - 1)
        return x !== i && m[x][j] !== m[i][j] ? x : null
      })
      if (k === null) return null
      const [a, b] = m[i][j] > m[k][j] ? [i, k] : [k, i]
      const d = m[a][j] - m[b][j]
      const r = opcionesNum(azar, d, [m[a][j] + m[b][j], m[a][j], m[b][j], d + 1, d - 1, d + 2], 1)
      if (!r) return null
      const pasos = [`Se busca la columna ${ops[j].et}`, `${filas[a].et}: ${num(m[a][j])}; ${filas[b].et}: ${num(m[b][j])}`, `Diferencia: ${num(m[a][j])} − ${num(m[b][j])} = ${num(d)}`]
      return { forma: 'opciones', clave: `${clave}:dif${a}-${b}-${j}`, enunciado, dibujo, pregunta: `¿Cuántos estudiantes más eligieron ${ops[j].con} en ${filas[a].et} que en ${filas[b].et}?`, ...r, pasos }
    }
    if (modo < 0.35) {
      const v = m[i][j]
      const otraFila = m[(i + 1) % filas.length][j]
      const r = opcionesNum(azar, v, [otraFila, suma(col), m[i][(j + 1) % ops.length], suma(m[i]), m[i][(j + ops.length - 1) % ops.length]], 1)
      if (!r) return null
      const pasos = [`Se busca la fila ${filas[i].et} y la columna ${ops[j].et}`, `Donde se cruzan: ${num(v)}`]
      return { forma: 'opciones', clave: `${clave}:celda${i}-${j}`, enunciado, dibujo, pregunta: `¿${filas[i].cuantos} eligieron ${ops[j].con}?`, ...r, pasos }
    }
    if (modo < 0.6) {
      const v = suma(col)
      const r = opcionesNum(azar, v, [col[0], col[col.length - 1], suma(m[0]), v + 10, v - 1, v + 1], 1)
      if (!r) return null
      const pasos = [
        `Columna ${ops[j].et}: ${conValores(
          filas.map((g) => g.et),
          col,
        )}`,
        `Total: ${sumados(col)} = ${num(v)}`,
      ]
      return { forma: 'opciones', clave: `${clave}:col${j}`, enunciado, dibujo, pregunta: `¿Cuántos estudiantes en total eligieron ${ops[j].con}?`, ...r, pasos }
    }
    if (modo < 0.8) {
      const v = suma(m[i])
      const r = opcionesNum(azar, v, [suma(col), suma(m[(i + 1) % filas.length]), v + 10, v - 10, v + 1, v - 1], 1)
      if (!r) return null
      return { forma: 'opciones', clave: `${clave}:fila${i}`, enunciado, dibujo, pregunta: `¿${filas[i].cuantos} respondieron la encuesta?`, ...r, pasos: [leeFila, `Total: ${sumados(m[i])} = ${num(v)}`] }
    }
    if (nivel === 3) {
      // Un paso más: lo que más eligieron sumando las tres secciones (no lo que más eligió una sola).
      const totC = ops.map((_, x) => suma(m.map((fila) => fila[x])))
      const k = unico(totC)
      if (k < 0) return null
      const r = ordenar(
        alternativas(
          azar,
          ops[k].et,
          ops.filter((_, x) => x !== k).map((o) => o.et),
          4,
        ),
        ops.map((o) => o.et),
      )
      if (!r) return null
      const pasos = [
        'Se suma cada columna',
        `Totales: ${conValores(
          ops.map((o) => o.et),
          totC,
        )}`,
        `El mayor es ${num(totC[k])}: ${ops[k].et}`,
      ]
      return { forma: 'opciones', clave: `${clave}:mastotal`, enunciado, dibujo, pregunta: `¿Qué ${minus(t.columna)} eligieron más estudiantes, contando las tres secciones?`, ...r, pasos }
    }
    const k = unico(m[i])
    if (k < 0) return null
    const r = ordenar(
      alternativas(
        azar,
        ops[k].et,
        ops.filter((_, x) => x !== k).map((o) => o.et),
        Math.min(4, ops.length),
      ),
      ops.map((o) => o.et),
    )
    if (!r) return null
    return { forma: 'opciones', clave: `${clave}:mas${i}`, enunciado, dibujo, pregunta: `¿Qué eligieron más ${filas[i].quienes}?`, ...r, pasos: [leeFila, `El mayor es ${num(m[i][k])}: ${ops[k].et}`] }
  },
)

const dobleCompleta = tipo(
  'da-doble-completa',
  'Completa la tabla de doble entrada',
  'Completan los datos que faltan en una tabla de doble entrada usando los totales de cada fila y columna.',
  CITA.organiza,
  ({ azar, nivel = 2 }) => {
    const { t, ops, filas, m } = datosDoble(azar, nivel)
    const totF = m.map(suma)
    const totC = ops.map((_, j) => suma(m.map((r) => r[j])))
    const todo = suma(totF)
    const enunciado = `En 4.º grado hicieron una encuesta: «${t.pregunta}». Observa la tabla.`
    const clave = `doble-completa:${t.columna}:${m.map((r) => r.join('-')).join('|')}`
    const alt = (que: string) => `Tabla de doble entrada con totales; ${que}`
    const modo = azar()
    if (modo < 0.5) {
      const i = entero(azar, 0, filas.length - 1)
      const j = entero(azar, 0, ops.length - 1)
      const celdas: Celda[][] = m.map((r, a) => r.map((v, b) => (a === i && b === j ? CASILLA : v)))
      const v = m[i][j]
      if (nivel === 3) {
        // Un paso más: también se borró el total de esa fila, así que se usa el total de la columna.
        const otrosC = totC[j] - v
        const r = opcionesNum(azar, v, [totC[j] + otrosC, totC[j], otrosC, v + 1, v - 1, v + 2], 1)
        if (!r) return null
        return {
          forma: 'opciones',
          clave: `${clave}:${i}-${j}:columna`,
          enunciado: `${enunciado} Se borró el total de ${filas[i].et}.`,
          dibujo: lamina(t.titulo, [tablaDoble(ops, filas, celdas, { filas: totF.map((x, a) => (a === i ? '' : x)), columnas: totC, todo })], alt(`falta el dato de ${filas[i].et} y ${ops[j].et}, y el total de ${filas[i].et}`)),
          pregunta: '¿Qué número va en el recuadro?',
          ...r,
          nota: `${num(totC[j])} − ${num(otrosC)} = ${num(v)}`,
          pasos: [
            `Falta el total de ${filas[i].et}: se usa la columna ${ops[j].et}, que suma ${num(totC[j])}`,
            `Los otros datos de la columna: ${sumados(m.filter((_, a) => a !== i).map((fila) => fila[j]))} = ${num(otrosC)}`,
            `En el recuadro: ${num(totC[j])} − ${num(otrosC)} = ${num(v)}`,
          ],
        }
      }
      const otros = totF[i] - v
      const r = opcionesNum(azar, v, [totF[i] + otros, totF[i], totC[j], v + 1, v - 1, v + 2], 1)
      if (!r) return null
      return {
        forma: 'opciones',
        clave: `${clave}:${i}-${j}`,
        enunciado,
        dibujo: lamina(t.titulo, [tablaDoble(ops, filas, celdas, { filas: totF, columnas: totC, todo })], alt(`falta el dato de ${filas[i].et} y ${ops[j].et}`)),
        pregunta: '¿Qué número va en el recuadro?',
        ...r,
        nota: `${num(totF[i])} − ${num(otros)} = ${num(v)}`,
        pasos: [`En la fila ${filas[i].et}, el total es ${num(totF[i])}`, `Los otros datos de la fila: ${sumados(m[i].filter((_, b) => b !== j))} = ${num(otros)}`, `En el recuadro: ${num(totF[i])} − ${num(otros)} = ${num(v)}`],
      }
    }
    const col0 = m.map((fila) => fila[0])
    return {
      forma: 'abierta',
      clave: `${clave}:totales`,
      enunciado: `${enunciado} Completa los totales de cada fila y de cada columna.`,
      dibujo: lamina(
        t.titulo,
        [tablaDoble(ops, filas, m, { filas: filas.map(() => CASILLA), columnas: ops.map(() => CASILLA), todo: CASILLA })],
        alt('los totales están vacíos'),
      ),
      respuesta: `${filas.map((g, i) => `${g.et}: ${totF[i]}`).join(' · ')} · ${ops.map((o, j) => `${o.et}: ${totC[j]}`).join(' · ')} · Total: ${todo}`,
      espacio: 'dibujo',
      pasos: [
        `Cada fila se suma. ${filas[0].et}: ${sumados(m[0])} = ${num(totF[0])}`,
        `Cada columna se suma. ${ops[0].et}: ${sumados(col0)} = ${num(totC[0])}`,
        `Total: ${sumados(totF)} = ${num(todo)}`,
      ],
    }
  },
)

// ---------- Pictogramas ----------

function ctxPicto(azar: Azar) {
  const ctx = elegir(azar, PICTOS)
  const vertical = ctx.vertical && azar() < 0.6
  return { ctx, vertical }
}

const pictograma = tipo(
  'da-pictograma',
  'Lee el pictograma',
  'Leen un pictograma donde cada símbolo vale 2, 5 o 10 (y medio símbolo, la mitad) y responden cuánto hay.',
  CITA.leePicto,
  ({ azar, nivel = 2 }) => {
    const { ctx, vertical } = ctxPicto(azar)
    const { vale, filas, maxSim } = datosPicto(azar, ctx, vertical, nivel)
    // Medio símbolo siempre que se pueda, salvo en el más fácil (ahí no hay medios).
    if (nivel !== 1 && vale % 2 === 0 && !filas.some((r) => r.medio)) {
      const r = filas.find((x) => simbolosDe(x) < maxSim)
      if (r) r.medio = true
    }
    const valores = filas.map((r) => valorFila(r, vale))
    const enunciado = ctx.simbolo === 'carita' ? 'En el aula votaron por su juego favorito. Observa el pictograma.' : 'Observa el pictograma.'
    const dibujo = dibujoPictograma(ctx, filas, vale, vertical)
    const clave = `picto:${ctx.titulo}:${vale}:${filas.map((r) => `${r.cat}${r.k}${r.medio ? '+' : ''}`).join(',')}`
    const modo = azar()
    if (modo < 0.45) {
      const conMedio = filas.map((r, i) => (r.medio ? i : -1)).filter((i) => i >= 0)
      const i = conMedio.length && azar() < 0.75 ? elegir(azar, conMedio) : entero(azar, 0, filas.length - 1)
      const r = filas[i]
      const v = valores[i]
      const errores = r.medio ? [simbolosDe(r), r.k * vale, (r.k + 1) * vale, v + vale, r.k * vale + 1, v - vale] : [r.k, v + vale, v - vale, r.k * 10 === v ? r.k * 5 : r.k * 10, v + 1]
      const alt = opcionesNum(azar, v, errores, 1)
      if (!alt) return null
      const pasos = [`${cap(ctx.para(r.cat))}: ${cuantosSimbolos(r.k, r.medio).toLowerCase()}`, leyendaPaso(vale, r.medio), cuentaFila(r, vale)]
      return { forma: 'opciones', clave: `${clave}:${i}`, enunciado, dibujo, pregunta: ctx.cuantos(r.cat), ...alt, pasos }
    }
    if (modo < 0.75) {
      const par = intentar(() => {
        const a = entero(azar, 0, filas.length - 1)
        const b = entero(azar, 0, filas.length - 1)
        return valores[a] > valores[b] && simbolosDe(filas[a]) !== simbolosDe(filas[b]) ? [a, b] : null
      })
      if (!par) return null
      const [a, b] = par
      const d = valores[a] - valores[b]
      const alt = opcionesNum(azar, d, [simbolosDe(filas[a]) - simbolosDe(filas[b]), valores[a] + valores[b], valores[a], valores[b], d + vale, d - vale], 1)
      if (!alt) return null
      const pasos = [
        leyendaPaso(vale, filas[a].medio || filas[b].medio),
        `${cap(ctx.para(filas[a].cat))}: ${cuentaFila(filas[a], vale)}`,
        `${cap(ctx.para(filas[b].cat))}: ${cuentaFila(filas[b], vale)}`,
        `Diferencia: ${num(valores[a])} − ${num(valores[b])} = ${num(d)}`,
      ]
      return { forma: 'opciones', clave: `${clave}:${a}-${b}`, enunciado, dibujo, pregunta: ctx.masQue(filas[a].cat, filas[b].cat), ...alt, pasos }
    }
    const tot = suma(valores)
    const sinMedios = suma(filas.map((r) => r.k * vale))
    const alt = opcionesNum(azar, tot, [suma(filas.map(simbolosDe)), sinMedios !== tot ? sinMedios : tot + 2 * vale, tot + vale, tot - vale, tot - valores[valores.length - 1]], 1)
    if (!alt) return null
    const pasos = [
      leyendaPaso(
        vale,
        filas.some((r) => r.medio),
      ),
      conValores(
        filas.map((r) => r.cat),
        valores,
      ),
      `Total: ${sumados(valores)} = ${num(tot)}`,
    ]
    return { forma: 'opciones', clave: `${clave}:total`, enunciado, dibujo, pregunta: ctx.total, ...alt, pasos }
  },
)

const pictogramaCompleta = tipo(
  'da-pictograma-completa',
  'Completa el pictograma',
  'Representan un dato en el pictograma: dibujan cuántos símbolos van si cada uno vale más de una unidad, o descubren cuánto vale cada símbolo.',
  CITA.hacePicto,
  ({ azar, nivel = 2 }) => {
    const { ctx, vertical } = ctxPicto(azar)
    const { vale, filas } = datosPicto(azar, ctx, vertical, nivel)
    const modo = azar()
    const clave = `picto-completa:${ctx.titulo}:${vale}:${filas.map((r) => `${r.cat}${r.k}${r.medio ? '+' : ''}`).join(',')}`
    if (modo < 0.3 && nivel === 3) {
      // Un paso más: se sabe cuánto suman dos filas, no una.
      filas.forEach((r) => (r.medio = false))
      const par = intentar(() => {
        const a = entero(azar, 0, filas.length - 1)
        const b = entero(azar, 0, filas.length - 1)
        return a < b && filas[a].k + filas[b].k <= 10 ? [a, b] : null
      })
      if (!par) return null
      const [ra, rb] = [filas[par[0]], filas[par[1]]]
      const k = ra.k + rb.k
      const v = k * vale
      const alt = opcionesNum(azar, vale, [k, v, 2 * vale, vale / 2, vale + 2, vale - 2].filter((x) => Number.isInteger(x)), 1)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `${clave}:vale${par.join('-')}`,
        enunciado: `En este pictograma se borró cuánto vale cada símbolo. ${ctx.entre(ra.cat, rb.cat, v)}`,
        dibujo: dibujoPictograma(ctx, filas, vale, vertical, true),
        pregunta: '¿Cuánto vale cada símbolo?',
        ...alt,
        nota: `${num(v)} ÷ ${k} = ${num(vale)}`,
        pasos: [
          `${cap(ctx.para(ra.cat))} y ${ctx.para(rb.cat)}: ${num(ra.k)} + ${num(rb.k)} = ${num(k)} símbolos`,
          `Son ${num(v)} ${ctx.unidad}: ${num(v)} ÷ ${num(k)} = ${num(vale)}`,
          `Cada símbolo vale ${num(vale)}`,
        ],
      }
    }
    if (modo < 0.3) {
      // ¿Cuánto vale cada símbolo? La leyenda no lo dice, pero se sabe el dato de una fila.
      const i = intentar(() => {
        const j = entero(azar, 0, filas.length - 1)
        return filas[j].k >= 2 ? j : null
      })
      if (i === null) return null
      filas.forEach((r) => (r.medio = false))
      const r = filas[i]
      const v = r.k * vale
      const alt = opcionesNum(azar, vale, [r.k, v, 2 * vale, vale / 2, v - r.k].filter((x) => Number.isInteger(x)), 1)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `${clave}:vale${i}`,
        enunciado: `En este pictograma se borró cuánto vale cada símbolo. ${ctx.dato(r.cat, v)}`,
        dibujo: dibujoPictograma(ctx, filas, vale, vertical, true),
        pregunta: '¿Cuánto vale cada símbolo?',
        ...alt,
        nota: `${num(v)} ÷ ${r.k} = ${num(vale)}`,
        pasos: [`${cap(ctx.para(r.cat))}: ${num(r.k)} símbolos son ${num(v)} ${ctx.unidad}`, `Cada símbolo vale: ${num(v)} ÷ ${num(r.k)} = ${num(vale)}`],
      }
    }
    const i = entero(azar, 0, filas.length - 1)
    const r = filas[i]
    if (r.k < 1) return null
    r.vacia = true
    const v = valorFila(r, vale)
    const dibujo = dibujoPictograma(ctx, filas, vale, vertical)
    const enteros = r.k * vale
    // Cómo se sabe cuántos símbolos van; el último paso lo pone cada forma de pregunta.
    const calculo = [
      `${cap(ctx.para(r.cat))}: ${num(v)} ${ctx.unidad}; cada símbolo vale ${num(vale)}`,
      r.medio ? `${num(r.k)} × ${num(vale)} = ${num(enteros)}; faltan ${num(v)} − ${num(enteros)} = ${num(vale / 2)}: medio símbolo` : `${num(v)} ÷ ${num(vale)} = ${num(r.k)}`,
    ]
    if (modo < 0.65) {
      const errores = [cuantosSimbolos(v, false), r.medio ? cuantosSimbolos(r.k + 1, false) : cuantosSimbolos(r.k + 1, false), r.medio ? cuantosSimbolos(r.k, false) : cuantosSimbolos(Math.max(1, r.k - 1), false)]
      for (const otro of [2, 5, 10]) if (otro !== vale && v % otro === 0) errores.push(cuantosSimbolos(v / otro, false))
      const alt = alternativas(azar, cuantosSimbolos(r.k, r.medio), errores, 4)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `${clave}:cuantos${i}`,
        enunciado: `Falta completar el pictograma. ${ctx.dato(r.cat, v)}`,
        dibujo,
        pregunta: `¿Cuántos símbolos hay que dibujar para ${ctx.para(r.cat)}?`,
        ...alt,
        pasos: [...calculo, `Hay que dibujar ${cuantosSimbolos(r.k, r.medio)}`],
      }
    }
    const dibujar = `${r.k} ${r.k === 1 ? 'símbolo entero' : 'símbolos enteros'}${r.medio ? ' y medio símbolo' : ''}`
    return {
      forma: 'abierta',
      clave: `${clave}:dibuja${i}`,
      enunciado: `${ctx.dato(r.cat, v)} Dibuja en el pictograma los símbolos que faltan.`,
      dibujo,
      respuesta: `${dibujar} (${num(v)} ÷ ${num(vale)})`,
      espacio: 'dibujo',
      pasos: [...calculo, `Hay que dibujar ${dibujar}`],
    }
  },
)

// ---------- Gráficos de barras ----------

const leeBarras = tipo(
  'da-barras',
  'Lee el gráfico de barras',
  'Leen un gráfico de barras con escala de 10 en 10 o de 20 en 20: un dato, una diferencia o el total.',
  CITA.leeBarras,
  ({ azar, nivel = 2 }) => {
    // Más fácil: 3 o 4 barras; más difícil: 5 (y la escala de 20 en 20).
    const n = entero(azar, ...BARRAS_NIVEL[nivel])
    const { ctx, idx, cats } = ctxBarras(azar, n)
    const { max, cada, valores } = datosBarras(azar, cats.length, nivel)
    const dibujo = lamina(ctx.titulo, [barras({ eje: ctx.eje, cats, valores, max, cada })], `Gráfico de barras «${ctx.titulo}»: ${cats.map((c, i) => `${c} ${valores[i]}`).join(', ')}; escala de ${cada} en ${cada}`)
    const clave = `barras:${ctx.titulo}:${cats.join(',')}:${valores.join('-')}`
    const enunciado = 'Observa el gráfico de barras.'
    const modo = azar()
    if (modo < 0.4) {
      // Mejor una barra que no cae justo en un número escrito de la escala.
      const entre = valores.map((v, i) => (v % cada !== 0 ? i : -1)).filter((i) => i >= 0)
      const i = entre.length && (nivel === 3 || azar() < 0.8) ? elegir(azar, entre) : entero(azar, 0, cats.length - 1)
      const v = valores[i]
      const alt = opcionesNum(azar, v, [v / 10, v + 10, v - 10, v + 5, v - 5, ...valores.filter((x) => x !== v)], 1, 10)
      if (!alt) return null
      const pasos = [`La escala va de ${num(cada)} en ${num(cada)}`, leeBarra(cats[i], v, cada)]
      return { forma: 'opciones', clave: `${clave}:${i}`, enunciado, dibujo, pregunta: ctx.cuantos(idx[i]), ...alt, pasos }
    }
    if (modo < 0.65) {
      const [a, b] = barajar(azar, cats.map((_, i) => i)).slice(0, 2).sort((x, y) => valores[y] - valores[x])
      const d = valores[a] - valores[b]
      const alt = opcionesNum(azar, d, [d / 10, valores[a] + valores[b], valores[a], valores[b], d + 10, d - 10], 1, 10)
      if (!alt) return null
      const pasos = [`La barra de ${cats[a]} llega a ${num(valores[a])} y la de ${cats[b]}, a ${num(valores[b])}`, `Diferencia: ${num(valores[a])} − ${num(valores[b])} = ${num(d)}`]
      return { forma: 'opciones', clave: `${clave}:${a}-${b}`, enunciado, dibujo, pregunta: ctx.masQue(idx[a], idx[b]), ...alt, pasos }
    }
    if (modo < 0.85) {
      const i = entero(azar, 0, cats.length - 1)
      const alt = ordenar(alternativas(azar, cats[i], cats.filter((_, j) => j !== i), 4), cats)
      if (!alt) return null
      const pasos = [`Se busca en la escala el ${num(valores[i])} y la barra que llega ahí`, `Llega a ${num(valores[i])} la barra de ${cats[i]}`]
      return { forma: 'opciones', clave: `${clave}:cual${i}`, enunciado, dibujo, pregunta: ctx.cual(valores[i]), ...alt, pasos }
    }
    const tot = suma(valores)
    const alt = opcionesNum(azar, tot, [tot / 10, tot - valores[0], tot + 10, tot - 10, tot + 20], 1, 10)
    if (!alt) return null
    return { forma: 'opciones', clave: `${clave}:total`, enunciado, dibujo, pregunta: ctx.total, ...alt, pasos: [`Las barras: ${conValores(cats, valores)}`, `Total: ${sumados(valores)} = ${num(tot)}`] }
  },
)

const barrasCompleta = tipo(
  'da-barras-completa',
  'Completa el gráfico de barras',
  'Representan datos en un gráfico de barras con escala de 10 en 10: dibujan una barra, completan la escala o encuentran la barra mal dibujada.',
  CITA.haceBarras,
  ({ azar, nivel = 2 }) => {
    const modo = azar()
    if (modo < 0.35) {
      const { ctx, idx, cats } = ctxBarras(azar, entero(azar, ...BARRAS_NIVEL[nivel]))
      const { max, cada, valores } = datosBarras(azar, cats.length, nivel)
      // En el difícil, la barra termina entre dos números de la escala.
      const entre = valores.map((x, k) => (x % cada !== 0 ? k : -1)).filter((k) => k >= 0)
      const i = nivel === 3 && entre.length ? elegir(azar, entre) : entero(azar, 0, cats.length - 1)
      const v = valores[i]
      return {
        forma: 'abierta',
        clave: `barras-dibuja:${ctx.titulo}:${cats.join(',')}:${valores.join('-')}:${i}`,
        enunciado: `${ctx.dato(idx[i], v)} Dibuja esa barra en el gráfico.`,
        dibujo: lamina(ctx.titulo, [barras({ eje: ctx.eje, cats, valores: valores.map((x, j) => (j === i ? null : x)), max, cada })], `Gráfico de barras «${ctx.titulo}» sin la barra de ${cats[i]}`),
        respuesta: `Una barra para ${cats[i]} que llega hasta ${num(v)}.`,
        espacio: 'dibujo',
        pasos: [
          `La escala va de ${num(cada)} en ${num(cada)}`,
          ...(v % cada === 0 ? [] : [`${num(v)} queda entre ${num(v - (v % cada))} y ${num(v - (v % cada) + cada)}, en la línea del medio`]),
          `Se dibuja la barra de ${cats[i]} hasta ${num(v)}`,
        ],
      }
    }
    if (modo < 0.65) {
      const { ctx, idx, cats } = ctxBarras(azar, entero(azar, ...BARRAS_NIVEL[nivel]))
      const { max, cada, valores } = datosBarras(azar, cats.length, nivel)
      const marcas = max / cada
      const k = entero(azar, 2, marcas - 1)
      const oculta = k * cada
      const prev = oculta - cada
      const escala = `La escala: ${Array.from({ length: marcas + 1 }, (_, x) => (x === k ? '?' : num(x * cada))).join(', ')}`
      if (nivel === 3) {
        // Un paso más: con el número borrado, leer una barra que llega hasta ahí (o a la mitad del tramo siguiente).
        const v = oculta + (azar() < 0.5 ? 0 : cada / 2)
        const i = entero(azar, 0, cats.length - 1)
        const j = valores.indexOf(v)
        if (j >= 0) valores[j] = valores[i]
        valores[i] = v
        const alt = opcionesNum(azar, v, [prev, oculta + cada, v - 10, v + 10, prev + 1], 1, 10)
        if (!alt) return null
        return {
          forma: 'opciones',
          clave: `barras-escala-lee:${max}:${cada}:${k}:${valores.join('-')}:${i}`,
          enunciado: `En la escala de este gráfico se borró un número.`,
          dibujo: lamina(ctx.titulo, [barras({ eje: ctx.eje, cats, valores, max, cada, oculta })], `Gráfico de barras «${ctx.titulo}» con la escala de ${cada} en ${cada} y un número borrado: ${cats.map((c, x) => `${c} ${valores[x]}`).join(', ')}`),
          pregunta: ctx.cuantos(idx[i]),
          ...alt,
          pasos: [escala, `En el recuadro: ${num(prev)} + ${num(cada)} = ${num(oculta)}`, leeBarra(cats[i], v, cada)],
        }
      }
      const alt = opcionesNum(azar, oculta, [prev + 1, cada === 20 ? prev + 10 : oculta + 20, oculta + cada, k, prev], 1)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `barras-escala:${max}:${cada}:${k}:${valores.join('-')}`,
        enunciado: `En la escala de este gráfico se borró un número.`,
        dibujo: lamina(ctx.titulo, [barras({ eje: ctx.eje, cats, valores, max, cada, oculta })], `Gráfico de barras con la escala de ${cada} en ${cada} y un número borrado`),
        pregunta: '¿Qué número va en el recuadro?',
        ...alt,
        pasos: [escala, `Va de ${num(cada)} en ${num(cada)}: ${num(prev)} + ${num(cada)} = ${num(oculta)}`],
      }
    }
    // Una tabla y su gráfico: una barra no coincide con la tabla. Más fácil: 3 barras y la mala se pasa por 20 o 30.
    // Más difícil: 5 barras, escala de 20 en 20 y la mala se pasa solo por 10.
    const { ctx, cats } = ctxBarras(azar, { 1: 3, 2: 4, 3: 5 }[nivel])
    const { max, cada, valores } = datosBarras(azar, cats.length, nivel)
    const cambios = { 1: [-30, -20, 20, 30], 2: [-20, -10, 10, 20], 3: [-10, 10] }[nivel]
    const sirve = (x: number) => x >= 10 && x <= max && !valores.includes(x)
    // En el difícil, una barra que se pueda correr solo 10 sin chocar con otra.
    const desde = entero(azar, 0, cats.length - 1)
    const i = nivel === 3 ? (valores.map((_, k) => (desde + k) % valores.length).find((k) => cambios.some((dx) => sirve(valores[k] + dx))) ?? -1) : desde
    if (i < 0) return null
    const mal = intentar(() => {
      const x = valores[i] + elegir(azar, cambios)
      return sirve(x) ? x : null
    })
    if (mal === null) return null
    const dibujados = valores.map((v, j) => (j === i ? mal : v))
    const t = tabla([[ctx.columna, ...cats], [ctx.eje, ...valores]], [anchoCol([ctx.eje, ctx.columna], 100), ...cats.map((c) => anchoCol([c], 84))], { alto: 32 })
    const g = barras({ eje: ctx.eje, cats, valores: dibujados, max, cada, alto: 170 })
    const alt = ordenar(alternativas(azar, cats[i], cats.filter((_, j) => j !== i), 4), cats)
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `barras-mal:${ctx.titulo}:${cats.join(',')}:${valores.join('-')}:${i}:${mal}`,
      enunciado: `${nombre(azar)} hizo un gráfico de barras con los datos de la tabla, pero se equivocó en una barra.`,
      dibujo: lamina(ctx.titulo, [t, g], `Tabla: ${cats.map((c, j) => `${c} ${valores[j]}`).join(', ')}; gráfico con ${cats[i]} en ${mal}`, 14),
      pregunta: '¿Qué barra está mal dibujada?',
      ...alt,
      nota: `La barra de ${cats[i]} llega a ${num(mal)}, pero en la tabla dice ${num(valores[i])}.`,
      pasos: ['Se compara cada barra con su número en la tabla', `${cats[i]}: en la tabla dice ${num(valores[i])}, pero la barra llega a ${num(mal)}`, `Está mal la barra de ${cats[i]}`],
    }
  },
)

// ---------- La moda ----------

type CtxLista = { titulo: string; intro: (q: string, cuantos: string) => string; etiqueta: (i: number, nombres: string[]) => string; dominio: [number, number]; dato: string; cuenta: string; nombres: boolean }
const LISTAS: CtxLista[] = [
  { titulo: 'Goles en cada partido', intro: () => 'Estos son los goles que metió el equipo de 4.º en cada partido del campeonato.', etiqueta: (i) => `Partido ${i + 1}`, dominio: [0, 5], dato: 'Goles', cuenta: 'Partidos', nombres: false },
  { titulo: 'Número de hermanos', intro: (_q, c) => `${c} estudiantes del aula dijeron cuántos hermanos tienen.`, etiqueta: (i, ns) => ns[i], dominio: [0, 4], dato: 'Hermanos', cuenta: 'Estudiantes', nombres: true },
  { titulo: 'Talla de zapatos', intro: (_q, c) => `${c} estudiantes del aula dijeron qué talla de zapatos usan.`, etiqueta: (i, ns) => ns[i], dominio: [30, 35], dato: 'Talla', cuenta: 'Estudiantes', nombres: true },
  { titulo: 'Puntos en el juego de embocar', intro: (q) => `En la kermés, ${q} anotó sus puntos en cada ronda del juego de embocar la pelota.`, etiqueta: (i) => `Ronda ${i + 1}`, dominio: [1, 6], dato: 'Puntos', cuenta: 'Rondas', nombres: false },
]

/**
 * Por nivel: cuántos datos (y cómo se dice), cuántas veces sale la moda, hasta cuántas veces sale otro dato y en
 * cuántas tarjetas por fila. Más fácil: 8 datos y la moda sale 4 veces, el doble que cualquier otro. Más difícil: 12
 * datos y otro dato sale solo una vez menos que la moda.
 */
const MODA_NIVEL = {
  1: { datos: 8, palabra: 'Ocho', fModa: [4, 4], otraMax: 2, segundaCerca: false, distintos: 3, porFila: 4 },
  2: { datos: 10, palabra: 'Diez', fModa: [3, 4], otraMax: null, segundaCerca: false, distintos: 4, porFila: 5 },
  3: { datos: 12, palabra: 'Doce', fModa: [4, 5], otraMax: null, segundaCerca: true, distintos: 5, porFila: 6 },
}

/** Una lista de datos (10 en el normal) con una moda clara (se repite más que cualquier otro). */
function listaConModa(azar: Azar, ctx: CtxLista, nivel: Nivel = 2) {
  const M = MODA_NIVEL[nivel]
  return intentar(() => {
    const [lo, hi] = ctx.dominio
    const valores: number[] = []
    for (let v = lo; v <= hi; v++) valores.push(v)
    const moda = elegir(azar, valores)
    const fModa = entero(azar, M.fModa[0], M.fModa[1])
    const datos = Array(fModa).fill(moda) as number[]
    while (datos.length < M.datos) datos.push(elegir(azar, valores.filter((v) => v !== moda)))
    const frec = new Map<number, number>()
    for (const d of datos) frec.set(d, (frec.get(d) ?? 0) + 1)
    const otras = [...frec.entries()].filter(([v]) => v !== moda)
    if (otras.some(([, c]) => c > (M.otraMax ?? fModa - 1)) || frec.size < M.distintos) return null
    if (M.segundaCerca && !otras.some(([, c]) => c === fModa - 1)) return null
    return { datos: barajar(azar, datos), moda, fModa, frec }
  })
}

/** Tarjetas con un nombre (o "Partido 3") arriba y el dato grande abajo, `porFila` en cada fila. */
function tarjetasDato(etiquetas: string[], datos: number[], porFila = 5): Pieza {
  const W = 84
  const H = 62
  const partes = datos.map((d, i) => {
    const x = (i % porFila) * (W + 8) + 2
    const y = Math.floor(i / porFila) * (H + 8) + 2
    return rect(x, y, W, H, { relleno: '#ffffff', grosor: 1.5, redondeo: 6 }) + rect(x, y, W, 22, { relleno: SUAVE, grosor: 1.5, redondeo: 6 }) + texto(x + W / 2, y + 11.5, etiquetas[i], { tam: 13 }) + texto(x + W / 2, y + 43, num(d), { tam: 22, peso: 700 })
  })
  return { cuerpo: partes.join(''), ancho: porFila * (W + 8) - 4, alto: Math.ceil(datos.length / porFila) * (H + 8) - 4 }
}

const moda = tipo(
  'da-moda',
  'Encuentra la moda',
  'Encuentran la moda en una lista de datos (goles, hermanos, tallas): el dato que más se repite.',
  CITA.moda,
  ({ azar, nivel = 2 }) => {
    const M = MODA_NIVEL[nivel]
    const ctx = elegir(azar, LISTAS)
    const l = listaConModa(azar, ctx, nivel)
    if (!l) return null
    const nombres = barajar(
      azar,
      NOMBRES.filter((x) => x.length <= 8),
    )
    const etiquetas = l.datos.map((_, i) => ctx.etiqueta(i, nombres))
    const intro = ctx.intro(nombre(azar), M.palabra)
    const pieza = tarjetasDato(etiquetas, l.datos, M.porFila)
    const alt = `${ctx.titulo}: ${l.datos.join(', ')}`
    const clave = `moda:${ctx.titulo}:${l.datos.join(',')}`
    const max = Math.max(...l.datos)
    const min = Math.min(...l.datos)
    const orden = [...l.frec.entries()].sort((a, b) => b[1] - a[1])
    const segunda = orden[1][0]
    const menos = orden[orden.length - 1][0]
    const cuantasVeces = (vs: number[]) => vs.map((v) => `${num(v)}: ${veces(l.frec.get(v) ?? 0)}`).join(', ')
    const salen = cuantasVeces([...l.frec.keys()].sort((a, b) => a - b))
    const masSeRepite = `Se repite más el ${num(l.moda)} (${veces(l.fModa)}): la moda es ${num(l.moda)}`
    const modo = azar()
    if (modo < 0.45) {
      const r = opcionesNum(azar, l.moda, [l.fModa, max, segunda, l.datos[0], min, menos])
      if (!r) return null
      const pasos = ['Se cuenta cuántas veces sale cada dato', salen, masSeRepite]
      return { forma: 'opciones', clave, enunciado: intro, dibujo: lamina(ctx.titulo, [pieza], alt), pregunta: '¿Cuál es la moda de estos datos?', ...r, pasos }
    }
    if (modo < 0.75) {
      const bien = `La moda es ${l.moda}, porque es el dato que más se repite.`
      // Cada alternativa incorrecta nombra un número que no es la moda (si no, la razón sería lo único falso).
      const malas = [
        max !== l.moda ? `La moda es ${max}, porque es el número más grande.` : `La moda es ${min}, porque es el número más pequeño.`,
        ...(l.fModa !== l.moda ? [`La moda es ${l.fModa}, porque ${l.moda} se repite ${l.fModa} veces.`] : []),
        `La moda es ${menos}, porque es el dato que menos se repite.`,
        ...(l.datos[0] !== l.moda ? [`La moda es ${l.datos[0]}, porque es el primer dato.`] : []),
        `La moda es ${M.datos}, porque son ${M.datos} datos.`,
      ]
      const r = alternativas(azar, bien, malas, 4)
      if (!r) return null
      const pasos = ['Se cuenta cuántas veces sale cada dato', salen, bien]
      return { forma: 'opciones', clave: `${clave}:explica`, enunciado: intro, dibujo: lamina(ctx.titulo, [pieza], alt), pregunta: '¿Qué afirmación es correcta?', ...r, pasos }
    }
    const [lo, hi] = ctx.dominio
    const vals: number[] = []
    for (let v = lo; v <= hi; v++) vals.push(v)
    const t = tabla([[ctx.dato, ...vals], [ctx.cuenta, ...vals.map(() => CASILLA)]], [anchoCol([ctx.dato, ctx.cuenta], 100), ...vals.map(() => 56)], { alto: 38 })
    const linea = { cuerpo: texto(0, 18, 'La moda es:', { tam: 16, peso: 700, ancla: 'start' }) + casilla(106, 2, 50, 32), ancho: 160, alto: 36 }
    return {
      forma: 'abierta',
      clave: `${clave}:tabla`,
      enunciado: `${intro} Cuenta cuántas veces se repite cada dato, completa la tabla y escribe la moda.`,
      dibujo: lamina(ctx.titulo, [pieza, t, linea], `${alt}; debajo, una tabla de frecuencias vacía`, 14),
      respuesta: `${vals.map((v) => `${v}: ${l.frec.get(v) ?? 0}`).join(' · ')}. La moda es ${l.moda}.`,
      espacio: 'dibujo',
      pasos: ['Se cuenta cuántas veces sale cada dato y se anota en la tabla', cuantasVeces(vals), masSeRepite],
    }
  },
)

const modaTabla = tipo(
  'da-moda-tabla',
  'La moda en la tabla o el gráfico',
  'Encuentran la moda en una tabla o un gráfico de barras y razonan si cambia cuando llegan más votos.',
  CITA.moda,
  ({ azar, nivel = 2 }) => {
    const t = elegir(azar, TEMAS)
    // Más fácil: 3 opciones y la moda le saca 4 votos o más a la segunda (30 en el gráfico). Más difícil: 5 opciones
    // en la tabla (4 en el gráfico, para que quepan), la primera y la segunda a un voto (a 10 en el gráfico) y al
    // final llegan votos para las dos.
    let ops: Cat[]
    let enBarras: boolean
    if (nivel === 2) {
      ops = opcionesDe(azar, t, 4)
      enBarras = azar() < 0.4
    } else {
      enBarras = azar() < 0.4
      ops = opcionesDe(azar, t, nivel === 1 ? 3 : enBarras ? 4 : 5)
    }
    const valores = nivel === 2 ? (enBarras ? distintos(azar, ops.length, 10, 80, 10) : distintos(azar, ops.length, 3, 18)) : votosCon(azar, ops.length, enBarras, true, nivel === 1 ? (enBarras ? 3 : 4) : 1, nivel === 3)
    if (!valores) return null
    const cats = ops.map((o) => o.et)
    const sec = seccion(azar)
    const pieza = enBarras ? barras({ eje: 'Votos', cats, valores, max: 80, cada: 10, slot: Math.max(80, ...cats.map((c) => anchoTexto(c, 14) + 12)) }) : tablaFrecuencias(t.columna, cats, valores, 'sin-conteo')
    const dibujo = lamina(`${t.titulo} en ${sec}`, [pieza], `${enBarras ? 'Gráfico de barras' : 'Tabla'} de votos: ${cats.map((c, i) => `${c} ${valores[i]}`).join(', ')}`)
    const enunciado = `En ${sec} votaron por ${t.voto}.`
    const clave = `moda-tabla:${t.columna}:${cats.join(',')}:${valores.join('-')}`
    const orden = valores.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0])
    const [vMax, iMax] = orden[0]
    const [vSeg, iSeg] = orden[1]
    if (azar() < 0.55) {
      const r = alternativas(azar, cats[iMax], [num(vMax), cats[orden[orden.length - 1][1]], cats[iSeg], cats[orden[2][1]]], 4)
      if (!r) return null
      const pasos = [`Votos: ${conValores(cats, valores)}`, `La mayor frecuencia es ${num(vMax)}: la moda es ${cats[iMax]}`]
      return { forma: 'opciones', clave, enunciado, dibujo, pregunta: '¿Cuál es la moda?', ...r, nota: `La moda es el dato con mayor frecuencia: ${cats[iMax]} (${num(vMax)} votos).`, pasos }
    }
    // Llegan más votos para el segundo: ¿cambia la moda?
    const paso = enBarras ? 10 : 1
    if (nivel === 3) {
      // Un paso más: llegan votos para las dos primeras; se suma a cada una y se comparan.
      const par = intentar(() => {
        const x = paso * entero(azar, 1, 5)
        const y = paso * entero(azar, 1, 4)
        return vSeg + x !== vMax + y ? [x, y] : null
      })
      if (!par) return null
      const [x, y] = par
      const seg = vSeg + x
      const pri = vMax + y
      const nueva = seg > pri ? iSeg : iMax
      const r = ordenar(
        alternativas(
          azar,
          cats[nueva],
          cats.filter((_, j) => j !== nueva),
          4,
        ),
        cats,
      )
      if (!r) return null
      const eligen = (k: number) => `${num(k)} ${k === 1 ? 'elige' : 'eligen'}`
      return {
        forma: 'opciones',
        clave: `${clave}:llegan${x}-${y}`,
        enunciado,
        dibujo,
        pregunta: `Después votan ${num(x + y)} estudiantes más: ${eligen(x)} ${ops[iSeg].con} y ${eligen(y)} ${ops[iMax].con}. ¿Cuál será la moda?`,
        ...r,
        nota: `${cats[iSeg]} queda con ${num(seg)} votos y ${cats[iMax]} con ${num(pri)}.`,
        pasos: [
          `Antes: ${cats[iMax]} ${num(vMax)} y ${cats[iSeg]} ${num(vSeg)}`,
          `${cats[iSeg]}: ${num(vSeg)} + ${num(x)} = ${num(seg)}`,
          `${cats[iMax]}: ${num(vMax)} + ${num(y)} = ${num(pri)}`,
          seg > pri ? `${num(seg)} es más que ${num(pri)}: la moda será ${cats[iSeg]}` : `${num(seg)} es menos que ${num(pri)}: la moda sigue siendo ${cats[iMax]}`,
        ],
      }
    }
    const cambia = azar() < 0.5
    const llegan = cambia ? vMax - vSeg + paso * entero(azar, 1, 2) : vMax - vSeg - paso
    if (llegan <= 0) return null
    const nueva = cambia ? iSeg : iMax
    const r = ordenar(alternativas(azar, cats[nueva], cats.filter((_, j) => j !== nueva), 4), cats)
    if (!r) return null
    return {
      forma: 'opciones',
      clave: `${clave}:llegan${llegan}`,
      enunciado,
      dibujo,
      pregunta: `Después ${llegan === 1 ? 'vota 1 estudiante más y elige' : `votan ${num(llegan)} estudiantes más y todos eligen`} ${ops[iSeg].con}. ¿Cuál será la moda?`,
      ...r,
      nota: `${cats[iSeg]} queda con ${num(vSeg + llegan)} votos y ${cats[iMax]} con ${num(vMax)}.`,
      pasos: [
        `Antes: ${cats[iMax]} ${num(vMax)} y ${cats[iSeg]} ${num(vSeg)}`,
        `${cats[iSeg]}: ${num(vSeg)} + ${num(llegan)} = ${num(vSeg + llegan)}`,
        cambia ? `${num(vSeg + llegan)} es más que ${num(vMax)}: la moda será ${cats[iSeg]}` : `${num(vSeg + llegan)} es menos que ${num(vMax)}: la moda sigue siendo ${cats[iMax]}`,
      ],
    }
  },
)

// ---------- La media aritmética ----------

const CUBO = 28

/** Torres de cubos sobre una mesa, con el nombre debajo. null: una torre tapada ("?"). */
function dibujoTorres(alturas: (number | null)[], nombres: string[]): Dibujo {
  const SEP = 96
  const maxH = Math.max(5, ...alturas.map((h) => h ?? 0))
  const base = 12 + maxH * CUBO
  const W = 16 + alturas.length * SEP
  const partes: string[] = []
  alturas.forEach((h, i) => {
    const cx = 8 + i * SEP + SEP / 2
    if (h === null) {
      partes.push(rect(cx - 22, base - 4 * CUBO, 44, 4 * CUBO, { relleno: '#ffffff', grosor: 1.6, punteado: true, redondeo: 4 }))
      partes.push(texto(cx, base - 2 * CUBO, '?', { tam: 30, peso: 700 }))
    } else {
      for (let k = 0; k < h; k++) {
        const y = base - (k + 1) * CUBO
        partes.push(rect(cx - CUBO / 2, y, CUBO, CUBO, { relleno: '#d2d2d2', grosor: 1.6 }))
        partes.push(rect(cx - 7, y + 7, 14, 14, { relleno: '#e9e9e9', trazo: GRIS, grosor: 1 }))
      }
    }
    partes.push(texto(cx, base + 22, nombres[i], { tam: 15, peso: 700 }))
  })
  partes.push(linea(6, base, W - 6, base, { grosor: 2.4 }))
  return svg(W, base + 40, partes.join(''), `Torres de cubos: ${alturas.map((h, i) => `${nombres[i]} ${h ?? '?'}`).join(', ')}`)
}

/** n números entre lo y hi, no todos iguales, cuya media es entera. */
function conMediaEntera(azar: Azar, n: number, lo: number, hi: number) {
  return intentar(() => {
    const xs = Array.from({ length: n }, () => entero(azar, lo, hi))
    const s = suma(xs)
    return s % n === 0 && new Set(xs).size >= Math.min(3, n) ? xs : null
  })
}

const mediana = (xs: number[]) => {
  const o = [...xs].sort((a, b) => a - b)
  return o.length % 2 ? o[(o.length - 1) / 2] : (o[o.length / 2 - 1] + o[o.length / 2]) / 2
}

const mediaTorres = tipo(
  'da-media-torres',
  'Empareja las torres',
  'Emparejan torres de cubos pasando cubos de una a otra para hallar la media como punto de equilibrio.',
  CITA.media,
  ({ azar, nivel = 2 }) => {
    // Más fácil: 2 o 3 torres de hasta 6 cubos. Más difícil: 4 o 5 torres de hasta 10 cubos y, al pasar cubos, una
    // tercera torre que ya está en la media (un dato que no cambia nada).
    const T = {
      1: { n: [2, 3], lo: 1, hi: 6, falta: [2, 3] },
      2: { n: [3, 5], lo: 1, hi: 9, falta: [3, 4] },
      3: { n: [4, 5], lo: 2, hi: 10, falta: [4, 5] },
    }[nivel]
    const nombres = barajar(
      azar,
      NOMBRES.filter((x) => x.length <= 8),
    )
    const modo = azar()
    if (modo < 0.45) {
      const n = entero(azar, T.n[0], T.n[1])
      const h = conMediaEntera(azar, n, T.lo, T.hi)
      if (!h) return null
      const m = suma(h) / n
      const alt = opcionesNum(azar, m, [suma(h), Math.max(...h), Math.min(...h), mediana(h), m + 1, m - 1].filter(Number.isInteger), 1)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `torres:${h.join('-')}`,
        enunciado: `${nombres.slice(0, n).join(', ').replace(/, ([^,]*)$/, ' y $1')} armaron torres de cubos.`,
        dibujo: dibujoTorres(h, nombres),
        pregunta: 'Si emparejan las torres pasando cubos de una a otra, ¿cuántos cubos tendrá cada torre?',
        ...alt,
        nota: `Hay ${suma(h)} cubos; repartidos en ${n} torres iguales, quedan ${m} en cada una.`,
        pasos: [`Cubos de cada torre: ${conValores(nombres.slice(0, n), h)}`,`Total: ${sumados(h)} = ${num(suma(h))} cubos`, `Repartidos en ${num(n)} torres: ${num(suma(h))} ÷ ${num(n)} = ${num(m)}`],
      }
    }
    if (modo < 0.7 && nivel === 3) {
      const tres = intentar(() => {
        const m = entero(azar, 3, 8)
        const d = entero(azar, 1, Math.min(m - 1, 10 - m))
        return d >= 1 ? barajar(azar, [m + d, m, m - d]) : null
      })
      if (!tres) return null
      const m = suma(tres) / 3
      const a = tres.indexOf(Math.max(...tres))
      const b = tres.indexOf(Math.min(...tres))
      const c = 3 - a - b
      const pasa = tres[a] - m
      const alt = opcionesNum(azar, pasa, [tres[a] - tres[b], m, pasa + 1, tres[a], tres[b], pasa - 1], 1)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `torres-pasa3:${tres.join('-')}`,
        enunciado: `${nombres[0]}, ${nombres[1]} y ${nombres[2]} quieren que sus tres torres tengan la misma altura.`,
        dibujo: dibujoTorres(tres, nombres),
        pregunta: `¿Cuántos cubos debe pasar ${nombres[a]} a la torre de ${nombres[b]}?`,
        ...alt,
        nota: `La torre de ${nombres[c]} ya tiene ${m}: así las tres quedan con ${m} cubos.`,
        pasos: [
          `Total: ${sumados(tres)} = ${num(3 * m)} cubos`,
          `Iguales: ${num(3 * m)} ÷ 3 = ${num(m)} en cada torre`,
          `${nombres[c]} ya tiene ${num(m)}: su torre no cambia`,
          `${nombres[a]} pasa ${num(tres[a])} − ${num(m)} = ${num(pasa)} a ${nombres[b]}`,
        ],
      }
    }
    if (modo < 0.7) {
      const par = intentar(() => {
        const a = entero(azar, nivel === 1 ? 3 : 4, nivel === 1 ? 8 : 9)
        const b = entero(azar, 1, a - 2)
        return (a - b) % 2 === 0 ? [a, b] : null
      })
      if (!par) return null
      const [a, b] = par
      const pasa = (a - b) / 2
      const alt = opcionesNum(azar, pasa, [a - b, (a + b) / 2, pasa + 1, a, b], 1)
      if (!alt) return null
      // Un paso menos en el más fácil: se dice con cuántos cubos debe quedar cada torre.
      const m = (a + b) / 2
      return {
        forma: 'opciones',
        clave: `torres-pasa:${a}-${b}`,
        enunciado: nivel === 1 ? `${nombres[0]} y ${nombres[1]} quieren que sus dos torres queden con ${m} cubos cada una.` : `${nombres[0]} y ${nombres[1]} quieren que sus torres tengan la misma altura.`,
        dibujo: dibujoTorres([a, b], nombres),
        pregunta: `¿Cuántos cubos debe pasar ${nombres[0]} a la torre de ${nombres[1]}?`,
        ...alt,
        nota: `Así las dos quedan con ${(a + b) / 2} cubos.`,
        pasos:
          nivel === 1
            ? [`${nombres[0]} tiene ${num(a)} cubos y debe quedar con ${num(m)}`, `Pasa ${num(a)} − ${num(m)} = ${num(pasa)}`]
            : [`${nombres[0]} tiene ${num(a)} cubos y ${nombres[1]}, ${num(b)}`, `Diferencia: ${num(a)} − ${num(b)} = ${num(a - b)}`, `Se pasa la mitad: ${num(a - b)} ÷ 2 = ${num(pasa)}`],
      }
    }
    // Falta una torre: se sabe cuánto queda cada una al emparejarlas.
    const n = entero(azar, T.falta[0], T.falta[1])
    const h = intentar(() => {
      const x = conMediaEntera(azar, n, T.lo, T.hi)
      return x && x[n - 1] !== suma(x) / n ? x : null
    })
    if (!h) return null
    const m = suma(h) / n
    const i = n - 1
    const otras = suma(h) - h[i]
    const alt = opcionesNum(azar, h[i], [m, n * m, h[i] + 1, h[i] - 1, otras], 1)
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `torres-falta:${h.join('-')}`,
      enunciado: `Al emparejar las ${n} torres, cada una quedó con ${m} cubos. La torre de ${nombres[i]} está tapada.`,
      dibujo: dibujoTorres(
        h.map((x, k) => (k === i ? null : x)),
        nombres,
      ),
      pregunta: `¿Cuántos cubos tenía la torre de ${nombres[i]}?`,
      ...alt,
      nota: `En total hay ${n} × ${m} = ${n * m} cubos; ${n * m} − ${otras} = ${h[i]}.`,
      pasos: [
        `Las otras torres: ${sumados(h.filter((_, k) => k !== i))} = ${num(otras)} cubos`,
        `Al emparejarlas: ${num(n)} × ${num(m)} = ${num(n * m)} cubos en total`,
        `Torre de ${nombres[i]}: ${num(n * m)} − ${num(otras)} = ${num(h[i])}`,
      ],
    }
  },
)

type CtxMedia = { titulo: string; fila: string; intro: (q: string) => string; etiquetas: string[]; rango: [number, number]; pregunta: string; falta: (m: number, et: string) => string; soles: boolean; cada: string }
const MEDIAS: CtxMedia[] = [
  {
    titulo: 'Botellas para reciclar',
    fila: 'Botellas',
    intro: () => 'El aula juntó botellas para reciclar durante la semana.',
    etiquetas: DIAS,
    rango: [4, 20],
    pregunta: 'Si cada día hubieran juntado la misma cantidad, ¿cuántas botellas serían por día?',
    falta: (m, et) => `Si cada día hubieran juntado lo mismo, serían ${m} botellas por día. ¿Cuántas botellas juntaron el ${minus(et)}?`,
    soles: false,
    cada: 'día',
  },
  {
    titulo: 'Litros de leche de la vaca',
    fila: 'Litros',
    intro: () => 'En la chacra anotaron los litros de leche que dio la vaca cada día.',
    etiquetas: DIAS,
    rango: [5, 14],
    pregunta: 'Si cada día hubiera dado lo mismo, ¿cuántos litros serían por día?',
    falta: (m, et) => `Si cada día hubiera dado lo mismo, serían ${m} litros por día. ¿Cuántos litros dio el ${minus(et)}?`,
    soles: false,
    cada: 'día',
  },
  {
    titulo: 'Ahorro en la alcancía',
    fila: 'Soles',
    intro: (q) => `${q} anotó cuánto ahorró en su alcancía cada semana.`,
    etiquetas: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5'],
    rango: [2, 15],
    pregunta: 'Si cada semana hubiera ahorrado lo mismo, ¿cuánto sería por semana?',
    falta: (m, et) => `Si cada semana hubiera ahorrado lo mismo, serían S/ ${m} por semana. ¿Cuánto ahorró en la ${minus(et)}?`,
    soles: true,
    cada: 'semana',
  },
  {
    titulo: 'Huevos de las gallinas',
    fila: 'Huevos',
    intro: () => 'En el corral anotaron cuántos huevos pusieron las gallinas cada día.',
    etiquetas: DIAS,
    rango: [3, 12],
    pregunta: 'Si cada día hubieran puesto la misma cantidad, ¿cuántos huevos serían por día?',
    falta: (m, et) => `Si cada día hubieran puesto lo mismo, serían ${m} huevos por día. ¿Cuántos huevos pusieron el ${minus(et)}?`,
    soles: false,
    cada: 'día',
  },
]

const mediaDatos = tipo(
  'da-media-datos',
  'La media en la tabla',
  'Hallan la media de los datos de una tabla (cuánto sería cada día si fuera lo mismo) o el dato que falta conociendo la media.',
  CITA.media,
  ({ azar, nivel = 2 }) => {
    const ctx = elegir(azar, MEDIAS)
    // Más fácil: 3 datos de hasta 10. Más difícil: 5 datos más grandes (hasta 35).
    const n = nivel === 1 ? 3 : nivel === 3 ? 5 : entero(azar, 4, 5)
    const [lo, hi] = nivel === 1 ? [ctx.rango[0], Math.min(ctx.rango[1], 10)] : nivel === 3 ? [ctx.rango[0] + 5, ctx.rango[1] + 15] : ctx.rango
    const xs = conMediaEntera(azar, n, lo, hi)
    if (!xs) return null
    const m = suma(xs) / n
    const ets = ctx.etiquetas.slice(0, n)
    const fmt = (v: number) => (ctx.soles ? soles(v) : num(v))
    const q = nombre(azar)
    const conSoles = (r: Alt | null) => (r && ctx.soles ? { ...r, alternativas: r.alternativas.map((a) => `S/ ${a}`) } : r)
    const plural = ctx.cada === 'día' ? 'días' : 'semanas'
    const modo = azar()
    if (modo < 0.6) {
      const t = tabla([[ctx.etiquetas === DIAS ? 'Día' : 'Semana', ...ets], [ctx.fila, ...xs.map(fmt)]], [anchoCol([ctx.fila, 'Semana'], 96), ...ets.map((e) => anchoCol([e], 74))], { alto: 36 })
      const r = conSoles(opcionesNum(azar, m, [suma(xs), suma(xs) % (n - 1) === 0 ? suma(xs) / (n - 1) : m + 2, Math.max(...xs), Math.min(...xs), m + 1, m - 1], 1))
      if (!r) return null
      return {
        forma: 'opciones',
        clave: `media:${ctx.titulo}:${xs.join('-')}`,
        enunciado: ctx.intro(q),
        dibujo: lamina(ctx.titulo, [t], `Tabla: ${ets.map((e, i) => `${e} ${fmt(xs[i])}`).join(', ')}`),
        pregunta: `¿Cuál es la media? Es decir: ${ctx.pregunta.charAt(0).toLowerCase()}${ctx.pregunta.slice(1)}`,
        ...r,
        nota: `${xs.map(num).join(' + ')} = ${num(suma(xs))}; ${num(suma(xs))} ÷ ${n} = ${num(m)}`,
        pasos: [`Se suman los datos de la tabla: ${sumados(xs)} = ${num(suma(xs))}`, `Se reparte igual en ${num(n)} ${plural}: ${num(suma(xs))} ÷ ${num(n)} = ${fmt(m)}`],
      }
    }
    const i = intentar(() => {
      const j = entero(azar, 0, n - 1)
      return xs[j] !== m ? j : null
    })
    if (i === null) return null
    const otras = suma(xs) - xs[i]
    const t = tabla([[ctx.etiquetas === DIAS ? 'Día' : 'Semana', ...ets], [ctx.fila, ...xs.map((x, k) => (k === i ? CASILLA : fmt(x)))]], [anchoCol([ctx.fila, 'Semana'], 96), ...ets.map((e) => anchoCol([e], 74))], { alto: 36 })
    const r = conSoles(opcionesNum(azar, xs[i], [m, n * m, xs[i] + 1, xs[i] - 1, otras], 1))
    if (!r) return null
    return {
      forma: 'opciones',
      clave: `media-falta:${ctx.titulo}:${xs.join('-')}:${i}`,
      enunciado: ctx.intro(q),
      dibujo: lamina(ctx.titulo, [t], `Tabla: ${ets.map((e, k) => `${e} ${k === i ? '?' : fmt(xs[k])}`).join(', ')}`),
      pregunta: ctx.falta(m, ets[i]),
      ...r,
      nota: `${n} × ${num(m)} = ${num(n * m)}; ${num(n * m)} − ${num(otras)} = ${num(xs[i])}`,
      pasos: [
        `${ctx.cada === 'día' ? 'Los otros días' : 'Las otras semanas'}: ${sumados(xs.filter((_, k) => k !== i))} = ${num(otras)}`,
        `Si fuera lo mismo cada ${ctx.cada}: ${num(n)} × ${num(m)} = ${num(n * m)}`,
        `${ets[i]}: ${num(n * m)} − ${num(otras)} = ${fmt(xs[i])}`,
      ],
    }
  },
)

// ---------- Más probable y menos probable ----------

type Bolita = 'negra' | 'blanca' | 'rayada'
const BOLITAS: Bolita[] = ['negra', 'blanca', 'rayada']

function bolita(t: Bolita, cx: number, cy: number, r = 12): string {
  if (t === 'negra') return circulo(cx, cy, r, { relleno: '#3b3b3b', grosor: 1.6 })
  const base = circulo(cx, cy, r, { relleno: '#ffffff', grosor: 1.6 })
  if (t === 'blanca') return base
  return (
    base +
    [-0.5, 0, 0.5]
      .map((k) => {
        const dy = k * r
        const h = Math.sqrt(r * r - dy * dy) - 1.5
        return linea(cx - h, cy + dy, cx + h, cy + dy, { grosor: 1.6 })
      })
      .join('')
  )
}

/** Posiciones de las bolitas dentro de la bolsa (de abajo hacia arriba, filas alternadas). */
const PUESTOS: [number, number][] = [186, 160, 134, 108, 82].flatMap((y, fila) => (fila % 2 === 0 ? [40, 70, 100, 130, 160] : [55, 85, 115, 145]).map((x) => [x, y] as [number, number]))

/** Una bolsa de tela amarrada, de 200 × 214, con las bolitas a la vista. */
function bolsa(azar: Azar, cuantas: Record<Bolita, number>, x: number, y: number, escala = 1, rotulo = '') {
  const bols = barajar(
    azar,
    BOLITAS.flatMap((t) => Array(cuantas[t]).fill(t) as Bolita[]),
  )
  const partes = [
    ruta('M40,50 C12,100 10,178 30,202 Q100,214 170,202 C190,178 188,100 160,50 Z', { relleno: '#f3ead6', grosor: 2 }),
    ruta('M40,50 Q66,44 84,24 L116,24 Q134,44 160,50', { relleno: '#f3ead6', grosor: 2 }),
    rect(80, 30, 40, 9, { relleno: '#bdbdbd', grosor: 1.6, redondeo: 3 }),
    ...bols.map((t, i) => bolita(t, PUESTOS[i][0], PUESTOS[i][1])),
  ]
  if (rotulo) partes.push(texto(100, 232, rotulo, { tam: 16 / escala, peso: 700 }))
  return grupo(partes.join(''), x, y, escala)
}

function leyendaBolitas(x: number, y: number, vertical = true) {
  return BOLITAS.map((t, i) => {
    const px = vertical ? x : x + i * 120
    const py = vertical ? y + i * 36 : y
    return bolita(t, px + 13, py, 12) + texto(px + 34, py, t, { tam: 15, ancla: 'start' })
  }).join('')
}

const describirBolsa = (c: Record<Bolita, number>) => BOLITAS.filter((t) => c[t] > 0).map((t) => `${c[t]} ${t}${c[t] === 1 ? '' : 's'}`).join(', ')
/** "3 negras, 5 blancas y 2 rayadas", para los pasos. */
const enBolsa = (c: Record<Bolita, number>) => yLista(BOLITAS.filter((t) => c[t] > 0).map((t) => `${num(c[t])} ${t}${c[t] === 1 ? '' : 's'}`))

const probableBolsa = tipo(
  'da-bolsa',
  'Saca una bolita',
  'Dicen qué es más probable, menos probable o seguro al sacar sin mirar una bolita de una bolsa.',
  CITA.nociones,
  ({ azar, nivel = 2 }) => {
    // Más fácil: la que hay que elegir le saca 3 bolitas o más a la siguiente. Más difícil: más bolitas y solo una de
    // diferencia; y en las tres bolsas, a veces la menos probable.
    const quien = nombre(azar)
    const modo = azar()
    if (modo < 0.55) {
      let c: number[] | null
      let mas: boolean
      if (nivel === 2) {
        c = intentar(() => {
          const v = [entero(azar, 1, 8), entero(azar, 1, 8), entero(azar, 1, 8)]
          return new Set(v).size === 3 && suma(v) <= 16 && suma(v) >= 8 ? v : null
        })
        if (!c) return null
        mas = azar() < 0.55
      } else {
        const m = azar() < 0.55
        mas = m
        const [hi, lo, top] = nivel === 1 ? [8, 6, 14] : [10, 13, 20]
        c = intentar(() => {
          const v = [entero(azar, 1, hi), entero(azar, 1, hi), entero(azar, 1, hi)]
          if (new Set(v).size !== 3 || suma(v) < lo || suma(v) > top) return null
          const o = [...v].sort((a, b) => (m ? b - a : a - b))
          const d = Math.abs(o[0] - o[1])
          return (nivel === 1 ? d >= 3 : d === 1) ? v : null
        })
        if (!c) return null
      }
      const cuantas = { negra: c[0], blanca: c[1], rayada: c[2] }
      const i = unico(c, mas)
      const nombresT = ['Negra', 'Blanca', 'Rayada']
      const r = ordenar(alternativas(azar, nombresT[i], [...nombresT.filter((_, j) => j !== i), 'Las tres tienen la misma posibilidad'], 4), [...nombresT, 'Las tres tienen la misma posibilidad'])
      if (!r) return null
      return {
        forma: 'opciones',
        clave: `bolsa:${c.join('-')}:${mas}`,
        enunciado: `${quien} va a sacar una bolita de la bolsa sin mirar.`,
        dibujo: svg(380, 222, bolsa(azar, cuantas, 2, 2) + leyendaBolitas(230, 76), `Bolsa con ${describirBolsa(cuantas)}`),
        pregunta: `¿De qué tipo es ${mas ? 'más' : 'menos'} probable que salga la bolita?`,
        ...r,
        pasos: [`En la bolsa hay ${enBolsa(cuantas)}`, `${nombresT[i]}: es el tipo con ${mas ? 'más' : 'menos'} bolitas (${num(c[i])})`],
      }
    }
    if (modo < 0.75) {
      // ¿Qué afirmación es correcta? Con negras y blancas (y a veces rayadas).
      const c = intentar(() => {
        // Más fácil: solo negras y blancas, con 3 negras más o más. Más difícil: una sola negra más que blancas, y rayadas.
        if (nivel === 1) {
          const n = entero(azar, 4, 9)
          const b = entero(azar, 1, n - 3)
          return n + b <= 14 ? [n, b, 0] : null
        }
        if (nivel === 3) {
          const b = entero(azar, 3, 8)
          const ra = entero(azar, 1, b - 1)
          return b + 1 + b + ra <= 20 ? [b + 1, b, ra] : null
        }
        const n = entero(azar, 3, 9)
        const b = entero(azar, 1, n - 1)
        const ra = azar() < 0.5 ? 0 : entero(azar, 1, b)
        return ra !== b && n + b + ra <= 16 ? [n, b, ra] : null
      })
      if (!c) return null
      const [n, b, ra] = c
      const cuantas = { negra: n, blanca: b, rayada: ra }
      const bien = elegir(azar, ['Es más probable sacar una bolita negra que una blanca.', 'Es menos probable sacar una bolita blanca que una negra.'])
      const malas = ['Es seguro que saldrá una bolita negra.', 'Es más probable sacar una bolita blanca que una negra.', ra > 0 ? 'Es más probable sacar una bolita rayada que una blanca.' : 'Es seguro que saldrá una bolita blanca.', 'Es menos probable sacar una bolita negra que una blanca.']
      // Con una sola de diferencia, la trampa es creer que da igual.
      if (nivel === 3) malas.unshift('Es igual de probable sacar una bolita negra que una blanca.')
      const r = alternativas(azar, bien, malas, 4)
      if (!r) return null
      return {
        forma: 'opciones',
        clave: `bolsa-afirma:${c.join('-')}`,
        enunciado: `${quien} va a sacar una bolita de la bolsa sin mirar.`,
        dibujo: svg(380, 222, bolsa(azar, cuantas, 2, 2) + leyendaBolitas(230, 76), `Bolsa con ${describirBolsa(cuantas)}`),
        pregunta: '¿Qué afirmación es correcta?',
        ...r,
        pasos: [`En la bolsa hay ${enBolsa(cuantas)}`, `Hay más negras (${num(n)}) que blancas (${num(b)})`, bien],
      }
    }
    // Tres bolsas con la misma cantidad de bolitas: ¿de cuál es más probable (o seguro) sacar una negra? Más fácil:
    // menos bolitas y la que gana le saca 2 o más a las otras. Más difícil: hasta 12 bolitas, a una de diferencia y a
    // veces de cuál es menos probable.
    const total = nivel === 1 ? entero(azar, 6, 8) : nivel === 3 ? entero(azar, 10, 12) : entero(azar, 6, 10)
    const seguro = nivel === 3 ? false : azar() < (nivel === 1 ? 0.5 : 0.4)
    const menos = nivel === 3 && azar() < 0.5
    const negras = intentar(() => {
      const v = seguro ? [total, total - entero(azar, 1, 2), entero(azar, 1, total - 3)] : distintos(azar, 3, 1, total - 1)
      if (new Set(v).size !== 3) return null
      const o = [...v].sort((a, b) => (menos ? a - b : b - a))
      if (nivel === 1 && !seguro && o[0] - o[1] < 2) return null
      if (nivel === 3 && Math.abs(o[0] - o[1]) !== 1) return null
      return barajar(azar, v)
    })
    if (!negras) return null
    const i = negras.indexOf(menos ? Math.min(...negras) : Math.max(...negras))
    const rot = ['Bolsa A', 'Bolsa B', 'Bolsa C']
    const leyenda = BOLITAS.slice(0, 2)
      .map((t, k) => bolita(t, 150 + k * 140 + 13, 222, 12) + texto(150 + k * 140 + 34, 222, t, { tam: 15, ancla: 'start' }))
      .join('')
    const dib = svg(
      540,
      240,
      negras.map((ng, k) => bolsa(azar, { negra: ng, blanca: total - ng, rayada: 0 }, 6 + k * 176, 2, 0.8, rot[k])).join('') + leyenda,
      `Tres bolsas de ${total} bolitas: ${negras.map((ng, k) => `${rot[k]} con ${ng} negras`).join(', ')}`,
    )
    const r = ordenar(alternativas(azar, rot[i], [...rot.filter((_, k) => k !== i), 'En las tres es igual de probable'], 4), [...rot, 'En las tres es igual de probable'])
    if (!r) return null
    return {
      forma: 'opciones',
      clave: `bolsas:${negras.join('-')}:${total}:${seguro}${menos ? ':menos' : ''}`,
      enunciado: `Cada bolsa tiene ${total} bolitas. ${quien} va a sacar una bolita sin mirar.`,
      dibujo: dib,
      pregunta: seguro ? '¿De qué bolsa es seguro que saldrá una bolita negra?' : `¿De qué bolsa es ${menos ? 'menos' : 'más'} probable sacar una bolita negra?`,
      ...r,
      pasos: [
        `Negras: ${conValores(rot, negras)}, de ${num(total)} bolitas cada una`,
        seguro ? `En la ${rot[i]} las ${num(total)} bolitas son negras: es seguro` : `La ${rot[i]} tiene ${menos ? 'menos' : 'más'} negras (${num(negras[i])} de ${num(total)}): es ${menos ? 'menos' : 'más'} probable`,
      ],
    }
  },
)

const PREMIOS = ['Globo', 'Lápiz', 'Dulce', 'Yoyo', 'Pelota', 'Trompo']
/** Un relleno por premio (el cuarto, solo en la ruleta de cuatro premios del nivel más difícil). */
const RELLENO_PREMIO = ['#ffffff', '#e2e2e2', '#bdbdbd', '#949494']

/** Ruleta de la kermés: sectores iguales con su premio escrito y una flecha en el centro. */
function ruleta(sectores: string[], premios: string[], cx: number, cy: number, R: number) {
  const n = sectores.length
  const p: string[] = []
  sectores.forEach((s, i) => {
    const a0 = -Math.PI / 2 - Math.PI / n + (i * 2 * Math.PI) / n
    const a1 = a0 + (2 * Math.PI) / n
    const am = (a0 + a1) / 2
    p.push(
      ruta(`M${f(cx)},${f(cy)} L${f(cx + R * Math.cos(a0))},${f(cy + R * Math.sin(a0))} A${R},${R} 0 0 1 ${f(cx + R * Math.cos(a1))},${f(cy + R * Math.sin(a1))} Z`, {
        relleno: RELLENO_PREMIO[premios.indexOf(s) % RELLENO_PREMIO.length],
        grosor: 1.6,
      }),
    )
    p.push(texto(cx + R * 0.64 * Math.cos(am), cy + R * 0.64 * Math.sin(am), s, { tam: 14, peso: 700 }))
  })
  p.push(circulo(cx, cy, R, { grosor: 2.4 }))
  // Flecha
  const ang = -Math.PI / 2 + 0.35
  const L = R * 0.36
  const px = cx + L * Math.cos(ang)
  const py = cy + L * Math.sin(ang)
  p.push(linea(cx, cy, px, py, { grosor: 3 }))
  const ux = Math.cos(ang)
  const uy = Math.sin(ang)
  p.push(poligono([[px + ux * 10, py + uy * 10], [px - uy * 6, py + ux * 6], [px + uy * 6, py - ux * 6]], { relleno: TINTA, grosor: 1.4 }))
  p.push(circulo(cx, cy, 6, { relleno: TINTA, grosor: 1.4 }))
  return p.join('')
}

/** Reparte los premios en los sectores, sin dejar juntos dos sectores iguales cuando se puede. */
function sectoresDe(azar: Azar, premios: string[], cuantos: number[]) {
  return (
    intentar(() => {
      const s = barajar(
        azar,
        premios.flatMap((p, i) => Array(cuantos[i]).fill(p) as string[]),
      )
      const juntos = s.filter((x, i) => x === s[(i + 1) % s.length]).length
      return juntos <= 1 ? s : null
    }, 40) ??
    barajar(
      azar,
      premios.flatMap((p, i) => Array(cuantos[i]).fill(p) as string[]),
    )
  )
}

const probableRuleta = tipo(
  'da-ruleta',
  'La ruleta de la kermés',
  'Predicen en qué premio es más probable (o menos probable) que pare la ruleta, o con qué ruleta es más probable ganar.',
  CITA.predice,
  ({ azar, nivel = 2 }) => {
    // Más fácil: el premio que se pregunta le saca 2 partes o más al siguiente, y dos ruletas bien distintas. Más
    // difícil: 4 premios en 8 partes, a una parte de diferencia, y dos ruletas a una parte (o iguales).
    const premios = barajar(azar, PREMIOS).slice(0, nivel === 3 ? 4 : 3)
    const n = nivel === 3 ? 8 : elegir(azar, [6, 8])
    const modo = azar()
    if (modo < 0.65) {
      // Los premios ocupan, de mayor a menor, estas partes de la ruleta (premios[0] el que más).
      const partes: Record<Nivel, Record<number, number[][]>> = {
        1: { 8: [[5, 2, 1], [6, 1, 1], [4, 3, 1]], 6: [[4, 1, 1]] },
        2: { 8: [[4, 3, 1], [5, 2, 1], [4, 2, 2], [3, 3, 2], [5, 2, 1]], 6: [[3, 2, 1], [4, 1, 1], [3, 2, 1], [2, 2, 2]] },
        3: { 8: [[3, 2, 2, 1], [3, 2, 2, 1], [3, 2, 2, 1], [4, 2, 1, 1], [2, 2, 2, 2]] },
      }
      const cs = elegir(azar, partes[nivel][n])
      const ult = cs.length - 1
      const brecha = nivel === 1 ? 2 : 1
      const igual = 'Todos tienen la misma posibilidad'
      const preguntas: ('mas' | 'menos' | 'igual')[] = []
      if (cs[0] - cs[1] >= brecha) preguntas.push('mas')
      if (cs[ult - 1] - cs[ult] >= brecha) preguntas.push('menos')
      if (!preguntas.length) preguntas.push('igual')
      const q = elegir(azar, preguntas)
      const bien = q === 'mas' ? premios[0] : q === 'menos' ? premios[ult] : igual
      const s = sectoresDe(azar, premios, cs)
      // premios[0] es el que más ocupa: en los otros niveles, los premios de las alternativas van en otro orden para
      // que la respuesta no caiga siempre en la a).
      const r = ordenar(
        alternativas(
          azar,
          bien,
          [...premios, igual].filter((x) => x !== bien),
          4,
        ),
        [...(nivel === 2 ? premios : barajar(azar, premios)), igual],
      )
      if (!r) return null
      return {
        forma: 'opciones',
        clave: `ruleta:${s.join(',')}:${q}`,
        enunciado: 'En la kermés del colegio, cada estudiante gira la ruleta y gana el premio donde para la flecha.',
        dibujo: svg(264, 264, ruleta(s, premios, 132, 132, 126), `Ruleta de ${n} partes iguales: ${premios.map((p, i) => `${cs[i]} de ${p}`).join(', ')}`),
        pregunta: `¿En qué premio es ${q === 'menos' ? 'menos' : 'más'} probable que pare la flecha?`,
        ...r,
        nota: q === 'igual' ? `Cada premio ocupa ${cs[0]} de las ${n} partes.` : `${bien} ocupa ${cs[q === 'mas' ? 0 : ult]} de las ${n} partes.`,
        pasos: [
          `Partes de la ruleta: ${conValores(premios, cs)}, de ${num(n)}`,
          q === 'igual' ? `${igual}: cada premio ocupa ${num(cs[0])} partes` : `${bien}: ocupa ${q === 'mas' ? 'más' : 'menos'} partes (${num(cs[q === 'mas' ? 0 : ult])} de ${num(n)})`,
        ],
      }
    }
    // Dos ruletas con el mismo número de partes: ¿con cuál es más probable ganar una pelota?
    const premio = 'Pelota'
    const otros = barajar(
      azar,
      PREMIOS.filter((p) => p !== premio),
    ).slice(0, 2)
    const lista = [premio, ...otros]
    const igualdad = nivel === 1 ? false : azar() < (nivel === 3 ? 0.35 : 0.25)
    const a = entero(azar, 1, n - 3)
    const b = igualdad
      ? a
      : intentar(() => {
          const x = entero(azar, 1, n - 2)
          return x !== a && (nivel !== 1 || Math.abs(x - a) >= 2) && (nivel !== 3 || Math.abs(x - a) === 1) ? x : null
        })
    if (b === null) return null
    const reparte = (k: number) => {
      const resto = n - k
      const o1 = entero(azar, 1, resto - 1)
      return sectoresDe(azar, lista, [k, o1, resto - o1])
    }
    const sa = reparte(a)
    const sb = reparte(b)
    const R = 116
    const dib = svg(
      500,
      264,
      texto(124, 14, 'Ruleta A', { tam: 16, peso: 700 }) + texto(376, 14, 'Ruleta B', { tam: 16, peso: 700 }) + ruleta(sa, lista, 124, 145, R) + ruleta(sb, lista, 376, 145, R),
      `Dos ruletas de ${n} partes: la A con ${a} de Pelota y la B con ${b} de Pelota`,
    )
    const ops = ['Con la ruleta A', 'Con la ruleta B', 'Con las dos es igual de probable']
    const bien = a === b ? ops[2] : a > b ? ops[0] : ops[1]
    const r = ordenar(
      alternativas(
        azar,
        bien,
        ops.filter((o) => o !== bien),
        3,
      ),
      ops,
    )
    if (!r) return null
    return {
      forma: 'opciones',
      clave: `ruletas:${sa.join(',')}|${sb.join(',')}`,
      enunciado: 'En la kermés hay dos ruletas. Las dos tienen partes iguales.',
      dibujo: dib,
      pregunta: '¿Con qué ruleta es más probable ganar una pelota?',
      ...r,
      nota: `Pelota: ${a} de ${n} partes en la A y ${b} de ${n} en la B.`,
      pasos: [
        `Partes de pelota: ${num(a)} de ${num(n)} en la A y ${num(b)} de ${num(n)} en la B`,
        a === b ? `${bien}: las dos tienen ${num(a)} ${a === 1 ? 'parte' : 'partes'} de pelota` : `${bien}: tiene más partes de pelota (${num(Math.max(a, b))})`,
      ],
    }
  },
)

// ---------- Posibles resultados (combinaciones) ----------

type CtxCombo = {
  /** "polos", "entradas" */
  a: string
  b: string
  /** Cómo se lee cada opción en el dibujo y en las frases. */
  as: string[]
  bs: string[]
  /** "polo rojo con short negro" */
  combo: (x: string, y: string) => string
  intro: (quien: string, n: number, m: number) => string
  pregunta: string
  ropa: boolean
  cabA: string
  cabB: string
  /** Para el diagrama: "Polo rojo". */
  etA: (x: string) => string
  etB: (y: string) => string
  /** "el short azul", "la palta" */
  conB: (y: string) => string
  /** "el polo rojo", "los tequeños" */
  conA: (x: string) => string
  /** "un polo", "una entrada" */
  unoA: string
  unoB: string
}

const COLORES: Record<string, string> = { rojo: '#f3c4bf', azul: '#c7d6ee', verde: '#cbe5c8', amarillo: '#f6eab0', blanco: '#ffffff', negro: '#8a8a8a', gris: '#d6d6d6', marrón: '#dcc3a5' }

const COMBOS: CtxCombo[] = [
  {
    a: 'polos',
    b: 'shorts',
    as: ['rojo', 'azul', 'verde', 'amarillo', 'blanco'],
    bs: ['negro', 'azul', 'gris', 'marrón'],
    combo: (x, y) => `polo ${x} con short ${y}`,
    intro: (q, n, m) => `Para el paseo, ${q} lleva ${n} polos y ${m} shorts.`,
    pregunta: '¿Cuántas combinaciones diferentes de polo y short puede hacer?',
    ropa: true,
    cabA: 'Polo',
    cabB: 'Short',
    etA: (x) => `Polo ${x}`,
    etB: (y) => `Short ${y}`,
    conB: (y) => `el short ${y}`,
    conA: (x) => `el polo ${x}`,
    unoA: 'un polo',
    unoB: 'un short',
  },
  {
    a: 'entradas',
    b: 'segundos',
    as: ['Causa', 'Ocopa', 'Tequeños', 'Ensalada'],
    bs: ['Lomo saltado', 'Ají de gallina', 'Arroz con pollo', 'Seco de res'],
    combo: (x, y) => `${x} y ${minus(y)}`,
    intro: (_q, n, m) => `En el menú del mercado se elige una entrada y un segundo. Hoy hay ${n} entradas y ${m} segundos.`,
    pregunta: '¿Cuántos menús diferentes se pueden pedir?',
    ropa: false,
    cabA: 'Entrada',
    cabB: 'Segundo',
    etA: (x) => x,
    etB: (y) => y,
    conB: (y) => `el ${minus(y)}`,
    conA: (x) => `${x === 'Tequeños' ? 'los' : 'la'} ${minus(x)}`,
    unoA: 'una entrada',
    unoB: 'un segundo',
  },
  {
    a: 'panes',
    b: 'rellenos',
    as: ['Pan francés', 'Pan de yema', 'Pan integral'],
    bs: ['Pollo', 'Chicharrón', 'Palta', 'Queso'],
    combo: (x, y) => `${x} con ${minus(y)}`,
    intro: (_q, n, m) => `En el quiosco del colegio venden sánguches: se elige un pan y un relleno. Hay ${n} panes y ${m} rellenos.`,
    pregunta: '¿Cuántos sánguches diferentes se pueden pedir?',
    ropa: false,
    cabA: 'Pan',
    cabB: 'Relleno',
    etA: (x) => x,
    etB: (y) => y,
    conB: (y) => `${y === 'Palta' ? 'la' : 'el'} ${minus(y)}`,
    conA: (x) => `el ${minus(x)}`,
    unoA: 'un pan',
    unoB: 'un relleno',
  },
]

function polo(color: string, x: number, y: number) {
  const d = `M${x + 22},${y} L${x + 54},${y} L${x + 76},${y + 16} L${x + 66},${y + 30} L${x + 58},${y + 24} L${x + 58},${y + 66} L${x + 18},${y + 66} L${x + 18},${y + 24} L${x + 10},${y + 30} L${x},${y + 16} Z`
  return ruta(d, { relleno: COLORES[color], grosor: 1.8 }) + ruta(`M${x + 28},${y} Q${x + 38},${y + 12} ${x + 48},${y}`, { grosor: 1.6 }) + texto(x + 38, y + 84, color, { tam: 15 })
}

function short(color: string, x: number, y: number) {
  const d = `M${x + 6},${y + 6} L${x + 70},${y + 6} L${x + 74},${y + 54} L${x + 44},${y + 54} L${x + 38},${y + 26} L${x + 32},${y + 54} L${x + 2},${y + 54} Z`
  return ruta(d, { relleno: COLORES[color], grosor: 1.8 }) + linea(x + 6, y + 14, x + 70, y + 14, { grosor: 1.4 }) + texto(x + 38, y + 72, color, { tam: 15 })
}

/** Los polos en una fila y los shorts en otra, cada uno con su color escrito. */
function dibujoRopa(as: string[], bs: string[]): Pieza {
  const partes = [texto(0, 36, 'Polos', { tam: 15, peso: 700, ancla: 'start' }), texto(0, 136, 'Shorts', { tam: 15, peso: 700, ancla: 'start' })]
  as.forEach((c, i) => partes.push(polo(c, 70 + i * 92, 2)))
  bs.forEach((c, i) => partes.push(short(c, 70 + i * 92, 108)))
  return { cuerpo: partes.join(''), ancho: 70 + Math.max(as.length, bs.length) * 92, alto: 186 }
}

/** Pizarra con dos listas (entradas y segundos, panes y rellenos). */
function pizarra(titulo: string, cabA: string, as: string[], cabB: string, bs: string[]): Pieza {
  const colW = Math.max(150, ...[...as, ...bs].map((t) => anchoTexto(t, 15) + 40))
  const W = 2 * colW + 40
  const H = 76 + Math.max(as.length, bs.length) * 28 + 12
  const partes = [rect(2, 2, W - 4, H - 4, { relleno: '#ffffff', grosor: 2.4, redondeo: 8 }), rect(8, 8, W - 16, H - 16, { grosor: 1.2, redondeo: 5 }), texto(W / 2, 30, titulo, { tam: 17, peso: 700 })]
  ;[
    [cabA, as],
    [cabB, bs],
  ].forEach(([cab, items], k) => {
    const x = 24 + k * (colW + 8)
    partes.push(texto(x, 60, cab as string, { tam: 15, peso: 700, ancla: 'start' }))
    ;(items as string[]).forEach((t, i) => partes.push(circulo(x + 5, 88 + i * 28, 3, { relleno: TINTA, grosor: 1 }) + texto(x + 16, 88 + i * 28, t, { tam: 15, ancla: 'start' })))
  })
  return { cuerpo: partes.join(''), ancho: W, alto: H }
}

/** Cuántas opciones de cada lista (de cuántas a cuántas) y desde cuántas combinaciones. */
type RangoCombo = { n: [number, number]; m: [number, number]; min: number }
const COMBO_NORMAL: RangoCombo = { n: [2, 4], m: [2, 3], min: 0 }

function datosCombo(azar: Azar, maxProducto = 12, rango = COMBO_NORMAL) {
  const ctx = elegir(azar, COMBOS)
  const par = intentar(() => {
    const n = entero(azar, rango.n[0], Math.min(rango.n[1], ctx.as.length))
    const m = entero(azar, rango.m[0], Math.min(rango.m[1], ctx.bs.length))
    return n * m !== n + m && n * m <= maxProducto && n * m >= rango.min ? [n, m] : null
  })
  if (!par) return null
  const [n, m] = par
  const as = barajar(azar, ctx.as).slice(0, n)
  const bs = barajar(azar, ctx.bs).slice(0, m)
  return { ctx, n, m, as, bs }
}

function dibujoCombo(ctx: CtxCombo, as: string[], bs: string[]): Pieza {
  if (ctx.ropa) return dibujoRopa(as, bs)
  return pizarra(ctx.a === 'entradas' ? 'MENÚ DEL DÍA' : 'SÁNGUCHES', cap(ctx.a), as, cap(ctx.b), bs)
}

const combinaciones = tipo(
  'da-combinaciones',
  'Cuántas combinaciones',
  'Encuentran todas las combinaciones posibles (polos y shorts, entrada y segundo) y cuál falta en una lista.',
  CITA.resultados,
  ({ azar, nivel = 2 }) => {
    const cuantas = azar() < 0.55
    // Más fácil: 2 de una cosa y 3 de otra (6 combinaciones). Más difícil: de 3 a 5 de cada una (hasta 20
    // combinaciones; hasta 12 en la lista donde falta una).
    const d =
      nivel === 1
        ? datosCombo(azar, 6, { n: [2, 3], m: [2, 3], min: 0 })
        : nivel === 3
          ? datosCombo(azar, cuantas ? 20 : 12, { n: [3, 5], m: [3, 4], min: 9 })
          : datosCombo(azar, cuantas ? 12 : 8)
    if (!d) return null
    const { ctx, n, m, as, bs } = d
    const quien = nombre(azar)
    const pieza = dibujoCombo(ctx, as, bs)
    const alt = `${cap(ctx.a)}: ${as.join(', ')}; ${ctx.b}: ${bs.join(', ')}`
    const clave = `combo:${ctx.a}:${as.join(',')}|${bs.join(',')}`
    if (cuantas) {
      // En el más fácil, 3 alternativas.
      const r =
        nivel === 1
          ? alternativas(azar, num(n * m), distractores(n * m, [n + m, 2 * n * m, n * m + n], { min: 1 }), 3)
          : opcionesNum(azar, n * m, [n + m, n * m - 1, n * m + n, n * m + m, 2 * n * m], 1)
      if (!r) return null
      return {
        forma: 'opciones',
        clave,
        enunciado: ctx.intro(quien, n, m),
        dibujo: lamina('', [pieza], alt),
        pregunta: ctx.pregunta,
        ...r,
        nota: `${n} ${ctx.a} × ${m} ${ctx.b} = ${n * m} combinaciones.`,
        pasos: [`Hay ${num(n)} ${ctx.a} y ${num(m)} ${ctx.b}`, `Cada ${singular(ctx.unoA)} se combina con los ${num(m)} ${ctx.b}`, `${num(n)} × ${num(m)} = ${num(n * m)}`],
      }
    }
    // ¿Cuál falta? Ya se escribieron todas menos una.
    const todas = as.flatMap((x) => bs.map((y) => ctx.combo(x, y)))
    const falta = elegir(azar, todas)
    const escritas = todas.filter((c) => c !== falta)
    // Una combinación con algo que no hay: también es incorrecta.
    const sinA = ctx.as.filter((x) => !as.includes(x))
    const sinB = ctx.bs.filter((y) => !bs.includes(y))
    const fuera = sinA.length ? ctx.combo(elegir(azar, sinA), elegir(azar, bs)) : sinB.length ? ctx.combo(elegir(azar, as), elegir(azar, sinB)) : null
    const r = alternativas(azar, cap(falta), [...(fuera ? [cap(fuera)] : []), ...barajar(azar, escritas).slice(0, 3).map(cap)], nivel === 1 ? 3 : 4)
    if (!r) return null
    const colW = Math.max(...escritas.map((c) => anchoTexto(`• ${cap(c)}`, 14))) + 24
    const cols = 2 * colW <= 560 ? 2 : 1
    if (cols === 1 && escritas.length > 5) return null
    const lista: Pieza = {
      cuerpo:
        texto(0, 12, `${quien} ya escribió estas combinaciones:`, { tam: 15, peso: 700, ancla: 'start' }) +
        escritas.map((c, i) => texto((i % cols) * colW + 8, 38 + Math.floor(i / cols) * 24, `• ${cap(c)}`, { tam: 14, ancla: 'start' })).join(''),
      ancho: Math.max(cols * colW, anchoTexto(`${quien} ya escribió estas combinaciones:`, 16.5)),
      alto: 30 + Math.ceil(escritas.length / cols) * 24,
    }
    return {
      forma: 'opciones',
      clave: `${clave}:falta:${falta}`,
      enunciado: ctx.intro(quien, n, m),
      dibujo: lamina('', [pieza, lista], `${alt}; lista de ${escritas.length} combinaciones`, 14),
      pregunta: '¿Qué combinación falta en la lista?',
      ...r,
      pasos: [
        `Deben ser ${num(n)} × ${num(m)} = ${num(n * m)}; en la lista hay ${num(escritas.length)}`,
        `${cap(ctx.etA(as[Math.floor(todas.indexOf(falta) / m)]))} aparece ${veces(m - 1)}; debe aparecer ${veces(m)}`,
        `Falta: ${cap(falta)}`,
      ],
    }
  },
)

/**
 * Diagrama de árbol: cada opción de la izquierda se une con cada opción de la derecha. `vacias`: desde qué rama se deja
 * en blanco. `conRamas`: en las ramas en blanco sí se ve la opción de la derecha y solo falta la combinación.
 */
function dibujoArbol(ctx: CtxCombo, as: string[], bs: string[], vacias: number | null, totalVacio: boolean, conRamas = false): Dibujo {
  const ROW = 34
  const top = 30
  const n = as.length
  const m = bs.length
  const xA = 4
  const wA = Math.max(118, ...as.map((x) => anchoTexto(ctx.etA(x), 14.5) + 20))
  const xB = xA + wA + 44
  const wB = Math.max(118, ...bs.map((y) => anchoTexto(ctx.etB(y), 14.5) + 20))
  const xC = xB + wB + 22
  const partes = [texto(xA + wA / 2, 12, ctx.cabA, { tam: 15, peso: 700 }), texto(xB + wB / 2, 12, ctx.cabB, { tam: 15, peso: 700 }), texto(xC, 12, 'Combinación', { tam: 15, peso: 700, ancla: 'start' })]
  let anchoC = 120
  as.forEach((x, i) => {
    const y0 = top + i * m * ROW
    const cyA = y0 + (m * ROW) / 2
    const blanco = vacias !== null && i >= vacias
    partes.push(rect(xA, cyA - 14, wA, 28, { relleno: SUAVE, grosor: 1.6, redondeo: 5 }))
    partes.push(texto(xA + wA / 2, cyA, ctx.etA(x), { tam: 14 }))
    bs.forEach((y, j) => {
      const cy = y0 + j * ROW + ROW / 2
      partes.push(linea(xA + wA, cyA, xB, cy, { grosor: 1.6 }))
      if (blanco) {
        partes.push(rect(xB, cy - 13, wB, 26, { relleno: '#ffffff', grosor: 1.6, redondeo: 5 }))
        if (conRamas) partes.push(texto(xB + wB / 2, cy, ctx.etB(y), { tam: 14 }))
        partes.push(linea(xC, cy + 8, xC + 170, cy + 8, { grosor: 1.4, punteado: true }))
      } else {
        partes.push(rect(xB, cy - 13, wB, 26, { relleno: '#ffffff', grosor: 1.6, redondeo: 5 }))
        partes.push(texto(xB + wB / 2, cy, ctx.etB(y), { tam: 14 }))
        const c = cap(ctx.combo(x, y))
        anchoC = Math.max(anchoC, anchoTexto(c, 14))
        partes.push(texto(xC, cy, c, { tam: 14, ancla: 'start' }))
      }
    })
    if (i < n - 1) partes.push(linea(xA, y0 + m * ROW, xC + Math.max(anchoC, 170), y0 + m * ROW, { trazo: REJILLA, grosor: 1, punteado: true }))
  })
  const yT = top + n * m * ROW + 24
  if (totalVacio) partes.push(texto(xA, yT, 'Total de combinaciones:', { tam: 15, peso: 700, ancla: 'start' }) + casilla(xA + 196, yT - 16, 50, 32))
  const W = Math.min(600, xC + Math.max(anchoC, 170) + 6)
  return svg(W, totalVacio ? yT + 22 : top + n * m * ROW + 6, partes.join(''), `Diagrama de árbol de ${ctx.a} (${as.join(', ')}) y ${ctx.b} (${bs.join(', ')})${vacias !== null ? ', con ramas en blanco' : ''}`)
}

const arbol = tipo(
  'da-arbol',
  'Diagrama de árbol',
  'Usan un diagrama de árbol para encontrar todos los posibles resultados: lo completan o razonan con él.',
  CITA.diagrama,
  ({ azar, nivel = 2 }) => {
    // Más fácil: 6 ramas, en las que faltan solo las combinaciones, y preguntas que se leen directo en el árbol
    // (cuántas hay; cuántas salen de una rama). Más difícil: 8 o 9 ramas y un paso más (una más de cada lista; en
    // cuántas NO está algo).
    const max = nivel === 3 ? 9 : nivel === 1 ? 6 : 8
    const d = nivel === 1 ? datosCombo(azar, 6, { n: [2, 3], m: [2, 3], min: 0 }) : nivel === 3 ? datosCombo(azar, 9, { n: [2, 4], m: [2, 4], min: 8 }) : datosCombo(azar, 8)
    if (!d) return null
    const { ctx, n, m, as, bs } = d
    if (n * m > max) return null
    const quien = nombre(azar)
    const clave = `arbol:${ctx.a}:${as.join(',')}|${bs.join(',')}`
    const modo = azar()
    if (modo < 0.4) {
      return {
        forma: 'abierta',
        clave: `${clave}:completa`,
        enunciado: `${ctx.intro(quien, n, m)} Completa el diagrama de árbol y escribe cuántas combinaciones hay.`,
        dibujo: dibujoArbol(ctx, as, bs, 1, true, nivel === 1),
        respuesta: `${as.flatMap((x) => bs.map((y) => cap(ctx.combo(x, y)))).join(' · ')}. Total: ${n * m}.`,
        espacio: 'dibujo',
        pasos:
          nivel === 1
            ? [`En cada rama en blanco se escribe la combinación: ${cap(ctx.combo(as[1], bs[0]))}…`, `Total: ${num(n)} × ${num(m)} = ${num(n * m)} combinaciones`]
            : [
                `Cada ${singular(ctx.unoA)} se une con los ${num(m)} ${ctx.b}, como en la primera rama`,
                `En cada rama se escribe la combinación: ${cap(ctx.combo(as[1], bs[0]))}…`,
                `Total: ${num(n)} × ${num(m)} = ${num(n * m)} combinaciones`,
              ],
      }
    }
    if (modo < 0.75 && nivel === 1) {
      // Un paso menos: cuántas combinaciones hay, contando las ramas del árbol.
      const r = opcionesNum(azar, n * m, [n + m, n * m - 1, n * m + 1, n, m], 1)
      if (!r) return null
      return {
        forma: 'opciones',
        clave: `${clave}:cuantas`,
        enunciado: `${ctx.intro(quien, n, m)} Observa el diagrama de árbol.`,
        dibujo: dibujoArbol(ctx, as, bs, null, false),
        pregunta: '¿Cuántas combinaciones diferentes hay?',
        ...r,
        pasos: [`Se cuentan las ramas de la derecha: cada una es una combinación`, `${num(n)} × ${num(m)} = ${num(n * m)} combinaciones`],
      }
    }
    if (modo < 0.75 && nivel === 3) {
      // Un paso más: una opción más en cada lista.
      const nuevo = (n + 1) * (m + 1)
      const r = opcionesNum(azar, nuevo, [n * m + 2, (n + 1) * m, n * (m + 1), n + m + 2, n * m], 1)
      if (!r) return null
      return {
        forma: 'opciones',
        clave: `${clave}:masAB`,
        enunciado: `${ctx.intro(quien, n, m)} Observa el diagrama de árbol.`,
        dibujo: dibujoArbol(ctx, as, bs, null, false),
        pregunta: `Si ${ctx.ropa ? `${quien} tuviera` : 'hubiera'} ${ctx.unoA} más y ${ctx.unoB} más, ¿cuántas combinaciones ${ctx.ropa ? 'podría hacer' : 'habría'}?`,
        ...r,
        nota: `${n + 1} × ${m + 1} = ${nuevo}`,
        pasos: [`Ahora: ${num(n)} ${ctx.a} × ${num(m)} ${ctx.b} = ${num(n * m)} combinaciones`, `Con una más de cada uno: ${num(n + 1)} ${ctx.a} y ${num(m + 1)} ${ctx.b}`, `${num(n + 1)} × ${num(m + 1)} = ${num(nuevo)}`],
      }
    }
    if (modo < 0.75) {
      const masB = azar() < 0.5 && m < Math.min(4, ctx.bs.length)
      const nuevo = masB ? n * (m + 1) : (n + 1) * m
      const r = opcionesNum(azar, nuevo, [n * m + 1, masB ? (n + 1) * m : n * (m + 1), n * m, n + m + 1, (n + 1) * (m + 1)], 1)
      if (!r) return null
      const una = masB ? ctx.unoB : ctx.unoA
      return {
        forma: 'opciones',
        clave: `${clave}:mas${masB ? 'B' : 'A'}`,
        enunciado: `${ctx.intro(quien, n, m)} Observa el diagrama de árbol.`,
        dibujo: dibujoArbol(ctx, as, bs, null, false),
        pregunta: `Si ${ctx.ropa ? `${quien} tuviera` : 'hubiera'} ${una} más, ¿cuántas combinaciones ${ctx.ropa ? 'podría hacer' : 'habría'}?`,
        ...r,
        nota: masB ? `${n} × ${m + 1} = ${nuevo}` : `${n + 1} × ${m} = ${nuevo}`,
        pasos: [
          `Ahora: ${num(n)} ${ctx.a} × ${num(m)} ${ctx.b} = ${num(n * m)} combinaciones`,
          `Con ${una} más: ${masB ? `${num(n)} × ${num(m + 1)}` : `${num(n + 1)} × ${num(m)}`} = ${num(nuevo)}`,
        ],
      }
    }
    const y = elegir(azar, bs)
    /** "está" o "están" (los tequeños). */
    const esta = (s: string) => (/^(los|las) /.test(s) ? 'están' : 'está')
    if (nivel === 1) {
      // Más fácil: las combinaciones de una rama de la izquierda, que salen juntas en el árbol.
      const x = elegir(azar, as)
      const r = opcionesNum(azar, m, [n, n * m, n + m, 1, m + 1], 1)
      if (!r) return null
      return {
        forma: 'opciones',
        clave: `${clave}:conA:${x}`,
        enunciado: `${ctx.intro(quien, n, m)} Observa el diagrama de árbol.`,
        dibujo: dibujoArbol(ctx, as, bs, null, false),
        pregunta: `¿En cuántas combinaciones ${esta(ctx.conA(x))} ${ctx.conA(x)}?`,
        ...r,
        pasos: [`Desde ${ctx.conA(x)} salen ${num(m)} ramas, una con cada ${singular(ctx.unoB)}`, `${cap(esta(ctx.conA(x)))} en ${num(m)} combinaciones`],
      }
    }
    if (nivel === 3) {
      // Un paso más: en cuántas NO está. Con 2 de la derecha se pregunta por una de la izquierda (si no, «está» y
      // «no está» darían lo mismo).
      const sobreA = m === 2
      const cosa = sobreA ? ctx.conA(elegir(azar, as)) : ctx.conB(y)
      const enCuantas = sobreA ? m : n
      const no = n * m - enCuantas
      const r = opcionesNum(azar, no, [enCuantas, n * m, n * m - (sobreA ? n : m), n + m, no + 1, no - 1], 1)
      if (!r) return null
      return {
        forma: 'opciones',
        clave: `${clave}:sin:${cosa}`,
        enunciado: `${ctx.intro(quien, n, m)} Observa el diagrama de árbol.`,
        dibujo: dibujoArbol(ctx, as, bs, null, false),
        pregunta: `¿En cuántas combinaciones NO ${esta(cosa)} ${cosa}?`,
        ...r,
        pasos: [
          `En total: ${num(n)} × ${num(m)} = ${num(n * m)} combinaciones`,
          `${cap(cosa)} ${esta(cosa)} en ${num(enCuantas)}: una con cada ${singular(sobreA ? ctx.unoB : ctx.unoA)}`,
          `No ${esta(cosa)} en: ${num(n * m)} − ${num(enCuantas)} = ${num(no)}`,
        ],
      }
    }
    const r = opcionesNum(azar, n, [m, n * m, n + m, 1, n - 1], 1)
    if (!r) return null
    return {
      forma: 'opciones',
      clave: `${clave}:con:${y}`,
      enunciado: `${ctx.intro(quien, n, m)} Observa el diagrama de árbol.`,
      dibujo: dibujoArbol(ctx, as, bs, null, false),
      pregunta: `¿En cuántas combinaciones está ${ctx.conB(y)}?`,
      ...r,
      pasos: [`${cap(ctx.conB(y))} sale una vez con cada ${singular(ctx.unoA)}`, `Hay ${num(n)} ${ctx.a}: está en ${num(n)} combinaciones`],
    }
  },
)

// ---------- Conclusiones a partir de datos ----------

/** `por`: la cuenta que muestra si es verdad o no, para los pasos de la clave. */
type Afirmacion = { texto: string; verdad: boolean; tipo: string; por: string }

/** Afirmaciones verdaderas y falsas sobre unos votos. `paso`: 10 en gráficos con escala, 1 en tablas. */
function afirmaciones(azar: Azar, ops: Cat[], v: number[], paso: number): Afirmacion[] {
  const out: Afirmacion[] = []
  const n = ops.length
  const C = (i: number) => cap(ops[i].con)
  const o = (i: number) => ops[i].con
  const par = () => {
    const [a, b] = barajar(
      azar,
      ops.map((_, i) => i),
    ).slice(0, 2)
    return v[a] > v[b] ? [a, b] : [b, a]
  }
  const [a, b] = par()
  out.push({ texto: `${C(a)} tuvo más votos que ${o(b)}.`, verdad: true, tipo: 'mas', por: `${num(v[a])} es más que ${num(v[b])}` })
  out.push({ texto: `${C(b)} tuvo más votos que ${o(a)}.`, verdad: false, tipo: 'mas', por: `${num(v[b])} es menos que ${num(v[a])}` })
  const [c, d] = par()
  const dif = v[c] - v[d]
  out.push({ texto: `${C(c)} tuvo ${num(dif)} ${dif === 1 ? 'voto' : 'votos'} más que ${o(d)}.`, verdad: true, tipo: 'dif', por: `${num(v[c])} − ${num(v[d])} = ${num(dif)}` })
  const difMal = paso === 10 ? (dif / 10 !== dif ? dif / 10 : dif + 10) : dif + elegir(azar, [1, 2, -1])
  if (difMal > 0 && difMal !== dif) out.push({ texto: `${C(c)} tuvo ${num(difMal)} ${difMal === 1 ? 'voto' : 'votos'} más que ${o(d)}.`, verdad: false, tipo: 'dif', por: `${num(v[c])} − ${num(v[d])} = ${num(dif)}, no ${num(difMal)}` })
  const tot = suma(v)
  out.push({ texto: `En total votaron ${num(tot)} estudiantes.`, verdad: true, tipo: 'total', por: `${sumados(v)} = ${num(tot)}` })
  const totMal = tot + elegir(azar, [paso, -paso, 2 * paso])
  out.push({ texto: `En total votaron ${num(totMal)} estudiantes.`, verdad: false, tipo: 'total', por: `${sumados(v)} = ${num(tot)}, no ${num(totMal)}` })
  const iMax = unico(v)
  const iMin = unico(v, false)
  if (iMax >= 0) {
    out.push({ texto: `Lo que más eligieron fue ${o(iMax)}.`, verdad: true, tipo: 'max', por: `Lo que más eligieron: ${o(iMax)}, con ${num(v[iMax])}` })
    const otro = elegir(
      azar,
      ops.map((_, i) => i).filter((i) => i !== iMax),
    )
    out.push({ texto: `Lo que más eligieron fue ${o(otro)}.`, verdad: false, tipo: 'max', por: `Lo que más eligieron: ${o(iMax)}, con ${num(v[iMax])}` })
  }
  if (iMin >= 0) {
    out.push({ texto: `Lo que menos eligieron fue ${o(iMin)}.`, verdad: true, tipo: 'min', por: `Lo que menos eligieron: ${o(iMin)}, con ${num(v[iMin])}` })
    if (iMax >= 0) out.push({ texto: `Lo que menos eligieron fue ${o(iMax)}.`, verdad: false, tipo: 'min', por: `Lo que menos eligieron: ${o(iMin)}, con ${num(v[iMin])}` })
  }
  for (let x = 0; x < n; x++)
    for (let y = 0; y < n; y++) {
      if (x !== y && v[x] === 2 * v[y]) out.push({ texto: `${C(x)} tuvo el doble de votos que ${o(y)}.`, verdad: true, tipo: 'doble', por: `${num(v[y])} × 2 = ${num(v[x])}` })
    }
  if (!out.some((s) => s.tipo === 'doble')) {
    const [x, y] = par()
    if (v[x] !== 2 * v[y]) out.push({ texto: `${C(x)} tuvo el doble de votos que ${o(y)}.`, verdad: false, tipo: 'doble', por: `${num(v[y])} × 2 = ${num(2 * v[y])}, no ${num(v[x])}` })
  }
  return out
}

/**
 * Una afirmación de cada clase, para que no se repita la misma idea. `primero`: la primera de ese lado (la respuesta)
 * es, si se puede, de esas clases; ese lado se elige antes.
 */
function elegirAfirmaciones(azar: Azar, todas: Afirmacion[], verdaderas: number, falsas: number, primero?: { verdad: boolean; tipos: string[] }) {
  const usados = new Set<string>()
  const toma = (verdad: boolean, cuantas: number) => {
    const res: Afirmacion[] = []
    let lista = barajar(
      azar,
      todas.filter((x) => x.verdad === verdad),
    )
    if (primero && primero.verdad === verdad) lista = [...lista.filter((s) => primero.tipos.includes(s.tipo)), ...lista.filter((s) => !primero.tipos.includes(s.tipo))]
    for (const s of lista) {
      if (res.length >= cuantas) break
      if (usados.has(s.tipo)) continue
      usados.add(s.tipo)
      res.push(s)
    }
    return res.length === cuantas ? res : null
  }
  if (primero && !primero.verdad) {
    const fa = toma(false, falsas)
    const v = toma(true, verdaderas)
    return v && fa ? { v, f: fa } : null
  }
  const v = toma(true, verdaderas)
  const fa = toma(false, falsas)
  return v && fa ? { v, f: fa } : null
}

function datosVotos(azar: Azar, enBarras: boolean, cuantas = 4) {
  const t = elegir(azar, TEMAS)
  const ops = opcionesDe(azar, t, cuantas)
  const v = enBarras ? distintos(azar, ops.length, 10, 80, 10) : distintos(azar, ops.length, 3, 18)
  const sec = seccion(azar)
  const cats = ops.map((o) => o.et)
  const titulo = `${t.titulo} en ${sec}`
  const dibujo = lamina(titulo, [piezaVotos(t, cats, v, enBarras)], `${enBarras ? 'Gráfico de barras' : 'Tabla'} «${titulo}»: ${cats.map((c, i) => `${c} ${v[i]}`).join(', ')}`)
  return { t, ops, v, sec, cats, dibujo }
}

/** Los votos de una encuesta en un gráfico de barras (de 10 en 10) o en una tabla. */
function piezaVotos(t: Tema, cats: string[], v: number[], enBarras: boolean): Pieza {
  if (enBarras) return barras({ eje: 'Votos', cats, valores: v, max: 80, cada: 10, slot: Math.max(80, ...cats.map((c) => anchoTexto(c, 14) + 12)) })
  return tabla([[t.columna, 'Votos'], ...cats.map((c, i) => [c, v[i]] as Celda[])], [anchoCol([t.columna, ...cats], 90), 90])
}

const conclusion = tipo(
  'da-conclusion',
  '¿Qué conclusión es correcta?',
  'Analizan una tabla o un gráfico de barras de una votación y eligen la conclusión correcta (o la que no lo es).',
  CITA.conclusiones,
  ({ azar, nivel = 2 }) => {
    const enBarras = azar() < 0.6
    // Más fácil: 3 opciones, 3 alternativas y solo comparar (más que, lo que más y lo que menos eligieron). Más
    // difícil: 5 opciones en la tabla, más veces «NO es correcta» y la respuesta pide una cuenta (diferencia, total o
    // doble).
    const { t, ops, v, sec, cats, dibujo } = datosVotos(azar, enBarras, nivel === 1 ? 3 : nivel === 3 && !enBarras ? 5 : 4)
    const conCuentas = afirmaciones(azar, ops, v, enBarras ? 10 : 1)
    const todas = nivel === 1 ? conCuentas.filter((s) => ['mas', 'max', 'min'].includes(s.tipo)) : conCuentas
    const noEs = nivel === 1 ? false : azar() < (nivel === 3 ? 0.5 : 0.35)
    const sel = elegirAfirmaciones(azar, todas, noEs ? 3 : 1, nivel === 1 ? 2 : noEs ? 1 : 3, nivel === 3 ? { verdad: !noEs, tipos: ['dif', 'total', 'doble'] } : undefined)
    if (!sel) return null
    const bien = noEs ? sel.f[0] : sel.v[0]
    const malas = noEs ? sel.v : sel.f
    const r = alternativas(
      azar,
      bien.texto,
      malas.map((s) => s.texto),
      4,
    )
    if (!r) return null
    return {
      forma: 'opciones',
      clave: `conclusion:${t.columna}:${v.join('-')}:${noEs}:${bien.texto}`,
      enunciado: `En ${sec} votaron: «${t.pregunta}». ${enBarras ? 'Observa el gráfico.' : 'Observa la tabla.'}`,
      dibujo,
      pregunta: noEs ? '¿Qué conclusión NO es correcta?' : '¿Qué conclusión es correcta?',
      ...r,
      pasos: [`Votos: ${conValores(cats, v)}`, bien.por, `${noEs ? 'No es correcta' : 'Es correcta'}: ${bien.texto}`],
    }
  },
)

/** `dos`: la misma decisión para las dos secciones de 4.º (nivel más difícil). */
type CtxDecision = { temas: string[]; intro: string; dos: string; pregunta: string; mas: boolean; cosa: string }
const DECISIONES: CtxDecision[] = [
  {
    temas: ['Comida'],
    intro: 'Para el almuerzo del Día del Logro, el comité de aula preparará la comida que más les guste a los estudiantes.',
    dos: 'Para el almuerzo del Día del Logro, 4.º A y 4.º B prepararán juntos la comida que más les guste.',
    pregunta: '¿Qué comida deben preparar?',
    mas: true,
    cosa: 'comida',
  },
  {
    temas: ['Bebida'],
    intro: 'Para la fiesta del aula, comprarán la bebida que más les guste a todos.',
    dos: 'Para la fiesta de 4.º grado, comprarán la bebida que más les guste a las dos secciones.',
    pregunta: '¿Qué bebida deben comprar?',
    mas: true,
    cosa: 'bebida',
  },
  { temas: ['Lugar'], intro: 'El aula irá de paseo al lugar que tenga más votos.', dos: '4.º A y 4.º B irán juntos de paseo al lugar que tenga más votos.', pregunta: '¿A qué lugar deben ir?', mas: true, cosa: 'lugar' },
  {
    temas: ['Fruta'],
    intro: 'El quiosco del colegio dejará de vender la fruta que menos les guste a los estudiantes.',
    dos: 'El quiosco del colegio dejará de vender la fruta que menos les guste a los estudiantes de 4.º grado.',
    pregunta: '¿Qué fruta debe dejar de vender?',
    mas: false,
    cosa: 'fruta',
  },
  {
    temas: ['Deporte'],
    intro: 'El campeonato del colegio será del deporte que más les guste a los estudiantes.',
    dos: 'El campeonato de 4.º grado será del deporte que más les guste a las dos secciones.',
    pregunta: '¿De qué deporte debe ser el campeonato?',
    mas: true,
    cosa: 'deporte',
  },
]

/**
 * El nivel más difícil de «Decide con los datos»: los votos de 4.º A y 4.º B por separado. Hay que sumar las dos
 * secciones antes de decidir, y en una de ellas gana otra opción (la trampa).
 */
function decisionDosSecciones(azar: Azar, dc: CtxDecision, t: Tema): Generado | null {
  const ops = opcionesDe(azar, t, 4)
  const cats = ops.map((o) => o.et)
  const d = intentar(() => {
    const a = ops.map(() => entero(azar, 2, 15))
    const b = ops.map(() => entero(azar, 2, 15))
    const tot = a.map((x, i) => x + b[i])
    const iBien = unico(tot, dc.mas)
    const iOtro = unico(tot, !dc.mas)
    if (iBien < 0 || iOtro < 0) return null
    const trampas = [
      { i: unico(a, dc.mas), sec: '4.º A' },
      { i: unico(b, dc.mas), sec: '4.º B' },
    ].filter((x) => x.i >= 0 && x.i !== iBien)
    return trampas.length ? { a, b, tot, iBien, iOtro, trampa: trampas[0] } : null
  })
  if (!d) return null
  const { a, b, tot, iBien, iOtro, trampa } = d
  const dibujo = lamina(
    t.titulo,
    [tabla([[t.columna, '4.º A', '4.º B'], ...cats.map((c, i) => [c, a[i], b[i]] as Celda[])], [anchoCol([t.columna, ...cats], 90), 80, 80])],
    `Tabla de votos de 4.º A y 4.º B: ${cats.map((c, i) => `${c} ${a[i]} y ${b[i]}`).join(', ')}`,
  )
  const enunciado = `${dc.dos} Estos son los resultados de la encuesta en las dos secciones.`
  const clave = `decision-dos:${dc.cosa}:${cats.join(',')}:${a.join('-')}|${b.join('-')}`
  const masMenos = dc.mas ? 'más' : 'menos'
  const otroMM = dc.mas ? 'menos' : 'más'
  const totales = `Totales: ${cats.map((c, i) => `${c} ${num(a[i])} + ${num(b[i])} = ${num(tot[i])}`).join('; ')}`
  if (azar() < 0.7) {
    const resto = cats.map((_, i) => i).filter((i) => i !== iBien && i !== iOtro && i !== trampa.i)
    const malas = [
      `${cats[trampa.i]}, porque tiene ${masMenos} votos en ${trampa.sec}.`,
      `${cats[iBien]}, porque tiene ${masMenos} votos en ${trampa.sec}.`,
      `${cats[iOtro]}, porque en total tiene ${otroMM} votos.`,
      ...(resto.length ? [`${cats[resto[0]]}, porque a mí me gusta más.`] : []),
    ]
    const bien = `${cats[iBien]}, porque en total tiene ${masMenos} votos.`
    const r = alternativas(azar, bien, malas, 4)
    if (!r) return null
    return {
      forma: 'opciones',
      clave,
      enunciado,
      dibujo,
      pregunta: `${dc.pregunta} ¿Por qué?`,
      ...r,
      pasos: ['Se suman los votos de 4.º A y 4.º B', totales, `${dc.mas ? 'El mayor' : 'El menor'} total es ${num(tot[iBien])}, de ${cats[iBien]}`, bien],
    }
  }
  return {
    forma: 'abierta',
    clave: `${clave}:explica`,
    enunciado,
    dibujo,
    pregunta: `${dc.pregunta} Explica tu decisión con los datos.`,
    respuesta: `${cats[iBien]}, porque en total tiene ${num(tot[iBien])} votos (${num(a[iBien])} + ${num(b[iBien])}): es la opción con ${masMenos} votos.`,
    espacio: 'renglones',
    pasos: ['Se suman los votos de 4.º A y 4.º B', totales, `${cats[iBien]}, con ${num(tot[iBien])} votos en total: se decide con los datos de las dos secciones`],
  }
}

const decision = tipo(
  'da-decision',
  'Decide con los datos',
  'Toman una decisión con los resultados de una encuesta y la explican con los datos, no con su gusto.',
  CITA.conclusiones,
  ({ azar, nivel = 2 }) => {
    const dc = elegir(azar, DECISIONES)
    const t = TEMAS.find((x) => x.columna === dc.temas[0])!
    // Más difícil: dos secciones por separado (hay que sumarlas antes de decidir).
    if (nivel === 3) return decisionDosSecciones(azar, dc, t)
    // Más fácil: 3 opciones, la que se elige le saca 4 votos o más a la siguiente (30 en el gráfico) y 3 alternativas.
    const ops = opcionesDe(azar, t, nivel === 1 ? 3 : 4)
    const enBarras = azar() < 0.5
    const v = nivel === 1 ? votosCon(azar, ops.length, enBarras, dc.mas, enBarras ? 3 : 4) : enBarras ? distintos(azar, ops.length, 10, 80, 10) : distintos(azar, ops.length, 3, 18)
    if (!v) return null
    const cats = ops.map((o) => o.et)
    const dibujo = lamina(t.titulo, [piezaVotos(t, cats, v, enBarras)], `${enBarras ? 'Gráfico de barras' : 'Tabla'} de votos: ${cats.map((c, i) => `${c} ${v[i]}`).join(', ')}`)
    const iBien = unico(v, dc.mas)
    const iOtro = unico(v, !dc.mas)
    if (iBien < 0 || iOtro < 0) return null
    const enunciado = `${dc.intro} Estos son los resultados de la encuesta.`
    const clave = `decision:${dc.cosa}:${cats.join(',')}:${v.join('-')}`
    const masMenos = dc.mas ? 'más' : 'menos'
    const otroMM = dc.mas ? 'menos' : 'más'
    const votos = `Votos: ${conValores(cats, v)}`
    const mayor = dc.mas ? 'El mayor' : 'El menor'
    if (azar() < 0.7) {
      const primero = iBien !== 0 && iOtro !== 0 ? 0 : iBien !== cats.length - 1 && iOtro !== cats.length - 1 ? cats.length - 1 : -1
      const resto = cats.map((_, i) => i).filter((i) => i !== iBien && i !== iOtro && i !== primero)
      const malas = [
        `${cats[iOtro]}, porque tiene ${otroMM} votos.`,
        primero >= 0 ? `${cats[primero]}, porque está ${primero === 0 ? 'primero' : 'al final'} en ${enBarras ? 'el gráfico' : 'la tabla'}.` : '',
        resto.length ? `${cats[resto[0]]}, porque a mí me gusta más.` : `${cats[iOtro]}, porque a mí me gusta más.`,
        `${cats[iBien]}, porque tiene ${otroMM} votos.`,
      ].filter(Boolean)
      const bien = `${cats[iBien]}, porque tiene ${masMenos} votos.`
      const tercera = cats.findIndex((_, i) => i !== iBien && i !== iOtro)
      const r = nivel === 1 ? alternativas(azar, bien, [malas[0], `${cats[tercera]}, porque a mí me gusta más.`], 3) : alternativas(azar, bien, malas, 4)
      if (!r) return null
      return { forma: 'opciones', clave, enunciado, dibujo, pregunta: `${dc.pregunta} ¿Por qué?`, ...r, pasos: [votos, `${mayor} es ${num(v[iBien])}, de ${cats[iBien]}`, bien] }
    }
    return {
      forma: 'abierta',
      clave: `${clave}:explica`,
      enunciado,
      dibujo,
      pregunta: `${dc.pregunta} Explica tu decisión con los datos.`,
      respuesta: `${cats[iBien]}, porque tiene ${num(v[iBien])} votos: es la opción con ${masMenos} votos.`,
      espacio: 'renglones',
      pasos: [votos, `${mayor} número de votos es ${num(v[iBien])}`, `${cats[iBien]}, con ${num(v[iBien])} votos: se decide con los datos, no con el gusto`],
    }
  },
)

// ---------- El grupo ----------

export const GRUPO_DATOS: Grupo = {
  tipos: [
    encuesta,
    frecuencias,
    organiza,
    dobleEntrada,
    dobleCompleta,
    pictograma,
    pictogramaCompleta,
    leeBarras,
    barrasCompleta,
    moda,
    modaTabla,
    mediaTorres,
    mediaDatos,
    probableBolsa,
    probableRuleta,
    combinaciones,
    arbol,
    conclusion,
    decision,
  ],
  temas: {
    'Encuestas y entrevistas': ['da-encuesta', 'da-organiza', 'da-frecuencias'],
    'Tablas de frecuencia': ['da-frecuencias', 'da-organiza'],
    'Tablas de doble entrada': ['da-doble-entrada', 'da-doble-completa'],
    'Pictogramas con equivalencias': ['da-pictograma', 'da-pictograma-completa'],
    'Gráficos de barras con escala': ['da-barras', 'da-barras-completa'],
    'La moda': ['da-moda', 'da-moda-tabla'],
    'La media aritmética': ['da-media-torres', 'da-media-datos'],
    'Más probable y menos probable': ['da-bolsa', 'da-ruleta'],
    'Diagrama de posibles resultados': ['da-arbol', 'da-combinaciones'],
    'Conclusiones a partir de datos': ['da-conclusion', 'da-decision'],
    'Moda y media aritmética': ['da-moda', 'da-media-torres', 'da-moda-tabla', 'da-media-datos'],
  },
}
