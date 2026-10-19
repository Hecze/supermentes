// El encabezado de los documentos (hojas de ejercicios, sesión de aprendizaje, crucigrama, pupiletras): el colegio
// donde enseña ese grado y curso, con su N.º de I.E. y su logo, y el nombre de la docente. Sale de "Mi perfil".
import { cursoPorId } from '../curriculo/catalogo'
import { colegioActivo, useColegios, usePerfil, type Colegio } from './perfil'

export type DatosDocumento = {
  /** "I.E. N.º 2048 «José Carlos Mariátegui»", el nombre solo o vacío. */
  institucion: string
  docente: string
  logo?: string
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
  return { institucion: rotuloColegio(c), docente: perfil?.nombre ?? '', logo: c?.logo }
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

/** Achica la imagen que sube la docente a un logo de hasta 256 px (PNG, conserva el fondo transparente). */
export async function logoDesdeArchivo(archivo: File): Promise<string | null> {
  if (!archivo.type.startsWith('image/')) return null
  const url = URL.createObjectURL(archivo)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    for (const lado of [256, 192, 128]) {
      const escala = Math.min(1, lado / Math.max(img.naturalWidth, img.naturalHeight))
      const c = document.createElement('canvas')
      c.width = Math.max(1, Math.round(img.naturalWidth * escala))
      c.height = Math.max(1, Math.round(img.naturalHeight * escala))
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      const png = c.toDataURL('image/png')
      if (png.length <= 200_000) return png
    }
    return null
  } catch {
    return null
  } finally {
    URL.revokeObjectURL(url)
  }
}
