// Tareas por salón (obsidian/TAREAS.md): lo que comparten la laptop del docente y el celular del alumno.
// Endpoints: api/salones.ts, api/tareas.ts y api/intentos.ts.
import type { Respuesta } from '../tipos'
import { origen, type Publicado } from './publicado'

export type Salon = { id: string; grado: string; seccion: string; alumnos: number }

/** Lo que ve el alumno: la tarea, el juego y los nombres de su salón (con "ya la hizo", sin puntajes). */
export type TareaAlumno = {
  codigo: string
  salon: string
  grado: string
  seccion: string
  tema: string
  area: string
  profe: string
  segundos: number
  vence: string
  publicado: Publicado
  alumnos: { id: number; nombre: string; hizo: boolean }[]
}

export type Intento = { alumno: number; aciertos: number; total: number; segundos: number; salidas: number; respuestas: Respuesta[]; fecha: string }

/** Lo que revisa el docente. */
export type TareaRevisada = Omit<TareaAlumno, 'profe' | 'publicado' | 'alumnos'> & {
  desempeno: string
  creado: string
  alumnos: { id: number; nombre: string }[]
  intentos: Intento[]
}

/** "4.º B". */
export const nombreSalon = (grado: string, seccion: string) => `${grado.split('-')[1] ?? ''}.º ${seccion}`.trim()

export const enlaceTarea = (codigo: string) => `${origen()}/t/${codigo}`

/** "vie 23" o, con `largo`, "viernes". `vence` es AAAA-MM-DD. */
export function dia(vence: string, largo = false) {
  const d = new Date(`${vence}T12:00:00`)
  return largo ? d.toLocaleDateString('es-PE', { weekday: 'long' }) : d.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric' }).replace('.', '')
}
