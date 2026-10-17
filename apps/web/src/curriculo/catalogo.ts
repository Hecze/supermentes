// Catálogo fijo de niveles, grados y áreas (cursos). Los identificadores coinciden con los JSON de packages/curriculo/data.

export type Nivel = 'inicial' | 'primaria' | 'secundaria'

export type GradoCatalogo = { id: string; nombre: string; corto: string; nivel: Nivel }
export type AreaCatalogo = { id: string; nombre: string }

export const NIVELES: { id: Nivel; nombre: string }[] = [
  { id: 'inicial', nombre: 'Inicial' },
  { id: 'primaria', nombre: 'Primaria' },
  { id: 'secundaria', nombre: 'Secundaria' },
]

export const GRADOS_CURRICULO: GradoCatalogo[] = [
  ...[3, 4, 5].map((e) => ({ id: `inicial-${e}`, nombre: `Inicial ${e} años`, corto: `Inicial ${e} años`, nivel: 'inicial' as const })),
  ...[1, 2, 3, 4, 5, 6].map((g) => ({ id: `primaria-${g}`, nombre: `${g}.º grado de primaria`, corto: `${g}.º primaria`, nivel: 'primaria' as const })),
  ...[1, 2, 3, 4, 5].map((g) => ({ id: `secundaria-${g}`, nombre: `${g}.º grado de secundaria`, corto: `${g}.º secundaria`, nivel: 'secundaria' as const })),
]

const A = (id: string, nombre: string): AreaCatalogo => ({ id, nombre })

export const AREAS_POR_NIVEL: Record<Nivel, AreaCatalogo[]> = {
  inicial: [
    A('comunicacion', 'Comunicación'),
    A('matematica', 'Matemática'),
    A('personal-social', 'Personal Social'),
    A('psicomotriz', 'Psicomotriz'),
    A('ciencia-y-tecnologia', 'Ciencia y Tecnología'),
    A('castellano-segunda-lengua', 'Castellano como segunda lengua'),
  ],
  primaria: [
    A('comunicacion', 'Comunicación'),
    A('matematica', 'Matemática'),
    A('ciencia-y-tecnologia', 'Ciencia y Tecnología'),
    A('personal-social', 'Personal Social'),
    A('arte-y-cultura', 'Arte y Cultura'),
    A('educacion-fisica', 'Educación Física'),
    A('educacion-religiosa', 'Educación Religiosa'),
    A('castellano-segunda-lengua', 'Castellano como segunda lengua'),
  ],
  secundaria: [
    A('comunicacion', 'Comunicación'),
    A('matematica', 'Matemática'),
    A('ciencia-y-tecnologia', 'Ciencia y Tecnología'),
    A('ciencias-sociales', 'Ciencias Sociales'),
    A('desarrollo-personal-ciudadania-y-civica', 'Desarrollo Personal, Ciudadanía y Cívica'),
    A('ingles', 'Inglés'),
    A('arte-y-cultura', 'Arte y Cultura'),
    A('educacion-fisica', 'Educación Física'),
    A('educacion-para-el-trabajo', 'Educación para el Trabajo'),
    A('educacion-religiosa', 'Educación Religiosa'),
    A('castellano-segunda-lengua', 'Castellano como segunda lengua'),
  ],
}

export const gradoPorId = (id: string) => GRADOS_CURRICULO.find((g) => g.id === id)
export const nivelDe = (gradoId: string): Nivel => (gradoPorId(gradoId)?.nivel ?? 'primaria')
export const areasDe = (gradoId: string) => AREAS_POR_NIVEL[nivelDe(gradoId)]
export const areaPorId = (gradoId: string, areaId: string) => areasDe(gradoId).find((a) => a.id === areaId)
