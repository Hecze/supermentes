// Datos de ejemplo para el prototipo. Tienen la misma forma que devolverá el backend real.
import type {
  Cancion,
  Ficha,
  Juego,
  Material,
  OpcionesCancion,
  OpcionesSesion,
  Sesion,
} from './types'

export const DOCENTE = {
  nombre: 'Rosa Quispe',
  saludo: 'profe Rosa',
  colegio: 'I.E. N.º 2048 · San Juan de Lurigancho',
}

const haceDias = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()

export const FICHA_EJEMPLO: Ficha = {
  id: 'ficha-fracciones-4',
  fecha: haceDias(0),
  titulo: 'Fracciones: partes de un todo',
  gradoId: 'primaria-4',
  areaId: 'matematica',
  grado: '4.º primaria',
  area: 'Matemática',
  duracion: '45 min',
  fuente: 'Foto del libro de Matemática, pág. 48',
  proposito:
    'Que los estudiantes representen fracciones como partes iguales de un todo y diferencien el numerador del denominador.',
  curriculo: {
    competencia: 'Resuelve problemas de cantidad',
    capacidad: 'Comunica su comprensión sobre los números y las operaciones',
    desempenos: ['Expresa con diversas representaciones y lenguaje numérico (números, signos y expresiones verbales) su comprensión de: La unidad de millar como unidad del sistema de numeración decimal, sus equivalencias entre unidades menores, el valor posicional de un dígito en números de cuatro cifras y la comparación y el orden de números. La multiplicación y división con números naturales, así como las propiedades conmutativa y asociativa de la multiplicación. La fracción como parte-todo (cantidad discreta o continua), así como equivalencias y operaciones de adición y sustracción entre fracciones usuales usando fracciones equivalentes.'],
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
  coincidenciasBiblioteca: 2,
}

export const FICHA_AGUA: Ficha = {
  id: 'ficha-agua-4',
  fecha: haceDias(1),
  titulo: 'El ciclo del agua',
  gradoId: 'primaria-4',
  areaId: 'ciencia-y-tecnologia',
  grado: '4.º primaria',
  area: 'Ciencia y Tecnología',
  duracion: '90 min',
  fuente: 'Escrito por la docente',
  proposito: 'Que los estudiantes expliquen cómo el agua cambia de estado y circula entre el mar, el cielo y la tierra.',
  curriculo: {
    competencia: 'Explica el mundo físico basándose en conocimientos sobre los seres vivos, materia y energía, biodiversidad, Tierra y universo',
    capacidad: 'Comprende y usa conocimientos sobre los seres vivos, materia y energía, biodiversidad, Tierra y universo',
    desempenos: ['Describe que los objetos pueden sufrir cambios reversibles e irreversibles por acción de la energía. Ejemplo: El estudiante describe por qué un cubo de hielo se disuelve por acción del calor del ambiente y por qué puede volver a ser un cubo de hielo al colocar el líquido en un refrigerador.'],
  },
  conceptos: [
    'El sol calienta el agua de mares, ríos y lagos, y se evapora.',
    'El vapor sube, se enfría y forma las nubes.',
    'El agua de las nubes cae como lluvia, nieve o granizo.',
    'El agua vuelve a los ríos y al mar, o entra en la tierra.',
  ],
  vocabulario: [
    { palabra: 'evaporación', definicion: 'El agua se calienta y sube como vapor.' },
    { palabra: 'condensación', definicion: 'El vapor se enfría y forma nubes.' },
    { palabra: 'precipitación', definicion: 'El agua cae como lluvia, nieve o granizo.' },
    { palabra: 'infiltración', definicion: 'El agua entra en la tierra.' },
    { palabra: 'vapor', definicion: 'Agua en estado gaseoso.' },
    { palabra: 'nube', definicion: 'Muchas gotitas de agua juntas en el cielo.' },
    { palabra: 'glaciar', definicion: 'Gran masa de hielo en lo alto de las montañas.' },
  ],
  ejemplo: 'Cuando hierves agua para el té, el vapor que sale de la olla es agua evaporándose.',
  errorFrecuente: 'Creen que las nubes son humo o algodón, y no agua.',
  coincidenciasBiblioteca: 2,
}

export const FICHA_SUSTANTIVOS: Ficha = {
  id: 'ficha-sustantivos-4',
  fecha: haceDias(4),
  titulo: 'Sustantivos propios y comunes',
  gradoId: 'primaria-4',
  areaId: 'comunicacion',
  grado: '4.º primaria',
  area: 'Comunicación',
  duracion: '45 min',
  fuente: 'Foto del libro de Comunicación, pág. 22',
  proposito: 'Que los estudiantes distingan los sustantivos propios de los comunes y usen la mayúscula correctamente.',
  curriculo: {
    competencia: 'Escribe diversos tipos de textos en su lengua materna',
    capacidad: 'Utiliza convenciones del lenguaje escrito de forma pertinente',
    desempenos: ['Utiliza recursos gramaticales y ortográficos (por ejemplo, el punto seguido y las comas enumerativas) que contribuyen a dar sentido a su texto, e incorpora algunos recursos textuales (por ejemplo, el tamaño de la letra) para reforzar dicho sentido. Emplea comparaciones y adjetivaciones para caracterizar personas, personajes y escenarios, y elabora rimas y juegos verbales apelando al ritmo y la musicalidad de las palabras, con el fin de expresar sus experiencias y emociones.', 'Explica el efecto de su texto en los lectores considerando su propósito al momento de escribirlo. Asimismo, explica la importancia de los aspectos gramaticales y ortográficos más comunes.'],
  },
  conceptos: [
    'Los sustantivos nombran personas, animales, cosas y lugares.',
    'Los sustantivos comunes nombran a cualquiera de un grupo: perro, ciudad.',
    'Los sustantivos propios nombran a uno en particular: Firulais, Arequipa.',
    'Los sustantivos propios se escriben con mayúscula.',
  ],
  vocabulario: [
    { palabra: 'sustantivo', definicion: 'Palabra que nombra personas, animales, cosas o lugares.' },
    { palabra: 'propio', definicion: 'Nombra a uno en particular.' },
    { palabra: 'común', definicion: 'Nombra a cualquiera de un grupo.' },
    { palabra: 'mayúscula', definicion: 'Letra grande al inicio de un nombre propio.' },
    { palabra: 'lugar', definicion: 'Puede ser una ciudad, un río o una montaña.' },
    { palabra: 'nombre', definicion: 'Palabra con la que llamamos a alguien.' },
  ],
  ejemplo: '"Mi perra Luna vive en Huancayo": perra es común; Luna y Huancayo son propios.',
  errorFrecuente: 'Escriben con minúscula los nombres de ciudades y ríos.',
  coincidenciasBiblioteca: 4,
}

/** Temas que la docente ya preparó, del más reciente al más antiguo. */
export const TEMAS_INICIALES: Ficha[] = [FICHA_EJEMPLO, FICHA_AGUA, FICHA_SUSTANTIVOS]

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

export const JUEGO_AGUA: Juego = {
  codigo: 'AGUA-4B',
  pares: [
    { a: { texto: 'Evaporación' }, b: { texto: 'Sube como vapor' } },
    { a: { texto: 'Condensación' }, b: { texto: 'Forma las nubes' } },
    { a: { texto: 'Precipitación' }, b: { texto: 'Cae como lluvia' } },
    { a: { texto: 'Infiltración' }, b: { texto: 'Entra al suelo' } },
    { a: { texto: 'Vapor' }, b: { texto: 'Agua como gas' } },
    { a: { texto: 'Glaciar' }, b: { texto: 'Hielo en la cima' } },
  ],
  preguntas: [
    { pregunta: '¿Qué calienta el agua del mar para que se evapore?', opciones: ['El sol', 'La luna', 'El viento', 'Las nubes'], correcta: 0 },
    { pregunta: '¿De qué están hechas las nubes?', opciones: ['De gotitas de agua', 'De algodón', 'De humo', 'De polvo'], correcta: 0 },
    { pregunta: 'Cuando el vapor se enfría y forma nubes, se llama…', opciones: ['Condensación', 'Evaporación', 'Infiltración', 'Precipitación'], correcta: 0 },
    { pregunta: '¿Cómo puede caer el agua de las nubes?', opciones: ['Como lluvia, nieve o granizo', 'Solo como lluvia', 'Como vapor', 'Como humo'], correcta: 0 },
    { pregunta: '¿A dónde va el agua que entra en la tierra?', opciones: ['Se guarda bajo el suelo', 'Desaparece', 'Sube al sol', 'Se vuelve piedra'], correcta: 0 },
  ],
  palabras: FICHA_AGUA.vocabulario.map((v) => ({ palabra: v.palabra, pista: v.definicion })),
}

export const JUEGO_SUSTANTIVOS: Juego = {
  codigo: 'SUST-4B',
  pares: [
    { a: { texto: 'Rímac' }, b: { texto: 'río' } },
    { a: { texto: 'Huascarán' }, b: { texto: 'montaña' } },
    { a: { texto: 'Firulais' }, b: { texto: 'perro' } },
    { a: { texto: 'Perú' }, b: { texto: 'país' } },
    { a: { texto: 'Titicaca' }, b: { texto: 'lago' } },
    { a: { texto: 'Arequipa' }, b: { texto: 'ciudad' } },
  ],
  preguntas: [
    { pregunta: '¿Cuál es un sustantivo propio?', opciones: ['Cusco', 'ciudad', 'montaña', 'río'], correcta: 0 },
    { pregunta: '¿Cuál es un sustantivo común?', opciones: ['perro', 'Firulais', 'Lima', 'Ana'], correcta: 0 },
    { pregunta: '¿Cómo se escribe un sustantivo propio?', opciones: ['Con mayúscula al inicio', 'Todo en minúscula', 'Con un número', 'Entre comillas'], correcta: 0 },
    { pregunta: 'En «Mi gata Michi duerme», ¿cuál es el sustantivo propio?', opciones: ['Michi', 'gata', 'duerme', 'Mi'], correcta: 0 },
    { pregunta: '¿A quién nombra un sustantivo común?', opciones: ['A cualquiera de un grupo', 'A uno en particular', 'A una acción', 'A un color'], correcta: 0 },
  ],
  palabras: FICHA_SUSTANTIVOS.vocabulario.map((v) => ({ palabra: v.palabra, pista: v.definicion })),
}

/** Para un tema sin juego de ejemplo: preguntas armadas con su vocabulario, como haría el backend sin más datos. */
export function juegoDesdeVocabulario(ficha: Ficha): Juego {
  const v = ficha.vocabulario
  return {
    codigo: `${ficha.titulo.slice(0, 4).toUpperCase()}-1`,
    pares: [],
    preguntas: v.slice(0, 5).map((x, i) => {
      const otras = v.filter((_, j) => j !== i).slice(0, 3).map((o) => o.palabra)
      const correcta = i % 4
      const opciones = [...otras]
      opciones.splice(correcta, 0, x.palabra)
      return { pregunta: `¿Qué palabra es? «${x.definicion}»`, opciones, correcta }
    }),
    palabras: v.map((x) => ({ palabra: x.palabra, pista: x.definicion })),
  }
}

// ---------- Biblioteca ----------

export const BIBLIOTECA_EJEMPLO: Material[] = [
  { id: 'm1', titulo: 'El rap del sistema digestivo', tipo: 'cancion', grado: '4.º primaria', area: 'Ciencia y Tecnología', autor: 'Carmen Huamán', lugar: 'Arequipa', usos: 214 },
  { id: 'm2', titulo: 'Memoria de fracciones con pizzas', tipo: 'juego', grado: '4.º primaria', area: 'Matemática', autor: 'Jorge Mamani', lugar: 'Puno', usos: 156 },
  { id: 'm3', titulo: 'Misión: fracciones en la cocina', tipo: 'examen', grado: '4.º primaria', area: 'Matemática', autor: 'Diana Flores', lugar: 'Piura', usos: 120 },
  { id: 'm4', titulo: 'Trivia: animales de la Amazonía', tipo: 'juego', grado: '2.º primaria', area: 'Ciencia y Tecnología', autor: 'Miguel Vargas', lugar: 'Iquitos', usos: 133 },
  { id: 'm5', titulo: 'Misión: el ciclo del agua', tipo: 'examen', grado: '5.º primaria', area: 'Ciencia y Tecnología', autor: 'Lucía Torres', lugar: 'Trujillo', usos: 98 },
  { id: 'm6', titulo: 'Crucigrama de sustantivos y adjetivos', tipo: 'crucigrama', grado: '3.º primaria', area: 'Comunicación', autor: 'Ana Rojas', lugar: 'Cusco', usos: 77 },
  { id: 'm7', titulo: 'Examen de tablas de multiplicar en lectura fácil', tipo: 'examen', grado: '3.º primaria', area: 'Matemática', autor: 'Elena Castro', lugar: 'Lima', usos: 61 },
  { id: 'm8', titulo: 'Adivina la palabra: la Independencia', tipo: 'juego', grado: '6.º primaria', area: 'Personal Social', autor: 'Pedro Salas', lugar: 'Ica', usos: 88 },
  { id: 'm9', titulo: 'El huayno de las regiones del Perú', tipo: 'cancion', grado: '4.º primaria', area: 'Personal Social', autor: 'Rosa Quispe', lugar: 'Lima', usos: 45, esMio: true },
]

// ---------- Sesión de aprendizaje ----------

// Desempeños oficiales de 4.º primaria, Matemática (competencia 1), copiados tal cual de packages/curriculo.
const DESEMPENO_PARTIR =
  'Establece relaciones entre datos y acciones de partir una unidad o una colección de objetos en partes iguales y las transforma en expresiones numéricas (modelo) de fracciones usuales, adición y sustracción de estas.'
const DESEMPENO_EXPRESA = FICHA_EJEMPLO.curriculo.desempenos![0]
const DESEMPENO_AFIRMA =
  'Realiza afirmaciones sobre las equivalencias entre fracciones y las explica con ejemplos concretos. Asimismo, explica la comparación entre fracciones, así como su proceso de resolución y los resultados obtenidos.'

export function sesionEjemplo(opciones: OpcionesSesion): Sesion {
  const largo = opciones.duracion === 90
  const gusto = opciones.interes?.toLowerCase()
  return {
    opciones,
    titulo: 'Repartimos en partes iguales: las fracciones',
    grado: FICHA_EJEMPLO.grado,
    area: FICHA_EJEMPLO.area,
    competencia: 'Resuelve problemas de cantidad',
    capacidades: [
      'Traduce cantidades a expresiones numéricas',
      'Comunica su comprensión sobre los números y las operaciones',
      'Usa estrategias y procedimientos de estimación y cálculo',
      'Argumenta afirmaciones sobre las relaciones numéricas y las operaciones',
    ],
    criterios: [
      {
        texto: 'Parte un entero o un grupo de objetos en partes iguales y escribe la fracción que representa.',
        desempeno: DESEMPENO_PARTIR,
        cita: 'partir una unidad o una colección de objetos en partes iguales',
      },
      {
        texto: 'Representa fracciones con dibujos, material concreto y números, y dice qué indican el numerador y el denominador.',
        desempeno: DESEMPENO_EXPRESA,
        cita: 'La fracción como parte-todo (cantidad discreta o continua)',
      },
      {
        texto: 'Explica con ejemplos concretos cuándo dos fracciones valen lo mismo.',
        desempeno: DESEMPENO_AFIRMA,
        cita: 'Realiza afirmaciones sobre las equivalencias entre fracciones y las explica con ejemplos concretos',
      },
    ],
    evidencia: 'Ficha de aplicación resuelta con fracciones representadas en dibujos y números.',
    instrumento: 'Escala de valoración',
    enfoque: {
      nombre: 'Enfoque de orientación al bien común',
      valor: 'Equidad y justicia',
      actitudes: 'Los estudiantes reparten materiales y turnos en partes iguales y explican por qué un reparto es justo.',
    },
    materiales: {
      antes: ['Recortar círculos y tiras de papel del mismo tamaño.', 'Preparar el papelógrafo con el problema de la motivación.', 'Imprimir la ficha de aplicación y la escala de valoración.'],
      recursos: ['Círculos y tiras de papel', 'Tijeras y colores', 'Papelógrafo y plumones', 'Ficha de aplicación'],
    },
    proposito: 'Hoy aprenderemos a representar fracciones partiendo un entero en partes iguales.',
    minutos: largo ? { inicio: 15, desarrollo: 60, cierre: 15 } : { inicio: 10, desarrollo: 25, cierre: 10 },
    inicio: {
      motivacion: [
        gusto
          ? `El docente cuenta que el salón ganó un premio y lo celebrará con algo de ${gusto}: una pizza para cuatro amigos.`
          : 'El docente cuenta que Rosa y sus tres amigos compraron una pizza para compartir en el recreo.',
        'Muestra un círculo de papel cortado en 4 partes de distinto tamaño y pregunta: «¿Es justo este reparto? ¿Por qué?».',
      ],
      saberesPrevios: ['Pregunta: «¿Qué significa repartir en partes iguales?», «¿Dónde han visto una mitad?».', 'Anota las respuestas en la pizarra.'],
      conflicto: ['Pregunta: «Si la pizza se corta en 8 partes iguales y Rosa come 3, ¿cómo escribimos con números lo que comió?».'],
      normas: ['Levantamos la mano para hablar.', 'Compartimos los materiales.', 'Escuchamos a quien habla.'],
    },
    desarrollo: [
      {
        titulo: 'PARTIMOS EN PARTES IGUALES',
        pasos: [
          'En grupos, los estudiantes doblan un círculo de papel en 2, 4 y 8 partes iguales.',
          'Pintan algunas partes y dicen cuántas pintaron y en cuántas partes dividieron el círculo.',
        ],
      },
      {
        titulo: 'ESCRIBIMOS LA FRACCIÓN',
        pasos: [
          'El docente escribe en la pizarra 3/8 y explica: el denominador dice en cuántas partes iguales se dividió el entero; el numerador, cuántas tomamos.',
          'Cada grupo escribe con números la fracción que pintó y la lee en voz alta.',
        ],
      },
      {
        titulo: 'FRACCIONES DE UN GRUPO',
        pasos: ['Con 12 chapitas, los grupos forman 3 grupos iguales y dicen qué fracción es cada grupo (1/3).', 'Comparan sus respuestas con otro grupo.'],
      },
      {
        titulo: 'PRACTICAMOS',
        pasos: ['Los estudiantes resuelven la ficha de aplicación de forma individual.', 'El docente acompaña a quienes confunden el numerador con el denominador.'],
      },
    ],
    cierre: {
      sistematizacion: ['Entre todos completan en el papelógrafo: «Una fracción representa partes iguales de un todo».'],
      metacognicion: ['¿Qué aprendimos hoy?', '¿Qué fue lo más difícil?', '¿Dónde usamos las fracciones en casa?'],
      tarea: ['Dibuja algo que se reparta en casa (una torta, un pan) y escribe la fracción que le toca a cada uno.'],
    },
    ficha: {
      titulo: 'Practicamos con fracciones',
      actividades: [
        { consigna: 'Dibuja un rectángulo, divídelo en 4 partes iguales y pinta 3. Escribe la fracción pintada.', lineas: 1 },
        { consigna: 'Un queque se cortó en 8 tajadas iguales y Luis comió 3. ¿Qué fracción del queque comió? ¿Cuál es el numerador?', lineas: 2 },
        { consigna: 'En una bolsa hay 10 caramelos y 4 son de fresa. ¿Qué fracción de los caramelos son de fresa?', lineas: 1 },
        { consigna: 'Dibuja dos tiras iguales: en una pinta 1/2 y en la otra 2/4. ¿Valen lo mismo? Explica por qué.', lineas: 3 },
        { consigna: 'Carla dice que si una torta se corta en 4 pedazos de distinto tamaño, cada uno es 1/4. ¿Tiene razón? ¿Por qué?', lineas: 3 },
      ],
    },
  }
}
