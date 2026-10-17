import type { AreaCurriculo } from './cargar'

// Citas del currículo: un fragmento copiado letra por letra de un desempeño oficial. Con esto la app muestra
// el desempeño completo con la parte citada resaltada, y el verificador comprueba que la cita exista.

export type Ubicacion = {
  competencia: string
  /** Número de la competencia dentro del área (desde 1, como en el programa curricular). */
  numeroCompetencia: number
  desempeno: string
  /** Número del desempeño dentro de la competencia (desde 1). */
  numeroDesempeno: number
  /** Dónde empieza la cita dentro del desempeño. */
  desde: number
}

/** Dónde aparece la cita, tal cual, entre los desempeños del área. null si no aparece. */
export function ubicarCita(area: AreaCurriculo, cita: string): Ubicacion | null {
  for (const [i, c] of area.competencias.entries()) {
    for (const [j, d] of c.desempenos.entries()) {
      const desde = d.indexOf(cita)
      if (desde >= 0) return { competencia: c.nombre, numeroCompetencia: i + 1, desempeno: d, numeroDesempeno: j + 1, desde }
    }
  }
  return null
}
