// Créditos que cuesta cada acción. Lo caro (audio, imágenes) se cobra aparte y solo a pedido.
// Lo que sale sin llamar a la IA (las hojas del examen, el crucigrama, la biblioteca) es gratis.
export const COSTOS = {
  ficha: 0,
  sesion: 0,
  letra: 1,
  audio: 3,
  examen: 0,
  juego: 1,
  crucigrama: 0,
  biblioteca: 0,
} as const

export const CREDITOS_MENSUALES = 30

export function textoCosto(n: number) {
  if (n === 0) return 'Gratis'
  return `${n} ${n === 1 ? 'crédito' : 'créditos'}`
}
