// Cómo se desarrolla la sesión según el área y la competencia del tema, como lo hacen las sesiones de primaria que
// publica el MINEDU (unidades 2017). Cada forma lleva las sesiones oficiales que sigue. Si el área o la competencia no
// tiene ninguna (Inglés, Educación Religiosa, secundaria…), se usa la forma común y la vista avisa «formato impreciso».
// Qué sesión respalda cada forma: obsidian/SESION.md.
import type { Bloque } from './tipos'

const SESIONES = 'https://www.minedu.gob.pe/curriculo/pdf/unidades-primaria/'
const de = (...archivos: string[]) => archivos.map((a) => SESIONES + a)

export type Forma = {
  titulo: string
  proposito: string
  evidencia: string
  /** Lo que el inicio suma después de los saberes previos: el problema, la pregunta, el caso… */
  situacion: string[]
  desarrollo: Bloque[]
  /** Lo que se prepara y se usa además de lo común a toda sesión. */
  antes: string[]
  recursos: string[]
  /** Las sesiones del MINEDU que sigue esta forma. */
  ejemplos: string[]
}

type Datos = { tema: string; ejemplo: string }

/** "Fracciones de una cantidad" → "fracciones de una cantidad", para que el tema quepa dentro de una oración. */
const enOracion = (t: string) => (/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]/.test(t) ? t[0].toLowerCase() + t.slice(1) : t)

const FORMAS = {
  matematica: ({ tema, ejemplo }: Datos): Forma => ({
    titulo: `Resolvemos problemas de ${enOracion(tema)}`,
    proposito: `Hoy resolveremos problemas de ${enOracion(tema)}`,
    evidencia: `Resuelve problemas de ${enOracion(tema)} y explica cómo los resolvió.`,
    situacion: [
      ejemplo ? `Plantea la siguiente situación: ${ejemplo}` : 'Plantea una situación problemática de la vida diaria relacionada con el tema.',
      'Asegúrate de que los estudiantes hayan comprendido y de que se familiaricen con el problema. Para ello, pregúntales: ¿de qué trata el problema?, ¿qué datos tenemos?, ¿qué se pide?',
    ],
    desarrollo: [
      {
        titulo: 'En grupos pequeños',
        pasos: [
          'Promueve la búsqueda y ejecución de estrategias. Para ello, pregúntales: ¿cómo resolveremos el problema?, ¿qué materiales nos pueden ayudar?',
          'Monitorea el trabajo que realiza cada equipo y, a partir de preguntas y repreguntas, ayúdalos a verificar sus procedimientos.',
          'Realiza un adecuado tratamiento del error, considerándolo como una oportunidad de aprendizaje.',
        ],
      },
      {
        titulo: 'En grupo clase',
        pasos: [
          'Asegura la socialización de sus representaciones. Para ello, invita a un representante de cada equipo a explicar cómo resolvieron el problema.',
          'Asegura la formalización y reflexión de los saberes matemáticos y de los procedimientos con la participación de los estudiantes.',
          'Solicítales que trasladen lo aprendido a otra situación: plantea otros problemas para que los resuelvan.',
        ],
      },
    ],
    antes: ['Prepara la situación problemática que plantearás y el material concreto que podrán usar para resolverla.'],
    recursos: ['Material concreto del aula'],
    ejemplos: de('cuarto-grado/cuarto-grado-u1-s7.pdf', 'cuarto-grado/cuarto-grado-u1-s8.pdf', 'quinto-grado/quinto-grado-u1-s11.pdf', 'quinto-grado/quinto-grado-u1-s12.pdf'),
  }),

  lee: ({ tema }: Datos): Forma => ({
    titulo: `Leemos un texto sobre ${enOracion(tema)}`,
    proposito: `Hoy leeremos un texto sobre ${enOracion(tema)}`,
    evidencia: 'Explica de qué trata el texto leído y responde preguntas sobre él.',
    situacion: [],
    desarrollo: [
      {
        titulo: 'Antes de la lectura',
        pasos: [
          'Presenta el texto y ayuda a que los estudiantes determinen su propósito de lectura. Para ello, pregúntales: ¿para qué leeremos este texto?',
          'Pide que observen el título y las imágenes, y que comenten de qué tratará el texto. Anota sus hipótesis en la pizarra para confrontarlas durante y después de la lectura.',
        ],
      },
      {
        titulo: 'Durante la lectura',
        pasos: [
          'Invita a los estudiantes a leer el texto de manera personal y a subrayar las palabras que les son difíciles de comprender.',
          'Lean juntos el texto por partes. En cada pausa, pregunta de qué se habla en esa parte y si algunas palabras se pueden deducir por el contexto.',
        ],
      },
      {
        titulo: 'Después de la lectura',
        pasos: [
          'En grupos pequeños, invítalos a comentar con sus propias palabras el contenido del texto leído. Acércate a los grupos y oriéntalos de acuerdo con sus necesidades.',
          'En grupo clase, formaliza con ellos los saberes sobre el tema, el tipo de texto y el propósito del autor, y confronten las hipótesis que formularon antes de leer.',
        ],
      },
    ],
    antes: [`Selecciona el texto sobre ${enOracion(tema)} que leerán y prepáralo en un papelote o en copias.`],
    recursos: ['El texto que leerán, en un papelote o en copias'],
    ejemplos: de('cuarto-grado/cuarto-grado-u1-s4.pdf', 'cuarto-grado/cuarto-grado-u1-s16.pdf', 'quinto-grado/quinto-grado-u1-s3.pdf'),
  }),

  escribe: ({ tema }: Datos): Forma => ({
    titulo: `Escribimos un texto sobre ${enOracion(tema)}`,
    proposito: `Hoy escribiremos un texto sobre ${enOracion(tema)}`,
    evidencia: `Escribe y revisa un texto sobre ${enOracion(tema)}.`,
    situacion: [],
    desarrollo: [
      {
        titulo: 'Planificación del texto',
        pasos: [
          'Indica que ahora planificarán la escritura del texto. Formula las preguntas para la planificación: ¿qué escribiremos?, ¿para qué lo escribiremos?, ¿quiénes lo leerán?',
          'Anota sus respuestas en un papelote, para que las tengan presentes mientras escriben.',
        ],
      },
      {
        titulo: 'En grupos pequeños',
        pasos: [
          'Invita a los estudiantes a escribir su texto según lo planificado.',
          'Guía el trabajo de los estudiantes y brinda orientaciones para que revisen lo planificado.',
          'Observa la escritura de cada niño y niña, y oriéntalos según lo que necesiten.',
        ],
      },
      {
        titulo: 'En grupo clase',
        pasos: [
          'Indica que ahora revisarán sus textos: que verifiquen si responden a lo planificado y mejoren lo que haga falta.',
          'Brinda un tiempo prudencial para que escriban la versión final de sus textos.',
        ],
      },
    ],
    antes: [],
    recursos: ['Hojas para escribir el texto'],
    ejemplos: de('quinto-grado/quinto-grado-u1-s8.pdf', 'quinto-grado/quinto-grado-u1-s9.pdf'),
  }),

  oral: ({ tema }: Datos): Forma => ({
    titulo: `Dialogamos sobre ${enOracion(tema)}`,
    proposito: `Hoy dialogaremos sobre ${enOracion(tema)}`,
    evidencia: `Participa en el diálogo sobre ${enOracion(tema)}, expresando y explicando sus ideas.`,
    situacion: ['Plantea una pregunta sobre el tema y escríbela en la pizarra, para guiar el diálogo.'],
    desarrollo: [
      {
        titulo: 'Antes del diálogo',
        pasos: [
          'Invítalos a ubicar sus sillas formando un semicírculo, a fin de que todos puedan verse.',
          'Pide a un niño o a una niña que ayude a determinar cuál es el propósito del diálogo.',
          'Recuerda a los estudiantes cómo participar: expresarse de manera calmada, dar razones de sus ideas, escuchar con atención y respetar el uso de la palabra.',
        ],
      },
      {
        titulo: 'Durante el diálogo',
        pasos: [
          'Solicita un voluntario para que sea el moderador y organice los turnos para hablar.',
          'Escucha las intervenciones y anota en la pizarra las ideas principales.',
        ],
      },
      {
        titulo: 'Después del diálogo',
        pasos: [
          'Pide a los estudiantes que conversen sobre las ideas más importantes que se dijeron.',
          'Los estudiantes cierran el diálogo realizando un breve resumen de lo acordado.',
        ],
      },
    ],
    antes: [],
    recursos: [],
    ejemplos: de('cuarto-grado/cuarto-grado-u1-s3.pdf', 'quinto-grado/quinto-grado-u1-s2.pdf'),
  }),

  indaga: ({ tema }: Datos): Forma => ({
    titulo: `Indagamos sobre ${enOracion(tema)}`,
    proposito: `Hoy indagaremos sobre ${enOracion(tema)}`,
    evidencia: `Registra sus hipótesis y su plan de acción sobre ${enOracion(tema)}.`,
    situacion: ['Para el planteamiento del problema, formula una pregunta sobre el tema que puedan investigar.'],
    desarrollo: [
      {
        titulo: 'En grupo clase',
        pasos: ['Para el planteamiento de hipótesis, pide a los estudiantes que respondan la pregunta en su cuaderno y bríndales un tiempo para registrar sus hipótesis.'],
      },
      {
        titulo: 'En grupos pequeños',
        pasos: [
          'Solicita a los estudiantes que discutan sus hipótesis en el interior de cada grupo y que las escriban en un papelote.',
          'Los estudiantes elaboran el plan de acción para comprobar su hipótesis: una lista de actividades en un orden lógico, con los materiales que necesitarán.',
          'Acompaña a los grupos mientras llevan a cabo el plan y registran sus datos.',
        ],
      },
      {
        titulo: 'En grupo clase',
        pasos: [
          'Cada grupo presenta su trabajo. Pregunta, después de cada exposición, si todos están de acuerdo con lo presentado.',
          'Los estudiantes recogen las ideas de sus compañeros y las utilizan para mejorar su trabajo.',
        ],
      },
    ],
    antes: [],
    recursos: ['Materiales del sector de Ciencia y Tecnología'],
    ejemplos: de('cuarto-grado/cuarto-grado-u1-s13.pdf', 'cuarto-grado/cuarto-grado-u1-s14.pdf', 'quinto-grado/quinto-grado-u1-s19.pdf'),
  }),

  personal: ({ tema }: Datos): Forma => ({
    titulo: `Reflexionamos sobre ${enOracion(tema)}`,
    proposito: `Hoy reflexionaremos sobre ${enOracion(tema)}`,
    evidencia: `Explica sus ideas sobre ${enOracion(tema)} y propone acuerdos con sus compañeros.`,
    situacion: ['Plantea una situación o un caso cercano a los estudiantes relacionado con el tema y pregúntales qué opinan.'],
    desarrollo: [
      {
        titulo: 'En grupos pequeños',
        pasos: [
          'Organiza a los estudiantes en grupos y entrega a cada grupo la situación o el caso para que lo analicen y conversen sobre él.',
          'Monitorea el trabajo de los grupos y escucha cómo participan. Oriéntalos de acuerdo con sus necesidades.',
        ],
      },
      {
        titulo: 'En grupo clase',
        pasos: [
          'Cada grupo comparte lo que conversó. Abre un espacio de diálogo en el que todos puedan dar su opinión.',
          'Entre todos, acuerdan las ideas principales y los compromisos que asumirán.',
        ],
      },
    ],
    antes: ['Prepara la situación o el caso que analizarán los grupos.'],
    recursos: [],
    ejemplos: de(
      'cuarto-grado/cuarto-grado-u1-s1.pdf',
      'cuarto-grado/cuarto-grado-u1-s2.pdf',
      'cuarto-grado/cuarto-grado-u1-s5.pdf',
      'quinto-grado/quinto-grado-u1-s1.pdf',
      'quinto-grado/quinto-grado-u1-s4.pdf',
    ),
  }),

  aprecia: ({ tema }: Datos): Forma => ({
    titulo: `Apreciamos manifestaciones artístico-culturales: ${enOracion(tema)}`,
    proposito: `Hoy observaremos y apreciaremos manifestaciones artístico-culturales sobre ${enOracion(tema)}`,
    evidencia: 'Describe de manera oral, gráfica o escrita las manifestaciones artístico-culturales que observó.',
    situacion: [],
    desarrollo: [
      {
        titulo: 'En grupo clase',
        pasos: [
          'Muestra manifestaciones artístico-culturales relacionadas con el tema: imágenes, objetos, música o danzas.',
          'Pídeles que las observen cuidadosamente y que describan lo que ven: las líneas, las formas, los colores, los sonidos o los movimientos.',
        ],
      },
      {
        titulo: 'En grupos pequeños',
        pasos: [
          'A partir de preguntas, reflexiona junto con los estudiantes sobre lo que observaron y lo que creen que quiso comunicar el artista.',
          'Después de la conversación, invítalos a compartir sus respuestas. Anótalas en un papelote.',
        ],
      },
    ],
    antes: [],
    recursos: ['Imágenes, objetos o grabaciones de las manifestaciones artístico-culturales'],
    ejemplos: de('cuarto-grado/arteycult-cuartogrado-u1-sesion1.pdf'),
  }),

  crea: ({ tema }: Datos): Forma => ({
    titulo: `Creamos a partir de ${enOracion(tema)}`,
    proposito: `Hoy exploraremos y crearemos a partir de ${enOracion(tema)}`,
    evidencia: `Crea un trabajo artístico a partir de ${enOracion(tema)} y lo comparte con sus compañeros.`,
    situacion: [],
    desarrollo: [
      {
        titulo: 'En grupo clase',
        pasos: [
          'Invita a los estudiantes a explorar los materiales, los sonidos o los movimientos que usarán.',
          'Los estudiantes crean su trabajo artístico. Acompáñalos y oriéntalos según lo que necesiten.',
          'Divide la clase en dos grupos, unos que presentan y otros que observan, y luego intercambian los roles.',
        ],
      },
    ],
    antes: [],
    recursos: ['Materiales para el trabajo artístico'],
    ejemplos: de('cuarto-grado/arteycult-cuartogrado-u1-sesion1.pdf', 'cuarto-grado/arteycult-cuartogrado-u1-sesion2.pdf'),
  }),

  juego: ({ tema }: Datos): Forma => ({
    titulo: `Jugamos y aprendemos: ${enOracion(tema)}`,
    proposito: `Hoy aprenderemos sobre ${enOracion(tema)} a través del juego`,
    evidencia: 'Participa en los juegos y propone reglas que favorecen la participación de todos.',
    situacion: [],
    desarrollo: [
      {
        titulo: 'En grupo clase',
        pasos: [
          'Presenta el juego o la actividad y acuerda con los estudiantes sus reglas.',
          'Los acuerdos se toman buscando el bien común, teniendo en cuenta a todos.',
        ],
      },
      {
        titulo: 'En grupos pequeños',
        pasos: [
          'Los estudiantes juegan y, al terminar, proponen cambios a las reglas para que todos participen.',
          'Acompaña a los grupos y observa cómo participan.',
        ],
      },
    ],
    antes: [],
    recursos: ['Materiales de Educación Física que tenga la I.E.'],
    ejemplos: de('cuarto-grado/edufisica1-4togrado.pdf', 'cuarto-grado/edufisica2-4togrado.pdf'),
  }),

  comun: ({ tema }: Datos): Forma => ({
    titulo: `Aprendemos sobre ${enOracion(tema)}`,
    proposito: `Hoy aprenderemos sobre ${enOracion(tema)}`,
    evidencia: `Trabajo de los estudiantes sobre ${enOracion(tema)}.`,
    situacion: [],
    desarrollo: [
      { titulo: 'En grupo clase', pasos: ['Presenta la actividad que realizarán sobre el tema y explícales qué harán.'] },
      { titulo: 'En grupos pequeños', pasos: ['Acompaña el trabajo de los grupos y, a partir de preguntas y repreguntas, ayúdalos a avanzar.'] },
      { titulo: 'En grupo clase', pasos: ['Cada grupo comparte lo trabajado y, entre todos, formalizan lo aprendido.'] },
    ],
    antes: [],
    recursos: [],
    ejemplos: [],
  }),
}

/** Qué forma usa cada área de primaria y, si depende de la competencia, cada competencia (comienzo de su nombre). */
const POR_COMPETENCIA: { area: string; competencia?: string; forma: keyof typeof FORMAS }[] = [
  { area: 'matematica', forma: 'matematica' },
  { area: 'comunicacion', competencia: 'Se comunica oralmente', forma: 'oral' },
  { area: 'comunicacion', competencia: 'Lee diversos tipos', forma: 'lee' },
  { area: 'comunicacion', competencia: 'Escribe diversos tipos', forma: 'escribe' },
  { area: 'ciencia-y-tecnologia', competencia: 'Indaga', forma: 'indaga' },
  { area: 'personal-social', competencia: 'Construye su identidad', forma: 'personal' },
  { area: 'personal-social', competencia: 'Convive y participa', forma: 'personal' },
  { area: 'arte-y-cultura', competencia: 'Aprecia', forma: 'aprecia' },
  { area: 'arte-y-cultura', competencia: 'Crea proyectos', forma: 'crea' },
  { area: 'educacion-fisica', competencia: 'Interactúa', forma: 'juego' },
]

export function formaDe(tema: { gradoId: string; areaId: string; competencia: string; titulo: string; ejemplo: string }): Forma {
  const x = tema.gradoId.startsWith('primaria-')
    ? POR_COMPETENCIA.find((p) => p.area === tema.areaId && (!p.competencia || tema.competencia.startsWith(p.competencia)))
    : undefined
  return FORMAS[x?.forma ?? 'comun']({ tema: tema.titulo, ejemplo: tema.ejemplo })
}
