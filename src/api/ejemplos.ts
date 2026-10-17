// Datos de ejemplo para el prototipo. Tienen la misma forma que devolverá el backend real.
import type {
  Adaptacion,
  Cancion,
  Examen,
  Ficha,
  Juego,
  Material,
  Necesidad,
  OpcionesCancion,
  OpcionesExamen,
  PreguntaExamen,
  TemaReciente,
} from './types'

export const DOCENTE = {
  nombre: 'Rosa Quispe',
  saludo: 'profe Rosa',
  colegio: 'I.E. N.º 2048 · San Juan de Lurigancho',
}

export const FICHA_EJEMPLO: Ficha = {
  id: 'ficha-fracciones-4',
  titulo: 'Fracciones: partes de un todo',
  grado: '4.º primaria',
  area: 'Matemática',
  duracion: '45 min',
  fuente: 'Foto del libro de Matemática, pág. 48',
  proposito:
    'Que los estudiantes representen fracciones como partes iguales de un todo y diferencien el numerador del denominador.',
  curriculo: {
    competencia: 'Resuelve problemas de cantidad',
    capacidad: 'Comunica su comprensión sobre los números y las operaciones',
  },
  conceptos: [
    'Un entero se divide en partes iguales.',
    'El denominador dice en cuántas partes iguales se dividió el entero.',
    'El numerador dice cuántas de esas partes tomamos.',
    'Dos fracciones pueden valer lo mismo: 1/2 = 2/4.',
  ],
  vocabulario: [
    { palabra: 'fracción', definicion: 'Representa partes iguales de un todo.' },
    { palabra: 'numerador', definicion: 'Número de arriba: cuántas partes tomas.' },
    { palabra: 'denominador', definicion: 'Número de abajo: en cuántas partes se divide el entero.' },
    { palabra: 'entero', definicion: 'La pizza completa, antes de cortarla.' },
    { palabra: 'mitad', definicion: 'Una de dos partes iguales.' },
    { palabra: 'tercio', definicion: 'Una de tres partes iguales.' },
    { palabra: 'cuarto', definicion: 'Una de cuatro partes iguales.' },
    { palabra: 'octavo', definicion: 'Una de ocho partes iguales.' },
  ],
  ejemplo: 'Si un queque se corta en 8 tajadas iguales y te comes 3, te comiste 3/8 del queque.',
  errorFrecuente: 'Confunden el numerador con el denominador: creen que el número más grande siempre va arriba.',
  coincidenciasBiblioteca: 3,
}

export const TEMAS_RECIENTES: TemaReciente[] = [
  { titulo: 'Fracciones: partes de un todo', cuando: 'Hoy', grado: '4.º primaria', herramientas: ['cancion', 'examen', 'juego', 'adaptar'] },
  { titulo: 'El ciclo del agua', cuando: 'Ayer', grado: '4.º primaria', herramientas: ['crucigrama', 'adaptar'] },
  { titulo: 'Sustantivos propios y comunes', cuando: 'Lunes', grado: '4.º primaria', herramientas: ['juego'] },
]

// ---------- Canción ----------

const ARTICULO_RITMO: Record<string, string> = {
  Cumbia: 'La cumbia',
  Huayno: 'El huayno',
  Festejo: 'El festejo',
  Rap: 'El rap',
  Balada: 'La balada',
}

export function cancionEjemplo(opciones: OpcionesCancion): Cancion {
  if (opciones.modo === 'melodia') {
    return {
      titulo: 'Las fracciones dicen',
      opciones,
      partes: [
        {
          etiqueta: 'Estrofa',
          lineas: [
            'Las fracciones dicen',
            'parte, parte, parte,',
            'cuando el entero',
            'se va a repartir.',
          ],
        },
        {
          etiqueta: 'Estrofa',
          lineas: [
            'Arriba las que tomo,',
            'abajo en cuántas parto,',
            'y así aprendo yo',
            'a compartir.',
          ],
        },
      ],
    }
  }
  return {
    titulo: `${ARTICULO_RITMO[opciones.ritmo] ?? 'La canción'} de las fracciones`,
    opciones,
    partes: [
      {
        etiqueta: 'Verso 1',
        lineas: [
          'Tengo una pizza redonda y entera,',
          'la corto en ocho, ¡qué rica manera!',
          'Me como tres y te cuento el secreto:',
          'tres octavos me comí, ¡eso es correcto!',
        ],
      },
      {
        etiqueta: 'Coro',
        lineas: [
          'Arriba el numerador, cuántas partes tomo yo,',
          'abajo el denominador, en cuántas se partió.',
          '¡Fracción, fracción, partes iguales son!',
        ],
      },
      {
        etiqueta: 'Verso 2',
        lineas: [
          'Si parto un queque en cuatro pedazos',
          'y le doy uno a mi abuela con un abrazo,',
          'un cuarto se fue, me quedan tres cuartos,',
          '¡las fracciones están en todos lados!',
        ],
      },
      {
        etiqueta: 'Coro',
        lineas: [
          'Arriba el numerador, cuántas partes tomo yo,',
          'abajo el denominador, en cuántas se partió.',
          '¡Fracción, fracción, partes iguales son!',
        ],
      },
    ],
  }
}

// ---------- Examen ----------

const ORIGINALES = [
  { original: 'Escribe la fracción que representa 3 partes de 4.', respuesta: '3/4' },
  { original: '¿Cuál es el denominador en 5/8? ¿Qué indica?', respuesta: '8: el entero se dividió en 8 partes iguales.' },
  { original: '¿Qué fracción es mayor: 1/2 o 1/4?', respuesta: '1/2' },
  { original: 'Completa: 1/2 = ▢/4', respuesta: '2/4' },
]

const FRACCIONES: [number, number][] = [
  [3, 4],
  [5, 8],
  [1, 2],
  [2, 4],
]

const TEMAS_EXAMEN: Record<string, { titulo: string; intro: string; etiquetaPaso: string; textos: string[] }> = {
  Fútbol: {
    titulo: 'Misión: ¡la final del campeonato!',
    intro: 'Tu equipo llegó a la final. Resuelve cada jugada para levantar la copa.',
    etiquetaPaso: 'Jugada',
    textos: [
      'Tu equipo patea 4 penales y mete 3. ¿Qué fracción de los penales terminó en gol?',
      'La pelota está cosida con 8 parches y 5 son blancos: 5/8. ¿Cuál es el denominador y qué indica?',
      'En la tribuna, Sofía toma 1/2 jarra de chicha morada y Luis toma 1/4. ¿Quién tomó más?',
      'El entrenador divide la práctica en 4 partes iguales y la mitad es calentamiento. ¿Cuántos cuartos son de calentamiento?',
    ],
  },
  Animales: {
    titulo: 'Misión: rescate en la Amazonía',
    intro: 'Los animales del bosque necesitan tu ayuda. Cada respuesta correcta libera a uno.',
    etiquetaPaso: 'Rescate',
    textos: [
      'Un grupo de 4 delfines rosados nada en el río y 3 saltan fuera del agua. ¿Qué fracción del grupo saltó?',
      'Un guacamayo tiene 8 plumas en la cola y 5 son rojas: 5/8. ¿Cuál es el denominador y qué indica?',
      'Un perezoso come 1/2 hoja y un mono come 1/4 de otra hoja igual. ¿Quién comió más?',
      'El río tiene 4 tramos iguales y la mitad tiene pirañas. ¿Cuántos cuartos del río tienen pirañas?',
    ],
  },
  Cocina: {
    titulo: 'Misión: chef por un día',
    intro: 'Hoy cocinas para todo el salón. Cada receta resuelta suma una estrella.',
    etiquetaPaso: 'Receta',
    textos: [
      'Horneaste 4 panes y ya se vendieron 3. ¿Qué fracción de los panes se vendió?',
      'Cortaste una pizza en 8 tajadas y 5 tienen aceitunas: 5/8. ¿Cuál es el denominador y qué indica?',
      'Para el queque, Ana usa 1/2 taza de azúcar y Pedro 1/4 de taza. ¿Quién usó más azúcar?',
      'La receta tiene 4 pasos iguales y ya hiciste la mitad. ¿Cuántos cuartos de la receta terminaste?',
    ],
  },
}

export function examenEjemplo(opciones: OpcionesExamen): Examen {
  const tema = TEMAS_EXAMEN[opciones.interes] ?? TEMAS_EXAMEN.Fútbol
  const preguntas: PreguntaExamen[] = ORIGINALES.map((o, i) => ({
    ...o,
    texto: tema.textos[i],
    fraccion: FRACCIONES[i],
    ilustracion: null,
  }))
  if (opciones.formato === 'contextualizado') {
    return { opciones, titulo: `Evaluación: fracciones (${opciones.interes.toLowerCase()})`, intro: 'Resuelve cada problema.', etiquetaPaso: 'Pregunta', preguntas }
  }
  return { opciones, titulo: tema.titulo, intro: tema.intro, etiquetaPaso: tema.etiquetaPaso, preguntas }
}

// ---------- Juego ----------

export const JUEGO_EJEMPLO: Juego = {
  codigo: 'FRAC-4B',
  pares: [
    { a: { texto: '1/2' }, b: { texto: 'un medio', fraccion: [1, 2] } },
    { a: { texto: '1/4' }, b: { texto: 'un cuarto', fraccion: [1, 4] } },
    { a: { texto: '3/4' }, b: { texto: 'tres cuartos', fraccion: [3, 4] } },
    { a: { texto: '1/3' }, b: { texto: 'un tercio', fraccion: [1, 3] } },
    { a: { texto: '2/3' }, b: { texto: 'dos tercios', fraccion: [2, 3] } },
    { a: { texto: '3/8' }, b: { texto: 'tres octavos', fraccion: [3, 8] } },
  ],
  preguntas: [
    {
      pregunta: '¿Qué número de la fracción dice en cuántas partes se dividió el entero?',
      opciones: ['El numerador', 'El denominador', 'El entero', 'La mitad'],
      correcta: 1,
    },
    {
      pregunta: 'Te comes 2 de 4 tajadas de pizza. ¿Qué fracción comiste?',
      opciones: ['4/2', '2/4', '2/2', '1/4'],
      correcta: 1,
    },
    {
      pregunta: '¿Cuál de estas fracciones es la más grande?',
      opciones: ['1/8', '1/4', '1/2', '1/3'],
      correcta: 2,
    },
    {
      pregunta: '¿Qué fracción vale lo mismo que 1/2?',
      opciones: ['2/4', '1/4', '2/3', '3/8'],
      correcta: 0,
    },
  ],
  palabras: FICHA_EJEMPLO.vocabulario.map((v) => ({ palabra: v.palabra, pista: v.definicion })),
}

// ---------- Adaptación ----------

const CONSEJOS: Record<Necesidad, string[]> = {
  tdah: [
    'Da una consigna a la vez y verifica que se entendió antes de pasar a la siguiente.',
    'Ofrece pausas activas cortas cada 10 a 15 minutos.',
    'Usa un temporizador visible para cada paso.',
  ],
  dislexia: [
    'Lee las consignas en voz alta además de escribirlas en la pizarra.',
    'Cuando puedas, evalúa la comprensión de forma oral.',
    'Da más tiempo para leer y escribir, sin penalizar la ortografía en este tema.',
  ],
  tea: [
    'Anticipa la actividad con la agenda visual al empezar la clase.',
    'Usa lenguaje literal y evita frases con doble sentido.',
    'Avisa unos minutos antes de cambiar de actividad.',
  ],
  facil: [
    'Una idea por frase.',
    'Usa ejemplos de la vida diaria del estudiante.',
    'Acompaña el texto con imágenes.',
  ],
}

export function adaptacionEjemplo(necesidades: Necesidad[]): Adaptacion {
  return {
    necesidades,
    material: 'Examen: Misión ¡la final del campeonato!',
    original:
      'Lee atentamente cada situación problemática y resuelve en tu cuaderno. Escribe la fracción que representa cada caso, luego compara las fracciones obtenidas y ordénalas de menor a mayor, justificando tu respuesta con un gráfico.',
    agenda: [
      { picto: 'saludar', texto: 'Saludo' },
      { picto: 'leer', texto: 'Leer' },
      { picto: 'escribir', texto: 'Resolver' },
      { picto: 'pausa', texto: 'Pausa' },
      { picto: 'compartir', texto: 'Compartir' },
    ],
    pasos: [
      { picto: 'leer', texto: 'Lee la situación 1 en voz baja.', textoFacil: 'Lee el problema 1.' },
      { picto: 'escribir', texto: 'Escribe en tu cuaderno la fracción que representa la situación.', textoFacil: 'Escribe el número de arriba y el de abajo.' },
      { picto: 'dibujar', texto: 'Dibuja un círculo y pinta las partes que indica la fracción.', textoFacil: 'Pinta las partes en el círculo.' },
      { picto: 'comparar', texto: 'Compara tus fracciones: ¿cuál es más grande?', textoFacil: 'Mira: ¿cuál tiene más parte pintada?' },
    ],
    consejos: CONSEJOS,
  }
}

// ---------- Biblioteca ----------

export const BIBLIOTECA_EJEMPLO: Material[] = [
  { id: 'm1', titulo: 'La cumbia de las fracciones', tipo: 'cancion', grado: '4.º primaria', area: 'Matemática', autor: 'Carmen Huamán', lugar: 'Arequipa', usos: 214 },
  { id: 'm2', titulo: 'Memoria de fracciones con pizzas', tipo: 'juego', grado: '4.º primaria', area: 'Matemática', autor: 'Jorge Mamani', lugar: 'Puno', usos: 156 },
  { id: 'm3', titulo: 'Misión: fracciones en la cocina', tipo: 'examen', grado: '4.º primaria', area: 'Matemática', autor: 'Diana Flores', lugar: 'Piura', usos: 120 },
  { id: 'm4', titulo: 'Trivia: animales de la Amazonía', tipo: 'juego', grado: '2.º primaria', area: 'Ciencia y Tecnología', autor: 'Miguel Vargas', lugar: 'Iquitos', usos: 133 },
  { id: 'm5', titulo: 'Misión: el ciclo del agua', tipo: 'examen', grado: '5.º primaria', area: 'Ciencia y Tecnología', autor: 'Lucía Torres', lugar: 'Trujillo', usos: 98 },
  { id: 'm6', titulo: 'Crucigrama de sustantivos y adjetivos', tipo: 'crucigrama', grado: '3.º primaria', area: 'Comunicación', autor: 'Ana Rojas', lugar: 'Cusco', usos: 77 },
  { id: 'm7', titulo: 'Tablas de multiplicar en lectura fácil', tipo: 'adaptar', grado: '3.º primaria', area: 'Matemática', autor: 'Elena Castro', lugar: 'Lima', usos: 61 },
  { id: 'm8', titulo: 'Adivina la palabra: la Independencia', tipo: 'juego', grado: '6.º primaria', area: 'Personal Social', autor: 'Pedro Salas', lugar: 'Ica', usos: 88 },
  { id: 'm9', titulo: 'El huayno de las regiones del Perú', tipo: 'cancion', grado: '4.º primaria', area: 'Personal Social', autor: 'Rosa Quispe', lugar: 'Lima', usos: 45, esMio: true },
]
