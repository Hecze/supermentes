// Implementación de ejemplo de la API: responde con datos fijos y una pequeña espera.
import type { Api } from './types'
import {
  BIBLIOTECA_EJEMPLO,
  FICHA_AGUA,
  FICHA_EJEMPLO,
  FICHA_SUSTANTIVOS,
  JUEGO_AGUA,
  JUEGO_EJEMPLO,
  JUEGO_SUSTANTIVOS,
  cancionEjemplo,
  examenEjemplo,
  juegoDesdeVocabulario,
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
          : `Currículo Nacional: ${entrada.area}, ${entrada.grado}`
    // Elige el ejemplo que más se parece al tema elegido.
    const t = (entrada.texto ?? '').toLowerCase()
    const base =
      /agua|lluvia|nube/.test(t) || entrada.areaId === 'ciencia-y-tecnologia'
        ? FICHA_AGUA
        : /sustantiv|nombre/.test(t) || entrada.areaId === 'comunicacion'
          ? FICHA_SUSTANTIVOS
          : FICHA_EJEMPLO
    return {
      ...base,
      id: `ficha-${Date.now()}`,
      titulo: entrada.texto ?? base.titulo,
      curriculo: entrada.competencia ? { competencia: entrada.competencia, capacidad: entrada.capacidad ?? '' } : base.curriculo,
      fecha: new Date().toISOString(),
      gradoId: entrada.gradoId,
      areaId: entrada.areaId,
      grado: entrada.grado,
      area: entrada.area,
      duracion: entrada.duracion ?? base.duracion,
      fuente,
    }
  },
  async generarCancion(_ficha, opciones) {
    await esperar(1200)
    return cancionEjemplo(opciones)
  },
  async generarAudio() {
    await esperar(2200)
    return { url: null, duracionSeg: 102 }
  },
  async adaptarExamen(_ficha, { examen, ...opciones }) {
    await esperar(1500)
    return examenEjemplo(opciones, examen.name)
  },
  async generarJuego(ficha) {
    await esperar(1200)
    const t = ficha.titulo.toLowerCase()
    return /fracci/.test(t) ? JUEGO_EJEMPLO : /agua|lluvia|nube/.test(t) ? JUEGO_AGUA : /sustantiv/.test(t) ? JUEGO_SUSTANTIVOS : juegoDesdeVocabulario(ficha)
  },
  async biblioteca() {
    await esperar(300)
    return BIBLIOTECA_EJEMPLO
  },
}
