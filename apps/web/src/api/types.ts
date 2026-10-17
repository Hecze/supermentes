// Contratos de datos entre la UI y el backend.
// Los datos de ejemplo (mock.ts) y el backend real (real.ts) devuelven exactamente estos tipos.

export type HerramientaId = 'cancion' | 'examen' | 'juego' | 'crucigrama' | 'adaptar'

export type EntradaTema = {
  tipo: 'texto' | 'foto' | 'archivo'
  texto?: string
  archivo?: File
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
  curriculo: { competencia: string; capacidad: string }
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

export type OpcionesExamen = {
  interes: string
  formato: 'mision' | 'contextualizado'
  /** Examen propio del docente para transformarlo; si no hay, se crea desde la ficha. */
  examenPropio?: File
}

export type PreguntaExamen = {
  original: string
  texto: string
  respuesta: string
  fraccion?: Fraccion
  /** URL de la ilustración generada; vacía hasta que el docente pida ilustraciones. */
  ilustracion?: string | null
}

export type Examen = {
  opciones: OpcionesExamen
  titulo: string
  intro: string
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

export type Necesidad = 'tdah' | 'dislexia' | 'tea' | 'facil'

export type PasoAdaptado = {
  /** Clave del pictograma (leer, escribir, dibujar, comparar…). En producción se resuelve con ARASAAC. */
  picto: string
  texto: string
  textoFacil: string
}

export type Adaptacion = {
  necesidades: Necesidad[]
  material: string
  original: string
  agenda: { picto: string; texto: string }[]
  pasos: PasoAdaptado[]
  consejos: Record<Necesidad, string[]>
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
  generarExamen(ficha: Ficha, opciones: OpcionesExamen): Promise<Examen>
  generarIlustraciones(examen: Examen): Promise<Examen>
  generarJuego(ficha: Ficha): Promise<Juego>
  adaptar(ficha: Ficha, necesidades: Necesidad[]): Promise<Adaptacion>
  biblioteca(): Promise<Material[]>
}
