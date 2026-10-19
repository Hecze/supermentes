// El encabezado de los documentos (hojas de ejercicios, sesión de aprendizaje, crucigrama, pupiletras): el colegio
// donde enseña ese grado y curso, con su N.º de I.E. y su logo, y el nombre de la docente. Sale de "Mi perfil".
import { cursoPorId } from '../curriculo/catalogo'
import { colegioActivo, useColegios, usePerfil, type Colegio } from './perfil'

export type DatosDocumento = {
  /** "I.E. N.º 2048 «José Carlos Mariátegui»", el nombre solo o vacío. */
  institucion: string
  docente: string
  logo?: string
  /** El lema del colegio, para el pie de las hojas. */
  lema?: string
}

/** Cómo se escribe el colegio en un documento. */
export function rotuloColegio(c: Pick<Colegio, 'nombre' | 'numero'> | undefined): string {
  const nombre = c?.nombre.trim() ?? ''
  const numero = c?.numero?.trim() ?? ''
  if (numero && nombre) return `I.E. N.º ${numero} «${nombre}»`
  if (numero) return `I.E. N.º ${numero}`
  return nombre
}

/** El colegio donde enseña ese grado y curso; si no hay uno así, el que usó la última vez. */
export function colegioPara(colegios: Colegio[], gradoId?: string, areaId?: string): Colegio | undefined {
  const cubre = (c: Colegio) => !c.cursos.length || c.cursos.some((id) => !areaId || cursoPorId(id)?.areas.includes(areaId))
  return colegios.find((c) => (!gradoId || c.grados.includes(gradoId)) && cubre(c)) ?? colegios[colegioActivo()] ?? colegios[0]
}

/** Datos del encabezado para un tema (su grado y curso), al día con "Mi perfil". */
export function useDatosDocumento(tema: { gradoId: string; areaId: string } | null): DatosDocumento {
  const colegios = useColegios()
  const { perfil } = usePerfil()
  const c = colegioPara(colegios, tema?.gradoId, tema?.areaId)
  return { institucion: rotuloColegio(c), docente: perfil?.nombre ?? '', logo: c?.logo, lema: c?.lema }
}

/** Ancho y alto de una imagen (para ubicar el logo en el PDF sin deformarlo). */
export async function medirImagen(url: string): Promise<{ url: string; ancho: number; alto: number } | null> {
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return { url, ancho: img.naturalWidth, alto: img.naturalHeight }
  } catch {
    return null
  }
}

/** La imagen que eligió la docente, lista para medirla y recortarla (null si no es una imagen). */
export async function cargarImagen(archivo: File): Promise<HTMLImageElement | null> {
  if (!archivo.type.startsWith('image/')) return null
  const img = new Image()
  img.src = URL.createObjectURL(archivo)
  try {
    await img.decode()
    return img
  } catch {
    return null
  }
}

export const esCuadrada = (img: HTMLImageElement) => Math.abs(img.naturalWidth - img.naturalHeight) <= Math.max(img.naturalWidth, img.naturalHeight) * 0.02

/**
 * El logo: el cuadrado de la imagen que empieza en (x, y) y mide `lado` (en píxeles de la imagen), a 256 px en PNG
 * (conserva el fondo transparente). Si pesa mucho, más chico.
 */
export function logoRecortado(img: HTMLImageElement, x: number, y: number, lado: number): string | null {
  for (const px of [256, 192, 128]) {
    const c = document.createElement('canvas')
    c.width = c.height = px
    c.getContext('2d')!.drawImage(img, x, y, lado, lado, 0, 0, px, px)
    const png = c.toDataURL('image/png')
    if (png.length <= 200_000) return png
  }
  return null
}
