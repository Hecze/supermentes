// Catálogo fijo de niveles, grados y áreas (cursos). Los identificadores coinciden con los JSON de packages/curriculo/data.

export type Nivel = 'primaria' | 'secundaria'

export type GradoCatalogo = { id: string; nombre: string; corto: string; nivel: Nivel }
export type AreaCatalogo = { id: string; nombre: string }

export const NIVELES: { id: Nivel; nombre: string }[] = [
  { id: 'primaria', nombre: 'Primaria' },
  { id: 'secundaria', nombre: 'Secundaria' },
]

export const GRADOS_CURRICULO: GradoCatalogo[] = [
  ...[1, 2, 3, 4, 5, 6].map((g) => ({ id: `primaria-${g}`, nombre: `${g}.º grado de primaria`, corto: `${g}.º primaria`, nivel: 'primaria' as const })),
  ...[1, 2, 3, 4, 5].map((g) => ({ id: `secundaria-${g}`, nombre: `${g}.º grado de secundaria`, corto: `${g}.º secundaria`, nivel: 'secundaria' as const })),
]

const A = (id: string, nombre: string): AreaCatalogo => ({ id, nombre })

export const AREAS_POR_NIVEL: Record<Nivel, AreaCatalogo[]> = {
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

/** Cursos de los niveles de esos grados, sin repetir y en el orden del currículo. */
export function cursosDe(grados: string[]): AreaCatalogo[] {
  const niveles = new Set(grados.map(nivelDe))
  if (!niveles.size) niveles.add('primaria')
  const vistos = new Set<string>()
  return NIVELES.filter((n) => niveles.has(n.id))
    .flatMap((n) => AREAS_POR_NIVEL[n.id])
    .filter((a) => !vistos.has(a.id) && vistos.add(a.id))
}

export type TipoColegio = 'publico' | 'privado'

/**
 * Cursos de los colegios privados, que parten un área del currículo (Matemática en Álgebra, Geometría…). No son del
 * currículo: cada uno apunta a su área y, cuando la tiene, a la competencia oficial que trabaja (comienzo de su nombre
 * tal cual en packages/curriculo). Así sus temas siguen saliendo del Currículo Nacional.
 */
export type CursoPrivado = { id: string; nombre: string; areas: string[]; competencia?: string; niveles: Nivel[] }

const AMBOS: Nivel[] = ['primaria', 'secundaria']
const SOCIALES = ['personal-social', 'ciencias-sociales']

export const CURSOS_PRIVADOS: CursoPrivado[] = [
  { id: 'aritmetica', nombre: 'Aritmética', areas: ['matematica'], competencia: 'Resuelve problemas de cantidad', niveles: AMBOS },
  { id: 'algebra', nombre: 'Álgebra', areas: ['matematica'], competencia: 'Resuelve problemas de regularidad, equivalencia y cambio', niveles: AMBOS },
  { id: 'geometria', nombre: 'Geometría', areas: ['matematica'], competencia: 'Resuelve problemas de forma, movimiento y localización', niveles: AMBOS },
  { id: 'trigonometria', nombre: 'Trigonometría', areas: ['matematica'], competencia: 'Resuelve problemas de forma, movimiento y localización', niveles: ['secundaria'] },
  { id: 'estadistica', nombre: 'Estadística', areas: ['matematica'], competencia: 'Resuelve problemas de gestión de datos e incertidumbre', niveles: AMBOS },
  { id: 'razonamiento-matematico', nombre: 'Razonamiento matemático', areas: ['matematica'], niveles: AMBOS },
  { id: 'lenguaje', nombre: 'Lenguaje', areas: ['comunicacion'], competencia: 'Escribe diversos tipos de textos', niveles: AMBOS },
  { id: 'literatura', nombre: 'Literatura', areas: ['comunicacion'], competencia: 'Lee diversos tipos de textos', niveles: AMBOS },
  { id: 'razonamiento-verbal', nombre: 'Razonamiento verbal', areas: ['comunicacion'], competencia: 'Lee diversos tipos de textos', niveles: AMBOS },
  { id: 'fisica', nombre: 'Física', areas: ['ciencia-y-tecnologia'], competencia: 'Explica el mundo físico', niveles: ['secundaria'] },
  { id: 'quimica', nombre: 'Química', areas: ['ciencia-y-tecnologia'], competencia: 'Explica el mundo físico', niveles: ['secundaria'] },
  { id: 'biologia', nombre: 'Biología', areas: ['ciencia-y-tecnologia'], competencia: 'Explica el mundo físico', niveles: ['secundaria'] },
  { id: 'historia', nombre: 'Historia', areas: SOCIALES, competencia: 'Construye interpretaciones históricas', niveles: AMBOS },
  { id: 'geografia', nombre: 'Geografía', areas: SOCIALES, competencia: 'Gestiona responsablemente el espacio y el ambiente', niveles: AMBOS },
  { id: 'economia', nombre: 'Economía', areas: SOCIALES, competencia: 'Gestiona responsablemente los recursos económicos', niveles: AMBOS },
]

/** Los cursos de colegio privado de un área, para los niveles de esos grados. */
export function cursosPrivadosDe(areaId: string, grados: string[]): CursoPrivado[] {
  const niveles = new Set(grados.map(nivelDe))
  return CURSOS_PRIVADOS.filter((c) => c.areas.includes(areaId) && c.niveles.some((n) => niveles.has(n)))
}

/** Un curso, del currículo (área) o de colegio privado: a qué áreas apunta y, si es de una competencia, cuál. */
export function cursoPorId(id: string): { nombre: string; areas: string[]; competencia?: string } | null {
  const privado = CURSOS_PRIVADOS.find((c) => c.id === id)
  if (privado) return privado
  const area = cursosDe(['primaria-1', 'secundaria-1']).find((a) => a.id === id)
  return area ? { nombre: area.nombre, areas: [area.id] } : null
}

/** "a", "a y b", "a, b y c". */
export const enLista = (xs: string[]) => (xs.length < 2 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`)

/** "4.º primaria", "Toda primaria", "1.º, 2.º y 3.º secundaria", "6.º primaria, 1.º y 2.º secundaria". */
export function nombreGrados(ids: string[]): string {
  const partes = NIVELES.flatMap((n) => {
    const del = GRADOS_CURRICULO.filter((g) => g.nivel === n.id)
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
  const nombres = ids.map((id) => cursoPorId(id)?.nombre ?? id)
  return nombres.length > 2 ? `${nombres.length} cursos` : enLista(nombres)
}
