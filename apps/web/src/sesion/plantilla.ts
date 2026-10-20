// La sesión de aprendizaje se arma al instante, sin IA, con el tema, sus desempeños y lo que ya hay del tema (banco y
// problemas), con las partes y el orden de las sesiones que publica el MINEDU (ver obsidian/SESION.md). El docente la
// ajusta y corrige con un clic.
import type { Ficha } from '../api'
import type { AreaCurriculo, Competencia } from '../curriculo/cargar'
import type { ContextoSesion } from './contexto'
import { ENFOQUES, ENFOQUE_INICIAL } from './enfoques'
import { formaDe } from './procesos'
import { FORMATO_SESION, type OpcionesSesion, type Sesion } from './tipos'

/** «Reflexiones sobre el aprendizaje», tal cual las sesiones del MINEDU. */
export const REFLEXIONES = [
  '¿Qué avances tuvieron los estudiantes?, ¿qué dificultades experimentaron?',
  '¿Qué aprendizajes debo reforzar en la siguiente sesión?',
  '¿Qué actividades, estrategias y materiales funcionaron y cuáles no?',
]

/** Los niveles de la escala de valoración de las sesiones del MINEDU. */
export const NIVELES_ESCALA = ['Nunca', 'A veces', 'Siempre']

/** Tiempos aproximados de las sesiones del MINEDU: 10/25/10 en 45 minutos y 10/70/10 en 90. */
const MINUTOS = { 45: [10, 25, 10], 90: [10, 70, 10] } as const

export const opcionesIniciales = (ficha: Ficha | null): OpcionesSesion => ({ duracion: ficha?.duracion.startsWith('90') ? 90 : 45, enfoque: ENFOQUE_INICIAL })

const sinTildes = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()

/** La competencia del tema dentro del área: por sus desempeños o, si no, por su nombre. */
function competenciaDe(ficha: Ficha, area: AreaCurriculo | null): Competencia | null {
  if (!area) return null
  const guardados = ficha.curriculo.desempenos ?? []
  return (
    area.competencias.find((c) => guardados.some((d) => c.desempenos.includes(d))) ??
    area.competencias.find((c) => sinTildes(c.nombre) === sinTildes(ficha.curriculo.competencia)) ??
    null
  )
}

export function sesionPlantilla(ficha: Ficha, opciones: OpcionesSesion, area: AreaCurriculo | null, contexto: ContextoSesion): Sesion {
  const competencia = competenciaDe(ficha, area)
  const nombreCompetencia = competencia?.nombre ?? ficha.curriculo.competencia
  const { forma, precision } = formaDe({ ...ficha, competencia: nombreCompetencia }, contexto.problemas)
  // Una pregunta del banco del tema para recoger los saberes previos.
  const pregunta = contexto.banco?.preguntas[0]?.pregunta
  const [inicio, desarrollo, cierre] = MINUTOS[opciones.duracion]

  return {
    formato: FORMATO_SESION,
    opciones,
    titulo: forma.titulo,
    // «4.º de primaria», como en el encabezado de las sesiones del MINEDU.
    grado: ficha.grado.replace(/ (primaria|secundaria)$/, ' de $1'),
    area: ficha.area,
    competencia: nombreCompetencia,
    capacidades: competencia?.capacidades ?? [ficha.curriculo.capacidad].filter(Boolean),
    desempenos: (ficha.curriculo.desempenos ?? []).filter(Boolean),
    evidencia: forma.evidencia,
    instrumento: 'Escala de valoración (Anexo 1)',
    enfoque: ENFOQUES[opciones.enfoque] ?? ENFOQUES[ENFOQUE_INICIAL],
    preparacion: {
      antes: [
        'Prepara los materiales necesarios y adecúa el aula de acuerdo con las actividades que realizarás.',
        ...forma.antes,
        'Revisa con anticipación la escala de valoración del Anexo 1 y úsala para observar el desempeño de los estudiantes.',
      ],
      recursos: ['Papelotes, plumones y cinta adhesiva', ...forma.recursos, 'Escala de valoración (Anexo 1)'],
    },
    inicio: {
      minutos: inicio,
      bloques: [
        {
          titulo: 'En grupo clase',
          pasos: [
            'Saluda a los estudiantes y recuerda junto con ellos lo trabajado en la sesión anterior.',
            pregunta
              ? `Recoge sus saberes previos sobre el tema. Pregúntales, por ejemplo: «${pregunta}», y anota sus ideas en la pizarra.`
              : 'Recoge sus saberes previos sobre el tema: pregúntales qué saben y dónde lo han visto, y anota sus ideas en la pizarra.',
            ...forma.situacion,
            `Comunica el propósito de la sesión: «${forma.proposito}».`,
            'Explícales en qué te fijarás para saber si lo lograron: los desempeños de la escala de valoración (Anexo 1).',
            'Recuerda, junto con los estudiantes, las normas de convivencia para el trabajo que realizarán.',
          ],
        },
      ],
    },
    desarrollo: { minutos: desarrollo, bloques: forma.desarrollo },
    cierre: {
      minutos: cierre,
      bloques: [
        {
          titulo: 'En grupo clase',
          pasos: [
            'Recuerda junto con los estudiantes el propósito de la sesión. Luego, haz un recuento de las actividades realizadas.',
            'Motiva la reflexión acerca de en qué punto se encuentran con respecto al propósito: ¿qué aprendimos hoy?, ¿qué nos resultó difícil y cómo lo superamos?, ¿para qué nos sirve lo aprendido?',
            'Reconoce y menciona los aspectos positivos del trabajo realizado.',
          ],
        },
      ],
    },
    ejemplos: forma.ejemplos,
    precision,
  }
}
