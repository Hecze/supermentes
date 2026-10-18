import { mockApi } from './mock'
import { realApi } from './real'
import type { Api } from './types'

// VITE_API=real usa el backend. Sin esa variable, la app usa los datos de ejemplo.
export const MODO_EJEMPLO = import.meta.env.VITE_API !== 'real'

// ponytail: ficha, letra de canción y juego tienen backend; el resto sigue con ejemplos hasta que exista su endpoint.
export const api: Api = MODO_EJEMPLO ? mockApi : { ...mockApi, prepararFicha: realApi.prepararFicha, generarCancion: realApi.generarCancion, generarAudio: realApi.generarAudio, generarJuego: realApi.generarJuego, generarSesion: realApi.generarSesion, buscarRecursos: realApi.buscarRecursos }

export * from './types'
export { COSTOS, CREDITOS_MENSUALES, textoCosto } from './costos'
