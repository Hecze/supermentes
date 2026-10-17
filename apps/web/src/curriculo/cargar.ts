import { useEffect, useState } from 'react'
import type { Nivel } from './catalogo'

// Datos del currículo oficial (MINEDU). Ver packages/curriculo/README.md.

export type Competencia = {
  nombre: string
  capacidades: string[]
  /** Estándar de aprendizaje del ciclo, texto oficial. */
  estandar: string
  /** Desempeños del grado, texto oficial. */
  desempenos: string[]
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
