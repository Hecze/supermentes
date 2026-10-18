// Cobertura: cuántos juegos y canciones tiene cada tema del Currículo Nacional apenas se crea (sin esperar a la
// IA), contando el banco de contenido donde lo hay. Lo corre `node scripts/cobertura.mjs`; no lo importa la app.
import { bancoDe, cuantos, fichaDe } from '../banco/verificar'
import { normalizar, temasDe } from '../curriculo/buscar'
import type { CurriculoNivel } from '../curriculo/cargar'

const niveles = import.meta.glob<CurriculoNivel>('../../../../packages/curriculo/data/*.json', { import: 'default', eager: true })

export type FilaCobertura = { nivel: string; gradoId: string; areaId: string; tema: string; juegos: number; canciones: number }

export function cobertura(): FilaCobertura[] {
  const filas: FilaCobertura[] = []
  for (const n of Object.values(niveles))
    for (const g of n.grados)
      for (const a of g.areas) {
        const banco = bancoDe(g.id, a.id)
        for (const { tema } of temasDe(a)) {
          const t = banco?.find((x) => normalizar(x.tema) === normalizar(tema)) ?? null
          filas.push({ nivel: n.nivel, gradoId: g.id, areaId: a.id, tema, ...cuantos(fichaDe(g.id, g.nombre, a.id, a.nombre, tema), t) })
        }
      }
  return filas
}
