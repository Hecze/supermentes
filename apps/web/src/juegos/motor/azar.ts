// Azar con semilla: la misma semilla da la misma partida, así una ronda se puede repetir igual.

export function crearAzar(semilla: number) {
  let a = semilla | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const nuevaSemilla = () => Math.floor(Math.random() * 2 ** 31)

/** Entero entre min y max, ambos incluidos. */
export const entero = (azar: () => number, min: number, max: number) => min + Math.floor(azar() * (max - min + 1))

export const elegir = <T,>(azar: () => number, lista: readonly T[]): T => lista[Math.floor(azar() * lista.length)]

export function barajar<T>(azar: () => number, lista: readonly T[]): T[] {
  const a = [...lista]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Saca elementos de una lista barajada y la vuelve a barajar al acabarse, sin repetir el último. */
export function bolsa<T>(azar: () => number, lista: readonly T[]) {
  let pila: T[] = []
  let ultimo: T | undefined
  return () => {
    if (pila.length === 0) {
      pila = barajar(azar, lista)
      if (pila.length > 1 && pila[pila.length - 1] === ultimo) pila.unshift(pila.pop()!)
    }
    ultimo = pila.pop()!
    return ultimo
  }
}
