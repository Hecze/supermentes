// Sesión de aprendizaje lista para presentar al director, en el formato que usa el MINEDU: datos, competencia,
// capacidades, criterios con su desempeño oficial, enfoque transversal, momentos con tiempos, ficha y escala.
// La competencia, las capacidades y las citas salen de packages/curriculo: la IA solo elige y redacta.
//
//   POST /api/sesion  { ficha, opciones: { duracion: 45 | 90, interes? } }  → Sesion (apps/web/src/api/types.ts)
import { z } from 'zod'
import inicial from '../packages/curriculo/data/inicial.json' with { type: 'json' }
import primaria from '../packages/curriculo/data/primaria.json' with { type: 'json' }
import secundaria from '../packages/curriculo/data/secundaria.json' with { type: 'json' }
import { fallo, generar, json } from './_ia.js'

type Competencia = { nombre: string; capacidades: string[]; desempenos: string[] }
type Nivel = { grados: { id: string; areas: { id: string; competencias: Competencia[] }[] }[] }
const NIVELES: Record<string, Nivel> = { inicial, primaria, secundaria }

// Los enfoques transversales del Currículo Nacional (CNEB 2016) y sus valores.
const ENFOQUES: Record<string, string[]> = {
  'Enfoque de derechos': ['Conciencia de derechos', 'Libertad y responsabilidad', 'Diálogo y concertación'],
  'Enfoque inclusivo o de atención a la diversidad': ['Respeto por las diferencias', 'Equidad en la enseñanza', 'Confianza en la persona'],
  'Enfoque intercultural': ['Respeto a la identidad cultural', 'Justicia', 'Diálogo intercultural'],
  'Enfoque de igualdad de género': ['Igualdad y dignidad', 'Justicia', 'Empatía'],
  'Enfoque ambiental': ['Solidaridad planetaria y equidad intergeneracional', 'Justicia y solidaridad', 'Respeto a toda forma de vida'],
  'Enfoque de orientación al bien común': ['Equidad y justicia', 'Solidaridad', 'Empatía', 'Responsabilidad'],
  'Enfoque de búsqueda de la excelencia': ['Flexibilidad y apertura', 'Superación personal'],
}
const NOMBRES_ENFOQUE = Object.keys(ENFOQUES) as [string, ...string[]]

const lista = (que: string) => z.array(z.string()).describe(que)

const Esquema = z.object({
  titulo: z.string().describe('Título de la sesión, en primera persona plural, como "Representamos fracciones con material concreto"'),
  proposito: z.string().describe('Propósito dicho a los estudiantes: "Hoy aprenderemos a…"'),
  criterios: z
    .array(
      z.object({
        texto: z.string().describe('Criterio observable, en tercera persona: "Representa fracciones con dibujos y material concreto."'),
        desempeno: z.number().int().describe('Número del desempeño oficial (de la lista) que trabaja este criterio'),
        cita: z.string().describe('La parte del desempeño que corresponde justo a este criterio (no su comienzo general), de 5 a 25 palabras, copiada LETRA POR LETRA, sin comillas ni puntos suspensivos'),
      }),
    )
    .describe('3 criterios de evaluación'),
  evidencia: z.string().describe('Lo que el estudiante produce y se puede revisar (una oración)'),
  enfoque: z.enum(NOMBRES_ENFOQUE).describe('El enfoque transversal que mejor calza con la sesión'),
  valor: z.string().describe('Un valor de ese enfoque, tal cual de la lista'),
  actitudes: z.string().describe('Actitud observable del docente y los estudiantes (una oración)'),
  materialesAntes: lista('3 o 4 cosas que el docente prepara antes de la sesión'),
  recursos: lista('3 a 6 recursos y materiales concretos del aula (papelógrafo, plumones…)'),
  minutosInicio: z.number().int().describe('Minutos del inicio'),
  minutosCierre: z.number().int().describe('Minutos del cierre'),
  motivacion: lista('2 a 4 pasos de la motivación: una situación o dinámica cercana a los niños'),
  saberesPrevios: lista('2 o 3 pasos con preguntas para recoger lo que ya saben'),
  conflicto: lista('1 o 2 pasos: una situación o pregunta que los haga dudar y quieran aprender'),
  normas: lista('3 normas de convivencia cortas para esta clase'),
  desarrollo: z
    .array(z.object({ titulo: z.string().describe('Subtítulo corto en mayúsculas, como "TRABAJAMOS EN EQUIPO"'), pasos: lista('3 a 5 pasos concretos') }))
    .describe('3 o 4 partes del desarrollo, en orden'),
  sistematizacion: lista('1 o 2 pasos para ordenar lo aprendido'),
  metacognicion: lista('3 preguntas de metacognición'),
  tarea: lista('1 tarea corta para la casa'),
  fichaTitulo: z.string().describe('Título de la ficha de aplicación'),
  actividades: z
    .array(z.object({ consigna: z.string().describe('Consigna completa con los datos que necesita'), lineas: z.number().int().describe('Renglones para responder: 0 a 4') }))
    .describe('4 a 6 actividades concretas del tema, de fácil a difícil'),
})

type Ficha = {
  titulo: string
  grado: string
  area: string
  gradoId: string
  areaId: string
  proposito?: string
  conceptos?: string[]
  vocabulario?: { palabra: string }[]
  ejemplo?: string
  errorFrecuente?: string
  curriculo?: { competencia?: string; desempenos?: string[] }
}

const sinTildes = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
// La IA a veces envuelve la cita en comillas o la corta con "…": eso se quita; el resto tiene que coincidir tal cual.
const limpiarCita = (c: string) => c.trim().replace(/^[«"“'…\s.]+|[»"”'…\s]+$/g, '').replace(/[.,;:]$/, '')

/** El área del grado y la competencia del tema, con texto oficial. */
function curriculoDe(ficha: Ficha) {
  const nivel = NIVELES[ficha.gradoId?.split('-')[0]]
  const area = nivel?.grados.find((g) => g.id === ficha.gradoId)?.areas.find((a) => a.id === ficha.areaId)
  if (!area) return null
  const guardados = ficha.curriculo?.desempenos ?? []
  const competencia =
    area.competencias.find((c) => guardados.some((d) => c.desempenos.includes(d))) ??
    area.competencias.find((c) => sinTildes(c.nombre) === sinTildes(ficha.curriculo?.competencia ?? '')) ??
    area.competencias[0]
  // Los desempeños que guardó el tema (verificados contra el currículo); si no hay, los de su competencia.
  const delTema = guardados.filter((d) => competencia.desempenos.includes(d))
  return { area, competencia, desempenos: delTema.length ? delTema : competencia.desempenos }
}

export async function POST(request: Request) {
  try {
    const { ficha, opciones } = ((await request.json().catch(() => null)) ?? {}) as { ficha?: Ficha; opciones?: { duracion?: number; interes?: string } }
    if (!ficha?.titulo) return json({ error: 'Falta el tema.' }, 400)
    const cur = curriculoDe(ficha)
    if (!cur) return json({ error: 'No encontramos este tema en el Currículo Nacional. Elige el tema otra vez desde el buscador.' }, 400)
    const duracion = opciones?.duracion === 90 ? 90 : 45
    const interes = typeof opciones?.interes === 'string' ? opciones.interes.trim().slice(0, 80) : ''

    const s = await generar(Esquema, [
      {
        type: 'text',
        text: [
          `Escribe una sesión de aprendizaje de ${duracion} minutos para ${ficha.grado}, ${ficha.area}: «${ficha.titulo}».`,
          'Es el documento que el docente presenta al director, en el formato del MINEDU: inicio, desarrollo y cierre, con pasos concretos que el docente pueda seguir tal cual en un aula pública peruana.',
          `Competencia del Currículo Nacional: ${cur.competencia.nombre}`,
          `Capacidades: ${cur.competencia.capacidades.join('; ')}`,
          `Desempeños oficiales del grado (cada criterio cita uno, por su número):\n${cur.desempenos.map((d, i) => `${i + 1}. ${d}`).join('\n')}`,
          ficha.proposito && `Propósito del tema: ${ficha.proposito}`,
          ficha.conceptos?.length && `Ideas clave:\n- ${ficha.conceptos.slice(0, 6).join('\n- ')}`,
          ficha.vocabulario?.length && `Palabras del tema: ${ficha.vocabulario.slice(0, 8).map((v) => v.palabra).join(', ')}`,
          ficha.ejemplo && `Ejemplo cotidiano: ${ficha.ejemplo}`,
          ficha.errorFrecuente && `Error frecuente que conviene trabajar: ${ficha.errorFrecuente}`,
          interes && `Al salón le gusta: ${interes}. Úsalo en la motivación y en algunas actividades de la ficha.`,
          `Tiempos: inicio y cierre cortos (en una clase de ${duracion} min, unos ${duracion === 90 ? '15' : '10'} min cada uno); el resto es desarrollo.`,
          `Valores posibles por enfoque:\n${Object.entries(ENFOQUES).map(([e, v]) => `- ${e}: ${v.join(', ')}`).join('\n')}`,
          'Pasos cortos (una o dos oraciones), en tercera persona ("El docente…", "Los estudiantes…"). Si es matemática, verifica cada cálculo de la ficha.',
          'La ficha de aplicación es solo texto: no menciones imágenes que no están; si hace falta un dibujo, que lo haga el estudiante.',
        ]
          .filter(Boolean)
          .join('\n'),
      },
    ])

    // Cada cita tiene que aparecer tal cual en un desempeño oficial; si no, el criterio queda sin cita.
    const todos = cur.area.competencias.flatMap((c) => c.desempenos)
    const criterios = s.criterios.map((c) => {
      const cita = limpiarCita(c.cita)
      const elegido = cur.desempenos[c.desempeno - 1]
      const desempeno = cita.length >= 12 ? (elegido?.includes(cita) ? elegido : todos.find((d) => d.includes(cita))) : undefined
      return desempeno ? { texto: c.texto, desempeno, cita } : { texto: c.texto }
    })

    // Los tiempos suman la duración elegida: el desarrollo se lleva lo que queda.
    const base = duracion === 90 ? 15 : 10
    const corto = (m: number) => (m >= 5 && m <= duracion / 3 ? m : base)
    const inicio = corto(s.minutosInicio)
    const cierre = corto(s.minutosCierre)

    const valores = ENFOQUES[s.enfoque] ?? ENFOQUES[NOMBRES_ENFOQUE[0]]
    return json({
      opciones: { duracion, ...(interes && { interes }) },
      titulo: s.titulo,
      grado: ficha.grado,
      area: ficha.area,
      competencia: cur.competencia.nombre,
      capacidades: cur.competencia.capacidades,
      criterios,
      evidencia: s.evidencia,
      instrumento: 'Escala de valoración',
      enfoque: { nombre: s.enfoque, valor: valores.find((v) => sinTildes(v) === sinTildes(s.valor)) ?? valores[0], actitudes: s.actitudes },
      materiales: { antes: s.materialesAntes, recursos: s.recursos },
      proposito: s.proposito,
      minutos: { inicio, desarrollo: duracion - inicio - cierre, cierre },
      inicio: { motivacion: s.motivacion, saberesPrevios: s.saberesPrevios, conflicto: s.conflicto, normas: s.normas },
      desarrollo: s.desarrollo,
      cierre: { sistematizacion: s.sistematizacion, metacognicion: s.metacognicion, tarea: s.tarea },
      ficha: { titulo: s.fichaTitulo, actividades: s.actividades.map((a) => ({ consigna: a.consigna, lineas: Math.max(0, Math.min(4, a.lineas)) })) },
    })
  } catch (e) {
    return fallo(e)
  }
}
