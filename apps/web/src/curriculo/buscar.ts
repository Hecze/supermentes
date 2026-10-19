import { NIVELES, cursoPorId } from './catalogo'
import { cargarNivel, type AreaCurriculo, type GradoCurriculo } from './cargar'

// Búsqueda de temas dentro del currículo: el docente solo elige temas que el currículo respalda.

export type Resultado = {
  /** Título que tendrá el tema. */
  tema: string
  gradoId: string
  grado: string
  areaId: string
  area: string
  /** Desempeño donde aparece la búsqueda, cuando no es uno de los temas del grado. */
  cita?: string
  /** Índice de la competencia a la que pertenece el tema, si se sabe. */
  indiceCompetencia?: number
  /** Solo coincide una parte de las palabras buscadas. */
  parcial?: boolean
}

/** Lo que pide el currículo para un tema: la competencia y los desempeños más cercanos. */
export type Fundamento = { competencia: string; capacidad: string; desempenos: string[] }

export const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()

const palabras = (s: string) => normalizar(s).split(/[^a-z0-9]+/).filter(Boolean)

/** Singular del plural: "fracciones" → "fraccion", "sustantivos" → "sustantivo". */
const raiz = (p: string) => (p.length > 5 && p.endsWith('es') ? p.slice(0, -2) : p.length > 3 && p.endsWith('s') ? p.slice(0, -1) : p)

// prettier-ignore
const VACIAS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'lo', 'y', 'e', 'o', 'u', 'en', 'un', 'una', 'unos', 'unas', 'al', 'a', 'con', 'por', 'que', 'se', 'su', 'sus',
  'para', 'como', 'sobre', 'entre', 'desde', 'hasta', 'cada', 'esta', 'este', 'estos', 'estas', 'segun', 'donde', 'cuando', 'otros', 'otras', 'tiene'])

/** Cuántas palabras de la búsqueda son el comienzo de alguna palabra del texto. */
function puntaje(busqueda: string[], texto: string) {
  const ps = palabras(texto)
  return busqueda.filter((b) => ps.some((p) => p.startsWith(b))).length
}

const consulta = (q: string) => palabras(q).filter((p) => !VACIAS.has(p)).map(raiz)

/** Con varias palabras, basta con la mitad para que cuente como "parecido". */
const parecido = (n: number, b: string[]) => b.length > 1 && n >= Math.ceil(b.length / 2)

const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function textoDe(a: AreaCurriculo) {
  return a.competencias.flatMap((c) => [c.nombre, ...c.capacidades, ...c.desempenos])
}

/** Temas del área: los de cada competencia (con su índice) y los generales del área, sin repetir. */
export function temasDe(a: AreaCurriculo): { tema: string; indiceCompetencia?: number }[] {
  const vistos = new Set<string>()
  const res: { tema: string; indiceCompetencia?: number }[] = []
  const sumar = (tema: string, indiceCompetencia?: number) => {
    const k = normalizar(tema)
    if (vistos.has(k)) return
    vistos.add(k)
    res.push({ tema, indiceCompetencia })
  }
  a.competencias.forEach((c, i) => c.temas?.forEach((t) => sumar(t, i)))
  a.temas.forEach((t) => sumar(t))
  return res
}

/** Temas del grado que coinciden y, si no hay tema con ese nombre, desempeños que lo mencionan. */
export function buscarEnGrado(grado: GradoCurriculo, nombreGrado: string, q: string, areaId?: string): Resultado[] {
  const b = consulta(q)
  if (!b.length) return []
  const areas = grado.areas.filter((a) => !areaId || a.id === areaId)
  const base = (a: AreaCurriculo) => ({ gradoId: grado.id, grado: nombreGrado, areaId: a.id, area: a.nombre })

  // Orden: tema exacto, temas que empiezan igual, temas con todas las palabras, temas parecidos y luego desempeños.
  const nq = normalizar(q.trim())
  const res: (Resultado & { orden: number })[] = []
  for (const a of areas) {
    let completos = 0
    for (const { tema: t, indiceCompetencia } of temasDe(a)) {
      const n = puntaje(b, t)
      if (n === b.length) {
        completos++
        const nt = normalizar(t)
        res.push({ ...base(a), tema: t, indiceCompetencia, orden: nt === nq ? 0 : nt.startsWith(nq) ? 1 : 2 })
      } else if (parecido(n, b)) res.push({ ...base(a), tema: t, indiceCompetencia, parcial: true, orden: 3 })
    }
    if (completos) continue
    // Un desempeño por curso: el que tenga más palabras de la búsqueda.
    let mejor = { n: 0, cita: '' }
    for (const t of textoDe(a)) {
      const n = puntaje(b, t)
      if (n > mejor.n) mejor = { n, cita: t }
    }
    if (mejor.n === b.length) res.push({ ...base(a), tema: capitalizar(q.trim()), cita: mejor.cita, orden: 4 })
    else if (parecido(mejor.n, b)) res.push({ ...base(a), tema: capitalizar(q.trim()), cita: mejor.cita, parcial: true, orden: 5 })
  }
  return res.sort((x, y) => x.orden - y.orden).map(({ orden: _, ...r }) => r)
}

/** Cursos con los que se empieza cuando la docente enseña "todos los cursos". */
const PRINCIPALES = ['matematica', 'comunicacion', 'ciencia-y-tecnologia', 'personal-social', 'ciencias-sociales']

/** El área del grado que cubre el curso y, si el curso es de una competencia (curso de colegio privado), su índice. */
export function areaDelCurso(grado: GradoCurriculo, cursoId: string): { area: AreaCurriculo; competencia?: number } | null {
  const c = cursoPorId(cursoId)
  const area = c && grado.areas.find((a) => c.areas.includes(a.id))
  if (!c || !area) return null
  if (!c.competencia) return { area }
  const i = area.competencias.findIndex((x) => x.nombre.startsWith(c.competencia!))
  return i < 0 ? null : { area, competencia: i }
}

/** ¿El resultado es de ese curso? Para un curso de colegio privado, además, de su competencia. */
export function esDelCurso(grado: GradoCurriculo | undefined, r: Resultado, cursoId: string): boolean {
  const c = cursoPorId(cursoId)
  if (!c?.areas.includes(r.areaId)) return false
  if (!c.competencia || !grado) return true
  const d = areaDelCurso(grado, cursoId)
  if (!d || d.area.id !== r.areaId) return false
  const i = r.indiceCompetencia ?? (r.cita ? d.area.competencias.findIndex((x) => x.desempenos.includes(r.cita!)) : -1)
  return i === d.competencia
}

/**
 * Sin escribir nada: los primeros temas de cada grado y curso que enseña, turnándose (un tema de cada uno y luego
 * el siguiente), para empezar con un clic. Con "todos los cursos" se usan los principales del nivel.
 */
export function sugerenciasPara(grados: GradoCurriculo[], cursos: string[], nombres: Record<string, string>, maximo = 8): Resultado[] {
  const pares = grados.flatMap((g) =>
    (cursos.length ? cursos : PRINCIPALES)
      .map((id) => areaDelCurso(g, id))
      .filter((x): x is NonNullable<typeof x> => !!x)
      .map(({ area: a, competencia }) => ({ g, a, temas: temasDe(a).filter((t) => competencia === undefined || t.indiceCompetencia === competencia) })),
  )
  const res: Resultado[] = []
  const vistos = new Set<string>()
  for (let i = 0; res.length < maximo && pares.some((p) => p.temas[i]); i++)
    for (const { g, a, temas } of pares) {
      const t = temas[i]
      const k = `${g.id}|${a.id}|${t?.tema}`
      if (!t || res.length >= maximo || vistos.has(k)) continue
      vistos.add(k)
      res.push({ tema: t.tema, indiceCompetencia: t.indiceCompetencia, gradoId: g.id, grado: nombres[g.id] ?? g.id, areaId: a.id, area: a.nombre })
    }
  return res
}

/** Temas que coinciden en todos los grados (para cuando no aparece en el grado elegido). */
export async function buscarEnTodos(q: string, nombres: Record<string, string>, excepto?: string): Promise<Resultado[]> {
  const b = consulta(q)
  if (!b.length) return []
  const niveles = await Promise.all(NIVELES.map((n) => cargarNivel(n.id)))
  const res: Resultado[] = []
  for (const nivel of niveles)
    for (const g of nivel?.grados ?? []) {
      if (g.id === excepto || !nombres[g.id]) continue
      for (const a of g.areas)
        for (const { tema: t, indiceCompetencia } of temasDe(a))
          if (puntaje(b, t) === b.length) res.push({ tema: t, indiceCompetencia, gradoId: g.id, grado: nombres[g.id], areaId: a.id, area: a.nombre })
    }
  return res
}

/**
 * La competencia, la capacidad y los desempeños que más se parecen al tema. Si ya se sabe la competencia
 * (el tema es de su lista), se usa esa.
 */
export function fundamento(area: AreaCurriculo, tema: string, cita?: string, indice?: number): Fundamento {
  const claves = palabras(tema)
    .filter((p) => p.length > 3 && !VACIAS.has(p))
    .map((p) => p.slice(0, 5))
  const puntos = (t: string) => {
    const ps = palabras(t)
    return claves.filter((c) => ps.some((p) => p.startsWith(c))).length
  }

  let mejor = { i: 0, total: -1 }
  area.competencias.forEach((c, i) => {
    const total =
      c.desempenos.reduce((n, d) => n + puntos(d), 0) + (cita && c.desempenos.includes(cita) ? 100 : 0) + (c.temas?.some((t) => normalizar(t) === normalizar(tema)) ? 100 : 0)
    if (total > mejor.total) mejor = { i, total }
  })
  const c = area.competencias[indice ?? mejor.i] ?? area.competencias[mejor.i]
  if (!c) return { competencia: '', capacidad: '', desempenos: [] }

  const desempenos = [...c.desempenos]
    .map((d, i) => ({ d, p: d === cita ? 100 : puntos(d), i }))
    .sort((x, y) => y.p - x.p || x.i - y.i)
    .slice(0, 2)
    .map((x) => x.d)
  const capacidad = [...c.capacidades].sort((x, y) => puntos(y) - puntos(x))[0] ?? ''
  return { competencia: c.nombre, capacidad, desempenos }
}
