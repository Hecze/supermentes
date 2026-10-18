// El PDF de los exámenes listos, armado en el navegador (jsPDF se descarga solo al pedirlo). Pensado para la
// fotocopiadora del colegio: A4, blanco y negro, letra grande, una pregunta nunca se parte entre dos páginas.
// Los dibujos son los mismos SVG de la pantalla, pasados a imagen.
import type { jsPDF as JsPDF } from 'jspdf'
import type { Dibujo, Item, Version } from './tipos'
import { letra } from './util'

const ANCHO = 210
const ALTO = 297
const MARGEN = 16
const ARRIBA = 14
const LIMITE = ALTO - 16
const W = ANCHO - 2 * MARGEN
const MM_POR_PT = 0.3528
const MM_POR_PX = 0.2646

const REEMPLAZOS: [RegExp, string][] = [
  [/−/g, '-'],
  [/≤/g, '<='],
  [/≥/g, '>='],
  [/≠/g, 'distinto de'],
  [/[▢□☐]/g, '____'],
  [/→/g, '->'],
  [/ /g, ' '],
]
const limpiar = (s: string) => REEMPLAZOS.reduce((t, [re, por]) => t.replace(re, por), s)

/** Un SVG como imagen PNG, a unos 290 puntos por pulgada. */
async function aPng(d: Dibujo, escala = 3): Promise<string> {
  const img = new Image()
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(d.svg)}`
  await img.decode()
  const c = document.createElement('canvas')
  c.width = Math.round(d.ancho * escala)
  c.height = Math.round(d.alto * escala)
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.drawImage(img, 0, 0, c.width, c.height)
  return c.toDataURL('image/png')
}

export type DatosPdf = {
  tema: string
  area: string
  grado: string
  versiones: Version[]
  /** Qué evalúa cada tipo de pregunta, para la hoja de respuestas: su nombre y su cita del currículo. */
  sustento: (tipo: string) => { nombre: string; competencia?: string; cita?: string }
}

/**
 * Medidas de un dibujo en el papel: un poco más chico que en la pantalla (así el examen entra en menos hojas y la
 * fotocopia cuesta menos), sin pasar el ancho de la hoja ni 75 mm de alto.
 */
function medidas(d: Dibujo) {
  let w = d.ancho * MM_POR_PX * 0.8
  let h = d.alto * MM_POR_PX * 0.8
  const k = Math.min(1, (W - 8) / w, 75 / h)
  w *= k
  h *= k
  return { w, h }
}

type Ctx = { doc: JsPDF; y: number; imagenes: Map<string, string>; pie: string }

function nuevaPagina(c: Ctx) {
  pie(c)
  c.doc.addPage()
  c.y = ARRIBA
}

function pie(c: Ctx) {
  const { doc } = c
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(110)
  doc.text(c.pie, MARGEN, ALTO - 9)
  doc.text(`Página ${doc.getNumberOfPages()}`, ANCHO - MARGEN, ALTO - 9, { align: 'right' })
  doc.setTextColor(0)
}

const alto = (pt: number, interlineado = 1.32) => pt * MM_POR_PT * interlineado

function lineas(doc: JsPDF, texto: string, pt: number, w: number, estilo: 'normal' | 'bold' = 'normal') {
  doc.setFont('helvetica', estilo)
  doc.setFontSize(pt)
  return doc.splitTextToSize(limpiar(texto), w) as string[]
}

function escribir(c: Ctx, ls: string[], pt: number, x = MARGEN, estilo: 'normal' | 'bold' = 'normal') {
  c.doc.setFont('helvetica', estilo)
  c.doc.setFontSize(pt)
  for (const l of ls) {
    c.doc.text(l, x, c.y, { baseline: 'top' })
    c.y += alto(pt)
  }
}

/** Estrella de cinco puntas para pintar. */
function estrella(doc: JsPDF, cx: number, cy: number, r: number) {
  const pts: [number, number][] = []
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const radio = i % 2 === 0 ? r : r * 0.45
    pts.push([cx + radio * Math.cos(a), cy + radio * Math.sin(a)])
  }
  const tramos = pts.slice(1).map((p, i) => [p[0] - pts[i][0], p[1] - pts[i][1]])
  doc.lines(tramos, pts[0][0], pts[0][1], [1, 1], 'S', true)
}

/** Carita para la autoevaluación: feliz (1), seria (0) o preocupada (−1). */
function carita(doc: JsPDF, cx: number, cy: number, r: number, animo: 1 | 0 | -1) {
  doc.circle(cx, cy, r, 'S')
  doc.circle(cx - r * 0.35, cy - r * 0.25, r * 0.09, 'F')
  doc.circle(cx + r * 0.35, cy - r * 0.25, r * 0.09, 'F')
  const y0 = cy + r * 0.35
  const curva = animo * r * 0.22
  const pasos = 8
  const puntos: [number, number][] = Array.from({ length: pasos + 1 }, (_, i) => {
    const t = i / pasos
    const x = cx - r * 0.42 + t * r * 0.84
    return [x, y0 + curva * (1 - (2 * t - 1) ** 2) - (animo < 0 ? curva : 0)]
  })
  const tramos = puntos.slice(1).map((p, i) => [p[0] - puntos[i][0], p[1] - puntos[i][1]])
  doc.lines(tramos, puntos[0][0], puntos[0][1], [1, 1], 'S', false)
}

const PT = 11.5

function encabezado(c: Ctx, d: DatosPdf, v: Version, respuestas: boolean) {
  const { doc } = c
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10.5)
  doc.setTextColor(80)
  doc.text(limpiar(`${d.area} · ${d.grado}`), MARGEN, c.y, { baseline: 'top' })
  doc.text([v.fila, `Versión ${v.codigo}`].filter(Boolean).join(' · '), ANCHO - MARGEN, c.y, { baseline: 'top', align: 'right' })
  doc.setTextColor(0)
  c.y += 6
  escribir(c, lineas(doc, respuestas ? `Respuestas: ${d.tema}` : d.tema, 19, W, 'bold'), 19, MARGEN, 'bold')
  c.y += 2
  if (respuestas) {
    escribir(c, lineas(doc, 'Solo para el docente.', PT, W), PT)
    c.y += 3
    return
  }
  escribir(c, [`Nombre: ${'_'.repeat(44)}     Fecha: ${'_'.repeat(14)}`], PT)
  c.y += 3
  // Los retos: una estrella por cada uno, para que el alumno las pinte al revisar.
  const n = v.items.length
  const texto = lineas(doc, `Resuelve los ${n} retos. Por cada reto que logres, pinta una estrella.`, PT, W - 10)
  const r = 3.4
  const porFila = Math.floor((W - 10) / (2 * r + 3.2))
  const filasEstrellas = Math.ceil(n / porFila)
  const h = texto.length * alto(PT) + filasEstrellas * (2 * r + 3) + 7
  doc.setFillColor(243, 243, 243)
  doc.setDrawColor(190)
  doc.roundedRect(MARGEN, c.y, W, h, 2.5, 2.5, 'FD')
  c.y += 3.5
  escribir(c, texto, PT, MARGEN + 5)
  c.y += 1
  doc.setDrawColor(40)
  doc.setLineWidth(0.35)
  for (let i = 0; i < n; i++) estrella(doc, MARGEN + 5 + r + (i % porFila) * (2 * r + 3.2), c.y + r + Math.floor(i / porFila) * (2 * r + 3), r)
  doc.setLineWidth(0.2)
  c.y += filasEstrellas * (2 * r + 3) + 3.5
  c.y += 5
}

/** Alto de un renglón de alternativas en fila, o null si no caben en una sola fila. */
function enFila(doc: JsPDF, alts: string[]) {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(PT)
  const anchos = alts.map((a, i) => doc.getTextWidth(limpiar(`${letra(i)}) ${a}`)) + 8)
  const col = (W - 8) / alts.length
  return anchos.every((a) => a <= col - 2) ? col : null
}

/** Dibuja una pregunta (o la mide, si `medir`). Devuelve el alto que ocupa. */
function pregunta(c: Ctx, it: Item, i: number, medir: boolean): number {
  const { doc } = c
  const y0 = c.y
  const X = MARGEN + 2
  const ancho = W - 4
  // "Reto 1": una etiqueta oscura, y al lado lo que hay que hacer.
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  const etiqueta = `Reto ${i + 1}`
  const we = doc.getTextWidth(etiqueta) + 5
  const enunciado = lineas(doc, it.enunciado, PT, ancho - we - 3, 'bold')
  if (!medir) {
    doc.setFillColor(35, 35, 35)
    doc.roundedRect(X, c.y - 0.8, we, 6, 1.6, 1.6, 'F')
    doc.setTextColor(255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.text(etiqueta, X + 2.5, c.y + 2.2, { baseline: 'middle' })
    doc.setTextColor(0)
  }
  const yTexto = c.y
  if (medir) c.y += enunciado.length * alto(PT)
  else escribir(c, enunciado, PT, X + we + 3, 'bold')
  c.y = Math.max(c.y, yTexto + 6)

  if (it.dibujo) {
    const m = medidas(it.dibujo)
    c.y += 2.5
    if (!medir) doc.addImage(c.imagenes.get(it.dibujo.svg)!, 'PNG', X + 4, c.y, m.w, m.h, undefined, 'FAST')
    c.y += m.h + 2
  }
  if (it.pregunta) {
    const ls = lineas(doc, it.pregunta, PT, ancho)
    c.y += 1.5
    if (medir) c.y += ls.length * alto(PT)
    else escribir(c, ls, PT, X)
  }

  if (it.forma === 'opciones') {
    c.y += 2.5
    const col = enFila(doc, it.alternativas)
    if (col) {
      if (!medir) {
        doc.setDrawColor(40)
        it.alternativas.forEach((a, k) => {
          const x = X + 2 + k * col
          doc.circle(x + 2, c.y + 2, 1.9, 'S')
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(PT)
          doc.text(limpiar(`${letra(k)}) ${a}`), x + 6, c.y + 2, { baseline: 'middle' })
        })
      }
      c.y += alto(PT) + 1.5
    } else {
      for (const [k, a] of it.alternativas.entries()) {
        const ls = lineas(doc, `${letra(k)}) ${a}`, PT, ancho - 10)
        if (!medir) {
          doc.setDrawColor(40)
          doc.circle(X + 4, c.y + 2, 1.9, 'S')
          escribir(c, ls, PT, X + 8)
        } else c.y += ls.length * alto(PT)
        c.y += 1.2
      }
    }
  } else if (it.forma === 'abierta') {
    if (it.espacio === 'linea') {
      c.y += 4
      if (!medir) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(PT)
        doc.text('Respuesta:', X, c.y + 3, { baseline: 'bottom' })
        doc.setDrawColor(120)
        doc.line(X + 22, c.y + 3, X + 110, c.y + 3)
      }
      c.y += 6
    } else if (it.espacio === 'renglones') {
      for (let r = 0; r < 3; r++) {
        c.y += 8
        if (!medir) {
          doc.setDrawColor(150)
          doc.line(X, c.y, X + ancho, c.y)
        }
      }
      c.y += 2
    }
  } else if (it.forma === 'unir') {
    c.y += 3
    const colW = ancho * 0.36
    const xDer = X + ancho - colW
    const filas = it.izquierda.map((a, k) => {
      const la = lineas(doc, a, PT, colW - 6)
      const lb = lineas(doc, it.derecha[k], PT, colW - 6)
      return { la, lb, h: Math.max(la.length, lb.length) * alto(PT) + 4 }
    })
    for (const f of filas) {
      if (!medir) {
        const y = c.y
        escribir(c, f.la, PT, X + 2)
        c.y = y
        doc.circle(X + colW + 1, y + 2, 1.2, 'F')
        doc.circle(xDer - 2, y + 2, 1.2, 'F')
        escribir(c, f.lb, PT, xDer + 2)
        c.y = y
      }
      c.y += f.h
    }
  } else if (it.forma === 'completar') {
    c.y += 3
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(PT)
    const caja = lineas(doc, it.palabras.join('      '), PT, ancho - 12, 'bold')
    const hc = caja.length * alto(PT) + 5
    if (!medir) {
      doc.setDrawColor(120)
      doc.setLineDashPattern([1.2, 1], 0)
      doc.roundedRect(X, c.y, ancho, hc, 2, 2, 'S')
      doc.setLineDashPattern([], 0)
      const y = c.y
      c.y += 2.5
      escribir(c, caja, PT, X + 6, 'bold')
      c.y = y
    }
    c.y += hc + 3
    for (const [k, f] of it.frases.entries()) {
      const ls = lineas(doc, `${k + 1}. ${f.replace('____', '').trim()}`, PT, ancho - 46)
      const y = c.y
      if (!medir) {
        escribir(c, ls, PT, X)
        doc.setDrawColor(120)
        doc.line(X + ancho - 40, y + alto(PT) * ls.length - 1, X + ancho, y + alto(PT) * ls.length - 1)
      }
      c.y = y + ls.length * alto(PT) + 2.5
    }
  }
  c.y += 5
  const h = c.y - y0
  if (medir) c.y = y0
  return h
}

function autoevaluacion(c: Ctx) {
  const { doc } = c
  const h = 30
  if (c.y + h > LIMITE) nuevaPagina(c)
  doc.setDrawColor(190)
  doc.roundedRect(MARGEN, c.y, W, h, 2.5, 2.5, 'S')
  c.y += 4
  escribir(c, ['¿Cómo me fue? Marca una carita.'], PT, MARGEN + 5, 'bold')
  const opciones: [1 | 0 | -1, string][] = [
    [1, '¡Lo logré!'],
    [0, 'Lo logré con ayuda'],
    [-1, 'Necesito practicar más'],
  ]
  doc.setDrawColor(40)
  doc.setLineWidth(0.35)
  opciones.forEach(([animo, t], k) => {
    const cx = MARGEN + 11 + k * (W / 3)
    carita(doc, cx, c.y + 7, 5.2, animo)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10.5)
    doc.text(t, cx + 8, c.y + 7, { baseline: 'middle' })
  })
  doc.setLineWidth(0.2)
  c.y += h - 4
}

/** Lo que va en la hoja de respuestas para cada pregunta. */
export function respuestaDe(it: Item): string {
  const nota = it.nota ? ` ${it.nota}` : ''
  if (it.forma === 'opciones') return `${letra(it.correcta)}) ${it.alternativas[it.correcta]}${nota}`
  if (it.forma === 'abierta') return `${it.respuesta}${nota}`
  if (it.forma === 'unir') return it.izquierda.map((a, k) => `${a} -> ${it.derecha[it.solucion[k]]}`).join(' · ')
  return it.respuestas.map((r, k) => `${k + 1}. ${r}`).join(' · ')
}

function hojaRespuestas(c: Ctx, d: DatosPdf, v: Version) {
  const { doc } = c
  encabezado(c, d, v, true)
  for (const [i, it] of v.items.entries()) {
    const s = d.sustento(it.tipo)
    const t = lineas(doc, `Reto ${i + 1} · ${s.nombre}`, 10.5, W, 'bold')
    const r = lineas(doc, respuestaDe(it), PT, W - 6)
    const h = t.length * alto(10.5) + r.length * alto(PT) + 4
    if (c.y + h > LIMITE) nuevaPagina(c)
    doc.setTextColor(80)
    escribir(c, t, 10.5, MARGEN, 'bold')
    doc.setTextColor(0)
    escribir(c, r, PT, MARGEN + 4)
    c.y += 2.5
  }
  // Qué evalúa: el desempeño de cada tipo, citado tal cual. Sirve para el registro y para el director.
  const vistos = new Map<string, number[]>()
  v.items.forEach((it, i) => {
    const s = d.sustento(it.tipo)
    if (s.cita) vistos.set(s.cita, [...(vistos.get(s.cita) ?? []), i + 1])
  })
  if (!vistos.size) return
  c.y += 4
  const titulo = lineas(doc, 'Qué evalúa cada reto (Currículo Nacional, texto oficial del MINEDU)', PT, W, 'bold')
  if (c.y + 20 > LIMITE) nuevaPagina(c)
  escribir(c, titulo, PT, MARGEN, 'bold')
  c.y += 1
  for (const [cita, retos] of vistos) {
    const s = d.sustento(v.items[retos[0] - 1].tipo)
    const ls = lineas(doc, `Retos ${retos.join(', ')}${s.competencia ? ` · Competencia «${s.competencia}»` : ''}: «${cita}»`, 10.5, W - 4)
    if (c.y + ls.length * alto(10.5) > LIMITE) nuevaPagina(c)
    escribir(c, ls, 10.5, MARGEN + 2)
    c.y += 2
  }
}

/** El examen (una o dos versiones) o sus respuestas, en un solo PDF. */
export async function pdfExamenListo(d: DatosPdf, { respuestas = false } = {}): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const imagenes = new Map<string, string>()
  if (!respuestas) {
    const dibujos = [...new Map(d.versiones.flatMap((v) => v.items.flatMap((it) => (it.dibujo ? [[it.dibujo.svg, it.dibujo] as const] : [])))).values()]
    await Promise.all(dibujos.map(async (x) => imagenes.set(x.svg, await aPng(x))))
  }
  const c: Ctx = { doc, y: ARRIBA, imagenes, pie: '' }
  d.versiones.forEach((v, n) => {
    if (n > 0) {
      pie(c)
      doc.addPage()
      c.y = ARRIBA
    }
    c.pie = limpiar(`Hecho con Supermentes · supermentes.app · ${[v.fila, `Versión ${v.codigo}`].filter(Boolean).join(' · ')}`)
    if (respuestas) return hojaRespuestas(c, d, v)
    encabezado(c, d, v, false)
    v.items.forEach((it, i) => {
      const h = pregunta(c, it, i, true)
      if (c.y + h > LIMITE && c.y > ARRIBA + 10) nuevaPagina(c)
      pregunta(c, it, i, false)
      if (i < v.items.length - 1) {
        doc.setDrawColor(225)
        doc.line(MARGEN, c.y - 2.5, ANCHO - MARGEN, c.y - 2.5)
      }
    })
    autoevaluacion(c)
  })
  pie(c)
  return doc.output('blob')
}
