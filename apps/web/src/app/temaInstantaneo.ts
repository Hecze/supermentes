// Un tema se crea al instante con lo que ya trae el Currículo Nacional (título, grado, curso, competencia y
// desempeños). La IA completa después lo que no está en el currículo: ideas clave, vocabulario, ejemplo y error
// frecuente. El docente no espera: puede ir a las herramientas mientras tanto.
import { api, type EntradaTema, type Ficha } from '../api'
import { cargarBanco, temaEnBanco } from '../banco/banco'
import { fundamento, sugerenciasPara, type Fundamento, type Resultado } from '../curriculo/buscar'
import { areaPorId, gradoPorId, nivelDe } from '../curriculo/catalogo'
import { cargarNivel } from '../curriculo/cargar'
import { ubicarCita } from '../curriculo/citas'

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
  }
}

/** El tema elegido en el buscador, ya con su competencia y desempeños (null si el curso no está en el currículo). */
export async function fichaDeResultado(r: Resultado): Promise<Ficha | null> {
  const [datos, banco] = await Promise.all([cargarNivel(nivelDe(r.gradoId)), cargarBanco(r.gradoId, r.areaId)])
  const area = datos?.grados.find((g) => g.id === r.gradoId)?.areas.find((a) => a.id === r.areaId)
  if (!area) return null
  // Si el tema está en el banco, su desempeño ya se eligió leyendo el currículo: se usa ese.
  const t = temaEnBanco(banco, r.tema)
  const u = t ? ubicarCita(area, t.cita, t.competencia) : null
  return fichaDesdeCurriculo({ ...r, ...fundamento(area, r.tema, u?.desempeno ?? r.cita, u ? u.numeroCompetencia - 1 : r.indiceCompetencia) })
}

/** El primer tema de lo que enseña la docente, para que nunca falte un tema elegido. */
export async function temaPorDefecto(e: { grados: string[]; cursos: string[] }): Promise<Ficha | null> {
  const g = e.grados[0]
  const grado = (await cargarNivel(nivelDe(g)))?.grados.find((x) => x.id === g)
  if (!grado) return null
  const [r] = sugerenciasPara([grado], e.cursos, { [g]: gradoPorId(g)?.corto ?? g }, 1)
  return r ? fichaDeResultado(r) : null
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
