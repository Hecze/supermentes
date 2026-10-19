// Verificador de las canciones: cada grado donde se ofrece una canción tiene que citar letra por letra un desempeño
// oficial de su área en ese grado. Lo corre `npm run verificar:curriculo`; no lo importa la app.
import type { CurriculoNivel } from '../curriculo/cargar'
import { ubicarCita } from '../curriculo/citas'
import canciones from './canciones.json'
import type { CancionExistente } from './catalogo'

const niveles = import.meta.glob<CurriculoNivel>('../../../../packages/curriculo/data/*.json', { import: 'default', eager: true })

export function verificarCanciones() {
  const grados = new Map(Object.values(niveles).flatMap((n) => n.grados.map((g) => [g.id, g] as const)))
  const errores: string[] = []
  let total = 0
  for (const c of canciones as CancionExistente[]) {
    for (const [g, cita] of Object.entries(c.grados)) {
      total++
      const area = grados.get(g)?.areas.find((a) => a.id === c.area)
      if (!cita) errores.push(`Canción «${c.titulo}» · ${g}: falta la cita.`)
      else if (!area) errores.push(`Canción «${c.titulo}» · ${g}: no hay currículo de ${c.area} para ese grado.`)
      else if (!ubicarCita(area, cita)) errores.push(`Canción «${c.titulo}» · ${g}: la cita no aparece tal cual en los desempeños: «${cita}»`)
    }
  }
  return { total, errores }
}
