// Exámenes listos para imprimir. Un examen no es una lista fija de preguntas: es una lista de tipos de pregunta
// ("Cuenta el dinero", "Lee el ábaco"…), cada uno con su semilla. Con otra semilla sale el mismo tipo de pregunta
// con otros números y otra respuesta: así el docente da el mismo examen en otra sección (Fila B) o el próximo año
// sin repetir respuestas. Cada tipo cita, letra por letra, el desempeño oficial del grado que evalúa.
import type { TemaBanco } from '../banco/banco'

/** Un dibujo en SVG (texto), el mismo en la pantalla y en el PDF. Medidas en px: 1 px ≈ 0,26 mm al imprimir. */
export type Dibujo = {
  svg: string
  ancho: number
  alto: number
  /** Qué muestra, para quien no ve el dibujo. */
  alt: string
  /** De quién es la imagen, si trae una foto o una imagen de otro (va al pie de la hoja, como pide su licencia). */
  credito?: string
}

type Base = {
  /** Lo que se observa o se hace primero: "Observa el dinero que tiene Daniel." */
  enunciado: string
  dibujo?: Dibujo
  /** La pregunta, después del dibujo: "Ahora responde: ¿Cuánto dinero tiene Daniel?" */
  pregunta?: string
  /** Lo que ve el docente en la hoja de respuestas cuando la respuesta sola no basta: "No. Es 2000." */
  nota?: string
  /**
   * Cómo se resuelve, en pasos cortos como se escribirían en la pizarra ("6 × 200 = 1200", "Total: S/ 1473"). Va en la
   * clave del docente. El último paso dice la respuesta.
   */
  pasos?: string[]
}

export type Item =
  | (Base & { forma: 'opciones'; alternativas: string[]; correcta: number })
  | (Base & {
      forma: 'abierta'
      respuesta: string
      /**
       * Dónde responde: en una línea, en renglones, sobre el mismo dibujo (un ábaco vacío, una cuadrícula) o en un
       * recuadro de procedimiento al costado, como en el libro.
       */
      espacio: 'linea' | 'renglones' | 'dibujo' | 'procedimiento'
    })
  | (Base & { forma: 'unir'; izquierda: string[]; derecha: string[]; /** solucion[i]: el índice en `derecha` que va con izquierda[i]. */ solucion: number[] })
  | (Base & { forma: 'completar'; /** Las palabras del recuadro, ya barajadas. */ palabras: string[]; /** Cada frase con "____" donde va la palabra. */ frases: string[]; respuestas: string[] })

/** La dificultad: 1 más fácil, 2 normal, 3 más difícil. Siempre dentro del desempeño del grado que cita el tipo. */
export type Nivel = 1 | 2 | 3

export type Generado = Item & {
  /** Lo que hace distinta a esta pregunta (el dato o la pregunta del banco): no se repite en un mismo examen. */
  clave: string
  /** 1 directa, 2 de dos pasos, 3 de más pensamiento. La práctica va de menos a más. */
  nivel?: Nivel
}

/** Un problema del banco de problemas del tema (examenes/problemas): con sus pasos y su nivel. */
export type Problema = { enunciado: string; alternativas: string[]; respuesta: string; pasos: string[]; nivel: 1 | 2 | 3 }

/** Lo esencial del tema y un ejemplo resuelto: el «Recuerda» de la práctica. */
export type Teoria = { idea: string; ejemplo: { enunciado: string; pasos: string[]; respuesta: string } }

export type TemaProblemas = { tema: string; paginas?: number[]; teoria: Teoria | null; problemas: Problema[] }

export type Azar = () => number

export type Contexto = {
  azar: Azar
  /** El tema en el banco (palabras, preguntas y parejas con su cita), si existe. */
  banco: TemaBanco | null
  /** Los problemas del tema con sus pasos, si existen. */
  problemas?: TemaProblemas | null
  /**
   * La dificultad pedida (2 si no se dice). Con 2 sale exactamente la pregunta de siempre para esa semilla; con 1, la
   * misma idea con números más chicos, menos datos o un paso menos; con 3, más datos, un paso más o distractores más
   * finos. Solo la usan los tipos con `niveles`.
   */
  nivel?: Nivel
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
  /** Si la pregunta cambia con `Contexto.nivel` (más fácil o más difícil). Sin esto, el docente no ve el control. */
  niveles?: boolean
}

/** Para qué es la hoja. Las tres son la misma hoja de preguntas con otro largo y otra forma de imprimirse. */
export type Clase = 'examen' | 'practica' | 'balotario'

/** Una pregunta de la hoja: de qué tema y tipo, con qué semilla y si está fijada (ya no cambia). */
export type ItemHoja = {
  tipo: string
  tema: string
  semilla: number
  fija?: boolean
  /** La dificultad de esta pregunta, si el docente la cambió (si no, la de la hoja). */
  nivel?: Nivel
}

/** Lo que se guarda de una hoja. Con esto se vuelve a armar igual (la misma versión que se imprimió). */
export type ConfigHoja = {
  clase: Clase
  /** Los temas de la hoja; el primero es el tema abierto. Con varios, es una miscelánea. */
  temas: string[]
  /** El curso (areaId) de cada tema: el del tema abierto, salvo en una miscelánea de varios cursos. */
  areas: Record<string, string>
  semilla: number
  items: ItemHoja[]
  /** Solo en el examen: dos versiones (Fila A y Fila B) con los mismos tipos y otros números. */
  filas: boolean
  /** La dificultad de toda la hoja (2 si no se dice). */
  nivel?: Nivel
}

/** Con qué se arman las preguntas de un tema. */
export type Fuente = {
  tema: string
  /** El curso del tema: su id y su nombre. */
  areaId: string
  area: string
  banco: TemaBanco | null
  problemas: TemaProblemas | null
  tipos: TipoPregunta[]
}

/** Una versión ya armada, lista para mostrarse o imprimirse. */
export type Version = {
  /** "Fila A", o vacío si es una sola versión. */
  fila: string
  /** Código corto de la versión, impreso en la hoja y en las respuestas para que el docente las junte. */
  codigo: string
  /** `indice`: el lugar de la pregunta en `ConfigHoja.items` (si una no se pudo armar, las demás no se corren). */
  items: (Generado & { tipo: string; tema: string; indice: number; fija: boolean })[]
}

/** Un grupo de tipos de pregunta y los temas (tal cual en el currículo) donde va cada uno, en orden. */
export type Grupo = { tipos: TipoPregunta[]; temas: Record<string, string[]> }
