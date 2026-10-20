// La sesión de aprendizaje, con las partes de las sesiones que publica el MINEDU (ver obsidian/SESION.md).

/** Sube cuando cambian las partes: una sesión guardada con otro formato se vuelve a armar. */
export const FORMATO_SESION = 3

export type OpcionesSesion = {
  /** Minutos de la clase. */
  duracion: 45 | 90
  /** El enfoque transversal (índice en ENFOQUES, sesion/enfoques.ts). */
  enfoque: number
}

/** Un grupo de pasos de un momento: «En grupo clase», «Antes de la lectura»… */
export type Bloque = { titulo: string; pasos: string[] }

export type Momento = { minutos: number; bloques: Bloque[] }

export type Sesion = {
  formato: typeof FORMATO_SESION
  opciones: OpcionesSesion
  titulo: string
  grado: string
  area: string
  /** Competencia, capacidades y desempeños del tema, tal cual el currículo. */
  competencia: string
  capacidades: string[]
  desempenos: string[]
  /** ¿Qué nos dará evidencias de aprendizaje? */
  evidencia: string
  instrumento: string
  enfoque: { nombre: string; actitudes: string }
  preparacion: { antes: string[]; recursos: string[] }
  inicio: Momento
  desarrollo: Momento
  cierre: Momento
  /** Las sesiones del MINEDU que sigue el desarrollo; vacío si no hay una para el área y la competencia del tema. */
  ejemplos: string[]
}
