// Tipos de pregunta de 4.º de primaria. Competencia 2 (regularidad, equivalencia y cambio): patrones, regla de formación, balanza en equilibrio, signo igual, propiedades de la igualdad, tablas de cambio.
// Cada pregunta parte de una situación con dibujo (una cenefa, la rana que salta, el tren, la balanza del mercado, la
// pizarra, la tabla de precios) y las alternativas incorrectas son los errores típicos: no reflejar la figura, sumar
// en vez de multiplicar, poner el resultado en la casilla del signo igual, cambiar un solo platillo de la balanza.
import { barajar, elegir, entero } from '../../juegos/motor/azar'
import { distractores, num } from '../../juegos/matematica/formato'
import { CLARO, GRIS, TINTA, anchoTexto, casilla, circulo, el, elipse, estrella, linea, poligono, r1, rect, ruta, svg, texto } from '../dibujos'
import type { Azar, Generado, Grupo, TipoPregunta } from '../tipos'
import { alternativas, letra, nombre } from '../util'
import { hasta } from './numeros'

const P4 = 'primaria-4'

const CITA_SIMETRIA = 'patrones de repetición (que combinan criterios perceptuales y un criterio geométrico de simetría)'
const CITA_PATRON = 'patrones aditivos o multiplicativos (con números de hasta 4 cifras)'
const CITA_REGLA = 'su comprensión de la regla de formación de un patrón'
const CITA_INCOGNITA = 'de la igualdad (con un término desconocido)'
const CITA_SIGNO = 'del signo igual, distinguiéndolo de su uso en el resultado de una operación'
const CITA_EQUIVALENCIAS = 'Establece relaciones entre datos de hasta dos equivalencias y las trasforma en igualdades'
const CITA_PROPIEDADES = 'usa nocionalmente las propiedades de la igualdad: uniformidad y cancelativa'
const CITA_DUPLICAR = 'duplicar o repartir en cada lado de la igualdad'
const CITA_CAMBIO = 'Describe la relación de cambio de una magnitud con respecto de otra, apoyándose en tablas o dibujos.'

const BLANCO = '#ffffff'
const GRIS_FIG = '#b3b3b3'
const MADERA = '#f1e3b8'
const VERDE = '#d4e8c8'
const AGUA = '#eaf1f6'

// ---------- Ayudas ----------

type Alt = { alternativas: string[]; correcta: number }
type Pieza = { cuerpo: string; ancho: number; alto: number }

const valorDe = (s: string) => Number(s.replace(/[^\d]/g, ''))

/** Alternativas numéricas (de menor a mayor) con su unidad: "7 kg", "S/ 24". Sin números de 5 cifras. */
function opcionesNum(azar: Azar, x: number, frecuentes: number[], o: { min?: number; paso?: number; cuantas?: number; antes?: string; despues?: string } = {}): Alt | null {
  const malas = distractores(x, frecuentes, { min: o.min ?? 1, paso: o.paso ?? 1 }).filter((m) => valorDe(m) <= 9999)
  const alt = alternativas(azar, num(x), malas, o.cuantas ?? 4)
  if (!alt) return null
  return { ...alt, alternativas: alt.alternativas.map((a) => `${o.antes ?? ''}${a}${o.despues ?? ''}`) }
}

/** Opciones de texto (frases, igualdades, secuencias): se barajan; ninguna repetida. */
function opcionesTexto(azar: Azar, correcta: string, malas: string[], cuantas = 4): Alt | null {
  const unicas = [...new Set(malas.filter((m) => m !== correcta))]
  if (unicas.length < cuantas - 1) return null
  const todas = barajar(azar, [correcta, ...barajar(azar, unicas.slice(0, cuantas)).slice(0, cuantas - 1)])
  return { alternativas: todas, correcta: todas.indexOf(correcta) }
}

/** Cuando las opciones están dibujadas (a, b, c), las alternativas de texto son solo las letras. */
const letras = (n: number, correcta: number): Alt => ({ alternativas: Array.from({ length: n }, (_, i) => letra(i)), correcta })

/** Suma cifra a cifra sin llevar: el error típico al pasar la decena o la centena (1975 + 50 → 1925). */
function sinLlevar(a: number, b: number) {
  let r = 0
  for (let p = 1; a > 0 || b > 0; p *= 10, a = Math.floor(a / 10), b = Math.floor(b / 10)) r += (((a % 10) + (b % 10)) % 10) * p
  return r
}

/** Resta cifra a cifra "el menor del mayor": el error típico al prestar (2010 − 25 → 2015). */
function sinPrestar(a: number, b: number) {
  let r = 0
  for (let p = 1; a > 0 || b > 0; p *= 10, a = Math.floor(a / 10), b = Math.floor(b / 10)) r += Math.abs((a % 10) - (b % 10)) * p
  return r
}

const plural = (n: number, uno: string, varios: string) => `${num(n)} ${n === 1 ? uno : varios}`
const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

/** Las pesas sumadas, para los pasos: "10 + 5 + 2 = 17 kg", o solo "17 kg" si es una pesa. */
const sumaPesas = (ps: number[], u: string) => `${ps.length > 1 ? `${ps.map(num).join(' + ')} = ` : ''}${num(ps.reduce((s, p) => s + p, 0))} ${u}`

// ---------- Figuras de las cenefas y fajas ----------

type Forma = 'triangulo' | 'escalera' | 'bandera' | 'flecha'
const FORMAS: Record<Forma, { nombre: string; femenino: boolean; dibujar: (relleno: string) => string }> = {
  triangulo: { nombre: 'triángulo', femenino: false, dibujar: (r) => poligono([[3, 37], [3, 3], [37, 37]], { relleno: r, grosor: 2.2 }) },
  escalera: {
    nombre: 'escalera',
    femenino: true,
    dibujar: (r) => poligono([[3, 37], [3, 28], [12, 28], [12, 19], [21, 19], [21, 10], [30, 10], [30, 3], [37, 3], [37, 37]], { relleno: r, grosor: 2.2 }),
  },
  bandera: {
    nombre: 'bandera',
    femenino: true,
    dibujar: (r) => poligono([[9, 4], [37, 14], [9, 24]], { relleno: r, grosor: 2.2 }) + linea(9, 3, 9, 37, { grosor: 3 }) + linea(4, 37, 15, 37, { grosor: 2.6 }),
  },
  flecha: { nombre: 'flecha', femenino: true, dibujar: (r) => poligono([[3, 14], [21, 14], [21, 4], [37, 20], [21, 36], [21, 26], [3, 26]], { relleno: r, grosor: 2.2 }) },
}
const IDS_FORMAS = Object.keys(FORMAS) as Forma[]

type Fig = { forma: Forma; espejo: boolean; gris: boolean }
const fig = (forma: Forma, espejo: boolean, gris: boolean): Fig => ({ forma, espejo, gris })
const igualFig = (a: Fig, b: Fig) => a.forma === b.forma && a.espejo === b.espejo && a.gris === b.gris
const codigoFig = (f: Fig) => `${f.forma[0]}${f.espejo ? 'i' : 'd'}${f.gris ? 'g' : 'b'}`
const colorFig = (f: Fig) => (f.gris ? 'gris' : FORMAS[f.forma].femenino ? 'blanca' : 'blanco')
const nombreFig = (f: Fig) => `${FORMAS[f.forma].femenino ? 'la' : 'el'} ${FORMAS[f.forma].nombre} ${colorFig(f)}`

/** Una figura en un cuadro de s × s; reflejada (como en un espejo) si `espejo`. */
function figura(f: Fig, x: number, y: number, s = 40) {
  const e = s / 40
  const t = f.espejo ? `translate(${r1(x + s)} ${r1(y)}) scale(${-e} ${e})` : `translate(${r1(x)} ${r1(y)}) scale(${e})`
  return el('g', { transform: t }, FORMAS[f.forma].dibujar(f.gris ? GRIS_FIG : BLANCO))
}

/**
 * El grupo de figuras que se repite. Siempre combina la simetría (cada figura con su reflejo) y un criterio
 * perceptual (el color y, a veces, la forma).
 */
function patronSimetria(azar: Azar): { unidad: Fig[]; tipo: string } {
  const [A, B] = barajar(azar, IDS_FORMAS)
  const g = azar() < 0.5
  const e = azar() < 0.5
  const tipo = elegir(azar, ['par', 'par-color', 'dos-formas', 'espejo'])
  const unidad =
    tipo === 'par'
      ? [fig(A, e, g), fig(A, !e, !g)]
      : tipo === 'par-color'
        ? [fig(A, e, g), fig(A, !e, g), fig(A, e, !g), fig(A, !e, !g)]
        : tipo === 'dos-formas'
          ? [fig(A, e, g), fig(A, !e, g), fig(B, e, !g), fig(B, !e, !g)]
          : // A B | B' A': la mitad derecha es el reflejo de la izquierda.
            [fig(A, e, g), fig(B, e, !g), fig(B, !e, !g), fig(A, !e, g)]
  return { unidad, tipo }
}

const SLOT = 52

/** La cenefa o faja: una banda con las figuras en fila; `null` es el recuadro con «?». */
function cinta(figs: (Fig | null)[], numeros = false): Pieza {
  const w = figs.length * SLOT + 12
  const partes = [
    rect(0, 0, w, 64, { relleno: '#f6f6f6', grosor: 1.8, redondeo: 4 }),
    linea(6, 6, w - 6, 6, { trazo: GRIS, grosor: 1.4 }),
    linea(6, 58, w - 6, 58, { trazo: GRIS, grosor: 1.4 }),
  ]
  figs.forEach((f, i) => {
    const x = 12 + i * SLOT
    if (f) partes.push(figura(f, x, 12))
    else partes.push(rect(x - 2, 10, 44, 44, { relleno: BLANCO, grosor: 1.8, punteado: true, redondeo: 4 }), texto(x + 20, 32, '?', { tam: 26, peso: 700 }))
    if (numeros) partes.push(texto(x + 20, 80, String(i + 1), { tam: 15, peso: 700 }))
  })
  return { cuerpo: partes.join(''), ancho: w, alto: numeros ? 90 : 64 }
}

const desplazar = (cuerpo: string, x: number, y: number) => el('g', { transform: `translate(${r1(x)} ${r1(y)})` }, cuerpo)

// ---------- 1. ¿Qué figura sigue? (cenefa con simetría) ----------

const LUGARES_CENEFA = [
  (q: string) => `${q} pinta una cenefa en la pared del aula con figuras que se repiten.`,
  (q: string) => `${q} borda el borde de un mantel para la fiesta patronal con figuras que se repiten.`,
  (q: string) => `${q} decora el borde de su cuaderno con figuras que se repiten.`,
]

export const cenefa: TipoPregunta = {
  id: 're-cenefa',
  nombre: '¿Qué figura sigue?',
  queHacen: 'Descubren qué figura sigue o falta en una cenefa donde las figuras cambian de color y se reflejan como en un espejo.',
  citas: { [P4]: CITA_SIMETRIA },
  area: 'matematica',
  competencia: 2,
  cambia: 'numeros',
  generar({ azar }) {
    const { unidad, tipo } = patronSimetria(azar)
    const u = unidad.length
    const n = u === 2 ? entero(azar, 7, 8) : entero(azar, 9, 10)
    const sigue = azar() < 0.6
    const h = sigue ? n - 1 : entero(azar, u, n - 2)
    const ok = unidad[h % u]
    const cands = barajar(azar, [ok, { ...ok, espejo: !ok.espejo }, { ...ok, gris: !ok.gris }])
    const correcta = cands.findIndex((c) => igualFig(c, ok))
    const banda = cinta(Array.from({ length: n }, (_, i) => (i === h ? null : unidad[i % u])))
    // Las tres opciones, dibujadas debajo y rotuladas a), b), c).
    const BLOQUE = 118
    const anchoOpc = 3 * BLOQUE - 30
    const ancho = Math.max(banda.ancho, anchoOpc) + 8
    const x0 = (ancho - anchoOpc) / 2
    const yo = banda.alto + 26
    const opc = cands
      .map((c, i) => {
        const x = x0 + i * BLOQUE
        return texto(x + 10, yo + 28, `${letra(i)})`, { tam: 17, peso: 700 }) + rect(x + 26, yo, 58, 58, { relleno: BLANCO, grosor: 1.6, redondeo: 6 }) + figura(c, x + 35, yo + 9)
      })
      .join('')
    const dibujo = svg(
      ancho,
      yo + 62,
      desplazar(banda.cuerpo, (ancho - banda.ancho) / 2, 4) + opc,
      `Cenefa de ${n} figuras con un recuadro con signo de interrogación en el lugar ${h + 1}; debajo, tres figuras para elegir: a, b y c`,
    )
    return {
      forma: 'opciones',
      clave: `cenefa:${tipo}:${unidad.map(codigoFig).join('')}:${n}:${h}`,
      enunciado: elegir(azar, LUGARES_CENEFA)(nombre(azar)),
      dibujo,
      pregunta: sigue ? '¿Qué figura sigue?' : '¿Qué figura falta en el recuadro con «?»?',
      ...letras(3, correcta),
      nota: `Va ${nombreFig(ok)}, igual a la figura que está ${u} lugares antes: el grupo de ${u} figuras se repite.`,
      pasos: [
        `Se repite un grupo de ${u} figuras.`,
        `El «?» está en el lugar ${h + 1}; ${u} lugares antes, en el ${h + 1 - u}, está ${nombreFig(ok)}.`,
        `Va la figura ${letra(correcta)}: igual a la del lugar ${h + 1 - u}, con su color y su posición.`,
      ],
    }
  },
}

// ---------- 2. La faja tejida (¿dónde se equivocó? / ¿qué grupo se repite?) ----------

export const faja: TipoPregunta = {
  id: 're-faja',
  nombre: 'La faja tejida',
  queHacen: 'Encuentran la figura equivocada en una faja tejida o eligen el grupo de figuras que se repite, mirando el color y el reflejo.',
  citas: { [P4]: CITA_SIMETRIA },
  area: 'matematica',
  competencia: 2,
  cambia: 'numeros',
  generar({ azar }) {
    const quien = nombre(azar)
    if (azar() < 0.55) {
      // Una figura está mal: no se reflejó o tiene otro color. Cada lugar del grupo aparece 4 veces, así se ve cuál es.
      const A = elegir(azar, IDS_FORMAS)
      const g = azar() < 0.5
      const e = azar() < 0.5
      const mismoColor = azar() < 0.35
      const unidad = [fig(A, e, g), fig(A, !e, mismoColor ? g : !g)]
      const n = entero(azar, 8, 9)
      const pos = entero(azar, 2, n - 1)
      const bien = unidad[pos % 2]
      const reflejo = azar() < 0.6
      const mal = reflejo ? { ...bien, espejo: !bien.espejo } : { ...bien, gris: !bien.gris }
      const banda = cinta(Array.from({ length: n }, (_, i) => (i === pos ? mal : unidad[i % 2])), true)
      const alt = alternativas(
        azar,
        String(pos + 1),
        [pos, pos + 2, pos - 1, pos + 3].filter((x) => x >= 1 && x <= n).map(String),
        4,
      )
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `faja-error:${unidad.map(codigoFig).join('')}:${n}:${pos}:${reflejo ? 'r' : 'c'}`,
        enunciado: `${quien} teje una faja (chumpi) con figuras que se repiten y se reflejan. Se equivocó en una figura.`,
        dibujo: svg(banda.ancho + 8, banda.alto + 6, desplazar(banda.cuerpo, 4, 4), `Faja con ${n} figuras numeradas del 1 al ${n}; una de ellas no sigue el patrón`),
        pregunta: '¿Qué número tiene la figura equivocada?',
        ...alt,
        nota: `Es la figura ${pos + 1}: ${reflejo ? 'no está reflejada' : 'tiene otro color'}. Debía ser igual a la figura ${pos - 1}.`,
        pasos: [
          'Se repiten 2 figuras: cada figura es igual a la que está 2 lugares antes.',
          `La figura ${pos + 1} no es igual a la ${pos - 1}: ${reflejo ? 'no está reflejada' : 'tiene otro color'}.`,
          `La figura equivocada es la ${pos + 1}.`,
        ],
      }
    }
    // ¿Qué grupo de figuras se repite? Las opciones son grupos dibujados.
    const { unidad, tipo } = patronSimetria(azar)
    const u = unidad.length
    const sinReflejo = unidad.map((f) => ({ ...f, espejo: unidad[0].espejo }))
    const otra = u === 4 ? unidad.slice(0, 2) : unidad.map((f) => ({ ...f, gris: unidad[0].gris }))
    const grupos = barajar(azar, [unidad, sinReflejo, otra])
    const correcta = grupos.indexOf(unidad)
    const banda = cinta(Array.from({ length: 8 }, (_, i) => unidad[i % u]))
    const S = 32
    const filas = grupos
      .map((gr, i) => {
        const y = banda.alto + 22 + i * 50
        const caja = rect(30, y, gr.length * (S + 8) + 12, S + 12, { relleno: BLANCO, grosor: 1.6, redondeo: 6 })
        return texto(12, y + (S + 12) / 2, `${letra(i)})`, { tam: 17, peso: 700 }) + caja + gr.map((f, k) => figura(f, 40 + k * (S + 8), y + 6, S)).join('')
      })
      .join('')
    const alto = banda.alto + 22 + 3 * 50
    return {
      forma: 'opciones',
      clave: `faja-grupo:${tipo}:${unidad.map(codigoFig).join('')}`,
      enunciado: `${quien} teje una faja (chumpi) con un grupo de figuras que se repite.`,
      dibujo: svg(banda.ancho + 8, alto, desplazar(banda.cuerpo, 4, 4) + filas, `Faja con 8 figuras; debajo, tres grupos de figuras para elegir: a, b y c`),
      pregunta: '¿Qué grupo de figuras, repetido una y otra vez, forma toda la faja?',
      ...letras(3, correcta),
      nota: `El grupo ${letra(correcta)} (${u} figuras) se repite desde el inicio de la faja.`,
      pasos: [
        `Desde el inicio, la faja repite sus ${u} primeras figuras.`,
        `El grupo ${letra(grupos.indexOf(sinReflejo))} no se refleja; el ${letra(grupos.indexOf(otra))} ${u === 4 ? 'tiene solo 2 figuras' : 'no cambia de color'}.`,
        `Es el grupo ${letra(correcta)}: las ${u} primeras figuras, con su color y su reflejo.`,
      ],
    }
  },
}

// ---------- 3. La rana salta (patrón aditivo) ----------

function dibujoRana(nums: number[], ocultos: number[], casillas: boolean) {
  const n = nums.length
  const W = 600
  const xs = nums.map((_, i) => 56 + i * 97.6)
  const ys = nums.map((_, i) => (i % 2 ? 126 : 114))
  const partes = [rect(4, 34, W - 8, 130, { relleno: AGUA, trazo: GRIS, grosor: 1.4, redondeo: 14 })]
  for (const [x, y] of [[100, 156], [300, 152], [500, 156], [200, 48], [420, 46]]) partes.push(ruta(`M${x - 16},${y} q8,-6 16,0 t16,0`, { trazo: '#8aa0b2', grosor: 1.4 }))
  for (let i = 0; i < n - 1; i++) {
    const x1 = xs[i] + 22
    const x2 = xs[i + 1] - 22
    const y1 = ys[i] - 22
    const y2 = ys[i + 1] - 22
    partes.push(ruta(`M${x1},${y1} Q${(x1 + x2) / 2},${Math.min(y1, y2) - 34} ${x2},${y2}`, { trazo: GRIS, grosor: 1.6, punteado: true }))
    partes.push(poligono([[x2, y2], [x2 - 8, y2 - 5], [x2 - 3, y2 - 10]], { relleno: GRIS, trazo: GRIS, grosor: 1.4 }))
  }
  nums.forEach((v, i) => {
    partes.push(elipse(xs[i], ys[i], 42, 22, { relleno: '#d6d6d6', grosor: 1.8 }))
    partes.push(ruta(`M${xs[i] - 30},${ys[i] - 8} q14,-10 30,-12`, { trazo: BLANCO, grosor: 2 }))
    if (!ocultos.includes(i)) partes.push(texto(xs[i], ys[i] + 2, num(v), { tam: 19, peso: 700 }))
    else if (casillas) partes.push(casilla(xs[i] - 28, ys[i] - 15, 56, 30))
    else partes.push(texto(xs[i], ys[i] + 2, '?', { tam: 22, peso: 700 }))
  })
  // La rana, sentada en la primera piedra.
  const fx = xs[0]
  const fy = ys[0] - 30
  partes.push(
    elipse(fx - 13, fy + 9, 7, 4, { relleno: VERDE, grosor: 1.4 }),
    elipse(fx + 13, fy + 9, 7, 4, { relleno: VERDE, grosor: 1.4 }),
    elipse(fx, fy, 16, 11, { relleno: VERDE, grosor: 1.6 }),
    circulo(fx - 7, fy - 10, 5, { relleno: BLANCO, grosor: 1.4 }),
    circulo(fx + 7, fy - 10, 5, { relleno: BLANCO, grosor: 1.4 }),
    circulo(fx - 7, fy - 10, 1.8, { relleno: TINTA, grosor: 1.4 }),
    circulo(fx + 7, fy - 10, 1.8, { relleno: TINTA, grosor: 1.4 }),
    ruta(`M${fx - 6},${fy + 2} q6,4 12,0`, { grosor: 1.4 }),
  )
  return svg(W, 170, partes.join(''), `Una rana sobre la primera de ${n} piedras numeradas: ${nums.map((v, i) => (ocultos.includes(i) ? '?' : num(v))).join(', ')}`)
}

export const rana: TipoPregunta = {
  id: 're-rana',
  nombre: 'La rana salta',
  queHacen: 'Completan los números de las piedras por donde salta la rana, siguiendo un patrón que suma o resta lo mismo.',
  citas: { [P4]: CITA_PATRON },
  area: 'matematica',
  competencia: 2,
  cambia: 'numeros',
  generar({ azar }) {
    const s = elegir(azar, [10, 20, 25, 50, 100, 200, 250, 500, 1000])
    const baja = azar() < 0.3
    let t0 = baja ? entero(azar, 5 * s + 100, 9999) : entero(azar, azar() < 0.75 ? 1000 : 100, 9999 - 5 * s)
    if (s >= 20) t0 -= t0 % 5
    const d = baja ? -s : s
    const t = Array.from({ length: 6 }, (_, i) => t0 + i * d)
    if (t.some((x) => x < 1 || x > 9999)) return null
    const enunciado = 'La rana salta de piedra en piedra. Los números de las piedras siguen un patrón.'
    const nota = `El patrón ${baja ? 'resta' : 'suma'} ${num(s)} en cada salto.`
    // Pasos: el salto se lee en dos piedras vecinas que se ven; luego, piedra por piedra.
    const leer = (i: number) =>
      baja ? `${num(t[i])} − ${num(t[i + 1])} = ${num(s)}: cada salto resta ${num(s)}.` : `${num(t[i + 1])} − ${num(t[i])} = ${num(s)}: cada salto suma ${num(s)}.`
    const salta = (i: number) => `${num(t[i - 1])} ${baja ? '−' : '+'} ${num(s)} = ${num(t[i])}`
    if (azar() < 0.3) {
      const [h1, h2] = elegir(azar, [[2, 4], [3, 5], [1, 4], [4, 5], [2, 5]])
      const vecinas = [0, 1, 2, 3, 4].find((i) => ![h1, h2].includes(i) && ![h1, h2].includes(i + 1)) ?? 0
      return {
        forma: 'abierta',
        clave: `rana:${t0}:${d}:${h1}-${h2}`,
        enunciado,
        dibujo: dibujoRana(t, [h1, h2], true),
        pregunta: 'Escribe los números que faltan en las piedras.',
        respuesta: `${num(t[h1])} y ${num(t[h2])}`,
        espacio: 'dibujo',
        nota,
        pasos: [leer(vecinas), `Piedra ${h1 + 1}: ${salta(h1)}`, `Piedra ${h2 + 1}: ${salta(h2)}`, `En las piedras van ${num(t[h1])} y ${num(t[h2])}.`],
      }
    }
    const h = azar() < 0.55 ? entero(azar, 2, 4) : 5
    const x = t[h]
    const prev = t[h - 1]
    const frecuentes = [baja ? sinPrestar(prev, s) : sinLlevar(prev, s), x + d, prev + 10 * d, x + 10, x - 10, x + 100, x - 100]
    const alt = opcionesNum(azar, x, frecuentes)
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `rana:${t0}:${d}:${h}`,
      enunciado,
      dibujo: dibujoRana(t, [h], false),
      pregunta: h === 5 ? '¿En qué número cae la rana en el siguiente salto?' : '¿Qué número va en la piedra con «?»?',
      ...alt,
      nota,
      pasos: [leer(0), `${h === 5 ? 'Siguiente salto' : `Piedra ${h + 1}`}: ${salta(h)}`],
    }
  },
}

// ---------- 4. Tarjetas que se multiplican (patrón multiplicativo) ----------

function dibujoTendedero(nums: number[], oculto: number) {
  const n = nums.length
  const PASO = 92
  const W = n * PASO + 40
  const sag = 22
  const yCuerda = (x: number) => 26 + 4 * sag * ((x - 14) / (W - 28)) * (1 - (x - 14) / (W - 28))
  const partes = [
    rect(6, 16, 8, 128, { relleno: MADERA, grosor: 1.6 }),
    rect(W - 14, 16, 8, 128, { relleno: MADERA, grosor: 1.6 }),
    ruta(`M14,26 Q${W / 2},${26 + 2 * sag} ${W - 14},26`, { grosor: 1.8 }),
  ]
  nums.forEach((v, i) => {
    const cx = 20 + PASO / 2 + i * PASO
    const y = yCuerda(cx)
    partes.push(rect(cx - 36, y + 6, 72, 52, { relleno: BLANCO, grosor: 1.8, redondeo: 4 }))
    partes.push(rect(cx - 4, y - 8, 8, 20, { relleno: '#e2cfa8', grosor: 1.4, redondeo: 2 }))
    partes.push(texto(cx, y + 33, i === oculto ? '?' : num(v), { tam: i === oculto ? 26 : 21, peso: 700 }))
  })
  return svg(W, 150, partes.join(''), `Tarjetas colgadas en un cordel con los números ${nums.map((v, i) => (i === oculto ? '?' : num(v))).join(', ')}`)
}

function dibujoPapel() {
  const partes: string[] = []
  const W = 112
  const H = 76
  ;[
    [2, 1],
    [2, 2],
    [4, 2],
  ].forEach(([cols, filas], i) => {
    const x = 8 + i * (W + 50)
    partes.push(rect(x, 8, W, H, { relleno: BLANCO, grosor: 1.8 }))
    for (let c = 1; c < cols; c++) partes.push(linea(x + (c * W) / cols, 8, x + (c * W) / cols, 8 + H, { trazo: GRIS, grosor: 1.6, punteado: true }))
    for (let f = 1; f < filas; f++) partes.push(linea(x, 8 + (f * H) / filas, x + W, 8 + (f * H) / filas, { trazo: GRIS, grosor: 1.6, punteado: true }))
    partes.push(texto(x + W / 2, 8 + H + 22, i === 0 ? '1 doblez' : `${i + 1} dobleces`, { tam: 15, peso: 700 }))
  })
  return svg(3 * W + 2 * 50 + 16, H + 44, partes.join(''), 'Tres hojas abiertas: con 1 doblez queda en 2 partes, con 2 dobleces en 4 partes y con 3 dobleces en 8 partes')
}

export const multiplica: TipoPregunta = {
  id: 're-multiplica',
  nombre: 'Patrón que se multiplica',
  queHacen: 'Completan una secuencia que multiplica (por 2, 3, 5 o 10) o que se reduce a la mitad, en tarjetas o al doblar una hoja.',
  citas: { [P4]: CITA_PATRON },
  area: 'matematica',
  competencia: 2,
  cambia: 'numeros',
  generar({ azar }) {
    if (azar() < 0.25) {
      const quien = nombre(azar)
      const N = entero(azar, 4, 6)
      const x = 2 ** N
      const alt = opcionesNum(azar, x, [8 + 4 * (N - 3), 2 * N, 2 ** (N - 1), 2 ** (N + 1), x + 2])
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `papel:${N}`,
        enunciado: `${quien} dobla una hoja por la mitad, una y otra vez. Cada vez la abre y cuenta las partes.`,
        dibujo: dibujoPapel(),
        pregunta: `Si dobla la hoja ${N} veces, ¿en cuántas partes quedará dividida?`,
        ...alt,
        nota: 'Cada doblez duplica las partes: 2, 4, 8, 16, 32, 64…',
        pasos: [
          'Hojas: 1 doblez → 2 partes; 2 dobleces → 4; 3 dobleces → 8.',
          `Cada doblez más, el doble: ${Array.from({ length: N - 3 }, (_, i) => `${num(2 ** (i + 3))} × 2 = ${num(2 ** (i + 4))}`).join('; ')}`,
          `Con ${N} dobleces quedan ${num(x)} partes.`,
        ],
      }
    }
    const f = elegir(azar, [2, 2, 3, 5, 10, 0])
    const t0 = f === 2 ? entero(azar, 2, 40) : f === 3 ? entero(azar, 1, 12) : f === 5 ? entero(azar, 1, 3) : f === 10 ? entero(azar, 1, 9) : 32 * elegir(azar, [3, 5, 6, 7, 9, 10, 12, 15, 20, 25, 30, 50, 75, 100, 125, 150, 200, 250, 300])
    const n = f === 10 ? 4 : 6
    const t = Array.from({ length: n }, (_, i) => (f === 0 ? t0 / 2 ** i : t0 * f ** i))
    if (t.some((x) => x > 9999 || !Number.isInteger(x))) return null
    const h = entero(azar, 2, n - 1)
    const x = t[h]
    const prev = t[h - 1]
    const prev2 = t[h - 2]
    const frecuentes =
      f === 0
        ? [prev / 4, prev - 2, x + 10, x - 10, x + 2, x - 2]
        : [prev + (prev - prev2), prev + f, f > 2 ? prev * (f - 1) : prev * 3, x + prev2, prev * 2, x + 10, x - 10]
    const alt = opcionesNum(azar, x, frecuentes.filter(Number.isInteger))
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `cordel:${f}:${t0}:${h}`,
      enunciado: 'En el aula colgaron tarjetas con números que siguen un patrón.',
      dibujo: dibujoTendedero(t, h),
      pregunta: '¿Qué número va en la tarjeta con «?»?',
      ...alt,
      nota: f === 0 ? 'Cada número es la mitad del anterior.' : `Cada número es el anterior multiplicado por ${f}.`,
      pasos:
        f === 0
          ? [`${num(t[0])} ÷ 2 = ${num(t[1])}: cada tarjeta es la mitad de la anterior.`, `Tarjeta ${h + 1}: ${num(prev)} ÷ 2 = ${num(x)}`]
          : [`${num(t[0])} × ${f} = ${num(t[1])}: cada tarjeta es la anterior multiplicada por ${f}.`, `Tarjeta ${h + 1}: ${num(prev)} × ${f} = ${num(x)}`],
    }
  },
}

// ---------- 5. ¿Cuál es la regla? (el tren) ----------

type Regla = { op: '+' | '−' | '×' | '÷'; k: number }
const aplicar = (r: Regla, x: number) => (r.op === '+' ? x + r.k : r.op === '−' ? x - r.k : r.op === '×' ? x * r.k : x / r.k)
const textoRegla = (r: Regla) => (r.op === '+' ? `Suma ${num(r.k)}` : r.op === '−' ? `Resta ${num(r.k)}` : r.op === '×' ? `Multiplica por ${num(r.k)}` : `Divide entre ${num(r.k)}`)
function serie(r: Regla, t0: number, n: number) {
  const s = [t0]
  while (s.length < n) s.push(aplicar(r, s[s.length - 1]))
  return s
}
const valida = (s: number[]) => s.every((x) => Number.isInteger(x) && x >= 1 && x <= 9999)
const inversa = (r: Regla): Regla => ({ op: r.op === '+' ? '−' : r.op === '−' ? '+' : r.op === '×' ? '÷' : '×', k: r.k })
const textoSerie = (s: number[]) => s.map(num).join(', ')

function reglaAlAzar(azar: Azar): { r: Regla; t0: number; n: number } {
  return hasta(() => {
    const tipo = azar()
    let res: { r: Regla; t0: number; n: number }
    if (tipo < 0.55) {
      const k = elegir(azar, [10, 20, 25, 50, 100, 200, 250, 500])
      const baja = tipo >= 0.4
      let t0 = baja ? entero(azar, 5 * k + 100, 9999) : entero(azar, azar() < 0.6 ? 1000 : 100, 9999 - 5 * k)
      if (k >= 20) t0 -= t0 % 5
      res = { r: { op: baja ? '−' : '+', k }, t0, n: 5 }
    } else if (tipo < 0.88) {
      const k = elegir(azar, [2, 2, 3, 5, 10])
      const t0 = k === 2 ? entero(azar, 2, 40) : k === 3 ? entero(azar, 2, 20) : k === 5 ? entero(azar, 1, 9) : entero(azar, 2, 9)
      res = { r: { op: '×', k }, t0, n: k === 10 ? 4 : 5 }
    } else res = { r: { op: '÷', k: 2 }, t0: 16 * entero(azar, 3, 60), n: 5 }
    return valida(serie(res.r, res.t0, res.n)) ? res : null
  })
}

/** La cifra que cambia, sin los ceros: el error de mirar solo una cifra (8745 → 8945: "suma 2"). */
const cifra = (k: number) => {
  let c = k
  while (c % 10 === 0 && c > 0) c /= 10
  return c === k ? 2 * k : c
}

/** Reglas que los alumnos confunden: el primer salto, el doble, la otra dirección, multiplicar en vez de sumar. */
function reglasErradas(r: Regla, s: number[]): Regla[] {
  const salto = s[1] - s[0]
  const lista: Regla[] =
    r.op === '+'
      ? [{ op: '+', k: cifra(r.k) }, { op: '+', k: 2 * r.k }, { op: '−', k: r.k }, { op: '+', k: 10 * r.k }, { op: '×', k: 2 }]
      : r.op === '−'
        ? [{ op: '+', k: r.k }, { op: '−', k: cifra(r.k) }, { op: '−', k: 2 * r.k }, { op: '−', k: 10 * r.k }, { op: '÷', k: 2 }]
        : r.op === '×'
          ? [{ op: '+', k: salto }, { op: '+', k: s[2] - s[1] }, { op: '+', k: r.k }, { op: '×', k: r.k === 2 ? 3 : 2 }]
          : [{ op: '−', k: -salto }, { op: '−', k: s[1] - s[2] }, { op: '÷', k: 4 }, { op: '×', k: 2 }]
  // Ninguna regla equivocada puede servir también para la secuencia del dibujo.
  return lista.filter((x) => x.k > 0 && serie(x, s[0], s.length).join() !== s.join())
}

function dibujoTren(valores: (number | null)[]): string {
  const partes: string[] = []
  const y = 30
  partes.push(linea(4, y + 62, 88 + valores.length * 98, y + 62, { grosor: 2 }))
  // Locomotora, mirando a la izquierda.
  partes.push(
    rect(10, y + 6, 70, 40, { relleno: CLARO, grosor: 1.8, redondeo: 6 }),
    rect(46, y - 14, 34, 22, { relleno: CLARO, grosor: 1.8, redondeo: 3 }),
    rect(52, y - 9, 22, 12, { relleno: BLANCO, grosor: 1.4, redondeo: 2 }),
    rect(18, y - 6, 12, 14, { relleno: GRIS_FIG, grosor: 1.6 }),
    poligono([[10, y + 34], [0, y + 46], [10, y + 46]], { relleno: GRIS_FIG, grosor: 1.6 }),
    circulo(28, y + 52, 9, { relleno: BLANCO, grosor: 1.8 }),
    circulo(62, y + 52, 9, { relleno: BLANCO, grosor: 1.8 }),
  )
  valores.forEach((v, i) => {
    const x = 94 + i * 98
    partes.push(linea(x - 14, y + 36, x, y + 36, { grosor: 2.4 }))
    partes.push(rect(x, y + 2, 86, 44, { relleno: BLANCO, grosor: 1.8, redondeo: 4 }))
    partes.push(circulo(x + 20, y + 52, 9, { relleno: BLANCO, grosor: 1.8 }), circulo(x + 66, y + 52, 9, { relleno: BLANCO, grosor: 1.8 }))
    partes.push(texto(x + 43, y + 25, v === null ? '?' : num(v), { tam: v === null ? 22 : 20, peso: 700 }))
  })
  return partes.join('')
}

export const regla: TipoPregunta = {
  id: 're-regla',
  nombre: '¿Cuál es la regla?',
  queHacen: 'Descubren la regla de la secuencia de los vagones del tren (suma, resta, multiplica o divide) o eligen la secuencia que cumple una regla.',
  citas: { [P4]: CITA_REGLA },
  area: 'matematica',
  competencia: 2,
  cambia: 'numeros',
  generar({ azar }) {
    const { r, t0, n } = reglaAlAzar(azar)
    const s = serie(r, t0, n)
    const anchoTren = 94 + n * 98
    // Pasos: cómo se pasa de un vagón al siguiente, con las cuentas de los dos primeros saltos.
    const cuenta = (i: number) =>
      r.op === '+' ? `${num(s[i + 1])} − ${num(s[i])} = ${num(r.k)}` : r.op === '−' ? `${num(s[i])} − ${num(s[i + 1])} = ${num(r.k)}` : `${num(s[i])} ${r.op} ${num(r.k)} = ${num(s[i + 1])}`
    const cada = r.op === '+' ? `siempre ${num(r.k)} más` : r.op === '−' ? `siempre ${num(r.k)} menos` : r.op === '×' ? `cada vez se multiplica por ${num(r.k)}` : 'cada vez la mitad'
    const leerTren = [`Vagones: ${textoSerie(s)}`, `${cuenta(0)}; ${cuenta(1)}: ${cada}.`]
    const modo = azar()
    if (modo < 0.3) {
      // La regla escrita en un cartel: ¿qué números van en los vagones?
      const buena = serie(r, t0, 4)
      const errada = r.op === '+' ? { op: '+' as const, k: 2 * r.k } : r.op === '−' ? { op: '−' as const, k: 2 * r.k } : r.op === '×' ? { op: '+' as const, k: r.k } : { op: '−' as const, k: 2 }
      const conError = [...buena]
      if (r.op === '+') conError[2] = sinLlevar(buena[1], r.k)
      if (r.op === '−') conError[2] = sinPrestar(buena[1], r.k)
      if (conError[2] === buena[2]) conError[2] = buena[2] + 10
      conError[3] = aplicar(r, conError[2])
      const malas = [serie(r, aplicar(r, t0), 4), serie(inversa(r), t0, 4), serie(errada, t0, 4), conError].filter(valida).map(textoSerie)
      const alt = opcionesTexto(azar, textoSerie(buena), malas)
      if (!alt) return null
      const cartel = [
        rect(150, 4, 300, 64, { relleno: '#fbf6e6', grosor: 2, redondeo: 6 }),
        texto(300, 22, 'REGLA', { tam: 14, peso: 700, color: GRIS }),
        texto(300, 48, `Empieza en ${num(t0)}. ${textoRegla(r)}.`, { tam: 18, peso: 700 }),
      ].join('')
      return {
        forma: 'opciones',
        clave: `regla-cartel:${r.op}${r.k}:${t0}`,
        enunciado: 'Los números de los vagones siguen la regla del cartel.',
        dibujo: svg(600, 180, cartel + el('g', { transform: 'translate(0 76)' }, dibujoTren([null, null, null, null])), `Cartel con la regla: empieza en ${num(t0)}, ${textoRegla(r).toLowerCase()}; debajo, un tren con 4 vagones vacíos`),
        pregunta: '¿Qué números van en los vagones?',
        ...alt,
        pasos: [
          `El primer vagón es ${num(t0)}; luego, ${textoRegla(r).toLowerCase()} cada vez.`,
          [0, 1, 2].map((i) => `${num(buena[i])} ${r.op} ${num(r.k)} = ${num(buena[i + 1])}`).join('; '),
          `En los vagones van ${textoSerie(buena)}.`,
        ],
      }
    }
    const dibujo = svg(Math.max(anchoTren, 300), 100, dibujoTren(s), `Tren con ${n} vagones numerados: ${textoSerie(s)}`)
    if (modo < 0.5) {
      return {
        forma: 'abierta',
        clave: `regla-escribe:${r.op}${r.k}:${t0}`,
        enunciado: 'Observa los números de los vagones del tren.',
        dibujo,
        pregunta: '¿Cuál es la regla de la secuencia? Escríbela.',
        respuesta: `${textoRegla(r)} (empieza en ${num(t0)}).`,
        espacio: 'linea',
        pasos: [...leerTren, `Regla: ${textoRegla(r)} (empieza en ${num(t0)}).`],
      }
    }
    const alt = opcionesTexto(azar, textoRegla(r), reglasErradas(r, s).map(textoRegla))
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `regla:${r.op}${r.k}:${t0}`,
      enunciado: 'Observa los números de los vagones del tren.',
      dibujo,
      pregunta: '¿Cuál es la regla de la secuencia?',
      ...alt,
      nota: `${textoRegla(r)}: ${textoSerie(s)}.`,
      pasos: [...leerTren, `Regla: ${textoRegla(r)}`],
    }
  },
}

// ---------- 6. Mesas y sillas, palitos (patrón gráfico que crece) ----------

type Arreglo = 'mesas' | 'triangulos' | 'cuadrados'

function palito(x1: number, y1: number, x2: number, y2: number) {
  const L = Math.hypot(x2 - x1, y2 - y1)
  const ux = ((x2 - x1) / L) * 4
  const uy = ((y2 - y1) / L) * 4
  return linea(x1 + ux, y1 + uy, x2 - ux, y2 - uy, { grosor: 8.5 }) + linea(x1 + ux, y1 + uy, x2 - ux, y2 - uy, { trazo: '#ecd49c', grosor: 5 })
}

function figuraArreglo(a: Arreglo, k: number): Pieza {
  const partes: string[] = []
  if (a === 'mesas') {
    const T = 34
    for (let i = 0; i < k; i++) {
      const x = 14 + i * T
      partes.push(rect(x, 13, T, T, { relleno: MADERA, grosor: 1.8 }))
      partes.push(rect(x + 6, 0, 22, 9, { relleno: CLARO, grosor: 1.6, redondeo: 3 }), rect(x + 6, 13 + T + 4, 22, 9, { relleno: CLARO, grosor: 1.6, redondeo: 3 }))
    }
    partes.push(rect(0, 13 + 6, 9, 22, { relleno: CLARO, grosor: 1.6, redondeo: 3 }), rect(14 + k * T + 5, 13 + 6, 9, 22, { relleno: CLARO, grosor: 1.6, redondeo: 3 }))
    return { cuerpo: partes.join(''), ancho: 14 + k * T + 14, alto: 13 + T + 13 }
  }
  const L = 46
  const segs = new Map<string, [number, number, number, number]>()
  const agregar = (p: [number, number], q: [number, number]) => {
    const [a1, b1] = p[0] < q[0] || (p[0] === q[0] && p[1] < q[1]) ? [p, q] : [q, p]
    segs.set(`${a1}-${b1}`, [a1[0], a1[1], b1[0], b1[1]])
  }
  if (a === 'cuadrados') {
    for (let i = 0; i < k; i++) {
      const x = 4 + i * L
      agregar([x, 4], [x + L, 4])
      agregar([x, 4 + L], [x + L, 4 + L])
      agregar([x, 4], [x, 4 + L])
      agregar([x + L, 4], [x + L, 4 + L])
    }
    for (const s of segs.values()) partes.push(palito(...s))
    return { cuerpo: partes.join(''), ancho: k * L + 8, alto: L + 8 }
  }
  const h = 40
  for (let i = 0; i < k; i++) {
    const j = Math.floor(i / 2)
    const b0: [number, number] = [4 + j * L, 4 + h]
    const b1: [number, number] = [4 + (j + 1) * L, 4 + h]
    const t0: [number, number] = [4 + L / 2 + j * L, 4]
    const t1: [number, number] = [4 + L / 2 + (j + 1) * L, 4]
    if (i % 2 === 0) {
      agregar(b0, b1)
      agregar(b0, t0)
      agregar(t0, b1)
    } else {
      agregar(t0, t1)
      agregar(t0, b1)
      agregar(b1, t1)
    }
  }
  for (const s of segs.values()) partes.push(palito(...s))
  return { cuerpo: partes.join(''), ancho: ((k + 1) * L) / 2 + 8, alto: h + 8 }
}

const ARREGLOS: Record<Arreglo, { f: (k: number) => number; frase: (q: string) => string; cuantos: (n: number) => string; con: (m: number) => string; nota: string; frecuentes: (n: number) => number[] }> = {
  mesas: {
    f: (k) => 2 * k + 2,
    frase: () => 'Para la fiesta patronal juntan mesas cuadradas en fila y ponen sillas alrededor.',
    cuantos: (n) => `¿Cuántas sillas se necesitan para ${n} mesas juntas?`,
    con: (m) => `Hay ${m} sillas. ¿Cuántas mesas hay que juntar en fila para usar todas las sillas?`,
    nota: 'Cada mesa más suma 2 sillas: 4, 6, 8… Sillas = 2 × mesas + 2.',
    frecuentes: (n) => [4 * n, 2 * n, 2 * n + 4, 2 * n + 1],
  },
  triangulos: {
    f: (k) => 2 * k + 1,
    frase: (q) => `${q} forma triángulos en fila con palitos de chupete.`,
    cuantos: (n) => `¿Cuántos palitos necesita para formar ${n} triángulos?`,
    con: (m) => `Tiene ${m} palitos. ¿Cuántos triángulos en fila puede formar usando todos?`,
    nota: 'Cada triángulo más suma 2 palitos: 3, 5, 7… Palitos = 2 × triángulos + 1.',
    frecuentes: (n) => [3 * n, 2 * n, 2 * n + 3, 2 * n - 1],
  },
  cuadrados: {
    f: (k) => 3 * k + 1,
    frase: (q) => `${q} forma cuadrados en fila con palitos de chupete.`,
    cuantos: (n) => `¿Cuántos palitos necesita para formar ${n} cuadrados?`,
    con: (m) => `Tiene ${m} palitos. ¿Cuántos cuadrados en fila puede formar usando todos?`,
    nota: 'Cada cuadrado más suma 3 palitos: 4, 7, 10… Palitos = 3 × cuadrados + 1.',
    frecuentes: (n) => [4 * n, 3 * n, 3 * n + 4, 3 * n - 2],
  },
}

export const mesas: TipoPregunta = {
  id: 're-mesas',
  nombre: 'Figuras que crecen',
  queHacen: 'Descubren cómo crece un patrón de figuras (mesas con sillas, triángulos o cuadrados con palitos) y calculan una figura lejana.',
  citas: { [P4]: CITA_REGLA },
  area: 'matematica',
  competencia: 2,
  cambia: 'numeros',
  generar({ azar }) {
    const a = elegir(azar, ['mesas', 'triangulos', 'cuadrados'] as Arreglo[])
    const A = ARREGLOS[a]
    const figs = [1, 2, 3].map((k) => figuraArreglo(a, k))
    const GAP = 54
    const ancho = figs.reduce((s, f) => s + f.ancho, 0) + 2 * GAP + 16
    const altoF = Math.max(...figs.map((f) => f.alto))
    let x = 8
    const cuerpo = figs
      .map((f, i) => {
        const g = desplazar(f.cuerpo, x, 8 + (altoF - f.alto) / 2) + texto(x + f.ancho / 2, 8 + altoF + 22, `Figura ${i + 1}`, { tam: 15, peso: 700 })
        x += f.ancho + GAP
        return g
      })
      .join('')
    const dibujo = svg(ancho, altoF + 42, cuerpo, `Figuras 1, 2 y 3 de un patrón de ${a === 'mesas' ? 'mesas con sillas' : `${a} hechos con palitos`}: ${[1, 2, 3].map(A.f).join(', ')}`)
    const enunciado = A.frase(nombre(azar))
    // Pasos: cuánto suma cada figura (d) y lo que hay desde el inicio (b), leídos de las figuras 1, 2 y 3.
    const [nFigs, cosas] = a === 'mesas' ? ['mesas', 'sillas'] : a === 'triangulos' ? ['triángulos', 'palitos'] : ['cuadrados', 'palitos']
    const d = A.f(2) - A.f(1)
    const b = A.f(0)
    const leer = [`Figuras 1, 2 y 3: ${A.f(1)}, ${A.f(2)} y ${A.f(3)} ${cosas}; cada vez ${d} más.`, `${mayuscula(cosas)} = ${d} × ${nFigs} + ${b}`]
    if (azar() < 0.65) {
      const n = entero(azar, 5, 12)
      const alt = opcionesNum(azar, A.f(n), A.frecuentes(n))
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `figuras:${a}:n${n}`,
        enunciado,
        dibujo,
        pregunta: A.cuantos(n),
        ...alt,
        nota: A.nota,
        pasos: [...leer, `Para ${n} ${nFigs}: ${d} × ${n} + ${b} = ${num(A.f(n))} ${cosas}`],
      }
    }
    const n = entero(azar, 6, 15)
    const m = A.f(n)
    const alt = opcionesNum(azar, n, [Math.round(m / 4), Math.floor(m / 2), Math.floor(m / 3), n + 1, n - 1, n + 2])
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `figuras:${a}:m${m}`,
      enunciado,
      dibujo,
      pregunta: A.con(m),
      ...alt,
      nota: A.nota,
      pasos: [...leer, `Sin ${a === 'mesas' ? `las ${b} sillas de las puntas` : 'el primer palito'}: ${m} − ${b} = ${m - b}`, `${m - b} ÷ ${d} = ${num(n)} ${nFigs}`],
    }
  },
}

// ---------- La balanza ----------

type Fruta = 'sandia' | 'pina' | 'melon' | 'papaya' | 'manzana' | 'naranja' | 'limon'
const FRUTAS: Record<Fruta, { uno: string; varios: string; fem: boolean; tam: [number, number]; dibujar: (cx: number, b: number) => string }> = {
  sandia: {
    uno: 'sandía',
    fem: true,
    varios: 'sandías',
    tam: [60, 40],
    dibujar: (cx, b) =>
      elipse(cx, b - 20, 29, 19, { relleno: VERDE, grosor: 1.8 }) +
      [-14, 0, 14].map((d) => ruta(`M${cx + d},${b - 37} Q${cx + d * 1.6},${b - 20} ${cx + d},${b - 3}`, { trazo: '#5f7d55', grosor: 1.6 })).join(''),
  },
  pina: {
    uno: 'piña',
    fem: true,
    varios: 'piñas',
    tam: [30, 50],
    dibujar: (cx, b) =>
      poligono([[cx - 7, b - 30], [cx - 13, b - 47], [cx - 2, b - 33]], { relleno: VERDE, grosor: 1.4 }) +
      poligono([[cx - 3, b - 32], [cx, b - 50], [cx + 3, b - 32]], { relleno: VERDE, grosor: 1.4 }) +
      poligono([[cx + 2, b - 33], [cx + 13, b - 47], [cx + 7, b - 30]], { relleno: VERDE, grosor: 1.4 }) +
      elipse(cx, b - 16, 13, 16, { relleno: '#f1dc9c', grosor: 1.8 }) +
      ruta(`M${cx - 9},${b - 25} L${cx + 7},${b - 7} M${cx - 3},${b - 30} L${cx + 11},${b - 15} M${cx + 9},${b - 25} L${cx - 7},${b - 7} M${cx + 3},${b - 30} L${cx - 11},${b - 15}`, { trazo: '#9a8240', grosor: 1.4 }),
  },
  melon: {
    uno: 'melón',
    fem: false,
    varios: 'melones',
    tam: [38, 36],
    dibujar: (cx, b) =>
      circulo(cx, b - 17, 17, { relleno: '#e9efcf', grosor: 1.8 }) +
      ruta(`M${cx - 8},${b - 32} Q${cx - 14},${b - 17} ${cx - 8},${b - 2} M${cx + 8},${b - 32} Q${cx + 14},${b - 17} ${cx + 8},${b - 2}`, { trazo: GRIS, grosor: 1.4 }),
  },
  papaya: {
    uno: 'papaya',
    fem: true,
    varios: 'papayas',
    tam: [48, 26],
    dibujar: (cx, b) => elipse(cx, b - 12, 23, 12, { relleno: '#f3d9a6', grosor: 1.8 }) + linea(cx + 21, b - 14, cx + 27, b - 18, { grosor: 2 }),
  },
  manzana: {
    uno: 'manzana',
    fem: true,
    varios: 'manzanas',
    tam: [30, 32],
    dibujar: (cx, b) =>
      ruta(`M${cx},${b - 22} C${cx - 6},${b - 28} ${cx - 15},${b - 24} ${cx - 14},${b - 13} C${cx - 13},${b - 3} ${cx - 6},${b + 1} ${cx},${b - 3} C${cx + 6},${b + 1} ${cx + 13},${b - 3} ${cx + 14},${b - 13} C${cx + 15},${b - 24} ${cx + 6},${b - 28} ${cx},${b - 22} Z`, {
        relleno: '#f2c9c4',
        grosor: 1.8,
      }) +
      linea(cx, b - 22, cx + 2, b - 30, { grosor: 1.8 }) +
      elipse(cx + 7, b - 28, 5, 2.5, { relleno: VERDE, grosor: 1.4 }),
  },
  naranja: {
    uno: 'naranja',
    fem: true,
    varios: 'naranjas',
    tam: [28, 30],
    dibujar: (cx, b) => circulo(cx, b - 13, 13, { relleno: '#f7dcb9', grosor: 1.8 }) + elipse(cx + 4, b - 27, 5, 2.5, { relleno: VERDE, grosor: 1.4 }) + circulo(cx, b - 25, 1.2, { relleno: TINTA, grosor: 1.4 }),
  },
  limon: {
    uno: 'limón',
    fem: false,
    varios: 'limones',
    tam: [28, 20],
    dibujar: (cx, b) =>
      ruta(`M${cx - 13},${b - 9} Q${cx - 10},${b - 19} ${cx},${b - 18} Q${cx + 10},${b - 19} ${cx + 13},${b - 9} Q${cx + 10},${b + 1} ${cx},${b} Q${cx - 10},${b + 1} ${cx - 13},${b - 9} Z`, { relleno: '#eef3c2', grosor: 1.8 }),
  },
}

const cuantosDe = (f: Fruta) => (FRUTAS[f].fem ? '¿Cuántas' : '¿Cuántos')
const unaDe = (f: Fruta) => `${FRUTAS[f].fem ? 'una' : 'un'} ${FRUTAS[f].uno}`
const laDe = (f: Fruta) => `${FRUTAS[f].fem ? 'la' : 'el'} ${FRUTAS[f].uno}`

type Cosa =
  | { k: 'pesa'; v: number; u: 'kg' | 'g' }
  | { k: 'caja'; r?: string }
  | { k: 'bolsa'; r?: string }
  | { k: 'lata' }
  | { k: 'fruta'; f: Fruta }
  | { k: 'tarjeta'; t: string }

const pesa = (v: number, u: 'kg' | 'g' = 'kg'): Cosa => ({ k: 'pesa', v, u })
const pesas = (vs: number[], u: 'kg' | 'g' = 'kg') => vs.map((v) => pesa(v, u))
const frutas = (f: Fruta, n: number): Cosa[] => Array.from({ length: n }, () => ({ k: 'fruta', f }))

function tamCosa(c: Cosa): [number, number] {
  if (c.k === 'pesa') return [Math.max(40, anchoTexto(`${c.v} ${c.u}`, 13) + 16), 34]
  if (c.k === 'caja') return [c.r && c.r !== '?' ? Math.max(42, anchoTexto(c.r, 14) + 14) : 42, 40]
  if (c.k === 'bolsa') return [44, 46]
  if (c.k === 'lata') return [24, 32]
  if (c.k === 'tarjeta') return [Math.max(56, anchoTexto(c.t, 17) + 22), 36]
  return FRUTAS[c.f].tam
}

/** Cada cosa se dibuja apoyada en (cx, b): b es el piso. */
function dibujarCosa(c: Cosa, cx: number, b: number): string {
  const [w, h] = tamCosa(c)
  if (c.k === 'pesa') {
    return (
      rect(cx - 7, b - h, 14, 8, { relleno: '#c4c4c4', grosor: 1.4, redondeo: 3 }) +
      poligono([[cx - w / 2, b], [cx + w / 2, b], [cx + w / 2 - 5, b - 26], [cx - w / 2 + 5, b - 26]], { relleno: '#d6d6d6', grosor: 1.6 }) +
      texto(cx, b - 12, `${c.v} ${c.u}`, { tam: 13, peso: 700 })
    )
  }
  if (c.k === 'caja')
    return rect(cx - w / 2, b - h, w, h, { relleno: MADERA, grosor: 1.8, redondeo: 2 }) + linea(cx - w / 2, b - h + 9, cx + w / 2, b - h + 9, { grosor: 1.4 }) + texto(cx, b - 15, c.r ?? '?', { tam: c.r && c.r !== '?' ? 14 : 20, peso: 700 })
  if (c.k === 'bolsa')
    return (
      ruta(`M${cx - 19},${b} Q${cx - 24},${b - 30} ${cx - 8},${b - 37} L${cx - 11},${b - 45} L${cx + 11},${b - 45} L${cx + 8},${b - 37} Q${cx + 24},${b - 30} ${cx + 19},${b} Z`, { relleno: '#efe6d2', grosor: 1.8 }) +
      linea(cx - 9, b - 37, cx + 9, b - 37, { grosor: 1.8 }) +
      texto(cx, b - 16, c.r ?? '?', { tam: 18, peso: 700 })
    )
  if (c.k === 'lata') return rect(cx - 12, b - 30, 24, 30, { relleno: '#dcdcdc', grosor: 1.6, redondeo: 2 }) + elipse(cx, b - 30, 12, 3, { relleno: '#efefef', grosor: 1.4 }) + linea(cx - 12, b - 18, cx + 12, b - 18, { trazo: GRIS, grosor: 1.4 })
  if (c.k === 'tarjeta') return rect(cx - w / 2, b - h, w, h, { relleno: BLANCO, grosor: 1.8, redondeo: 5 }) + texto(cx, b - h / 2, c.t, { tam: 17, peso: 700 })
  return FRUTAS[c.f].dibujar(cx, b)
}

/** Acomoda las cosas en filas sobre el platillo (la de abajo, la más llena). */
function apilar(cosas: Cosa[], max = 118) {
  const filas: { cosas: Cosa[]; w: number; h: number }[] = []
  for (const c of cosas) {
    const [w, h] = tamCosa(c)
    const f = filas[filas.length - 1]
    if (f && f.w + 4 + w <= max) {
      f.cosas.push(c)
      f.w += 4 + w
      f.h = Math.max(f.h, h)
    } else filas.push({ cosas: [c], w, h })
  }
  return { filas, alto: filas.reduce((s, f) => s + f.h + 2, 0) }
}

/** Balanza de dos platillos en equilibrio, con las cosas encima y (opcional) un rótulo debajo de cada lado. */
function balanza(izq: Cosa[], der: Cosa[], { ancho = 280, rotulos }: { ancho?: number; rotulos?: [string, string] } = {}): Pieza {
  const PW = 122
  const cx = ancho / 2
  const brazo = cx - PW / 2 - 6
  const lados = [apilar(izq), apilar(der)]
  const py = 6 + Math.max(lados[0].alto, lados[1].alto, 30)
  const by = py + 22
  const baseY = by + 42
  const partes: string[] = []
  lados.forEach((lado, i) => {
    const x = cx + (i ? brazo : -brazo)
    let piso = py
    for (const f of lado.filas) {
      let xi = x - f.w / 2
      for (const c of f.cosas) {
        const [w] = tamCosa(c)
        partes.push(dibujarCosa(c, xi + w / 2, piso))
        xi += w + 4
      }
      piso -= f.h + 2
    }
    partes.push(ruta(`M${x - PW / 2},${py} L${x + PW / 2},${py} L${x + PW / 2 - 10},${py + 8} L${x - PW / 2 + 10},${py + 8} Z`, { relleno: '#e4e4e4', grosor: 1.8 }))
    partes.push(rect(x - 3, py + 8, 6, by - py - 8, { relleno: '#cfcfcf', grosor: 1.4 }))
    if (rotulos) partes.push(texto(x, baseY + 30, rotulos[i], { tam: 15, peso: 700 }))
  })
  partes.push(
    rect(cx - 5, by + 8, 10, baseY - by - 8, { relleno: '#d6d6d6', grosor: 1.6 }),
    rect(cx - brazo - 12, by, 2 * brazo + 24, 8, { relleno: '#bdbdbd', grosor: 1.6, redondeo: 3 }),
    poligono([[cx - 6, by], [cx + 6, by], [cx, by - 12]], { relleno: '#9a9a9a', grosor: 1.4 }),
    circulo(cx, by + 4, 3, { relleno: BLANCO, grosor: 1.4 }),
    poligono([[cx - 48, baseY + 12], [cx + 48, baseY + 12], [cx + 30, baseY], [cx - 30, baseY]], { relleno: '#d6d6d6', grosor: 1.6 }),
  )
  return { cuerpo: partes.join(''), ancho, alto: baseY + 12 + (rotulos ? 30 : 4) }
}

const describirLado = (cs: Cosa[]) =>
  cs
    .map((c) => (c.k === 'pesa' ? `pesa de ${c.v} ${c.u}` : c.k === 'caja' ? 'caja' : c.k === 'bolsa' ? 'bolsa' : c.k === 'lata' ? 'lata' : c.k === 'tarjeta' ? `tarjeta ${c.t}` : FRUTAS[c.f].uno))
    .join(', ')

function dibujoBalanza(izq: Cosa[], der: Cosa[], o: { rotulos?: [string, string] } = {}) {
  const b = balanza(izq, der, o)
  return svg(b.ancho + 8, b.alto + 4, desplazar(b.cuerpo, 4, 0), `Balanza en equilibrio. Izquierda: ${describirLado(izq)}. Derecha: ${describirLado(der)}`)
}

/** Las pesas que forman un peso: de mayor a menor, como las pondría la casera. */
function enPesas(total: number, u: 'kg' | 'g', max = 3): number[] | null {
  const den = u === 'kg' ? [20, 10, 5, 2, 1] : [500, 200, 100, 50]
  const r: number[] = []
  let x = total
  for (const d of den)
    while (x >= d) {
      r.push(d)
      x -= d
    }
  return x === 0 && r.length <= max ? r : null
}

// ---------- 7. ¿Cuánto pesa la caja? (término desconocido) ----------

export const balanzaCaja: TipoPregunta = {
  id: 're-balanza',
  nombre: '¿Cuánto pesa la caja?',
  queHacen: 'Miran una balanza en equilibrio con cajas y pesas, y encuentran cuánto pesa la caja (el término desconocido).',
  citas: { [P4]: CITA_INCOGNITA },
  area: 'matematica',
  competencia: 2,
  cambia: 'numeros',
  generar({ azar }) {
    const quien = nombre(azar)
    const modo = azar()
    if (modo < 0.35) {
      // Varias cajas iguales: se reparte el peso.
      const { k, c, der } = hasta(() => {
        const k = entero(azar, 2, 4)
        const c = entero(azar, 2, 8)
        const der = enPesas(k * c, 'kg', 4)
        return der ? { k, c, der } : null
      })
      const T = k * c
      const alt = opcionesNum(azar, c, [T, T - k, k === 2 ? c + 2 : T / (k - 1), T / 2, c + 1, c - 1].filter(Number.isInteger), { despues: ' kg' })
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `cajas:${k}:${c}`,
        enunciado: `En la bodega, ${quien} pesa ${k} cajas iguales de fideos. La balanza está en equilibrio.`,
        dibujo: dibujoBalanza(Array.from({ length: k }, () => ({ k: 'caja', r: '?' })), pesas(der)),
        pregunta: `Las ${k} cajas pesan lo mismo. ¿Cuánto pesa cada caja?`,
        ...alt,
        nota: `${num(T)} kg repartidos en ${k} cajas: ${num(T)} ÷ ${k} = ${c} kg.`,
        pasos: [`En el otro platillo: ${sumaPesas(der, 'kg')}`, `Las ${k} cajas pesan ${num(T)} kg en total.`, `Cada caja: ${num(T)} ÷ ${k} = ${num(c)} kg`],
      }
    }
    const u: 'kg' | 'g' = azar() < 0.65 ? 'kg' : 'g'
    const { c, a, izqP, derP } = hasta(() => {
      const c = u === 'kg' ? entero(azar, 2, 15) : 50 * entero(azar, 2, 16)
      const a = u === 'kg' ? entero(azar, 1, 9) : 50 * entero(azar, 1, 8)
      const izqP = enPesas(a, u, 2)
      const derP = enPesas(c + a, u, 3)
      return izqP && derP ? { c, a, izqP, derP } : null
    })
    const izq: Cosa[] = [{ k: 'caja', r: '?' }, ...pesas(izqP, u)]
    const dibujo = dibujoBalanza(izq, pesas(derP, u))
    const enunciado = `${quien} ayuda en un puesto del mercado. Puso una caja y unas pesas en la balanza, y quedó en equilibrio.`
    const pasos = [
      `Junto a la caja: ${sumaPesas(izqP, u)}`,
      `En el otro platillo: ${sumaPesas(derP, u)}`,
      `Igualdad: ▢ + ${num(a)} = ${num(c + a)}`,
      `La caja pesa ${num(c + a)} − ${num(a)} = ${num(c)} ${u}`,
    ]
    if (modo < 0.55) {
      return {
        forma: 'abierta',
        clave: `caja:${c}:${a}:${u}`,
        enunciado,
        dibujo,
        pregunta: 'Escribe una igualdad para la balanza, usando ▢ para el peso de la caja. Luego, escribe cuánto pesa la caja.',
        respuesta: `▢ + ${num(a)} = ${num(c + a)}; la caja pesa ${num(c)} ${u}.`,
        espacio: 'renglones',
        pasos,
      }
    }
    const paso = u === 'kg' ? 1 : 50
    const alt = opcionesNum(azar, c, [c + 2 * a, c + a, c + paso, c - paso, a, c + 2 * paso], { paso, despues: ` ${u}` })
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `caja:${c}:${a}:${u}`,
      enunciado,
      dibujo,
      pregunta: '¿Cuánto pesa la caja?',
      ...alt,
      nota: `▢ + ${num(a)} = ${num(c + a)}, entonces la caja pesa ${num(c + a)} − ${num(a)} = ${num(c)} ${u}.`,
      pasos,
    }
  },
}

// ---------- La pizarra (igualdades con casilla o ícono) ----------

type Icono = 'estrella' | 'corazon' | 'triangulo' | 'rombo'
const ICONOS: Record<Icono, string> = { estrella: 'la estrella', corazon: 'el corazón', triangulo: 'el triángulo', rombo: 'el rombo' }
const ICONOS_VARIOS: Record<Icono, string> = { estrella: 'estrellas', corazon: 'corazones', triangulo: 'triángulos', rombo: 'rombos' }

function dibujarIcono(i: Icono, cx: number, cy: number) {
  const t = { relleno: '#d0d0d0', grosor: 2 }
  if (i === 'estrella') return estrella(cx, cy + 2, 22, t)
  if (i === 'corazon') return ruta(`M${cx},${cy + 18} C${cx - 30},${cy - 2} ${cx - 14},${cy - 26} ${cx},${cy - 10} C${cx + 14},${cy - 26} ${cx + 30},${cy - 2} ${cx},${cy + 18} Z`, t)
  if (i === 'triangulo') return poligono([[cx, cy - 19], [cx + 21, cy + 17], [cx - 21, cy + 17]], t)
  return poligono([[cx, cy - 21], [cx + 18, cy], [cx, cy + 21], [cx - 18, cy]], t)
}

type Ficha = { t: 'n'; s: string } | { t: 'caja'; s?: string } | { t: 'icono'; i: Icono }
const n_ = (s: string | number): Ficha => ({ t: 'n', s: typeof s === 'number' ? num(s) : s })

/** Una pizarra blanca con una igualdad escrita: números, signos, casillas e íconos. */
function pizarra(fichas: Ficha[], tam = 32): Pieza {
  const GAP = 14
  const anchoDe = (f: Ficha) => (f.t === 'n' ? anchoTexto(f.s, tam) : f.t === 'caja' ? 62 : 48)
  const total = fichas.reduce((s, f) => s + anchoDe(f), 0) + GAP * (fichas.length - 1)
  const W = Math.max(260, total + 60)
  const partes = [rect(0, 0, W, 100, { relleno: BLANCO, grosor: 3, redondeo: 6 }), rect(7, 7, W - 14, 86, { trazo: CLARO, grosor: 1.4, redondeo: 4 }), rect(W / 2 - 60, 100, 120, 7, { relleno: '#cfcfcf', grosor: 1.4, redondeo: 2 })]
  let x = (W - total) / 2
  for (const f of fichas) {
    const w = anchoDe(f)
    if (f.t === 'n') partes.push(texto(x + w / 2, 52, f.s, { tam, peso: 700 }))
    else if (f.t === 'caja') {
      partes.push(casilla(x, 30, w, 44))
      if (f.s) partes.push(texto(x + w / 2, 53, f.s, { tam: 26, color: '#3a3a3a' }))
    } else partes.push(dibujarIcono(f.i, x + w / 2, 50))
    x += w + GAP
  }
  return { cuerpo: partes.join(''), ancho: W, alto: 108 }
}

const textoFichas = (fs: Ficha[]) => fs.map((f) => (f.t === 'n' ? f.s : f.t === 'caja' ? (f.s ? `[${f.s}]` : '▢') : ICONOS[f.i])).join(' ')

function dibujoPizarra(fichas: Ficha[]) {
  const p = pizarra(fichas)
  return svg(p.ancho + 8, p.alto + 6, desplazar(p.cuerpo, 4, 2), `Pizarra con la igualdad: ${textoFichas(fichas)}`)
}

// ---------- 8. ¿Qué número esconde el ícono? (término desconocido) ----------

/** Modelo de barras: la barra partida en sus partes y una llave con el total. */
function barras(partes: { txt: string; w: number; nota?: string }[], total: string, totalArriba: boolean): Pieza {
  const x0 = 20
  const W = partes.reduce((s, p) => s + p.w, 0)
  const yb = totalArriba ? 48 : 8
  const H = 52
  const out: string[] = []
  let x = x0
  for (const p of partes) {
    out.push(rect(x, yb, p.w, H, { relleno: p.txt === '?' ? BLANCO : '#e6e6e6', grosor: 1.8 }))
    out.push(texto(x + p.w / 2, yb + (p.nota ? 19 : H / 2), p.txt, { tam: 19, peso: 700 }))
    if (p.nota) out.push(texto(x + p.w / 2, yb + 39, p.nota, { tam: 13 }))
    x += p.w
  }
  const x1 = x0 + W
  const m = x0 + W / 2
  const yl = totalArriba ? yb - 6 : yb + H + 6
  const s = totalArriba ? -1 : 1
  out.push(ruta(`M${x0},${yl} Q${x0},${yl + s * 10} ${x0 + 10},${yl + s * 10} L${m - 10},${yl + s * 10} Q${m},${yl + s * 10} ${m},${yl + s * 20} Q${m},${yl + s * 10} ${m + 10},${yl + s * 10} L${x1 - 10},${yl + s * 10} Q${x1},${yl + s * 10} ${x1},${yl}`, { grosor: 1.8 }))
  out.push(texto(m, yl + s * 32, total, { tam: 19, peso: 700 }))
  return { cuerpo: out.join(''), ancho: W + 40, alto: H + 56 + 8 }
}

/** Anchos proporcionales a los valores, sin partes demasiado angostas para su rótulo. */
const anchos = (vs: number[], W = 420, min = 110) => {
  const t = vs.reduce((s, v) => s + v, 0)
  return vs.map((v) => Math.max(min, (W * v) / t))
}

export const icono: TipoPregunta = {
  id: 're-icono',
  nombre: '¿Qué número esconde el ícono?',
  queHacen: 'Escriben con un ícono la igualdad de una situación o encuentran el número que esconde el ícono en una igualdad.',
  citas: { [P4]: CITA_INCOGNITA },
  area: 'matematica',
  competencia: 2,
  cambia: 'numeros',
  generar({ azar }) {
    const quien = nombre(azar)
    const modo = azar()
    if (modo < 0.35) {
      // De la situación a la igualdad, con el modelo de barras.
      const caso = elegir(azar, ['regalan', 'gasto', 'reparte', 'precio'])
      let enunciado: string
      let correcta: string
      let malas: string[]
      let b: Pieza
      let clave: string
      // Primer paso: qué dice la barra, en palabras; el segundo es la igualdad.
      let lectura: string
      if (caso === 'regalan' || caso === 'gasto') {
        const a = entero(azar, 12, 60)
        const x = entero(azar, 15, 90)
        if (caso === 'regalan') {
          const t = x + a
          enunciado = `${quien} tenía algunas figuritas. Le regalaron ${a} y ahora tiene ${t}.`
          correcta = `▢ + ${a} = ${t}`
          malas = [`${a} + ${t} = ▢`, `▢ − ${a} = ${t}`, `▢ + ${t} = ${a}`]
          const [w1, w2] = anchos([x, a])
          b = barras([{ txt: '?', w: w1, nota: 'tenía' }, { txt: String(a), w: w2, nota: 'le regalaron' }], `${t} ahora`, false)
          clave = `icono-situacion:regalan:${a}:${t}`
          lectura = `Lo que tenía (▢) más las ${a} que le regalaron es lo que tiene ahora: ${t}.`
        } else {
          enunciado = `${quien} tenía algunos soles. Gastó S/ ${a} en el quiosco y le quedaron S/ ${x}.`
          correcta = `▢ − ${a} = ${x}`
          malas = [`▢ + ${a} = ${x}`, `${x} − ${a} = ▢`, `${a} − ▢ = ${x}`]
          const [w1, w2] = anchos([a, x])
          b = barras([{ txt: `S/ ${a}`, w: w1, nota: 'gastó' }, { txt: `S/ ${x}`, w: w2, nota: 'le quedó' }], '? tenía', true)
          clave = `icono-situacion:gasto:${a}:${x}`
          lectura = `Lo que tenía (▢) menos lo que gastó, S/ ${a}, es lo que le quedó: S/ ${x}.`
        }
        if (a === x) return null
      } else {
        const k = entero(azar, 2, 5)
        const p = entero(azar, 3, 12)
        const partes = Array.from({ length: k }, () => ({ txt: caso === 'reparte' ? String(p) : '?', w: 84 }))
        if (caso === 'reparte') {
          enunciado = `${quien} repartió unos caramelos en ${k} bolsitas, sin que sobre ninguno. Cada bolsita tiene ${p} caramelos.`
          correcta = `▢ ÷ ${k} = ${p}`
          malas = [`▢ × ${k} = ${p}`, `${p} ÷ ${k} = ▢`, `▢ − ${k} = ${p}`]
          b = barras(partes, '? caramelos', true)
          lectura = `Todos los caramelos (▢) repartidos en ${k} bolsitas dan ${p} en cada una.`
        } else {
          enunciado = `${quien} compró ${k} cuadernos iguales y pagó S/ ${k * p} en total.`
          correcta = `${k} × ▢ = ${k * p}`
          malas = [`▢ ÷ ${k} = ${k * p}`, `${k * p} × ${k} = ▢`, `▢ + ${k} = ${k * p}`]
          b = barras(partes, `S/ ${k * p}`, false)
          lectura = `${k} veces el precio de un cuaderno (▢) es lo que pagó: S/ ${k * p}.`
        }
        clave = `icono-situacion:${caso}:${k}:${p}`
      }
      const alt = opcionesTexto(azar, correcta, malas)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave,
        enunciado,
        dibujo: svg(b.ancho, b.alto, b.cuerpo, `Modelo de barras de la situación: ${enunciado}`),
        pregunta: '¿Qué igualdad representa la situación? (▢ es el número que no sabemos).',
        ...alt,
        pasos: [lectura, `Igualdad: ${correcta}`],
      }
    }
    const ic = elegir(azar, Object.keys(ICONOS) as Icono[])
    const nombreIc = ICONOS[ic]
    if (modo < 0.65) {
      // ★ + ★ + ★ = 36
      const k = entero(azar, 2, 4)
      const x = entero(azar, 6, 40)
      const T = k * x
      const fichas: Ficha[] = []
      for (let i = 0; i < k; i++) fichas.push(...(i ? [n_('+')] : []), { t: 'icono', i: ic })
      fichas.push(n_('='), n_(T))
      const alt = opcionesNum(azar, x, [k > 2 ? T / 2 : T - k, T - k, T / (k - 1), T / (k + 1), x + 2, x - 2, x + 10].filter((y) => Number.isInteger(y) && y !== T))
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `icono-repite:${ic}:${k}:${x}`,
        enunciado: `En la pizarra, cada ícono igual esconde el mismo número.`,
        dibujo: dibujoPizarra(fichas),
        pregunta: `¿Qué número esconde ${nombreIc}?`,
        ...alt,
        nota: `${num(T)} ÷ ${k} = ${x}.`,
        pasos: [
          `En la pizarra, ${k} ${ICONOS_VARIOS[ic]} iguales suman ${num(T)}.`,
          `${num(T)} ÷ ${k} = ${num(x)}; comprueba: ${Array.from({ length: k }, () => num(x)).join(' + ')} = ${num(T)}`,
          `${mayuscula(nombreIc)} esconde ${num(x)}.`,
        ],
      }
    }
    // ★ + 25 = 80, ★ − 18 = 30, 25 + ★ = 80
    const op = elegir(azar, ['+', '+', '−', '+izq'])
    const x = entero(azar, 15, 600)
    const a = entero(azar, 12, 400)
    const t = op === '−' ? x - a : x + a
    if (t < 5 || t > 9999 || a === x || a === t) return null
    const fichas: Ficha[] = op === '+izq' ? [n_(a), n_('+'), { t: 'icono', i: ic }, n_('='), n_(t)] : [{ t: 'icono', i: ic }, n_(op === '−' ? '−' : '+'), n_(a), n_('='), n_(t)]
    const frecuentes = op === '−' ? [t - a, x + 10, x - 10, x + 100, t, x - 100] : [t + a, x + 10, x - 10, x + 100, t, x - 100]
    const alt = opcionesNum(azar, x, frecuentes)
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `icono:${op}:${x}:${a}`,
      enunciado: `${quien} escribió en la pizarra una igualdad con un ícono.`,
      dibujo: dibujoPizarra(fichas),
      pregunta: `¿Qué número esconde ${nombreIc}?`,
      ...alt,
      nota: op === '−' ? `${num(t)} + ${num(a)} = ${num(x)}.` : `${num(t)} − ${num(a)} = ${num(x)}.`,
      pasos: [
        `En la pizarra: ${op === '+izq' ? `${num(a)} + ${nombreIc}` : `${nombreIc} ${op === '−' ? '−' : '+'} ${num(a)}`} = ${num(t)}`,
        `Para hallar el número: ${op === '−' ? `${num(t)} + ${num(a)}` : `${num(t)} − ${num(a)}`} = ${num(x)}`,
        `${mayuscula(nombreIc)} esconde ${num(x)}: ${op === '+izq' ? `${num(a)} + ${num(x)}` : `${num(x)} ${op === '−' ? '−' : '+'} ${num(a)}`} = ${num(t)}`,
      ],
    }
  },
}

// ---------- 9. El signo igual ----------

type Igualdad = { fichas: Ficha[]; x: number; resultado: number; c: number; texto: string; op: string; datos: number[] }

/** Una igualdad con casilla en la que el resultado del lado izquierdo NO es lo que va en la casilla. */
function igualdadConCasilla(azar: Azar): Igualdad {
  return hasta(() => {
    const op = elegir(azar, ['+', '+', '+der', '−', '×'])
    if (op === '×') {
      const a = entero(azar, 2, 9)
      const b = entero(azar, 2, 9)
      const P = a * b
      const divs = [2, 3, 4, 5, 6, 7, 8, 9].filter((c) => P % c === 0 && c !== a && c !== b && P / c >= 2 && P / c <= 12 && P / c !== a && P / c !== b)
      if (!divs.length) return null
      const c = elegir(azar, divs)
      const x = P / c
      return { fichas: [n_(a), n_('×'), n_(b), n_('='), { t: 'caja' }, n_('×'), n_(c)], x, resultado: P, c, texto: `${a} × ${b} = ▢ × ${c}`, op, datos: [a, b, c] }
    }
    const e = elegir(azar, [1, 5, 5, 10])
    if (op === '−') {
      const a = e * entero(azar, 6, 19)
      const b = e * entero(azar, 1, Math.floor(a / e) - 2)
      const c = e * entero(azar, 1, 8)
      const d = a - b
      const x = d + c
      if (new Set([a, b, c, x, d]).size < 5) return null
      return { fichas: [n_(a), n_('−'), n_(b), n_('='), { t: 'caja' }, n_('−'), n_(c)], x, resultado: d, c, texto: `${a} − ${b} = ▢ − ${c}`, op, datos: [a, b, c] }
    }
    const a = e * entero(azar, 3, 18)
    const b = e * entero(azar, 2, 12)
    const s = a + b
    const c = e * entero(azar, 1, s / e - 1)
    const x = s - c
    if (new Set([a, b, c, x]).size < 4 || x < 2) return null
    const fichas: Ficha[] = op === '+der' ? [n_(a), n_('+'), n_(b), n_('='), n_(c), n_('+'), { t: 'caja' }] : [n_(a), n_('+'), n_(b), n_('='), { t: 'caja' }, n_('+'), n_(c)]
    return { fichas, x, resultado: s, c, texto: op === '+der' ? `${a} + ${b} = ${c} + ▢` : `${a} + ${b} = ▢ + ${c}`, op, datos: [a, b, c] }
  })
}

const lado = (a: number, op: string, b: number) => (op === '+' ? a + b : op === '−' ? a - b : a * b)

export const signoIgual: TipoPregunta = {
  id: 're-signo-igual',
  nombre: 'El signo igual',
  queHacen: 'Completan igualdades como 30 + 15 = ▢ + 20, sabiendo que el signo igual dice que los dos lados valen lo mismo (no que viene el resultado).',
  citas: { [P4]: CITA_SIGNO },
  area: 'matematica',
  competencia: 2,
  cambia: 'numeros',
  generar({ azar }) {
    const quien = nombre(azar)
    const modo = azar()
    if (modo < 0.25) {
      // ¿Qué igualdad es verdadera? Solo una lo es.
      const op = azar() < 0.7 ? '+' : '−'
      return hasta(() => {
        const a = op === '+' ? entero(azar, 12, 60) : entero(azar, 40, 95)
        const b = op === '+' ? entero(azar, 8, 45) : entero(azar, 5, a - 15)
        const s = lado(a, op, b)
        const c = op === '+' ? entero(azar, 5, s - 5) : entero(azar, s + 5, s + 60)
        const d = op === '+' ? s - c : c - s
        if (new Set([a, b, c, d]).size < 4) return null
        const izq = `${a} ${op} ${b}`
        const forma = (p: number, q: number) => ({ t: `${izq} = ${p} ${op} ${q}`, ok: lado(p, op, q) === s, valida: p > 0 && q > 0 && (op === '+' || p > q) })
        // Seguir con el resultado (el error más frecuente), un lado que se pasa o le falta, y los números cambiados.
        const cands = op === '+' ? [forma(s, d), forma(c, d + 10), forma(c + 1, d + 1), forma(b, c)] : [forma(s, d), forma(c, d + 10), forma(c + 1, d - 1), forma(c, b)]
        const malas = cands.filter((x) => x.valida && !x.ok).map((x) => x.t)
        const alt = opcionesTexto(azar, `${izq} = ${c} ${op} ${d}`, malas)
        if (!alt) return null
        const g: Generado = {
          forma: 'opciones',
          clave: `signo-verdadera:${izq}:${c}`,
          enunciado: `${quien} escribió cuatro igualdades en su cuaderno, pero solo una es verdadera.`,
          pregunta: '¿Cuál es la igualdad verdadera?',
          ...alt,
          nota: `${izq} = ${s} y ${c} ${op} ${d} = ${s}: los dos lados valen lo mismo.`,
          pasos: [`Lado izquierdo: ${izq} = ${s}`, `Solo en una el lado derecho también da ${s}: ${c} ${op} ${d} = ${s}`, `Es verdadera: ${izq} = ${c} ${op} ${d}`],
        }
        return g
      })
    }
    const ig = igualdadConCasilla(azar)
    if (modo < 0.45 && (ig.op === '+' || ig.op === '+der')) {
      // ¿Tiene razón? Puso el resultado en la casilla.
      const conResultado = ig.fichas.map((f) => (f.t === 'caja' ? { t: 'caja' as const, s: num(ig.resultado) } : f))
      const opDer = '+'
      const malo2 = ig.resultado + ig.c
      const izq = ig.texto.split(' = ')[0]
      const correcta = `No. Va ${num(ig.x)}, porque ${num(ig.x)} ${opDer} ${num(ig.c)} también es ${num(ig.resultado)}.`
      const alt = opcionesTexto(azar, correcta, [
        `Sí, porque ${izq} = ${num(ig.resultado)}.`,
        `No. Va ${num(malo2)}, porque ${num(ig.resultado)} ${opDer} ${num(ig.c)} = ${num(malo2)}.`,
      ], 3)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `signo-razon:${ig.texto}`,
        enunciado: `${quien} completó la igualdad de la pizarra y escribió ${num(ig.resultado)} en la casilla.`,
        dibujo: dibujoPizarra(conResultado),
        pregunta: `¿Tiene razón ${quien}?`,
        ...alt,
        nota: `El signo igual no anuncia el resultado: dice que los dos lados valen lo mismo.`,
        pasos: [
          `Lado izquierdo: ${izq} = ${num(ig.resultado)}`,
          `El otro lado también debe dar ${num(ig.resultado)}: ${num(ig.resultado)} − ${num(ig.c)} = ${num(ig.x)}`,
          correcta,
        ],
      }
    }
    const frecuentes = [ig.resultado, lado(ig.resultado, ig.op === '−' ? '−' : '+', ig.c), ig.op === '×' ? ig.resultado - ig.c : ig.x + 10, ig.op === '×' ? ig.x + 1 : ig.x - 10, ig.op === '×' ? ig.x - 1 : ig.x + 1, ig.c]
    const alt = opcionesNum(azar, ig.x, frecuentes)
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `signo:${ig.texto}`,
      enunciado: 'Observa la igualdad de la pizarra.',
      dibujo: dibujoPizarra(ig.fichas),
      pregunta: '¿Qué número va en la casilla para que la igualdad sea verdadera?',
      ...alt,
      nota: `Los dos lados deben valer ${num(ig.resultado)}. ${num(ig.resultado)} es el resultado del lado izquierdo, no lo que va en la casilla.`,
      pasos: [
        `Lado izquierdo: ${ig.texto.split(' = ')[0]} = ${num(ig.resultado)}`,
        `El lado derecho también debe valer ${num(ig.resultado)}: ${ig.texto.split(' = ')[1]} = ${num(ig.resultado)}`,
        `En la casilla va ${num(ig.resultado)} ${ig.op === '−' ? '+' : ig.op === '×' ? '÷' : '−'} ${num(ig.c)} = ${num(ig.x)}`,
      ],
    }
  },
}

// ---------- 10. Tarjetas que valen lo mismo ----------

/** Varias expresiones distintas que valen v: una suma, una resta, una multiplicación o una división. */
function expresiones(azar: Azar, v: number): { t: string; tipo: string }[] {
  const lista: { t: string; tipo: string }[] = []
  const a = entero(azar, Math.max(2, Math.round(v / 5)), Math.max(3, Math.round((4 * v) / 5)))
  if (a < v) lista.push({ t: `${a} + ${v - a}`, tipo: '+' })
  const b = elegir(azar, [5, 8, 10, 12, 15, 20, 25])
  lista.push({ t: `${v + b} − ${b}`, tipo: '−' })
  const pares = [2, 3, 4, 5, 6, 7, 8, 9, 10].filter((p) => v % p === 0 && v / p >= 2 && v / p <= 10)
  if (pares.length) {
    const p = elegir(azar, pares)
    lista.push({ t: `${p} × ${v / p}`, tipo: '×' })
  }
  const ds = [2, 3, 4, 5].filter((d) => v * d <= 100)
  if (ds.length) {
    const d = elegir(azar, ds)
    lista.push({ t: `${v * d} ÷ ${d}`, tipo: '÷' })
  }
  return barajar(azar, lista)
}

function valorExpr(t: string) {
  const [a, op, b] = t.split(' ')
  const x = Number(a)
  const y = Number(b)
  return op === '+' ? x + y : op === '−' ? x - y : op === '×' ? x * y : x / y
}

export const tarjetas: TipoPregunta = {
  id: 're-tarjetas',
  nombre: 'Tarjetas que valen lo mismo',
  queHacen: 'Unen o eligen tarjetas que valen lo mismo (30 + 15 y 50 − 5), para usar el signo igual entre dos expresiones.',
  citas: { [P4]: CITA_SIGNO },
  area: 'matematica',
  competencia: 2,
  cambia: 'numeros',
  generar({ azar }) {
    const modo = azar()
    if (modo < 0.35) {
      // Une con una línea las tarjetas que valen lo mismo.
      const vs = hasta(() => {
        const x = [entero(azar, 12, 60), entero(azar, 12, 60), entero(azar, 12, 60)]
        return Math.min(Math.abs(x[0] - x[1]), Math.abs(x[0] - x[2]), Math.abs(x[1] - x[2])) >= 4 ? x : null
      })
      const parejas = vs.map((v) => {
        const es = expresiones(azar, v)
        const otra = es.find((e) => e.tipo !== es[0].tipo) ?? es[1]
        return [es[0].t, otra.t]
      })
      const der = barajar(azar, [0, 1, 2])
      const CW = 150
      const W = 460
      const partes: string[] = []
      parejas.forEach(([e1], i) => {
        const y = 8 + i * 62
        partes.push(rect(8, y, CW, 44, { relleno: BLANCO, grosor: 1.8, redondeo: 6 }), texto(8 + CW / 2, y + 22, e1, { tam: 19, peso: 700 }), circulo(8 + CW + 10, y + 22, 4.5, { relleno: TINTA, grosor: 1.4 }))
        const e2 = parejas[der[i]][1]
        partes.push(rect(W - 8 - CW, y, CW, 44, { relleno: BLANCO, grosor: 1.8, redondeo: 6 }), texto(W - 8 - CW / 2, y + 22, e2, { tam: 19, peso: 700 }), circulo(W - 8 - CW - 10, y + 22, 4.5, { relleno: TINTA, grosor: 1.4 }))
      })
      return {
        forma: 'abierta',
        clave: `tarjetas-unir:${parejas.map((p) => p.join('=')).join('|')}`,
        enunciado: 'Une con una línea cada tarjeta de la izquierda con la tarjeta de la derecha que vale lo mismo.',
        dibujo: svg(W, 3 * 62 + 4, partes.join(''), `Tres tarjetas a la izquierda (${parejas.map((p) => p[0]).join('; ')}) y tres a la derecha (${der.map((k) => parejas[k][1]).join('; ')})`),
        respuesta: parejas.map(([a, b]) => `${a} = ${b}`).join(' · '),
        espacio: 'dibujo',
        pasos: [...parejas.map(([a, b], i) => `${a} = ${num(vs[i])} y ${b} = ${num(vs[i])}`), `Se unen: ${parejas.map(([a, b]) => `${a} = ${b}`).join(' · ')}`],
      }
    }
    if (modo < 0.7) {
      // ¿Qué tarjeta pongo en el otro platillo?
      return hasta(() => {
        const v = entero(azar, 14, 60)
        const es = expresiones(azar, v)
        if (es.length < 2) return null
        const [e1, e2] = es
        const [p, q] = [Number(e2.t.split(' ')[0]), Number(e2.t.split(' ')[2])]
        const op = e2.t.split(' ')[1]
        const malas = [
          op === '÷' ? `${p + q} ÷ ${q}` : `${p} ${op} ${q + 1}`,
          `${v} + ${elegir(azar, [5, 10, 15])}`,
          op === '−' ? `${p + 10} − ${q}` : `${v + 10} − ${q === 0 ? 5 : Math.min(q, 9)}`,
          `${v - 10} + ${10 + elegir(azar, [1, 2, 5])}`,
        ].filter((t) => Number.isFinite(valorExpr(t)) && valorExpr(t) !== v && valorExpr(t) > 0)
        const alt = opcionesTexto(azar, e2.t, malas)
        if (!alt) return null
        const g: Generado = {
          forma: 'opciones',
          clave: `tarjetas-balanza:${e1.t}`,
          enunciado: `En un platillo de la balanza está la tarjeta ${e1.t}.`,
          dibujo: dibujoBalanza([{ k: 'tarjeta', t: e1.t }], [{ k: 'tarjeta', t: '?' }]),
          pregunta: '¿Qué tarjeta debe ir en el otro platillo para que la balanza quede en equilibrio?',
          ...alt,
          nota: `${e1.t} = ${e2.t}: las dos valen ${v}.`,
          pasos: [`En un platillo: ${e1.t} = ${num(v)}`, `El otro platillo también debe valer ${num(v)}.`, `Va la tarjeta ${e2.t}, porque ${e2.t} = ${num(v)}`],
        }
        return g
      })
    }
    // Tres tarjetas valen lo mismo y una no.
    return hasta(() => {
      const v = elegir(azar, [12, 14, 15, 16, 18, 20, 21, 24, 25, 27, 28, 30, 32, 35, 36, 40, 42, 45, 48, 50])
      const es = expresiones(azar, v)
      if (es.length < 3) return null
      const iguales = es.slice(0, 3).map((e) => e.t)
      const w = v + elegir(azar, [1, -1, 2, 10, -10])
      const otraE = expresiones(azar, w).find((e) => !iguales.some((t) => t.split(' ')[1] === e.tipo)) ?? expresiones(azar, w)[0]
      if (!otraE || valorExpr(otraE.t) === v) return null
      const cards = barajar(azar, [...iguales, otraE.t])
      const correcta = cards.indexOf(otraE.t)
      const CW = 128
      const partes = cards
        .map((t, i) => {
          const x = 4 + i * (CW + 16)
          return texto(x + CW / 2, 14, `${letra(i)})`, { tam: 16, peso: 700 }) + rect(x, 28, CW, 48, { relleno: BLANCO, grosor: 1.8, redondeo: 6 }) + texto(x + CW / 2, 52, t, { tam: 19, peso: 700 })
        })
        .join('')
      const g: Generado = {
        forma: 'opciones',
        clave: `tarjetas-diferente:${cards.join('|')}`,
        enunciado: 'Tres de estas tarjetas valen lo mismo y una vale diferente.',
        dibujo: svg(4 * CW + 3 * 16 + 8, 82, partes, `Cuatro tarjetas: ${cards.map((t, i) => `${letra(i)}) ${t}`).join('; ')}`),
        pregunta: '¿Qué tarjeta vale diferente?',
        ...letras(4, correcta),
        nota: `Las otras tres valen ${v}; la tarjeta ${letra(correcta)} vale ${valorExpr(otraE.t)}.`,
        pasos: [
          cards.slice(0, 2).map((t, i) => `${letra(i)}) ${t} = ${num(valorExpr(t))}`).join('; '),
          cards.slice(2).map((t, i) => `${letra(i + 2)}) ${t} = ${num(valorExpr(t))}`).join('; '),
          `Vale diferente la tarjeta ${letra(correcta)}: ${otraE.t} = ${num(valorExpr(otraE.t))}; las otras valen ${num(v)}.`,
        ],
      }
      return g
    })
  },
}

// ---------- 11. Dos balanzas (hasta dos equivalencias) ----------

const TERNAS: [Fruta, Fruta, Fruta][] = [
  ['sandia', 'pina', 'naranja'],
  ['sandia', 'melon', 'manzana'],
  ['melon', 'manzana', 'limon'],
  ['papaya', 'naranja', 'limon'],
  ['pina', 'manzana', 'limon'],
  ['sandia', 'papaya', 'naranja'],
]

function dosBalanzas(b1: [Cosa[], Cosa[], [string, string]], b2: [Cosa[], Cosa[], [string, string]], alt: string) {
  const p = balanza(b1[0], b1[1], { rotulos: b1[2] })
  const q = balanza(b2[0], b2[1], { rotulos: b2[2] })
  return svg(p.ancho + q.ancho + 24, Math.max(p.alto, q.alto) + 4, desplazar(p.cuerpo, 4, Math.max(0, q.alto - p.alto)) + desplazar(q.cuerpo, p.ancho + 20, Math.max(0, p.alto - q.alto)), alt)
}

export const equivalencias: TipoPregunta = {
  id: 're-equivalencias',
  nombre: 'Dos balanzas',
  queHacen: 'Juntan lo que dicen dos balanzas en equilibrio (dos equivalencias) para saber cuánto pesa una fruta o a cuántas frutas equivale.',
  citas: { [P4]: CITA_EQUIVALENCIAS },
  area: 'matematica',
  competencia: 2,
  cambia: 'numeros',
  generar({ azar }) {
    const [A, B, C] = elegir(azar, TERNAS)
    const FA = FRUTAS[A]
    const FB = FRUTAS[B]
    const FC = FRUTAS[C]
    const modo = azar()
    const enunciado = 'Observa las dos balanzas. Las dos están en equilibrio.'
    if (modo < 0.45) {
      const k1 = entero(azar, 2, 4)
      const k2 = entero(azar, 2, 4)
      if (k1 === 2 && k2 === 2) return null
      const x = k1 * k2
      const alt = opcionesNum(azar, x, [k1 + k2, k2, k1, x + k1, x - 1, x + 1])
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `equiv:${A}${B}${C}:${k1}:${k2}`,
        enunciado,
        dibujo: dosBalanzas(
          [frutas(A, 1), frutas(B, k1), [`1 ${FA.uno}`, plural(k1, FB.uno, FB.varios)]],
          [frutas(B, 1), frutas(C, k2), [`1 ${FB.uno}`, plural(k2, FC.uno, FC.varios)]],
          `Dos balanzas en equilibrio: 1 ${FA.uno} con ${k1} ${FB.varios}; 1 ${FB.uno} con ${k2} ${FC.varios}`,
        ),
        pregunta: `${cuantosDe(C)} ${FC.varios} pesan lo mismo que 1 ${FA.uno}?`,
        ...alt,
        nota: `Cada ${FB.uno} pesa como ${k2} ${FC.varios}, y ${laDe(A)} pesa como ${k1} ${FB.varios}: ${k1} × ${k2} = ${x}.`,
        pasos: [
          `Balanza 1: 1 ${FA.uno} = ${plural(k1, FB.uno, FB.varios)}`,
          `Balanza 2: 1 ${FB.uno} = ${plural(k2, FC.uno, FC.varios)}`,
          `Cada ${FB.uno} vale ${k2} ${FC.varios}: 1 ${FA.uno} = ${k1} × ${k2} = ${plural(x, FC.uno, FC.varios)}`,
        ],
      }
    }
    if (modo < 0.75) {
      // 1 A = k B y 1 B = q kg (o g).
      const k = entero(azar, 2, 4)
      const grande = B === 'pina' || B === 'melon' || B === 'papaya'
      const u: 'kg' | 'g' = grande ? 'kg' : 'g'
      const q = grande ? entero(azar, 1, 3) : elegir(azar, [100, 150, 200, 250])
      const qP = enPesas(q, u, 3)
      if (!qP) return null
      const x = k * q
      const paso = u === 'kg' ? 1 : 50
      const alt = opcionesNum(azar, x, [k + q, q, x + q, x - q, x + paso], { paso, despues: ` ${u}` })
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `equiv-peso:${A}${B}:${k}:${q}`,
        enunciado,
        dibujo: dosBalanzas([frutas(A, 1), frutas(B, k), [`1 ${FA.uno}`, plural(k, FB.uno, FB.varios)]], [frutas(B, 1), pesas(qP, u), [`1 ${FB.uno}`, `${q} ${u}`]], `Dos balanzas en equilibrio: 1 ${FA.uno} con ${k} ${FB.varios}; 1 ${FB.uno} con ${q} ${u}`),
        pregunta: `¿Cuánto pesa ${unaDe(A)}?`,
        ...alt,
        nota: `${k} ${FB.varios} de ${q} ${u}: ${k} × ${q} = ${x} ${u}.`,
        pasos: [
          `Balanza 1: 1 ${FA.uno} = ${plural(k, FB.uno, FB.varios)}`,
          `Balanza 2: 1 ${FB.uno} = ${num(q)} ${u}`,
          `${mayuscula(unaDe(A))} pesa ${k} × ${num(q)} = ${num(x)} ${u}`,
        ],
      }
    }
    // 1 A = 1 B + p kg y 1 B = q kg.
    const p = entero(azar, 1, 5)
    const q = entero(azar, 1, 4)
    const pP = enPesas(p, 'kg', 2)
    const qP = enPesas(q, 'kg', 2)
    if (!pP || !qP) return null
    const x = p + q
    const alt = opcionesNum(azar, x, [p, q, p * q, x + 1, x - 1, p + 2 * q], { despues: ' kg' })
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `equiv-suma:${A}${B}:${p}:${q}`,
      enunciado,
      dibujo: dosBalanzas([frutas(A, 1), [...frutas(B, 1), ...pesas(pP)], [`1 ${FA.uno}`, `1 ${FB.uno} y ${p} kg`]], [frutas(B, 1), pesas(qP), [`1 ${FB.uno}`, `${q} kg`]], `Dos balanzas en equilibrio: 1 ${FA.uno} con 1 ${FB.uno} y ${p} kg; 1 ${FB.uno} con ${q} kg`),
      pregunta: `¿Cuánto pesa ${unaDe(A)}?`,
      ...alt,
      nota: `${q} kg + ${p} kg = ${x} kg.`,
      pasos: [`Balanza 2: 1 ${FB.uno} = ${q} kg`, `Balanza 1: 1 ${FA.uno} = 1 ${FB.uno} y ${p} kg`, `${mayuscula(unaDe(A))} pesa ${q} + ${p} = ${num(x)} kg`],
    }
  },
}

// ---------- 12. Sigue en equilibrio (propiedades de la igualdad) ----------

export const propiedades: TipoPregunta = {
  id: 're-propiedades',
  nombre: 'Sigue en equilibrio',
  queHacen: 'Deciden qué hacer en un platillo para que la balanza siga en equilibrio si se agrega o se quita algo en el otro, o quitan lo mismo de los dos lados.',
  citas: { [P4]: CITA_PROPIEDADES },
  area: 'matematica',
  competencia: 2,
  cambia: 'numeros',
  generar({ azar }) {
    const quien = nombre(azar)
    const modo = azar()
    if (modo < 0.3) {
      // Uniformidad: agregar o quitar lo mismo en el otro platillo.
      const quitar = azar() < 0.45
      const { c, a, p, izqP, derP } = hasta(() => {
        const c = entero(azar, 3, 12)
        const a = elegir(azar, [1, 2, 5])
        const p = quitar ? a : elegir(azar, [1, 2, 3, 5])
        const extra = quitar ? elegir(azar, [1, 2, 5].filter((x) => x !== a)) : 0
        const izqP = quitar ? [a, extra] : [a]
        const derP = enPesas(c + a + extra, 'kg', 3)
        return derP ? { c, a, p, izqP, derP } : null
      })
      const correcta = quitar ? `Quitar ${p} kg del otro platillo.` : `Agregar una pesa de ${p} kg en el otro platillo.`
      const malas = quitar
        ? [`Agregar ${p} kg en el otro platillo.`, 'No hacer nada.', `Quitar ${2 * p} kg del otro platillo.`]
        : [`Quitar ${p} kg del otro platillo.`, 'No hacer nada.', `Agregar una pesa de ${2 * p} kg en el otro platillo.`]
      const alt = opcionesTexto(azar, correcta, malas)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `prop-${quitar ? 'quitar' : 'agregar'}:${c}:${a}:${p}`,
        enunciado: `${quien} tiene una caja y unas pesas en la balanza, y está en equilibrio.`,
        dibujo: dibujoBalanza([{ k: 'caja', r: '?' }, ...pesas(izqP)], pesas(derP)),
        pregunta: quitar
          ? `Si quita la pesa de ${p} kg del platillo de la caja, ¿qué debe hacer en el otro platillo para que siga en equilibrio?`
          : `Si agrega una pesa de ${p} kg en el platillo de la caja, ¿qué debe hacer en el otro platillo para que siga en equilibrio?`,
        ...alt,
        nota: 'Si se agrega o se quita lo mismo en los dos lados, la igualdad se mantiene.',
        pasos: [
          `${quitar ? `Quita ${p} kg del` : `Agrega ${p} kg en el`} platillo de la caja: ese lado pesa ${p} kg ${quitar ? 'menos' : 'más'}.`,
          `Para seguir en equilibrio, el otro platillo también debe pesar ${p} kg ${quitar ? 'menos' : 'más'}.`,
          correcta,
        ],
      }
    }
    if (modo < 0.65) {
      // Cancelativa: quitar la misma pesa de los dos platillos.
      const { p, q, qP } = hasta(() => {
        const p = elegir(azar, [1, 2, 5, 10])
        const q = entero(azar, 2, 9)
        const qP = enPesas(q, 'kg', 2)
        return qP && !qP.includes(p) ? { p, q, qP } : null
      })
      const alt = opcionesNum(azar, q, [p + q, p, q + 2 * p, q - p, q + 1, q - 1], { despues: ' kg' })
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `prop-cancela:${p}:${q}`,
        enunciado: `La balanza de ${quien} está en equilibrio. En los dos platillos hay una pesa de ${p} kg.`,
        dibujo: dibujoBalanza([{ k: 'bolsa', r: '?' }, pesa(p)], [pesa(p), ...pesas(qP)]),
        pregunta: `Si quita la pesa de ${p} kg de los dos platillos, la balanza sigue en equilibrio. ¿Cuánto pesa la bolsa?`,
        ...alt,
        nota: `Bolsa + ${p} = ${p} + ${q}. Quitando ${p} kg de cada lado queda bolsa = ${q} kg.`,
        pasos: [
          `Derecha: la pesa de ${p} kg y ${qP.length > 1 ? `otras que suman ${sumaPesas(qP, 'kg')}` : `otra de ${q} kg`}.`,
          `Bolsa + ${p} kg = ${p} kg + ${q} kg`,
          `Se quita ${p} kg de cada lado: la bolsa pesa ${q} kg.`,
        ],
      }
    }
    // Con números: 25 + 15 = 40, y se suma o se resta lo mismo a los dos lados.
    const a = entero(azar, 12, 60)
    const b = entero(azar, 8, 40)
    const s = a + b
    const k = entero(azar, 2, 9)
    const mas = azar() < 0.6
    const o = mas ? '+' : '−'
    const otro = mas ? '−' : '+'
    const izq = `${a} + ${b} ${o} ${k}`
    const correcta = `${izq} = ${s} ${o} ${k}`
    const alt = opcionesTexto(azar, correcta, [`${izq} = ${s}`, `${izq} = ${s} ${otro} ${k}`, `${a} + ${b} = ${s} ${o} ${k}`])
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `prop-numeros:${a}:${b}:${o}${k}`,
      enunciado: `La balanza está en equilibrio porque ${a} + ${b} = ${s}. ${quien} ${mas ? `agrega ${k} en cada lado` : `quita ${k} de cada lado`}.`,
      dibujo: dibujoBalanza([{ k: 'tarjeta', t: `${a} + ${b}` }], [{ k: 'tarjeta', t: String(s) }]),
      pregunta: '¿Qué igualdad es verdadera ahora?',
      ...alt,
      nota: `Si se ${mas ? 'suma' : 'resta'} ${k} a los dos lados, la igualdad se mantiene.`,
      pasos: [
        `Antes: ${a} + ${b} = ${s}`,
        `Si se ${mas ? 'suma' : 'resta'} ${k} a un lado, se ${mas ? 'suma' : 'resta'} ${k} al otro.`,
        `${correcta}: los dos lados valen ${num(mas ? s + k : s - k)}`,
      ],
    }
  },
}

// ---------- 13. El doble o la mitad en cada lado ----------

export const duplicar: TipoPregunta = {
  id: 're-duplicar',
  nombre: 'El doble o la mitad en cada lado',
  queHacen: 'Duplican, triplican o reparten en los dos platillos de la balanza para mantener el equilibrio.',
  citas: { [P4]: CITA_DUPLICAR },
  area: 'matematica',
  competencia: 2,
  cambia: 'numeros',
  generar({ azar }) {
    const quien = nombre(azar)
    const modo = azar()
    if (modo < 0.45) {
      // 1 A = k B. ¿Y m A?
      const [A, B] = elegir(azar, TERNAS)
      const FA = FRUTAS[A]
      const FB = FRUTAS[B]
      const k = entero(azar, 2, 4)
      const m = entero(azar, 2, 3)
      const x = m * k
      const alt = opcionesNum(azar, x, [k + m - 1, k + m, k, x + 1, x - 1, x + k])
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `doble-fruta:${A}${B}:${k}:${m}`,
        enunciado: `La balanza de ${quien} está en equilibrio: 1 ${FA.uno} pesa lo mismo que ${k} ${FB.varios}.`,
        dibujo: dibujoBalanza(frutas(A, 1), frutas(B, k), { rotulos: [`1 ${FA.uno}`, plural(k, FB.uno, FB.varios)] }),
        pregunta: `Si pone ${m} ${FA.varios} en un platillo, ${cuantosDe(B).toLowerCase()} ${FB.varios} debe poner en el otro para que siga en equilibrio?`,
        ...alt,
        nota: `${m === 2 ? 'El doble' : 'El triple'} en cada lado: ${m} × ${k} = ${x}.`,
        pasos: [`En la balanza: 1 ${FA.uno} = ${plural(k, FB.uno, FB.varios)}`, `${m} ${FA.varios} son ${m === 2 ? 'el doble' : 'el triple'}: ${m} × ${k} = ${plural(x, FB.uno, FB.varios)}`],
      }
    }
    if (modo < 0.7) {
      // Una caja = c kg. ¿Y m cajas?
      const c = entero(azar, 2, 9)
      const m = entero(azar, 2, 3)
      const cP = enPesas(c, 'kg', 3)
      if (!cP) return null
      const x = m * c
      const alt = opcionesNum(azar, x, [c + m - 1, c + m, c, x + c, x + 1, x - 1], { despues: ' kg' })
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `doble-caja:${c}:${m}`,
        enunciado: `En la bodega de ${quien}, una caja de leche pesa lo mismo que las pesas del otro platillo.`,
        dibujo: dibujoBalanza([{ k: 'caja', r: 'leche' }], pesas(cP), { rotulos: ['1 caja', `${c} kg`] }),
        pregunta: `Si pone ${m} cajas iguales en un platillo, ¿cuántos kilos debe poner en el otro para que siga en equilibrio?`,
        ...alt,
        nota: `${m === 2 ? 'El doble' : 'El triple'} en cada lado: ${m} × ${c} = ${x} kg.`,
        pasos: [`En la balanza: 1 caja pesa ${c} kg.`, `${m} cajas son ${m === 2 ? 'el doble' : 'el triple'}: ${m} × ${c} = ${num(x)} kg`],
      }
    }
    // n latas = T kg. ¿Y la mitad de las latas?
    const { n, w, T, tP } = hasta(() => {
      const n = elegir(azar, [2, 4, 6, 8])
      const w = entero(azar, 1, 5)
      const tP = enPesas(n * w, 'kg', 4)
      return tP && n * w >= 4 ? { n, w, T: n * w, tP } : null
    })
    const x = T / 2
    const alt = opcionesNum(azar, x, [T - n / 2, T - 2, T, T / 4, x + 1, x - 1].filter(Number.isInteger), { despues: ' kg' })
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `mitad-latas:${n}:${w}`,
      enunciado: `${quien} puso ${n} latas iguales de atún en la balanza, y está en equilibrio.`,
      dibujo: dibujoBalanza(
        Array.from({ length: n }, () => ({ k: 'lata' }) as Cosa),
        pesas(tP),
        { rotulos: [`${n} latas`, `${T} kg`] },
      ),
      pregunta: `Si deja solo la mitad de las latas, ¿cuántos kilos debe dejar en el otro platillo para que siga en equilibrio?`,
      ...alt,
      nota: `La mitad en cada lado: ${T} ÷ 2 = ${x} kg.`,
      pasos: [`En la balanza: ${n} latas pesan ${T} kg.`, `La mitad de las latas: ${n} ÷ 2 = ${plural(n / 2, 'lata', 'latas')}`, `La mitad del peso: ${T} ÷ 2 = ${num(x)} kg`],
    }
  },
}

// ---------- 14. Completa la tabla (relación de cambio) ----------

type Contexto = {
  id: string
  x: string
  y: string
  ks: number[]
  inicio?: [number, number]
  intro: (q: string, k: number, i: number) => string
  cuanto: (n: number) => string
  cuantosX?: (t: number) => string
  cambia: string
  aumenta: (d: number) => string
  soles?: boolean
}

const CONTEXTOS: Contexto[] = [
  {
    id: 'cuadernos',
    x: 'Cuadernos',
    y: 'Precio (S/)',
    ks: [2, 3, 4, 5, 6],
    intro: (q) => `${q} anotó en una tabla cuánto cuestan los cuadernos en la librería.`,
    cuanto: (n) => `¿Cuánto cuestan ${n} cuadernos?`,
    cuantosX: (t) => `¿Cuántos cuadernos se compran con S/ ${t}?`,
    cambia: '¿Cómo cambia el precio cada vez que se compra un cuaderno más?',
    aumenta: (d) => `Aumenta S/ ${d}.`,
    soles: true,
  },
  {
    id: 'panes',
    x: 'Bolsas de pan',
    y: 'Panes',
    ks: [5, 6, 8, 10],
    intro: (q) => `En la panadería, ${q} anotó cuántos panes entran en las bolsas.`,
    cuanto: (n) => `¿Cuántos panes hay en ${n} bolsas?`,
    cuantosX: (t) => `¿Cuántas bolsas se llenan con ${t} panes?`,
    cambia: '¿Cómo cambia la cantidad de panes cada vez que se agrega una bolsa?',
    aumenta: (d) => `Aumenta ${d} panes.`,
  },
  {
    id: 'chicha',
    x: 'Jarras de chicha',
    y: 'Vasos',
    ks: [4, 5, 6, 8],
    intro: (q) => `Para la fiesta del aula, ${q} anotó cuántos vasos se llenan con jarras de chicha morada.`,
    cuanto: (n) => `¿Cuántos vasos se llenan con ${n} jarras?`,
    cuantosX: (t) => `¿Cuántas jarras se necesitan para llenar ${t} vasos?`,
    cambia: '¿Cómo cambia la cantidad de vasos cada vez que se agrega una jarra?',
    aumenta: (d) => `Aumenta ${d} vasos.`,
  },
  {
    id: 'papa',
    x: 'Kilos de papa',
    y: 'Precio (S/)',
    ks: [2, 3, 4],
    intro: (q) => `En el mercado, ${q} anotó cuánto cuesta la papa.`,
    cuanto: (n) => `¿Cuánto cuestan ${n} kilos de papa?`,
    cuantosX: (t) => `¿Cuántos kilos de papa se compran con S/ ${t}?`,
    cambia: '¿Cómo cambia el precio cada vez que se compra un kilo más?',
    aumenta: (d) => `Aumenta S/ ${d}.`,
    soles: true,
  },
  {
    id: 'ahorro',
    x: 'Semana',
    y: 'Ahorro (S/)',
    ks: [3, 4, 5, 6, 8, 10],
    inicio: [5, 30],
    intro: (q, _k, i) => `${q} tenía S/ ${i} en su alcancía y cada semana ahorra lo mismo. Anotó su ahorro en una tabla.`,
    cuanto: (n) => `Si sigue así, ¿cuánto tendrá ahorrado en la semana ${n}?`,
    cambia: '¿Cómo cambia el ahorro de una semana a la siguiente?',
    aumenta: (d) => `Aumenta S/ ${d}.`,
    soles: true,
  },
]

function dibujoTabla(c: Contexto, xs: number[], ys: (number | null)[], casillas: boolean) {
  const LW = Math.max(anchoTexto(c.x, 15), anchoTexto(c.y, 15)) + 24
  const CW = 60
  const RH = 46
  const W = LW + xs.length * CW
  const partes = [rect(4, 4, W, 2 * RH, { relleno: BLANCO, grosor: 2 }), rect(4, 4, LW, 2 * RH, { relleno: CLARO, grosor: 2 }), linea(4, 4 + RH, 4 + W, 4 + RH, { grosor: 2 })]
  partes.push(texto(4 + LW / 2, 4 + RH / 2, c.x, { tam: 15, peso: 700 }), texto(4 + LW / 2, 4 + 1.5 * RH, c.y, { tam: 15, peso: 700 }))
  xs.forEach((x, i) => {
    const cx = 4 + LW + i * CW
    if (i) partes.push(linea(cx, 4, cx, 4 + 2 * RH, { grosor: 1.6 }))
    partes.push(texto(cx + CW / 2, 4 + RH / 2, num(x), { tam: 18, peso: 700 }))
    const y = ys[i]
    if (y !== null) partes.push(texto(cx + CW / 2, 4 + 1.5 * RH, num(y), { tam: 18 }))
    else if (casillas) partes.push(casilla(cx + 8, 4 + RH + 7, CW - 16, RH - 14))
    else partes.push(texto(cx + CW / 2, 4 + 1.5 * RH, '?', { tam: 20, peso: 700 }))
  })
  return svg(W + 8, 2 * RH + 8, partes.join(''), `Tabla: ${c.x} ${xs.join(', ')}; ${c.y} ${ys.map((y) => (y === null ? 'vacío' : y)).join(', ')}`)
}

export const tablaCambio: TipoPregunta = {
  id: 're-tabla',
  nombre: 'Completa la tabla',
  queHacen: 'Completan o leen una tabla de dos magnitudes (cuadernos y precio, jarras y vasos, semanas y ahorro) y describen cómo cambia una con la otra.',
  citas: { [P4]: CITA_CAMBIO },
  area: 'matematica',
  competencia: 2,
  cambia: 'numeros',
  generar({ azar }) {
    const c = elegir(azar, CONTEXTOS)
    const k = elegir(azar, c.ks)
    const i0 = c.inicio ? entero(azar, ...c.inicio) : 0
    const f = (x: number) => i0 + k * x
    const enunciado = c.intro(nombre(azar), k, i0)
    const unidad = c.soles ? { antes: 'S/ ' } : {}
    const sol = c.soles ? 'S/ ' : ''
    // "cuadernos", "bolsas", "jarras", "kilos": lo que va en la primera fila.
    const cosas = c.x.split(' ')[0].toLowerCase()
    const resta = (x: number) => `${num(f(x + 1))} − ${num(f(x))} = ${num(k)}`
    const modo = azar()
    if (modo < 0.3) {
      const xs = [1, 2, 3, 4, 5, 6]
      const ocultos = barajar(azar, [2, 3, 4, 5]).slice(0, 3).sort()
      const respuesta = ocultos.map((i) => `${xs[i]} → ${sol}${num(f(xs[i]))}`).join(' · ')
      return {
        forma: 'abierta',
        clave: `tabla-completa:${c.id}:${k}:${i0}:${ocultos.join('')}`,
        enunciado: `${enunciado} Completa la tabla.`,
        dibujo: dibujoTabla(c, xs, xs.map((x, i) => (ocultos.includes(i) ? null : f(x))), true),
        respuesta,
        espacio: 'dibujo',
        pasos: [
          `En la tabla: ${resta(xs[0])}; cada vez aumenta ${num(k)}.`,
          ocultos.map((i) => `${num(f(xs[i - 1]))} + ${num(k)} = ${num(f(xs[i]))}`).join('; '),
          `En la tabla van: ${respuesta}`,
        ],
      }
    }
    const xs = [1, 2, 3, 4]
    const dibujo = dibujoTabla(c, xs, xs.map(f), false)
    const leer = `En la tabla: ${xs.map((x) => num(f(x))).join(', ')}; cada vez aumenta ${num(k)}.`
    if (modo < 0.55) {
      const alt = opcionesTexto(azar, c.aumenta(k), [c.aumenta(1), 'Se duplica.', c.aumenta(2 * k), c.aumenta(k + 1)])
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `tabla-cambia:${c.id}:${k}:${i0}`,
        enunciado,
        dibujo,
        pregunta: c.cambia,
        ...alt,
        pasos: [`En la tabla: ${[1, 2, 3].map(resta).join('; ')}`, `Siempre la misma diferencia: ${c.aumenta(k)}`],
      }
    }
    if (modo < 0.75 && c.cuantosX) {
      const n = entero(azar, 6, 12)
      const T = f(n)
      const alt = opcionesNum(azar, n, [T - k, n + 1, n - 1, Math.floor(T / 2), k + n, n + 2])
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `tabla-inversa:${c.id}:${k}:${n}`,
        enunciado,
        dibujo,
        pregunta: c.cuantosX(T),
        ...alt,
        nota: `${num(T)} ÷ ${k} = ${n}.`,
        pasos: [
          leer,
          ...(i0 ? [`Sin lo del inicio: ${num(T)} − ${num(i0)} = ${num(T - i0)}`] : []),
          `Se busca el número que por ${num(k)} da ${num(T - i0)}: ${num(T - i0)} ÷ ${num(k)} = ${num(n)} ${cosas}`,
        ],
      }
    }
    const n = entero(azar, 6, 12)
    const x = f(n)
    const alt = opcionesNum(azar, x, [f(4) + (n - 4), f(4) + k, i0 ? k * n : n + k, x + k, x - k, n + k], unidad)
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `tabla:${c.id}:${k}:${i0}:${n}`,
      enunciado,
      dibujo,
      pregunta: c.cuanto(n),
      ...alt,
      nota: i0 ? `Aumenta S/ ${k} por semana: ${i0} + ${k} × ${n} = ${num(x)}.` : `Aumenta ${k} cada vez: ${k} × ${n} = ${num(x)}.`,
      pasos: i0
        ? [leer, `Tenía S/ ${num(i0)} al inicio y ahorra S/ ${num(k)} por semana.`, `Semana ${n}: ${num(i0)} + ${num(k)} × ${n} = ${sol}${num(x)}`]
        : [leer, `${n} ${cosas}: ${num(k)} × ${n} = ${sol}${num(x)}`],
    }
  },
}

// ---------- 15. Crece o se gasta (relación de cambio con dibujos) ----------

type Etapa = { rotulo: string; valor: number }

function dibujoEtapas(que: 'planta' | 'vela' | 'balde', etapas: Etapa[], unidad: string) {
  const PW = 170
  const max = Math.max(...etapas.map((e) => e.valor))
  // El cilindro se dibuja con capacidad para 10 minutos, para que no se vea lleno al minuto 3.
  const esc = que === 'balde' ? 160 / (etapas[0].valor * 10) : Math.min(8, 150 / max)
  const piso = 196
  const partes: string[] = []
  etapas.forEach((e, i) => {
    const cx = 10 + i * PW + 60
    const h = e.valor * esc
    let y0 = piso
    if (que === 'planta') {
      partes.push(poligono([[cx - 24, piso - 30], [cx + 24, piso - 30], [cx + 18, piso], [cx - 18, piso]], { relleno: '#e6c9a8', grosor: 1.8 }))
      partes.push(rect(cx - 27, piso - 36, 54, 7, { relleno: '#d9b893', grosor: 1.6, redondeo: 2 }))
      y0 = piso - 36
      partes.push(linea(cx, y0, cx, y0 - h, { trazo: '#4f6b45', grosor: 3 }))
      for (let k = 1; y0 - k * 18 > y0 - h + 6; k++) {
        const y = y0 - k * 18
        const s = k % 2 ? 1 : -1
        partes.push(ruta(`M${cx},${y} q${s * 10},-12 ${s * 22},-6 q${-s * 10},10 ${-s * 22},6 Z`, { relleno: VERDE, trazo: '#4f6b45', grosor: 1.4 }))
      }
      partes.push(ruta(`M${cx},${y0 - h} q-8,-6 -12,2 q8,4 12,-2 Z M${cx},${y0 - h} q8,-6 12,2 q-8,4 -12,-2 Z`, { relleno: VERDE, trazo: '#4f6b45', grosor: 1.4 }))
    } else if (que === 'vela') {
      partes.push(elipse(cx, piso - 4, 30, 6, { relleno: CLARO, grosor: 1.6 }))
      y0 = piso - 6
      partes.push(rect(cx - 13, y0 - h, 26, h, { relleno: '#f6f1e4', grosor: 1.8 }))
      partes.push(linea(cx, y0 - h, cx, y0 - h - 7, { grosor: 1.6 }))
      partes.push(ruta(`M${cx},${y0 - h - 26} Q${cx + 9},${y0 - h - 13} ${cx},${y0 - h - 7} Q${cx - 9},${y0 - h - 13} ${cx},${y0 - h - 26} Z`, { relleno: '#f7dca0', grosor: 1.4 }))
    } else {
      const H = 160
      partes.push(rect(cx - 30, piso - H, 60, H, { relleno: BLANCO, grosor: 2 }))
      partes.push(rect(cx - 30, piso - h, 60, h, { relleno: '#d5e3f0', grosor: 1.4 }))
      partes.push(rect(cx - 30, piso - H, 60, H, { grosor: 2 }))
      partes.push(rect(cx - 54, piso - H - 24, 40, 8, { relleno: CLARO, grosor: 1.6 }), rect(cx - 22, piso - H - 24, 8, 16, { relleno: CLARO, grosor: 1.6 }))
      partes.push(linea(cx - 18, piso - H - 6, cx - 18, piso - h, { trazo: '#8aa0b2', grosor: 2, punteado: true }))
    }
    // La medida, al costado.
    const mx = cx + 40
    partes.push(linea(mx, y0, mx, y0 - h, { grosor: 1.6 }), linea(mx - 5, y0, mx + 5, y0, { grosor: 1.6 }), linea(mx - 5, y0 - h, mx + 5, y0 - h, { grosor: 1.6 }))
    partes.push(texto(mx + 9, y0 - h / 2, `${e.valor} ${unidad}`, { tam: 15, peso: 700, ancla: 'start' }))
    partes.push(texto(cx + 10, piso + 22, e.rotulo, { tam: 15, peso: 700 }))
  })
  return svg(etapas.length * PW + 10, piso + 32, partes.join(''), `${etapas.map((e) => `${e.rotulo}: ${e.valor} ${unidad}`).join('; ')}`)
}

export const crece: TipoPregunta = {
  id: 're-crece',
  nombre: 'Crece o se gasta',
  queHacen: 'Miran cómo cambia algo con el tiempo (una planta que crece, una vela que se gasta, un balde que se llena) y dicen cuánto cambia o cuánto medirá.',
  citas: { [P4]: CITA_CAMBIO },
  area: 'matematica',
  competencia: 2,
  cambia: 'numeros',
  generar({ azar }) {
    const quien = nombre(azar)
    const que = elegir(azar, ['planta', 'vela', 'balde'] as const)
    const pregCambio = azar() < 0.3
    if (que === 'planta') {
      const h1 = entero(azar, 3, 8)
      const r = entero(azar, 2, 5)
      const h = (w: number) => h1 + r * (w - 1)
      const dibujo = dibujoEtapas('planta', [1, 2, 3].map((w) => ({ rotulo: `Semana ${w}`, valor: h(w) })), 'cm')
      const enunciado = `${quien} mide su planta de frejol cada semana. Crece lo mismo cada semana.`
      const leer = `Semana 1: ${h1} cm; semana 2: ${h(2)} cm; semana 3: ${h(3)} cm`
      if (pregCambio) {
        const alt = opcionesNum(azar, r, [h1, 2 * r, r + 1, r - 1, h(2)], { despues: ' cm' })
        if (!alt) return null
        return {
          forma: 'opciones',
          clave: `crece:planta:${h1}:${r}:c`,
          enunciado,
          dibujo,
          pregunta: '¿Cuántos centímetros crece cada semana?',
          ...alt,
          pasos: [leer, `${h(2)} − ${h1} = ${r}: crece ${r} cm cada semana`],
        }
      }
      const N = entero(azar, 5, 8)
      const x = h(N)
      const alt = opcionesNum(azar, x, [h(3) + r, r * N, x + r, x - r, h(3) + (N - 3)], { despues: ' cm' })
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `crece:planta:${h1}:${r}:${N}`,
        enunciado,
        dibujo,
        pregunta: `Si sigue creciendo igual, ¿cuánto medirá en la semana ${N}?`,
        ...alt,
        nota: `Crece ${r} cm por semana: ${h1} + ${r} × ${N - 1} = ${x} cm.`,
        pasos: [
          leer,
          `Crece ${h(2)} − ${h1} = ${r} cm cada semana.`,
          `Semanas 4 ${N === 5 ? 'y' : 'a'} ${N}, sumando ${r} cada vez: ${Array.from({ length: N - 3 }, (_, i) => `${h(i + 4)} cm`).join(', ')}`,
          `En la semana ${N} medirá ${num(x)} cm.`,
        ],
      }
    }
    if (que === 'vela') {
      const L0 = entero(azar, 20, 30)
      const r = entero(azar, 2, 4)
      const L = (t: number) => L0 - r * t
      const dibujo = dibujoEtapas('vela', [0, 1, 2].map((t) => ({ rotulo: t === 0 ? 'Al encenderla' : t === 1 ? 'A la 1 hora' : 'A las 2 horas', valor: L(t) })), 'cm')
      const enunciado = `En un apagón, ${quien} prendió una vela. Cada hora se gasta lo mismo.`
      const leer = `Al encenderla: ${L0} cm; a la 1 hora: ${L(1)} cm; a las 2 horas: ${L(2)} cm`
      if (pregCambio) {
        const alt = opcionesNum(azar, r, [L(1), 2 * r, r + 1, r - 1], { despues: ' cm' })
        if (!alt) return null
        return {
          forma: 'opciones',
          clave: `crece:vela:${L0}:${r}:c`,
          enunciado,
          dibujo,
          pregunta: '¿Cuántos centímetros se gasta cada hora?',
          ...alt,
          pasos: [leer, `${L0} − ${L(1)} = ${r}: se gasta ${r} cm cada hora`],
        }
      }
      const N = entero(azar, 4, 6)
      const x = L(N)
      if (x < 2) return null
      const alt = opcionesNum(azar, x, [L(2) - r, L0 - N, x + r, x - r, r * N], { despues: ' cm' })
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `crece:vela:${L0}:${r}:${N}`,
        enunciado,
        dibujo,
        pregunta: `Si se sigue gastando igual, ¿cuánto medirá a las ${N} horas?`,
        ...alt,
        nota: `Se gasta ${r} cm por hora: ${L0} − ${r} × ${N} = ${x} cm.`,
        pasos: [
          leer,
          `Se gasta ${L0} − ${L(1)} = ${r} cm cada hora.`,
          `Horas 3 ${N === 4 ? 'y' : 'a'} ${N}, restando ${r} cada vez: ${Array.from({ length: N - 2 }, (_, i) => `${L(i + 3)} cm`).join(', ')}`,
          `A las ${N} horas medirá ${num(x)} cm.`,
        ],
      }
    }
    const r = entero(azar, 2, 6)
    const dibujo = dibujoEtapas('balde', [1, 2, 3].map((m) => ({ rotulo: m === 1 ? 'Al minuto 1' : `Al minuto ${m}`, valor: r * m })), 'L')
    const enunciado = `${quien} llena un cilindro de agua con el caño. Cada minuto entra la misma cantidad.`
    const leer = `Minuto 1: ${r} L; minuto 2: ${2 * r} L; minuto 3: ${3 * r} L`
    if (pregCambio) {
      const alt = opcionesNum(azar, r, [3 * r, 2 * r, r + 1, r - 1], { despues: ' L' })
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `crece:balde:${r}:c`,
        enunciado,
        dibujo,
        pregunta: '¿Cuántos litros entran cada minuto?',
        ...alt,
        pasos: [leer, `${2 * r} − ${r} = ${r}: entran ${r} L cada minuto`],
      }
    }
    const N = entero(azar, 5, 10)
    const x = r * N
    const alt = opcionesNum(azar, x, [3 * r + (N - 3), 3 * r + r, r + N, x + r, x - r], { despues: ' L' })
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `crece:balde:${r}:${N}`,
      enunciado,
      dibujo,
      pregunta: `Si sigue igual, ¿cuántos litros habrá a los ${N} minutos?`,
      ...alt,
      nota: `Entran ${r} L por minuto: ${r} × ${N} = ${x} L.`,
      pasos: [leer, `Entran ${2 * r} − ${r} = ${r} L cada minuto.`, `A los ${N} minutos: ${r} × ${N} = ${num(x)} L`],
    }
  },
}

export const GRUPO_REGULARIDAD: Grupo = {
  tipos: [cenefa, faja, rana, multiplica, regla, mesas, balanzaCaja, icono, signoIgual, tarjetas, equivalencias, propiedades, duplicar, tablaCambio, crece],
  temas: {
    'Patrones con simetría': ['re-cenefa', 're-faja'],
    'Patrones aditivos': ['re-rana', 're-regla'],
    'Patrones multiplicativos': ['re-multiplica', 're-regla'],
    'Regla de formación': ['re-regla', 're-mesas'],
    'Término desconocido': ['re-balanza', 're-icono'],
    'El signo igual': ['re-signo-igual', 're-tarjetas'],
    'Propiedades de la igualdad': ['re-propiedades', 're-duplicar'],
    'Equivalencias en la balanza': ['re-equivalencias', 're-balanza', 're-duplicar'],
    'Relaciones de cambio en tablas': ['re-tabla', 're-crece'],
    'Igualdad y término desconocido': ['re-icono', 're-balanza', 're-signo-igual'],
  },
}
