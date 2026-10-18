// Exámenes listos para imprimir. Un examen no es una lista fija de preguntas: es una lista de tipos de pregunta
// ("Cuenta el dinero", "Lee el ábaco"…), cada uno con su semilla. Con otra semilla sale el mismo tipo de pregunta
// con otros números y otra respuesta: así el docente da el mismo examen en otra sección (Fila B) o el próximo año
// sin repetir respuestas. Cada tipo cita, letra por letra, el desempeño oficial del grado que evalúa.
import type { TemaBanco } from '../banco/banco'

/** Un dibujo en SVG (texto), el mismo en la pantalla y en el PDF. Medidas en px: 1 px ≈ 0,26 mm al imprimir. */
export type Dibujo = { svg: string; ancho: number; alto: number; /** Qué muestra, para quien no ve el dibujo. */ alt: string }

type Base = {
  /** Lo que se observa o se hace primero: "Observa el dinero que tiene Daniel." */
  enunciado: string
  dibujo?: Dibujo
  /** La pregunta, después del dibujo: "Ahora responde: ¿Cuánto dinero tiene Daniel?" */
  pregunta?: string
  /** Lo que ve el docente en la hoja de respuestas cuando la respuesta sola no basta: "No. Es 2000." */
  nota?: string
}

export type Item =
  | (Base & { forma: 'opciones'; alternativas: string[]; correcta: number })
  | (Base & {
      forma: 'abierta'
      respuesta: string
      /** Dónde responde: en una línea, en renglones o sobre el mismo dibujo (un ábaco vacío, una cuadrícula). */
      espacio: 'linea' | 'renglones' | 'dibujo'
    })
  | (Base & { forma: 'unir'; izquierda: string[]; derecha: string[]; /** solucion[i]: el índice en `derecha` que va con izquierda[i]. */ solucion: number[] })
  | (Base & { forma: 'completar'; /** Las palabras del recuadro, ya barajadas. */ palabras: string[]; /** Cada frase con "____" donde va la palabra. */ frases: string[]; respuestas: string[] })

export type Generado = Item & {
  /** Lo que hace distinta a esta pregunta (el dato o la pregunta del banco): no se repite en un mismo examen. */
  clave: string
}

export type Azar = () => number

export type Contexto = {
  azar: Azar
  /** El tema en el banco (palabras, preguntas y parejas con su cita), si existe. */
  banco: TemaBanco | null
}

export type TipoPregunta = {
  id: string
  /** Cómo lo ve el docente: "Cuenta el dinero". */
  nombre: string
  /** Qué hacen los alumnos, para la «i»: "Cuentan billetes y monedas del Perú y escriben cuánto hay." */
  queHacen: string
  /**
   * Por grado, el fragmento letra por letra del desempeño oficial que respalda el tipo. Sin cita en un grado, no se
   * ofrece en ese grado. Los tipos del banco no traen citas: usan la del tema (`TemaBanco.cita`).
   */
  citas?: Partial<Record<string, string>>
  /** Área de las citas y número de su competencia (desde 1), por si un mismo texto se repite. */
  area?: string
  competencia?: number
  /** 'numeros': cada versión trae otros números y dibujos. 'orden': se eligen y barajan preguntas del tema. */
  cambia: 'numeros' | 'orden'
  /** Arma una pregunta; null si este tema no tiene con qué (por ejemplo, el banco no trae parejas). */
  generar: (ctx: Contexto) => Generado | null
}

/** Lo que se guarda de un examen: qué tipo va en cada lugar y con qué semilla. Con esto se vuelve a armar igual. */
export type ConfigExamen = {
  semilla: number
  items: { tipo: string; semilla: number }[]
  /** Dos versiones (Fila A y Fila B) con los mismos tipos y otros números. */
  filas: boolean
}

/** Una versión ya armada, lista para mostrarse o imprimirse. */
export type Version = {
  /** "Fila A", o vacío si es una sola versión. */
  fila: string
  /** Código corto de la versión, impreso en la hoja y en las respuestas para que el docente las junte. */
  codigo: string
  items: (Generado & { tipo: string })[]
}
