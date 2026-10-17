// Implementación de ejemplo de la API: responde con datos fijos y una pequeña espera.
import type { Api } from './types'
import {
  BIBLIOTECA_EJEMPLO,
  FICHA_EJEMPLO,
  JUEGO_EJEMPLO,
  adaptacionEjemplo,
  cancionEjemplo,
  examenEjemplo,
} from './ejemplos'

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const mockApi: Api = {
  async prepararFicha(entrada) {
    await esperar(1800)
    const fuente =
      entrada.tipo === 'foto'
        ? 'Foto del libro de Matemática, pág. 48'
        : entrada.tipo === 'archivo'
          ? `Archivo: ${entrada.archivo?.name ?? 'Sesión 12 - Fracciones.pdf'}`
          : 'Escrito por la docente'
    return { ...FICHA_EJEMPLO, grado: entrada.grado, duracion: entrada.duracion, fuente }
  },
  async generarCancion(_ficha, opciones) {
    await esperar(1200)
    return cancionEjemplo(opciones)
  },
  async generarAudio() {
    await esperar(2200)
    return { url: null, duracionSeg: 102 }
  },
  async generarExamen(_ficha, opciones) {
    await esperar(1300)
    return examenEjemplo(opciones)
  },
  async generarIlustraciones(examen) {
    await esperar(1800)
    return { ...examen, preguntas: examen.preguntas.map((p) => ({ ...p, ilustracion: 'ejemplo' })) }
  },
  async generarJuego() {
    await esperar(1200)
    return JUEGO_EJEMPLO
  },
  async adaptar(_ficha, necesidades) {
    await esperar(1200)
    return adaptacionEjemplo(necesidades)
  },
  async biblioteca() {
    await esperar(300)
    return BIBLIOTECA_EJEMPLO
  },
}
