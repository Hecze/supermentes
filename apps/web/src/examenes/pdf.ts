// El PDF de las hojas listas (examen, práctica y balotario) y de su clave, armado en el navegador (jsPDF se descarga
// solo al pedirlo). Pensado para la fotocopiadora del colegio: A4, blanco y negro, letra grande, una pregunta nunca se
// parte entre dos páginas. Los dibujos son los mismos SVG de la pantalla, pasados a imagen. La clave es para el
// docente: una tabla de respuestas para corregir rápido y, por pregunta, los pasos como en la pizarra.
import type { jsPDF as JsPDF } from 'jspdf'
import { porTema } from './armar'
import type { Clase, Dibujo, Item, Teoria, Version } from './tipos'
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
  [/≈/g, 'aprox.'],
  [/[“”]/g, '"'],
  [/[‘’]/g, "'"],
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
  clase: Clase
  titulo: string
  /** El curso (o los cursos, en una miscelánea de varios). */
  curso: string
  /** Grado y sección, como lo escribió el docente (o el grado del tema). */
  grado: string
  colegio: string
  docente: string
  temas: { tema: string; teoria: Teoria | null }[]
  /** Con subtítulo por tema: en la miscelánea. */
  subtitulos: boolean
  versiones: Version[]
  /** Qué evalúa cada tipo de pregunta de cada tema, para la clave: su nombre y su cita del currículo. */
  sustento: (tema: string, tipo: string) => { nombre: string; competencia?: string; cita?: string }
}

/**
 * Medidas de un dibujo en el papel: un poco más chico que en la pantalla (así el examen entra en menos hojas y la
 * fotocopia cuesta menos), sin pasar el ancho de la hoja ni 75 mm de alto.
 */
function medidas(d: Dibujo, maxW = W - 8, maxH = 75) {
  let w = d.ancho * MM_POR_PX * 0.8
  let h = d.alto * MM_POR_PX * 0.8
  const k = Math.min(1, maxW / w, maxH / h)
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
const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

/** Texto y una línea para escribir a mano a su derecha. Devuelve dónde termina. */
function campo(doc: JsPDF, texto: string, x: number, y: number, largo: number) {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(PT)
  doc.text(texto, x, y, { baseline: 'bottom' })
  const x0 = x + doc.getTextWidth(texto) + 1.5
  doc.setDrawColor(120)
  doc.line(x0, y, x0 + largo, y)
  return x0 + largo
}

/** El encabezado: el colegio, el curso, el grado y el docente; la nota (en el examen), el título y el nombre. */
function encabezado(c: Ctx, d: DatosPdf, v: Version, clave: boolean) {
  const { doc } = c
  const y0 = c.y
  const conNota = d.clase === 'examen' && !clave
  const ancho = conNota ? W - 28 : W - 40
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(90)
  doc.text([v.fila, `Versión ${v.codigo}`].filter(Boolean).join(' · '), ANCHO - MARGEN, c.y, { baseline: 'top', align: 'right' })
  if (conNota) {
    doc.text('Nota', ANCHO - MARGEN - 10, y0 + 6, { baseline: 'top', align: 'center' })
    doc.setDrawColor(30)
    doc.setLineWidth(0.5)
    doc.roundedRect(ANCHO - MARGEN - 20, y0 + 11, 20, 20, 2, 2, 'S')
    doc.setLineWidth(0.2)
  }
  doc.setTextColor(0)
  if (d.colegio.trim()) {
    escribir(c, lineas(doc, d.colegio, 12.5, ancho, 'bold'), 12.5, MARGEN, 'bold')
  }
  doc.setTextColor(70)
  escribir(c, lineas(doc, [d.curso, d.grado, d.docente.trim() && `Docente: ${d.docente.trim()}`].filter(Boolean).join(' · '), 10.5, ancho), 10.5)
  doc.setTextColor(0)
  c.y += 2
  escribir(c, lineas(doc, clave ? `Clave: ${d.titulo}` : d.titulo, 18, ancho, 'bold'), 18, MARGEN, 'bold')
  c.y += 2
  if (clave) {
    escribir(c, ['Solo para el docente.'], PT)
    c.y += 4
    return
  }
  c.y = Math.max(c.y + 5, conNota ? y0 + 37 : 0)
  const fecha = d.clase === 'balotario' ? 'Para el examen del:' : 'Fecha:'
  const largoFecha = d.clase === 'balotario' ? 24 : 30
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(PT)
  const largoNombre = W - doc.getTextWidth('Apellidos y nombres:') - doc.getTextWidth(fecha) - 3 - 8 - largoFecha
  const fin = campo(doc, 'Apellidos y nombres:', MARGEN, c.y, largoNombre)
  campo(doc, fecha, fin + 8, c.y, largoFecha)
  c.y += 6
  if (d.clase !== 'examen') {
    c.y += 2
    return
  }
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

/** Ancho de cada alternativa si caben todas en una fila, o null. */
function enFila(doc: JsPDF, alts: string[], ancho: number) {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(PT)
  const anchos = alts.map((a, i) => doc.getTextWidth(limpiar(`${letra(i)}) ${a}`)) + 8)
  const col = (ancho - 4) / alts.length
  return anchos.every((a) => a <= col - 2) ? col : null
}

/** «Respuesta: ____» */
function lineaRespuesta(c: Ctx, X: number, medir: boolean) {
  c.y += 4
  if (!medir) campo(c.doc, 'Respuesta:', X, c.y + 3, 70)
  c.y += 6
}

/** Dibuja una pregunta (o la mide, si `medir`). Devuelve el alto que ocupa. */
function pregunta(c: Ctx, it: Item, n: number, clase: Clase, medir: boolean): number {
  const { doc } = c
  const y0 = c.y
  const X = MARGEN + 2
  const ancho = W - 4
  const compacta = clase === 'balotario'
  // Como en el libro: el enunciado a la izquierda y el recuadro del procedimiento a la derecha.
  const conRecuadro = !compacta && it.forma === 'abierta' && it.espacio === 'procedimiento'
  const izq = conRecuadro ? ancho * 0.55 : ancho

  // "Reto 1" en una etiqueta oscura (en el balotario, solo "1.") y al lado lo que hay que hacer.
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(compacta ? PT : 10.5)
  const etiqueta = compacta ? `${n}.` : `Reto ${n}`
  const we = doc.getTextWidth(etiqueta) + (compacta ? 1.5 : 5)
  const estilo = compacta ? 'normal' : 'bold'
  const enunciado = lineas(doc, it.enunciado, PT, izq - we - 3, estilo)
  if (!medir) {
    if (compacta) {
      doc.text(etiqueta, X, c.y, { baseline: 'top' })
    } else {
      doc.setFillColor(35, 35, 35)
      doc.roundedRect(X, c.y - 0.8, we, 6, 1.6, 1.6, 'F')
      doc.setTextColor(255)
      doc.text(etiqueta, X + 2.5, c.y + 2.2, { baseline: 'middle' })
      doc.setTextColor(0)
    }
  }
  const yTexto = c.y
  if (medir) c.y += enunciado.length * alto(PT)
  else escribir(c, enunciado, PT, X + we + 3, estilo)
  c.y = Math.max(c.y, yTexto + (compacta ? 0 : 6))

  if (it.dibujo) {
    const m = medidas(it.dibujo, izq - 8, compacta ? 55 : 75)
    c.y += 2.5
    if (!medir) doc.addImage(c.imagenes.get(it.dibujo.svg)!, 'PNG', X + 4, c.y, m.w, m.h, undefined, 'FAST')
    c.y += m.h + 2
  }
  if (it.pregunta) {
    const ls = lineas(doc, it.pregunta, PT, izq)
    c.y += 1.5
    if (medir) c.y += ls.length * alto(PT)
    else escribir(c, ls, PT, X)
  }

  if (conRecuadro) {
    const abajo = Math.max(c.y + 2, y0 + 40)
    if (!medir) {
      const x = X + izq + 4
      doc.setDrawColor(140)
      doc.roundedRect(x, y0 - 1, ancho - izq - 4, abajo - y0 + 1, 2, 2, 'S')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(110)
      doc.text('Procedimiento', x + 2.5, y0 + 1, { baseline: 'top' })
      doc.setTextColor(0)
    }
    c.y = abajo
    lineaRespuesta(c, X, medir)
  } else if (it.forma === 'opciones') {
    c.y += compacta ? 1.5 : 2.5
    const col = enFila(doc, it.alternativas, ancho)
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
    // En el balotario se resuelve en el cuaderno: sin espacio.
    if (compacta) {
      // nada
    } else if (it.espacio === 'linea' || it.espacio === 'procedimiento') {
      lineaRespuesta(c, X, medir)
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
  c.y += compacta ? 3.5 : 5
  const h = c.y - y0
  if (medir) c.y = y0
  return h
}

/** «Recuerda»: la idea del tema y un ejemplo resuelto, en un recuadro gris (o lo mide). */
function recuerda(c: Ctx, t: Teoria, medir: boolean): number {
  const { doc } = c
  const y0 = c.y
  const w = W - 10
  const bloques: [string[], number, 'normal' | 'bold'][] = [
    [lineas(doc, 'Recuerda', 12.5, w, 'bold'), 12.5, 'bold'],
    [lineas(doc, t.idea, PT, w), PT, 'normal'],
    [lineas(doc, `Ejemplo: ${t.ejemplo.enunciado}`, PT, w), PT, 'normal'],
    ...t.ejemplo.pasos.map((p): [string[], number, 'normal'] => [lineas(doc, p, PT, w - 4), PT, 'normal']),
    [lineas(doc, `Respuesta: ${t.ejemplo.respuesta}`, PT, w - 4, 'bold'), PT, 'bold'],
  ]
  const h = 8 + bloques.reduce((s, [ls, pt]) => s + ls.length * alto(pt) + 1, 0)
  if (medir) return h
  doc.setFillColor(243, 243, 243)
  doc.setDrawColor(190)
  doc.roundedRect(MARGEN, c.y, W, h, 2.5, 2.5, 'FD')
  c.y += 4
  bloques.forEach(([ls, pt, estilo], k) => {
    escribir(c, ls, pt, MARGEN + 5 + (k > 2 ? 4 : 0), estilo)
    c.y += 1
  })
  c.y = y0 + h + 4
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

/** Lo que va en la clave para cada pregunta. */
export function respuestaDe(it: Item): string {
  if (it.forma === 'opciones') return `${letra(it.correcta)}) ${it.alternativas[it.correcta]}`
  if (it.forma === 'abierta') return it.respuesta
  if (it.forma === 'unir') return it.izquierda.map((a, k) => `${a} -> ${it.derecha[it.solucion[k]]}`).join(' · ')
  return it.respuestas.map((r, k) => `${k + 1}. ${r}`).join(' · ')
}

/** La respuesta en pocas letras, para la tabla de arriba de la clave: la letra, o el valor si es corto. */
function respuestaCorta(doc: JsPDF, it: Item, ancho: number) {
  if (it.forma === 'opciones') return letra(it.correcta)
  if (it.forma !== 'abierta') return 'abajo'
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(PT)
  const r = limpiar(it.respuesta)
  return doc.getTextWidth(r) <= ancho ? r : 'abajo'
}

function clave(c: Ctx, d: DatosPdf, v: Version) {
  const { doc } = c
  encabezado(c, d, v, true)
  const grupos = porTema(v, d.temas.map((t) => t.tema))
  const numerados = grupos.flatMap((g) => g.items)

  // 1. La tabla de respuestas: para corregir mirando solo esto.
  const porFila = 5
  const col = W / porFila
  const filas = Math.ceil(numerados.length / porFila)
  const hFila = 8
  doc.setDrawColor(190)
  doc.roundedRect(MARGEN, c.y, W, filas * hFila + 4, 2, 2, 'S')
  numerados.forEach((it, i) => {
    const x = MARGEN + 4 + (i % porFila) * col
    const y = c.y + 2 + Math.floor(i / porFila) * hFila + hFila / 2
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10.5)
    doc.setTextColor(90)
    doc.text(`${i + 1}.`, x, y, { baseline: 'middle' })
    doc.setTextColor(0)
    const corta = respuestaCorta(doc, it, col - 11)
    doc.setFont('helvetica', corta === 'abajo' ? 'normal' : 'bold')
    doc.setFontSize(corta === 'abajo' ? 9.5 : PT)
    if (corta === 'abajo') doc.setTextColor(110)
    doc.text(corta === 'abajo' ? 'ver abajo' : corta, x + 7, y, { baseline: 'middle' })
    doc.setTextColor(0)
  })
  c.y += filas * hFila + 10

  // 2. Por pregunta: la respuesta y, debajo, los pasos como se escribirían en la pizarra.
  let n = 0
  grupos.forEach((g, k) => {
    if (d.subtitulos) {
      if (c.y + 20 > LIMITE) nuevaPagina(c)
      escribir(c, lineas(doc, `${ROMANOS[k] ?? k + 1}. ${g.tema}`, 13, W, 'bold'), 13, MARGEN, 'bold')
      c.y += 1.5
    }
    for (const it of g.items) {
      n++
      const r = lineas(doc, `${n}. ${respuestaDe(it)}`, 12, W - 4, 'bold')
      const pasos = [...(it.pasos ?? []), ...(it.nota ? [it.nota] : [])].map((p) => lineas(doc, p, PT, W - 12))
      const h = r.length * alto(12) + pasos.reduce((s, ls) => s + ls.length * alto(PT), 0) + 5
      if (c.y + h > LIMITE) nuevaPagina(c)
      escribir(c, r, 12, MARGEN, 'bold')
      for (const ls of pasos) escribir(c, ls, PT, MARGEN + 7)
      c.y += 3.5
    }
  })

  // 3. Qué evalúa: el desempeño de cada tipo, citado tal cual. Sirve para el registro y para el director.
  const vistos = new Map<string, { numeros: number[]; competencia?: string }>()
  numerados.forEach((it, i) => {
    const s = d.sustento(it.tema, it.tipo)
    if (!s.cita) return
    const antes = vistos.get(s.cita)
    vistos.set(s.cita, { numeros: [...(antes?.numeros ?? []), i + 1], competencia: s.competencia })
  })
  if (!vistos.size) return
  c.y += 4
  if (c.y + 20 > LIMITE) nuevaPagina(c)
  escribir(c, lineas(doc, 'Qué evalúa cada pregunta (Currículo Nacional, texto oficial del MINEDU)', PT, W, 'bold'), PT, MARGEN, 'bold')
  c.y += 1
  for (const [cita, { numeros, competencia }] of vistos) {
    const ls = lineas(doc, `${numeros.length > 1 ? 'Preguntas' : 'Pregunta'} ${numeros.join(', ')}${competencia ? ` · Competencia «${competencia}»` : ''}: «${cita}»`, 10.5, W - 4)
    if (c.y + ls.length * alto(10.5) > LIMITE) nuevaPagina(c)
    escribir(c, ls, 10.5, MARGEN + 2)
    c.y += 2
  }
}

/** La hoja del alumno (una o dos versiones) o su clave, en un solo PDF. */
export async function pdfHoja(d: DatosPdf, { clave: conClave = false } = {}): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const imagenes = new Map<string, string>()
  if (!conClave) {
    const dibujos = [...new Map(d.versiones.flatMap((v) => v.items.flatMap((it) => (it.dibujo ? [[it.dibujo.svg, it.dibujo] as const] : [])))).values()]
    await Promise.all(dibujos.map(async (x) => imagenes.set(x.svg, await aPng(x))))
  }
  const c: Ctx = { doc, y: ARRIBA, imagenes, pie: '' }
  d.versiones.forEach((v, nv) => {
    if (nv > 0) {
      pie(c)
      doc.addPage()
      c.y = ARRIBA
    }
    c.pie = limpiar(`Hecho con Supermentes · supermentes.app · ${[v.fila, `Versión ${v.codigo}`].filter(Boolean).join(' · ')}`)
    if (conClave) return clave(c, d, v)
    encabezado(c, d, v, false)
    let n = 0
    porTema(v, d.temas.map((t) => t.tema)).forEach((g, k) => {
      const teoria = d.clase === 'practica' ? d.temas.find((t) => t.tema === g.tema)?.teoria : null
      const titulo = d.subtitulos ? lineas(doc, `${ROMANOS[k] ?? k + 1}. ${g.tema}`, 13.5, W, 'bold') : []
      // El subtítulo y el «Recuerda» van en la misma página que la primera pregunta del tema.
      const antes = titulo.length * alto(13.5) + (titulo.length ? 2 : 0) + (teoria ? recuerda(c, teoria, true) + 4 : 0)
      if (c.y + antes + pregunta(c, g.items[0], n + 1, d.clase, true) > LIMITE && c.y > ARRIBA + 10) nuevaPagina(c)
      if (titulo.length) {
        escribir(c, titulo, 13.5, MARGEN, 'bold')
        c.y += 2
      }
      if (teoria) recuerda(c, teoria, false)
      g.items.forEach((it, i) => {
        n++
        const h = pregunta(c, it, n, d.clase, true)
        if (c.y + h > LIMITE && c.y > ARRIBA + 10) nuevaPagina(c)
        pregunta(c, it, n, d.clase, false)
        if (i < g.items.length - 1) {
          doc.setDrawColor(225)
          doc.line(MARGEN, c.y - 2.5, ANCHO - MARGEN, c.y - 2.5)
        }
      })
      c.y += 3
    })
    if (d.clase !== 'balotario') autoevaluacion(c)
  })
  pie(c)
  return doc.output('blob')
}
