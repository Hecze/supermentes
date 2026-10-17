import type { Examen } from '../api'

// Arma el PDF del examen adaptado en el navegador (jsPDF se descarga solo al pedir el PDF).
// El formato también se adapta: letra más grande y más espacio para quien le cuesta leer,
// un cuadrito por pregunta para quien le cuesta concentrarse.

const ANCHO = 210
const ALTO = 297
const MARGEN = 20
const LIMITE = ALTO - 18
const MM_POR_PT = 0.3528

// La fuente estándar del PDF no trae estos caracteres.
const REEMPLAZOS: [RegExp, string][] = [
  [/≤/g, '<='],
  [/≥/g, '>='],
  [/≠/g, 'distinto de'],
  [/π/g, 'pi'],
  [/√/g, 'raíz de '],
  [/[“”«»]/g, '"'],
  [/[‘’]/g, "'"],
  [/[▢□☐]/g, '__'],
  [/→/g, '->'],
  [/…/g, '...'],
  [/[–—]/g, '-'],
  [/ /g, ' '],
]

const limpiar = (s: string) => REEMPLAZOS.reduce((t, [re, por]) => t.replace(re, por), s)

export const nombreArchivo = (titulo: string, sufijo: string) =>
  `${titulo
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'examen'}-${sufijo}.pdf`

export async function pdfExamen(examen: Examen, grado: string, { respuestas = false } = {}): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const n = examen.opciones.necesidades
  const grande = n.includes('dislexia') || n.includes('facil')
  const casilla = n.includes('tdah')
  const tam = grande ? 14 : 12
  const interlineado = grande ? 1.75 : 1.4
  const ancho = ANCHO - 2 * MARGEN
  let y = MARGEN

  const linea = (pt: number) => pt * MM_POR_PT * interlineado
  const lineas = (texto: string, pt: number, w = ancho, estilo: 'normal' | 'bold' = 'normal') => {
    doc.setFont('helvetica', estilo)
    doc.setFontSize(pt)
    return doc.splitTextToSize(limpiar(texto), w) as string[]
  }
  const pie = () => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(130)
    doc.text('Hecho con Supermentes · supermentes.app', MARGEN, ALTO - 10)
    doc.text(`Página ${doc.getNumberOfPages()}`, ANCHO - MARGEN, ALTO - 10, { align: 'right' })
    doc.setTextColor(0)
  }
  const pagina = (alto: number) => {
    if (y + alto <= LIMITE) return
    pie()
    doc.addPage()
    y = MARGEN
  }
  const escribir = (ls: string[], pt: number, x = MARGEN, estilo: 'normal' | 'bold' = 'normal') => {
    doc.setFont('helvetica', estilo)
    doc.setFontSize(pt)
    for (const l of ls) {
      pagina(linea(pt))
      doc.text(l, x, y, { baseline: 'top' })
      y += linea(pt)
    }
  }

  // Encabezado
  escribir(lineas(respuestas ? `Respuestas: ${examen.titulo}` : examen.titulo, tam + 8, ancho, 'bold'), tam + 8, MARGEN, 'bold')
  y += 2
  if (respuestas) {
    escribir(lineas('Solo para el docente.', tam), tam)
  } else {
    escribir(lineas('Nombre: ________________________________________', tam), tam)
    escribir(lineas(`Grado: ${grado}      Fecha: ______________`, tam), tam)
    y += 3
    const ins = lineas(examen.instrucciones, tam, ancho - 8)
    const alto = ins.length * linea(tam) + 6
    pagina(alto)
    doc.setFillColor(242, 242, 242)
    doc.roundedRect(MARGEN, y, ancho, alto, 2, 2, 'F')
    y += 3
    escribir(ins, tam, MARGEN + 4)
    y += 3
  }
  y += grande ? 6 : 4

  examen.preguntas.forEach((p, i) => {
    const etiqueta = `${examen.etiquetaPaso} ${i + 1}`
    if (respuestas) {
      const ls = lineas(`${etiqueta}: ${p.respuesta}`, tam)
      pagina(ls.length * linea(tam) + 2)
      escribir(ls, tam)
      y += 2
      return
    }

    const texto = lineas(p.texto, tam)
    const alternativas = (p.alternativas ?? []).map((a, k) => lineas(`${String.fromCharCode(97 + k)}) ${a}`, tam, ancho - 8))
    const apoyo = p.apoyo ? lineas(`Ayuda: ${p.apoyo}`, tam - 1, ancho - 8) : []
    const renglones = alternativas.length ? 0 : grande ? 3 : 2
    const separacion = grande ? 11 : 9
    const alto =
      linea(tam) +
      texto.length * linea(tam) +
      alternativas.reduce((h, a) => h + a.length * linea(tam) + 1, 0) +
      (apoyo.length ? apoyo.length * linea(tam - 1) + 6 : 0) +
      renglones * separacion +
      (casilla ? 8 : 6)
    // Una pregunta nunca se parte entre dos páginas.
    pagina(Math.min(alto, LIMITE - MARGEN))

    doc.setTextColor(60)
    escribir([etiqueta], tam, MARGEN, 'bold')
    doc.setTextColor(0)
    if (casilla) {
      doc.setDrawColor(60)
      doc.rect(ANCHO - MARGEN - 6, y - linea(tam), 6, 6)
      doc.setFontSize(8)
      doc.text('Listo', ANCHO - MARGEN - 8, y - linea(tam) + 3, { align: 'right', baseline: 'middle' })
    }
    escribir(texto, tam)

    alternativas.forEach((a) => {
      y += 1
      doc.setDrawColor(60)
      doc.circle(MARGEN + 2.5, y + tam * MM_POR_PT * 0.55, 1.8)
      escribir(a, tam, MARGEN + 8)
    })

    if (apoyo.length) {
      y += 2
      const h = apoyo.length * linea(tam - 1) + 4
      doc.setDrawColor(170)
      doc.setLineDashPattern([1, 1], 0)
      doc.roundedRect(MARGEN, y, ancho, h, 1.5, 1.5, 'S')
      doc.setLineDashPattern([], 0)
      y += 2
      escribir(apoyo, tam - 1, MARGEN + 4)
      y += 2
    }

    doc.setDrawColor(150)
    for (let r = 0; r < renglones; r++) {
      y += separacion
      doc.line(MARGEN, y, ANCHO - MARGEN, y)
    }
    y += casilla ? 8 : 6
    if (casilla && i < examen.preguntas.length - 1) {
      doc.setDrawColor(220)
      doc.line(MARGEN, y - 3, ANCHO - MARGEN, y - 3)
    }
  })

  pie()
  return doc.output('blob')
}
