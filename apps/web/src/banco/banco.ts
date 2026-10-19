import { useEffect, useState } from 'react'
import type { Cancion, Ficha, Juego } from '../api'
import { partesDeLetra } from '../canciones/letra'
import { normalizar } from '../curriculo/buscar'

// Banco de contenido listo por tema del Currículo Nacional: palabras, preguntas, parejas y dos canciones.
// Así cada tema tiene juegos y canciones apenas se crea, sin esperar ni gastar en la IA.
//
// Hoy cubre todos los temas de 4.º de primaria (`primaria-4/<área>.json`). Cada tema guarda `cita`: un fragmento
// copiado letra por letra de un desempeño oficial de su área y grado. `npm run verificar:curriculo` comprueba cada
// cita y que todos los temas del grado tengan al menos 2 juegos y 2 canciones (banco/verificar.ts).

export type CancionBanco = {
  titulo: string
  /** cumbia, huayno, festejo, marinera, saya, valicha, tondero o landó. */
  ritmo: string
  /** Cómo se oye, para el generador de música: "huayno andino alegre, 95 bpm, charango y quena…". */
  estilo: string
  /** Líneas de la letra; las marcas de sección van solas: "[Coro]", "[Estrofa 1]". */
  letra: string[]
}

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
  canciones: CancionBanco[]
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

const RITMOS: Record<string, string> = { lando: 'Landó' }
const nombreRitmo = (r: string) => RITMOS[normalizar(r)] ?? r.charAt(0).toUpperCase() + r.slice(1)

/** La canción del banco lista para mostrarse e imprimirse. */
export function cancionDelBanco(c: CancionBanco): Cancion {
  return { titulo: c.titulo, opciones: { modo: 'ritmo', ritmo: nombreRitmo(c.ritmo), melodia: '', estilo: c.estilo }, partes: partesDeLetra(c.letra) }
}
