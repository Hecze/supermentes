// Piezas para dibujar en SVG, como texto. El mismo SVG se ve en la pantalla y se pasa a imagen para el PDF, así que
// no usa variables de CSS ni fuentes de la web. Pensado para imprimirse en blanco y negro: trazos oscuros, rellenos
// claros y siempre un número o una palabra que diga qué es cada cosa (el color solo ayuda).
import type { Dibujo } from './tipos'

export const TINTA = '#1f1f1f'
export const GRIS = '#6b6b6b'
export const CLARO = '#e9e9e9'
const FUENTE = 'Arial, Helvetica, sans-serif'

export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

/** Redondea a una décima: SVG más corto y sin "0.30000000000000004". */
export const r1 = (n: number) => Math.round(n * 10) / 10

type Atributos = Record<string, string | number | undefined | null | false>

export function el(etiqueta: string, a: Atributos, hijos = '') {
  const attrs = Object.entries(a)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => ` ${k}="${typeof v === 'number' ? r1(v) : esc(String(v))}"`)
    .join('')
  return hijos ? `<${etiqueta}${attrs}>${hijos}</${etiqueta}>` : `<${etiqueta}${attrs}/>`
}

type Trazo = { relleno?: string; trazo?: string; grosor?: number; punteado?: boolean; redondeo?: number; opacidad?: number }

const estilo = ({ relleno = 'none', trazo = TINTA, grosor = 2, punteado, opacidad }: Trazo) => ({
  fill: relleno,
  stroke: trazo,
  'stroke-width': grosor,
  'stroke-dasharray': punteado ? '5 4' : undefined,
  'stroke-linejoin': 'round',
  'stroke-linecap': 'round',
  opacity: opacidad,
})

export const rect = (x: number, y: number, w: number, h: number, t: Trazo = {}) => el('rect', { x, y, width: w, height: h, rx: t.redondeo, ...estilo(t) })

export const circulo = (cx: number, cy: number, r: number, t: Trazo = {}) => el('circle', { cx, cy, r, ...estilo(t) })

export const elipse = (cx: number, cy: number, rx: number, ry: number, t: Trazo = {}) => el('ellipse', { cx, cy, rx, ry, ...estilo(t) })

export const linea = (x1: number, y1: number, x2: number, y2: number, t: Trazo = {}) => el('line', { x1, y1, x2, y2, ...estilo(t) })

export const ruta = (d: string, t: Trazo = {}) => el('path', { d, ...estilo(t) })

/** Polígono por sus vértices. */
export const poligono = (puntos: [number, number][], t: Trazo = {}) => el('polygon', { points: puntos.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' '), ...estilo(t) })

export function texto(
  x: number,
  y: number,
  t: string,
  { tam = 16, peso = 400, ancla = 'middle', color = TINTA, base = 'middle' }: { tam?: number; peso?: number; ancla?: 'start' | 'middle' | 'end'; color?: string; base?: 'middle' | 'alphabetic' | 'hanging' } = {},
) {
  return el('text', { x, y, 'font-size': tam, 'font-weight': peso, 'text-anchor': ancla, 'dominant-baseline': base === 'alphabetic' ? undefined : base === 'middle' ? 'central' : 'hanging', fill: color }, esc(t))
}

export const grupo = (cuerpo: string, x = 0, y = 0, escala = 1) =>
  el('g', { transform: `translate(${r1(x)} ${r1(y)})${escala !== 1 ? ` scale(${escala})` : ''}` }, cuerpo)

/** El dibujo terminado. `alt` dice lo que muestra, para lectores de pantalla y para revisar sin verlo. */
export function svg(ancho: number, alto: number, cuerpo: string, alt: string): Dibujo {
  const w = Math.ceil(ancho)
  const h = Math.ceil(alto)
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="${FUENTE}" role="img" aria-label="${esc(alt)}">${cuerpo}</svg>`,
    ancho: w,
    alto: h,
    alt,
  }
}

/** Recuadro vacío donde el alumno escribe: "▢". */
export const casilla = (x: number, y: number, w = 44, h = 36) => rect(x, y, w, h, { relleno: '#fff', grosor: 2, redondeo: 4 })

/** Estrella de cinco puntas centrada en (cx, cy). */
export function estrella(cx: number, cy: number, r: number, t: Trazo = {}) {
  const pts: [number, number][] = []
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const radio = i % 2 === 0 ? r : r * 0.45
    pts.push([cx + radio * Math.cos(a), cy + radio * Math.sin(a)])
  }
  return poligono(pts, t)
}

/** Ancho aproximado de un texto en Arial, para centrar o separar sin medirlo en el navegador. */
export const anchoTexto = (t: string, tam: number) => t.length * tam * 0.56
