import { useEffect, useMemo, useState } from 'react'
import { nivelDe, type Nivel } from './catalogo'

// Datos del currículo oficial (MINEDU). Ver packages/curriculo/README.md.

export type Competencia = {
  nombre: string
  capacidades: string[]
  /** Estándar de aprendizaje del ciclo, texto oficial. */
  estandar: string
  /** Desempeños del grado, texto oficial. */
  desempenos: string[]
  /** Temas como los nombran los libros y las sesiones, que esta competencia trabaja en el grado: no es texto oficial. */
  temas?: string[]
}

export type AreaCurriculo = {
  id: string
  nombre: string
  competencias: Competencia[]
  /** Derivados de los desempeños: no es texto oficial. */
  temas: string[]
}

export type GradoCurriculo = { id: string; nombre: string; ciclo: string; areas: AreaCurriculo[] }

export type CurriculoNivel = {
  nivel: Nivel
  fuente: { titulo: string; institucion: string; url: string }
  grados: GradoCurriculo[]
}

// Cada nivel es un archivo aparte y se descarga solo cuando hace falta.
const archivos = import.meta.glob<CurriculoNivel>('../../../../packages/curriculo/data/*.json', { import: 'default' })
const cache = new Map<Nivel, Promise<CurriculoNivel | null>>()

export function cargarNivel(nivel: Nivel): Promise<CurriculoNivel | null> {
  if (!cache.has(nivel)) {
    const ruta = Object.keys(archivos).find((r) => r.endsWith(`/${nivel}.json`))
    cache.set(nivel, ruta ? archivos[ruta]().catch(() => null) : Promise.resolve(null))
  }
  return cache.get(nivel)!
}

export type EstadoCurriculo =
  | { estado: 'cargando' }
  | { estado: 'sin-datos' }
  | { estado: 'listo'; fuente: CurriculoNivel['fuente']; grado: GradoCurriculo; area: AreaCurriculo | null }

/** Currículo de un grado y, si se indica, de un área. */
export function useCurriculo(nivel: Nivel, gradoId: string, areaId?: string): EstadoCurriculo {
  const [res, setRes] = useState<EstadoCurriculo>({ estado: 'cargando' })
  useEffect(() => {
    let vivo = true
    setRes({ estado: 'cargando' })
    cargarNivel(nivel).then((datos) => {
      if (!vivo) return
      const grado = datos?.grados.find((g) => g.id === gradoId)
      if (!datos || !grado) return setRes({ estado: 'sin-datos' })
      setRes({ estado: 'listo', fuente: datos.fuente, grado, area: areaId ? (grado.areas.find((a) => a.id === areaId) ?? null) : null })
    })
    return () => {
      vivo = false
    }
  }, [nivel, gradoId, areaId])
  return res
}

/** El currículo de esos grados, en ese orden (cada nivel se descarga una vez); null mientras carga. */
export function useGrados(ids: string[]): GradoCurriculo[] | null {
  const [porId, setPorId] = useState<Record<string, GradoCurriculo>>({})
  const niveles = [...new Set(ids.map(nivelDe))].sort().join(',')
  useEffect(() => {
    let vivo = true
    void Promise.all((niveles ? (niveles.split(',') as Nivel[]) : []).map(cargarNivel)).then((datos) => {
      if (vivo) setPorId(Object.fromEntries(datos.flatMap((d) => d?.grados ?? []).map((g) => [g.id, g])))
    })
    return () => {
      vivo = false
    }
  }, [niveles])
  const lista = ids.join(',')
  return useMemo(() => {
    const xs = lista ? lista.split(',') : []
    const grados = xs.map((id) => porId[id]).filter(Boolean)
    return grados.length === xs.length ? grados : null
  }, [porId, lista])
}
