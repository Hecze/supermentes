// Datos de ejemplo para el prototipo. Tienen la misma forma que devolverá el backend real.
import type { Ficha, Juego } from './types'

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
}

/** Temas que la docente ya preparó, del más reciente al más antiguo. */
export const TEMAS_INICIALES: Ficha[] = [FICHA_EJEMPLO, FICHA_AGUA, FICHA_SUSTANTIVOS]

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
