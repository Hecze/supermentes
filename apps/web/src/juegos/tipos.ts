// Contratos de los juegos. Un juego no es "de fracciones" ni "de sustantivos": consume una forma de contenido.
// Así un mismo juego sirve para cualquier tema y nivel, y un tema puede jugarse con muchos juegos.
import type { ComponentType } from 'react'
import type { Fraccion } from '../api'

/** Dibujo que acompaña a un texto: una fracción pintada o cosas para contar. */
export type Visual = { tipo: 'fraccion'; partes: Fraccion } | { tipo: 'contar'; figura: string; cantidad: number }

/**
 * Una pregunta con una sola respuesta correcta. Es la forma más universal: casi todos los juegos la usan.
 * `distractores` son siempre respuestas incorrectas para esta pregunta; cada juego toma las que necesita.
 */
export type Reto = {
  /** Qué hay que hacer, cuando la pregunta sola no lo dice: "Redondea a la decena". */
  consigna?: string
  /** Puede estar vacía si el dibujo es la pregunta (una fracción pintada, cosas para contar). */
  pregunta: string
  visual?: Visual
  respuesta: string
  distractores: string[]
  /** Los distractores son otras palabras o parejas del tema, sin orden: se toman al azar en cada partida. */
  distractoresAlAzar?: true
}

export type Lado = { texto: string; visual?: Visual }

/** Dos cosas que van juntas: 3/4 y su dibujo, 7 × 8 y 56. */
export type Par = { a: Lado; b: Lado }

export type Palabra = { palabra: string; pista: string }

/** Todo lo que un tema ofrece para jugar, ya normalizado. */
export type Contenido = {
  /** Qué se practica, para mostrarlo en el juego: "Tablas del 7", "Fracciones: partes de un todo". */
  titulo: string
  retos: Reto[]
  pares: Par[]
  palabras: Palabra[]
  /** Si existe, el juego puede pedir retos sin fin (matemática generada con algoritmos). */
  generar?: (azar: () => number) => Reto
}

/** Lo que una miniatura muestra del contenido elegido, para que el dibujo se parezca al tema (ver muestraDe). */
export type Muestra = {
  /** Una pregunta corta y sus opciones; la correcta va en `opciones[1]`. */
  reto?: { pregunta: string; visual?: Visual; opciones: string[] }
  par?: Par
  /** Palabras del tema en mayúsculas, de la más corta a la más larga. */
  palabras: string[]
}

/** Velocidad del juego según la edad: 1 lento (inicial y 1.º–2.º), 3 rápido (5.º primaria en adelante). */
export type Ritmo = 1 | 2 | 3

export type Resultado = {
  /** De 0 a 3. */
  estrellas: number
  titulo: string
  detalle: string
  /** Para guardar el récord del juego en este dispositivo. */
  puntaje?: number
}

export type PropsJuego = {
  contenido: Contenido
  ritmo: Ritmo
  /** Cambia en cada partida para que el orden no se repita. */
  semilla: number
  terminar: (r: Resultado) => void
}

export type JuegoId = 'globos' | 'rapido' | 'soga' | 'memoria' | 'carrera' | 'palabra' | 'pupiletras' | 'topo' | 'ruleta' | 'duelo' | 'invasion' | 'concurso' | 'verdad' | 'une' | 'condor' | 'carriles' | 'michi'

/** Dónde se juega mejor: en el celular de cada alumno o proyectado para toda la clase. */
export type Donde = 'celular' | 'clase'

export type DefinicionJuego = {
  id: JuegoId
  nombre: string
  /** Una línea para el docente: de qué se trata. */
  lema: string
  /** Qué hacen los alumnos al jugar, para el sustento curricular: "eligen la respuesta correcta entre varias…". */
  accion: string
  /** Cómo se juega, para la portada. */
  instrucciones: string
  donde: Donde[]
  /** Color principal de la tarjeta y la portada. */
  color: string
  /** El juego viral en el que se inspira (referencia interna). */
  inspirado: string
  /**
   * Infantil (llamas, globos, colores) o juvenil (oscuro, neón, arcade). En 5.º y 6.º de primaria y en secundaria
   * los juveniles aparecen primero: a los más grandes lo "de niños" los aleja.
   */
  estilo: 'infantil' | 'juvenil' | 'neutro'
  /** Desde qué grado se ofrece (por ejemplo, el de terror suave no se muestra a los más chicos). */
  desde?: string
  /** Prepara el contenido que usa el juego, o null si con este contenido no se puede jugar. */
  preparar: (c: Contenido) => Contenido | null
  /** Dibujo del juego; con `muestra`, usa el contenido elegido (ver miniaturas.tsx). */
  Miniatura: ComponentType<{ muestra?: Muestra }>
  Componente: ComponentType<PropsJuego>
}
