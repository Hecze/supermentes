// Una hoja de la pantalla (la sesión de aprendizaje) como .docx de verdad: lo abren Word, LibreOffice, WPS y Google
// Docs, con el logo del colegio adentro. Se recorre la hoja tal como se ve (textos, negritas, tablas, viñetas e
// imágenes) y se arma el documento con la librería docx, que se carga solo al descargar.
import type { FileChild, IParagraphOptions, ParagraphChild } from 'docx'

type Docx = typeof import('docx')

const INLINE = /^inline/
const OCULTO = (el: Element) => el.tagName === 'BUTTON' || el.classList.contains('print:hidden') || getComputedStyle(el).display === 'none'

/** "rgb(23, 32, 49)" → "172031"; transparente → null. */
function hex(color: string): string | null {
  const m = color.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/)
  if (!m || (m[4] !== undefined && Number(m[4]) < 0.05)) return null
  return [m[1], m[2], m[3]].map((x) => Math.round(Number(x)).toString(16).padStart(2, '0')).join('').toUpperCase()
}

function bytes(dataUrl: string): { datos: Uint8Array; tipo: 'png' | 'jpg' | 'gif' | 'bmp' } | null {
  const m = dataUrl.match(/^data:image\/(png|jpeg|jpg|gif|bmp);base64,(.+)$/)
  if (!m) return null
  const bin = atob(m[2])
  const datos = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) datos[i] = bin.charCodeAt(i)
  return { datos, tipo: m[1] === 'jpeg' ? 'jpg' : (m[1] as 'png' | 'jpg' | 'gif' | 'bmp') }
}

function armador(d: Docx) {
  const imagen = (img: HTMLImageElement): ParagraphChild | null => {
    const b = bytes(img.currentSrc || img.src)
    if (!b) return null
    const r = img.getBoundingClientRect()
    const alto = Math.round(r.height || img.naturalHeight || 64)
    const ancho = Math.round(r.width || (alto * img.naturalWidth) / Math.max(1, img.naturalHeight))
    return new d.ImageRun({ type: b.tipo, data: b.datos, transformation: { width: ancho, height: alto } })
  }

  /** Los textos de esos nodos con su formato (negrita, cursiva, tamaño, color), en una sola línea de párrafo. */
  const textos = (nodos: Iterable<Node>, salida: ParagraphChild[] = []): ParagraphChild[] => {
    for (const n of nodos) {
      if (n.nodeType === Node.TEXT_NODE) {
        const texto = (n.textContent ?? '').replace(/\s+/g, ' ')
        if (!texto) continue
        const e = getComputedStyle(n.parentElement!)
        const color = hex(e.color)
        salida.push(
          new d.TextRun({
            text: texto,
            bold: Number(e.fontWeight) >= 600,
            italics: e.fontStyle === 'italic',
            size: Math.round(parseFloat(e.fontSize) * 1.5),
            color: color && color !== '000000' ? color : undefined,
          }),
        )
      } else if (n instanceof HTMLElement && !OCULTO(n)) {
        if (n.tagName === 'BR') salida.push(new d.TextRun({ text: '', break: 1 }))
        else if (n instanceof HTMLImageElement) {
          const i = imagen(n)
          if (i) salida.push(i)
        } else textos(n.childNodes, salida)
      }
    }
    return salida
  }

  const alineacion = (el: Element) => {
    const a = getComputedStyle(el).textAlign
    return a === 'center' ? d.AlignmentType.CENTER : a === 'right' || a === 'end' ? d.AlignmentType.RIGHT : undefined
  }

  const parrafo = (el: Element, extra: IParagraphOptions = {}) =>
    new d.Paragraph({ children: textos(el.childNodes), alignment: alineacion(el), spacing: { after: 80 }, ...extra })

  const soloEnLinea = (el: Element) =>
    [...el.children].every((h) => OCULTO(h) || h.tagName === 'BR' || INLINE.test(getComputedStyle(h).display))

  const tabla = (el: HTMLTableElement): FileChild =>
    new d.Table({
      width: { size: 100, type: d.WidthType.PERCENTAGE },
      rows: [...el.rows].map(
        (tr) =>
          new d.TableRow({
            children: [...tr.cells].map((celda) => {
              const fondo = hex(getComputedStyle(celda).backgroundColor)
              const hijos = bloques(celda).filter((b): b is InstanceType<Docx['Paragraph']> => b instanceof d.Paragraph)
              return new d.TableCell({
                children: hijos.length ? hijos : [new d.Paragraph('')],
                columnSpan: celda.colSpan > 1 ? celda.colSpan : undefined,
                shading: fondo && fondo !== 'FFFFFF' ? { fill: fondo, type: d.ShadingType.CLEAR, color: 'auto' } : undefined,
                margins: { top: 60, bottom: 60, left: 80, right: 80 },
              })
            }),
          }),
      ),
    })

  /** Los bloques de un elemento: párrafos, tablas, viñetas e imágenes, en orden. */
  function bloques(el: Element): FileChild[] {
    if (soloEnLinea(el)) return el.textContent?.trim() || el.querySelector('img') ? [parrafo(el)] : []
    const salida: FileChild[] = []
    let enLinea: Node[] = []
    // Textos sueltos entre bloques: un párrafo con ellos.
    const cerrar = () => {
      const children = textos(enLinea)
      if (children.length && enLinea.some((n) => n.textContent?.trim() || n instanceof HTMLImageElement))
        salida.push(new d.Paragraph({ children, alignment: alineacion(el), spacing: { after: 80 } }))
      enLinea = []
    }
    el.childNodes.forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) return void enLinea.push(n)
      if (!(n instanceof HTMLElement) || OCULTO(n)) return
      if (INLINE.test(getComputedStyle(n).display) || n.tagName === 'BR') return void enLinea.push(n)
      cerrar()
      if (n.hasAttribute('data-salto')) salida.push(new d.Paragraph({ children: [new d.PageBreak()] }))
      if (n instanceof HTMLTableElement) salida.push(tabla(n), new d.Paragraph({ spacing: { after: 80 } }))
      else if (n.tagName === 'UL' || n.tagName === 'OL')
        [...n.children].forEach((li) => !OCULTO(li) && salida.push(parrafo(li, { numbering: { reference: 'vinetas', level: 0 } })))
      else if (n instanceof HTMLImageElement) {
        const i = imagen(n)
        if (i) salida.push(new d.Paragraph({ children: [i], alignment: alineacion(el) }))
      } else salida.push(...bloques(n))
    })
    cerrar()
    return salida
  }

  return bloques
}

/** La hoja como .docx (A4, márgenes de 2 cm, Arial 11). */
export async function hojaADocx(hoja: HTMLElement, titulo: string): Promise<Blob> {
  const d = await import('docx')
  const bloques = armador(d)
  const documento = new d.Document({
    title: titulo,
    creator: 'Supermentes',
    styles: { default: { document: { run: { font: 'Arial', size: 22 } } } },
    numbering: {
      config: [
        {
          reference: 'vinetas',
          levels: [{ level: 0, format: d.LevelFormat.BULLET, text: '•', alignment: d.AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 240 } } } }],
        },
      ],
    },
    sections: [
      {
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } } },
        children: bloques(hoja),
      },
    ],
  })
  return d.Packer.toBlob(documento)
}
