// Un tema se crea al instante con lo que ya trae el Currículo Nacional (título, grado, curso, competencia y
// desempeños). La IA completa después lo que no está en el currículo: ideas clave, vocabulario, ejemplo y error
// frecuente. El docente no espera: puede ir a las herramientas mientras tanto.
import { api, type EntradaTema, type Ficha } from '../api'
import type { Fundamento, Resultado } from '../curriculo/buscar'
import { areaPorId, gradoPorId } from '../curriculo/catalogo'

export type EstadoCompletar = 'cargando' | 'error'

export function fichaDesdeCurriculo(r: Resultado & Fundamento): Ficha {
  const grado = gradoPorId(r.gradoId)?.corto ?? r.grado
  const area = areaPorId(r.gradoId, r.areaId)?.nombre ?? r.area
  return {
    id: `ficha-${Date.now()}`,
    fecha: new Date().toISOString(),
    titulo: r.tema,
    gradoId: r.gradoId,
    areaId: r.areaId,
    grado,
    area,
    duracion: '45 min',
    fuente: `Currículo Nacional: ${area}, ${grado}`,
    proposito: '',
    curriculo: { competencia: r.competencia, capacidad: r.capacidad, desempenos: r.desempenos },
    conceptos: [],
    vocabulario: [],
    ejemplo: '',
    errorFrecuente: '',
    coincidenciasBiblioteca: 0,
  }
}

const entradaDe = (f: Ficha): EntradaTema => ({
  texto: f.titulo,
  gradoId: f.gradoId,
  areaId: f.areaId,
  grado: f.grado,
  area: f.area,
  competencia: f.curriculo.competencia,
  capacidad: f.curriculo.capacidad,
  desempenos: f.curriculo.desempenos,
  duracion: f.duracion,
})

/** Pide a la IA lo que falta y lo agrega a la ficha, sin tocar el tema ni lo que dice el currículo. */
export async function completarConIA(f: Ficha, actualizar: (id: string, cambios: Partial<Ficha>) => void, marcar: (id: string, e: EstadoCompletar | null) => void) {
  marcar(f.id, 'cargando')
  try {
    const ia = await api.prepararFicha(entradaDe(f))
    actualizar(f.id, { proposito: ia.proposito, conceptos: ia.conceptos, vocabulario: ia.vocabulario, ejemplo: ia.ejemplo, errorFrecuente: ia.errorFrecuente })
    marcar(f.id, null)
  } catch {
    marcar(f.id, 'error')
  }
}
