// Tipos de pregunta de 4.º de primaria. Competencia 1 (cantidad), números y operaciones: recta numérica, comparar y
// ordenar, redondeo, problemas de la bodega, arreglos y repartos, propiedades de la multiplicación, doblar y partir.
// Cada versión trae otros números; las alternativas incorrectas son los errores que más cometen los alumnos.
import { barajar, elegir, entero } from '../../juegos/motor/azar'
import { distractores, num } from '../../juegos/matematica/formato'
import { CLARO, GRIS, TINTA, casilla, circulo, elipse, grupo, linea, poligono, rect, ruta, svg, texto } from '../dibujos'
import type { Azar, Dibujo, Grupo, TipoPregunta } from '../tipos'
import { alternativas, dosNombres, nombre, soles } from '../util'

const P4 = 'primaria-4'

// Fragmentos letra por letra de los desempeños de 4.º (Matemática, competencia 1).
const CITA_ORDEN = 'números de cuatro cifras y la comparación y el orden de números'
const CITA_REDONDEO = 'redondeo a múltiplos de 10'
const CITA_PROBLEMAS =
  'agregar, quitar, comparar, igualar, reiterar, agrupar, repartir cantidades y combinar colecciones, para transformarlas en expresiones numéricas (modelo) de adición, sustracción, multiplicación y división con números naturales de hasta cuatro cifras'
const CITA_ARREGLOS =
  'reiterar, agrupar, repartir cantidades y combinar colecciones, para transformarlas en expresiones numéricas (modelo) de adición, sustracción, multiplicación y división'
const CITA_PROPIEDADES = 'las propiedades conmutativa y asociativa de la multiplicación'
const CITA_DOBLAR = 'doblar y dividir por 2 de forma reiterada'

/** Prueba un generador que descarta casos feos; null si no sale (nunca lanza error). */
function probar<T>(f: () => T | null, veces = 80): T | null {
  for (let i = 0; i < veces; i++) {
    const r = f()
    if (r !== null) return r
  }
  return null
}

const rango = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i)
const sumar = (xs: number[]) => xs.reduce((s, x) => s + x, 0)
const decenaAbajo = (n: number) => Math.floor(n / 10) * 10
const aLaDecena = (n: number) => Math.round(n / 10) * 10
const aLaCentena = (n: number) => Math.round(n / 100) * 100
/** Sin 0 ni 5 en las unidades: así nadie duda hacia qué decena va. */
const redondeable = (n: number) => n % 10 !== 0 && n % 10 !== 5

// Anchos de Arial en negrita (en em), para centrar igualdades con casillas y poner un texto a continuación de otro.
const ANGOSTAS: Record<string, number> = { ' ': 0.28, i: 0.28, í: 0.28, j: 0.28, l: 0.28, I: 0.28, f: 0.33, t: 0.33, r: 0.39, '(': 0.33, ')': 0.33, ':': 0.33, '.': 0.28, ',': 0.28, '/': 0.28, '°': 0.4, º: 0.37 }
const ANCHAS: Record<string, number> = { m: 0.89, w: 0.78, M: 0.83, W: 0.94, '×': 0.58, '=': 0.58, '÷': 0.58, '<': 0.58 }

/** Ancho aproximado de un texto en Arial negrita, carácter por carácter. */
function ancho(t: string, tam: number) {
  let w = 0
  for (const c of t) w += ANGOSTAS[c] ?? ANCHAS[c] ?? (/[A-ZÁÉÍÓÚÑ]/.test(c) ? 0.72 : /[0-9]/.test(c) ? 0.56 : /[bdghnopqu]/.test(c) ? 0.61 : 0.56)
  return w * tam
}

/** Una igualdad en una fila, centrada en cx; `null` es una casilla vacía donde el alumno escribe. */
function igualdad(partes: (string | null)[], cx: number, y: number, tam = 22) {
  const CW = 46
  const GAP = 8
  const anchos = partes.map((p) => (p === null ? CW : ancho(p, tam)))
  let x = cx - (sumar(anchos) + GAP * (partes.length - 1)) / 2
  return partes
    .map((p, i) => {
      const s = p === null ? casilla(x, y - 19, CW, 38) : texto(x + anchos[i] / 2, y, p, { tam, peso: 700 })
      x += anchos[i] + GAP
      return s
    })
    .join('')
}

/** Flecha vertical que apunta hacia abajo, con la punta en (x, punta). */
function flechaAbajo(x: number, desde: number, punta: number) {
  return linea(x, desde, x, punta - 10, { grosor: 2.6 }) + poligono([[x - 7, punta - 12], [x + 7, punta - 12], [x, punta]], { relleno: TINTA, grosor: 1.4 })
}

/** Línea horizontal con punta de flecha en los dos extremos. */
function rectaConPuntas(xa: number, xb: number, y: number) {
  return [
    linea(xa + 8, y, xb - 8, y, { grosor: 2.4 }),
    poligono([[xb, y], [xb - 12, y - 6], [xb - 12, y + 6]], { relleno: TINTA, grosor: 1.4 }),
    poligono([[xa, y], [xa + 12, y - 6], [xa + 12, y + 6]], { relleno: TINTA, grosor: 1.4 }),
  ].join('')
}

// ---------- La recta numérica ----------

type Recta = { inicio: number; paso: number; n: number; etiquetas: number[]; casillas?: number[]; flecha?: number; letras?: number[] }

export function dibujoRecta(o: Recta): Dibujo {
  const W = 560
  const x0 = 48
  const x1 = 512
  const y = o.flecha !== undefined || o.letras ? 74 : 26
  const dx = (x1 - x0) / o.n
  const xs = (i: number) => x0 + i * dx
  const partes = [rectaConPuntas(10, W - 10, y)]
  for (let i = 0; i <= o.n; i++) {
    const marcada = o.etiquetas.includes(i)
    partes.push(linea(xs(i), y - (marcada ? 12 : 9), xs(i), y + (marcada ? 12 : 9), { grosor: marcada ? 2.6 : 1.8 }))
    if (marcada) partes.push(texto(xs(i), y + 31, num(o.inicio + i * o.paso), { tam: 16, peso: 700 }))
    if (o.casillas?.includes(i)) partes.push(casilla(xs(i) - 27, y + 17, 54, 30))
  }
  if (o.flecha !== undefined) partes.push(flechaAbajo(xs(o.flecha), 16, y - 15))
  o.letras?.forEach((i, k) => partes.push(texto(xs(i), 14, 'ABCD'[k], { tam: 18, peso: 700 }), flechaAbajo(xs(i), 28, y - 15)))
  const que = o.casillas ? `y ${o.casillas.length} recuadros vacíos` : o.flecha !== undefined ? 'y una flecha sobre una marca' : `y las letras A, B, C y D sobre algunas marcas`
  const nums = o.etiquetas.map((i) => num(o.inicio + i * o.paso)).join(', ')
  return svg(W, y + (o.casillas ? 52 : 44), partes.join(''), `Recta numérica con ${o.n + 1} marcas; se leen ${nums}, ${que}`)
}

export const rectaNumerica: TipoPregunta = {
  id: 'op-recta',
  nombre: 'Lee la recta numérica',
  queHacen: 'Leen, ubican y completan números de cuatro cifras en la recta numérica, contando de 10 en 10, de 100 en 100 o de 1000 en 1000.',
  citas: { [P4]: CITA_ORDEN },
  area: 'matematica',
  competencia: 1,
  cambia: 'numeros',
  generar({ azar }) {
    const paso = elegir(azar, [100, 100, 100, 10, 10, 1000])
    const n = paso === 1000 ? 9 : 10
    const inicio = paso === 1000 ? 0 : paso === 100 ? entero(azar, 10, 89) * 100 : entero(azar, 100, 989) * 10
    const v = (i: number) => inicio + i * paso
    const etiquetas = [0, 5, n]
    const libres = rango(1, n - 1).filter((i) => i !== 5)
    const modo = azar()
    if (modo < 0.45) {
      const k = elegir(azar, libres)
      // Contar las marcas de 1 en 1 o de 10 en 10, o contar una marca de más o de menos.
      const frecuentes = paso === 10 ? [inicio + k, v(k + 1), v(k - 1), inicio + k * 100] : paso === 100 ? [inicio + k * 10, v(k + 1), v(k - 1), inicio + k] : [k * 100, v(k + 1), v(k - 1), k]
      const malas = distractores(v(k), frecuentes, { min: 0, paso }).filter((t) => Number(t.replace(/\s/g, '')) <= 9999)
      const alt = alternativas(azar, num(v(k)), malas, 4)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `recta:${inicio}:${paso}:${k}`,
        enunciado: 'Observa la recta numérica.',
        dibujo: dibujoRecta({ inicio, paso, n, etiquetas, flecha: k }),
        pregunta: '¿Qué número señala la flecha?',
        nota: `Las marcas van de ${num(paso)} en ${num(paso)}.`,
        ...alt,
      }
    }
    if (modo < 0.75) {
      const cas = barajar(azar, libres)
        .slice(0, 3)
        .sort((a, b) => a - b)
      return {
        forma: 'abierta',
        clave: `recta:${inicio}:${paso}:${cas.join('-')}`,
        enunciado: 'Escribe en los recuadros los números que faltan en la recta numérica.',
        dibujo: dibujoRecta({ inicio, paso, n, etiquetas, casillas: cas }),
        respuesta: cas.map((i) => num(v(i))).join(', '),
        espacio: 'dibujo',
        nota: `Las marcas van de ${num(paso)} en ${num(paso)}.`,
      }
    }
    // ¿Qué letra señala el número? Las otras letras van en las marcas vecinas, que es donde más se confunden.
    const k = elegir(azar, libres)
    const vecinas = barajar(azar, [k - 1, k + 1].filter((i) => i >= 1 && i <= n - 1))
    const otras = barajar(azar, rango(1, n - 1).filter((i) => i !== k && !vecinas.includes(i)))
    const letras = [k, ...[...vecinas, ...otras].slice(0, 3)].sort((a, b) => a - b)
    return {
      forma: 'opciones',
      clave: `recta-letra:${inicio}:${paso}:${letras.join('-')}:${k}`,
      enunciado: 'Observa la recta numérica.',
      dibujo: dibujoRecta({ inicio, paso, n, etiquetas: [0, n], letras }),
      pregunta: `¿Qué letra señala el número ${num(v(k))}?`,
      nota: `Las marcas van de ${num(paso)} en ${num(paso)}.`,
      alternativas: ['A', 'B', 'C', 'D'],
      correcta: letras.indexOf(k),
    }
  },
}

// ---------- Ordenar números de cuatro cifras ----------

type Icono = 'botellas' | 'papas' | 'cerro' | 'combi'

function botella() {
  return [
    rect(-11, -12, 22, 42, { relleno: '#e3eef3', grosor: 1.6, redondeo: 6 }),
    rect(-6, -22, 12, 11, { relleno: '#e3eef3', grosor: 1.6, redondeo: 2 }),
    rect(-7, -29, 14, 7, { relleno: '#9a9a9a', grosor: 1.4, redondeo: 2 }),
    rect(-11, 2, 22, 12, { relleno: '#ffffff', grosor: 1.4 }),
  ].join('')
}

function icono(ic: Icono) {
  if (ic === 'botellas') return [-26, 0, 26].map((x) => grupo(botella(), x, 0)).join('')
  if (ic === 'papas')
    return [
      elipse(-14, -16, 12, 8, { relleno: '#d7c08f', grosor: 1.6 }),
      elipse(7, -19, 13, 9, { relleno: '#d7c08f', grosor: 1.6 }),
      elipse(23, -13, 9, 7, { relleno: '#d7c08f', grosor: 1.6 }),
      ruta('M -30 -12 Q -38 16 -30 30 Q 0 36 30 30 Q 38 16 30 -12 Q 0 -6 -30 -12 Z', { relleno: '#efe2c4', grosor: 1.8 }),
      texto(0, 14, 'PAPA', { tam: 13, peso: 700 }),
    ].join('')
  if (ic === 'cerro')
    return [
      poligono([[2, 30], [26, -8], [50, 30]], { relleno: '#d4d4d4', grosor: 1.6 }),
      poligono([[-46, 30], [-6, -30], [34, 30]], { relleno: CLARO, grosor: 1.8 }),
      poligono([[-6, -30], [-18.8, -10.8], [-12, -15], [-6, -9], [0, -15], [6.8, -10.8]], { relleno: '#ffffff', grosor: 1.4 }),
    ].join('')
  return [
    ruta('M -44 18 L -44 -10 Q -44 -20 -34 -20 L 30 -20 Q 38 -20 42 -10 L 46 2 L 46 18 Z', { relleno: '#e8eef6', grosor: 1.8 }),
    ...[-38, -16, 6].map((x) => rect(x, -15, 18, 13, { relleno: '#ffffff', grosor: 1.4, redondeo: 2 })),
    poligono([[28, -15], [36, -15], [41, -3], [28, -3]], { relleno: '#ffffff', grosor: 1.4 }),
    linea(-44, 6, 46, 6, { trazo: GRIS, grosor: 1.4 }),
    circulo(-26, 19, 8, { relleno: '#9a9a9a', grosor: 1.6 }),
    circulo(28, 19, 8, { relleno: '#9a9a9a', grosor: 1.6 }),
  ].join('')
}

const TW = 132
const TH = 170

function tarjeta(ic: Icono, etiqueta: string, valor: number, unidad: string) {
  return [
    rect(0, 0, TW, TH, { relleno: '#ffffff', grosor: 1.6, redondeo: 10 }),
    grupo(icono(ic), TW / 2, 50),
    texto(TW / 2, 102, etiqueta, { tam: 14, peso: 700 }),
    linea(16, 116, TW - 16, 116, { trazo: GRIS, grosor: 1.4 }),
    texto(TW / 2, 138, num(valor), { tam: 24, peso: 700 }),
    texto(TW / 2, 159, unidad, { tam: 13, color: GRIS }),
  ].join('')
}

function dibujoTarjetas(ic: Icono, etiquetas: string[], valores: number[], unidad: string, conCasillas: boolean): Dibujo {
  const GAP = 10
  const W = 4 * TW + 3 * GAP + 6
  const partes = valores.map((v, i) => grupo(tarjeta(ic, etiquetas[i], v, unidad), 3 + i * (TW + GAP), 3))
  let alto = TH + 6
  if (conCasillas) {
    const CW = 96
    const SEP = 40
    const x0 = (W - (4 * CW + 3 * SEP)) / 2
    const y = TH + 30
    for (let i = 0; i < 4; i++) {
      partes.push(casilla(x0 + i * (CW + SEP), y, CW, 40))
      if (i < 3) partes.push(texto(x0 + i * (CW + SEP) + CW + SEP / 2, y + 20, '<', { tam: 26, peso: 700 }))
    }
    alto = y + 46
  }
  const alt = etiquetas.map((e, i) => `${e}: ${num(valores[i])} ${unidad}`).join('; ')
  return svg(W, alto, partes.join(''), conCasillas ? `${alt}; debajo, cuatro recuadros separados por el signo menor que` : alt)
}

const APELLIDOS = ['Quispe', 'Mamani', 'Huamán', 'Condori', 'Flores', 'Rojas', 'Torres', 'Ccori', 'Choque', 'Vargas']
const CERROS = ['Cerro Blanco', 'Cerro Negro', 'Cerro Colorado', 'Cerro Verde', 'Cerro Grande', 'Cerro Pelado', 'Cerro Rajado']

const PARA_ORDENAR: {
  icono: Icono
  enunciado: string
  unidad: string
  millares: [number, number]
  etiquetas: (azar: Azar) => string[]
  mas: string
  menos: string
}[] = [
  {
    icono: 'botellas',
    enunciado: 'Cada sección de 4.º juntó botellas de plástico para reciclar.',
    unidad: 'botellas',
    millares: [1, 4],
    etiquetas: () => ['4.º A', '4.º B', '4.º C', '4.º D'],
    mas: '¿Qué sección juntó más botellas?',
    menos: '¿Qué sección juntó menos botellas?',
  },
  {
    icono: 'papas',
    enunciado: 'Estos son los kilos de papa que cosechó cada familia de la comunidad.',
    unidad: 'kilos',
    millares: [1, 5],
    etiquetas: (azar) => barajar(azar, APELLIDOS).slice(0, 4).map((a) => `Familia ${a}`),
    mas: '¿Qué familia cosechó más kilos de papa?',
    menos: '¿Qué familia cosechó menos kilos de papa?',
  },
  {
    icono: 'cerro',
    enunciado: 'Estas son las alturas de algunos cerros de la región.',
    unidad: 'metros',
    millares: [3, 5],
    etiquetas: (azar) => barajar(azar, CERROS).slice(0, 4),
    mas: '¿Qué cerro es el más alto?',
    menos: '¿Qué cerro es el más bajo?',
  },
  {
    icono: 'combi',
    enunciado: 'Estos son los pasajeros que llevó cada combi del pueblo en un mes.',
    unidad: 'pasajeros',
    millares: [1, 4],
    etiquetas: (azar) =>
      barajar(azar, rango(1, 15))
        .slice(0, 4)
        .sort((a, b) => a - b)
        .map((x) => `Línea ${x}`),
    mas: '¿Qué combi llevó más pasajeros?',
    menos: '¿Qué combi llevó menos pasajeros?',
  },
]

/** Cuatro números difíciles de ordenar: con las mismas cifras (3058, 3085, 3508…) o vecinos de un millar (2975 y 3058). */
function paraOrdenar(azar: Azar, [lo, hi]: [number, number]): number[] {
  if (azar() < 0.5) {
    const m = entero(azar, lo, hi)
    const [a, b, c] = barajar(azar, rango(0, 9))
    const perm = [
      [a, b, c],
      [a, c, b],
      [b, a, c],
      [b, c, a],
      [c, a, b],
      [c, b, a],
    ].map(([x, y, z]) => m * 1000 + x * 100 + y * 10 + z)
    return barajar(azar, perm).slice(0, 4)
  }
  const m = entero(azar, lo + 1, hi)
  const [x, y] = barajar(azar, rango(1, 9))
  return [(m - 1) * 1000 + entero(azar, 860, 990), m * 1000 + x * 10 + y, m * 1000 + y * 10 + x, m * 1000 + entero(azar, 1, 9) * 100 + entero(azar, 0, 99)]
}

const cadena = (xs: number[]) => xs.map(num).join(' < ')
/** Errores al ordenar: mirar las cifras desde la derecha, olvidar el millar, invertir los dos más parecidos. */
function ordenesMalos(asc: number[]): number[][] {
  const porUnidades = [...asc].sort((a, b) => Number(String(a).split('').reverse().join('')) - Number(String(b).split('').reverse().join('')))
  const sinMillar = [...asc].sort((a, b) => (a % 1000) - (b % 1000))
  let k = 0
  for (let i = 1; i < 3; i++) if (asc[i + 1] - asc[i] < asc[k + 1] - asc[k]) k = i
  const cruzados = [...asc]
  ;[cruzados[k], cruzados[k + 1]] = [cruzados[k + 1], cruzados[k]]
  return [sinMillar, cruzados, porUnidades, [...asc].reverse()]
}

export const ordenarNumeros: TipoPregunta = {
  id: 'op-ordenar',
  nombre: 'Ordena de menor a mayor',
  queHacen: 'Comparan cantidades de cuatro cifras de su comunidad y las ordenan de menor a mayor, o encuentran la mayor y la menor.',
  citas: { [P4]: CITA_ORDEN },
  area: 'matematica',
  competencia: 1,
  cambia: 'numeros',
  generar({ azar }) {
    const ctx = elegir(azar, PARA_ORDENAR)
    const valores = paraOrdenar(azar, ctx.millares)
    if (new Set(valores).size < 4) return null
    const asc = [...valores].sort((a, b) => a - b)
    // Que no aparezcan ya ordenadas.
    const vista = probar(() => {
      const v = barajar(azar, valores)
      return cadena(v) === cadena(asc) || cadena(v) === cadena([...asc].reverse()) ? null : v
    })
    if (!vista) return null
    const etiquetas = ctx.etiquetas(azar)
    const clave = `ordenar:${ctx.icono}:${asc.join('-')}`
    const modo = azar()
    if (modo < 0.45) {
      const alt = alternativas(azar, cadena(asc), ordenesMalos(asc).map(cadena), 3)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave,
        enunciado: ctx.enunciado,
        dibujo: dibujoTarjetas(ctx.icono, etiquetas, vista, ctx.unidad, false),
        pregunta: '¿En qué alternativa están las cantidades ordenadas de menor a mayor?',
        ...alt,
      }
    }
    if (modo < 0.7) {
      return {
        forma: 'abierta',
        clave,
        enunciado: `${ctx.enunciado} Escribe las cantidades en los recuadros, ordenadas de menor a mayor.`,
        dibujo: dibujoTarjetas(ctx.icono, etiquetas, vista, ctx.unidad, true),
        respuesta: cadena(asc),
        espacio: 'dibujo',
      }
    }
    const mayor = azar() < 0.6
    const objetivo = mayor ? asc[3] : asc[0]
    const etiquetaDe = (v: number) => etiquetas[vista.indexOf(v)]
    // Primero la que más confunde: la que gana si se miran las cifras desde la derecha.
    const malo = ordenesMalos(asc)[2]
    const confusa = mayor ? malo[3] : malo[0]
    const otras = [confusa, ...(mayor ? [asc[2], asc[1], asc[0]] : [asc[1], asc[2], asc[3]])].filter((v) => v !== objetivo)
    const alt = alternativas(azar, etiquetaDe(objetivo), otras.map(etiquetaDe), 4)
    if (!alt) return null
    return {
      forma: 'opciones',
      clave,
      enunciado: ctx.enunciado,
      dibujo: dibujoTarjetas(ctx.icono, etiquetas, vista, ctx.unidad, false),
      pregunta: mayor ? ctx.mas : ctx.menos,
      nota: `De menor a mayor: ${cadena(asc)}.`,
      ...alt,
    }
  },
}

// ---------- Redondear a la decena con la recta ----------

export function dibujoRedondeo(D: number, punto: { n: number; etiqueta: string } | null, conCasilla: boolean): Dibujo {
  const W = 560
  const x0 = 60
  const dx = 44
  const y = punto ? 80 : 30
  const xs = (i: number) => x0 + i * dx
  const partes = [rectaConPuntas(16, W - 16, y)]
  for (let i = 0; i <= 10; i++) {
    const decena = i === 0 || i === 10
    partes.push(linea(xs(i), y - (decena ? 13 : i === 5 ? 10 : 8), xs(i), y + (decena ? 13 : i === 5 ? 10 : 8), { grosor: decena ? 2.6 : 1.8 }))
    if (decena) {
      partes.push(rect(xs(i) - 34, y + 18, 68, 28, { relleno: CLARO, grosor: 1.6, redondeo: 6 }))
      partes.push(texto(xs(i), y + 32, num(D + i), { tam: 18, peso: 700 }))
    }
    if (i === 5) partes.push(texto(xs(i), y + 31, num(D + 5), { tam: 14, color: GRIS }))
  }
  if (punto) {
    const x = xs(punto.n - D)
    const w = ancho(punto.etiqueta, 17) + 20
    partes.push(rect(x - w / 2, y - 62, w, 30, { relleno: '#ffffff', grosor: 1.6, redondeo: 6 }))
    partes.push(texto(x, y - 47, punto.etiqueta, { tam: 17, peso: 700 }))
    partes.push(linea(x, y - 32, x, y - 10, { grosor: 1.6 }))
    partes.push(circulo(x, y, 7, { relleno: TINTA, grosor: 1.4 }))
  }
  let alto = y + 52
  if (conCasilla) {
    partes.push(texto(W / 2 - 12, y + 84, 'Se redondea a', { tam: 17, ancla: 'end' }))
    partes.push(casilla(W / 2, y + 64, 100, 40))
    alto = y + 112
  }
  const alt = `Recta numérica de ${num(D)} a ${num(D + 10)}, de 1 en 1${punto ? `, con un punto en ${num(punto.n)}` : ''}${conCasilla ? ', y un recuadro para escribir el redondeo' : ''}`
  return svg(W, alto, partes.join(''), alt)
}

const PARA_REDONDEAR: { min: number; max: number; dinero: boolean; enunciado: (quien: string, n: number) => string; que: string }[] = [
  { min: 210, max: 690, dinero: true, enunciado: (q, n) => `${q} quiere comprar una bicicleta que cuesta ${soles(n)}.`, que: 'el precio de la bicicleta' },
  { min: 320, max: 890, dinero: true, enunciado: (_q, n) => `En la feria, una cocina cuesta ${soles(n)}.`, que: 'el precio de la cocina' },
  { min: 610, max: 1890, dinero: true, enunciado: (q, n) => `La familia de ${q} quiere comprar un televisor de ${soles(n)}.`, que: 'el precio del televisor' },
  { min: 1010, max: 4990, dinero: false, enunciado: (_q, n) => `En la fiesta patronal se vendieron ${num(n)} entradas.`, que: 'la cantidad de entradas' },
  { min: 310, max: 2990, dinero: false, enunciado: (_q, n) => `La biblioteca del colegio tiene ${num(n)} libros.`, que: 'la cantidad de libros' },
]

export const redondeoRecta: TipoPregunta = {
  id: 'op-redondeo-recta',
  nombre: 'Redondea con la recta',
  queHacen: 'Ubican un precio o una cantidad en la recta numérica, entre dos decenas, y lo redondean a la decena más cercana.',
  citas: { [P4]: CITA_REDONDEO },
  area: 'matematica',
  competencia: 1,
  cambia: 'numeros',
  generar({ azar }) {
    const ctx = elegir(azar, PARA_REDONDEAR)
    const n = probar(() => {
      const x = entero(azar, ctx.min, ctx.max)
      return redondeable(x) ? x : null
    })
    if (n === null) return null
    const D = decenaAbajo(n)
    const R = aLaDecena(n)
    const otra = R === D ? D + 10 : D
    const quien = nombre(azar)
    const fmt = (x: number) => (ctx.dinero ? soles(x) : num(x))
    const etiqueta = fmt(n)
    if (azar() < 0.6) {
      // Quedarse con la decena de abajo, redondear a la centena, irse una decena más allá.
      const malas = distractores(R, [otra, aLaCentena(n), R + (R - otra)], { min: 0, paso: 10 })
      const alt = alternativas(azar, fmt(R), ctx.dinero ? malas.map((m) => `S/ ${m}`) : malas, 4)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `redondeo:${n}`,
        enunciado: `${ctx.enunciado(quien, n)} Observa ese número en la recta numérica.`,
        dibujo: dibujoRedondeo(D, { n, etiqueta }, false),
        pregunta: `Si redondeas ${ctx.que} a la decena, ¿qué número obtienes?`,
        nota: `${num(n)} está más cerca de ${num(R)} que de ${num(otra)}.`,
        ...alt,
      }
    }
    return {
      forma: 'abierta',
      clave: `redondeo:${n}`,
      enunciado: `${ctx.enunciado(quien, n)} Marca ${num(n)} en la recta numérica y redondea ${ctx.que} a la decena.`,
      dibujo: dibujoRedondeo(D, null, true),
      respuesta: `${num(n)} va entre ${num(D)} y ${num(D + 10)}, más cerca de ${num(R)}: se redondea a ${num(R)}.`,
      espacio: 'dibujo',
    }
  },
}

// ---------- Estimar una compra redondeando ----------

type Producto = { nombre: string; el: string; min: number; max: number }

const ROPA: Producto[] = [
  { nombre: 'Mochila', el: 'la mochila', min: 35, max: 89 },
  { nombre: 'Zapatillas', el: 'las zapatillas', min: 61, max: 99 },
  { nombre: 'Buzo', el: 'el buzo', min: 41, max: 79 },
  { nombre: 'Casaca', el: 'la casaca', min: 52, max: 98 },
  { nombre: 'Lonchera', el: 'la lonchera', min: 16, max: 39 },
  { nombre: 'Polo', el: 'el polo', min: 12, max: 34 },
  { nombre: 'Pelota', el: 'la pelota', min: 21, max: 48 },
  { nombre: 'Chompa', el: 'la chompa', min: 31, max: 69 },
]

const CASA: Producto[] = [
  { nombre: 'Cocina', el: 'la cocina', min: 380, max: 890 },
  { nombre: 'Ropero', el: 'el ropero', min: 260, max: 690 },
  { nombre: 'Colchón', el: 'el colchón', min: 210, max: 590 },
  { nombre: 'Mesa', el: 'la mesa', min: 130, max: 390 },
  { nombre: 'Licuadora', el: 'la licuadora', min: 110, max: 290 },
  { nombre: 'Televisor', el: 'el televisor', min: 610, max: 990 },
  { nombre: 'Bicicleta', el: 'la bicicleta', min: 280, max: 790 },
]

export function dibujoEtiquetas(productos: { nombre: string; precio: number }[]): Dibujo {
  const W = 560
  const w = 124
  const GAP = 10
  const x0 = (W - (productos.length * w + (productos.length - 1) * GAP)) / 2
  const partes = [linea(6, 16, W - 6, 16, { grosor: 2.2 })]
  productos.forEach((p, i) => {
    const x = x0 + i * (w + GAP)
    const cx = x + w / 2
    partes.push(
      poligono([[x + 18, 30], [x + w - 18, 30], [x + w, 48], [x + w, 134], [x, 134], [x, 48]], { relleno: '#ffffff', grosor: 1.8 }),
      linea(cx, 16, cx, 36, { grosor: 1.6 }),
      circulo(cx, 40, 4.5, { relleno: '#ffffff', grosor: 1.4 }),
      texto(cx, 70, p.nombre, { tam: 15, peso: 700 }),
      texto(cx, 106, soles(p.precio), { tam: 26, peso: 700 }),
    )
  })
  return svg(W, 140, partes.join(''), `Etiquetas de precios: ${productos.map((p) => `${p.nombre}, ${soles(p.precio)}`).join('; ')}`)
}

const lista = (xs: string[]) => (xs.length === 1 ? xs[0] : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`)

export const estimarCompra: TipoPregunta = {
  id: 'op-estimar',
  nombre: 'Estima la compra redondeando',
  queHacen: 'Redondean precios a la decena para calcular, más o menos, cuánto cuesta una compra, o buscan qué precio se redondea a una decena.',
  citas: { [P4]: CITA_REDONDEO },
  area: 'matematica',
  competencia: 1,
  cambia: 'numeros',
  generar({ azar }) {
    const casa = azar() < 0.45
    const tienda = casa ? 'una tienda de muebles y electrodomésticos' : 'una tienda de ropa del mercado'
    const elegidos = barajar(azar, casa ? CASA : ROPA).slice(0, 4)
    const quien = nombre(azar)
    if (azar() < 0.65) {
      const cuantos = !casa && azar() < 0.4 ? 3 : 2
      const r = probar(() => {
        const precios = elegidos.map((p) => entero(azar, p.min, p.max))
        if (!precios.every(redondeable)) return null
        const compra = barajar(azar, [0, 1, 2, 3])
          .slice(0, cuantos)
          .sort((a, b) => a - b)
        const ps = compra.map((i) => precios[i])
        const exacto = sumar(ps)
        const aprox = sumar(ps.map(aLaDecena))
        // Que redondear antes o después de sumar dé lo mismo, y que la cuenta exacta no sea la aproximada.
        if (aLaDecena(exacto) !== aprox || exacto === aprox) return null
        return { precios, compra, ps, exacto, aprox }
      })
      if (!r) return null
      const malas = distractores(r.aprox, [r.exacto, sumar(r.ps.map(decenaAbajo)), sumar(r.ps.map((p) => decenaAbajo(p) + 10)), r.aprox + 10, r.aprox - 10], {
        min: 1,
        paso: 10,
      })
      const alt = alternativas(
        azar,
        soles(r.aprox),
        malas.map((m) => `S/ ${m}`),
        4,
      )
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `estimar:${r.precios.join('-')}:${r.compra.join('-')}`,
        enunciado: `${quien} va a ${tienda}. Observa los precios.`,
        dibujo: dibujoEtiquetas(elegidos.map((p, i) => ({ nombre: p.nombre, precio: r.precios[i] }))),
        pregunta: `${quien} compra ${lista(r.compra.map((i) => elegidos[i].el))}. Redondea cada precio a la decena: ¿cuánto gastará, más o menos?`,
        nota: `${r.ps.map((p) => num(aLaDecena(p))).join(' + ')} = ${num(r.aprox)} (la cuenta exacta es ${num(r.exacto)}).`,
        ...alt,
      }
    }
    // ¿Qué precio se redondea a T? Los otros se redondean a T si se corta siempre hacia abajo, o siempre hacia arriba.
    const T = casa ? entero(azar, 20, 80) * 10 : entero(azar, 3, 8) * 10
    const correcto = T + elegir(azar, [-4, -3, -2, -1, 1, 2, 3, 4])
    const cortaAbajo = T + entero(azar, 6, 9)
    const subeSiempre = T - entero(azar, 6, 9)
    const lejos = azar() < 0.5 ? T + entero(azar, 11, 14) : T - entero(azar, 11, 14)
    const precios = barajar(azar, [correcto, cortaAbajo, subeSiempre, lejos])
    const nombreDe = (p: number) => elegidos[precios.indexOf(p)].nombre
    const alt = alternativas(azar, nombreDe(correcto), [cortaAbajo, subeSiempre, lejos].map(nombreDe), 4)
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `estimar-cual:${precios.join('-')}`,
      enunciado: `${quien} va a ${tienda}. Observa los precios.`,
      dibujo: dibujoEtiquetas(elegidos.map((p, i) => ({ nombre: p.nombre, precio: precios[i] }))),
      pregunta: `¿Qué producto tiene un precio que, redondeado a la decena, es ${soles(T)}?`,
      nota: `${soles(correcto)} se redondea a ${soles(T)}.`,
      ...alt,
    }
  },
}

// ---------- La bodega ----------

type DeBodega = { nombre: string; unidad: string; min: number; max: number; uno: string; varios: string; en: string; cuantos: string }

const BODEGA: DeBodega[] = [
  { nombre: 'Arroz', unidad: '1 kg', min: 4, max: 5, uno: '1 kg de arroz', varios: 'kg de arroz', en: 'arroz', cuantos: '¿Cuántos kilos de arroz' },
  { nombre: 'Azúcar', unidad: '1 kg', min: 3, max: 5, uno: '1 kg de azúcar', varios: 'kg de azúcar', en: 'azúcar', cuantos: '¿Cuántos kilos de azúcar' },
  { nombre: 'Leche', unidad: 'tarro', min: 4, max: 5, uno: '1 tarro de leche', varios: 'tarros de leche', en: 'leche', cuantos: '¿Cuántos tarros de leche' },
  { nombre: 'Aceite', unidad: 'botella', min: 8, max: 12, uno: '1 botella de aceite', varios: 'botellas de aceite', en: 'aceite', cuantos: '¿Cuántas botellas de aceite' },
  { nombre: 'Fideos', unidad: 'paquete', min: 2, max: 4, uno: '1 paquete de fideos', varios: 'paquetes de fideos', en: 'fideos', cuantos: '¿Cuántos paquetes de fideos' },
  { nombre: 'Atún', unidad: 'lata', min: 5, max: 8, uno: '1 lata de atún', varios: 'latas de atún', en: 'atún', cuantos: '¿Cuántas latas de atún' },
  { nombre: 'Yogur', unidad: 'botella', min: 6, max: 9, uno: '1 botella de yogur', varios: 'botellas de yogur', en: 'yogur', cuantos: '¿Cuántas botellas de yogur' },
  { nombre: 'Huevos', unidad: '1 kg', min: 7, max: 9, uno: '1 kg de huevos', varios: 'kg de huevos', en: 'huevos', cuantos: '¿Cuántos kilos de huevos' },
  { nombre: 'Papa', unidad: '1 kg', min: 2, max: 3, uno: '1 kg de papa', varios: 'kg de papa', en: 'papa', cuantos: '¿Cuántos kilos de papa' },
]

const SACOS = [
  { nombre: 'Saco de arroz', unidad: '50 kg', min: 165, max: 235, varios: 'sacos de arroz', para: 'Para el comedor del colegio' },
  { nombre: 'Saco de azúcar', unidad: '50 kg', min: 150, max: 210, varios: 'sacos de azúcar', para: 'Para la olla común del barrio' },
  { nombre: 'Caja de leche', unidad: '48 tarros', min: 180, max: 240, varios: 'cajas de leche', para: 'Para la chocolatada de Navidad' },
]

const de = (p: { uno?: string; varios: string }, n: number) => (n === 1 && p.uno ? p.uno : `${n} ${p.varios}`)

export function dibujoBodega(filas: { nombre: string; unidad: string; precio: number }[]): Dibujo {
  const W = 440
  const partes: string[] = []
  // Toldo a rayas, para que se lea como una bodega.
  for (let i = 0; i < 10; i++) {
    const x = 10 + i * 42
    const relleno = i % 2 ? '#ffffff' : '#d9d9d9'
    partes.push(rect(x, 4, 42, 24, { relleno, grosor: 1.4 }))
    partes.push(ruta(`M ${x} 28 Q ${x + 21} 46 ${x + 42} 28 Z`, { relleno, grosor: 1.4 }))
  }
  const fondo = 118 + (filas.length - 1) * 30 + 20
  partes.push(rect(20, 50, 400, fondo + 10 - 50, { relleno: '#d8c6a0', grosor: 2, redondeo: 8 }))
  partes.push(rect(30, 60, 380, fondo - 60, { relleno: '#ffffff', grosor: 1.4, redondeo: 4 }))
  partes.push(texto(W / 2, 82, 'LISTA DE PRECIOS', { tam: 17, peso: 700 }))
  partes.push(linea(46, 98, 394, 98, { grosor: 1.4 }))
  filas.forEach((f, i) => {
    const y = 118 + i * 30
    // Filas a rayas suaves, para seguir con la vista el producto hasta su precio.
    if (i % 2 === 0) partes.push(rect(38, y - 14, 364, 28, { relleno: '#efefef', trazo: 'none', redondeo: 3 }))
    partes.push(texto(48, y, f.nombre, { tam: 16, peso: 700, ancla: 'start' }))
    partes.push(texto(48 + ancho(f.nombre, 16) + 6, y, `(${f.unidad})`, { tam: 15, color: GRIS, ancla: 'start' }))
    partes.push(texto(392, y, soles(f.precio), { tam: 17, peso: 700, ancla: 'end' }))
  })
  return svg(W, fondo + 14, partes.join(''), `Lista de precios de la bodega: ${filas.map((f) => `${f.nombre} (${f.unidad}), ${soles(f.precio)}`).join('; ')}`)
}

/** 7 × 165 "sin llevar": cada cifra por 7 y solo se escriben las unidades (7, 2, 5 → 725). */
function sinLlevar(n: number, p: number) {
  return Number(
    String(p)
      .split('')
      .map((d) => (Number(d) * n) % 10)
      .join(''),
  )
}

export const bodega: TipoPregunta = {
  id: 'op-bodega',
  nombre: 'Compra en la bodega',
  queHacen: 'Leen la lista de precios de la bodega y resuelven problemas de compras: cuánto se paga, cuánto es el vuelto o cuántos se pueden comprar.',
  citas: { [P4]: CITA_PROBLEMAS },
  area: 'matematica',
  competencia: 1,
  cambia: 'numeros',
  generar({ azar }) {
    const productos = barajar(azar, BODEGA).slice(0, 5)
    const precios = productos.map((p) => entero(azar, p.min, p.max))
    const saco = elegir(azar, SACOS)
    const precioSaco = entero(azar, saco.min, saco.max)
    const dibujo = dibujoBodega([...productos.map((p, i) => ({ nombre: p.nombre, unidad: p.unidad, precio: precios[i] })), { nombre: saco.nombre, unidad: saco.unidad, precio: precioSaco }])
    const base = `bodega:${precios.join('-')}:${saco.nombre}${precioSaco}`
    const quien = nombre(azar)
    const enunciado = 'Observa la lista de precios de la bodega.'
    const modo = azar()
    if (modo < 0.3) {
      // Cuánto paga por dos productos, varios de cada uno.
      const [i, j] = barajar(azar, [0, 1, 2, 3, 4])
      const a = entero(azar, 2, 6)
      const b = entero(azar, 2, 5)
      const [pa, pb] = [precios[i], precios[j]]
      const total = a * pa + b * pb
      // Olvidar multiplicar uno de los dos, o multiplicar todo por un solo precio.
      const malas = distractores(total, [a * pa + pb, pa + b * pb, (a + b) * Math.max(pa, pb), total + pa, total - pb], { min: 1 })
      const alt = alternativas(
        azar,
        soles(total),
        malas.map((m) => `S/ ${m}`),
        4,
      )
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `${base}:paga:${i}x${a}:${j}x${b}`,
        enunciado,
        dibujo,
        pregunta: `${quien} compra ${de(productos[i], a)} y ${de(productos[j], b)}. ¿Cuánto paga?`,
        nota: `${a} × ${pa} + ${b} × ${pb} = ${a * pa} + ${b * pb} = ${total}`,
        ...alt,
      }
    }
    if (modo < 0.55) {
      // El vuelto.
      const dos = azar() < 0.5
      const [i, j] = barajar(azar, [0, 1, 2, 3, 4])
      const a = entero(azar, 2, 6)
      const costo = a * precios[i] + (dos ? precios[j] : 0)
      const billete = [20, 50, 100].find((x) => x > costo + 1)
      if (!billete) return null
      const vuelto = billete - costo
      // Restar el precio de uno solo, dar el costo en vez del vuelto, equivocarse al restar con canje.
      const malas = distractores(vuelto, [billete - precios[i] - (dos ? precios[j] : 0), costo, vuelto + 10, vuelto - 10], { min: 1 })
      const alt = alternativas(
        azar,
        soles(vuelto),
        malas.map((m) => `S/ ${m}`),
        4,
      )
      if (!alt) return null
      const compra = dos ? `${de(productos[i], a)} y ${de(productos[j], 1)}` : de(productos[i], a)
      return {
        forma: 'opciones',
        clave: `${base}:vuelto:${i}x${a}:${dos ? j : '-'}:${billete}`,
        enunciado,
        dibujo,
        pregunta: `${quien} compra ${compra}. Paga con un billete de ${soles(billete)}. ¿Cuánto recibe de vuelto?`,
        nota: `${dos ? `${a} × ${precios[i]} + ${precios[j]}` : `${a} × ${precios[i]}`} = ${costo}; ${billete} − ${costo} = ${vuelto}`,
        ...alt,
      }
    }
    if (modo < 0.75) {
      // Cuántos puede comprar: una división exacta.
      const i = probar(() => {
        const x = entero(azar, 0, 4)
        return precios[x] >= 2 ? x : null
      })
      if (i === null) return null
      // Que la cantidad no sea igual al precio: así no se confunde una con otro.
      const k = elegir(
        azar,
        rango(3, 9).filter((x) => x !== precios[i]),
      )
      const dinero = k * precios[i]
      const malas = distractores(k, [k + 1, k - 1, dinero - precios[i], k + 2], { min: 1 })
      const alt = alternativas(azar, num(k), malas, 4)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `${base}:cuantos:${i}:${k}`,
        enunciado,
        dibujo,
        pregunta: `${quien} tiene ${soles(dinero)} y lo gasta todo en ${productos[i].en}, sin que le sobre nada. ${productos[i].cuantos} compra?`,
        nota: `${dinero} ÷ ${precios[i]} = ${k}`,
        ...alt,
      }
    }
    // Compra al por mayor: tres cifras por una cifra.
    const n = entero(azar, 3, 9)
    const total = n * precioSaco
    const malas = distractores(total, [sinLlevar(n, precioSaco), total + 100, total - 100, total - 10, total + 10], { min: 100, paso: 10 })
    const alt = alternativas(
      azar,
      soles(total),
      malas.map((m) => `S/ ${m}`),
      4,
    )
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `${base}:mayor:${n}`,
      enunciado,
      dibujo,
      pregunta: `${saco.para} compran ${de(saco, n)} en esta bodega. ¿Cuánto pagan?`,
      nota: `${n} × ${precioSaco} = ${total}`,
      ...alt,
    }
  },
}

// ---------- Arreglos y repartos ----------

function huevo(cx: number, cy: number) {
  return elipse(cx, cy, 6.5, 8, { relleno: '#f6efe0', grosor: 1.4 })
}

function alfajor(cx: number, cy: number) {
  return circulo(cx, cy, 7.5, { relleno: '#e8d9b5', grosor: 1.4 }) + circulo(cx, cy, 3, { relleno: '#ffffff', grosor: 1.4 })
}

export function dibujoCajas(k: number, filas: number, columnas: number, cosa: 'huevo' | 'alfajor'): Dibujo {
  const S = 18
  const PAD = 8
  const w = columnas * S + 2 * PAD
  const h = filas * S + 2 * PAD
  const GAP = 16
  const partes: string[] = []
  for (let c = 0; c < k; c++) {
    const x = 4 + c * (w + GAP)
    partes.push(rect(x, 4, w, h, { relleno: cosa === 'huevo' ? '#dcdcdc' : '#f3f3f3', grosor: 1.8, redondeo: 6 }))
    for (let i = 0; i < filas; i++)
      for (let j = 0; j < columnas; j++) {
        const cx = x + PAD + S / 2 + j * S
        const cy = 4 + PAD + S / 2 + i * S
        partes.push(cosa === 'huevo' ? huevo(cx, cy) : alfajor(cx, cy))
      }
  }
  const nombreCaja = cosa === 'huevo' ? 'maples' : 'cajas'
  return svg(k * w + (k - 1) * GAP + 8, h + 8, partes.join(''), `${k} ${nombreCaja}, cada ${cosa === 'huevo' ? 'uno' : 'una'} con ${filas} filas de ${columnas} ${cosa === 'huevo' ? 'huevos' : 'alfajores'}`)
}

export function dibujoAula(filas: number, columnas: number): Dibujo {
  const SX = 60
  const SY = 46
  const W = Math.max(columnas * SX, 240) + 16
  const x0 = (W - columnas * SX) / 2
  const partes = [rect(W / 2 - 90, 6, 180, 26, { relleno: '#cfcfcf', grosor: 1.8, redondeo: 3 }), texto(W / 2, 19, 'PIZARRA', { tam: 13, peso: 700 })]
  for (let i = 0; i < filas; i++)
    for (let j = 0; j < columnas; j++) {
      const x = x0 + j * SX + 10
      const y = 50 + i * SY
      partes.push(rect(x, y, 40, 20, { relleno: '#e6d2ad', grosor: 1.6, redondeo: 2 }))
      partes.push(rect(x + 9, y + 24, 22, 10, { relleno: CLARO, grosor: 1.4, redondeo: 2 }))
    }
  return svg(W, 50 + filas * SY, partes.join(''), `Aula vista desde arriba: la pizarra y ${filas} filas de ${columnas} carpetas con su silla`)
}

type Suelto = 'lapiz' | 'pan' | 'yogur'

function suelto(cosa: Suelto, cx: number, cy: number) {
  if (cosa === 'pan')
    return [
      elipse(cx, cy, 15, 9.5, { relleno: '#e6d2ad', grosor: 1.6 }),
      // El corte a lo largo del pan francés.
      ruta(`M ${cx - 9} ${cy + 2} Q ${cx} ${cy - 5} ${cx + 9} ${cy + 2}`, { grosor: 1.4 }),
    ].join('')
  if (cosa === 'lapiz')
    return [
      rect(cx - 4.5, cy - 17, 9, 26, { relleno: '#f1e3b8', grosor: 1.4 }),
      poligono([[cx - 4.5, cy + 9], [cx + 4.5, cy + 9], [cx, cy + 19]], { relleno: '#ffffff', grosor: 1.4 }),
    ].join('')
  return [
    rect(cx - 7, cy - 9, 14, 24, { relleno: '#e3eef3', grosor: 1.4, redondeo: 4 }),
    rect(cx - 4, cy - 16, 8, 7, { relleno: '#9a9a9a', grosor: 1.4, redondeo: 1 }),
  ].join('')
}

const MEDIDA: Record<Suelto, [number, number]> = { pan: [42, 28], lapiz: [24, 46], yogur: [26, 42] }

/** Objetos sueltos en filas, sin agrupar (los agrupa el alumno). */
function sueltos(cosa: Suelto, n: number, porFila: number, cx: number, y0: number) {
  const [sx, sy] = MEDIDA[cosa]
  const partes: string[] = []
  for (let i = 0; i < n; i++) {
    const fila = Math.floor(i / porFila)
    const enFila = Math.min(porFila, n - fila * porFila)
    const x = cx - ((enFila - 1) * sx) / 2 + (i % porFila) * sx
    partes.push(suelto(cosa, x, y0 + sy / 2 + fila * sy))
  }
  return { cuerpo: partes.join(''), alto: Math.ceil(n / porFila) * sy }
}

const PARA_AGRUPAR: { cosa: Suelto; muchos: string; en: string; caben: (g: number) => string }[] = [
  { cosa: 'lapiz', muchos: 'lápices', en: 'cajitas', caben: (g) => `En cada cajita entran ${g} lápices.` },
  { cosa: 'pan', muchos: 'panes', en: 'bolsas', caben: (g) => `En cada bolsa se ponen ${g} panes.` },
  { cosa: 'yogur', muchos: 'yogures', en: 'cajas', caben: (g) => `En cada caja entran ${g} yogures.` },
]

export function dibujoReparto(panes: number, bolsas: number): Dibujo {
  const W = 540
  const porFila = panes <= 12 ? panes : panes <= 20 ? 10 : 12
  const s = sueltos('pan', panes, porFila, W / 2, 6)
  const yb = s.alto + 26
  const BW = 110
  const BH = 86
  const GAP = 20
  const x0 = (W - (bolsas * BW + (bolsas - 1) * GAP)) / 2
  const partes = [s.cuerpo]
  for (let i = 0; i < bolsas; i++) {
    const x = x0 + i * (BW + GAP)
    partes.push(poligono([[x, yb + 10], [x + BW, yb + 10], [x + BW - 6, yb + BH], [x + 6, yb + BH]], { relleno: '#ffffff', grosor: 1.8 }))
    partes.push(rect(x - 2, yb, BW + 4, 12, { relleno: '#e6d2ad', grosor: 1.6, redondeo: 2 }))
    partes.push(texto(x + BW / 2, yb + BH - 13, `Bolsa ${i + 1}`, { tam: 13, color: GRIS }))
  }
  const ya = yb + BH + 36
  partes.push(texto(W / 2 - 46, ya, 'En cada bolsa van', { tam: 17, ancla: 'end' }), casilla(W / 2 - 34, ya - 20, 68, 40), texto(W / 2 + 44, ya, 'panes.', { tam: 17, ancla: 'start' }))
  return svg(W, ya + 26, partes.join(''), `${panes} panes sueltos y, debajo, ${bolsas} bolsas vacías y un recuadro para escribir cuántos van en cada una`)
}

export const arreglos: TipoPregunta = {
  id: 'op-arreglos',
  nombre: 'Maples, filas y repartos',
  queHacen: 'Resuelven problemas con huevos en maples, carpetas en filas, objetos que se agrupan en cajas o se reparten en bolsas, y los escriben como multiplicación o división.',
  citas: { [P4]: CITA_ARREGLOS },
  area: 'matematica',
  competencia: 1,
  cambia: 'numeros',
  generar({ azar }) {
    const modo = azar()
    const quien = nombre(azar)
    if (modo < 0.3) {
      // Reiterar: k cajas iguales.
      const huevos = azar() < 0.55
      const filas = huevos ? 5 : entero(azar, 3, 4)
      const columnas = huevos ? 6 : entero(azar, 4, 6)
      const k = entero(azar, 2, 4)
      const una = filas * columnas
      const total = k * una
      // Sumar filas y columnas, contar una sola caja, contar una caja de más, olvidar una fila.
      const malas = distractores(total, [k * (filas + columnas), una, una * (k + 1), total - columnas, total + 10], { min: 1 })
      const alt = alternativas(azar, num(total), malas, 4)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `cajas:${huevos ? 'h' : 'a'}:${k}:${filas}x${columnas}`,
        enunciado: huevos ? `En la bodega hay ${k} maples de huevos, todos llenos.` : `Para el compartir del aula compraron ${k} cajas de alfajores, todas llenas.`,
        dibujo: dibujoCajas(k, filas, columnas, huevos ? 'huevo' : 'alfajor'),
        pregunta: huevos ? '¿Cuántos huevos hay en total?' : '¿Cuántos alfajores hay en total?',
        nota: `Cada ${huevos ? 'maple' : 'caja'}: ${filas} × ${columnas} = ${una}. En total: ${k} × ${una} = ${total}`,
        ...alt,
      }
    }
    if (modo < 0.55) {
      // El modelo: qué multiplicación da las carpetas del aula.
      const filas = entero(azar, 3, 5)
      const columnas = probar(() => {
        const c = entero(azar, 4, 7)
        return c !== filas ? c : null
      })
      if (columnas === null) return null
      const malas = [`${filas} + ${columnas}`, `${columnas} × ${columnas}`, `${filas} × ${filas}`, `${filas} × ${columnas + 1}`]
      const alt = alternativas(azar, `${filas} × ${columnas}`, malas, 4)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `aula:${filas}x${columnas}`,
        enunciado: `Así están las carpetas en el aula de ${quien}: ${filas} filas, todas con la misma cantidad de carpetas.`,
        dibujo: dibujoAula(filas, columnas),
        pregunta: '¿Qué operación sirve para saber cuántas carpetas hay?',
        nota: `${filas} filas de ${columnas} carpetas: ${filas} × ${columnas} = ${filas * columnas}`,
        ...alt,
      }
    }
    if (modo < 0.8) {
      // Agrupar: cuántas cajas se llenan.
      const ctx = elegir(azar, PARA_AGRUPAR)
      const r = probar(() => {
        const g = entero(azar, 3, 8)
        const k = entero(azar, 3, 8)
        return g !== k && g * k <= 48 ? { g, k } : null
      })
      if (!r) return null
      const N = r.g * r.k
      const porFila = ctx.cosa === 'pan' ? 10 : N > 40 ? 16 : 12
      const s = sueltos(ctx.cosa, N, porFila, 260, 4)
      const malas = distractores(r.k, [r.k + 1, r.k - 1, N - r.g, r.k + 2], { min: 1 })
      const alt = alternativas(azar, num(r.k), malas, 4)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `agrupar:${ctx.cosa}:${N}:${r.g}`,
        enunciado: `${quien} tiene ${N} ${ctx.muchos} para guardar. ${ctx.caben(r.g)}`,
        dibujo: svg(520, s.alto + 8, s.cuerpo, `${N} ${ctx.muchos} sueltos`),
        pregunta: `¿Cuántas ${ctx.en} llena?`,
        nota: `${N} ÷ ${r.g} = ${r.k}`,
        ...alt,
      }
    }
    // Repartir en partes iguales, dibujando.
    const bolsas = entero(azar, 2, 4)
    const cada = entero(azar, 3, bolsas === 4 ? 6 : 8)
    const panes = bolsas * cada
    return {
      forma: 'abierta',
      clave: `repartir:${panes}:${bolsas}`,
      enunciado: `${quien} reparte ${panes} panes en ${bolsas} bolsas: todas con la misma cantidad. Dibuja los panes en las bolsas y escribe cuántos van en cada una.`,
      dibujo: dibujoReparto(panes, bolsas),
      respuesta: `${panes} ÷ ${bolsas} = ${cada}: van ${cada} panes en cada bolsa.`,
      espacio: 'dibujo',
    }
  },
}

// ---------- Propiedad conmutativa: el arreglo girado ----------

function bombon(cx: number, cy: number) {
  return rect(cx - 9, cy - 9, 18, 18, { relleno: '#c9c9c9', grosor: 1.4, redondeo: 4 })
}

/** Una lechuga vista desde arriba: la cabeza y su cogollo más oscuro. */
function lechuga(cx: number, cy: number) {
  return circulo(cx, cy, 9.5, { relleno: '#dfe9d6', grosor: 1.4 }) + circulo(cx, cy, 4.5, { relleno: '#b9cfa6', grosor: 1.4 })
}

/** Dos arreglos: a filas de b y b filas de a. El de la derecha puede ir vacío, para dibujarlo. */
export function dibujoGirado(a: number, b: number, etiquetas: [string, string], cosa: 'bombon' | 'lechuga', derechaVacia: boolean, fila?: (string | null)[]): Dibujo {
  const S = 24
  const PAD = 8
  const cajas = [
    { filas: a, columnas: b },
    { filas: b, columnas: a },
  ].map((c) => ({ ...c, w: c.columnas * S + 2 * PAD, h: c.filas * S + 2 * PAD }))
  const cols = cajas.map((c, i) => Math.max(c.w, ancho(etiquetas[i], 15) + 10))
  const justo = 14 + cols[0] + 56 + cols[1] + 14
  const W = Math.max(justo, fila ? 360 : 0)
  const corre = (W - justo) / 2
  const centros = [corre + 14 + cols[0] / 2, corre + 14 + cols[0] + 56 + cols[1] / 2]
  const partes: string[] = []
  cajas.forEach((c, k) => {
    const x = centros[k] - c.w / 2
    partes.push(texto(centros[k], 14, etiquetas[k], { tam: 15, peso: 700 }))
    partes.push(rect(x, 30, c.w, c.h, { relleno: cosa === 'bombon' ? '#f3f3f3' : '#efe6d6', grosor: 1.8, redondeo: 6 }))
    for (let i = 0; i < c.filas; i++)
      for (let j = 0; j < c.columnas; j++) {
        const cx = x + PAD + S / 2 + j * S
        const cy = 30 + PAD + S / 2 + i * S
        if (k === 1 && derechaVacia) partes.push(rect(cx - 9, cy - 9, 18, 18, { trazo: GRIS, grosor: 1.4, punteado: true, redondeo: 4 }))
        else partes.push(cosa === 'bombon' ? bombon(cx, cy) : lechuga(cx, cy))
      }
  })
  let alto = 30 + Math.max(cajas[0].h, cajas[1].h) + 8
  if (fila) {
    partes.push(igualdad(fila, W / 2, alto + 30))
    alto += 58
  }
  const cosas = cosa === 'bombon' ? 'bombones' : 'lechugas'
  return svg(
    W,
    alto,
    partes.join(''),
    `${etiquetas[0]}: ${a} filas de ${b} ${cosas}. ${etiquetas[1]}: ${derechaVacia ? `espacio vacío para ${b} filas de ${a}` : `${b} filas de ${a} ${cosas}`}${fila ? '. Debajo, una igualdad para completar' : ''}`,
  )
}

export const conmutativa: TipoPregunta = {
  id: 'op-conmutativa',
  nombre: 'Gira el arreglo',
  queHacen: 'Comparan un arreglo con el mismo arreglo girado (3 filas de 5 y 5 filas de 3) y lo escriben con la propiedad conmutativa: 3 × 5 = 5 × 3.',
  citas: { [P4]: CITA_PROPIEDADES },
  area: 'matematica',
  competencia: 1,
  cambia: 'numeros',
  generar({ azar }) {
    const r = probar(() => {
      const x = entero(azar, 2, 6)
      const y = entero(azar, 3, 8)
      return x !== y && x * y <= 40 ? (azar() < 0.5 ? [x, y] : [y, x]) : null
    })
    if (!r) return null
    const [a, b] = r
    const bombones = azar() < 0.6
    const [n1, n2] = dosNombres(azar)
    const etiquetas: [string, string] = bombones ? [`Caja de ${n1}`, `Caja de ${n2}`] : ['Biohuerto de 4.º A', 'Biohuerto de 4.º B']
    const cosa = bombones ? 'bombon' : 'lechuga'
    const cosas = bombones ? 'bombones' : 'lechugas'
    const enunciado = bombones ? `Estas son las cajas de bombones de ${n1} y de ${n2}.` : 'Las dos secciones de 4.º sembraron lechugas en su biohuerto.'
    const iguales = bombones ? 'Las dos cajas tienen la misma cantidad de bombones.' : 'Los dos biohuertos tienen la misma cantidad de lechugas.'
    const modo = azar()
    if (modo < 0.45) {
      const alt = alternativas(azar, `${a} × ${b} = ${b} × ${a}`, [`${a} × ${b} = ${a} + ${b}`, `${a} × ${a} = ${b} × ${b}`, `${a} × ${b} = ${b} × ${b}`], 4)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `girado:${a}x${b}`,
        enunciado,
        dibujo: dibujoGirado(a, b, etiquetas, cosa, false),
        pregunta: `${iguales} ¿Qué igualdad lo muestra?`,
        nota: `${a} filas de ${b} y ${b} filas de ${a}: ${a} × ${b} = ${b} × ${a} = ${a * b}`,
        ...alt,
      }
    }
    if (modo < 0.75) {
      // El factor que falta: no es el producto, ni el mismo número que ya está.
      const alt = alternativas(azar, num(a), [num(b), num(a * b), num(a + b)], 4)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `girado-falta:${a}x${b}`,
        enunciado: `${enunciado} ${iguales}`,
        dibujo: dibujoGirado(a, b, etiquetas, cosa, false, [`${a} × ${b} = ${b} ×`, null]),
        pregunta: '¿Qué número va en el recuadro?',
        nota: `${a} × ${b} = ${b} × ${a}`,
        ...alt,
      }
    }
    return {
      forma: 'abierta',
      clave: `girado-dibuja:${a}x${b}`,
      enunciado: `${enunciado} ${iguales} ${bombones ? `La caja de ${n2}` : 'El biohuerto de 4.º B'} tiene ${b} filas de ${a} ${cosas}: dibújalos y completa la igualdad.`,
      dibujo: dibujoGirado(a, b, etiquetas, cosa, true, [null, '×', null, '=', null, '×', null]),
      respuesta: `${a} × ${b} = ${b} × ${a} (${a * b} ${cosas} en cada uno)`,
      espacio: 'dibujo',
    }
  },
}

// ---------- Propiedad asociativa: agrupar de otra forma ----------

function pan(cx: number, cy: number) {
  return elipse(cx, cy, 8.5, 6.5, { relleno: '#e6d2ad', grosor: 1.4 })
}

/** k bandejas, cada una con r filas de c panes; debajo, carteles o una igualdad para completar. */
export function dibujoBandejas(k: number, r: number, c: number, abajo: { carteles?: [string, string]; fila?: (string | null)[] }): Dibujo {
  const S = 22
  const PAD = 8
  const w = c * S + 2 * PAD
  const h = r * S + 2 * PAD
  const GAP = 24
  const W = Math.max(k * w + (k - 1) * GAP + 16, 464)
  const x0 = (W - (k * w + (k - 1) * GAP)) / 2
  const partes: string[] = []
  for (let t = 0; t < k; t++) {
    const x = x0 + t * (w + GAP)
    partes.push(rect(x, 6, w, h, { relleno: '#dcdcdc', grosor: 1.8, redondeo: 6 }))
    for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) partes.push(pan(x + PAD + S / 2 + j * S, 6 + PAD + S / 2 + i * S))
  }
  let alto = h + 12
  if (abajo.carteles) {
    abajo.carteles.forEach((t, i) => {
      const cx = W / 2 + (i === 0 ? -1 : 1) * 114
      partes.push(rect(cx - 106, alto + 12, 212, 40, { relleno: '#ffffff', grosor: 1.6, redondeo: 8 }))
      partes.push(texto(cx, alto + 32, t, { tam: 16, peso: 700 }))
    })
    alto += 60
  }
  if (abajo.fila) {
    partes.push(igualdad(abajo.fila, W / 2, alto + 32))
    alto += 60
  }
  return svg(W, alto, partes.join(''), `${k} bandejas, cada una con ${r} filas de ${c} panes${abajo.carteles ? `; debajo, dos carteles: ${abajo.carteles.join(' y ')}` : ''}${abajo.fila ? '; debajo, una igualdad para completar' : ''}`)
}

/** Tres tarjetas a × b × c, con un arco que junta la primera y la última. */
export function dibujoFactores(a: number, b: number, c: number): Dibujo {
  const CW = 70
  const SIGNO = 40
  const xs = [10, 10 + CW + SIGNO, 10 + 2 * (CW + SIGNO)]
  const y = 58
  const partes: string[] = []
  ;[a, b, c].forEach((n, i) => {
    partes.push(rect(xs[i], y, CW, 56, { relleno: i === 1 ? '#ffffff' : CLARO, grosor: 2, redondeo: 8 }))
    partes.push(texto(xs[i] + CW / 2, y + 28, num(n), { tam: 26, peso: 700 }))
    if (i < 2) partes.push(texto(xs[i] + CW + SIGNO / 2, y + 28, '×', { tam: 26, peso: 700 }))
  })
  const xa = xs[0] + CW / 2
  const xc = xs[2] + CW / 2
  partes.push(ruta(`M ${xa} ${y - 4} Q ${(xa + xc) / 2} ${y - 60} ${xc} ${y - 4}`, { grosor: 2 }))
  partes.push(circulo(xa, y - 4, 3.5, { relleno: TINTA, grosor: 1.4 }), circulo(xc, y - 4, 3.5, { relleno: TINTA, grosor: 1.4 }))
  partes.push(texto((xa + xc) / 2, 14, 'primero', { tam: 14, color: GRIS }))
  return svg(xs[2] + CW + 10, y + 62, partes.join(''), `Tarjetas ${a} × ${b} × ${c}; un arco junta el ${a} y el ${c} con la palabra «primero»`)
}

export const asociativa: TipoPregunta = {
  id: 'op-asociativa',
  nombre: 'Agrupa de otra forma',
  queHacen: 'Multiplican tres números agrupándolos de distintas formas, (2 × 3) × 4 = 2 × (3 × 4), y eligen el orden más fácil para calcular.',
  citas: { [P4]: CITA_PROPIEDADES },
  area: 'matematica',
  competencia: 1,
  cambia: 'numeros',
  generar({ azar }) {
    const modo = azar()
    if (modo < 0.7) {
      const r = probar(() => {
        const x = [entero(azar, 2, 3), entero(azar, 2, 4), entero(azar, 3, 6)]
        return new Set(x).size === 3 ? x : null
      })
      if (!r) return null
      const [k, f, c] = r
      const P = k * f * c
      const enunciado = `En la panadería hay ${k} bandejas. En cada bandeja hay ${f} filas de ${c} panes.`
      if (modo < 0.35) {
        const [n1, n2] = dosNombres(azar)
        const alt = alternativas(azar, `${n1} y ${n2} obtienen ${P}.`, [`A ${n1} le sale más que a ${n2}.`, `A ${n2} le sale más que a ${n1}.`, `${n1} y ${n2} obtienen ${k + f + c}.`], 4)
        if (!alt) return null
        return {
          forma: 'opciones',
          clave: `asociativa:${k}:${f}:${c}`,
          enunciado: `${enunciado} ${n1} y ${n2} calculan cuántos panes hay.`,
          dibujo: dibujoBandejas(k, f, c, { carteles: [`${n1}: (${k} × ${f}) × ${c}`, `${n2}: ${k} × (${f} × ${c})`] }),
          pregunta: '¿Qué pasa con sus resultados?',
          nota: `(${k} × ${f}) × ${c} = ${k * f} × ${c} = ${P}; ${k} × (${f} × ${c}) = ${k} × ${f * c} = ${P}`,
          ...alt,
        }
      }
      const alt = alternativas(azar, num(f), [num(c), num(k), num(k * f)], 4)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `asociativa-falta:${k}:${f}:${c}`,
        enunciado: `${enunciado} Hay dos formas de contarlos.`,
        dibujo: dibujoBandejas(k, f, c, { fila: [`(${k} × ${f}) × ${c} = ${k} × (`, null, `× ${c})`] }),
        pregunta: '¿Qué número va en el recuadro?',
        nota: `(${k} × ${f}) × ${c} = ${k} × (${f} × ${c}) = ${P}`,
        ...alt,
      }
    }
    // Juntar primero los que dan 10 o 100.
    const [a, c] = elegir(azar, [
      [5, 2],
      [2, 5],
      [25, 4],
      [4, 25],
      [50, 2],
      [20, 5],
    ])
    const b = elegir(
      azar,
      rango(3, 9).filter((x) => x !== a && x !== c),
    )
    const P = a * b * c
    const quien = nombre(azar)
    const malas = distractores(P, [a * b + c, (a + c) * b, a + b + c, P + 10, P - 10], { min: 1 })
    const alt = alternativas(azar, num(P), malas, 4)
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `facil:${a}:${b}:${c}`,
      enunciado: `Para multiplicar más rápido, ${quien} junta primero los números que dan ${a * c}.`,
      dibujo: dibujoFactores(a, b, c),
      pregunta: `¿Cuánto es ${a} × ${b} × ${c}?`,
      nota: `(${a} × ${c}) × ${b} = ${a * c} × ${b} = ${P}`,
      ...alt,
    }
  },
}

// ---------- Doblar y dividir por 2 ----------

/** Máquinas encadenadas: cada una multiplica o divide por 2. `null` es un recuadro vacío para escribir. */
export function dibujoMaquinas(valores: (number | '?' | null)[], op: '× 2' | '÷ 2'): Dibujo {
  const BW = 84
  const BH = 50
  const G = 72
  const y = 16
  const cy = y + BH / 2
  const xs = valores.map((_, i) => 4 + i * (BW + G))
  const partes: string[] = []
  valores.forEach((v, i) => {
    partes.push(rect(xs[i], y, BW, BH, { relleno: i === 0 ? CLARO : '#ffffff', grosor: 2, redondeo: 8 }))
    if (v !== null) partes.push(texto(xs[i] + BW / 2, cy, typeof v === 'number' ? num(v) : v, { tam: v === '?' ? 26 : 22, peso: 700 }))
    if (i < valores.length - 1) {
      const mx = xs[i] + BW + G / 2
      partes.push(linea(xs[i] + BW + 3, cy, mx - 22, cy, { grosor: 2 }))
      partes.push(linea(mx + 22, cy, xs[i + 1] - 9, cy, { grosor: 2 }))
      partes.push(poligono([[xs[i + 1] - 2, cy], [xs[i + 1] - 11, cy - 6], [xs[i + 1] - 11, cy + 6]], { relleno: TINTA, grosor: 1.4 }))
      partes.push(rect(mx - 22, cy - 16, 44, 32, { relleno: '#d9d9d9', grosor: 1.8, redondeo: 6 }))
      partes.push(texto(mx, cy, op, { tam: 16, peso: 700 }))
    }
  })
  partes.push(texto(xs[0] + BW / 2, y + BH + 18, 'Entra', { tam: 13, color: GRIS }))
  partes.push(texto(xs[xs.length - 1] + BW / 2, y + BH + 18, 'Sale', { tam: 13, color: GRIS }))
  const n = valores.length - 1
  return svg(
    xs[xs.length - 1] + BW + 4,
    y + BH + 30,
    partes.join(''),
    `${n} máquinas seguidas que ${op === '× 2' ? 'multiplican por 2' : 'dividen entre 2'}; recuadros: ${valores.map((v) => (v === null ? 'vacío' : typeof v === 'number' ? num(v) : v)).join(', ')}`,
  )
}

export const doblar: TipoPregunta = {
  id: 'op-doblar',
  nombre: 'Máquinas de doblar y partir',
  queHacen: 'Doblan o parten por 2 varias veces seguidas en una cadena de máquinas, y descubren que doblar tres veces es multiplicar por 8.',
  citas: { [P4]: CITA_DOBLAR },
  area: 'matematica',
  competencia: 1,
  cambia: 'numeros',
  generar({ azar }) {
    const modo = azar()
    if (modo < 0.35) {
      const n0 = entero(azar, 12, 250)
      const fin = n0 * 8
      // Creer que tres veces ×2 es ×6, hacer una máquina de menos o de más, sumar 2 en cada máquina.
      const malas = distractores(fin, [n0 * 6, n0 * 4, n0 * 16, n0 + 6], { min: 1 })
      const alt = alternativas(azar, num(fin), malas, 4)
      if (!alt) return null
      return {
        forma: 'opciones',
        clave: `doblar:${n0}`,
        enunciado: `Cada máquina dobla el número que entra. Entra el ${num(n0)}.`,
        dibujo: dibujoMaquinas([n0, null, null, '?'], '× 2'),
        pregunta: '¿Qué número sale al final?',
        nota: `${n0} → ${n0 * 2} → ${n0 * 4} → ${fin}`,
        ...alt,
      }
    }
    if (modo < 0.65) {
      const q = entero(azar, 13, 450)
      const n0 = q * 8
      const cadena = [n0, n0 / 2, n0 / 4, q]
      return {
        forma: 'abierta',
        clave: `partir:${n0}`,
        enunciado: 'Cada máquina parte por la mitad el número que entra. Escribe en los recuadros los números que salen.',
        dibujo: dibujoMaquinas([n0, null, null, null], '÷ 2'),
        respuesta: cadena.slice(1).map(num).join(', '),
        espacio: 'dibujo',
      }
    }
    // Qué hacen las máquinas juntas: doblar 3 veces es ×8; partir 2 veces es ÷4.
    const m = azar() < 0.5 ? 2 : 3
    const dobla = azar() < 0.55
    const f = 2 ** m
    const n0 = dobla ? entero(azar, 11, 60) : entero(azar, 7, 120) * f
    const valores = rango(0, m).map((i) => (dobla ? n0 * 2 ** i : n0 / 2 ** i))
    const op = dobla ? 'Multiplicar por' : 'Dividir entre'
    const malas = [`${op} ${2 * m}`, `${op} ${f / 2}`, `${op} ${f * 2}`, dobla ? `Sumar ${2 * m}` : `Restar ${2 * m}`]
    const alt = alternativas(azar, `${op} ${f}`, malas, 4)
    if (!alt) return null
    return {
      forma: 'opciones',
      clave: `maquinas:${dobla ? 'x' : 'd'}:${m}:${n0}`,
      enunciado: `Observa: cada máquina ${dobla ? 'dobla' : 'parte por la mitad'} el número que entra.`,
      dibujo: dibujoMaquinas(valores, dobla ? '× 2' : '÷ 2'),
      pregunta: `Las ${m === 2 ? 'dos' : 'tres'} máquinas juntas hacen lo mismo que:`,
      nota: `${num(n0)} ${dobla ? '×' : '÷'} ${f} = ${num(valores[m])}`,
      ...alt,
    }
  },
}

export const GRUPO_OPERACIONES: Grupo = {
  tipos: [rectaNumerica, ordenarNumeros, redondeoRecta, estimarCompra, bodega, arreglos, conmutativa, asociativa, doblar],
  temas: {
    'Comparación y orden de números': ['op-ordenar', 'op-recta'],
    'Números de cuatro cifras': ['op-recta'],
    'Redondeo a decenas': ['op-redondeo-recta', 'op-estimar'],
    'Problemas de multiplicación y división': ['op-bodega', 'op-arreglos'],
    'Propiedades de la multiplicación': ['op-conmutativa', 'op-asociativa'],
    'Multiplicación y división': ['op-arreglos', 'op-doblar', 'op-conmutativa', 'op-bodega', 'op-asociativa'],
  },
}
