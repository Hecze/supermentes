// Lo que la pantalla de hojas necesita cargar: el banco y los problemas de cada curso de la hoja (el del tema abierto
// y, en una miscelánea de varios cursos, los otros), y el encabezado del colegio, que el docente escribe una vez sobre
// la hoja y queda para todas.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { cargarBanco, temaEnBanco, tieneBanco, type TemaBanco } from '../banco/banco'
import { areaPorId, areasDe } from '../curriculo/catalogo'
import { tiposDelTema } from './catalogo'
import { cargarProblemas, problemasDe } from './problemas'
import type { Fuente, TemaProblemas } from './tipos'

/** Un curso del grado con lo que hace falta para armar sus hojas. */
export type Area = { areaId: string; nombre: string; bancos: TemaBanco[]; problemas: TemaProblemas[] | null }

const cargadas = new Map<string, Area>()
const cargando = new Map<string, Promise<Area>>()

export function cargarArea(gradoId: string, areaId: string): Promise<Area> {
  const clave = `${gradoId}|${areaId}`
  if (!cargando.has(clave))
    cargando.set(
      clave,
      Promise.all([cargarBanco(gradoId, areaId), cargarProblemas(gradoId, areaId)]).then(([b, p]) => {
        const a = { areaId, nombre: areaPorId(gradoId, areaId)?.nombre ?? areaId, bancos: b ?? [], problemas: p }
        cargadas.set(clave, a)
        return a
      }),
    )
  return cargando.get(clave)!
}

/** Los cursos pedidos, ya descargados; undefined mientras falte alguno. */
export function useAreas(gradoId: string, ids: string[]): Map<string, Area> | undefined {
  const unicos = [...new Set(ids)].sort().join(',')
  const [listas, setListas] = useState(0)
  const lista = unicos ? unicos.split(',') : []
  const faltan = lista.filter((id) => !cargadas.has(`${gradoId}|${id}`))
  useEffect(() => {
    if (!faltan.length) return
    let vivo = true
    Promise.all(faltan.map((id) => cargarArea(gradoId, id))).then(() => vivo && setListas((n) => n + 1))
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradoId, unicos])
  return useMemo(
    () => (faltan.length ? undefined : new Map(lista.map((id) => [id, cargadas.get(`${gradoId}|${id}`)!]))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gradoId, unicos, listas, faltan.length],
  )
}

/** Todos los temas con hoja del grado, por curso (para sumar temas a una miscelánea); se descargan al pedirlos. */
export function useTemasDelGrado(gradoId: string, pedir: boolean): { areaId: string; area: string; tema: string }[] | undefined {
  const ids = useMemo(() => (pedir ? areasDe(gradoId).filter((a) => tieneBanco(gradoId, a.id)).map((a) => a.id) : []), [gradoId, pedir])
  const areas = useAreas(gradoId, ids)
  return useMemo(() => (pedir && areas ? ids.flatMap((id) => areas.get(id)!.bancos.map((b) => ({ areaId: id, area: areas.get(id)!.nombre, tema: b.tema }))) : undefined), [pedir, areas, ids])
}

/** Con qué se arman las preguntas de un tema de un curso. */
export function fuenteDe(gradoId: string, tema: string, area: Area): Fuente {
  const banco = temaEnBanco(area.bancos, tema)
  const problemas = problemasDe(area.problemas, tema)
  return { tema: banco?.tema ?? tema, areaId: area.areaId, area: area.nombre, banco, problemas, tipos: tiposDelTema(gradoId, area.areaId, tema, banco, problemas) }
}

export type Colegio = { colegio: string; docente: string; seccion: string }

const CLAVE = 'supermentes-colegio'

function leer(): Colegio {
  try {
    const c = JSON.parse(localStorage.getItem(CLAVE) ?? '{}') as Partial<Colegio>
    return { colegio: c.colegio ?? '', docente: c.docente ?? '', seccion: c.seccion ?? '' }
  } catch {
    return { colegio: '', docente: '', seccion: '' }
  }
}

/** El encabezado del colegio, guardado en este navegador. */
export function useColegio(): [Colegio, (c: Partial<Colegio>) => void] {
  const [c, setC] = useState<Colegio>(leer)
  const cambiar = useCallback((cambios: Partial<Colegio>) => {
    setC((antes) => {
      const nuevo = { ...antes, ...cambios }
      try {
        localStorage.setItem(CLAVE, JSON.stringify(nuevo))
      } catch {
        // Sin almacenamiento, el encabezado dura solo esta visita.
      }
      return nuevo
    })
  }, [])
  return [c, cambiar]
}
