// Lo que ya existe del tema, sin IA, para que la sesión no salga igual en todos los temas: la pregunta del banco para
// los saberes previos y, en Matemática, la situación problemática, otros problemas y la idea a formalizar.
import { useEffect, useState } from 'react'
import type { Ficha } from '../api'
import { cargarBanco, temaEnBanco, type TemaBanco } from '../banco/banco'
import { cargarProblemas, problemasDe } from '../examenes/problemas'
import type { TemaProblemas } from '../examenes/tipos'

export type ContextoSesion = { banco: TemaBanco | null; problemas: TemaProblemas | null }

/** El banco y los problemas del tema; undefined mientras se descargan. */
export function useContextoSesion(ficha: Ficha | null): ContextoSesion | undefined {
  const clave = ficha ? `${ficha.gradoId}|${ficha.areaId}|${ficha.titulo}` : ''
  const [listo, setListo] = useState<{ clave: string; contexto: ContextoSesion }>()
  useEffect(() => {
    if (!ficha) return
    let vivo = true
    void Promise.all([cargarBanco(ficha.gradoId, ficha.areaId), cargarProblemas(ficha.gradoId, ficha.areaId)]).then(([banco, problemas]) => {
      if (vivo) setListo({ clave, contexto: { banco: temaEnBanco(banco, ficha.titulo), problemas: problemasDe(problemas, ficha.titulo) } })
    })
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave])
  return listo?.clave === clave ? listo.contexto : undefined
}
