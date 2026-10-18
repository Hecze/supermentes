// Tipos de pregunta de 4.º de primaria. Competencia 3 (forma, movimiento y localización): polígonos, ángulos y rectas, cubos y prismas, perímetro, superficie, capacidad, longitud, traslación, croquis y simetría.
// Cada versión trae otra figura, otras medidas u otro croquis, siempre con un dibujo hecho para la fotocopiadora
// (trazos oscuros, rellenos claros y cada cosa con su número o su letra). Las alternativas incorrectas son los errores
// que más cometen los alumnos: contar un lado de más, sumar solo los dos lados que tienen medida, confundir paralelas
// con perpendiculares, contar los cuadros que hay entre las figuras en vez de lo que se movió, olvidar los cubitos que
// no se ven, tomar 1 m por 10 cm…
import { barajar, elegir, entero } from '../../juegos/motor/azar'
import { distractores, num } from '../../juegos/matematica/formato'
import { CLARO, GRIS, TINTA, anchoTexto, circulo, el, elipse, esc, grupo, linea, poligono, rect, ruta, svg, texto } from '../dibujos'
import type { Azar, Dibujo, Generado, Grupo, TipoPregunta } from '../tipos'
import { alternativas, nombre } from '../util'
import { hasta } from './numeros'

const P4 = 'primaria-4'
const BASE = { area: 'matematica', competencia: 3, cambia: 'numeros' } as const

/** Rellenos que se ven en una fotocopia en blanco y negro (el color solo ayuda en la pantalla). */
const PINTA = '#bdbdbd'
const SUAVE = '#e3e3e3'
const AZUL = '#dbe7f4'
const VERDE = '#e0eed6'
const ARENA = '#f3e6cc'
const ROSA = '#f4d3cf'
const LILA = '#e7dcef'

type Pt = [number, number]
type Celda = [number, number]

const LETRAS = ['A', 'B', 'C', 'D']
const rango = (n: number) => Array.from({ length: n }, (_, i) => i)
const signo = (n: number) => (n > 0 ? 1 : n < 0 ? -1 : 0)
const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1])
const mayus = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
/** Giro en q del camino p → q → s (positivo si dobla como las agujas del reloj en la pantalla). */
const vuelta = (p: Pt, q: Pt, s: Pt) => (q[0] - p[0]) * (s[1] - q[1]) - (q[1] - p[1]) * (s[0] - q[0])
/** Área con signo: en la pantalla es positiva si los vértices van como las agujas del reloj. */
const areaFirmada = (pts: Pt[]) =>
  pts.reduce((s, p, i) => {
    const q = pts[(i + 1) % pts.length]
    return s + p[0] * q[1] - q[0] * p[1]
  }, 0) / 2

/** Ángulo en q (en grados, de 0 a 180) entre q → p y q → s. */
function anguloEn(p: Pt, q: Pt, s: Pt) {
  const a = Math.atan2(p[1] - q[1], p[0] - q[0]) - Math.atan2(s[1] - q[1], s[0] - q[0])
  const d = (Math.abs(a) * 180) / Math.PI
  return d > 180 ? 360 - d : d
}

/** Lleva los puntos a la caja (x, y, w, h), con la misma escala a lo ancho y a lo alto, y centrados. */
function encajar(pts: Pt[], x: number, y: number, w: number, h: number, maxEscala = Infinity): Pt[] {
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const e = Math.min(w / (x1 - x0 || 1), h / (y1 - y0 || 1), maxEscala)
  const ox = x + (w - (x1 - x0) * e) / 2 - x0 * e
  const oy = y + (h - (y1 - y0) * e) / 2 - y0 * e
  return pts.map(([a, b]): Pt => [ox + a * e, oy + b * e])
}

const segmento = (a: Pt, b: Pt, t: Parameters<typeof linea>[4] = {}) => linea(a[0], a[1], b[0], b[1], t)
const puntos = (pts: Pt[], r = 3.8) => pts.map(([x, y]) => circulo(x, y, r, { relleno: TINTA, grosor: 1 })).join('')

/** Flechita (triángulo lleno) con la punta en `punta`, apuntando en la dirección de `desde` a `punta`. */
function puntaDeFlecha(desde: Pt, punta: Pt, largo = 13, ancho = 7) {
  const d = dist(desde, punta) || 1
  const u: Pt = [(punta[0] - desde[0]) / d, (punta[1] - desde[1]) / d]
  const b: Pt = [punta[0] - u[0] * largo, punta[1] - u[1] * largo]
  return poligono(
    [
      punta,
      [b[0] - u[1] * ancho, b[1] + u[0] * ancho],
      [b[0] + u[1] * ancho, b[1] - u[0] * ancho],
    ],
    { relleno: TINTA, grosor: 1.4 },
  )
}

/** Varias figuras en fila, cada una en su recuadro con su letra debajo (A, B, C). */
function enFila(piezas: string[], w: number, h: number, alt: string, letras = true): Dibujo {
  const SEP = 14
  const partes = piezas.map((p, i) => {
    const x = 4 + i * (w + SEP)
    return (
      rect(x, 4, w, h + (letras ? 30 : 0), { relleno: '#ffffff', trazo: GRIS, grosor: 1.4, redondeo: 10 }) +
      grupo(p, x, 4) +
      (letras ? texto(x + w / 2, 4 + h + 14, LETRAS[i], { tam: 18, peso: 700 }) : '')
    )
  })
  return svg(8 + piezas.length * (w + SEP) - SEP, h + 8 + (letras ? 30 : 0), partes.join(''), alt)
}

/** "Figura A", "Figura B"…, en el orden del dibujo: la letra de la alternativa coincide con la del dibujo. */
const cual = (cosa: string, n: number, correcta: number) => ({ alternativas: LETRAS.slice(0, n).map((l) => `${cosa} ${l}`), correcta })

/** Alternativas numéricas: la correcta y los errores típicos (si faltan, se completan con números cercanos). */
const altNum = (azar: Azar, correcta: number, errores: number[], cuantas = 4, min = 0) => alternativas(azar, num(correcta), distractores(correcta, errores, { min }), cuantas)

/** Le pone la unidad a cada alternativa numérica ("18" → "18 m"). */
const conUnidad = (alt: { alternativas: string[]; correcta: number } | null, u: string) => alt && { ...alt, alternativas: alt.alternativas.map((a) => `${a} ${u}`) }

/**
 * Una pregunta de opciones con sus pasos de resolución para la clave del docente. Los pasos se calculan con los mismos
 * datos de la pregunta (nunca con el azar, para que la misma semilla siga dando la misma pregunta) y el último dice la
 * respuesta con el mismo texto que la alternativa correcta.
 */
function opciones(clave: string, enunciado: string, dibujo: Dibujo | undefined, pregunta: string, alt: { alternativas: string[]; correcta: number } | null, pasos: string[], nota?: string): Generado | null {
  if (!alt) return null
  return { forma: 'opciones', clave, enunciado, dibujo, pregunta, ...alt, pasos, ...(nota ? { nota } : {}) }
}

/** "1 cuadro", "3 cuadros". */
const plural = (n: number, una: string, varias: string) => `${num(n)} ${n === 1 ? una : varias}`

/** "A", "A y B", "A, B y C". */
const lista = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}` : (xs[0] ?? ''))

// ---------- Cuadrículas y figuras hechas de cuadraditos ----------

const VECINOS: Celda[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]
const kc = (x: number, y: number) => `${x},${y}`
const conjunto = (cs: Celda[]) => new Set(cs.map(([x, y]) => kc(x, y)))

/** Una figura de n cuadraditos unidos por sus lados, dentro de cols × filas, sin huecos. */
function poliomino(azar: Azar, n: number, cols: number, filas: number, inicio?: Celda): Celda[] {
  return hasta(() => {
    const cs: Celda[] = [inicio ?? [entero(azar, 0, cols - 1), entero(azar, 0, filas - 1)]]
    const s = conjunto(cs)
    for (let intento = 0; cs.length < n && intento < 400; intento++) {
      const [x, y] = elegir(azar, cs)
      const [dx, dy] = elegir(azar, VECINOS)
      const c: Celda = [x + dx, y + dy]
      if (c[0] < 0 || c[1] < 0 || c[0] >= cols || c[1] >= filas || s.has(kc(...c))) continue
      cs.push(c)
      s.add(kc(...c))
    }
    return cs.length === n && !tieneHuecos(cs) ? cs : null
  })
}

function tieneHuecos(cs: Celda[]) {
  const s = conjunto(cs)
  const xs = cs.map((c) => c[0])
  const ys = cs.map((c) => c[1])
  const [x0, x1, y0, y1] = [Math.min(...xs) - 1, Math.max(...xs) + 1, Math.min(...ys) - 1, Math.max(...ys) + 1]
  const visto = new Set([kc(x0, y0)])
  const cola: Celda[] = [[x0, y0]]
  while (cola.length) {
    const [x, y] = cola.pop()!
    for (const [dx, dy] of VECINOS) {
      const [a, b] = [x + dx, y + dy]
      if (a < x0 || b < y0 || a > x1 || b > y1 || s.has(kc(a, b)) || visto.has(kc(a, b))) continue
      visto.add(kc(a, b))
      cola.push([a, b])
    }
  }
  return visto.size + cs.length < (x1 - x0 + 1) * (y1 - y0 + 1)
}

/** Lados de cuadradito en el borde de la figura: su perímetro en "lados de cuadradito". */
const perimetroCeldas = (cs: Celda[]) => {
  const s = conjunto(cs)
  return cs.reduce((t, [x, y]) => t + VECINOS.filter(([dx, dy]) => !s.has(kc(x + dx, y + dy))).length, 0)
}

const firmaCeldas = (cs: Celda[]) => {
  const mx = Math.min(...cs.map((c) => c[0]))
  const my = Math.min(...cs.map((c) => c[1]))
  return cs
    .map(([x, y]) => kc(x - mx, y - my))
    .sort()
    .join(' ')
}

/** Las líneas de una cuadrícula de cols × filas cuadraditos de `lado` px, desde (x0, y0). */
function rejilla(x0: number, y0: number, cols: number, filas: number, lado: number) {
  const partes: string[] = [rect(x0, y0, cols * lado, filas * lado, { relleno: '#ffffff', trazo: 'none' })]
  for (let i = 0; i <= cols; i++) partes.push(linea(x0 + i * lado, y0, x0 + i * lado, y0 + filas * lado, { trazo: '#8c8c8c', grosor: 1 }))
  for (let j = 0; j <= filas; j++) partes.push(linea(x0, y0 + j * lado, x0 + cols * lado, y0 + j * lado, { trazo: '#8c8c8c', grosor: 1 }))
  return partes.join('')
}

/** Cuadraditos pintados y el borde grueso de la figura. */
function pintarCeldas(cs: Celda[], x0: number, y0: number, lado: number, relleno = PINTA, grosor = 2.6) {
  const s = conjunto(cs)
  const partes = cs.map(([x, y]) => rect(x0 + x * lado, y0 + y * lado, lado, lado, { relleno, trazo: '#8c8c8c', grosor: 1 }))
  for (const [x, y] of cs) {
    const [a, b] = [x0 + x * lado, y0 + y * lado]
    if (!s.has(kc(x, y - 1))) partes.push(linea(a, b, a + lado, b, { grosor }))
    if (!s.has(kc(x, y + 1))) partes.push(linea(a, b + lado, a + lado, b + lado, { grosor }))
    if (!s.has(kc(x - 1, y))) partes.push(linea(a, b, a, b + lado, { grosor }))
    if (!s.has(kc(x + 1, y))) partes.push(linea(a + lado, b, a + lado, b + lado, { grosor }))
  }
  return partes.join('')
}

/** Puntos de una trama (para dibujar figuras con vértices en la cuadrícula). */
function trama(x0: number, y0: number, cols: number, filas: number, lado: number) {
  const partes: string[] = []
  for (let i = 0; i <= cols; i++) for (let j = 0; j <= filas; j++) partes.push(circulo(x0 + i * lado, y0 + j * lado, 1.9, { relleno: '#8c8c8c', trazo: 'none' }))
  return partes.join('')
}

// ---------- Polígonos ----------

const NOMBRE_POLIGONO: Record<number, string> = { 3: 'triángulo', 4: 'cuadrilátero', 5: 'pentágono', 6: 'hexágono', 7: 'heptágono', 8: 'octágono' }
const nombresCerca = (n: number) => [n + 1, n - 1, n + 2, n - 2].filter((m) => m >= 3 && m <= 8).map((m) => NOMBRE_POLIGONO[m])

/** Un polígono convexo de n lados (regular o no), con vértices que se ven bien: ni muy planos ni muy juntos. */
function poligonoConvexo(azar: Azar, n: number, regular: boolean): Pt[] {
  const lado = 2 * Math.sin(Math.PI / n)
  return hasta(() => {
    const giro = regular && azar() < 0.65 ? (n % 2 ? -Math.PI / 2 : Math.PI / 2 + Math.PI / n) : azar() * 2 * Math.PI
    const pts = rango(n).map((k): Pt => {
      const a = giro + (2 * Math.PI * (k + (regular ? 0 : (azar() - 0.5) * (n >= 7 ? 0.35 : 0.5)))) / n
      const r = regular ? 1 : 0.74 + azar() * 0.26
      return [r * Math.cos(a), r * Math.sin(a)]
    })
    // Que cada vértice se vea como esquina: ningún ángulo casi llano.
    const maximo = Math.max(150, 180 - 360 / n + 8)
    for (let i = 0; i < n; i++) {
      const [p, q, s] = [pts[(i + n - 1) % n], pts[i], pts[(i + 1) % n]]
      if (vuelta(p, q, s) <= 0) return null
      const ang = anguloEn(p, q, s)
      if (ang < 38 || ang > maximo) return null
      if (dist(q, s) < lado * 0.55) return null
    }
    return pts
  })
}

/** ¿Está el punto dentro del polígono convexo, a `margen` px o más de cada lado? */
function adentro(pts: Pt[], x: Pt, margen: number) {
  const s = signo(areaFirmada(pts))
  return pts.every((a, i) => {
    const b = pts[(i + 1) % pts.length]
    return (s * ((b[0] - a[0]) * (x[1] - a[1]) - (b[1] - a[1]) * (x[0] - a[0]))) / dist(a, b) >= margen
  })
}

/** Plantitas dentro de un terreno (solo adornan). */
function plantitas(pts: Pt[], azar: Azar, cuantas: number) {
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  const partes: string[] = []
  for (let i = 0; i < 80 && partes.length < cuantas; i++) {
    const p: Pt = [Math.min(...xs) + azar() * (Math.max(...xs) - Math.min(...xs)), Math.min(...ys) + azar() * (Math.max(...ys) - Math.min(...ys))]
    if (!adentro(pts, p, 26)) continue
    const [x, y] = p
    partes.push(ruta(`M${x - 7},${y - 9} Q${x - 2},${y - 3} ${x},${y + 3} Q${x + 2},${y - 3} ${x + 7},${y - 9} M${x},${y + 3} L${x},${y - 11}`, { trazo: '#5b7a4a', grosor: 1.6 }))
  }
  return partes.join('')
}

/** `cuenta`: qué se cuenta en el dibujo para saber cuántos lados tiene ("Lados de la señal"). */
type ConForma = { n: number; clave: string; enunciado: string; pregunta: string; dibujo: Dibujo; cuenta: string }

/** Cosas del entorno que tienen forma de polígono: la señal PARE, los banderines, el panal, la chacra… */
function cosaConForma(azar: Azar, quien: string): ConForma {
  const cosa = elegir(azar, ['pare', 'ceda', 'cometa', 'panal', 'casa', 'banderines', 'chacra', 'chacra'] as const)
  if (cosa === 'pare') {
    const oct = (r: number) => rango(8).map((i): Pt => [130 + r * Math.cos(Math.PI / 8 + (i * Math.PI) / 4), 96 + r * Math.sin(Math.PI / 8 + (i * Math.PI) / 4)])
    const cuerpo = rect(123, 160, 14, 84, { relleno: CLARO, grosor: 1.6 }) + poligono(oct(84), { relleno: ROSA, grosor: 2.8 }) + poligono(oct(73), { grosor: 1.4 }) + texto(130, 97, 'PARE', { tam: 38, peso: 700 })
    return { n: 8, cuenta: 'Lados de la señal', clave: 'pare', enunciado: `${quien} vio esta señal de tránsito camino al colegio.`, pregunta: '¿Qué forma tiene la señal?', dibujo: svg(260, 248, cuerpo, 'Señal de tránsito PARE sobre su poste, con 8 lados') }
  }
  if (cosa === 'ceda') {
    const tri: Pt[] = [
      [36, 16],
      [224, 16],
      [130, 178],
    ]
    const centro: Pt = [130, 70]
    const dentro = tri.map(([x, y]): Pt => [centro[0] + (x - centro[0]) * 0.7, centro[1] + (y - centro[1]) * 0.7])
    const cuerpo =
      rect(123, 150, 14, 94, { relleno: CLARO, grosor: 1.6 }) +
      poligono(tri, { relleno: ROSA, grosor: 2.8 }) +
      poligono(dentro, { relleno: '#ffffff', grosor: 1.4 }) +
      texto(130, 50, 'CEDA EL', { tam: 17, peso: 700 }) +
      texto(130, 72, 'PASO', { tam: 17, peso: 700 })
    return { n: 3, cuenta: 'Lados de la señal', clave: 'ceda', enunciado: `${quien} vio esta señal de tránsito cerca del mercado.`, pregunta: '¿Qué forma tiene la señal?', dibujo: svg(260, 248, cuerpo, 'Señal de tránsito CEDA EL PASO sobre su poste, con 3 lados') }
  }
  if (cosa === 'cometa') {
    const pts: Pt[] = [
      [130, 14],
      [200, 84],
      [130, 214],
      [60, 84],
    ]
    const cuerpo =
      ruta('M130,214 C150,232 112,240 138,254 C158,264 150,272 170,276', { trazo: GRIS, grosor: 1.6 }) +
      [
        [141, 236],
        [146, 262],
      ]
        .map(([x, y]) => elipse(x, y, 7, 3.5, { relleno: CLARO, grosor: 1.4 }))
        .join('') +
      poligono(pts, { relleno: AZUL, grosor: 2.8 }) +
      linea(130, 14, 130, 214, { trazo: GRIS, grosor: 1.4 }) +
      linea(60, 84, 200, 84, { trazo: GRIS, grosor: 1.4 })
    return { n: 4, cuenta: 'Lados de la cometa, sin contar la cola', clave: 'cometa', enunciado: `${quien} hizo una cometa para jugar en agosto.`, pregunta: 'Sin contar la cola, ¿qué forma tiene la cometa?', dibujo: svg(260, 282, cuerpo, 'Una cometa de 4 lados con su cola') }
  }
  if (cosa === 'panal') {
    const R = 30
    const hexa = (cx: number, cy: number) => rango(6).map((i): Pt => [cx + R * Math.cos((i * Math.PI) / 3), cy + R * Math.sin((i * Math.PI) / 3)])
    const centros: Pt[] = [[130, 112], ...rango(6).map((i): Pt => [130 + R * Math.sqrt(3) * Math.cos(Math.PI / 6 + (i * Math.PI) / 3), 112 + R * Math.sqrt(3) * Math.sin(Math.PI / 6 + (i * Math.PI) / 3)])]
    const cuerpo = centros.map(([x, y], i) => poligono(hexa(x, y), { relleno: i === 0 ? '#ead79f' : ARENA, grosor: i === 0 ? 3.2 : 2.2 })).join('')
    return { n: 6, cuenta: 'Lados de cada celda', clave: 'panal', enunciado: `${quien} encontró un panal de abejas en la chacra.`, pregunta: '¿Qué forma tiene cada celda del panal?', dibujo: svg(260, 224, cuerpo, 'Un panal de abejas: celdas iguales de 6 lados') }
  }
  if (cosa === 'casa') {
    const pts: Pt[] = [
      [46, 226],
      [214, 226],
      [214, 114],
      [130, 34],
      [46, 114],
    ]
    const cuerpo = poligono(pts, { relleno: ARENA, grosor: 3 }) + rect(110, 160, 40, 66, { relleno: '#ffffff', trazo: GRIS, grosor: 1.4 }) + circulo(142, 195, 2.6, { relleno: GRIS, trazo: 'none' })
    return { n: 5, cuenta: 'Lados del borde grueso', clave: 'casa', enunciado: `Observa el frente de la casa de ${quien}. Su borde tiene una línea gruesa.`, pregunta: '¿Qué polígono forma ese borde?', dibujo: svg(260, 236, cuerpo, 'El frente de una casa con techo de dos aguas, con un borde de 5 lados') }
  }
  if (cosa === 'banderines') {
    const tintes = [AZUL, ROSA, VERDE, ARENA, LILA]
    const cuerpo =
      linea(8, 24, 312, 24, { grosor: 2 }) +
      rango(5)
        .map((i) => {
          const x = 18 + i * 60
          return poligono(
            [
              [x, 24],
              [x + 48, 24],
              [x + 24, 98],
            ],
            { relleno: tintes[i], grosor: 2.4 },
          )
        })
        .join('')
    return { n: 3, cuenta: 'Lados de cada banderín', clave: 'banderines', enunciado: `Para la fiesta patronal, ${quien} ayudó a colgar estos banderines.`, pregunta: '¿Qué forma tiene cada banderín?', dibujo: svg(320, 110, cuerpo, 'Una fila de 5 banderines iguales de 3 lados') }
  }
  const n = entero(azar, 5, 7)
  const pts = encajar(poligonoConvexo(azar, n, false), 24, 20, 252, 196)
  // Un poste del cerco en cada esquina.
  const cuerpo = poligono(pts, { relleno: VERDE, grosor: 3 }) + plantitas(pts, azar, 6) + pts.map(([x, y]) => rect(x - 4.5, y - 4.5, 9, 9, { relleno: '#8a6b45', grosor: 1.4 })).join('')
  return {
    n,
    cuenta: 'Lados del terreno, de poste a poste',
    clave: `chacra${n}`,
    enunciado: `Este es el terreno de la chacra de ${quien}, visto desde arriba. En cada esquina hay un poste del cerco.`,
    pregunta: '¿Qué polígono forma el borde del terreno?',
    dibujo: svg(300, 236, cuerpo, `Un terreno de ${n} lados con plantas`),
  }
}

/** Una figura que no es polígono: con un lado curvo, o abierta. */
function noPoligono(azar: Azar, w: number, h: number): { cuerpo: string; tipo: 'curva' | 'abierta' } {
  const curva = azar() < 0.5
  // Abierta, con 4 o 5 lados (con menos parece un ángulo).
  const n = curva ? entero(azar, 3, 5) : entero(azar, 4, 5)
  const pts = encajar(poligonoConvexo(azar, n, azar() < 0.4), 0, 0, 1, 1)
  if (curva) {
    const [a, b] = [pts[n - 1], pts[0]]
    const m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    const c: Pt = [0.5, 0.5]
    const fuera: Pt = [m[0] + (m[0] - c[0]) * 1.4, m[1] + (m[1] - c[1]) * 1.4]
    const q = encajar([...pts, fuera], 18, 16, w - 36, h - 32)
    const d = `M${q[0][0]},${q[0][1]} ${q
      .slice(1, n)
      .map(([x, y]) => `L${x},${y}`)
      .join(' ')} Q${q[n][0]},${q[n][1]} ${q[0][0]},${q[0][1]} Z`
    return { cuerpo: ruta(d, { relleno: SUAVE, grosor: 2.8 }), tipo: 'curva' }
  }
  const q = encajar(pts, 18, 16, w - 36, h - 32)
  const d = `M${q[0][0]},${q[0][1]} ${q
    .slice(1)
    .map(([x, y]) => `L${x},${y}`)
    .join(' ')}`
  return { cuerpo: ruta(d, { grosor: 2.8 }) + puntos([q[0], q[n - 1]], 3.2), tipo: 'abierta' }
}

export const nombrePoligono: TipoPregunta = {
  id: 'fo-nombre-poligono',
  nombre: '¿Qué polígono es?',
  queHacen: 'Reconocen polígonos en objetos del entorno (señales, banderines, terrenos) y los nombran según su número de lados.',
  citas: { [P4]: 'los asocia y representa con formas bidimensionales (polígonos) y sus elementos' },
  ...BASE,
  generar({ azar }) {
    const modo = azar()
    if (modo < 0.55) {
      const c = cosaConForma(azar, nombre(azar))
      return opciones(`nombre:${c.clave}`, c.enunciado, c.dibujo, c.pregunta, alternativas(azar, NOMBRE_POLIGONO[c.n], nombresCerca(c.n), 4), [`${c.cuenta}: ${num(c.n)}`, `Un polígono de ${num(c.n)} lados se llama ${NOMBRE_POLIGONO[c.n]}`])
    }
    if (modo < 0.75) {
      const n = entero(azar, 3, 8)
      const regular = azar() < 0.4
      const pts = encajar(poligonoConvexo(azar, n, regular), 30, 20, 220, 180)
      const dibujo = svg(280, 220, poligono(pts, { relleno: SUAVE, grosor: 2.8 }) + puntos(pts), `Un polígono de ${n} lados con sus vértices marcados`)
      return opciones(`nombre:dibujo:${n}:${regular}`, 'Observa el polígono.', dibujo, '¿Cómo se llama?', alternativas(azar, NOMBRE_POLIGONO[n], nombresCerca(n), 4), [
        `Lados del polígono, de vértice a vértice: ${num(n)}`,
        `Un polígono de ${num(n)} lados se llama ${NOMBRE_POLIGONO[n]}`,
      ])
    }
    // ¿Cuál es (o no es) un polígono? Uno tiene un lado curvo o está abierto.
    const W = 170
    const H = 140
    const no = azar() < 0.5
    const figura = () => {
      const pts = encajar(poligonoConvexo(azar, entero(azar, 3, 6), azar() < 0.4), 18, 16, W - 36, H - 32)
      return poligono(pts, { relleno: SUAVE, grosor: 2.8 })
    }
    const malas = no ? [noPoligono(azar, W, H)] : [noPoligono(azar, W, H), noPoligono(azar, W, H)]
    if (!no && malas[0].tipo === malas[1].tipo) malas[1] = hasta(() => {
      const m = noPoligono(azar, W, H)
      return m.tipo !== malas[0].tipo ? m : null
    })
    const piezas = no ? [figura(), figura(), malas[0].cuerpo] : [figura(), malas[0].cuerpo, malas[1].cuerpo]
    // La que se busca va primero en `piezas`: el polígono, o la figura que no lo es.
    const buscada = no ? 2 : 0
    const orden = barajar(azar, [0, 1, 2])
    const dibujo = enFila(
      orden.map((i) => piezas[i]),
      W,
      H,
      no ? 'Tres figuras: dos polígonos y una con un lado curvo o abierta' : 'Tres figuras: un polígono, una con un lado curvo y una abierta',
    )
    // La letra de cada pieza en el dibujo y por qué una figura no es polígono.
    const letraDe = (i: number) => `Figura ${LETRAS[orden.indexOf(i)]}`
    const porQue = (m: (typeof malas)[number]) => (m.tipo === 'curva' ? 'tiene un lado curvo' : 'está abierta, no se cierra')
    const pasos = no
      ? [`${letraDe(2)}: ${porQue(malas[0])}`, `${lista([letraDe(0), letraDe(1)].sort())}: cerradas y con solo lados rectos`, `No es un polígono: ${letraDe(2)}`]
      : [
          ...[1, 2].sort((p, q) => orden.indexOf(p) - orden.indexOf(q)).map((i) => `${letraDe(i)}: ${porQue(malas[i - 1])}`),
          `Cerrada y con solo lados rectos: ${letraDe(0)}`,
        ]
    return opciones(
      `es-poligono:${no}:${orden.join('')}:${malas.map((m) => m.tipo).join('')}`,
      'Un polígono es una figura cerrada formada solo por lados rectos. Observa las figuras.',
      dibujo,
      no ? '¿Cuál NO es un polígono?' : '¿Cuál es un polígono?',
      cual('Figura', 3, orden.indexOf(buscada)),
      pasos,
    )
  },
}

/** Figuras con entrantes, dibujadas en la trama (para contar lados y vértices). */
const CONCAVAS: Pt[][] = [
  [
    [0, 0],
    [1, 0],
    [1, 2],
    [3, 2],
    [3, 3],
    [0, 3],
  ],
  [
    [0, 0],
    [3, 0],
    [3, 1],
    [2, 1],
    [2, 3],
    [1, 3],
    [1, 1],
    [0, 1],
  ],
  [
    [0, 1],
    [2, 1],
    [2, 0],
    [4, 2],
    [2, 4],
    [2, 3],
    [0, 3],
  ],
  [
    [0, 0],
    [1, 0],
    [1, 2],
    [2, 2],
    [2, 0],
    [3, 0],
    [3, 3],
    [0, 3],
  ],
  [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
    [2, 2],
    [3, 2],
    [3, 3],
    [0, 3],
  ],
]

/** Gira (de a 90°) o voltea una figura de la trama y la deja tocando los bordes de arriba y de la izquierda. */
function transformar(azar: Azar, pts: Pt[]): Pt[] {
  let q = azar() < 0.5 ? pts.map(([x, y]): Pt => [-x, y]) : pts
  for (let i = entero(azar, 0, 3); i > 0; i--) q = q.map(([x, y]): Pt => [-y, x])
  const mx = Math.min(...q.map((p) => p[0]))
  const my = Math.min(...q.map((p) => p[1]))
  return q.map(([x, y]): Pt => [x - mx + 0, y - my + 0])
}

export const ladosVertices: TipoPregunta = {
  id: 'fo-lados-vertices',
  nombre: 'Lados y vértices',
  queHacen: 'Cuentan los lados y los vértices de polígonos (también con entrantes) y dibujan un polígono con el número de lados pedido.',
  citas: { [P4]: 'su comprensión sobre los elementos de los polígonos: ángulos rectos, número de lados y vértices' },
  ...BASE,
  generar({ azar }) {
    const modo = azar()
    if (modo < 0.5) {
      const concava = azar() < 0.45
      const pts = concava ? transformar(azar, elegir(azar, CONCAVAS)).map(([x, y]): Pt => [x * 44, y * 44]) : poligonoConvexo(azar, entero(azar, 5, 8), azar() < 0.3)
      const n = pts.length
      const q = encajar(pts, 30, 22, 220, 176)
      const que = azar() < 0.5 ? 'lados' : 'vértices'
      const dibujo = svg(280, 220, poligono(q, { relleno: SUAVE, grosor: 2.8 }) + puntos(q), `Un polígono de ${n} lados con sus vértices marcados`)
      return opciones(`lados:${que}:${q.map((p) => p.map(Math.round).join(',')).join(' ')}`, 'Observa el polígono.', dibujo, `¿Cuántos ${que} tiene?`, altNum(azar, n, [n + 1, n - 1, n + 2, n - 2], 4, 3), [
        `Se cuentan los ${que} uno por uno, marcando cada ${que === 'lados' ? 'lado' : 'vértice'} para no repetir`,
        ...(concava ? [que === 'lados' ? 'También cuentan los lados de la parte que entra' : 'Las esquinas que entran también son vértices'] : []),
        `Tiene ${num(n)} ${que}`,
      ])
    }
    if (modo < 0.75) {
      const [n1, n2] = hasta(() => {
        const a = entero(azar, 3, 8)
        const b = entero(azar, 3, 8)
        return a !== b ? [a, b] : null
      })
      const q1 = encajar(poligonoConvexo(azar, n1, azar() < 0.5), 22, 18, 150, 150)
      const q2 = encajar(poligonoConvexo(azar, n2, azar() < 0.5), 216, 18, 150, 150)
      const quien = nombre(azar)
      const que = azar() < 0.5 ? 'lados' : 'vértices'
      const dibujo = svg(390, 186, poligono(q1, { relleno: AZUL, grosor: 2.8 }) + puntos(q1) + poligono(q2, { relleno: ARENA, grosor: 2.8 }) + puntos(q2), `Dos polígonos: uno de ${n1} lados y otro de ${n2} lados`)
      const t = n1 + n2
      return opciones(`lados-dos:${que}:${n1}-${n2}`, `${quien} recortó estas dos figuras de cartulina.`, dibujo, `¿Cuántos ${que} tienen entre las dos?`, altNum(azar, t, [t - 1, t + 1, Math.max(n1, n2), t + 2, t - 2], 4, 3), [
        `Figura de la izquierda: ${num(n1)} ${que}; de la derecha: ${num(n2)} ${que}`,
        `Entre las dos: ${num(n1)} + ${num(n2)} = ${num(t)}`,
      ])
    }
    // Dibuja un polígono uniendo puntos de la trama.
    const n = entero(azar, 3, 6)
    const cuerpo = rect(4, 4, 8 * 36 + 32, 5 * 36 + 32, { relleno: '#ffffff', trazo: GRIS, grosor: 1.4, redondeo: 8 }) + trama(20, 20, 8, 5, 36)
    return {
      forma: 'abierta',
      clave: `dibuja-poligono:${n}`,
      enunciado: `Une puntos con líneas rectas y dibuja un ${NOMBRE_POLIGONO[n]}.`,
      dibujo: svg(8 * 36 + 40, 5 * 36 + 40, cuerpo, 'Una trama de puntos vacía'),
      pregunta: 'Luego, marca cada uno de sus vértices con un punto grueso.',
      respuesta: `Una figura cerrada de ${n} lados rectos y ${n} vértices (puede tener cualquier forma).`,
      espacio: 'dibujo',
      pasos: [
        `Se eligen ${num(n)} puntos de la trama: serán los vértices`,
        'Se unen con líneas rectas, de punto en punto, hasta cerrar la figura',
        `Queda un ${NOMBRE_POLIGONO[n]}: ${num(n)} lados y ${num(n)} vértices`,
      ],
    }
  },
}

// ---------- Ángulos ----------

/** Un ángulo de `grados` cuyo primer lado apunta a `dir` (grados), centrado en un recuadro de w × h. */
function dibujoAngulo(grados: number, dir: number, w: number, h: number) {
  const L = 84
  const a0 = (dir * Math.PI) / 180
  const a1 = ((dir + grados) * Math.PI) / 180
  const crudo: Pt[] = [
    [0, 0],
    [L * Math.cos(a0), -L * Math.sin(a0)],
    [L * Math.cos(a1), -L * Math.sin(a1)],
  ]
  const [v, a, b] = encajar(crudo, 16, 14, w - 32, h - 28, 1)
  const r = 20
  const p0: Pt = [v[0] + r * Math.cos(a0), v[1] - r * Math.sin(a0)]
  const p1: Pt = [v[0] + r * Math.cos(a1), v[1] - r * Math.sin(a1)]
  return ruta(`M${p0[0]},${p0[1]} A${r},${r} 0 0 0 ${p1[0]},${p1[1]}`, { trazo: GRIS, grosor: 1.6 }) + segmento(v, a, { grosor: 3.2 }) + segmento(v, b, { grosor: 3.2 }) + circulo(v[0], v[1], 4, { relleno: TINTA, trazo: 'none' })
}

/** Un reloj con la aguja larga en el 12 y la corta en `hora`. */
function reloj(hora: number, cx: number, cy: number, R = 62) {
  const partes = [circulo(cx, cy, R, { relleno: '#ffffff', grosor: 2.6 })]
  for (let i = 1; i <= 12; i++) {
    const a = ((i * 30 - 90) * Math.PI) / 180
    partes.push(texto(cx + (R - 15) * Math.cos(a), cy + (R - 15) * Math.sin(a), String(i), { tam: 13, peso: 700 }))
  }
  const ah = ((hora * 30 - 90) * Math.PI) / 180
  partes.push(linea(cx, cy, cx, cy - (R - 20), { grosor: 3 }))
  partes.push(linea(cx, cy, cx + (R - 32) * Math.cos(ah), cy + (R - 32) * Math.sin(ah), { grosor: 5 }))
  partes.push(circulo(cx, cy, 4, { relleno: TINTA, trazo: 'none' }))
  return partes.join('')
}

const QUE_ANGULO = {
  recto: { pregunta: '¿Cuál es un ángulo recto?', relojes: 'forman un ángulo recto', es: 'Es un ángulo recto', frente: 'igual a la esquina', agujas: 'ángulo recto' },
  menor: { pregunta: '¿Cuál es menor que un ángulo recto?', relojes: 'forman un ángulo menor que el recto', es: 'Es menor que el recto', frente: 'más cerrado', agujas: 'menor que el recto' },
  mayor: { pregunta: '¿Cuál es mayor que un ángulo recto?', relojes: 'forman un ángulo mayor que el recto', es: 'Es mayor que el recto', frente: 'más abierto', agujas: 'mayor que el recto' },
}
/** "las 3", "la 1". */
const laHora = (h: number) => (h === 1 ? 'la 1' : `las ${num(h)}`)

export const anguloRecto: TipoPregunta = {
  id: 'fo-angulo-recto',
  nombre: '¿Cuál es el ángulo recto?',
  queHacen: 'Comparan ángulos con el ángulo recto (con la esquina de una hoja) y eligen el recto, el menor o el mayor; también en las agujas del reloj.',
  citas: { [P4]: 'la medida de los ángulos respecto al ángulo recto' },
  ...BASE,
  generar({ azar }) {
    const que = elegir(azar, ['recto', 'recto', 'menor', 'mayor'] as const)
    const quien = nombre(azar)
    if (azar() < 0.62) {
      // Tres ángulos: uno recto, uno agudo y uno obtuso, girados de distintas formas.
      const medidas = { recto: 90, menor: entero(azar, 7, 12) * 5, mayor: entero(azar, 24, 30) * 5 }
      const orden = barajar(azar, ['recto', 'menor', 'mayor'] as const)
      const dirs = orden.map(() => entero(azar, 0, 23) * 15)
      const W = 176
      const H = 150
      const dibujo = enFila(
        orden.map((t, i) => dibujoAngulo(medidas[t], dirs[i], W, H)),
        W,
        H,
        `Tres ángulos: ${orden.map((t, i) => `${LETRAS[i]} mide ${medidas[t]}°`).join(', ')}`,
      )
      return opciones(`angulo:${que}:${orden.join('')}:${dirs.join('-')}:${medidas.menor}:${medidas.mayor}`, `${quien} compara estos ángulos con la esquina de una hoja de papel.`, dibujo, QUE_ANGULO[que].pregunta, cual('Ángulo', 3, orden.indexOf(que)), [
        'Se pone la esquina de la hoja en el vértice de cada ángulo',
        orden.map((t, i) => `${LETRAS[i]}: ${QUE_ANGULO[t].frente}`).join('; '),
        `${QUE_ANGULO[que].es}: Ángulo ${LETRAS[orden.indexOf(que)]}`,
      ])
    }
    // Relojes: las agujas a las 3 o a las 9 forman un ángulo recto.
    const horas = { recto: elegir(azar, [3, 9]), menor: elegir(azar, [1, 2, 10, 11]), mayor: elegir(azar, [4, 5, 7, 8]) }
    const orden = barajar(azar, ['recto', 'menor', 'mayor'] as const)
    const W = 160
    const H = 146
    const dibujo = enFila(
      orden.map((t) => reloj(horas[t], W / 2, H / 2 + 2)),
      W,
      H,
      `Tres relojes: ${orden.map((t, i) => `${LETRAS[i]} marca ${laHora(horas[t])}`).join(', ')}`,
    )
    return opciones(`relojes:${que}:${orden.map((t) => horas[t]).join('-')}`, 'Observa las agujas de estos relojes.', dibujo, `¿En cuál reloj las agujas ${QUE_ANGULO[que].relojes}?`, cual('Reloj', 3, orden.indexOf(que)), [
      lista(orden.map((t, i) => `${LETRAS[i]} marca ${laHora(horas[t])}`)),
      'A las 3 y a las 9, las agujas forman un ángulo recto, como la esquina de una hoja',
      orden.map((t, i) => `${LETRAS[i]}: ${QUE_ANGULO[t].agujas}`).join('; '),
      `${mayus(QUE_ANGULO[que].relojes)}: Reloj ${LETRAS[orden.indexOf(que)]}`,
    ])
  },
}

/** Figuras con vértices en la trama (coordenadas enteras), para ángulos rectos y lados paralelos. */
const FORMAS_TRAMA: Record<string, (azar: Azar) => Pt[]> = {
  rectangulo: (az) => {
    const w = entero(az, 3, 6)
    const h = hasta(() => {
      const x = entero(az, 2, 4)
      return x !== w ? x : null
    })
    return [
      [0, 0],
      [w, 0],
      [w, h],
      [0, h],
    ]
  },
  cuadrado: (az) => {
    const s = entero(az, 2, 4)
    return [
      [0, 0],
      [s, 0],
      [s, s],
      [0, s],
    ]
  },
  trapecioRectangulo: (az) => {
    const a = entero(az, 4, 6)
    const b = entero(az, 2, a - 1)
    const h = entero(az, 2, 4)
    return [
      [0, 0],
      [b, 0],
      [a, h],
      [0, h],
    ]
  },
  trianguloRectangulo: (az) => {
    const a = entero(az, 3, 6)
    const h = entero(az, 2, 4)
    return [
      [0, 0],
      [a, h],
      [0, h],
    ]
  },
  triangulo: (az) => {
    const a = entero(az, 4, 6)
    const h = entero(az, 2, 4)
    const c = entero(az, 1, a - 1)
    return [
      [c, 0],
      [a, h],
      [0, h],
    ]
  },
  romboide: (az) => {
    const a = entero(az, 3, 5)
    const s = entero(az, 1, 2)
    const h = entero(az, 2, 3)
    return [
      [s, 0],
      [a + s, 0],
      [a, h],
      [0, h],
    ]
  },
  trapecioIsosceles: (az) => {
    const s = entero(az, 1, 2)
    const b = entero(az, 1, 3)
    const h = entero(az, 2, 3)
    return [
      [s, 0],
      [s + b, 0],
      [2 * s + b, h],
      [0, h],
    ]
  },
  casita: (az) => {
    const m = entero(az, 1, 2)
    const r = entero(az, 1, 2)
    const h = entero(az, 2, 3)
    return [
      [0, r],
      [m, 0],
      [2 * m, r],
      [2 * m, r + h],
      [0, r + h],
    ]
  },
  hexagono: (az) => {
    const b = entero(az, 1, 3)
    const h = entero(az, 1, 2)
    return [
      [h, 0],
      [h + b, 0],
      [2 * h + b, h],
      [h + b, 2 * h],
      [h, 2 * h],
      [0, h],
    ]
  },
  ele: (az) => {
    const a = entero(az, 3, 5)
    const h = entero(az, 3, 4)
    const c = entero(az, 1, a - 2)
    const b = entero(az, 1, h - 2)
    return [
      [0, 0],
      [c, 0],
      [c, h - b],
      [a, h - b],
      [a, h],
      [0, h],
    ]
  },
  te: (az) => {
    const brazo = entero(az, 1, 2)
    const ancho = entero(az, 1, 2)
    const alto = entero(az, 2, 3)
    const w = 2 * brazo + ancho
    return [
      [0, 0],
      [w, 0],
      [w, 1],
      [brazo + ancho, 1],
      [brazo + ancho, 1 + alto],
      [brazo, 1 + alto],
      [brazo, 1],
      [0, 1],
    ]
  },
}

/** Vértices en el orden de las agujas del reloj, empezando por el de más arriba a la izquierda (así se ponen las letras). */
function ordenar(pts: Pt[]): Pt[] {
  const q = areaFirmada(pts) < 0 ? [...pts].reverse() : [...pts]
  let i0 = 0
  q.forEach((p, i) => {
    if (p[1] < q[i0][1] || (p[1] === q[i0][1] && p[0] < q[i0][0])) i0 = i
  })
  return [...q.slice(i0), ...q.slice(0, i0)]
}

/** Cuántos ángulos interiores son rectos (las esquinas hacia adentro de una figura con entrantes no cuentan). */
function angulosRectos(pts: Pt[]) {
  const s = signo(areaFirmada(pts))
  return pts.filter((q, i) => {
    const p = pts[(i + pts.length - 1) % pts.length]
    const r = pts[(i + 1) % pts.length]
    const convexo = signo(vuelta(p, q, r)) === s
    return convexo && Math.abs((p[0] - q[0]) * (r[0] - q[0]) + (p[1] - q[1]) * (r[1] - q[1])) < 1e-9
  }).length
}

const tieneEntrantes = (pts: Pt[]) => {
  const s = signo(areaFirmada(pts))
  return pts.some((q, i) => signo(vuelta(pts[(i + pts.length - 1) % pts.length], q, pts[(i + 1) % pts.length])) !== s)
}

/** Una figura de la trama ya girada, del tipo pedido. */
const deLaTrama = (azar: Azar, tipo: string) => ordenar(transformar(azar, FORMAS_TRAMA[tipo](azar)))

/** La figura sobre su trama de puntos, centrada en w × h (con `lado` px por cuadro, o menos si no entra). */
function figuraEnTrama(pts: Pt[], w: number, h: number, lado: number, relleno = SUAVE, margen = 18) {
  const cols = Math.max(...pts.map((p) => p[0]))
  const filas = Math.max(...pts.map((p) => p[1]))
  const l = Math.min(lado, (w - 2 * margen) / (cols + 1), (h - 2 * margen) / (filas + 1))
  const x0 = (w - cols * l) / 2
  const y0 = (h - filas * l) / 2
  const q = pts.map(([x, y]): Pt => [x0 + x * l, y0 + y * l])
  const tc = Math.floor(x0 / l)
  const tf = Math.floor(y0 / l)
  return { cuerpo: trama(x0 - tc * l, y0 - tf * l, cols + 2 * tc, filas + 2 * tf, l) + poligono(q, { relleno, grosor: 2.8 }), q, l }
}

export const angulosRectosFigura: TipoPregunta = {
  id: 'fo-angulos-rectos-figura',
  nombre: 'Ángulos rectos de la figura',
  queHacen: 'Cuentan cuántos ángulos rectos tiene un polígono dibujado en la trama, comprobándolo con la esquina de una hoja.',
  citas: { [P4]: 'su comprensión sobre los elementos de los polígonos: ángulos rectos, número de lados y vértices' },
  ...BASE,
  generar({ azar }) {
    if (azar() < 0.6) {
      const tipo = elegir(azar, ['rectangulo', 'cuadrado', 'trapecioRectangulo', 'trapecioRectangulo', 'trianguloRectangulo', 'triangulo', 'romboide', 'casita', 'ele', 'ele', 'te'])
      const pts = deLaTrama(azar, tipo)
      const k = angulosRectos(pts)
      const n = pts.length
      const { cuerpo } = figuraEnTrama(pts, 300, 250, 40)
      const dibujo = svg(300, 250, cuerpo, `Un polígono de ${n} lados dibujado en una trama de puntos`)
      const nota = tieneEntrantes(pts) ? 'Las esquinas que entran en la figura no son ángulos rectos: miden más que un ángulo recto.' : undefined
      const pasos = [
        `Se pone la esquina de una hoja en cada uno de sus ${num(n)} vértices`,
        ...(nota ? ['Las esquinas que entran no cuentan: miden más que un ángulo recto'] : []),
        k === 0 ? 'Ninguna esquina coincide con la de la hoja: 0' : `Coinciden con la esquina de la hoja: ${plural(k, 'ángulo recto', 'ángulos rectos')}`,
      ]
      return opciones(`rectos:${tipo}:${pts.map((p) => p.join(',')).join(' ')}`, 'Observa la figura. Puedes comprobar con la esquina de una hoja.', dibujo, '¿Cuántos ángulos rectos tiene?', altNum(azar, k, [n, k + 1, k - 1, 4, k + 2]), pasos, nota)
    }
    // Tres figuras: ¿cuál tiene más ángulos rectos? o ¿cuál tiene exactamente k?
    const figuras = hasta(() => {
      const tipos = barajar(azar, ['rectangulo', 'cuadrado', 'trapecioRectangulo', 'trianguloRectangulo', 'triangulo', 'romboide', 'casita', 'trapecioIsosceles']).slice(0, 3)
      // Más anchas que altas y de 5 × 4 cuadros como mucho, para que se vean grandes en su recuadro.
      const fs = tipos.map((t) => {
        const f = deLaTrama(azar, t)
        return Math.max(...f.map((p) => p[1])) > Math.max(...f.map((p) => p[0])) ? ordenar(f.map(([x, y]): Pt => [y, x])) : f
      })
      if (fs.some((f) => Math.max(...f.map((p) => p[0])) > 5 || Math.max(...f.map((p) => p[1])) > 4)) return null
      const ks = fs.map(angulosRectos)
      return new Set(ks).size === 3 ? { fs, ks } : null
    })
    const W = 176
    const H = 150
    const dibujo = enFila(
      figuras.fs.map((f) => figuraEnTrama(f, W, H, 30).cuerpo),
      W,
      H,
      `Tres polígonos en la trama: ${figuras.fs.map((f, i) => `${LETRAS[i]} de ${f.length} lados`).join(', ')}`,
    )
    const conteo = ['Se pone la esquina de una hoja en cada vértice de las tres figuras', `Ángulos rectos: ${lista(figuras.ks.map((k, i) => `${LETRAS[i]} tiene ${num(k)}`))}`]
    if (azar() < 0.5) {
      const max = Math.max(...figuras.ks)
      return opciones(`rectos-tres:mas:${figuras.fs.map((f) => f.map((p) => p.join(',')).join(' ')).join('|')}`, 'Observa las figuras. Puedes comprobar con la esquina de una hoja.', dibujo, '¿Cuál tiene más ángulos rectos?', cual('Figura', 3, figuras.ks.indexOf(max)), [
        ...conteo,
        `Tiene más ángulos rectos (${num(max)}): Figura ${LETRAS[figuras.ks.indexOf(max)]}`,
      ])
    }
    const i = entero(azar, 0, 2)
    const k = figuras.ks[i]
    return opciones(
      `rectos-tres:${k}:${figuras.fs.map((f) => f.map((p) => p.join(',')).join(' ')).join('|')}`,
      'Observa las figuras. Puedes comprobar con la esquina de una hoja.',
      dibujo,
      k === 0 ? '¿Cuál no tiene ningún ángulo recto?' : `¿Cuál tiene exactamente ${plural(k, 'ángulo recto', 'ángulos rectos')}?`,
      cual('Figura', 3, i),
      [...conteo, `${k === 0 ? 'No tiene ninguno' : `Tiene ${plural(k, 'ángulo recto', 'ángulos rectos')}`}: Figura ${LETRAS[i]}`],
    )
  },
}

// ---------- Rectas paralelas y perpendiculares ----------

type ParTipo = 'paralelas' | 'perpendiculares' | 'secantes' | 'casi'

/** Cómo se ve cada par de rectas, para los pasos de la clave. */
const COMO_RECTAS: Record<ParTipo, string> = {
  paralelas: 'van a la misma distancia y nunca se juntan',
  casi: 'se van acercando: si se alargan, se juntan',
  perpendiculares: 'se juntan formando un ángulo recto',
  secantes: 'se cruzan, pero sin formar un ángulo recto',
}

/** Dos rectas de la clase pedida, giradas al azar y centradas en w × h. */
function parDeRectas(azar: Azar, tipo: ParTipo, w: number, h: number) {
  const g = (entero(azar, 0, 11) * 15 * Math.PI) / 180
  const u: Pt = [Math.cos(g), Math.sin(g)]
  const nn: Pt = [-u[1], u[0]]
  const giro = (d: Pt, grados: number): Pt => {
    const t = (grados * Math.PI) / 180
    return [d[0] * Math.cos(t) - d[1] * Math.sin(t), d[0] * Math.sin(t) + d[1] * Math.cos(t)]
  }
  const seg = (c: Pt, d: Pt, a: number, b: number): Pt[] => [
    [c[0] + d[0] * a, c[1] + d[1] * a],
    [c[0] + d[0] * b, c[1] + d[1] * b],
  ]
  const mas = (k: number, d: Pt): Pt => [d[0] * k, d[1] * k]
  let pts: Pt[]
  if (tipo === 'paralelas') {
    const sep = entero(azar, 34, 50)
    const corre = entero(azar, -20, 20)
    pts = [...seg(mas(-sep / 2, nn), u, -66, 66), ...seg(mas(sep / 2, nn), u, -66 + corre, 66 + corre)]
  } else if (tipo === 'casi') {
    const sep = 50
    const t = elegir(azar, [8, 10, -8, -10])
    pts = [...seg(mas(-sep / 2, nn), giro(u, t), -66, 66), ...seg(mas(sep / 2, nn), giro(u, -t), -66, 66)]
  } else if (tipo === 'perpendiculares') {
    const forma = elegir(azar, ['cruz', 'te', 'ele'] as const)
    const t0 = forma === 'ele' ? -66 : forma === 'te' ? entero(azar, -30, 30) : entero(azar, -25, 25)
    pts = [...seg([0, 0], u, -66, 66), ...seg(mas(t0, u), nn, forma === 'cruz' ? -55 : 0, forma === 'cruz' ? 55 : elegir(azar, [100, -100]))]
  } else {
    const a = elegir(azar, [entero(azar, 35, 58), entero(azar, 122, 145)])
    pts = [...seg([0, 0], u, -66, 66), ...seg(mas(entero(azar, -25, 25), u), giro(u, a), -60, 60)]
  }
  const q = encajar(pts, 16, 16, w - 32, h - 32, 1)
  return segmento(q[0], q[1], { grosor: 3.4 }) + segmento(q[2], q[3], { grosor: 3.4 })
}

const CALLES = ['Av. Grau', 'Jr. Lima', 'Jr. Junín', 'Jr. Tacna', 'Calle Cusco', 'Jr. Puno', 'Av. Arequipa', 'Jr. Ica', 'Calle Tumbes']
/** "al Jr. Lima", "a la Av. Grau", "a la calle Cusco". */
const aLaCalle = (c: string) => (c.startsWith('Jr.') ? `al ${c}` : c.startsWith('Calle') ? `a la calle ${c.slice(6)}` : `a la ${c}`)

/** Dónde corta el segmento a-b a la recta c-d (parámetro de 0 a 1 sobre a-b), o null. */
function corte(a: Pt, b: Pt, c: Pt, d: Pt): number | null {
  const den = (b[0] - a[0]) * (d[1] - c[1]) - (b[1] - a[1]) * (d[0] - c[0])
  if (Math.abs(den) < 1e-9) return null
  const t = ((c[0] - a[0]) * (d[1] - c[1]) - (c[1] - a[1]) * (d[0] - c[0])) / den
  return t > 0 && t < 1 ? t : null
}

/** Un croquis de calles: dos paralelas, una perpendicular a ellas y una diagonal. */
function croquisCalles(azar: Azar) {
  const W = 480
  const H = 280
  const nombres = barajar(azar, CALLES).slice(0, 4)
  const dosHorizontales = azar() < 0.5
  const calles: { a: Pt; b: Pt; nombre: string; rol: 'par' | 'sola' | 'diagonal' }[] = []
  if (dosHorizontales) {
    const y1 = entero(azar, 50, 80)
    const y2 = entero(azar, 190, 230)
    const x = entero(azar, 150, 330)
    calles.push({ a: [0, y1], b: [W, y1], nombre: nombres[0], rol: 'par' }, { a: [0, y2], b: [W, y2], nombre: nombres[1], rol: 'par' }, { a: [x, 0], b: [x, H], nombre: nombres[2], rol: 'sola' })
  } else {
    const x1 = entero(azar, 70, 130)
    const x2 = entero(azar, 330, 410)
    const y = entero(azar, 110, 170)
    calles.push({ a: [x1, 0], b: [x1, H], nombre: nombres[0], rol: 'par' }, { a: [x2, 0], b: [x2, H], nombre: nombres[1], rol: 'par' }, { a: [0, y], b: [W, y], nombre: nombres[2], rol: 'sola' })
  }
  const xa = entero(azar, 60, 300)
  const dx = elegir(azar, [1, -1]) * entero(azar, 130, 190)
  const xb = Math.min(W - 30, Math.max(30, xa + dx))
  calles.push({ a: [xa, H], b: [xb, 0], nombre: nombres[3], rol: 'diagonal' })
  const partes: string[] = [rect(0, 0, W, H, { relleno: '#f7f7f7', trazo: 'none' })]
  for (const c of calles) partes.push(segmento(c.a, c.b, { trazo: '#cfcfcf', grosor: 30 }))
  for (const c of calles) {
    partes.push(segmento(c.a, c.b, { trazo: '#ffffff', grosor: 1.6, punteado: true }))
  }
  for (const c of calles) {
    // El nombre va en el tramo más largo sin cruces.
    const cortes = calles.filter((o) => o !== c).map((o) => corte(c.a, c.b, o.a, o.b)).filter((t): t is number => t !== null)
    const marcas = [0.06, ...cortes.sort((p, q) => p - q), 0.94]
    let mejor = 0
    for (let i = 1; i < marcas.length - 1; i++) if (marcas[i + 1] - marcas[i] > marcas[mejor + 1] - marcas[mejor]) mejor = i
    const t = (marcas[mejor] + marcas[mejor + 1]) / 2
    const p: Pt = [c.a[0] + (c.b[0] - c.a[0]) * t, c.a[1] + (c.b[1] - c.a[1]) * t]
    let ang = (Math.atan2(c.b[1] - c.a[1], c.b[0] - c.a[0]) * 180) / Math.PI
    if (ang > 90) ang -= 180
    if (ang <= -90) ang += 180
    if (Math.abs(Math.abs(ang) - 90) < 1) ang = -90
    partes.push(el('text', { x: p[0], y: p[1], 'font-size': 14, 'font-weight': 700, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: TINTA, transform: `rotate(${Math.round(ang * 10) / 10} ${Math.round(p[0] * 10) / 10} ${Math.round(p[1] * 10) / 10})` }, esc(c.nombre)))
  }
  partes.push(rect(1, 1, W - 2, H - 2, { trazo: GRIS, grosor: 1.4, redondeo: 8 }))
  const dibujo = svg(W, H, partes.join(''), `Croquis con cuatro calles: ${calles.map((c) => c.nombre).join(', ')}`)
  return { dibujo, calles }
}

export const rectasParalelas: TipoPregunta = {
  id: 'fo-rectas',
  nombre: 'Paralelas y perpendiculares',
  queHacen: 'Reconocen rectas paralelas y perpendiculares en dibujos y en las calles de un croquis.',
  citas: { [P4]: 'así como su comprensión sobre líneas perpendiculares y paralelas usando lenguaje geométrico' },
  ...BASE,
  generar({ azar }) {
    if (azar() < 0.5) {
      const que = azar() < 0.5 ? 'paralelas' : 'perpendiculares'
      const tipos: ParTipo[] = que === 'paralelas' ? ['paralelas', 'casi', elegir(azar, ['perpendiculares', 'secantes'] as const)] : ['perpendiculares', 'secantes', elegir(azar, ['paralelas', 'casi'] as const)]
      const orden = barajar(azar, [0, 1, 2])
      const W = 176
      const H = 150
      const dibujo = enFila(
        orden.map((i) => parDeRectas(azar, tipos[i], W, H)),
        W,
        H,
        `Tres pares de rectas: ${orden.map((i, k) => `${LETRAS[k]} ${tipos[i] === 'casi' ? 'que se van juntando' : tipos[i]}`).join(', ')}`,
      )
      return opciones(`rectas:${que}:${orden.map((i) => tipos[i]).join('-')}:${entero(azar, 0, 999)}`, 'Observa los pares de rectas.', dibujo, `¿En cuál las rectas son ${que}?`, cual('Par', 3, orden.indexOf(0)), [
        ...orden.map((i, k) => `Par ${LETRAS[k]}: ${COMO_RECTAS[tipos[i]]}`),
        `Son ${que}: Par ${LETRAS[orden.indexOf(0)]}`,
      ])
    }
    const { dibujo, calles } = croquisCalles(azar)
    const par = calles.filter((c) => c.rol === 'par')
    const ref = elegir(azar, par)
    const paralela = azar() < 0.5
    const correcta = paralela ? par.find((c) => c !== ref)!.nombre : calles.find((c) => c.rol === 'sola')!.nombre
    const otras = calles.filter((c) => c !== ref && c.nombre !== correcta).map((c) => c.nombre)
    const otraPar = par.find((c) => c !== ref)!.nombre
    const diagonal = calles.find((c) => c.rol === 'diagonal')!.nombre
    const pasos = paralela
      ? [`${ref.nombre} y ${correcta} van en la misma dirección y nunca se juntan`, `Es paralela ${aLaCalle(ref.nombre)}: ${correcta}`]
      : [
          `${correcta} cruza ${aLaCalle(ref.nombre)} formando un ángulo recto`,
          `${diagonal} va inclinada y ${otraPar} es paralela ${aLaCalle(ref.nombre)}`,
          `Es perpendicular ${aLaCalle(ref.nombre)}: ${correcta}`,
        ]
    return opciones(
      `calles:${paralela}:${calles.map((c) => `${c.nombre}@${c.a.join(',')}`).join('|')}`,
      'Observa el croquis de las calles del barrio.',
      dibujo,
      `¿Qué calle es ${paralela ? 'paralela' : 'perpendicular'} ${aLaCalle(ref.nombre)}?`,
      alternativas(azar, correcta, otras, 3),
      pasos,
    )
  },
}

/** Letras de los vértices, por fuera de la figura. */
function letrasVertices(q: Pt[], sep = 17) {
  const s = signo(areaFirmada(q))
  return q
    .map((v, i) => {
      const p = q[(i + q.length - 1) % q.length]
      const r = q[(i + 1) % q.length]
      const u1: Pt = [(p[0] - v[0]) / dist(p, v), (p[1] - v[1]) / dist(p, v)]
      const u2: Pt = [(r[0] - v[0]) / dist(r, v), (r[1] - v[1]) / dist(r, v)]
      let b: Pt = [u1[0] + u2[0], u1[1] + u2[1]]
      const lb = Math.hypot(b[0], b[1])
      b = lb < 1e-6 ? [-u1[1], u1[0]] : [b[0] / lb, b[1] / lb]
      const d = signo(vuelta(p, v, r)) === s ? -1 : 1
      return texto(v[0] + d * b[0] * sep, v[1] + d * b[1] * sep, LETRAS_VERTICES[i], { tam: 17, peso: 700 })
    })
    .join('')
}
const LETRAS_VERTICES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const nombreLado = (i: number, n: number) => [LETRAS_VERTICES[i], LETRAS_VERTICES[(i + 1) % n]].sort().join('')

export const ladosParalelos: TipoPregunta = {
  id: 'fo-lados-paralelos',
  nombre: 'Lados paralelos y perpendiculares',
  queHacen: 'Nombran con letras los lados de un polígono que son paralelos o perpendiculares a otro y cuentan sus pares de lados paralelos.',
  citas: { [P4]: 'así como su comprensión sobre líneas perpendiculares y paralelas usando lenguaje geométrico' },
  ...BASE,
  generar({ azar }) {
    const modo = elegir(azar, ['paralelo', 'paralelo', 'perpendicular', 'pares'] as const)
    const tipos = modo === 'pares' ? ['rectangulo', 'cuadrado', 'trapecioRectangulo', 'trapecioIsosceles', 'romboide', 'triangulo', 'casita', 'hexagono'] : ['rectangulo', 'trapecioRectangulo', 'trapecioIsosceles', 'romboide', 'casita', 'hexagono', 'ele', 'te']
    const caso = hasta(() => {
      const tipo = elegir(azar, tipos)
      const pts = deLaTrama(azar, tipo)
      const n = pts.length
      const v = pts.map((p, i): Pt => [pts[(i + 1) % n][0] - p[0], pts[(i + 1) % n][1] - p[1]])
      const paralelos = (i: number) => rango(n).filter((j) => j !== i && Math.abs(v[i][0] * v[j][1] - v[i][1] * v[j][0]) < 1e-9)
      const perpendiculares = (i: number) => rango(n).filter((j) => Math.abs(v[i][0] * v[j][0] + v[i][1] * v[j][1]) < 1e-9)
      if (modo === 'pares') {
        const pares = rango(n).flatMap((i) => paralelos(i).filter((j) => j > i).map((j): [number, number] => [i, j]))
        return { pts, n, tipo, ref: -1, correcta: pares.length, malas: [] as number[], confusion: [] as number[], pares }
      }
      const buenos = rango(n).filter((i) => (modo === 'paralelo' ? paralelos(i) : perpendiculares(i)).length === 1)
      if (!buenos.length) return null
      const ref = elegir(azar, buenos)
      const correcta = (modo === 'paralelo' ? paralelos(ref) : perpendiculares(ref))[0]
      // Primero el error más frecuente: confundir paralela con perpendicular; luego los lados vecinos.
      const confusion = modo === 'paralelo' ? perpendiculares(ref) : paralelos(ref)
      const malas = [...confusion, ...rango(n).filter((j) => j !== ref && j !== correcta && !confusion.includes(j))]
      return { pts, n, tipo, ref, correcta, malas, confusion, pares: [] as [number, number][] }
    })
    const { cuerpo, q } = figuraEnTrama(caso.pts, 320, 250, 44, SUAVE, 30)
    const dibujo = svg(320, 250, cuerpo + letrasVertices(q), `Polígono ${LETRAS_VERTICES.slice(0, caso.n).join('')} dibujado en una trama de puntos`)
    const clave = `lados:${modo}:${caso.ref}:${caso.pts.map((p) => p.join(',')).join(' ')}`
    const lado = (i: number) => nombreLado(i, caso.n)
    if (modo === 'pares') {
      return opciones(clave, 'Observa el polígono.', dibujo, '¿Cuántos pares de lados paralelos tiene?', altNum(azar, caso.correcta, [caso.correcta + 1, caso.correcta - 1, 4, caso.n / 2, 0, 3]), [
        'Se buscan lados que van en la misma dirección y nunca se juntan',
        caso.pares.length ? `Paralelos: ${caso.pares.map(([i, j]) => `${lado(i)} y ${lado(j)}`).join('; ')}` : 'Ningún lado va en la misma dirección que otro',
        `Pares de lados paralelos: ${num(caso.correcta)}`,
      ])
    }
    const [r, c] = [caso.ref, caso.correcta]
    const conf = caso.confusion.map(lado)
    const varios = conf.length > 1
    // Si los dos lados se tocan, el vértice donde se juntan.
    const junta = (r + 1) % caso.n === c ? c : (c + 1) % caso.n === r ? r : -1
    const pasos =
      modo === 'paralelo'
        ? [
            `${lado(r)} y ${lado(c)} van en la misma dirección: si se alargan, nunca se juntan`,
            ...(conf.length ? [`${lista(conf)} ${varios ? 'son perpendiculares' : 'es perpendicular'} a ${lado(r)}, no ${varios ? 'paralelos' : 'paralelo'}`] : []),
            `Es paralelo al lado ${lado(r)}: ${lado(c)}`,
          ]
        : [
            junta >= 0 ? `${lado(r)} y ${lado(c)} se juntan en ${LETRAS_VERTICES[junta]} formando un ángulo recto` : `${lado(r)} y ${lado(c)}, si se alargan, se cortan formando un ángulo recto`,
            ...(conf.length ? [`${lista(conf)} ${varios ? 'van' : 'va'} en la misma dirección que ${lado(r)}: ${varios ? 'son paralelos' : 'es paralelo'}`] : []),
            `Es perpendicular al lado ${lado(r)}: ${lado(c)}`,
          ]
    return opciones(clave, `Observa el polígono ${LETRAS_VERTICES.slice(0, caso.n).join('')}.`, dibujo, `¿Qué lado es ${modo} al lado ${lado(caso.ref)}?`, alternativas(azar, lado(caso.correcta), caso.malas.map(lado), Math.min(4, caso.n - 1)), pasos)
  },
}

// ---------- Cubos y prismas ----------

type Caja = { F: Pt[]; B: Pt[]; ancho: number; alto: number }

/** Una caja de w × h al frente y d de fondo, en perspectiva: el fondo se va hacia arriba y a la derecha. */
function cajaEn(x: number, y: number, w: number, h: number, d: number, fx = 0.6, fy = 0.45): Caja {
  const dx = d * fx
  const dy = d * fy
  const F: Pt[] = [
    [x, y + dy],
    [x + w, y + dy],
    [x + w, y + dy + h],
    [x, y + dy + h],
  ]
  const B = F.map(([a, b]): Pt => [a + dx, b - dy])
  return { F, B, ancho: w + dx, alto: h + dy }
}

/** La caja con sus tres caras visibles y las aristas que no se ven, punteadas. */
function dibujarCaja(c: Caja, rellenos: [string, string, string], grosor = 2.6) {
  const { F, B } = c
  return [
    poligono(F, { relleno: rellenos[0], grosor }),
    poligono([F[0], F[1], B[1], B[0]], { relleno: rellenos[1], grosor }),
    poligono([F[1], B[1], B[2], F[2]], { relleno: rellenos[2], grosor }),
    ...[
      [B[3], B[0]],
      [B[3], B[2]],
      [B[3], F[3]],
    ].map(([a, b]) => segmento(a, b, { trazo: GRIS, grosor: 1.8, punteado: true })),
  ].join('')
}

/** Un punto de una cara: o + s·(u − o) + t·(v − o). */
const enCara = (o: Pt, u: Pt, v: Pt, s: number, t: number): Pt => [o[0] + s * (u[0] - o[0]) + t * (v[0] - o[0]), o[1] + s * (u[1] - o[1]) + t * (v[1] - o[1])]

const PUNTOS_DADO: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [
    [0.27, 0.27],
    [0.73, 0.73],
  ],
  3: [
    [0.25, 0.25],
    [0.5, 0.5],
    [0.75, 0.75],
  ],
}

type Cuerpo = { cosa: string; varias: string; w: number; h: number; d: number; cubo: boolean; deco: 'dado' | 'regalo' | 'leche' | 'zapatos' | 'galletas' | 'madera'; rellenos: [string, string, string] }

const CUERPOS: Cuerpo[] = [
  { cosa: 'el dado', varias: 'dados', w: 1, h: 1, d: 1, cubo: true, deco: 'dado', rellenos: ['#ffffff', '#f4f4f4', '#e2e2e2'] },
  { cosa: 'la caja de regalo', varias: 'cajas de regalo', w: 1, h: 1, d: 1, cubo: true, deco: 'regalo', rellenos: [ROSA, '#f8e2df', '#e9c3be'] },
  { cosa: 'el cubo de madera', varias: 'cubos de madera', w: 1, h: 1, d: 1, cubo: true, deco: 'madera', rellenos: ['#f1e3b8', '#f8efd2', '#dcc78d'] },
  { cosa: 'la caja de zapatos', varias: 'cajas de zapatos', w: 1.8, h: 0.72, d: 1, cubo: false, deco: 'zapatos', rellenos: [ARENA, '#f8efdc', '#e3d2ae'] },
  { cosa: 'la caja de leche', varias: 'cajas de leche', w: 0.72, h: 1.55, d: 0.72, cubo: false, deco: 'leche', rellenos: [AZUL, '#eaf1f9', '#c6d6e8'] },
  { cosa: 'la caja de galletas', varias: 'cajas de galletas', w: 1.45, h: 0.55, d: 1.45, cubo: false, deco: 'galletas', rellenos: [VERDE, '#eef6e9', '#cddfc1'] },
]

const formaDe = (c: Cuerpo) => (c.cubo ? 'cubo' : 'prisma de base cuadrangular')

/** El objeto (dado, caja de leche…) como caja en perspectiva, con lo que lo hace reconocible. */
function dibujarCuerpo(c: Cuerpo, x: number, y: number, u: number) {
  const caja = cajaEn(x, y, c.w * u, c.h * u, c.d * u)
  const { F, B } = caja
  const partes = [dibujarCaja(caja, c.rellenos)]
  if (c.deco === 'dado') {
    const pips = (o: Pt, a: Pt, b: Pt, n: number, r: number) =>
      PUNTOS_DADO[n].map(([s, t]) => {
        const [px, py] = enCara(o, a, b, s, t)
        return circulo(px, py, r, { relleno: TINTA, trazo: 'none' })
      })
    partes.push(...pips(F[0], F[1], F[3], 1, u * 0.07), ...pips(B[0], B[1], F[0], 2, u * 0.05), ...pips(F[1], B[1], F[2], 3, u * 0.05))
  } else if (c.deco === 'regalo') {
    const m = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    const cinta = { trazo: '#8f8f8f', grosor: u * 0.07 }
    partes.push(segmento(m(F[0], F[1]), m(F[3], F[2]), cinta), segmento(m(F[0], F[1]), m(B[0], B[1]), cinta), segmento(m(F[1], B[1]), m(F[2], B[2]), cinta))
    const [cx, cy] = m(m(F[0], F[1]), m(B[0], B[1]))
    partes.push(elipse(cx - u * 0.1, cy - u * 0.05, u * 0.11, u * 0.06, { relleno: '#ffffff', grosor: 1.6 }), elipse(cx + u * 0.1, cy - u * 0.05, u * 0.11, u * 0.06, { relleno: '#ffffff', grosor: 1.6 }))
  } else if (c.deco === 'leche' && c.w * u >= 60) {
    const [a, b] = [enCara(F[0], F[1], F[3], 0.12, 0.38), enCara(F[0], F[1], F[3], 0.88, 0.62)]
    partes.push(rect(a[0], a[1], b[0] - a[0], b[1] - a[1], { relleno: '#ffffff', grosor: 1.4, redondeo: 4 }), texto((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 'LECHE', { tam: 14, peso: 700 }))
  } else if (c.deco === 'zapatos') {
    const t = 0.28
    partes.push(segmento(enCara(F[0], F[1], F[3], 0, t), enCara(F[0], F[1], F[3], 1, t), { grosor: 1.6 }), segmento(enCara(F[1], B[1], F[2], 0, t), enCara(F[1], B[1], F[2], 1, t), { grosor: 1.6 }))
  } else if (c.deco === 'galletas' && c.w * u >= 80) {
    const [cx, cy] = enCara(F[0], F[1], F[3], 0.5, 0.5)
    partes.push(texto(cx, cy, 'GALLETAS', { tam: 14, peso: 700 }))
  }
  return { cuerpo: partes.join(''), caja }
}

/** Tamaño (px por unidad) para dibujar un cuerpo solo, grande y sin pasarse de alto. */
const tamCuerpo = (c: Cuerpo) => Math.min(180 / (c.w + c.d * 0.6), 210 / (c.h + c.d * 0.45))

const ELEMENTOS = { caras: 6, aristas: 12, vertices: 8 }
const PALABRA = { caras: 'caras', aristas: 'aristas', vertices: 'vértices' }
/** «Cuántas caras», pero «cuántos vértices». */
const CUANTAS = { caras: 'Cuántas', aristas: 'Cuántas', vertices: 'Cuántos' }
/** Lo que se ve en el dibujo de una caja (`dibujarCaja`): 3 caras, 9 aristas con línea entera (3 punteadas) y 7 vértices. */
const A_LA_VISTA = { caras: 3, aristas: 9, vertices: 7 }

/** Pasos para contar caras, aristas o vértices en el dibujo de una caja: los que se ven más los que no. */
function contarEnCaja(que: keyof typeof ELEMENTOS) {
  const k = ELEMENTOS[que]
  const v = A_LA_VISTA[que]
  const o = k - v
  if (que === 'caras') return [`Se ven ${num(v)} caras: adelante, arriba y al costado`, `No se ven ${num(o)}: atrás, abajo y el otro costado`, `Caras: ${num(v)} + ${num(o)} = ${num(k)}`]
  if (que === 'aristas') return [`Aristas con línea entera, las que se ven: ${num(v)}`, `Aristas punteadas, las que no se ven: ${num(o)}`, `Aristas: ${num(v)} + ${num(o)} = ${num(k)}`]
  return [`Vértices que se ven: ${num(v)}`, `${o === 1 ? 'Vértice que no se ve' : 'Vértices que no se ven'}, donde se juntan las punteadas: ${num(o)}`, `Vértices: ${num(v)} + ${num(o)} = ${num(k)}`]
}
/** "el dado" → "dado". */
const sinArticulo = (s: string) => s.replace(/^(el|la) /, '')

export const cuerpoElementos: TipoPregunta = {
  id: 'fo-cuerpo-elementos',
  nombre: 'Caras, aristas y vértices',
  queHacen: 'Cuentan las caras, aristas y vértices de cubos y prismas de base cuadrangular del entorno (dado, caja de leche), también de varias cajas juntas.',
  citas: { [P4]: 'su comprensión sobre los elementos de cubos y prismas de base cuadrangular: caras, vértices, aristas' },
  ...BASE,
  generar({ azar }) {
    const quien = nombre(azar)
    const c = elegir(azar, CUERPOS)
    const que = elegir(azar, ['caras', 'aristas', 'vertices'] as const)
    const modo = azar()
    if (modo < 0.45) {
      const u = tamCuerpo(c)
      const { cuerpo, caja } = dibujarCuerpo(c, 0, 0, u)
      const dibujo = svg(caja.ancho + 48, caja.alto + 40, grupo(cuerpo, 24, 20), `${mayus(c.cosa)} dibujado en perspectiva, con las aristas que no se ven punteadas`)
      const k = ELEMENTOS[que]
      const otros = Object.values(ELEMENTOS).filter((x) => x !== k)
      return opciones(`cuerpo:${c.deco}:${que}`, `Observa ${c.cosa} de ${quien}. Tiene forma de ${formaDe(c)}. Las líneas punteadas son las aristas que no se ven.`, dibujo, `¿${CUANTAS[que]} ${PALABRA[que]} tiene?`, altNum(azar, k, [...otros, k - 1, k + 2, k / 2, 4]), contarEnCaja(que))
    }
    if (modo < 0.65) {
      // ¿Cuántas caras son cuadrados? Se sabe por las medidas, no por cómo se ve el dibujo.
      const forma = elegir(azar, ['cubo', 'base', 'frente', 'distintas'] as const)
      const [w, h, d] = hasta((): [number, number, number] | null => {
        const v = () => entero(azar, 2, 8) * 5
        const [s, t, r] = [v(), v(), v()]
        const dims: [number, number, number] = forma === 'cubo' ? [s, s, s] : forma === 'base' ? [s, t, s] : forma === 'frente' ? [s, s, t] : [s, t, r]
        if (new Set(dims).size !== (forma === 'cubo' ? 1 : forma === 'distintas' ? 3 : 2)) return null
        return Math.max(...dims) / Math.min(...dims) > 2.5 ? null : dims
      })
      const cuadradas = w === h && h === d ? 6 : w === h || w === d || h === d ? 2 : 0
      const cuales = w === h && h === d ? 'Todas sus medidas son iguales: es un cubo y sus 6 caras son cuadrados.' : w === d ? 'La cara de arriba y la de abajo son cuadrados.' : w === h ? 'La cara de adelante y la de atrás son cuadrados.' : h === d ? 'Las dos caras de los costados son cuadrados.' : 'Ninguna cara tiene sus dos medidas iguales.'
      const u = 150 / Math.max(w + d * 0.6, h + d * 0.45)
      const caja = cajaEn(0, 0, w * u, h * u, d * u)
      const { F, B } = caja
      const X = 62
      const Y = 18
      const etiquetas = [
        texto(X + (F[3][0] + F[2][0]) / 2, Y + F[3][1] + 18, `${w} cm`, { tam: 15, peso: 700 }),
        texto(X + F[0][0] - 10, Y + (F[0][1] + F[3][1]) / 2, `${h} cm`, { tam: 15, peso: 700, ancla: 'end' }),
        texto(X + (F[2][0] + B[2][0]) / 2 + 10, Y + (F[2][1] + B[2][1]) / 2 + 12, `${d} cm`, { tam: 15, peso: 700, ancla: 'start' }),
      ]
      const dibujo = svg(caja.ancho + X + 74, caja.alto + Y + 36, grupo(dibujarCaja(caja, [ARENA, '#f8efdc', '#e3d2ae']), X, Y) + etiquetas.join(''), `Una caja de ${w} cm de ancho, ${h} cm de alto y ${d} cm de fondo`)
      // Cada par de caras con sus dos medidas; es cuadrado si son iguales.
      const pares = [
        { donde: 'adelante y atrás', a: w, b: h },
        { donde: 'arriba y abajo', a: w, b: d },
        { donde: 'los costados', a: d, b: h },
      ]
      const iguales = pares.filter((p) => p.a === p.b)
      const pasos = [
        'Una cara es un cuadrado si sus dos medidas son iguales',
        mayus(pares.map((p) => `${p.donde.replace('los ', '')}: ${num(p.a)} y ${num(p.b)} cm`).join('; ')),
        iguales.length === 3
          ? `Las 3 medidas son iguales: sus ${num(cuadradas)} caras son cuadrados`
          : iguales.length
            ? `Solo ${lista(iguales.map((p) => p.donde))} tienen dos medidas iguales: ${num(cuadradas)}`
            : `Ninguna cara tiene sus dos medidas iguales: ${num(cuadradas)}`,
      ]
      return opciones(`cuadradas:${w}-${h}-${d}`, `${quien} midió esta caja con su regla.`, dibujo, '¿Cuántas de sus caras son cuadrados?', altNum(azar, cuadradas, [cuadradas === 2 ? 4 : 2, 6, 0, 4, 1, 3]), pasos, cuales)
    }
    if (modo < 0.9) {
      // Varias cajas en fila: tantas como entren sin que cada una quede muy chica.
      let k = entero(azar, 2, 4)
      const ancho = c.w + c.d * 0.6
      while (k > 2 && (540 / k - 18) / ancho < 62) k--
      const u = Math.min(120 / ancho, 130 / (c.h + c.d * 0.45), (540 / k - 18) / ancho)
      const unaCaja = cajaEn(0, 0, c.w * u, c.h * u, c.d * u)
      const piezas = rango(k).map((i) => grupo(dibujarCuerpo(c, 0, 0, u).cuerpo, 16 + i * (unaCaja.ancho + 18), 16))
      const dibujo = svg(16 + k * (unaCaja.ancho + 18) + 4, unaCaja.alto + 32, piezas.join(''), `${k} ${c.varias} iguales`)
      const e = ELEMENTOS[que]
      const t = k * e
      const otros = Object.values(ELEMENTOS)
        .filter((x) => x !== e)
        .map((x) => k * x)
      return opciones(`cuerpos:${c.deco}:${k}:${que}`, `En la bodega de ${quien} hay ${k} ${c.varias} como ${c.cosa.startsWith('el ') ? 'estos. Cada uno' : 'estas. Cada una'} tiene forma de ${formaDe(c)}.`, dibujo, `¿${CUANTAS[que]} ${PALABRA[que]} tienen en total?`, altNum(azar, t, [e, ...otros, t + k, t - k, e + k]), [
        `Cada ${sinArticulo(c.cosa)} tiene ${num(e)} ${PALABRA[que]}, como todo ${formaDe(c)}`,
        `Son ${num(k)} ${c.varias}: ${num(k)} × ${num(e)} = ${num(t)}`,
      ])
    }
    const u = tamCuerpo(c)
    const { cuerpo, caja } = dibujarCuerpo(c, 0, 0, u)
    const dibujo = svg(caja.ancho + 48, caja.alto + 40, grupo(cuerpo, 24, 20), `${mayus(c.cosa)} dibujado en perspectiva`)
    const [todas, vistas] = [ELEMENTOS.caras, A_LA_VISTA.caras]
    return opciones(
      `ocultas:${c.deco}`,
      `Observa ${c.cosa}. Tiene forma de ${formaDe(c)} y tiene 6 caras.`,
      dibujo,
      '¿Cuántas de sus caras NO se ven en el dibujo?',
      altNum(azar, 3, [0, 6, 2, 4, 1]),
      [`En el dibujo se ven ${num(vistas)} caras: adelante, arriba y al costado`, `No se ven: ${num(todas)} − ${num(vistas)} = ${num(todas - vistas)}`],
      'Se ven 3 caras (adelante, arriba y al costado); las otras 3 quedan detrás.',
    )
  },
}

/** Las 12 aristas de una caja: primero las de atrás, luego las de fondo y al final las de adelante (así se dibujan). */
const aristasDe = ({ F, B }: Caja): [Pt, Pt][] => [
  [B[0], B[1]],
  [B[1], B[2]],
  [B[2], B[3]],
  [B[3], B[0]],
  [F[0], B[0]],
  [F[1], B[1]],
  [F[2], B[2]],
  [F[3], B[3]],
  [F[0], F[1]],
  [F[1], F[2]],
  [F[2], F[3]],
  [F[3], F[0]],
]
/** Las aristas que van de arriba a abajo (la altura de la caja). */
const VERTICALES = [1, 3, 9, 11]

function dibujoEsqueleto(caja: Caja, puestas: boolean[], largas: boolean[] | null) {
  const aristas = aristasDe(caja)
  const partes = aristas.map(([a, b], i) => (puestas[i] ? segmento(a, b, largas ? (largas[i] ? { trazo: TINTA, grosor: 6 } : { trazo: '#a8875a', grosor: 5 }) : { trazo: '#6f522f', grosor: 5.5 }) : ''))
  partes.push(...[...caja.F, ...caja.B].map(([x, y]) => circulo(x, y, 7.5, { relleno: '#d4d4d4', grosor: 1.8 })))
  return partes.join('')
}

export const esqueleto: TipoPregunta = {
  id: 'fo-esqueleto',
  nombre: 'Palitos y bolitas',
  queHacen: 'Arman (en el dibujo) el esqueleto de un cubo o un prisma con palitos y bolitas de plastilina: cuentan aristas y vértices, y cuántos palitos faltan.',
  citas: { [P4]: 'su comprensión sobre los elementos de cubos y prismas de base cuadrangular: caras, vértices, aristas' },
  ...BASE,
  generar({ azar }) {
    const quien = nombre(azar)
    const modo = azar()
    if (modo < 0.68) {
      const cubo = azar() < 0.5
      const [w, h, d] = cubo ? [1, 1, 1] : elegir(azar, [[0.8, 1.5, 0.8], [1.5, 0.75, 1.5], [1.7, 0.8, 1]] as [number, number, number][])
      const u = 150 / Math.max(w + d * 0.6, h + d * 0.45)
      const caja = cajaEn(30, 24, w * u, h * u, d * u)
      const cuerpo = cubo ? 'cubo' : 'prisma de base cuadrangular'
      if (modo < 0.4) {
        const k = entero(azar, 1, 4)
        const bolitas = azar() < 0.4
        const dibujo = svg(caja.ancho + 60, caja.alto + 48, dibujoEsqueleto(caja, Array(12).fill(true), null), `Esqueleto de un ${cuerpo} hecho con palitos y bolitas de plastilina`)
        const t = (bolitas ? 8 : 12) * k
        const enunciado = k === 1 ? `${quien} arma el esqueleto de un ${cuerpo} con palitos y bolitas de plastilina, como en el dibujo.` : `${quien} quiere armar ${k} esqueletos de ${cuerpo} como este, con palitos y bolitas de plastilina.`
        const errores = bolitas ? [12 * k, 6 * k, 8, 4 * k, t + k] : [8 * k, 6 * k, 12, t - k, 4 * k, t + k]
        const cada = t / k
        return opciones(`esqueleto:${cubo}:${w}:${k}:${bolitas}`, enunciado, dibujo, bolitas ? '¿Cuántas bolitas de plastilina necesita?' : '¿Cuántos palitos necesita?', altNum(azar, t, errores), [
          'Cada palito es una arista y cada bolita, un vértice',
          `Un ${cuerpo} tiene ${num(cada)} ${bolitas ? 'vértices' : 'aristas'}: ${num(cada)} ${bolitas ? 'bolitas' : 'palitos'}`,
          ...(k > 1 ? [`Para ${num(k)} esqueletos: ${num(k)} × ${num(cada)} = ${num(t)}`] : []),
        ])
      }
      // El esqueleto terminado es el modelo; ya usó algunos palitos (o bolitas): ¿cuántos le faltan?
      const bolitas = azar() < 0.35
      const usados = bolitas ? entero(azar, 2, 6) : entero(azar, 3, 10)
      const total = bolitas ? 8 : 12
      const f = total - usados
      const dibujo = svg(caja.ancho + 60, caja.alto + 48, dibujoEsqueleto(caja, Array(12).fill(true), null), `Esqueleto terminado de un ${cuerpo} hecho con palitos y bolitas de plastilina`)
      return opciones(
        `faltan:${cubo}:${w}:${bolitas}:${usados}`,
        `${quien} quiere armar el esqueleto de un ${cuerpo} como el del dibujo. Ya ${bolitas ? `hizo ${plural(usados, 'bolita', 'bolitas')} de plastilina` : `cortó ${plural(usados, 'palito', 'palitos')}`}.`,
        dibujo,
        bolitas ? '¿Cuántas bolitas más necesita?' : '¿Cuántos palitos más necesita?',
        altNum(azar, f, bolitas ? [12 - usados, usados, f + 1, f - 1, 8] : [8 - usados, usados, f + 1, f - 1, 12], 4, 1),
        [`El esqueleto del dibujo tiene ${num(total)} ${bolitas ? 'bolitas, una en cada vértice' : 'palitos, uno en cada arista'}`, `Le faltan: ${num(total)} − ${num(usados)} = ${num(f)}`],
        `El esqueleto tiene ${total} ${bolitas ? 'bolitas (sus vértices)' : 'palitos (sus aristas)'}: ${total} − ${usados} = ${f}.`,
      )
    }
    // Prisma de base cuadrada con palitos largos (la altura o la base) y cortos.
    const alto = azar() < 0.5
    const [w, h, d] = alto ? [0.8, 1.6, 0.8] : [1.5, 0.7, 1.5]
    const u = 150 / Math.max(w + d * 0.6, h + d * 0.45)
    const caja = cajaEn(30, 24, w * u, h * u, d * u)
    const largas = rango(12).map((i) => VERTICALES.includes(i) === alto)
    const pide = azar() < 0.5 ? 'largos' : 'cortos'
    const nLargos = alto ? 4 : 8
    const r = pide === 'largos' ? nLargos : 12 - nLargos
    const dibujo = svg(caja.ancho + 60, caja.alto + 48, dibujoEsqueleto(caja, Array(12).fill(true), largas), `Esqueleto de un prisma de base cuadrada con palitos largos (oscuros) y cortos (claros)`)
    return opciones(
      `largos:${alto}:${pide}`,
      `${quien} arma el esqueleto de un prisma de base cuadrangular. Su base es un cuadrado. Usa palitos ${alto ? 'cortos para las bases y largos para la altura' : 'largos para las bases y cortos para la altura'}.`,
      dibujo,
      `¿Cuántos palitos ${pide} usa?`,
      altNum(azar, r, [12 - r, 6, 12, 2, r + 2]),
      [
        `Las 2 bases cuadradas: 4 + 4 = 8 palitos ${alto ? 'cortos' : 'largos'}`,
        `Las aristas de la altura: 4 palitos ${alto ? 'largos' : 'cortos'}`,
        `Palitos ${pide}: ${num(r)}`,
      ],
      `Cada base cuadrada tiene 4 aristas (8 en las dos bases) y la altura tiene 4 aristas.`,
    )
  },
}

/** Un cubito en perspectiva, con su esquina de adelante, abajo y a la izquierda en (X, Y). */
function cubito(X: number, Y: number, u: number, dx: number, dy: number) {
  return [
    rect(X, Y - u, u, u, { relleno: '#f1e3b8', grosor: 1.6 }),
    poligono(
      [
        [X, Y - u],
        [X + u, Y - u],
        [X + u + dx, Y - u - dy],
        [X + dx, Y - u - dy],
      ],
      { relleno: '#f8efd2', grosor: 1.6 },
    ),
    poligono(
      [
        [X + u, Y - u],
        [X + u + dx, Y - u - dy],
        [X + u + dx, Y - dy],
        [X + u, Y],
      ],
      { relleno: '#dcc78d', grosor: 1.6 },
    ),
  ].join('')
}

export const cubitosCaja: TipoPregunta = {
  id: 'fo-cubitos-caja',
  nombre: '¿Cuántos cubitos caben?',
  queHacen: 'Cuentan los cubitos que forman un prisma (también los que no se ven) o cuántos cubitos caben en una caja.',
  citas: { [P4]: 'y con formas tridimensionales (cubos y prismas de base cuadrangular), sus elementos y su capacidad' },
  ...BASE,
  generar({ azar }) {
    const quien = nombre(azar)
    const [a, b, c] = hasta((): [number, number, number] | null => {
      const x = [entero(azar, 2, 4), entero(azar, 2, 3), entero(azar, 2, 3)] as [number, number, number]
      return x[0] * x[1] * x[2] >= 8 && x[0] * x[1] * x[2] <= 36 ? x : null
    })
    const u = 40
    const dx = u * 0.5
    const dy = u * 0.42
    const X0 = 24
    const piso = 24 + c * u + b * dy
    const W = X0 + a * u + b * dx + 24
    const H = piso + 20
    const t = a * b * c
    const partes: string[] = []
    const llena = azar() < 0.58
    for (let z = b - 1; z >= 0; z--) for (let y = 0; y < (llena ? c : 1); y++) for (let x = 0; x < a; x++) partes.push(cubito(X0 + x * u + z * dx, piso - y * u - z * dy, u, dx, dy))
    if (llena) {
      const visibles = t - (a - 1) * (b - 1) * (c - 1)
      const caras = a * c + b * c + a * b
      return opciones(
        `cubitos:${a}${b}${c}`,
        `${quien} armó este prisma con cubitos iguales, sin dejar huecos.`,
        svg(W, H, partes.join(''), `Prisma de cubitos: ${a} de largo, ${b} de fondo y ${c} de alto`),
        '¿Cuántos cubitos usó?',
        altNum(azar, t, [visibles, caras, a * c, t - a * b, t + a * b, a + b + c], 4, 1),
        [
          `Una capa: ${num(a)} cubitos de largo y ${num(b)} de fondo: ${num(a)} × ${num(b)} = ${num(a * b)}`,
          `Son ${num(c)} capas, una encima de otra: ${num(a * b)} × ${num(c)} = ${num(t)}`,
        ],
        visibles !== t ? `Hay cubitos que no se ven: son ${a} × ${b} = ${a * b} cubitos por capa y ${c} capas.` : undefined,
      )
    }
    // La caja vacía de c cubitos de alto, con la primera capa ya puesta.
    const caja = cajaEn(X0, piso - c * u - b * dy, a * u, c * u, b * u, 0.5, 0.42)
    const { F, B } = caja
    const fantasma = rango(c - 1).map((k) => rect(X0 + (b - 1) * dx, piso - (k + 2) * u - (b - 1) * dy, u, u, { trazo: GRIS, grosor: 1.4, punteado: true }))
    partes.push(...fantasma)
    partes.push(poligono(F, { grosor: 2.6 }), poligono([F[0], F[1], B[1], B[0]], { grosor: 2.6 }), poligono([F[1], B[1], B[2], F[2]], { grosor: 2.6 }))
    partes.push(...[[B[3], B[0]], [B[3], B[2]], [B[3], F[3]]].map(([p, q]) => segmento(p, q, { trazo: GRIS, grosor: 1.8, punteado: true })))
    return opciones(
      `caja-cubitos:${a}${b}${c}`,
      `${quien} quiere llenar esta caja con cubitos. Ya puso la primera capa en el fondo. En la caja caben ${c} capas, una encima de otra (mira la esquina de atrás).`,
      svg(W, H, partes.join(''), `Caja con una capa de ${a} por ${b} cubitos en el fondo y ${c} cubitos de alto`),
      '¿Cuántos cubitos caben en toda la caja?',
      altNum(azar, t, [a * b, a * b + c, a * b * (c - 1), t + a * b, a + b + c, a * c]),
      [
        `Primera capa: ${num(a)} de largo y ${num(b)} de fondo: ${num(a)} × ${num(b)} = ${num(a * b)} cubitos`,
        `En la esquina de atrás se ve que caben ${num(c)} capas`,
        `Toda la caja: ${num(a * b)} × ${num(c)} = ${num(t)}`,
      ],
    )
  },
}

// ---------- Plantillas del cubo ----------

const normalCeldas = (cs: Celda[]): Celda[] => {
  const mx = Math.min(...cs.map((c) => c[0]))
  const my = Math.min(...cs.map((c) => c[1]))
  return cs.map(([x, y]): Celda => [x - mx, y - my]).sort((p, q) => p[1] - q[1] || p[0] - q[0])
}

/** Las 8 formas de girar o voltear una figura de cuadraditos. */
function simetrias(cs: Celda[]): Celda[][] {
  const res: Celda[][] = []
  for (const espejo of [false, true]) {
    let q = cs.map(([x, y]): Celda => (espejo ? [-x, y] : [x, y]))
    for (let r = 0; r < 4; r++) {
      res.push(normalCeldas(q))
      q = q.map(([x, y]): Celda => [-y, x])
    }
  }
  return res
}
const canonica = (cs: Celda[]) => simetrias(cs).map(firmaCeldas).sort()[0]

let HEXOMINOS: Celda[][] | null = null
/** Las 35 figuras distintas de 6 cuadraditos unidos por sus lados. */
function hexominos(): Celda[][] {
  if (HEXOMINOS) return HEXOMINOS
  let nivel = new Map<string, Celda[]>([['0,0', [[0, 0]]]])
  for (let t = 2; t <= 6; t++) {
    const sig = new Map<string, Celda[]>()
    for (const cs of nivel.values()) {
      const s = conjunto(cs)
      for (const [x, y] of cs)
        for (const [dx, dy] of VECINOS) {
          if (s.has(kc(x + dx, y + dy))) continue
          const nuevo: Celda[] = [...cs, [x + dx, y + dy]]
          const ca = canonica(nuevo)
          if (!sig.has(ca)) sig.set(ca, normalCeldas(nuevo))
        }
    }
    nivel = sig
  }
  HEXOMINOS = [...nivel.values()]
  return HEXOMINOS
}

/**
 * Qué cara del cubo cae sobre cada cuadrado al armarlo: se hace "rodar" el cubo sobre la plantilla. Las caras van
 * de 0 a 5 y la opuesta de la cara f es f ^ 1. Si dos cuadrados caen en la misma cara, la plantilla no arma un cubo.
 */
function carasDelCubo(cs: Celda[]): number[] | null {
  const indice = new Map(cs.map(([x, y], i) => [kc(x, y), i]))
  // Estado: [abajo, arriba, norte, sur, este, oeste].
  const estados: (number[] | undefined)[] = Array(cs.length)
  estados[0] = [0, 1, 2, 3, 4, 5]
  const rodar: [number, number, (e: number[]) => number[]][] = [
    [1, 0, ([ab, ar, n, s, e, o]) => [e, o, n, s, ar, ab]],
    [-1, 0, ([ab, ar, n, s, e, o]) => [o, e, n, s, ab, ar]],
    [0, 1, ([ab, ar, n, s, e, o]) => [s, n, ab, ar, e, o]],
    [0, -1, ([ab, ar, n, s, e, o]) => [n, s, ar, ab, e, o]],
  ]
  const cola = [0]
  while (cola.length) {
    const i = cola.shift()!
    for (const [dx, dy, f] of rodar) {
      const j = indice.get(kc(cs[i][0] + dx, cs[i][1] + dy))
      if (j === undefined || estados[j]) continue
      estados[j] = f(estados[i]!)
      cola.push(j)
    }
  }
  const caras = estados.map((e) => e![0])
  return new Set(caras).size === 6 ? caras : null
}

const tieneBloque = (cs: Celda[]) => {
  const s = conjunto(cs)
  return cs.some(([x, y]) => s.has(kc(x + 1, y)) && s.has(kc(x, y + 1)) && s.has(kc(x + 1, y + 1)))
}
const filaLarga = (cs: Celda[]) => {
  const s = conjunto(cs)
  return cs.some(([x, y]) => rango(5).every((k) => s.has(kc(x + k, y))) || rango(5).every((k) => s.has(kc(x, y + k))))
}

/** Una plantilla girada o volteada al azar, más ancha que alta. */
function orientar(azar: Azar, cs: Celda[]): Celda[] {
  const q = elegir(azar, simetrias(cs))
  const w = Math.max(...q.map((c) => c[0]))
  const h = Math.max(...q.map((c) => c[1]))
  return h > w ? normalCeldas(q.map(([x, y]): Celda => [y, x])) : q
}

function dibujoPlantilla(cs: Celda[], w: number, h: number, ladoMax: number, textos?: (string | null)[], relleno = SUAVE) {
  const cols = Math.max(...cs.map((c) => c[0])) + 1
  const filas = Math.max(...cs.map((c) => c[1])) + 1
  const l = Math.min(ladoMax, (w - 24) / cols, (h - 24) / filas)
  const x0 = (w - cols * l) / 2
  const y0 = (h - filas * l) / 2
  return cs
    .map(([x, y], i) => {
      const t = textos?.[i]
      const marca = t === '?' ? texto(x0 + x * l + l / 2, y0 + y * l + l / 2, '?', { tam: l * 0.5, peso: 700, color: GRIS }) : t && t.length === 1 && /[A-Z]/.test(t) ? texto(x0 + x * l + 8, y0 + y * l + 10, t, { tam: 13, peso: 700, ancla: 'start', color: GRIS }) : t ? texto(x0 + x * l + l / 2, y0 + y * l + l / 2, t, { tam: l * 0.46, peso: 700 }) : ''
      return rect(x0 + x * l, y0 + y * l, l, l, { relleno: textos && !(t && /^\d$/.test(t)) ? '#ffffff' : relleno, grosor: 2.4 }) + marca
    })
    .join('')
}

export const plantillaCubo: TipoPregunta = {
  id: 'fo-plantilla-cubo',
  nombre: '¿Qué plantilla arma un cubo?',
  queHacen: 'Imaginan cómo se dobla cada plantilla de 6 cuadrados y eligen la que sí (o la que no) arma un cubo.',
  citas: { [P4]: 'Hace afirmaciones sobre algunas relaciones entre elementos de las formas y su desarrollo en el plano' },
  ...BASE,
  generar({ azar }) {
    const todas = hexominos()
    const buenas = todas.filter((cs) => carasDelCubo(cs))
    const malas = todas.filter((cs) => !carasDelCubo(cs))
    // Las que engañan: sin un bloque de 2 × 2 ni una fila de 5 (esas se descartan a simple vista).
    const enganosas = malas.filter((cs) => !tieneBloque(cs) && !filaLarga(cs))
    const mala = () => (azar() < 0.8 ? elegir(azar, enganosas) : elegir(azar, malas))
    const no = azar() < 0.35
    const piezas = no ? [mala(), ...barajar(azar, buenas).slice(0, 2)] : [elegir(azar, buenas), ...hasta(() => {
      const [p, q] = [mala(), mala()]
      return canonica(p) !== canonica(q) ? [p, q] : null
    })]
    const orden = barajar(azar, [0, 1, 2])
    const W = 176
    const H = 128
    const dibujo = enFila(
      orden.map((i) => dibujoPlantilla(orientar(azar, piezas[i]), W, H, 30)),
      W,
      H,
      'Tres plantillas de 6 cuadrados iguales',
    )
    const quien = nombre(azar)
    const letraDe = (i: number) => `Plantilla ${LETRAS[orden.indexOf(i)]}`
    const porQueNo = (cs: Celda[]) =>
      filaLarga(cs) ? 'tiene 5 cuadrados en fila; al doblarla, dos se enciman' : tieneBloque(cs) ? 'tiene 4 cuadrados en bloque; al doblarla, dos se enciman' : 'al doblarla, dos cuadrados se enciman y queda un lado abierto'
    const pasos = no
      ? [`${letraDe(0)}: ${porQueNo(piezas[0])}`, `${lista([letraDe(1), letraDe(2)].sort())} se cierran sin que se encime ningún cuadrado`, `No arma un cubo: ${letraDe(0)}`]
      : [...[1, 2].sort((p, q) => orden.indexOf(p) - orden.indexOf(q)).map((i) => `${letraDe(i)}: ${porQueNo(piezas[i])}`), `Se cierra sin que se encime ningún cuadrado: ${letraDe(0)}`]
    return opciones(
      `plantilla:${no}:${orden.map((i) => canonica(piezas[i])).join('|')}`,
      `${quien} quiere armar una caja con forma de cubo. Recortó estas tres plantillas de 6 cuadrados iguales.`,
      dibujo,
      no ? 'Dos plantillas arman un cubo. ¿Cuál NO arma un cubo?' : '¿Cuál plantilla arma un cubo?',
      cual('Plantilla', 3, orden.indexOf(0)),
      pasos,
      'Para comprobar, se puede recortar la plantilla en papel y doblarla.',
    )
  },
}

export const caraOpuesta: TipoPregunta = {
  id: 'fo-cara-opuesta',
  nombre: 'Caras opuestas del cubo',
  queHacen: 'Imaginan cómo se arma el cubo con su plantilla para saber qué cara queda frente a otra, como en un dado.',
  citas: { [P4]: 'Hace afirmaciones sobre algunas relaciones entre elementos de las formas y su desarrollo en el plano' },
  ...BASE,
  generar({ azar }) {
    const cs = orientar(azar, elegir(azar, hexominos().filter((p) => carasDelCubo(p))))
    const caras = carasDelCubo(cs)!
    const opuesta = (i: number) => caras.indexOf(caras[i] ^ 1)
    const cols = Math.max(...cs.map((c) => c[0])) + 1
    const filas = Math.max(...cs.map((c) => c[1])) + 1
    const L = 52
    const W = cols * L + 40
    const H = filas * L + 40
    /** ¿Están en una misma fila o columna con un cuadrado en medio? Así se ve fácil que quedan enfrentadas. */
    const enLinea = (i: number, j: number) => {
      const [a, b] = [cs[i], cs[j]]
      const recta = (a[0] === b[0] && Math.abs(a[1] - b[1]) === 2) || (a[1] === b[1] && Math.abs(a[0] - b[0]) === 2)
      return recta && cs.some(([x, y]) => 2 * x === a[0] + b[0] && 2 * y === a[1] + b[1])
    }
    const modo = azar()
    if (modo < 0.5) {
      const numeros = barajar(azar, [1, 2, 3, 4, 5, 6])
      const i = entero(azar, 0, 5)
      const j = opuesta(i)
      const dibujo = svg(W, H, dibujoPlantilla(cs, W, H, L, numeros.map(String)), `Plantilla de cubo con los números ${numeros.join(', ')}`)
      // Los errores: elegir una cara vecina en la plantilla (las que tocan al número).
      const vecinas = rango(6).filter((k) => k !== i && k !== j && Math.abs(cs[k][0] - cs[i][0]) + Math.abs(cs[k][1] - cs[i][1]) === 1)
      const resto = rango(6).filter((k) => k !== i && k !== j && !vecinas.includes(k))
      const [a, b] = [num(numeros[i]), num(numeros[j])]
      return opciones(
        `opuesta:${firmaCeldas(cs)}:${numeros.join('')}:${i}`,
        'Con esta plantilla se arma un cubo.',
        dibujo,
        `Al armarlo, ¿qué número queda en la cara opuesta (la de enfrente) a la del ${numeros[i]}?`,
        alternativas(azar, String(numeros[j]), [...vecinas, ...resto].map((k) => String(numeros[k])), 4),
        [
          `${vecinas.length > 1 ? 'Las caras que tocan' : 'La cara que toca'} al ${a} (${lista(vecinas.map((k) => num(numeros[k])))}) ${vecinas.length > 1 ? 'quedan' : 'queda'} a su lado, no enfrente`,
          enLinea(i, j) ? `El ${a} y el ${b} están en línea, con un cuadrado en medio: quedan enfrentados` : `Al doblar la plantilla, el ${b} se cierra frente al ${a}`,
          `Cara opuesta a la del ${a}: ${b}`,
        ],
      )
    }
    // Un dado: las caras opuestas suman 7.
    const pares = barajar(azar, [
      [1, 6],
      [2, 5],
      [3, 4],
    ])
    const valor = rango(6).map((k) => {
      const [p, q] = pares[caras[k] >> 1]
      return caras[k] % 2 === 0 ? p : q
    })
    // Se muestra un número de cada par de caras opuestas; los otros tres quedan vacíos.
    const visibles = new Set<number>()
    for (let par = 0; par < 3; par++) visibles.add(caras.indexOf(2 * par + (azar() < 0.5 ? 0 : 1)))
    const vacias = rango(6).filter((k) => !visibles.has(k))
    if (modo < 0.8) {
      const i = elegir(azar, vacias)
      const textos = rango(6).map((k) => (visibles.has(k) ? String(valor[k]) : k === i ? '?' : null))
      const dibujo = svg(W, H, dibujoPlantilla(cs, W, H, L, textos), 'Plantilla de un dado con tres números y tres caras vacías, una con un signo de pregunta')
      return opciones(
        `dado:${firmaCeldas(cs)}:${valor.join('')}:${[...visibles].join('')}:${i}`,
        'Esta es la plantilla de un dado. En un dado, los números de las caras opuestas suman 7.',
        dibujo,
        '¿Qué número va en la cara del signo de pregunta?',
        alternativas(azar, String(valor[i]), vacias.filter((k) => k !== i).map((k) => String(valor[k])), 3),
        [
          enLinea(i, opuesta(i)) ? `La cara del ? y la del ${num(valor[opuesta(i)])} están en línea, con un cuadrado en medio: son opuestas` : `Al armar el dado, la cara del ? queda frente a la del ${num(valor[opuesta(i)])}`,
          `Las caras opuestas suman 7: 7 − ${num(valor[opuesta(i)])} = ${num(valor[i])}`,
        ],
        `Al armar el dado, esa cara queda frente a la del ${valor[opuesta(i)]}: ${valor[opuesta(i)]} + ${valor[i]} = 7.`,
      )
    }
    const letras = new Map(vacias.map((k, n) => [k, LETRAS[n]]))
    const textos = rango(6).map((k) => (visibles.has(k) ? String(valor[k]) : letras.get(k)!))
    const dibujo = svg(W, H, dibujoPlantilla(cs, W, H, L, textos), 'Plantilla de un dado con tres números y tres caras vacías con las letras A, B y C')
    return {
      forma: 'abierta',
      clave: `dado-abierta:${firmaCeldas(cs)}:${valor.join('')}:${[...visibles].join('')}`,
      enunciado: 'Esta es la plantilla de un dado. En un dado, los números de las caras opuestas suman 7.',
      dibujo,
      pregunta: 'Escribe en las caras A, B y C el número que les toca.',
      respuesta: vacias.map((k) => `${letras.get(k)}: ${valor[k]}`).join(' · '),
      espacio: 'dibujo',
      pasos: [
        `Al armar el dado, ${lista(vacias.map((k, n) => `${letras.get(k)} ${n === 0 ? 'queda ' : ''}frente al ${num(valor[opuesta(k)])}`))}`,
        'Las caras opuestas suman 7',
        vacias.map((k) => `${letras.get(k)}: 7 − ${num(valor[opuesta(k)])} = ${num(valor[k])}`).join('; '),
      ],
    }
  },
}

// ---------- Perímetro ----------

/** Medidas escritas por fuera de cada lado (null: ese lado va sin medida). */
function medidasLados(q: Pt[], textos: (string | null)[], tam = 15) {
  const s = signo(areaFirmada(q))
  return q
    .map((a, i) => {
      const t = textos[i]
      if (!t) return ''
      const b = q[(i + 1) % q.length]
      const L = dist(a, b)
      const n: Pt = [(s * (b[1] - a[1])) / L, (-s * (b[0] - a[0])) / L]
      const d = 11 + (Math.abs(n[0]) * anchoTexto(t, tam)) / 2 + Math.abs(n[1]) * 9
      return texto((a[0] + b[0]) / 2 + n[0] * d, (a[1] + b[1]) / 2 + n[1] * d, t, { tam, peso: 700 })
    })
    .join('')
}

/** Marquitas de ángulo recto en las esquinas. */
const esquinasRectas = (q: Pt[], t = 11) =>
  q
    .map((v, i) => {
      const p = q[(i + q.length - 1) % q.length]
      const r = q[(i + 1) % q.length]
      const u1: Pt = [((p[0] - v[0]) / dist(p, v)) * t, ((p[1] - v[1]) / dist(p, v)) * t]
      const u2: Pt = [((r[0] - v[0]) / dist(r, v)) * t, ((r[1] - v[1]) / dist(r, v)) * t]
      return ruta(`M${v[0] + u1[0]},${v[1] + u1[1]} L${v[0] + u1[0] + u2[0]},${v[1] + u1[1] + u2[1]} L${v[0] + u2[0]},${v[1] + u2[1]}`, { trazo: GRIS, grosor: 1.4 })
    })
    .join('')

const TERRENOS = [
  { cosa: 'la chacra de su familia', plantas: true },
  { cosa: 'el biohuerto del colegio', plantas: true },
  { cosa: 'el corral de sus ovejas', plantas: false },
  { cosa: 'el corral de sus cuyes', plantas: false },
  { cosa: 'el terreno de su abuela', plantas: true },
]

export const perimetro: TipoPregunta = {
  id: 'fo-perimetro',
  nombre: 'Cerca el terreno',
  queHacen: 'Calculan cuántos metros de alambre se necesitan para cercar un terreno (su perímetro), aunque solo tenga escritas algunas medidas.',
  citas: { [P4]: 'la longitud, el perímetro (metro y centímetro)' },
  ...BASE,
  generar({ azar }) {
    const quien = nombre(azar)
    const terreno = elegir(azar, TERRENOS)
    const W = 420
    const H = 270
    const modo = azar()
    const conM = (alt: ReturnType<typeof altNum>) => conUnidad(alt, 'm')
    if (modo < 0.4) {
      const n = entero(azar, 3, 6)
      const q = encajar(poligonoConvexo(azar, n, false), 70, 36, W - 140, H - 72)
      const largos = q.map((a, i) => dist(a, q[(i + 1) % n]))
      const escala = Math.max(...largos) / entero(azar, 18, 42)
      const m = largos.map((l) => Math.max(4, Math.round(l / escala)))
      const P = m.reduce((s, x) => s + x, 0)
      const dibujo = svg(W, H, poligono(q, { relleno: VERDE, grosor: 3 }) + (terreno.plantas ? plantitas(q, azar, 5) : '') + medidasLados(q, m.map((x) => `${x} m`)), `Terreno de ${n} lados que miden ${m.join(', ')} metros`)
      return opciones(`perimetro:${m.join('-')}`, `${quien} quiere cercar ${terreno.cosa} con alambre. Estas son las medidas de sus lados.`, dibujo, '¿Cuántos metros de alambre necesita para dar una vuelta completa?', conM(altNum(azar, P, [P - Math.min(...m), P + Math.min(...m), P - 10, P + 10, P - Math.max(...m), P - 1])), [
        `Una vuelta completa es el perímetro: se suman sus ${num(n)} lados`,
        `${m.map(num).join(' + ')} = ${num(P)} m`,
      ])
    }
    // Rectángulo o cuadrado: solo están escritas algunas medidas.
    const cuadrado = modo >= 0.68
    const [l, a] = cuadrado
      ? [entero(azar, 6, 30), 0]
      : hasta((): [number, number] | null => {
          const x = entero(azar, 12, 40)
          const y = entero(azar, 5, 25)
          return y < x && x / y <= 3.2 ? [x, y] : null
        })
    const alto = cuadrado ? l : a
    const k = Math.min(270 / l, 170 / alto)
    const [w, h] = [l * k, alto * k]
    const x0 = (W - w) / 2
    const y0 = (H - h) / 2
    const q: Pt[] = [
      [x0, y0],
      [x0 + w, y0],
      [x0 + w, y0 + h],
      [x0, y0 + h],
    ]
    const base = poligono(q, { relleno: VERDE, grosor: 3 }) + esquinasRectas(q) + (terreno.plantas ? plantitas(q, azar, 5) : '')
    if (!cuadrado) {
      const P = 2 * (l + a)
      const dibujo = svg(W, H, base + medidasLados(q, [null, `${a} m`, `${l} m`, null]), `Terreno rectangular de ${l} m de largo y ${a} m de ancho`)
      return opciones(
        `perimetro-rect:${l}-${a}`,
        `${quien} quiere cercar ${terreno.cosa}. Tiene forma de rectángulo.`,
        dibujo,
        '¿Cuántos metros de alambre necesita para dar una vuelta completa?',
        conM(altNum(azar, P, [l + a, 2 * l + a, l + 2 * a, l * a, P + 10, P - 10])),
        [`Los lados opuestos miden lo mismo: dos de ${num(l)} m y dos de ${num(a)} m`, `${num(l)} + ${num(a)} + ${num(l)} + ${num(a)} = ${num(P)} m`],
        `Los lados opuestos del rectángulo miden lo mismo: ${l} + ${a} + ${l} + ${a} = ${P}.`,
      )
    }
    if (modo < 0.84) {
      const P = 4 * l
      const dibujo = svg(W, H, base + medidasLados(q, [null, null, `${l} m`, null]), `Terreno cuadrado de ${l} m de lado`)
      return opciones(
        `perimetro-cuad:${l}`,
        `${quien} quiere cercar ${terreno.cosa}. Tiene forma de cuadrado.`,
        dibujo,
        '¿Cuántos metros de alambre necesita para dar una vuelta completa?',
        conM(altNum(azar, P, [2 * l, 3 * l, l, l + 4, l * l, P + 4])),
        [`Los 4 lados del cuadrado miden ${num(l)} m`, `4 × ${num(l)} = ${num(P)} m`],
        `Los 4 lados del cuadrado miden lo mismo: 4 × ${l} = ${P}.`,
      )
    }
    const P = 4 * l
    const dibujo = svg(W, H, base + medidasLados(q, [null, null, '? m', null]), 'Terreno cuadrado con la medida de un lado por averiguar')
    return opciones(`perimetro-inverso:${l}`, `Para cercar ${terreno.cosa}, que tiene forma de cuadrado, ${quien} usó ${P} m de alambre en una vuelta.`, dibujo, '¿Cuánto mide cada lado?', conM(altNum(azar, l, [P / 2, P - 4, P / 3, 2 * l, l + 4], 4, 1)), [
      `Los 4 lados del cuadrado miden lo mismo y juntos suman ${num(P)} m`,
      `Cada lado: ${num(P)} ÷ 4 = ${num(l)} m`,
    ])
  },
}

export const perimetroCuadricula: TipoPregunta = {
  id: 'fo-perimetro-cuadricula',
  nombre: 'Perímetro en la cuadrícula',
  queHacen: 'Cuentan los lados de cuadradito del borde de figuras en la cuadrícula para hallar su perímetro, las comparan o dibujan una con el perímetro pedido.',
  citas: { [P4]: 'Expresa con material concreto o gráficos su comprensión sobre el perímetro' },
  ...BASE,
  generar({ azar }) {
    const modo = azar()
    if (modo < 0.45) {
      const n = entero(azar, 6, 12)
      const cs = poliomino(azar, n, 8, 5).map(([x, y]): Celda => [x + 1, y + 1])
      const P = perimetroCeldas(cs)
      const L = 30
      const dibujo = svg(10 * L + 8, 7 * L + 8, rejilla(4, 4, 10, 7, L) + pintarCeldas(cs, 4, 4, L), `Figura de ${n} cuadraditos en una cuadrícula`)
      // Lados del borde que van de lado a lado (arriba y abajo de un cuadradito) y los que van de arriba abajo.
      const s = conjunto(cs)
      const acostados = cs.reduce((t, [x, y]) => t + [y - 1, y + 1].filter((v) => !s.has(kc(x, v))).length, 0)
      const parados = P - acostados
      return opciones(
        `perim-cuad:${firmaCeldas(cs)}`,
        'Observa la figura. Cada lado de un cuadradito mide 1 cm.',
        dibujo,
        '¿Cuál es el perímetro de la figura?',
        conUnidad(altNum(azar, P, [n, P - 2, P + 2, P - 4, P + 4, P - 1]), 'cm'),
        [
          'Se cuentan los lados de cuadradito del borde, dando la vuelta (no los cuadraditos)',
          `Lados de arriba y de abajo: ${num(acostados)}; de la izquierda y la derecha: ${num(parados)}`,
          `Perímetro: ${num(acostados)} + ${num(parados)} = ${num(P)} cm`,
        ],
        `Se cuentan los lados de cuadradito que forman el borde. La figura tiene ${n} cuadraditos, pero eso es su superficie.`,
      )
    }
    if (modo < 0.8) {
      // Tres figuras con los mismos cuadraditos y distinto perímetro.
      // Con 6 a 8 cuadraditos hay al menos tres perímetros posibles (con 5, solo dos).
      const n = entero(azar, 6, 8)
      const figuras = intentar(200, () => {
        const fs = rango(3).map(() => poliomino(azar, n, 5, 4))
        const ps = fs.map(perimetroCeldas)
        return new Set(ps).size === 3 ? { fs, ps } : null
      })
      if (!figuras) return null
      const L = 24
      const W = 6 * L + 8
      const H = 5 * L + 8
      const mayor = azar() < 0.55
      const busca = mayor ? Math.max(...figuras.ps) : Math.min(...figuras.ps)
      const dibujo = enFila(
        figuras.fs.map((cs) => {
          const mx = Math.min(...cs.map((c) => c[0]))
          const my = Math.min(...cs.map((c) => c[1]))
          const ancho = Math.max(...cs.map((c) => c[0])) - mx + 1
          const alto = Math.max(...cs.map((c) => c[1])) - my + 1
          const centrada = cs.map(([x, y]): Celda => [x - mx + Math.floor((6 - ancho) / 2), y - my + Math.floor((5 - alto) / 2)])
          return rejilla(4, 4, 6, 5, L) + pintarCeldas(centrada, 4, 4, L)
        }),
        W,
        H,
        `Tres figuras de ${n} cuadraditos cada una, con perímetros ${figuras.ps.join(', ')}`,
      )
      return opciones(
        `perim-tres:${mayor}:${figuras.fs.map(firmaCeldas).join('|')}`,
        `Las tres figuras tienen ${n} cuadraditos. Cada lado de un cuadradito mide 1 cm.`,
        dibujo,
        mayor ? '¿Cuál tiene el mayor perímetro?' : '¿Cuál tiene el menor perímetro?',
        cual('Figura', 3, figuras.ps.indexOf(busca)),
        [
          'En cada figura se cuentan los lados de cuadradito del borde',
          `Perímetro ${figuras.ps.map((p, i) => `de ${LETRAS[i]}: ${num(p)} cm`).join('; ')}`,
          `${mayor ? 'El mayor' : 'El menor'} es ${num(busca)} cm: Figura ${LETRAS[figuras.ps.indexOf(busca)]}`,
        ],
        `Perímetros: ${figuras.ps.map((p, i) => `${LETRAS[i]} = ${p} cm`).join(', ')}.`,
      )
    }
    const P = elegir(azar, [10, 12, 14, 16, 18])
    const L = 28
    const medidas = rango(P / 2 - 1)
      .map((i) => [i + 1, P / 2 - i - 1])
      .filter(([x, y]) => x <= y && y <= 11)
    const formas = medidas.map(([x, y]) => `${x} × ${y}`)
    // Un ejemplo para la clave: mejor uno que no sea de un solo cuadradito de ancho.
    const [ancho, largo] = medidas.find(([x]) => x >= 2) ?? medidas[0]
    return {
      forma: 'abierta',
      clave: `dibuja-perimetro:${P}`,
      enunciado: `Cada lado de un cuadradito mide 1 cm. Dibuja en la cuadrícula un rectángulo que tenga ${P} cm de perímetro.`,
      dibujo: svg(12 * L + 8, 7 * L + 8, rejilla(4, 4, 12, 7, L), 'Una cuadrícula vacía'),
      respuesta: `Un rectángulo cuyo largo y ancho sumen ${P / 2} cuadraditos, por ejemplo: ${formas.join(', ')} cuadraditos.`,
      espacio: 'dibujo',
      pasos: [
        `Perímetro: largo + ancho + largo + ancho = ${num(P)} cm`,
        `Entonces largo + ancho = ${num(P)} ÷ 2 = ${num(P / 2)} cuadraditos`,
        `Por ejemplo, ${num(largo)} de largo y ${num(ancho)} de ancho: ${num(largo)} + ${num(ancho)} + ${num(largo)} + ${num(ancho)} = ${num(P)}`,
      ],
    }
  },
}

// ---------- Superficie ----------

type Mitad = { c: Celda; esquina: 'tl' | 'tr' | 'br' | 'bl' }
const LADOS_MITAD: Record<Mitad['esquina'], ('arriba' | 'abajo' | 'izquierda' | 'derecha')[]> = { tl: ['arriba', 'izquierda'], tr: ['arriba', 'derecha'], br: ['abajo', 'derecha'], bl: ['abajo', 'izquierda'] }
const aristaDe = ([x, y]: Celda, lado: 'arriba' | 'abajo' | 'izquierda' | 'derecha') => (lado === 'arriba' ? `h${kc(x, y)}` : lado === 'abajo' ? `h${kc(x, y + 1)}` : lado === 'izquierda' ? `v${kc(x, y)}` : `v${kc(x + 1, y)}`)

/** Figura de cuadraditos y medios cuadraditos (triángulos), con su borde grueso. */
function dibujoConMitades(cs: Celda[], mitades: Mitad[], x0: number, y0: number, L: number) {
  const cuenta = new Map<string, number>()
  const sumar = (k: string) => cuenta.set(k, (cuenta.get(k) ?? 0) + 1)
  for (const c of cs) for (const lado of ['arriba', 'abajo', 'izquierda', 'derecha'] as const) sumar(aristaDe(c, lado))
  for (const m of mitades) for (const lado of LADOS_MITAD[m.esquina]) sumar(aristaDe(m.c, lado))
  const partes = cs.map(([x, y]) => rect(x0 + x * L, y0 + y * L, L, L, { relleno: PINTA, trazo: '#8c8c8c', grosor: 1 }))
  const esquinas = (x: number, y: number) => ({ tl: [x0 + x * L, y0 + y * L] as Pt, tr: [x0 + (x + 1) * L, y0 + y * L] as Pt, br: [x0 + (x + 1) * L, y0 + (y + 1) * L] as Pt, bl: [x0 + x * L, y0 + (y + 1) * L] as Pt })
  const opuestas = { tl: ['tr', 'bl'], tr: ['tl', 'br'], br: ['tr', 'bl'], bl: ['tl', 'br'] } as const
  for (const m of mitades) {
    const e = esquinas(...m.c)
    const [p, q] = opuestas[m.esquina]
    partes.push(poligono([e[m.esquina], e[p], e[q]], { relleno: PINTA, trazo: '#8c8c8c', grosor: 1 }))
  }
  for (const [k, n] of cuenta) {
    if (n !== 1) continue
    const [x, y] = k.slice(1).split(',').map(Number)
    partes.push(k[0] === 'h' ? linea(x0 + x * L, y0 + y * L, x0 + (x + 1) * L, y0 + y * L, { grosor: 2.6 }) : linea(x0 + x * L, y0 + y * L, x0 + x * L, y0 + (y + 1) * L, { grosor: 2.6 }))
  }
  for (const m of mitades) {
    const e = esquinas(...m.c)
    const [p, q] = opuestas[m.esquina]
    partes.push(segmento(e[p], e[q], { grosor: 2.6 }))
  }
  return partes.join('')
}

export const superficieContar: TipoPregunta = {
  id: 'fo-superficie-contar',
  nombre: 'Mide con cuadraditos',
  queHacen: 'Miden la superficie de figuras y pisos contando unidades cuadradas (cuadraditos o losetas), también con mitades.',
  citas: { [P4]: 'la superficie (unidades patrón)' },
  ...BASE,
  generar({ azar }) {
    const quien = nombre(azar)
    if (azar() < 0.55) {
      const n = entero(azar, 6, 13)
      const cs = poliomino(azar, n, 7, 4).map(([x, y]): Celda => [x + 2, y + 2])
      const s = conjunto(cs)
      const k = azar() < 0.45 ? elegir(azar, [2, 2, 4]) : 0
      const mitades: Mitad[] = []
      const usadas = new Set<string>()
      for (let intento = 0; intento < 200 && mitades.length < k; intento++) {
        const [x, y] = elegir(azar, cs)
        const [dx, dy] = elegir(azar, VECINOS)
        const c: Celda = [x + dx, y + dy]
        if (s.has(kc(...c)) || usadas.has(kc(...c)) || c[0] < 0 || c[1] < 0 || c[0] > 10 || c[1] > 7) continue
        // La mitad se apoya en el lado que toca la figura.
        const lado = dx === 1 ? 'izquierda' : dx === -1 ? 'derecha' : dy === 1 ? 'arriba' : 'abajo'
        const posibles = (Object.keys(LADOS_MITAD) as Mitad['esquina'][]).filter((e) => LADOS_MITAD[e].includes(lado))
        mitades.push({ c, esquina: elegir(azar, posibles) })
        for (const [a, b] of [[0, 0], ...VECINOS]) usadas.add(kc(c[0] + a, c[1] + b))
      }
      if (mitades.length < k) return null
      const total = n + k / 2
      const L = 28
      const dibujo = svg(11 * L + 8, 8 * L + 8, rejilla(4, 4, 11, 8, L) + dibujoConMitades(cs, mitades, 4, 4, L), k ? `Figura de ${n} cuadraditos y ${k} mitades de cuadradito` : `Figura de ${n} cuadraditos`)
      return opciones(
        `superficie:${firmaCeldas(cs)}:${mitades.map((m) => `${kc(...m.c)}${m.esquina}`).join(' ')}`,
        k ? 'La unidad de medida es el cuadradito. Dos mitades de cuadradito forman un cuadradito.' : 'La unidad de medida es el cuadradito.',
        dibujo,
        '¿Cuántos cuadraditos mide la superficie de la figura?',
        altNum(azar, total, k ? [n + k, n, total + 1, total - 1, perimetroCeldas(cs)] : [n + 1, n - 1, perimetroCeldas(cs), n + 2, n - 2], 4, 1),
        k
          ? [
              `Cuadraditos enteros: ${num(n)}; mitades: ${num(k)}`,
              `Cada 2 mitades forman 1 cuadradito: ${num(k)} ÷ 2 = ${plural(k / 2, 'cuadradito', 'cuadraditos')}`,
              `Superficie: ${num(n)} + ${num(k / 2)} = ${plural(total, 'cuadradito', 'cuadraditos')}`,
            ]
          : ['Se cuentan todos los cuadraditos pintados, uno por uno (no los lados del borde)', `Superficie: ${plural(total, 'cuadradito', 'cuadraditos')}`],
        k ? `${n} cuadraditos enteros y ${k} mitades (${k / 2} ${k / 2 === 1 ? 'cuadradito' : 'cuadraditos'}).` : undefined,
      )
    }
    // El piso de la sala con losetas: ya se puso una fila y una columna.
    const a = entero(azar, 6, 9)
    const b = entero(azar, 4, 6)
    const L = 34
    const extra = entero(azar, 0, a - 3)
    const puestas: Celda[] = [...rango(a).map((x): Celda => [x, 0]), ...rango(b - 1).map((y): Celda => [0, y + 1]), ...rango(extra).map((x): Celda => [x + 1, 1])]
    const x0 = 24
    const y0 = 20
    const cuerpo = rect(x0, y0, a * L, b * L, { relleno: '#ffffff', trazo: 'none' }) + pintarCeldas(puestas, x0, y0, L, PINTA, 1.6) + rect(x0, y0, a * L, b * L, { grosor: 3.4 })
    const dibujo = svg(a * L + 2 * x0, b * L + 2 * y0, cuerpo, `Piso de ${a} por ${b} losetas con ${puestas.length} losetas puestas`)
    const t = a * b
    const filaYColumna = [`La fila completa tiene ${num(a)} losetas y la columna, ${num(b)}`, `Todo el piso tiene ${num(b)} filas de ${num(a)}: ${num(a)} × ${num(b)} = ${num(t)}`]
    if (azar() < 0.5) {
      return opciones(`losetas-total:${a}x${b}:${extra}`, `En la sala de ${quien} están poniendo losetas cuadradas iguales. Ya pusieron una fila y una columna completas.`, dibujo, '¿Cuántas losetas tendrá el piso cuando esté completo?', altNum(azar, t, [a + b, puestas.length, 2 * (a + b), t - puestas.length, a * (b - 1)]), filaYColumna)
    }
    const f = t - puestas.length
    return opciones(
      `losetas-faltan:${a}x${b}:${extra}`,
      `En la sala de ${quien} están poniendo losetas cuadradas iguales. Ya pusieron estas.`,
      dibujo,
      '¿Cuántas losetas faltan para cubrir todo el piso?',
      altNum(azar, f, [t, puestas.length, f + 1, f - 1, (a - 1) * b, a + b]),
      [
        ...filaYColumna,
        // La fila, la columna sin la esquina (ya contada) y las de la segunda fila.
        `Ya pusieron: ${[a, b - 1, ...(extra ? [extra] : [])].map(num).join(' + ')} = ${num(puestas.length)}`,
        `Faltan: ${num(t)} − ${num(puestas.length)} = ${num(f)}`,
      ],
      `Todo el piso lleva ${a} × ${b} = ${t} losetas; ya hay ${puestas.length}.`,
    )
  },
}

export const masExtenso: TipoPregunta = {
  id: 'fo-mas-extenso',
  nombre: '¿Cuál es más extensa?',
  queHacen: 'Comparan la superficie de figuras en la cuadrícula ("es más extensa que", "es menos extensa que") y ven que con las mismas piezas la superficie se conserva.',
  citas: { [P4]: 'estableciendo “es más extenso que”, “es menos extenso que” (superficie asociada a la noción de extensión) y su conservación' },
  ...BASE,
  generar({ azar }) {
    const centrar = (cs: Celda[], cols: number, filas: number) => {
      const mx = Math.min(...cs.map((c) => c[0]))
      const my = Math.min(...cs.map((c) => c[1]))
      const w = Math.max(...cs.map((c) => c[0])) - mx + 1
      const h = Math.max(...cs.map((c) => c[1])) - my + 1
      return cs.map(([x, y]): Celda => [x - mx + Math.floor((cols - w) / 2), y - my + Math.floor((filas - h) / 2)])
    }
    if (azar() < 0.58) {
      const k = entero(azar, 6, 9)
      const ns = barajar(azar, [k, k + 1, k + elegir(azar, [2, 3])])
      const fs = ns.map((n) => centrar(poliomino(azar, n, 5, 4), 6, 5))
      const L = 24
      const mas = azar() < 0.6
      const busca = mas ? Math.max(...ns) : Math.min(...ns)
      const dibujo = enFila(
        fs.map((cs) => rejilla(4, 4, 6, 5, L) + pintarCeldas(cs, 4, 4, L)),
        6 * L + 8,
        5 * L + 8,
        `Tres figuras en cuadrículas iguales: ${ns.map((n, i) => `${LETRAS[i]} de ${n} cuadraditos`).join(', ')}`,
      )
      return opciones(
        `extenso:${mas}:${fs.map(firmaCeldas).join('|')}`,
        'Las secciones de 4.º dibujaron sus biohuertos en cuadrículas iguales.',
        dibujo,
        mas ? '¿Cuál es más extenso?' : '¿Cuál es menos extenso?',
        cual('Biohuerto', 3, ns.indexOf(busca)),
        [
          'Se cuentan los cuadraditos pintados de cada biohuerto',
          `Cuadraditos: ${lista(ns.map((n, i) => `${LETRAS[i]} tiene ${num(n)}`))}`,
          `${mas ? 'Más' : 'Menos'} cuadraditos (${num(busca)}): Biohuerto ${LETRAS[ns.indexOf(busca)]}`,
        ],
        `Cuadraditos: ${ns.map((n, i) => `${LETRAS[i]} = ${n}`).join(', ')}.`,
      )
    }
    // Conservación: las mismas piezas en otra forma ocupan lo mismo.
    const n = entero(azar, 6, 10)
    const iguales = azar() < 0.55
    const [f1, f2] = hasta(() => {
      const a = poliomino(azar, n, 6, 4)
      const b = poliomino(azar, iguales ? n : n + elegir(azar, [1, -1]), 6, 4)
      return firmaCeldas(a) !== firmaCeldas(b) ? [centrar(a, 7, 5), centrar(b, 7, 5)] : null
    })
    const L = 26
    const quien = nombre(azar)
    const dibujo = enFila([f1, f2].map((cs) => rejilla(4, 4, 7, 5, L) + pintarCeldas(cs, 4, 4, L)), 7 * L + 8, 5 * L + 8, `Dos figuras: A de ${f1.length} cuadraditos y B de ${f2.length}`)
    const correcta = iguales ? 2 : f1.length > f2.length ? 0 : 1
    return opciones(
      `conserva:${firmaCeldas(f1)}|${firmaCeldas(f2)}`,
      `${quien} armó estas dos figuras con cuadraditos de cartulina del mismo tamaño.`,
      dibujo,
      '¿Cuál es más extensa?',
      { alternativas: ['La figura A', 'La figura B', 'Las dos tienen la misma extensión'], correcta },
      [
        `Se cuentan los cuadraditos: A tiene ${num(f1.length)} y B tiene ${num(f2.length)}`,
        iguales
          ? 'Las dos tienen la misma extensión, aunque su forma sea distinta'
          : `La figura ${f1.length > f2.length ? 'A' : 'B'} es más extensa: ${num(Math.max(f1.length, f2.length))} es más que ${num(Math.min(f1.length, f2.length))}`,
      ],
      iguales ?`Las dos tienen ${n} cuadraditos: ocupan la misma superficie aunque tengan distinta forma.` : `A tiene ${f1.length} cuadraditos y B tiene ${f2.length}.`,
    )
  },
}

// ---------- Capacidad: el litro, 1/2 L y 1/4 L ----------

const BEBIDAS = ['chicha morada', 'refresco de maracuyá', 'leche', 'agua', 'emoliente', 'limonada']

function vaso(x: number, y: number, w: number, h: number, relleno = LILA) {
  const borde: Pt[] = [
    [x, y],
    [x + w, y],
    [x + w * 0.86, y + h],
    [x + w * 0.14, y + h],
  ]
  const nivel = 0.22
  const liquido: Pt[] = [
    [x + w * 0.14 * nivel + 1.5, y + h * nivel],
    [x + w - w * 0.14 * nivel - 1.5, y + h * nivel],
    [x + w * 0.86 - 1, y + h - 1],
    [x + w * 0.14 + 1, y + h - 1],
  ]
  return poligono(liquido, { relleno, trazo: 'none' }) + poligono(borde, { grosor: 2.2 })
}

function botella(x: number, y: number, w: number, h: number, relleno = LILA) {
  const c = w * 0.4
  const xc = x + w / 2
  const yt = y + h * 0.1
  const yh = y + h * 0.34
  const d = `M${xc - c / 2},${yt} L${xc - c / 2},${y + h * 0.18} Q${x},${y + h * 0.2} ${x},${yh} L${x},${y + h - 6} Q${x},${y + h} ${x + 6},${y + h} L${x + w - 6},${y + h} Q${x + w},${y + h} ${x + w},${y + h - 6} L${x + w},${yh} Q${x + w},${y + h * 0.2} ${xc + c / 2},${y + h * 0.18} L${xc + c / 2},${yt} Z`
  return ruta(d, { relleno, grosor: 2.2 }) + rect(xc - c / 2 - 2, y, c + 4, h * 0.1, { relleno: GRIS, grosor: 1.6, redondeo: 2 })
}

/** Jarra con pico y asa; `nivel` de 0 a 1 es hasta dónde está llena (null: llena hasta arriba). */
function jarra(x: number, y: number, w: number, h: number, relleno: string | null = LILA, nivel = 0.88) {
  const partes = [
    poligono(
      [
        [x + 14, y],
        [x - 12, y - 6],
        [x + 2, y + 20],
      ],
      { relleno: '#ffffff', grosor: 2.2 },
    ),
    ruta(`M${x + w - 2},${y + h * 0.18} C${x + w + 36},${y + h * 0.18} ${x + w + 36},${y + h * 0.72} ${x + w - 2},${y + h * 0.72}`, { grosor: 7 }),
    rect(x, y, w, h, { relleno: '#ffffff', grosor: 2.4, redondeo: 10 }),
  ]
  if (relleno) partes.push(rect(x + 3, y + h * (1 - nivel), w - 6, h * nivel - 3, { relleno, trazo: 'none', redondeo: 7 }), linea(x + 3, y + h * (1 - nivel), x + w - 3, y + h * (1 - nivel), { grosor: 1.6 }))
  return partes.join('')
}

type Recipiente = { cap: number; texto: string; cosa: 'jarra' | 'botella' }
const GRANDES: Recipiente[] = [
  { cap: 0.5, texto: '1/2 L', cosa: 'botella' },
  { cap: 1, texto: '1 L', cosa: 'jarra' },
  { cap: 1, texto: '1 L', cosa: 'botella' },
  { cap: 2, texto: '2 L', cosa: 'jarra' },
  { cap: 3, texto: '3 L', cosa: 'botella' },
]
const VASOS = [
  { cap: 0.5, texto: '1/2 L' },
  { cap: 0.25, texto: '1/4 L' },
]

/** El recipiente grande con su medida debajo; devuelve el dibujo y cuánto ocupa a lo ancho. */
function recipiente(r: Recipiente, x: number, piso: number, etiqueta = r.texto) {
  const [w, h] = r.cosa === 'jarra' ? [80, 130] : r.cap >= 3 ? [62, 150] : r.cap >= 1 ? [48, 128] : [38, 100]
  const dib = r.cosa === 'jarra' ? jarra(x + 12, piso - h, w, h) : botella(x, piso - h, w, h)
  return { cuerpo: dib + texto(x + (r.cosa === 'jarra' ? 12 : 0) + w / 2, piso + 18, etiqueta, { tam: 16, peso: 700 }), ancho: w + (r.cosa === 'jarra' ? 50 : 0) }
}

export const vasosJarra: TipoPregunta = {
  id: 'fo-vasos-jarra',
  nombre: '¿Cuántos vasos se llenan?',
  queHacen: 'Calculan cuántas veces se llena un vaso de 1/2 L o de 1/4 L con una jarra o una botella, y al revés.',
  citas: { [P4]: 'la medida de capacidad de los recipientes para determinar cuántas veces se puede llenar uno con el otro' },
  ...BASE,
  generar({ azar }) {
    const quien = nombre(azar)
    const bebida = elegir(azar, BEBIDAS)
    const modo = azar()
    const piso = 168
    if (modo < 0.72) {
      const varios = modo >= 0.48
      const g = elegir(
        azar,
        GRANDES.filter((r) => !varios || r.cap <= 2),
      )
      const v = elegir(
        azar,
        VASOS.filter((x) => x.cap < g.cap),
      )
      const k = varios ? entero(azar, 2, g.cosa === 'jarra' ? 2 : 3) : 1
      const n = (k * g.cap) / v.cap
      const partes: string[] = []
      let x = 20
      for (let i = 0; i < k; i++) {
        const r = recipiente(g, x, piso)
        partes.push(r.cuerpo)
        x += r.ancho + 22
      }
      x += 20
      partes.push(ruta(`M${x - 22},${piso - 70} Q${x + 4},${piso - 104} ${x + 28},${piso - 76}`, { grosor: 2 }), puntaDeFlecha([x + 18, piso - 90], [x + 30, piso - 74]))
      x += 44
      partes.push(vaso(x, piso - 66, 48, 66), texto(x + 24, piso + 18, v.texto, { tam: 16, peso: 700 }))
      const dibujo = svg(x + 48 + 20, piso + 32, partes.join(''), `${k === 1 ? `Una ${g.cosa}` : `${k} ${g.cosa}s`} de ${g.texto} y un vaso de ${v.texto}`)
      const otro = VASOS.find((o) => o !== v)!
      const recip = g.cosa === 'jarra' ? 'jarra' : 'botella'
      const enunciado = k === 1 ? `${quien} sirve ${bebida} de una ${recip} de ${g.texto} en vasos de ${v.texto}.` : `${quien} tiene ${k} ${recip}s de ${g.texto} con ${bebida}. La sirve en vasos de ${v.texto}.`
      // Vasos que llenan 1 L y vasos que llena cada recipiente (1/2 L es la mitad de 1 L).
      const porLitro = 1 / v.cap
      const porRecip = g.cap / v.cap
      const cuenta = g.cap < 1 ? ` es la mitad de 1 L: ${num(porLitro)} ÷ 2 = ${num(porRecip)} vasos` : g.cap === 1 ? `: ${num(porRecip)} vasos` : `: ${num(g.cap)} × ${num(porLitro)} = ${num(porRecip)} vasos`
      return opciones(
        `vasos:${k}:${g.cosa}${g.cap}:${v.cap}`,
        enunciado,
        dibujo,
        '¿Cuántos vasos llena?',
        altNum(azar, n, [(k * g.cap) / otro.cap, k * g.cap, n * 2, n / 2, g.cap / v.cap, 1 / v.cap], 4, 1),
        [`${num(porLitro)} vasos de ${v.texto} llenan 1 L`, `Una ${recip} de ${g.texto}${cuenta}`, ...(k > 1 ? [`${num(k)} ${recip}s: ${num(k)} × ${num(porRecip)} = ${num(n)} vasos`] : [])],
        `${1 / v.cap} vasos de ${v.texto} hacen 1 litro.`,
      )
    }
    // Al revés: con n vasos se llenó la jarra. ¿Cuántos litros tiene?
    const v = elegir(azar, VASOS)
    const litros = entero(azar, 1, 3)
    const n = litros / v.cap
    const partes = [jarra(32, piso - 130, 80, 130), texto(72, piso + 18, '? L', { tam: 16, peso: 700 })]
    const porFila = 6
    const x0 = 200
    for (let i = 0; i < n; i++) {
      const fila = Math.floor(i / porFila)
      const col = i % porFila
      partes.push(vaso(x0 + col * 48, 22 + fila * 76, 36, 48))
    }
    partes.push(texto(x0 + (Math.min(n, porFila) * 48 - 12) / 2, 22 + Math.ceil(n / porFila) * 76 - 8, `cada vaso: ${v.texto}`, { tam: 15, peso: 700 }))
    const dibujo = svg(x0 + porFila * 48 + 8, piso + 32, partes.join(''), `Una jarra y ${n} vasos de ${v.texto}`)
    return opciones(
      `litros:${n}:${v.cap}`,
      `Para llenar la jarra de ${bebida}, ${quien} vació en ella ${n} vasos de ${v.texto}.`,
      dibujo,
      '¿Cuántos litros tiene la jarra?',
      conUnidad(altNum(azar, litros, [n, n / 2, litros * 2, litros + 1, n / 4, litros - 1], 4, 1), 'L'),
      [`Se cuentan los vasos: ${num(n)} vasos de ${v.texto}`, `${num(1 / v.cap)} vasos de ${v.texto} hacen 1 L`, `${num(n)} ÷ ${num(1 / v.cap)} = ${num(litros)} L`],
    )
  },
}

const FRACCIONES_LITRO = ['1/4 L', '1/2 L', '3/4 L', '1 L']

/**
 * Pasos para sumar botellas de 1 L, 1/2 L y 1/4 L: cada 2 de 1/2 L hacen 1 L, cada 4 de 1/4 L hacen 1 L y lo que sobra
 * de cada una se junta (el generador cuida que el total sea un número entero de litros).
 */
function pasosBotellas(k1: number, k2: number, k4: number): string[] {
  const pasos: string[] = []
  const enteros: number[] = k1 ? [k1] : []
  const sobras: number[] = [] // en cuartos de litro
  const grupo = (k: number, hacen1: number, texto: string, cuartos: number) => {
    if (!k) return
    const l = Math.floor(k / hacen1)
    const resto = (k % hacen1) * cuartos
    if (l) enteros.push(l)
    if (resto) sobras.push(resto)
    const botellas = `${plural(k, 'botella', 'botellas')} de ${texto}`
    pasos.push(l ? `${botellas} = ${num(l)} L${resto ? ` y sobra ${FRACCIONES_LITRO[resto - 1]}` : ''} (cada ${hacen1} hacen 1 L)` : `${botellas} = ${FRACCIONES_LITRO[resto - 1]}`)
  }
  grupo(k2, 2, '1/2 L', 2)
  grupo(k4, 4, '1/4 L', 1)
  const juntas = sobras.reduce((s, x) => s + x, 0)
  if (juntas) {
    pasos.push(`Se juntan: ${sobras.map((x) => FRACCIONES_LITRO[x - 1]).join(' + ')} = ${num(juntas / 4)} L`)
    enteros.push(juntas / 4)
  }
  const total = enteros.reduce((s, x) => s + x, 0)
  // Las de 1 L van en su propio paso o, si ya hay muchos, junto al primero (como mucho 4 pasos).
  const unLitro = `${plural(k1, 'botella', 'botellas')} de 1 L = ${num(k1)} L`
  if (k1 && pasos.length < 3) pasos.unshift(unLitro)
  else if (k1) pasos[0] = `${unLitro}; ${pasos[0]}`
  pasos.push(enteros.length > 1 ? `Total: ${enteros.map((x) => `${num(x)} L`).join(' + ')} = ${num(total)} L` : `Total: ${num(total)} L`)
  return pasos
}

/** Jarra medidora de 1 L: rayitas en cada cuarto de litro, solo con "1/2 L" y "1 L" escritos. */
function jarraMedidora(nivel: number, relleno: string) {
  const [x, y, w, h] = [130, 26, 112, 204]
  const arriba = y + 22
  const abajo = y + h - 4
  const yDe = (f: number) => abajo - (abajo - arriba) * f
  const partes = [
    poligono(
      [
        [x + 14, y],
        [x - 12, y - 6],
        [x + 2, y + 20],
      ],
      { relleno: '#ffffff', grosor: 2.2 },
    ),
    ruta(`M${x + w - 2},${y + h * 0.18} C${x + w + 40},${y + h * 0.18} ${x + w + 40},${y + h * 0.72} ${x + w - 2},${y + h * 0.72}`, { grosor: 7 }),
    rect(x, y, w, h, { relleno: '#ffffff', grosor: 2.4, redondeo: 10 }),
    rect(x + 3, yDe(nivel), w - 6, abajo - yDe(nivel) + 1, { relleno, trazo: 'none' }),
    linea(x + 3, yDe(nivel), x + w - 3, yDe(nivel), { grosor: 1.8 }),
  ]
  for (const f of [0.25, 0.5, 0.75, 1]) {
    const larga = f === 0.5 || f === 1
    partes.push(linea(x, yDe(f), x + (larga ? 34 : 20), yDe(f), { grosor: 2.4 }))
    if (larga) partes.push(texto(x - 10, yDe(f), f === 1 ? '1 L' : '1/2 L', { tam: 16, peso: 700, ancla: 'end' }))
  }
  return svg(320, 250, partes.join(''), `Jarra medidora de 1 litro llena hasta la marca de ${FRACCIONES_LITRO[nivel * 4 - 1]}`)
}

export const capacidadLitro: TipoPregunta = {
  id: 'fo-capacidad-litro',
  nombre: 'Litros y fracciones de litro',
  queHacen: 'Leen cuánto hay en una jarra medidora (1/4, 1/2 o 3/4 de litro) y suman botellas de 1 L, 1/2 L y 1/4 L.',
  citas: { [P4]: 'la capacidad (en litro y con fracciones)' },
  ...BASE,
  generar({ azar }) {
    const quien = nombre(azar)
    const bebida = elegir(azar, BEBIDAS)
    const modo = azar()
    if (modo < 0.55) {
      const nivel = elegir(azar, [0.25, 0.5, 0.75])
      const falta = modo >= 0.33
      const dibujo = jarraMedidora(nivel, elegir(azar, [AZUL, LILA, ARENA]))
      const r = falta ? 1 - nivel : nivel
      // En cuartos de litro: cuántas rayitas hay hasta el nivel y cuántas faltan para 1 L.
      const [llega, faltan] = [nivel * 4, 4 - nivel * 4]
      return opciones(
        `medidora:${falta}:${nivel}`,
        `${quien} echó ${bebida} en una jarra medidora de 1 litro.`,
        dibujo,
        falta ? '¿Cuánto le falta para tener 1 litro?' : `¿Cuánta ${bebida} hay en la jarra?`,
        { alternativas: FRACCIONES_LITRO, correcta: r * 4 - 1 },
        [
          'Hasta 1 L hay 4 rayitas, a la misma distancia: cada una sube 1/4 L',
          `El nivel llega a ${plural(llega, 'rayita', 'rayitas')} de 1/4 L: ${FRACCIONES_LITRO[llega - 1]}`,
          ...(falta ? [`Hasta 1 L ${faltan === 1 ? 'falta' : 'faltan'} ${plural(faltan, 'rayita', 'rayitas')} de 1/4 L: ${FRACCIONES_LITRO[faltan - 1]}`] : []),
        ],
        'Entre 0 y 1/2 L hay dos rayitas iguales: cada una es 1/4 L.',
      )
    }
    // Botellas de 1 L, 1/2 L y 1/4 L: ¿cuántos litros hay en total?
    const [k1, k2, k4] = hasta((): [number, number, number] | null => {
      const c = [entero(azar, 0, 3), entero(azar, 0, 4), entero(azar, 0, 6)] as [number, number, number]
      const tipos = c.filter((x) => x > 0).length
      const total = c[0] + c[1] / 2 + c[2] / 4
      return tipos >= 2 && c[1] + c[2] > 0 && Number.isInteger(total) && total >= 1 && total <= 5 && c[0] + c[1] + c[2] <= 10 ? c : null
    })
    const total = k1 + k2 / 2 + k4 / 4
    const partes: string[] = []
    let x = 16
    const piso = 152
    const medidas: [number, number, number, string][] = [
      [k1, 44, 116, '1 L'],
      [k2, 34, 88, '1/2 L'],
      [k4, 28, 66, '1/4 L'],
    ]
    for (const [k, w, h, t] of medidas) {
      if (!k) continue
      for (let i = 0; i < k; i++) {
        partes.push(botella(x, piso - h, w, h, elegir(azar, [AZUL, LILA, ARENA])), texto(x + w / 2, piso + 18, t, { tam: 14, peso: 700 }))
        x += w + 12
      }
      x += 16
    }
    const grupos = medidas.filter(([k]) => k > 0).map(([k, , , t]) => `${plural(k, 'botella', 'botellas')} de ${t}`)
    const dibujo = svg(x, piso + 30, partes.join(''), grupos.join(', '))
    const n = k1 + k2 + k4
    return opciones(
      `botellas:${k1}-${k2}-${k4}`,
      `Para la fiesta del aula, ${quien} trajo estas botellas llenas de ${bebida}.`,
      dibujo,
      '¿Cuántos litros hay en total?',
      conUnidad(altNum(azar, total, [n, total + 1, total - 1, k1 + k2, k1 + (k2 + k4) / 2, total + 2], 4, 1), 'L'),
      pasosBotellas(k1, k2, k4),
      `Dos botellas de 1/2 L hacen 1 L, y cuatro de 1/4 L hacen 1 L. En total: ${grupos.join(', ')}.`,
    )
  },
}

// ---------- Longitud: metros y centímetros ----------

/** Línea de medida con flechas en las puntas y la medida en una etiqueta al medio. */
function cota(a: Pt, b: Pt, etiqueta: string) {
  const tw = anchoTexto(etiqueta, 15) + 16
  const m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  return [
    segmento(a, b, { grosor: 1.6 }),
    puntaDeFlecha(b, a, 11, 5),
    puntaDeFlecha(a, b, 11, 5),
    rect(m[0] - tw / 2, m[1] - 13, tw, 26, { relleno: '#ffffff', grosor: 1.6, redondeo: 6 }),
    texto(m[0], m[1], etiqueta, { tam: 15, peso: 700 }),
  ].join('')
}

type Medible = { cosa: string; min: number; max: number; dibujo: (etiqueta: string) => Dibujo }

const MEDIBLES: Medible[] = [
  {
    cosa: 'la puerta del aula',
    min: 200,
    max: 235,
    dibujo: (e) =>
      svg(
        360,
        292,
        rect(50, 20, 110, 252, { relleno: ARENA, grosor: 2.6 }) + rect(66, 38, 78, 96, { trazo: GRIS, grosor: 1.4 }) + rect(66, 152, 78, 100, { trazo: GRIS, grosor: 1.4 }) + circulo(146, 146, 5, { relleno: GRIS, grosor: 1.4 }) + linea(20, 272, 200, 272, { grosor: 2 }) + cota([262, 20], [262, 272], e),
        `La puerta del aula con su alto marcado: ${e}`,
      ),
  },
  {
    cosa: 'la planta de maíz',
    min: 120,
    max: 195,
    dibujo: (e) =>
      svg(
        360,
        292,
        linea(30, 272, 200, 272, { grosor: 2 }) +
          ruta('M110,272 L110,30', { trazo: '#5b7a4a', grosor: 4 }) +
          ruta('M110,230 Q60,200 40,214 M110,190 Q160,160 182,172 M110,150 Q60,120 44,132 M110,110 Q156,84 176,94', { trazo: '#5b7a4a', grosor: 3 }) +
          elipse(124, 140, 9, 24, { relleno: '#f1df9a', grosor: 1.6 }) +
          ruta('M110,30 L98,46 M110,30 L122,46 M110,30 L110,50', { trazo: '#5b7a4a', grosor: 2 }) +
          cota([262, 30], [262, 272], e),
        `Una planta de maíz con su alto marcado: ${e}`,
      ),
  },
  {
    cosa: 'la pizarra del aula',
    min: 200,
    max: 420,
    dibujo: (e) => svg(400, 252, rect(30, 24, 340, 150, { relleno: '#dfe9df', grosor: 3 }) + rect(40, 34, 320, 130, { trazo: GRIS, grosor: 1.4 }) + rect(110, 174, 180, 10, { relleno: CLARO, grosor: 1.6 }) + cota([30, 222], [370, 222], e), `La pizarra del aula con su largo marcado: ${e}`),
  },
  {
    cosa: 'la soga para saltar',
    min: 150,
    max: 380,
    dibujo: (e) => svg(400, 170, rect(26, 64, 32, 18, { relleno: GRIS, grosor: 1.6, redondeo: 5 }) + rect(342, 64, 32, 18, { relleno: GRIS, grosor: 1.6, redondeo: 5 }) + linea(58, 73, 342, 73, { trazo: '#8a6b45', grosor: 6 }) + cota([26, 130], [374, 130], e), `Una soga para saltar con su largo marcado: ${e}`),
  },
  {
    cosa: 'la mesa del profesor',
    min: 110,
    max: 185,
    dibujo: (e) => svg(400, 224, rect(40, 74, 320, 20, { relleno: ARENA, grosor: 2.6, redondeo: 3 }) + rect(54, 94, 16, 112, { relleno: ARENA, grosor: 2.2 }) + rect(330, 94, 16, 112, { relleno: ARENA, grosor: 2.2 }) + linea(20, 206, 380, 206, { grosor: 2 }) + cota([40, 34], [360, 34], e), `La mesa del profesor con su largo marcado: ${e}`),
  },
]

const mYcm = (n: number) => (n % 100 === 0 ? `${n / 100} m` : n < 100 ? `${n} cm` : `${Math.floor(n / 100)} m y ${n % 100} cm`)

export const convertirLongitud: TipoPregunta = {
  id: 'fo-convertir-longitud',
  nombre: 'Metros y centímetros',
  queHacen: 'Convierten medidas de objetos del aula y de la chacra de metros y centímetros a centímetros, y al revés (1 m = 100 cm).',
  citas: { [P4]: 'y hace conversiones de unidades de longitud' },
  ...BASE,
  generar({ azar }) {
    const quien = nombre(azar)
    const modo = azar()
    if (modo < 0.75) {
      const o = elegir(azar, MEDIBLES)
      const N = hasta(() => {
        const x = entero(azar, o.min, o.max)
        return x % 100 !== 0 && (x % 100 >= 10 || azar() < 0.3) ? x : null
      })
      const M = Math.floor(N / 100)
      const C = N % 100
      if (modo < 0.45) {
        return opciones(
          `a-cm:${o.cosa}:${N}`,
          `${quien} midió ${o.cosa} con una cinta métrica.`,
          o.dibujo(`${M} m y ${C} cm`),
          '¿Cuántos centímetros mide?',
          conUnidad(altNum(azar, N, [10 * M + C, M + C, 100 * M, 1000 * M + C, N + 10, N - 10], 4, 1), 'cm'),
          [`Mide ${num(M)} m y ${num(C)} cm; 1 m = 100 cm`, `${num(M)} m = ${num(M)} × 100 = ${num(100 * M)} cm`, `${num(100 * M)} cm + ${num(C)} cm = ${num(N)} cm`],
          `1 m = 100 cm. Entonces ${M} m = ${100 * M} cm, y ${100 * M} + ${C} = ${N}.`,
        )
      }
      const malas = [`${Math.floor(N / 10)} m y ${N % 10} cm`, `${N} m`, C >= 10 ? `${M} m y ${Math.floor(C / 10)} cm` : `${M} m y ${C * 10} cm`, `${M + 1} m y ${C} cm`, `${M} m y ${100 - C} cm`]
      return opciones(
        `a-m:${o.cosa}:${N}`,
        `${quien} midió ${o.cosa} con una cinta métrica.`,
        o.dibujo(`${N} cm`),
        '¿Cuánto mide en metros y centímetros?',
        alternativas(azar, `${M} m y ${C} cm`, malas, 4),
        [`Mide ${num(N)} cm; 100 cm = 1 m`, `${num(N)} cm = ${num(100 * M)} cm + ${num(C)} cm`, `${num(100 * M)} cm = ${num(M)} m: ${M} m y ${C} cm`],
        `100 cm = 1 m. En ${N} cm hay ${M === 1 ? '1 vez' : `${M} veces`} 100 cm y sobran ${C} cm.`,
      )
    }
    // Compró M metros de cinta y usó C centímetros: ¿cuánto le queda?
    const M = entero(azar, 2, 5)
    const C = hasta(() => {
      const x = entero(azar, 5, 20 * M - 5) * 5
      return x % 100 ? x : null
    })
    const queda = 100 * M - C
    const L = 480
    const usado = (L * C) / (100 * M)
    const cuerpo =
      cota([30, 30], [30 + L, 30], `${M} m`) +
      rect(30, 62, L, 34, { relleno: LILA, grosor: 2.2 }) +
      rect(30, 62, usado, 34, { relleno: PINTA, grosor: 2.2 }) +
      texto(30 + usado / 2, 79, 'usó', { tam: 14, peso: 700 }) +
      linea(30 + usado, 52, 30 + usado, 106, { grosor: 2, punteado: true }) +
      cota([30, 132], [30 + usado, 132], `${C} cm`)
    return opciones(
      `cinta:${M}:${C}`,
      `${quien} compró ${M} m de cinta para adornar el aula. Usó ${C} cm para hacer moños.`,
      svg(L + 60, 156, cuerpo, `Una cinta de ${M} m de la que se usaron ${C} cm`),
      '¿Cuántos centímetros de cinta le quedan?',
      conUnidad(altNum(azar, queda, [100 * M + C, C, queda + 10, queda - 10, 100 * (M - 1) - C, queda + 100], 4, 1), 'cm'),
      [`Se pasa todo a cm: ${num(M)} m = ${num(M)} × 100 = ${num(100 * M)} cm`, `Le quedan: ${num(100 * M)} − ${num(C)} = ${num(queda)} cm`],
      `${M} m = ${100 * M} cm, y ${100 * M} − ${C} = ${queda}.`,
    )
  },
}

/** Una planta dibujada de `alto` px sobre el piso, centrada en x. */
function planta(tipo: 'maiz' | 'girasol', x: number, piso: number, alto: number) {
  const tope = piso - alto
  const verde = { trazo: '#5b7a4a', grosor: 3 }
  if (tipo === 'maiz') {
    const hojas = rango(Math.max(2, Math.floor(alto / 45)))
      .map((i) => {
        const y = piso - 30 - i * 40
        const s = i % 2 ? 1 : -1
        return `M${x},${y} Q${x + s * 40},${y - 30} ${x + s * 58},${y - 18}`
      })
      .join(' ')
    return ruta(`M${x},${piso} L${x},${tope}`, { trazo: '#5b7a4a', grosor: 4 }) + ruta(hojas, verde) + elipse(x + 12, tope + alto * 0.45, 8, 20, { relleno: '#f1df9a', grosor: 1.6 }) + ruta(`M${x},${tope} L${x - 10},${tope + 14} M${x},${tope} L${x + 10},${tope + 14}`, { trazo: '#5b7a4a', grosor: 2 })
  }
  const petalos = rango(12)
    .map((i) => {
      const a = (i * Math.PI) / 6
      return elipse(x + 22 * Math.cos(a), tope + 22 + 22 * Math.sin(a), 9, 9, { relleno: '#f3dc8a', grosor: 1.4 })
    })
    .join('')
  const hojas = `M${x},${piso - alto * 0.35} Q${x - 34},${piso - alto * 0.45} ${x - 44},${piso - alto * 0.3} M${x},${piso - alto * 0.55} Q${x + 34},${piso - alto * 0.65} ${x + 44},${piso - alto * 0.5}`
  return ruta(`M${x},${piso} L${x},${tope + 30}`, { trazo: '#5b7a4a', grosor: 4 }) + ruta(hojas, verde) + petalos + circulo(x, tope + 22, 13, { relleno: '#8a6b45', grosor: 1.6 })
}

export const compararLongitudes: TipoPregunta = {
  id: 'fo-comparar-longitudes',
  nombre: '¿Quién llegó más lejos?',
  queHacen: 'Comparan y restan medidas escritas en metros y centímetros o solo en centímetros, convirtiéndolas primero a la misma unidad.',
  citas: { [P4]: 'y hace conversiones de unidades de longitud' },
  ...BASE,
  generar({ azar }) {
    if (azar() < 0.55) {
      // Salto largo: unas marcas en "m y cm" y otras en "cm".
      const nombres = barajar(azar, ['Daniel', 'Lucía', 'Mateo', 'Valeria', 'Yaku', 'Killa', 'Inti', 'Rosa', 'Kevin', 'Ximena', 'Piero', 'Camila']).slice(0, 3)
      const [valores, formatos] = hasta((): [number[], boolean[]] | null => {
        const v = rango(3).map(() => entero(azar, 92, 196))
        if (new Set(v).size < 3 || Math.max(...v) - Math.min(...v) < 8) return null
        const f = v.map((x) => x >= 105 && azar() < 0.55)
        // Al menos una marca en "m y cm" y otra solo en "cm"; y la mayor no siempre en "m y cm".
        return f.some(Boolean) && f.some((x) => !x) ? [v, f] : null
      })
      const marca = (i: number) => (formatos[i] ? `1 m y ${valores[i] - 100} cm` : `${valores[i]} cm`)
      const H = 58 + 3 * 42
      const filas = rango(3)
        .map((i) => linea(20, 58 + i * 42, 380, 58 + i * 42, { trazo: GRIS, grosor: 1.4 }) + texto(36, 79 + i * 42, nombres[i], { tam: 16, peso: 700, ancla: 'start' }) + texto(364, 79 + i * 42, marca(i), { tam: 16, peso: 700, ancla: 'end' }))
        .join('')
      const dibujo = svg(400, H + 14, rect(10, 8, 380, H, { relleno: '#ffffff', grosor: 2.6, redondeo: 8 }) + texto(200, 33, 'Salto largo', { tam: 18, peso: 700 }) + filas, `Tabla de salto largo: ${rango(3).map((i) => `${nombres[i]} ${marca(i)}`).join(', ')}`)
      const mas = azar() < 0.65
      const busca = mas ? Math.max(...valores) : Math.min(...valores)
      const i = valores.indexOf(busca)
      return opciones(
        `salto:${mas}:${valores.join('-')}:${formatos.map(Number).join('')}`,
        'En Educación Física, tres estudiantes hicieron salto largo. Estas son sus marcas.',
        dibujo,
        mas ? '¿Quién saltó más lejos?' : '¿Quién saltó menos?',
        alternativas(azar, nombres[i], nombres.filter((_, k) => k !== i), 3),
        [
          `1 m = 100 cm: ${rango(3)
            .filter((k) => formatos[k])
            .map((k) => `${marca(k)} = ${num(valores[k])} cm`)
            .join('; ')}`,
          `Todo en cm: ${lista(rango(3).map((k) => `${nombres[k]} ${num(valores[k])}`))}`,
          `${mas ? 'Saltó más lejos' : 'Saltó menos'} (${num(busca)} cm): ${nombres[i]}`,
        ],
        `En centímetros: ${rango(3).map((k) => `${nombres[k]} ${valores[k]} cm`).join(', ')}.`,
      )
    }
    // ¿Cuántos centímetros más alta es una planta que la otra?
    const alta = entero(azar, 118, 190)
    const baja = entero(azar, 55, 98)
    if (alta % 100 === 0) return null
    const d = alta - baja
    const [ta, tb] = azar() < 0.5 ? (['maiz', 'girasol'] as const) : (['girasol', 'maiz'] as const)
    const nombreDe = { maiz: 'el maíz', girasol: 'el girasol' }
    const piso = 286
    const k = 220 / 190
    const etiqueta = (x: number, alto: number, t: string) => {
      const tw = anchoTexto(t, 15) + 16
      return rect(x - tw / 2, piso - alto - 38, tw, 26, { relleno: '#ffffff', grosor: 1.6, redondeo: 6 }) + texto(x, piso - alto - 25, t, { tam: 15, peso: 700 })
    }
    const cuerpo = linea(20, piso, 380, piso, { grosor: 2 }) + planta(ta, 120, piso, alta * k) + planta(tb, 280, piso, baja * k) + etiqueta(120, alta * k, mYcm(alta)) + etiqueta(280, baja * k, `${baja} cm`)
    const quien = nombre(azar)
    return opciones(
      `plantas:${ta}:${alta}:${baja}`,
      `${quien} midió dos plantas del biohuerto: ${nombreDe[ta]} y ${nombreDe[tb]}.`,
      svg(400, piso + 8, cuerpo, `${mayus(nombreDe[ta])} mide ${mYcm(alta)} y ${nombreDe[tb]} mide ${baja} cm`),
      `¿Cuántos centímetros más alto es ${nombreDe[ta]} que ${nombreDe[tb]}?`,
      conUnidad(altNum(azar, d, [Math.abs(baja - (alta % 100)), alta + baja, 100 - baja, d + 10, d - 10], 4, 1), 'cm'),
      [`${mayus(nombreDe[ta])}: ${mYcm(alta)} = ${num(alta - (alta % 100))} + ${num(alta % 100)} = ${num(alta)} cm`, `Diferencia: ${num(alta)} − ${num(baja)} = ${num(d)} cm`],
      `${mYcm(alta)} = ${alta} cm, y ${alta} − ${baja} = ${d}.`,
    )
  },
}

// ---------- Traslación ----------

/** Intenta varias veces; null si no sale (el examen prueba otra semilla). */
function intentar<T>(veces: number, f: () => T | null): T | null {
  for (let i = 0; i < veces; i++) {
    const r = f()
    if (r !== null) return r
  }
  return null
}

/** Figuras con vértices en la cuadrícula para trasladar. */
const FIGURAS_TRASLADO: Pt[][] = [
  [
    [0, 1],
    [1, 0],
    [2, 1],
    [2, 3],
    [0, 3],
  ],
  [
    [0, 1],
    [2, 1],
    [2, 0],
    [4, 2],
    [2, 4],
    [2, 3],
    [0, 3],
  ],
  [
    [0, 0],
    [3, 1],
    [1, 2],
    [1, 4],
    [0, 4],
  ],
  [
    [0, 0],
    [0, 3],
    [3, 3],
  ],
  [
    [1, 0],
    [3, 0],
    [4, 2],
    [0, 2],
  ],
  [
    [0, 0],
    [1, 0],
    [1, 2],
    [3, 2],
    [3, 3],
    [0, 3],
  ],
]

const anchoAlto = (f: Pt[]) => [Math.max(...f.map((p) => p[0])), Math.max(...f.map((p) => p[1]))]
const firmaPuntos = (f: Pt[]) => {
  const mx = Math.min(...f.map((p) => p[0]))
  const my = Math.min(...f.map((p) => p[1]))
  return f
    .map(([x, y]) => kc(x - mx, y - my))
    .sort()
    .join(' ')
}

/** "3 cuadros a la derecha y 2 cuadros hacia abajo". */
function movimiento(dx: number, dy: number, una = 'cuadro', varias = 'cuadros') {
  const partes: string[] = []
  if (dx) partes.push(`${plural(Math.abs(dx), una, varias)} a la ${dx > 0 ? 'derecha' : 'izquierda'}`)
  if (dy) partes.push(`${plural(Math.abs(dy), una, varias)} hacia ${dy > 0 ? 'abajo' : 'arriba'}`)
  return partes.join(' y ')
}

/** Letra en un circulito blanco, para nombrar figuras sobre la cuadrícula. */
const rotulo = (x: number, y: number, t: string) => circulo(x, y, 12, { relleno: '#ffffff', grosor: 1.8 }) + texto(x, y + 0.5, t, { tam: 15, peso: 700 })

/** La figura en la cuadrícula: f en coordenadas de la cuadrícula, desplazada a (cx, cy). */
const figuraEn = (f: Pt[], cx: number, cy: number, x0: number, y0: number, L: number, relleno: string) => poligono(f.map(([x, y]): Pt => [x0 + (x + cx) * L, y0 + (y + cy) * L]), { relleno, grosor: 2.8 })

/** El vértice de más arriba a la izquierda (el punto P). */
const puntoP = (f: Pt[]) => f.reduce((m, p) => (p[0] + p[1] < m[0] + m[1] ? p : m), f[0])

export const traslacion: TipoPregunta = {
  id: 'fo-traslacion',
  nombre: '¿Cuántos cuadros se movió?',
  queHacen: 'Cuentan cuántos cuadros y hacia dónde se trasladó una figura en la cuadrícula, o la dibujan trasladada.',
  citas: { [P4]: 'el uso de las cuadrículas, para construir formas simétricas, ubicar objetos y trasladar figuras' },
  ...BASE,
  generar({ azar }) {
    const COLS = 15
    const FILAS = 9
    const L = 26
    const x0 = 24
    const y0 = 24
    const caso = intentar(40, () => {
      const f = transformar(azar, elegir(azar, FIGURAS_TRASLADO))
      const [w, h] = anchoAlto(f)
      const tipo = azar()
      const dx = tipo < 0.85 ? elegir(azar, [1, -1]) * entero(azar, 2, 8) : 0
      const dy = tipo < 0.3 ? 0 : elegir(azar, [1, -1]) * entero(azar, tipo >= 0.85 ? 3 : 1, 4)
      const ax = entero(azar, 0, COLS - w)
      const ay = entero(azar, 0, FILAS - h)
      const [bx, by] = [ax + dx, ay + dy]
      if (bx < 0 || by < 0 || bx + w > COLS || by + h > FILAS) return null
      if (Math.abs(dx) <= w && Math.abs(dy) <= h) return null
      return { f, w, h, dx, dy, ax, ay, bx, by }
    })
    if (!caso) return null
    const { f, w, h, dx, dy, ax, ay, bx, by } = caso
    const P = puntoP(f)
    const ponP = (cx: number, cy: number, t: string) => {
      const [px, py] = [x0 + (P[0] + cx) * L, y0 + (P[1] + cy) * L]
      return circulo(px, py, 4.5, { relleno: TINTA, trazo: 'none' }) + texto(px - 9, py - 11, t, { tam: 15, peso: 700, ancla: 'end' })
    }
    const W = COLS * L + 2 * x0
    const H = FILAS * L + 2 * y0
    const rotA = rotulo(x0 + (ax + w) * L - 2, y0 + (ay + h) * L - 2, 'A')
    if (azar() < 0.72) {
      const cuerpo = rejilla(x0, y0, COLS, FILAS, L) + figuraEn(f, ax, ay, x0, y0, L, PINTA) + figuraEn(f, bx, by, x0, y0, L, SUAVE) + ponP(ax, ay, 'P') + ponP(bx, by, "P'") + rotA + rotulo(x0 + (bx + w) * L - 2, y0 + (by + h) * L - 2, 'B')
      const correcta = movimiento(dx, dy)
      const sx = signo(dx)
      const sy = signo(dy)
      const malas = [
        dx && dy && Math.abs(dx) !== Math.abs(dy) ? movimiento(sx * Math.abs(dy), sy * Math.abs(dx)) : '',
        Math.abs(dx) > w ? movimiento(dx - sx * w, dy) : '',
        movimiento(-dx, -dy),
        dx ? movimiento(dx + sx, dy) : movimiento(dx, dy + sy),
        dx && dy ? movimiento(dx, -dy) : movimiento(dy, dx),
        Math.abs(dy) > h ? movimiento(dx, dy - sy * h) : '',
      ].filter(Boolean)
      // El error más común: contar los cuadros que quedan entre las dos figuras (cuando están una al lado de la otra).
      const hueco = dy === 0 && Math.abs(dx) > w ? Math.abs(dx) - w : dx === 0 && Math.abs(dy) > h ? Math.abs(dy) - h : 0
      return opciones(
        `traslada:${firmaPuntos(f)}:${ax},${ay}:${dx},${dy}`,
        'La figura A se trasladó hasta el lugar de la figura B. El punto P llegó a P\'.',
        svg(W, H, cuerpo, `Cuadrícula con la figura A y la figura B, que está ${correcta}`),
        '¿Cuántos cuadros se movió y hacia dónde?',
        alternativas(azar, correcta, malas, 4),
        [
          "Se cuentan los cuadros desde el punto P hasta P', a lo ancho y a lo alto",
          ...(hueco ? [`Entre las dos figuras hay ${plural(hueco, 'cuadro', 'cuadros')}, pero eso no es lo que se movió`] : []),
          `Se movió ${correcta}`,
        ],
        'Se cuenta desde P hasta P\'. No se cuentan los cuadros que hay entre las dos figuras.',
      )
    }
    const cuerpo = rejilla(x0, y0, COLS, FILAS, L) + figuraEn(f, ax, ay, x0, y0, L, PINTA) + ponP(ax, ay, 'P') + rotA
    return {
      forma: 'abierta',
      clave: `traslada-dibuja:${firmaPuntos(f)}:${ax},${ay}:${dx},${dy}`,
      enunciado: `Traslada la figura A: ${movimiento(dx, dy)}. Dibújala en la cuadrícula.`,
      dibujo: svg(W, H, cuerpo, 'Cuadrícula con la figura A y su punto P'),
      respuesta: `La misma figura, del mismo tamaño y sin girarla, con su punto P ${movimiento(dx, dy)} de donde estaba.`,
      espacio: 'dibujo',
      pasos: [
        `Desde P se cuentan ${movimiento(dx, dy)}: ahí va P'`,
        'Cada vértice se mueve igual que P y se unen con líneas rectas',
        `Queda la misma figura, sin girar, ${movimiento(dx, dy)}`,
      ],
    }
  },
}

export const traslacionCual: TipoPregunta = {
  id: 'fo-traslacion-cual',
  nombre: '¿Cuál es la figura trasladada?',
  queHacen: 'Distinguen la traslación (mover sin girar ni voltear) de una figura girada o volteada, y ubican dónde queda una figura trasladada.',
  citas: { [P4]: 'así como la traslación de los objetos o figuras' },
  ...BASE,
  generar({ azar }) {
    const L = 24
    // Margen para que las letras de las esquinas no se corten.
    const x0 = 16
    const y0 = 16
    if (azar() < 0.55) {
      // El modelo y tres figuras: una trasladada, una volteada y una girada.
      const COLS = 20
      const FILAS = 6
      const caso = intentar(30, () => {
        const f = transformar(azar, elegir(azar, FIGURAS_TRASLADO))
        const firma = firmaPuntos(f)
        const espejo = (g: Pt[]) => g.map(([x, y]): Pt => [-x, y])
        const giro = (g: Pt[]) => g.map(([x, y]): Pt => [-y, x])
        // Cada figura mala con lo que se le hizo (para los pasos de la clave).
        const opcionesMalas = (
          [
            [espejo(f), 'volteada, como en un espejo'],
            [f.map(([x, y]): Pt => [x, -y]), 'volteada de arriba abajo'],
            [giro(f), 'girada'],
            [giro(giro(f)), 'girada'],
            [giro(giro(giro(f))), 'girada'],
          ] as const
        )
          .map(([g, como]) => ({ g: transformarA0(g), como }))
          .filter((m) => firmaPuntos(m.g) !== firma)
        const distintas = barajar(azar, opcionesMalas)
        const m1 = distintas[0]
        const m2 = distintas.find((m) => firmaPuntos(m.g) !== firmaPuntos(m1.g))
        if (!m1 || !m2) return null
        return { f, malas: [m1, m2] }
      })
      if (!caso) return null
      const piezas = [caso.f, ...caso.malas.map((m) => m.g)]
      const orden = barajar(azar, [0, 1, 2])
      const partes = [rejilla(x0, y0 + 24, COLS, FILAS, L)]
      const colocar = (g: Pt[], slot: number, relleno: string, t: string) => {
        const [w, h] = anchoAlto(g)
        const cx = slot * 5 + entero(azar, 0, 4 - w)
        const cy = entero(azar, 0, FILAS - h)
        partes.push(figuraEn(g, cx, cy, x0, y0 + 24, L, relleno), texto(x0 + (slot * 5 + 2) * L, y0 + 11, t, { tam: 15, peso: 700 }))
      }
      colocar(caso.f, 0, PINTA, 'Modelo')
      orden.forEach((i, k) => colocar(piezas[i], k + 1, SUAVE, LETRAS[k]))
      for (let s = 1; s < 4; s++) partes.push(linea(x0 + s * 5 * L - L / 2, y0 + 24, x0 + s * 5 * L - L / 2, y0 + 24 + FILAS * L, { trazo: GRIS, grosor: 1.4, punteado: true }))
      return opciones(
        `cual-traslada:${piezas.map(firmaPuntos).join('|')}:${orden.join('')}`,
        'Trasladar una figura es moverla sin girarla ni voltearla.',
        svg(COLS * L + 2 * x0, FILAS * L + 2 * y0 + 24, partes.join(''), 'El modelo y tres figuras A, B y C: una trasladada, una volteada y una girada'),
        '¿Cuál figura es el modelo trasladado?',
        cual('Figura', 3, orden.indexOf(0)),
        [
          ...[1, 2].sort((p, q) => orden.indexOf(p) - orden.indexOf(q)).map((i) => `Figura ${LETRAS[orden.indexOf(i)]}: está ${caso.malas[i - 1].como}`),
          `Igual al modelo, sin girar ni voltear, solo cambió de lugar: Figura ${LETRAS[orden.indexOf(0)]}`,
        ],
      )
    }
    // ¿En qué lugar quedó? Tres copias en distintos lugares.
    const COLS = 16
    const FILAS = 9
    const caso = intentar(300, () => {
      const f = transformar(azar, elegir(azar, FIGURAS_TRASLADO))
      const [w, h] = anchoAlto(f)
      const dx = elegir(azar, [1, -1]) * entero(azar, 3, 8)
      const dy = elegir(azar, [1, -1]) * entero(azar, 1, 4)
      if (Math.abs(dx) === Math.abs(dy)) return null
      const ax = entero(azar, 0, COLS - w)
      const ay = entero(azar, 0, FILAS - h)
      const malas: [number, number][] = barajar(azar, [
        [signo(dx) * Math.abs(dy), signo(dy) * Math.abs(dx)],
        [dx, -dy],
        [-dx, dy],
        [dx + signo(dx), dy],
      ])
      const lugares: [number, number][] = []
      // Cada copia en su sitio: sin tocar al modelo ni a las otras copias.
      const libre = (cx: number, cy: number) => cx >= 0 && cy >= 0 && cx + w <= COLS && cy + h <= FILAS && [[0, 0] as [number, number], ...lugares].every(([ex, ey]) => Math.abs(ax + ex - cx) > w || Math.abs(ay + ey - cy) > h)
      if (!libre(ax + dx, ay + dy)) return null
      lugares.push([dx, dy])
      for (const m of malas) if (lugares.length < 3 && libre(ax + m[0], ay + m[1])) lugares.push(m)
      return lugares.length === 3 ? { f, w, h, ax, ay, dx, dy, lugares } : null
    })
    if (!caso) return null
    const { f, w, h, ax, ay, dx, dy, lugares } = caso
    const orden = barajar(azar, [0, 1, 2])
    const partes = [rejilla(x0, y0, COLS, FILAS, L), figuraEn(f, ax, ay, x0, y0, L, PINTA)]
    orden.forEach((i, k) => {
      const [ex, ey] = lugares[i]
      partes.push(figuraEn(f, ax + ex, ay + ey, x0, y0, L, SUAVE), rotulo(x0 + (ax + ex + w) * L - 2, y0 + (ay + ey + h) * L - 2, LETRAS[k]))
    })
    return opciones(
      `donde-traslada:${firmaPuntos(f)}:${ax},${ay}:${lugares.map((l) => l.join(',')).join('|')}:${orden.join('')}`,
      `La figura gris oscuro se trasladó ${movimiento(dx, dy)}.`,
      svg(COLS * L + 2 * x0, FILAS * L + 2 * y0, partes.join(''), 'Una figura gris oscuro y tres copias A, B y C en distintos lugares de la cuadrícula'),
      '¿En qué lugar quedó?',
      cual('Figura', 3, orden.indexOf(0)),
      ['Se elige un vértice de la figura gris oscuro y desde ahí se cuentan los cuadros', `${mayus(movimiento(dx, dy))}: llega a la Figura ${LETRAS[orden.indexOf(0)]}`],
    )
  },
}

/** Deja una figura tocando los bordes de arriba y de la izquierda. */
function transformarA0(g: Pt[]): Pt[] {
  const mx = Math.min(...g.map((p) => p[0]))
  const my = Math.min(...g.map((p) => p[1]))
  return g.map(([x, y]): Pt => [x - mx + 0, y - my + 0])
}

// ---------- Croquis del barrio ----------

const LUGARES = [
  { nombre: 'Colegio', el: 'el colegio' },
  { nombre: 'Bodega', el: 'la bodega' },
  { nombre: 'Posta', el: 'la posta' },
  { nombre: 'Parque', el: 'el parque' },
  { nombre: 'Iglesia', el: 'la iglesia' },
  { nombre: 'Mercado', el: 'el mercado' },
  { nombre: 'Losa', el: 'la losa deportiva' },
  { nombre: 'Comisaría', el: 'la comisaría' },
  { nombre: 'Panadería', el: 'la panadería' },
  { nombre: 'Plaza', el: 'la plaza' },
]
type Lugar = (typeof LUGARES)[number] & { en: Celda }

const CROQ = { cols: 6, filas: 5, sx: 88, sy: 62, mx: 44, my: 48 }
const esquina = ([i, j]: Celda): Pt => [CROQ.mx + i * CROQ.sx, CROQ.my + j * CROQ.sy]
const dentroCroquis = ([i, j]: Celda) => i >= 0 && j >= 0 && i < CROQ.cols && j < CROQ.filas

/** Croquis de manzanas con lugares en las esquinas, la casa y, si hay, el camino recorrido. */
function dibujoCroquis(lugares: Lugar[], casa: Celda, camino: Celda[] | null, alt: string): Dibujo {
  const W = 2 * CROQ.mx + (CROQ.cols - 1) * CROQ.sx
  const H = CROQ.my + (CROQ.filas - 1) * CROQ.sy + 30
  const partes: string[] = [rect(0, 0, W, H, { relleno: '#ffffff', trazo: 'none' })]
  for (let i = -1; i < CROQ.cols; i++)
    for (let j = -1; j < CROQ.filas; j++) {
      const [x, y] = esquina([i, j])
      partes.push(rect(x + 11, y + 11, CROQ.sx - 22, CROQ.sy - 22, { relleno: '#ececec', trazo: GRIS, grosor: 1.4, redondeo: 5 }))
    }
  if (camino) {
    const pts = camino.map(esquina)
    partes.push(el('polyline', { points: pts.map((p) => p.join(',')).join(' '), fill: 'none', stroke: TINTA, 'stroke-width': 4, 'stroke-dasharray': '10 7', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }))
    const [a, b] = [pts[pts.length - 2], pts[pts.length - 1]]
    const d = dist(a, b)
    partes.push(puntaDeFlecha(a, [b[0] - ((b[0] - a[0]) / d) * 10, b[1] - ((b[1] - a[1]) / d) * 10], 16, 8))
  }
  const etiqueta = (p: Pt, t: string) => {
    const tw = anchoTexto(t, 13) + 12
    return rect(p[0] - tw / 2, p[1] - 36, tw, 21, { relleno: '#ffffff', grosor: 1.4, redondeo: 5 }) + texto(p[0], p[1] - 25.5, t, { tam: 13, peso: 700 })
  }
  const [cx, cy] = esquina(casa)
  partes.push(
    poligono(
      [
        [cx - 10, cy + 8],
        [cx + 10, cy + 8],
        [cx + 10, cy - 3],
        [cx, cy - 12],
        [cx - 10, cy - 3],
      ],
      { relleno: PINTA, grosor: 1.8 },
    ),
    etiqueta([cx, cy - 2], 'Casa'),
  )
  for (const l of lugares) {
    const p = esquina(l.en)
    partes.push(circulo(p[0], p[1], 7, { relleno: TINTA, trazo: '#ffffff', grosor: 1.6 }), etiqueta(p, l.nombre))
  }
  return svg(W, H, partes.join(''), alt)
}

const igualC = (a: Celda, b: Celda) => a[0] === b[0] && a[1] === b[1]

export const croquisLlegar: TipoPregunta = {
  id: 'fo-croquis-llegar',
  nombre: '¿A dónde llegas?',
  queHacen: 'Siguen indicaciones en el croquis del barrio (cuadras a la derecha, a la izquierda, hacia arriba o hacia abajo) o eligen las que llevan a un lugar.',
  citas: { [P4]: 'Expresa con gráficos o croquis los desplazamientos y posiciones de objetos, personas y lugares cercanos' },
  ...BASE,
  generar({ azar }) {
    const quien = nombre(azar)
    const caso = intentar(60, () => {
      const casa: Celda = [entero(azar, 0, CROQ.cols - 1), entero(azar, 0, CROQ.filas - 1)]
      const dx = elegir(azar, [1, -1]) * entero(azar, 1, 4)
      const dy = elegir(azar, [1, -1]) * entero(azar, 1, 3)
      const meta: Celda = [casa[0] + dx, casa[1] + dy]
      if (!dentroCroquis(meta)) return null
      const sx = signo(dx)
      const sy = signo(dy)
      const errores: Celda[] = [
        [casa[0] + sx * Math.abs(dy), casa[1] + sy * Math.abs(dx)],
        [casa[0] - dx, casa[1] + dy],
        [casa[0] + dx, casa[1] - dy],
        [casa[0] + dx + sx, casa[1] + dy],
        [casa[0] + dx, casa[1] + dy + sy],
        [casa[0] + dx - sx, casa[1] + dy],
      ]
      const usadas: Celda[] = [casa, meta]
      const malas: Celda[] = []
      for (const e of errores) if (malas.length < 3 && dentroCroquis(e) && !usadas.some((u) => igualC(u, e))) malas.push(e), usadas.push(e)
      if (malas.length < 2) return null
      // Uno o dos lugares más, lejos de los otros, para que el croquis tenga vida.
      for (let i = 0; i < 30 && usadas.length < malas.length + 4; i++) {
        const c: Celda = [entero(azar, 0, CROQ.cols - 1), entero(azar, 0, CROQ.filas - 1)]
        if (!usadas.some((u) => Math.abs(u[0] - c[0]) + Math.abs(u[1] - c[1]) < 2)) usadas.push(c)
      }
      return { casa, dx, dy, meta, malas, extra: usadas.slice(2 + malas.length) }
    })
    if (!caso) return null
    const nombres = barajar(azar, LUGARES)
    const lugarMeta: Lugar = { ...nombres[0], en: caso.meta }
    const lugaresMalos: Lugar[] = caso.malas.map((c, i) => ({ ...nombres[i + 1], en: c }))
    const extras: Lugar[] = caso.extra.map((c, i) => ({ ...nombres[i + 1 + caso.malas.length], en: c }))
    const todos = [lugarMeta, ...lugaresMalos, ...extras]
    const dibujo = dibujoCroquis(todos, caso.casa, null, `Croquis del barrio con la casa y ${todos.map((l) => l.nombre).join(', ')}`)
    const clave = `croquis:${kc(...caso.casa)}:${caso.dx},${caso.dy}:${todos.map((l) => `${l.nombre}@${kc(...l.en)}`).join('|')}`
    if (azar() < 0.6) {
      return opciones(
        clave,
        `Observa el croquis del barrio. ${quien} sale de su casa, camina ${plural(Math.abs(caso.dx), 'cuadra', 'cuadras')} a la ${caso.dx > 0 ? 'derecha' : 'izquierda'} y luego ${plural(Math.abs(caso.dy), 'cuadra', 'cuadras')} hacia ${caso.dy > 0 ? 'abajo' : 'arriba'}.`,
        dibujo,
        '¿A qué lugar llega?',
        alternativas(azar, mayus(lugarMeta.el), lugaresMalos.map((l) => mayus(l.el)), 4),
        [`Desde la casa, ${movimiento(caso.dx, 0, 'cuadra', 'cuadras')}`, `Desde esa esquina, ${movimiento(0, caso.dy, 'cuadra', 'cuadras')}`, `Lugar al que llega: ${mayus(lugarMeta.el)}`],
      )
    }
    const correcta = mayus(movimiento(caso.dx, caso.dy, 'cuadra', 'cuadras'))
    const { dx, dy } = caso
    const malas = [
      Math.abs(dx) !== Math.abs(dy) ? movimiento(signo(dx) * Math.abs(dy), signo(dy) * Math.abs(dx), 'cuadra', 'cuadras') : '',
      movimiento(-dx, dy, 'cuadra', 'cuadras'),
      movimiento(dx, -dy, 'cuadra', 'cuadras'),
      movimiento(dx + signo(dx), dy, 'cuadra', 'cuadras'),
      movimiento(-dx, -dy, 'cuadra', 'cuadras'),
    ]
      .filter(Boolean)
      .map(mayus)
    return opciones(
      `${clave}:indica`,
      `Observa el croquis del barrio. ${quien} quiere ir de su casa a ${lugarMeta.el}.`,
      dibujo,
      '¿Qué indicaciones lo llevan hasta allí?',
      alternativas(azar, correcta, malas, 4),
      [
        `Se cuentan las cuadras de la casa a ${lugarMeta.el}, primero a los costados`,
        `A los costados: ${movimiento(dx, 0, 'cuadra', 'cuadras')}; luego, ${movimiento(0, dy, 'cuadra', 'cuadras')}`,
        `Indicaciones: ${correcta}`,
      ],
      'También vale caminar primero hacia arriba o hacia abajo y luego a los costados.',
    )
  },
}

export const croquisRecorrido: TipoPregunta = {
  id: 'fo-croquis-recorrido',
  nombre: 'Lee el recorrido',
  queHacen: 'Leen en el croquis el camino que hizo una persona: cuántas cuadras caminó, por dónde pasó y cómo se describe.',
  citas: { [P4]: 'Establece relaciones entre los datos de ubicación y recorrido de los objetos, personas y lugares cercanos' },
  ...BASE,
  generar({ azar }) {
    const quien = nombre(azar)
    const caso = intentar(80, () => {
      const casa: Celda = [entero(azar, 0, CROQ.cols - 1), entero(azar, 0, CROQ.filas - 1)]
      const tramos: [number, number][] = []
      const n = entero(azar, 2, 3)
      let horizontal = azar() < 0.5
      for (let i = 0; i < n; i++) {
        const k = entero(azar, 1, 3) * elegir(azar, [1, -1])
        tramos.push(horizontal ? [k, 0] : [0, k])
        horizontal = !horizontal
      }
      const camino: Celda[] = [casa]
      for (const [dx, dy] of tramos) {
        for (let s = 0; s < Math.abs(dx + dy); s++) {
          const u = camino[camino.length - 1]
          const c: Celda = [u[0] + signo(dx), u[1] + signo(dy)]
          if (!dentroCroquis(c) || camino.some((v) => igualC(v, c))) return null
          camino.push(c)
        }
      }
      const total = camino.length - 1
      if (total < 3) return null
      // Un lugar por donde pasa (no la casa ni la llegada) y otros fuera del camino.
      const enMedio = camino.slice(1, -1)
      const pasa = elegir(azar, enMedio)
      const fuera: Celda[] = []
      for (let i = 0; i < 40 && fuera.length < 3; i++) {
        const c: Celda = [entero(azar, 0, CROQ.cols - 1), entero(azar, 0, CROQ.filas - 1)]
        if (camino.some((v) => igualC(v, c)) || fuera.some((v) => Math.abs(v[0] - c[0]) + Math.abs(v[1] - c[1]) < 2)) continue
        if (Math.abs(c[0] - pasa[0]) + Math.abs(c[1] - pasa[1]) < 1) continue
        fuera.push(c)
      }
      return fuera.length >= 2 ? { casa, tramos, camino, total, pasa, fuera } : null
    })
    if (!caso) return null
    const nombres = barajar(azar, LUGARES)
    const llegada: Lugar = { ...nombres[0], en: caso.camino[caso.camino.length - 1] }
    const depaso: Lugar = { ...nombres[1], en: caso.pasa }
    const otros: Lugar[] = caso.fuera.map((c, i) => ({ ...nombres[i + 2], en: c }))
    const todos = [llegada, depaso, ...otros]
    const dibujo = dibujoCroquis(todos, caso.casa, caso.camino, `Croquis del barrio con un camino punteado desde la casa hasta ${llegada.el}`)
    const clave = `recorrido:${caso.camino.map((c) => kc(...c)).join(' ')}:${todos.map((l) => `${l.nombre}@${kc(...l.en)}`).join('|')}`
    const enunciado = `La línea punteada es el camino que hizo ${quien} desde su casa hasta ${llegada.el}.`
    const modo = azar()
    if (modo < 0.4) {
      const t = caso.total
      const fin = caso.camino[caso.camino.length - 1]
      const directo = Math.abs(fin[0] - caso.casa[0]) + Math.abs(fin[1] - caso.casa[1])
      const ultimo = caso.tramos[caso.tramos.length - 1]
      return opciones(`${clave}:cuadras`, enunciado, dibujo, '¿Cuántas cuadras caminó en total?', altNum(azar, t, [directo, caso.tramos.length, t - 1, t + 1, t - Math.abs(ultimo[0] + ultimo[1]), t + 2], 4, 1), [
        'Se cuentan las cuadras de cada tramo de la línea punteada, hasta cada vuelta',
        `Total: ${caso.tramos.map(([x, y]) => num(Math.abs(x + y))).join(' + ')} = ${plural(t, 'cuadra', 'cuadras')}`,
      ])
    }
    if (modo < 0.75) {
      const describir = (tr: [number, number][]) => {
        const f = tr.map(([dx, dy]) => movimiento(dx, dy, 'cuadra', 'cuadras'))
        return mayus(f.length > 1 ? `${f.slice(0, -1).join(', ')} y ${f[f.length - 1]}` : f[0])
      }
      const correcta = describir(caso.tramos)
      const malas = [
        describir(caso.tramos.map(([dx, dy]): [number, number] => [-dx, dy])),
        describir(caso.tramos.map(([dx, dy]): [number, number] => [dx, -dy])),
        describir(caso.tramos.map(([dx, dy], i): [number, number] => (i === 0 ? [dx + signo(dx), dy + signo(dy)] : [dx, dy]))),
        describir(caso.tramos.slice(0, -1)),
      ]
      return opciones(`${clave}:describe`, enunciado, dibujo, '¿Qué indicaciones describen su camino?', alternativas(azar, correcta, malas, 4), [
        'Se sigue la línea punteada desde la casa y se cuentan las cuadras de cada tramo',
        `Camino: ${correcta}`,
      ])
    }
    return opciones(`${clave}:pasa`, enunciado, dibujo, 'Antes de llegar, ¿por cuál de estos lugares pasó?', alternativas(azar, mayus(depaso.el), otros.map((l) => mayus(l.el)), 4), [
      `Se sigue la línea punteada desde la casa hasta ${llegada.el}`,
      `${mayus(lista(otros.map((l) => l.el)))} no ${otros.length > 1 ? 'están' : 'está'} en la línea`,
      `Lugar por donde pasa: ${mayus(depaso.el)}`,
    ])
  },
}

// ---------- Simetría ----------

function conectado(cs: Celda[]) {
  const s = conjunto(cs)
  const visto = new Set([kc(...cs[0])])
  const cola = [cs[0]]
  while (cola.length) {
    const [x, y] = cola.pop()!
    for (const [dx, dy] of VECINOS) {
      const k = kc(x + dx, y + dy)
      if (s.has(k) && !visto.has(k)) {
        visto.add(k)
        cola.push([x + dx, y + dy])
      }
    }
  }
  return visto.size === cs.length
}

/** ¿Es simétrica respecto de la línea vertical x = a (medida en lados de cuadradito)? */
const simetricaEn = (cs: Celda[], a: number) => {
  const s = conjunto(cs)
  return cs.every(([x, y]) => s.has(kc(2 * a - 1 - x, y)))
}

/** La mitad izquierda de una figura: n cuadraditos en cols columnas, con 2 o más tocando el eje (la última columna). */
function mitad(azar: Azar, n: number, cols: number, filas: number): Celda[] {
  return hasta(() => {
    const cs = poliomino(azar, n, cols, filas, [cols - 1, entero(azar, 0, filas - 1)])
    return cs.filter(([x]) => x === cols - 1).length >= 2 ? cs : null
  })
}

const ejePunteado = (x1: number, y1: number, x2: number, y2: number) => linea(x1, y1, x2, y2, { grosor: 3, punteado: true })

export const simetriaCompletar: TipoPregunta = {
  id: 'fo-simetria-completar',
  nombre: 'Completa la figura simétrica',
  queHacen: 'Completan en la cuadrícula la otra mitad de una figura para que sea simétrica respecto del eje, o eligen la mitad que falta.',
  citas: { [P4]: 'para construir formas simétricas' },
  ...BASE,
  generar({ azar }) {
    const n = entero(azar, 5, 9)
    if (azar() < 0.42) {
      const vertical = azar() < 0.6
      const L = 30
      const m = mitad(azar, n, 4, 6)
      const cs = vertical ? m : m.map(([x, y]): Celda => [y, x])
      const [cols, filas] = vertical ? [8, 6] : [6, 8]
      const x0 = 18
      const y0 = 18
      const eje = vertical ? ejePunteado(x0 + 4 * L, y0 - 12, x0 + 4 * L, y0 + filas * L + 12) : ejePunteado(x0 - 12, y0 + 4 * L, x0 + cols * L + 12, y0 + 4 * L)
      return {
        forma: 'abierta',
        clave: `simetria-dibuja:${vertical}:${firmaCeldas(m)}:${m.map((c) => kc(...c)).join(' ')}`,
        enunciado: `La línea punteada es el eje de simetría. Pinta la otra mitad para que la figura quede simétrica.`,
        dibujo: svg(cols * L + 2 * x0, filas * L + 2 * y0, rejilla(x0, y0, cols, filas, L) + pintarCeldas(cs, x0, y0, L) + eje, `Media figura de ${n} cuadraditos junto a un eje de simetría ${vertical ? 'vertical' : 'horizontal'}`),
        respuesta: `Se pintan ${n} cuadraditos al otro lado del eje, como en un espejo: cada uno a la misma distancia del eje. La figura completa tiene ${2 * n} cuadraditos.`,
        espacio: 'dibujo',
        pasos: [
          'Cada cuadradito pintado va al otro lado del eje, a la misma distancia, como en un espejo',
          `Los ${num(m.filter(([x]) => x === 3).length)} que tocan el eje tienen su pareja pegada al otro lado`,
          `Se pintan ${num(n)} cuadraditos: la figura completa tiene ${num(n)} + ${num(n)} = ${num(2 * n)}`,
        ],
      }
    }
    // ¿Cuál es la otra mitad? La reflejada, la copiada sin voltear y una con un cuadradito cambiado.
    const caso = hasta(() => {
      const m = mitad(azar, n, 4, 6)
      const espejo = m.map(([x, y]): Celda => [3 - x, y])
      const mx = Math.min(...m.map((c) => c[0]))
      const copia = m.map(([x, y]): Celda => [x - mx, y])
      if (firmaCeldas(espejo) === firmaCeldas(copia)) return null
      const cambiada = intentar(60, () => {
        const quitar = entero(azar, 0, espejo.length - 1)
        const resto = espejo.filter((_, i) => i !== quitar)
        const [x, y] = elegir(azar, resto)
        const [dx, dy] = elegir(azar, VECINOS)
        const nueva: Celda = [x + dx, y + dy]
        if (nueva[0] < 0 || nueva[1] < 0 || nueva[0] > 3 || nueva[1] > 5 || conjunto(resto).has(kc(...nueva))) return null
        const r = [...resto, nueva]
        if (!conectado(r) || tieneHuecos(r) || !r.some(([c]) => c === 0) || [espejo, copia].some((o) => firmaCeldas(o) === firmaCeldas(r))) return null
        return r
      })
      return cambiada ? { m, piezas: [espejo, copia, cambiada] } : null
    })
    const L = 22
    const x0 = 10
    const y0 = 10
    const orden = barajar(azar, [0, 1, 2])
    const partes = [rejilla(x0, y0, 8, 6, L), pintarCeldas(caso.m, x0, y0, L), ejePunteado(x0 + 4 * L, y0 - 6, x0 + 4 * L, y0 + 6 * L + 6)]
    orden.forEach((i, k) => {
      const px = x0 + 8 * L + 40 + k * (4 * L + 26)
      partes.push(rejilla(px, y0, 4, 6, L), pintarCeldas(caso.piezas[i], px, y0, L, SUAVE), ejePunteado(px, y0 - 6, px, y0 + 6 * L + 6), texto(px + 2 * L, y0 + 6 * L + 20, LETRAS[k], { tam: 18, peso: 700 }))
    })
    const W = x0 + 8 * L + 40 + 3 * (4 * L + 26) - 26 + 10
    return opciones(
      `simetria-cual:${caso.m.map((c) => kc(...c)).join(' ')}:${orden.join('')}`,
      'La línea punteada es el eje de simetría. Falta la mitad derecha de la figura.',
      svg(W, y0 + 6 * L + 34, partes.join(''), 'Media figura junto a un eje de simetría y tres mitades A, B y C para completarla'),
      '¿Cuál mitad completa la figura simétrica?',
      cual('Mitad', 3, orden.indexOf(0)),
      [
        ...[1, 2]
          .sort((p, q) => orden.indexOf(p) - orden.indexOf(q))
          .map((i) => `Mitad ${LETRAS[orden.indexOf(i)]}: ${i === 1 ? 'está copiada igual, no volteada como en un espejo' : 'tiene un cuadradito cambiado de lugar'}`),
        `Es el reflejo, cuadradito por cuadradito: Mitad ${LETRAS[orden.indexOf(0)]}`,
      ],
      'La otra mitad es el reflejo, como en un espejo: lo que toca el eje sigue tocándolo.',
    )
  },
}

const LETRAS_SIMETRICAS = ['A', 'H', 'M', 'O', 'T', 'U', 'V', 'W', 'X', 'Y']
const LETRAS_SIN_EJE = ['F', 'G', 'J', 'L', 'N', 'P', 'R', 'S', 'Z']

export const ejeSimetria: TipoPregunta = {
  id: 'fo-eje-simetria',
  nombre: '¿Cuál es simétrica?',
  queHacen: 'Reconocen si una línea es eje de simetría de una figura en la cuadrícula y qué letras tienen eje de simetría.',
  citas: { [P4]: 'la visualización, así como el uso de las cuadrículas, para construir formas simétricas' },
  ...BASE,
  generar({ azar }) {
    if (azar() < 0.65) {
      const simetrica = () => {
        const m = mitad(azar, entero(azar, 3, 6), 3, 6)
        return [...m, ...m.map(([x, y]): Celda => [5 - x, y])]
      }
      const buena = simetrica()
      const corrida = hasta(() => {
        const s = simetrica()
        return Math.min(...s.map((c) => c[0])) <= 1 ? s : null
      })
      const ladeada = hasta(() => {
        const s = simetrica()
        const quitar = entero(azar, 0, s.length - 1)
        const resto = s.filter((_, i) => i !== quitar)
        const [x, y] = elegir(azar, resto)
        const [dx, dy] = elegir(azar, VECINOS)
        const nueva: Celda = [x + dx, y + dy]
        if (nueva[0] < 0 || nueva[1] < 0 || nueva[0] > 5 || nueva[1] > 5 || conjunto(resto).has(kc(...nueva))) return null
        const r = [...resto, nueva]
        return conectado(r) && !tieneHuecos(r) && !simetricaEn(r, 3) ? r : null
      })
      const casos: [Celda[], number][] = [
        [buena, 3],
        [corrida, elegir(azar, [2, 4])],
        [ladeada, 3],
      ]
      const L = 22
      const W = 6 * L + 28
      const panel = ([cs, a]: [Celda[], number]) => {
        const vertical = azar() < 0.6
        const celdas = vertical ? cs : cs.map(([x, y]): Celda => [y, x])
        const eje = vertical ? ejePunteado(14 + a * L, 6, 14 + a * L, 14 + 6 * L + 8) : ejePunteado(6, 14 + a * L, 14 + 6 * L + 8, 14 + a * L)
        return rejilla(14, 14, 6, 6, L) + pintarCeldas(celdas, 14, 14, L) + eje
      }
      const orden = barajar(azar, [0, 1, 2])
      return opciones(
        `eje:${orden.map((i) => `${firmaCeldas(casos[i][0])}@${casos[i][1]}`).join('|')}`,
        'Observa las figuras y sus líneas punteadas.',
        enFila(
          orden.map((i) => panel(casos[i])),
          W,
          W,
          'Tres figuras en cuadrículas, cada una con una línea punteada',
        ),
        '¿En cuál la línea punteada es un eje de simetría?',
        cual('Figura', 3, orden.indexOf(0)),
        [
          'Se imagina doblar cada figura por su línea punteada',
          ...[1, 2]
            .sort((p, q) => orden.indexOf(p) - orden.indexOf(q))
            .map((i) => `Figura ${LETRAS[orden.indexOf(i)]}: ${i === 1 ? 'la línea no pasa por el medio de la figura' : 'un cuadradito no coincide al doblar'}`),
          `Las dos mitades coinciden: Figura ${LETRAS[orden.indexOf(0)]}`,
        ],
        'Si se dobla la figura por el eje, las dos mitades coinciden.',
      )
    }
    const no = azar() < 0.6
    const correcta = elegir(azar, no ? LETRAS_SIN_EJE : LETRAS_SIMETRICAS)
    const alt = alternativas(azar, correcta, barajar(azar, no ? LETRAS_SIMETRICAS : LETRAS_SIN_EJE).slice(0, 2), 3)
    if (!alt) return null
    const con = alt.alternativas.filter((l) => LETRAS_SIMETRICAS.includes(l))
    const sin = alt.alternativas.filter((l) => LETRAS_SIN_EJE.includes(l))
    const cuerpo = alt.alternativas.map((l, i) => rect(4 + i * 124, 4, 110, 110, { relleno: '#ffffff', trazo: GRIS, grosor: 1.4, redondeo: 10 }) + texto(4 + i * 124 + 55, 4 + 59, l, { tam: 78, peso: 700 })).join('')
    return opciones(
      `letras:${no}:${alt.alternativas.join('')}`,
      'Observa estas letras mayúsculas.',
      svg(3 * 124 - 6, 118, cuerpo, `Las letras ${alt.alternativas.join(', ')}`),
      no ? '¿Qué letra NO tiene eje de simetría?' : '¿Qué letra tiene un eje de simetría?',
      alt,
      [
        'Se imagina doblar cada letra por el medio, de arriba abajo o de lado a lado',
        [con, sin]
          .map((ls, k) => `${lista(ls)} ${k === 0 ? (ls.length > 1 ? 'tienen eje de simetría' : 'tiene eje de simetría') : 'no'}`)
          .join('; '),
        `${no ? 'No tiene eje de simetría' : 'Tiene eje de simetría'}: ${correcta}`,
      ],
      'Una figura tiene eje de simetría si al doblarla por esa línea las dos mitades coinciden.',
    )
  },
}

// ---------- El grupo ----------

export const GRUPO_FORMA: Grupo = {
  tipos: [
    nombrePoligono,
    ladosVertices,
    anguloRecto,
    angulosRectosFigura,
    rectasParalelas,
    ladosParalelos,
    cuerpoElementos,
    esqueleto,
    cubitosCaja,
    plantillaCubo,
    caraOpuesta,
    perimetro,
    perimetroCuadricula,
    superficieContar,
    masExtenso,
    vasosJarra,
    capacidadLitro,
    convertirLongitud,
    compararLongitudes,
    traslacion,
    traslacionCual,
    croquisLlegar,
    croquisRecorrido,
    simetriaCompletar,
    ejeSimetria,
  ],
  temas: {
    'Los polígonos': ['fo-nombre-poligono', 'fo-lados-vertices'],
    'Elementos de los polígonos': ['fo-lados-vertices', 'fo-angulos-rectos-figura', 'fo-nombre-poligono'],
    'El ángulo recto': ['fo-angulo-recto', 'fo-angulos-rectos-figura'],
    'Rectas paralelas y perpendiculares': ['fo-rectas', 'fo-lados-paralelos'],
    'Prismas de base cuadrangular': ['fo-cuerpo-elementos', 'fo-cubitos-caja', 'fo-esqueleto'],
    'Caras, aristas y vértices': ['fo-cuerpo-elementos', 'fo-esqueleto'],
    'Plantilla del cubo': ['fo-plantilla-cubo', 'fo-cara-opuesta'],
    'Perímetro de polígonos': ['fo-perimetro', 'fo-perimetro-cuadricula'],
    'Superficie con unidades patrón': ['fo-superficie-contar', 'fo-mas-extenso'],
    'El litro y fracciones de litro': ['fo-vasos-jarra', 'fo-capacidad-litro'],
    'Conversión de unidades de longitud': ['fo-convertir-longitud', 'fo-comparar-longitudes'],
    'Traslación en la cuadrícula': ['fo-traslacion', 'fo-traslacion-cual'],
    'Croquis y recorridos': ['fo-croquis-llegar', 'fo-croquis-recorrido'],
    'Figuras simétricas': ['fo-simetria-completar', 'fo-eje-simetria'],
    'Polígonos y perímetro': ['fo-perimetro', 'fo-nombre-poligono', 'fo-perimetro-cuadricula'],
    'Cubos y prismas': ['fo-cuerpo-elementos', 'fo-esqueleto', 'fo-cubitos-caja', 'fo-plantilla-cubo'],
    'Traslación de figuras': ['fo-traslacion-cual', 'fo-traslacion'],
  },
}
