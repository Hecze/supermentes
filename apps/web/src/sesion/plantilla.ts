// La sesión de aprendizaje se arma al instante con el tema y sus desempeños oficiales: no llama a la IA.
// El docente la ajusta (duración) y corrige cualquier texto con un clic.
import type { Ficha, OpcionesSesion, Sesion } from '../api'
import type { AreaCurriculo, Competencia } from '../curriculo/cargar'

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

/** Una sesión en formato MINEDU lista para editar, armada con lo que ya trae la ficha. */
export function sesionPlantilla(ficha: Ficha, opciones: OpcionesSesion, area: AreaCurriculo | null = null): Sesion {
  const competencia = competenciaDe(ficha, area)
  const desempenos = (ficha.curriculo.desempenos ?? []).filter(Boolean)
  const titulo = ficha.titulo
  const interes = opciones.interes?.trim()
  const largo = opciones.duracion === 90

  // Los criterios son los desempeños oficiales del grado, tal cual: así el "i" puede citarlos letra por letra.
  const criterios = desempenos.slice(0, 3).map((d) => ({ texto: d, desempeno: d, cita: d }))
  const criteriosFinales = criterios.length
    ? criterios
    : [
        { texto: `Explica con sus palabras qué es «${titulo}».` },
        { texto: `Resuelve ejercicios sobre «${titulo}» siguiendo los pasos trabajados.` },
        { texto: 'Justifica sus respuestas con el vocabulario del tema.' },
      ]

  const capacidades = competencia?.capacidades?.length
    ? competencia.capacidades
    : [ficha.curriculo.capacidad].filter(Boolean)

  const conceptos = (ficha.conceptos ?? []).filter(Boolean)
  const vocabulario = (ficha.vocabulario ?? []).filter((v) => v.palabra.trim())
  const ejemplo = (ficha.ejemplo ?? '').trim()
  const error = (ficha.errorFrecuente ?? '').trim()

  const motivacion = [
    ejemplo
      ? `El docente presenta una situación de la vida diaria: ${ejemplo}`
      : `El docente presenta una situación de la vida diaria relacionada con «${titulo}».`,
    interes && `La situación usa algo que le gusta al salón: ${interes}.`,
    'Los estudiantes comentan en parejas qué saben del tema y qué les gustaría aprender.',
  ].filter((p): p is string => !!p)

  const explica = [
    ...conceptos.slice(0, 3).map((c) => `El docente explica con un ejemplo: ${c}.`),
    'Los estudiantes escuchan, preguntan sus dudas y copian las ideas principales.',
  ]

  const practica = [
    ejemplo ? `El docente resuelve con el grupo este ejemplo: ${ejemplo}` : 'El docente resuelve con el grupo un ejercicio parecido al de la explicación.',
    error && `Revisan juntos este error frecuente: ${error}`,
    'Los estudiantes resuelven un ejercicio parecido en la pizarra o en su cuaderno.',
  ].filter((p): p is string => !!p)

  const actividades: { consigna: string; lineas: number }[] = [
    { consigna: `Escribe con tus palabras qué es «${titulo}».`, lineas: 2 },
  ]
  if (vocabulario.length) {
    actividades.push({
      consigna: `Escribe una oración con dos de estas palabras: ${vocabulario.slice(0, 4).map((v) => v.palabra).join(', ')}.`,
      lineas: 3,
    })
  }
  if (conceptos[0]) actividades.push({ consigna: `Explica con un ejemplo lo que entendiste sobre: ${conceptos[0]}`, lineas: 3 })
  if (ejemplo) actividades.push({ consigna: `Resuelve este caso y muestra los pasos: ${ejemplo}`, lineas: 3 })
  if (error) actividades.push({ consigna: `Encuentra el error y corrígelo: ${error}`, lineas: 2 })
  actividades.push({ consigna: `Escribe dos ejemplos de «${titulo}» que veas en tu casa o en tu comunidad.`, lineas: 3 })

  const inicio = largo ? 15 : 10
  const cierre = largo ? 15 : 10

  return {
    opciones,
    titulo: `Aprendemos «${titulo}»`,
    grado: ficha.grado,
    area: ficha.area,
    competencia: competencia?.nombre ?? ficha.curriculo.competencia,
    capacidades,
    criterios: criteriosFinales,
    evidencia: `Ficha de aplicación resuelta sobre «${titulo}».`,
    instrumento: 'Escala de valoración',
    enfoque: {
      nombre: 'Enfoque de orientación al bien común',
      valor: 'Responsabilidad',
      actitudes: 'Los estudiantes asumen sus tareas, comparten los materiales y ayudan a sus compañeros.',
    },
    materiales: {
      antes: [
        'Revisa la ficha del tema y los desempeños del grado.',
        'Prepara la ficha de aplicación para cada estudiante.',
        'Consigue los materiales concretos que usarás en el ejemplo.',
      ],
      recursos: ['Pizarra y plumones', 'Cuaderno de trabajo', 'Ficha de aplicación', 'Material concreto del aula'],
    },
    proposito: (ficha.proposito ?? '').trim() || `Hoy aprenderemos sobre «${titulo}».`,
    minutos: { inicio, desarrollo: opciones.duracion - inicio - cierre, cierre },
    inicio: {
      motivacion,
      saberesPrevios: [`Pregunta: «¿Qué saben de ${titulo}? ¿Dónde lo han visto?»`, 'Anota las respuestas en la pizarra.'],
      conflicto: error
        ? [`El docente escribe esta respuesta y pregunta si es correcta: ${error}`, 'Los estudiantes explican por qué sí o por qué no.']
        : [`Pregunta: «¿Cómo podríamos usar ${titulo} en nuestra vida diaria?»`, 'Los estudiantes intentan responder; el docente todavía no da la respuesta.'],
      normas: ['Escuchamos con atención cuando habla un compañero.', 'Pedimos la palabra levantando la mano.', 'Cuidamos los materiales y los compartimos.'],
    },
    desarrollo: [
      { titulo: 'EXPLICAMOS EL TEMA', pasos: explica },
      { titulo: 'PRACTICAMOS JUNTOS', pasos: practica },
      {
        titulo: 'TRABAJAMOS SOLOS',
        pasos: ['Cada estudiante resuelve la ficha de aplicación.', 'El docente acompaña y revisa a quienes lo necesiten.', 'Revisan juntos las respuestas y explican los pasos.'],
      },
    ],
    cierre: {
      sistematizacion: ['Con ayuda de los estudiantes, escribe en la pizarra las ideas principales del tema.', 'Relaciona lo aprendido con el propósito de la sesión.'],
      metacognicion: ['¿Qué aprendimos hoy?', '¿Qué fue lo más difícil y cómo lo resolvimos?', '¿Para qué nos sirve lo que aprendimos?'],
      tarea: ['Termina en tu cuaderno los ejercicios de la ficha que no alcanzaste a resolver.'],
    },
    ficha: { titulo: `Ficha de aplicación: ${titulo}`, actividades },
  }
}
