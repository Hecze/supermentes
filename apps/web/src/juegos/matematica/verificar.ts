// Verificador del currículo: cada nivel de cálculo, en cada grado donde se ofrece, tiene que citar letra por letra
// un desempeño oficial de Matemática de ese grado. Lo corre `npm run verificar:curriculo`; no lo importa la app.
import { ubicarCita } from '../../curriculo/citas'
import type { CurriculoNivel } from '../../curriculo/cargar'
import { HABILIDADES } from './habilidades'

const niveles = import.meta.glob<CurriculoNivel>('../../../../../packages/curriculo/data/*.json', { import: 'default', eager: true })

export function verificarCitas() {
  const areas = new Map(Object.values(niveles).flatMap((n) => n.grados.map((g) => [g.id, g.areas.find((a) => a.id === 'matematica')] as const)))
  const errores: string[] = []
  let total = 0
  for (const h of HABILIDADES) {
    for (const n of h.niveles) {
      if (!n.grados.length) errores.push(`${h.nombre} · ${n.nombre}: no tiene ningún grado con cita.`)
      for (const g of n.grados) {
        total++
        const cita = n.citas[g]
        const area = areas.get(g)
        if (!cita) errores.push(`${h.nombre} · ${n.nombre} · ${g}: falta la cita.`)
        else if (!area) errores.push(`${h.nombre} · ${n.nombre} · ${g}: no hay currículo de Matemática para ese grado.`)
        else if (!ubicarCita(area, cita)) errores.push(`${h.nombre} · ${n.nombre} · ${g}: la cita no aparece tal cual en los desempeños: «${cita}»`)
      }
    }
  }
  return { total, errores }
}
