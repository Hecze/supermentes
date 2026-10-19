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
const incrustadas = new Map<string, Promise<string>>()

/** Una imagen del dibujo (un billete, una moneda) como data URL: un SVG pasado a imagen no carga archivos de afuera. */
function aDataUrl(url: string): Promise<string> {
  if (!incrustadas.has(url))
    incrustadas.set(
      url,
      fetch(url)
        .then((r) => r.blob())
        .then(
          (b) =>
            new Promise<string>((listo, falla) => {
              const lector = new FileReader()
              lector.onload = () => listo(lector.result as string)
              lector.onerror = falla
              lector.readAsDataURL(b)
            }),
        ),
    )
  return incrustadas.get(url)!
}

async function conImagenes(svg: string) {
  const urls = [...new Set([...svg.matchAll(/<image[^>]* href="([^"]+)"/g)].map((m) => m[1]).filter((u) => !u.startsWith('data:')))]
  let listo = svg
  for (const u of urls) listo = listo.split(`href="${u}"`).join(`href="${await aDataUrl(u)}"`)
  return listo
}

async function aPng(d: Dibujo, escala = 3): Promise<string> {
  const img = new Image()
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(await conImagenes(d.svg))}`
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
  /** El logo del colegio (de "Mi perfil"), cuadrado. */
  logo?: { url: string; ancho: number; alto: number } | null
  /** El lema del colegio, al pie de cada página junto a su nombre. */
  lema?: string
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

type Ctx = { doc: JsPDF; y: number; imagenes: Map<string, string>; pie: string; colegio: string; lema: string }

function nuevaPagina(c: Ctx) {
  pie(c)
  c.doc.addPage()
  c.y = ARRIBA
}

/** El pie y el marco de cada página: el colegio a la izquierda y su lema a la derecha, dentro del marco. */
function pie(c: Ctx) {
  const { doc } = c
  doc.setDrawColor(0)
  doc.setLineWidth(0.35)
  doc.rect(8.5, 8.5, ANCHO - 17, ALTO - 17, 'S')
  doc.setLineWidth(0.2)
  const y = ALTO - 11.5
  if (c.colegio || c.lema) {
    doc.setTextColor(0)
    doc.setFontSize(7.5)
    doc.setFont('courier', 'bold')
    if (c.colegio) doc.text(limpiar(may(c.colegio)), 12, y, { charSpace: 0.3 })
    doc.setFont('helvetica', 'normal')
    if (c.lema) doc.text(limpiar(`"${may(c.lema)}"`), ANCHO - 12, y, { align: 'right' })
  } else {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(110)
    doc.text('Hecho con Supermentes · supermentes.app', 12, y)
  }
  // La versión y la página, chiquitas y fuera del marco.
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(140)
  doc.text(c.pie, 8.5, ALTO - 5)
  doc.text(`Página ${doc.getNumberOfPages()}`, ANCHO - 8.5, ALTO - 5, { align: 'right' })
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

/** Una línea punteada para escribir a mano, de `x0` a `x1`. */
function punteada(doc: JsPDF, x0: number, x1: number, y: number) {
  doc.setDrawColor(90)
  doc.setLineDashPattern([0.3, 0.7], 0)
  doc.line(x0, y, x1, y)
  doc.setLineDashPattern([], 0)
}

const CLASE: Record<Clase, string> = { examen: 'Examen', practica: 'Práctica', balotario: 'Balotario' }
const may = (t: string) => t.toLocaleUpperCase('es-PE')

/**
 * El encabezado, como el de las hojas de los colegios: el logo a la izquierda y el título (letra con serifa, en
 * mayúsculas) en la misma fila; el recuadro punteado de la nota arriba a la derecha (en el examen); debajo, apellidos y
 * nombres, grado, tema, fecha, profesor y «¡Ten presente!»; y una raya gruesa. El colegio y su lema van al pie.
 */
function encabezado(c: Ctx, d: DatosPdf, v: Version, clave: boolean) {
  const { doc } = c
  const y0 = c.y
  const conNota = d.clase === 'examen' && !clave
  const LOGO = 25
  const xL = MARGEN + (d.logo ? LOGO + 3 : 0)
  const xR = ANCHO - MARGEN - (conNota ? 26 : 0)

  if (d.logo) {
    try {
      doc.addImage(d.logo.url, d.logo.url.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG', MARGEN - 1, y0 - 2, LOGO, LOGO)
    } catch {
      // Un logo que no se puede leer no impide bajar la hoja.
    }
  }
  if (conNota) {
    doc.setDrawColor(0)
    doc.setLineWidth(0.4)
    doc.setLineDashPattern([1.4, 0.9], 0)
    doc.rect(ANCHO - MARGEN - 21, y0, 21, 23, 'S')
    doc.setLineDashPattern([], 0)
    doc.setLineWidth(0.2)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(40)
    doc.text('N O T A', ANCHO - MARGEN - 10.5, y0 + 27, { align: 'center' })
  }

  // El título: «EXAMEN DE MATEMÁTICA», en la fila del logo y centrado entre el logo y la nota.
  doc.setTextColor(0)
  const titulo = may(clave ? `Clave del ${CLASE[d.clase].toLowerCase()} de ${d.curso}` : `${CLASE[d.clase]} de ${d.curso}`)
  doc.setFont('times', 'bold')
  doc.setFontSize(20)
  const ls = doc.splitTextToSize(titulo, xR - xL) as string[]
  let y = y0 + Math.max(0, (21 - ls.length * alto(20, 1.1)) / 2)
  for (const l of ls) {
    doc.text(l, (xL + xR) / 2, y, { baseline: 'top', align: 'center' })
    y += alto(20, 1.1)
  }

  // Los datos, debajo del logo: letra chica, como en el ejemplo.
  const x = MARGEN + (d.logo ? 13 : 0)
  y = Math.max(y + 3, y0 + (d.logo || conNota ? 30 : 6))
  const PTD = 9.5
  const paso = alto(PTD, 1.35)
  doc.setFontSize(PTD)
  doc.setTextColor(20)
  const fila = (partes: [string, 'bold' | 'normal'][]) => {
    let xi = x
    for (const [t, estilo] of partes) {
      doc.setFont('helvetica', estilo)
      doc.text(t, xi, y, { baseline: 'bottom' })
      xi += doc.getTextWidth(t)
    }
    return xi
  }
  if (!clave) {
    const fin = fila([['Apellidos y Nombres', 'bold'], [': ', 'normal']])
    punteada(doc, fin, ANCHO - MARGEN - 26, y)
    y += paso
  }
  const finGrado = fila([['Grado: ', 'normal'], [d.grado, 'normal']])
  if (!clave) {
    const xf = Math.max(finGrado + 14, x + 70)
    doc.setFont('helvetica', 'normal')
    const etiqueta = d.clase === 'balotario' ? 'Para el examen del:' : 'Fecha:'
    doc.text(etiqueta, xf, y, { baseline: 'bottom' })
    doc.text('______ / ______ / ________', xf + doc.getTextWidth(etiqueta) + 3, y, { baseline: 'bottom' })
  }
  if (v.fila) {
    doc.setFont('helvetica', 'bold')
    doc.text(v.fila, ANCHO - MARGEN, y, { baseline: 'bottom', align: 'right' })
  }
  y += paso
  const temas = d.temas.map((t) => t.tema)
  if (temas.length <= 2) {
    doc.setFont('helvetica', 'normal')
    for (const l of (doc.splitTextToSize(`Tema: ${temas.join(' · ')}`, ANCHO - MARGEN - x) as string[]).slice(0, 2)) {
      doc.text(l, x, y, { baseline: 'bottom' })
      y += paso
    }
  }
  if (d.docente.trim()) {
    fila([['Profesor(a): ', 'normal'], [may(d.docente.trim()), 'normal']])
    y += paso
  }
  if (!clave) {
    fila([['¡TEN PRESENTE! ', 'bold'], ['Lee atentamente las indicaciones que ofrece cada pregunta.', 'normal']])
    y += paso
  } else {
    fila([['Solo para el docente.', 'bold']])
    y += paso
  }

  // La raya gruesa que separa el encabezado de las preguntas.
  y += 1.5
  doc.setDrawColor(0)
  doc.setLineWidth(0.7)
  doc.line(MARGEN + 2, y, ANCHO - MARGEN - 2, y)
  doc.setLineWidth(0.2)
  doc.setTextColor(0)
  c.y = y + 7
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

  // El número, como en cualquier examen ("1."), y al lado lo que hay que hacer.
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(PT)
  const etiqueta = `${n}.`
  const we = doc.getTextWidth(etiqueta) + 1.5
  const estilo = compacta ? 'normal' : 'bold'
  const enunciado = lineas(doc, it.enunciado, PT, izq - we - 3, estilo)
  if (!medir) doc.text(etiqueta, X, c.y, { baseline: 'top' })
  if (medir) c.y += enunciado.length * alto(PT)
  else escribir(c, enunciado, PT, X + we + 3, estilo)

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
    const corta = respuestaCorta(doc, it, col - 13)
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
  const c: Ctx = { doc, y: ARRIBA, imagenes, pie: '', colegio: d.colegio.trim(), lema: d.lema?.trim() ?? '' }
  d.versiones.forEach((v, nv) => {
    if (nv > 0) {
      pie(c)
      doc.addPage()
      c.y = ARRIBA
    }
    c.pie = limpiar([v.fila, `Versión ${v.codigo}`].filter(Boolean).join(' · '))
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
    creditos(c, v)
  })
  pie(c)
  return doc.output('blob')
}

/** Al final de la hoja, de quién son las fotos y las imágenes del dinero (lo piden sus licencias), en letra chica. */
function creditos(c: Ctx, v: Version) {
  const lista = [...new Set(v.items.flatMap((it) => (it.dibujo?.credito ? [it.dibujo.credito] : [])))]
  if (!lista.length) return
  const { doc } = c
  const ls = lineas(doc, `Imágenes: ${lista.join(' · ')}.`, 7.5, W)
  if (c.y + ls.length * alto(7.5) + 2 > LIMITE) nuevaPagina(c)
  doc.setTextColor(120)
  escribir(c, ls, 7.5)
  doc.setTextColor(0)
}
