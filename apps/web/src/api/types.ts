// Contratos de datos entre la UI y el backend.
// Los datos de ejemplo (mock.ts) y el backend real (real.ts) devuelven exactamente estos tipos.

export type HerramientaId = 'cancion' | 'examen' | 'juego' | 'crucigrama'

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
  coincidenciasBiblioteca: number
}

export type OpcionesCancion = {
  modo: 'ritmo' | 'melodia'
  ritmo: string
  melodia: string
}

export type Cancion = {
  titulo: string
  opciones: OpcionesCancion
  partes: { etiqueta: string; lineas: string[] }[]
}

export type AudioCancion = {
  /** null mientras no haya backend: el prototipo no reproduce sonido. */
  url: string | null
  duracionSeg: number
}

/** Lo que necesita quien aprende distinto. Se adapta el texto y también cómo se ve la hoja. */
export type Necesidad = 'tdah' | 'dislexia' | 'tea' | 'facil'

export type OpcionesExamen = {
  /** Ambientar las preguntas en lo que le gusta a la clase. null: no cambiar la historia. */
  interes: string | null
  /** Para quien aprende distinto; puede ir vacío. */
  necesidades: Necesidad[]
  /** El examen del docente (PDF o foto). */
  examen?: File
}

export type PreguntaExamen = {
  /** La pregunta tal cual estaba en el examen del docente. */
  original: string
  /** La pregunta adaptada. */
  texto: string
  /** Alternativas, si es de opción múltiple. */
  alternativas?: string[]
  /** Un apoyo corto para quien lo necesita: los pasos, una pista o un ejemplo. */
  apoyo?: string
  respuesta: string
}

export type Examen = {
  opciones: Omit<OpcionesExamen, 'examen'>
  /** Nombre del archivo que subió el docente. */
  archivo: string
  titulo: string
  instrucciones: string
  /** Cómo se llama cada pregunta: "Pregunta", o "Jugada", "Rescate"… si se ambientó. */
  etiquetaPaso: string
  preguntas: PreguntaExamen[]
}

export type Carta = { texto: string; fraccion?: Fraccion }

export type Juego = {
  codigo: string
  pares: { a: Carta; b: Carta }[]
  preguntas: { pregunta: string; opciones: string[]; correcta: number }[]
  palabras: { palabra: string; pista: string }[]
}

export type Material = {
  id: string
  titulo: string
  tipo: HerramientaId
  grado: string
  area: string
  autor: string
  lugar: string
  usos: number
  esMio?: boolean
}

export interface Api {
  prepararFicha(entrada: EntradaTema): Promise<Ficha>
  generarCancion(ficha: Ficha, opciones: OpcionesCancion): Promise<Cancion>
  generarAudio(cancion: Cancion): Promise<AudioCancion>
  /** Adapta el examen que sube el docente. */
  adaptarExamen(ficha: Ficha, opciones: OpcionesExamen & { examen: File }): Promise<Examen>
  generarJuego(ficha: Ficha): Promise<Juego>
  biblioteca(): Promise<Material[]>
}
