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
    A('ingles', 'Inglés'),
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

// ---------- Lo que enseña la docente ----------

/** Niveles y grados para los que preparamos temas: inicial no es nuestro público por ahora. */
export const NIVELES_DOCENTE = NIVELES.filter((n) => n.id !== 'inicial')
export const GRADOS_DOCENTE = GRADOS_CURRICULO.filter((g) => g.nivel !== 'inicial')

/** Cursos de los niveles de esos grados, sin repetir y en el orden del currículo. */
export function cursosDe(grados: string[]): AreaCatalogo[] {
  const niveles = new Set(grados.map(nivelDe))
  if (!niveles.size) niveles.add('primaria')
  const vistos = new Set<string>()
  return NIVELES_DOCENTE.filter((n) => niveles.has(n.id))
    .flatMap((n) => AREAS_POR_NIVEL[n.id])
    .filter((a) => !vistos.has(a.id) && vistos.add(a.id))
}

/** "a", "a y b", "a, b y c". */
export const enLista = (xs: string[]) => (xs.length < 2 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`)

/** "4.º primaria", "Toda primaria", "1.º, 2.º y 3.º secundaria", "6.º primaria, 1.º y 2.º secundaria". */
export function nombreGrados(ids: string[]): string {
  const partes = NIVELES_DOCENTE.flatMap((n) => {
    const del = GRADOS_DOCENTE.filter((g) => g.nivel === n.id)
    const elegidos = del.filter((g) => ids.includes(g.id))
    if (!elegidos.length) return []
    if (elegidos.length === del.length && del.length > 1) return [`Toda ${n.nombre.toLowerCase()}`]
    return [`${enLista(elegidos.map((g) => g.corto.split(' ')[0]))} ${n.nombre.toLowerCase()}`]
  })
  return partes.length ? partes.join(', ') : 'Ningún grado'
}

/** "Todos los cursos", "Matemática", "Matemática y Comunicación", "3 cursos". */
export function nombreCursos(ids: string[]): string {
  if (!ids.length) return 'Todos los cursos'
  const nombres = ids.map((id) => cursosDe(['primaria-1', 'secundaria-1']).find((a) => a.id === id)?.nombre ?? id)
  return nombres.length > 2 ? `${nombres.length} cursos` : enLista(nombres)
}
