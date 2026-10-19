// Más recursos: material oficial que ya existe en internet (libros y cuadernos del MINEDU, exámenes de la UMC,
// normas y guías para el docente). Nada inventado ni resumido: se enlaza la fuente original y se dice cuándo se
// comprobó que el enlace abre (`verificado`). `npm run verificar:curriculo` revisa la forma de recursos.json y
// `npm run verificar:enlaces` que cada enlace siga abriendo.
import { BookOpen, FileCheck, FileText, GraduationCap, Landmark, type LucideProps } from 'lucide-react'
import { useEffect, useState, type ComponentType } from 'react'

export type TipoRecurso = 'libro' | 'teoria' | 'examen' | 'guia' | 'norma'

export type RecursoOficial = {
  tipo: TipoRecurso
  /** Tal cual se publicó. */
  titulo: string
  /** De qué trata, como lo titula la fuente (sobre todo en normas: «Norma que regula…»). */
  subtitulo?: string
  fuente: string
  /** La página oficial o el PDF. */
  url: string
  /** El PDF directo, si además hay página. */
  pdf?: string
  /** primaria-1 … primaria-6; vacío = sirve para todos los grados. */
  grados: string[]
  /** Ids de curso (matematica, comunicacion…); vacío = sirve para todos. */
  areas: string[]
  anio?: number
  /** Qué es y para qué le sirve al docente, en una oración. */
  descripcion: string
  /** Fecha (AAAA-MM-DD) en que se comprobó que el enlace abre. */
  verificado: string
}

export const TIPOS: Record<TipoRecurso, { nombre: string; plural: string; icono: ComponentType<LucideProps> }> = {
  libro: { nombre: 'Libro', plural: 'Libros y cuadernos', icono: BookOpen },
  teoria: { nombre: 'Teoría', plural: 'Teoría del tema', icono: FileText },
  examen: { nombre: 'Examen', plural: 'Exámenes', icono: FileCheck },
  guia: { nombre: 'Guía', plural: 'Guías para el docente', icono: GraduationCap },
  norma: { nombre: 'Norma', plural: 'Normas', icono: Landmark },
}
export const ORDEN_TIPOS = Object.keys(TIPOS) as TipoRecurso[]

let cargando: Promise<RecursoOficial[]> | null = null
/** El catálogo se descarga solo al abrir Más recursos. */
export const cargarRecursos = () => (cargando ??= import('./recursos.json').then((m) => m.default as RecursoOficial[]))

export function useRecursos() {
  const [todos, setTodos] = useState<RecursoOficial[] | null>(null)
  useEffect(() => {
    let vivo = true
    cargarRecursos().then((r) => vivo && setTodos(r))
    return () => {
      vivo = false
    }
  }, [])
  return todos
}

/** Los recursos de un grado y curso ('' = todos), del más útil al más general: primero los del curso, después los de todos. */
export function filtrar(todos: RecursoOficial[], gradoId: string, areaId: string, tipo: TipoRecurso | null) {
  const sirve = (lista: string[], id: string) => !id || !lista.length || lista.includes(id)
  const especifico = (r: RecursoOficial) => (r.areas.length ? 0 : 1) + (r.grados.length ? 0 : 1)
  return todos
    .filter((r) => (!tipo || r.tipo === tipo) && sirve(r.grados, gradoId) && sirve(r.areas, areaId))
    .sort(
      (a, b) =>
        ORDEN_TIPOS.indexOf(a.tipo) - ORDEN_TIPOS.indexOf(b.tipo) || especifico(a) - especifico(b) || (b.anio ?? 0) - (a.anio ?? 0) || a.titulo.localeCompare(b.titulo),
    )
}
