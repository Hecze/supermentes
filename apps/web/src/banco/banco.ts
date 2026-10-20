import { useEffect, useState } from 'react'
import type { Ficha, Juego } from '../api'
import { normalizar } from '../curriculo/buscar'

// Banco de contenido listo por tema del Currículo Nacional: palabras, preguntas y parejas.
// Así cada tema tiene juegos apenas se crea, sin esperar ni gastar en la IA. Las canciones no van aquí: solo se
// muestran las que están en YouTube (obsidian/CANCIONES.md).
//
// Cada carpeta es un grado completo (`<gradoId>/<área>.json`, ver README.md). Cada tema guarda `cita`: un fragmento
// copiado letra por letra de un desempeño oficial de su área y grado. `npm run verificar:curriculo` comprueba cada
// cita y que todos los temas del grado tengan al menos 2 juegos (banco/verificar.ts).

export type TemaBanco = {
  /** El tema tal cual figura en el currículo (packages/curriculo). */
  tema: string
  /** Número de la competencia del desempeño citado (desde 1). */
  competencia: number
  /** Fragmento letra por letra de un desempeño oficial del área en el grado. */
  cita: string
  palabras: { palabra: string; pista: string }[]
  preguntas: { pregunta: string; respuesta: string; distractores: string[] }[]
  pares: { a: string; b: string }[]
}

const archivos = import.meta.glob<TemaBanco[]>('./*/*.json', { import: 'default' })
const cache = new Map<string, Promise<TemaBanco[] | null>>()

/** Los temas del banco de un área y grado; null si ese grado o área todavía no tiene banco. Se descarga al usarlo. */
export function cargarBanco(gradoId: string, areaId: string): Promise<TemaBanco[] | null> {
  const ruta = `./${gradoId}/${areaId}.json`
  if (!cache.has(ruta)) cache.set(ruta, archivos[ruta] ? archivos[ruta]().catch(() => null) : Promise.resolve(null))
  return cache.get(ruta)!
}

export const tieneBanco = (gradoId: string, areaId: string) => `./${gradoId}/${areaId}.json` in archivos

export function temaEnBanco(temas: TemaBanco[] | null, titulo: string) {
  const t = normalizar(titulo)
  return temas?.find((x) => normalizar(x.tema) === t) ?? null
}

/** El tema del banco que corresponde a la ficha: undefined mientras se descarga, null si no hay. */
export function useBanco(ficha: Ficha | null): TemaBanco | null | undefined {
  const clave = ficha ? `${ficha.gradoId}|${ficha.areaId}|${ficha.titulo}` : ''
  const [tema, setTema] = useState<{ clave: string; t: TemaBanco | null }>()
  useEffect(() => {
    if (!ficha) return
    let vivo = true
    cargarBanco(ficha.gradoId, ficha.areaId).then((temas) => vivo && setTema({ clave, t: temaEnBanco(temas, ficha.titulo) }))
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave])
  if (!ficha) return null
  if (!tieneBanco(ficha.gradoId, ficha.areaId)) return null
  return tema?.clave === clave ? tema.t : undefined
}

/** Preguntas, parejas y palabras del banco con la forma de las que crea la IA: sirven para todos los juegos. */
export function juegoDelBanco(t: TemaBanco): Juego {
  return {
    codigo: '',
    preguntas: t.preguntas.map((p) => ({ pregunta: p.pregunta, opciones: [p.respuesta, ...p.distractores], correcta: 0 })),
    pares: t.pares.map((p) => ({ a: { texto: p.a }, b: { texto: p.b } })),
    palabras: t.palabras,
  }
}
