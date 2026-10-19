// Contratos de datos entre la UI y el backend.
// Los datos de ejemplo (mock.ts) y el backend real (real.ts) devuelven exactamente estos tipos.

export type HerramientaId = 'sesion' | 'cancion' | 'ejercicios' | 'juego' | 'crucigrama'

/** El tema elegido en el Currículo Nacional: con esto la IA completa la ficha (ideas clave, vocabulario…). */
export type EntradaTema = {
  /** El tema tal como figura en el currículo ("Fracciones: partes de un todo"). */
  texto: string
  /** Grado y área (curso) del Currículo Nacional: ids de packages/curriculo. */
  gradoId: string
  areaId: string
  /** Nombres para mostrar. */
  grado: string
  area: string
  /** Lo que pide el currículo para este tema (ver curriculo/buscar.ts). */
  competencia?: string
  capacidad?: string
  desempenos?: string[]
  duracion?: string
}

/** Fracción para dibujar: [partes pintadas, partes totales]. Solo aplica a temas de matemática. */
export type Fraccion = [number, number]

export type Ficha = {
  id: string
  /** Fecha de creación o último uso (ISO). */
  fecha: string
  titulo: string
  /** Grado y área (curso) del Currículo Nacional: ids de packages/curriculo. */
  gradoId: string
  areaId: string
  grado: string
  area: string
  duracion: string
  fuente: string
  proposito: string
  /** Alineación al Currículo Nacional de Educación Básica (CNEB) del Perú. */
  curriculo: {
    competencia: string
    capacidad: string
    /** Desempeños oficiales del grado de los que parte el tema, copiados tal cual de packages/curriculo. */
    desempenos?: string[]
  }
  conceptos: string[]
  /** Se reutiliza en el crucigrama y en "Adivina la palabra" sin volver a llamar a la IA. */
  vocabulario: { palabra: string; definicion: string }[]
  ejemplo: string
  errorFrecuente: string
}

export type Carta = { texto: string; fraccion?: Fraccion }

export type Juego = {
  codigo: string
  pares: { a: Carta; b: Carta }[]
  preguntas: { pregunta: string; opciones: string[]; correcta: number }[]
  palabras: { palabra: string; pista: string }[]
}

export type OpcionesSesion = {
  /** Minutos de la clase. */
  duracion: 45 | 90
  /** Lo que le gusta al salón, para la motivación. */
  interes?: string
}

/** Un criterio de evaluación con el desempeño oficial que trabaja y la parte exacta que cita. */
export type CriterioSesion = {
  texto: string
  /** Desempeño oficial del grado, copiado tal cual de packages/curriculo. */
  desempeno?: string
  /** Fragmento del desempeño, letra por letra (el backend descarta las citas que no aparecen). */
  cita?: string
}

/** Un subtítulo de un momento de la sesión y lo que se hace en él. */
export type PasoSesion = { titulo: string; pasos: string[] }

/** Sesión de aprendizaje en el formato que el docente entrega al director (CNEB, MINEDU). */
export type Sesion = {
  opciones: OpcionesSesion
  titulo: string
  grado: string
  area: string
  /** Competencia y capacidades oficiales (texto del currículo). */
  competencia: string
  capacidades: string[]
  criterios: CriterioSesion[]
  evidencia: string
  instrumento: string
  enfoque: { nombre: string; valor: string; actitudes: string }
  materiales: { antes: string[]; recursos: string[] }
  proposito: string
  /** Minutos de cada momento; suman la duración de la clase. */
  minutos: { inicio: number; desarrollo: number; cierre: number }
  inicio: { motivacion: string[]; saberesPrevios: string[]; conflicto: string[]; normas: string[] }
  desarrollo: PasoSesion[]
  cierre: { sistematizacion: string[]; metacognicion: string[]; tarea: string[] }
  /** Ficha de aplicación para el alumno. */
  ficha: { titulo: string; actividades: { consigna: string; lineas: number }[] }
}

/** Un video o una ficha que ya existe en internet para el tema (api/recursos.ts, buscado con Exa). */
export type Recurso = {
  tipo: 'video' | 'ficha'
  titulo: string
  url: string
  /** "YouTube" o el dominio de la página. */
  fuente: string
  imagen?: string
}

export interface Api {
  prepararFicha(entrada: EntradaTema): Promise<Ficha>
  generarJuego(ficha: Ficha): Promise<Juego>
  /** Videos y fichas de internet para el tema. */
  buscarRecursos(ficha: Ficha): Promise<Recurso[]>
}
