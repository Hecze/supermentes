// Arma la grilla de un crucigrama con un algoritmo simple (sin IA).
// Las palabras y pistas salen del vocabulario de la ficha.

export type Direccion = 'horizontal' | 'vertical'

export type Entrada = { palabra: string; pista: string }

export type Ubicada = {
  palabra: string
  pista: string
  fila: number
  col: number
  dir: Direccion
  numero: number
}

export type Crucigrama = {
  filas: number
  cols: number
  letras: (string | null)[][]
  numeros: (number | null)[][]
  ubicadas: Ubicada[]
  sinUbicar: Entrada[]
}

/** Mayúsculas sin tildes, conservando la Ñ. */
export function normalizar(palabra: string) {
  return palabra
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-̂̄-ͯ]/g, '')
    .normalize('NFC')
    .replace(/[^A-ZÑ]/g, '')
}

function aleatorio(semilla: number) {
  let a = semilla | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function armarCrucigrama(entradas: Entrada[], semilla = 1): Crucigrama {
  const azar = aleatorio(semilla)
  const palabras = entradas
    .map((e) => ({ ...e, palabra: normalizar(e.palabra) }))
    .filter((e) => e.palabra.length > 1)

  // La más larga va primero; el resto se ordena por largo con un poco de azar para variar la grilla.
  const ordenadas = [...palabras].sort((a, b) => b.palabra.length - a.palabra.length)
  const [primera, ...resto] = ordenadas
  const orden = resto
    .map((e) => ({ e, k: e.palabra.length + azar() * 4 }))
    .sort((a, b) => b.k - a.k)
    .map((x) => x.e)

  const letras = new Map<string, string>()
  const usos = new Map<string, Set<Direccion>>()
  const clave = (f: number, c: number) => `${f},${c}`
  const colocadas: Omit<Ubicada, 'numero'>[] = []
  const sinUbicar: Entrada[] = []
  let lim = { f0: 0, f1: 0, c0: 0, c1: 0 }

  const paso = (dir: Direccion) => (dir === 'vertical' ? [1, 0] : [0, 1])

  function colocar(e: Entrada, fila: number, col: number, dir: Direccion) {
    const [df, dc] = paso(dir)
    for (let i = 0; i < e.palabra.length; i++) {
      const k = clave(fila + df * i, col + dc * i)
      letras.set(k, e.palabra[i])
      const s = usos.get(k) ?? new Set<Direccion>()
      s.add(dir)
      usos.set(k, s)
    }
    colocadas.push({ ...e, fila, col, dir })
    lim = {
      f0: Math.min(lim.f0, fila),
      f1: Math.max(lim.f1, fila + df * (e.palabra.length - 1)),
      c0: Math.min(lim.c0, col),
      c1: Math.max(lim.c1, col + dc * (e.palabra.length - 1)),
    }
  }

  /** Devuelve cuántos cruces tendría la palabra, o -1 si no cabe ahí. */
  function cruces(palabra: string, fila: number, col: number, dir: Direccion) {
    const [df, dc] = paso(dir)
    if (letras.has(clave(fila - df, col - dc))) return -1
    if (letras.has(clave(fila + df * palabra.length, col + dc * palabra.length))) return -1
    let n = 0
    for (let i = 0; i < palabra.length; i++) {
      const f = fila + df * i
      const c = col + dc * i
      const actual = letras.get(clave(f, c))
      if (actual !== undefined) {
        if (actual !== palabra[i] || usos.get(clave(f, c))?.has(dir)) return -1
        n++
      } else if (letras.has(clave(f - dc, c - df)) || letras.has(clave(f + dc, c + df))) {
        // Una letra nueva no puede quedar pegada a otra palabra en paralelo.
        return -1
      }
    }
    return n === palabra.length ? -1 : n
  }

  if (!primera) return { filas: 0, cols: 0, letras: [], numeros: [], ubicadas: [], sinUbicar: [] }
  colocar(primera, 0, 0, 'horizontal')

  for (const e of orden) {
    let mejor: { fila: number; col: number; dir: Direccion; puntaje: number } | null = null
    for (const p of colocadas) {
      const dir: Direccion = p.dir === 'horizontal' ? 'vertical' : 'horizontal'
      for (let i = 0; i < p.palabra.length; i++) {
        for (let j = 0; j < e.palabra.length; j++) {
          if (p.palabra[i] !== e.palabra[j]) continue
          const fCruce = p.fila + (p.dir === 'vertical' ? i : 0)
          const cCruce = p.col + (p.dir === 'horizontal' ? i : 0)
          const fila = dir === 'vertical' ? fCruce - j : fCruce
          const col = dir === 'horizontal' ? cCruce - j : cCruce
          const n = cruces(e.palabra, fila, col, dir)
          if (n < 1) continue
          const [df, dc] = paso(dir)
          const alto = Math.max(lim.f1, fila + df * (e.palabra.length - 1)) - Math.min(lim.f0, fila) + 1
          const ancho = Math.max(lim.c1, col + dc * (e.palabra.length - 1)) - Math.min(lim.c0, col) + 1
          const puntaje = n * 100 - alto * ancho - Math.abs(alto - ancho) * 3 + azar() * 6
          if (!mejor || puntaje > mejor.puntaje) mejor = { fila, col, dir, puntaje }
        }
      }
    }
    if (mejor) colocar(e, mejor.fila, mejor.col, mejor.dir)
    else sinUbicar.push(e)
  }

  const filas = lim.f1 - lim.f0 + 1
  const cols = lim.c1 - lim.c0 + 1
  const grilla: (string | null)[][] = Array.from({ length: filas }, () => Array<string | null>(cols).fill(null))
  for (const [k, letra] of letras) {
    const [f, c] = k.split(',').map(Number)
    grilla[f - lim.f0][c - lim.c0] = letra
  }

  // Numeración: de arriba hacia abajo y de izquierda a derecha; una casilla puede iniciar dos palabras.
  const movidas = colocadas.map((p) => ({ ...p, fila: p.fila - lim.f0, col: p.col - lim.c0 }))
  const inicios = [...new Set(movidas.map((p) => clave(p.fila, p.col)))]
    .map((k) => k.split(',').map(Number) as [number, number])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const numeros: (number | null)[][] = Array.from({ length: filas }, () => Array<number | null>(cols).fill(null))
  inicios.forEach(([f, c], i) => (numeros[f][c] = i + 1))

  const ubicadas = movidas
    .map((p) => ({ ...p, numero: numeros[p.fila][p.col] as number }))
    .sort((a, b) => a.numero - b.numero)

  return { filas, cols, letras: grilla, numeros, ubicadas, sinUbicar }
}

/** Prueba varias semillas y se queda con la grilla que ubica más palabras y ocupa menos espacio. */
export function mejorCrucigrama(entradas: Entrada[], semilla = 1, intentos = 12): Crucigrama {
  let mejor: Crucigrama | null = null
  for (let i = 0; i < intentos; i++) {
    const c = armarCrucigrama(entradas, semilla * 97 + i)
    if (
      !mejor ||
      c.sinUbicar.length < mejor.sinUbicar.length ||
      (c.sinUbicar.length === mejor.sinUbicar.length && c.filas * c.cols < mejor.filas * mejor.cols)
    ) {
      mejor = c
    }
  }
  return mejor as Crucigrama
}
