// Banco de problemas por tema (problemas/<grado>/<área>.json): teoría corta, un ejemplo resuelto y problemas de tres
// niveles con sus pasos. Lo escribió Gemini con el tema, sus desempeños oficiales, el banco del tema y el Cuadernillo
// de Matemática 4 del MINEDU como referencia, y cada problema pasó controles y una resolución a ciegas
// (scripts/generar-problemas.py). Se descarga solo al abrir un tema de esa área.
import { normalizar } from '../curriculo/buscar'
import type { TemaProblemas, TipoPregunta } from './tipos'

const archivos = import.meta.glob<TemaProblemas[]>('./problemas/*/*.json', { import: 'default' })
const cache = new Map<string, Promise<TemaProblemas[] | null>>()

export function cargarProblemas(gradoId: string, areaId: string): Promise<TemaProblemas[] | null> {
  const ruta = `./problemas/${gradoId}/${areaId}.json`
  if (!cache.has(ruta)) cache.set(ruta, archivos[ruta] ? archivos[ruta]().catch(() => null) : Promise.resolve(null))
  return cache.get(ruta)!
}

export const problemasDe = (lista: TemaProblemas[] | null, tema: string) => lista?.find((x) => normalizar(x.tema) === normalizar(tema)) ?? null

export const problemasDelTema: TipoPregunta = {
  id: 'problemas',
  nombre: 'Problemas del tema',
  queHacen: 'Resuelven situaciones del tema, de directas a más pensadas, y muestran su procedimiento.',
  cambia: 'orden',
  niveles: true,
  generar({ azar, problemas, nivel = 2 }) {
    const lista = problemas?.problemas ?? []
    if (!lista.length) return null
    // Normal: de todos los niveles, como siempre. Más fácil: los directos; más difícil: los más pensados (si el tema
    // no tiene de ese nivel, los del nivel vecino).
    const quiero = nivel === 1 ? [[1], [1, 2]] : nivel === 3 ? [[3], [2, 3]] : [[1, 2, 3]]
    const indices = quiero.map((ns) => lista.flatMap((p, i) => (ns.includes(p.nivel) ? [i] : []))).find((l) => l.length) ?? lista.map((_, i) => i)
    const i = indices[Math.floor(azar() * indices.length)]
    const p = lista[i]
    // Como en el libro, con su recuadro para el procedimiento: es lo que el docente revisa y los padres quieren ver.
    // (Sus alternativas sirvieron para resolverlo a ciegas al generarlo.)
    return { clave: `problema:${i}`, enunciado: p.enunciado, pasos: p.pasos, nivel: p.nivel, forma: 'abierta', respuesta: p.respuesta, espacio: 'procedimiento' }
  },
}
