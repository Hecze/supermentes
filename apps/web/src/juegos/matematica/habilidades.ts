// Habilidades de cálculo que se generan con algoritmos, sin IA: son gratis, no se acaban y siempre están bien.
// Cada nivel indica en qué grados se suele trabajar (Currículo Nacional) y arma retos cuyos distractores
// empiezan por los errores más frecuentes de los estudiantes.
import type { Reto } from '../tipos'
import { elegir, entero } from '../motor/azar'
import { distractores, exponente, frac, fracSimple, num, soloIncorrectas, valor } from './formato'

type Azar = () => number
type Generador = (azar: Azar) => Reto

export type Nivel = { nombre: string; grados: string[]; generar: Generador }

export type GrupoHabilidad = 'Números' | 'Operaciones' | 'Fracciones' | 'Decimales y porcentajes' | 'Álgebra y enteros' | 'Medidas'

export type Habilidad = {
  id: string
  nombre: string
  grupo: GrupoHabilidad
  /** Palabras del título o del propósito del tema que la delatan (texto en minúsculas y sin tildes). */
  claves: RegExp
  niveles: Nivel[]
}

const I = (...n: number[]) => n.map((x) => `inicial-${x}`)
const P = (...n: number[]) => n.map((x) => `primaria-${x}`)
const S = (...n: number[]) => n.map((x) => `secundaria-${x}`)

/** Número entre paréntesis si es negativo: 5 + (−3). */
const conSigno = (n: number) => (n < 0 ? `(${num(n)})` : num(n))

const op = (texto: string) => `${texto} = ?`

/** Algunos generadores descartan casos feos (resultados enteros, divisiones inexactas) y vuelven a intentar. */
function hasta<T>(intento: () => T | null): T {
  for (let i = 0; i < 50; i++) {
    const r = intento()
    if (r) return r
  }
  throw new Error('No se pudo generar el reto')
}

function digitos(n: number) {
  return String(Math.abs(n)).split('').reverse().map(Number)
}

/** Error típico al sumar sin llevar: cada columna se suma y se queda solo la unidad. */
function sumaSinLlevar(a: number, b: number) {
  const da = digitos(a)
  const db = digitos(b)
  let r = 0
  for (let i = Math.max(da.length, db.length) - 1; i >= 0; i--) r = r * 10 + (((da[i] ?? 0) + (db[i] ?? 0)) % 10)
  return r
}

/** Error típico al restar sin prestar: en cada columna se resta el menor del mayor. */
function restaAlReves(a: number, b: number) {
  const da = digitos(a)
  const db = digitos(b)
  let r = 0
  for (let i = da.length - 1; i >= 0; i--) r = r * 10 + Math.abs((da[i] ?? 0) - (db[i] ?? 0))
  return r
}

// ---------- Números ----------

const FIGURAS = ['🍎', '⭐', '🐟', '🌸', '🦋', '🍓', '⚽', '🐞', '🎈', '🐥']

const contar =
  (min: number, max: number): Generador =>
  (azar) => {
    const n = entero(azar, min, max)
    return {
      consigna: '¿Cuántos hay?',
      pregunta: '',
      visual: { tipo: 'contar', figura: elegir(azar, FIGURAS), cantidad: n },
      respuesta: num(n),
      distractores: distractores(n, [n + 1, n - 1, n + 2, n - 2], { min: 1 }),
    }
  }

const comparar =
  (max: number, min = 1): Generador =>
  (azar) => {
    const a = entero(azar, min, max)
    const r = azar()
    let b: number
    if (r < 0.2) b = a
    else if (r < 0.5 && a >= 10) {
      // Mismas cifras en otro orden: 45 y 54. Obliga a mirar el valor de posición.
      const volteado = Number(String(a).split('').reverse().join(''))
      b = volteado !== a && volteado > 0 ? volteado : entero(azar, 1, max)
    } else b = entero(azar, Math.max(1, Math.round(a * 0.7)), Math.min(max, Math.round(a * 1.3) + 2))
    const respuesta = a > b ? '>' : a < b ? '<' : '='
    return {
      consigna: '¿Mayor, menor o igual?',
      pregunta: `${num(a)}  ▢  ${num(b)}`,
      respuesta,
      distractores: ['<', '>', '='].filter((s) => s !== respuesta),
    }
  }

const valorPosicional =
  (cifras: 2 | 3 | 4): Generador =>
  (azar) => {
    const nombres = ['U', 'D', 'C', 'UM']
    const ds = Array.from({ length: cifras }, (_, i) => (i === cifras - 1 ? entero(azar, 1, 9) : azar() < 0.2 ? 0 : entero(azar, 1, 9)))
    const n = ds.reduce((s, d, i) => s + d * 10 ** i, 0)
    const partes = ds
      .map((d, i) => (d === 0 ? null : `${d} ${nombres[i]}`))
      .filter(Boolean)
      .reverse()
    const sinCeros = Number(ds.filter((d) => d !== 0).reverse().join(''))
    const volteado = Number([...ds].join(''))
    const sumaCifras = ds.reduce((s, d) => s + d, 0)
    return {
      consigna: '¿Qué número es?',
      pregunta: partes.join(' + '),
      respuesta: num(n),
      distractores: distractores(n, [sinCeros, volteado, sumaCifras, n * 10, n + 10, n - 10, n + 1], { min: 1 }),
    }
  }

const redondear =
  (a: 10 | 100 | 1000): Generador =>
  (azar) => {
    const n = hasta(() => {
      const x = entero(azar, a + 1, a * 99)
      return x % a === 0 ? null : x
    })
    const abajo = Math.floor(n / a) * a
    const r = Math.round(n / a) * a
    return {
      consigna: `Redondea ${a === 10 ? 'a la decena' : a === 100 ? 'a la centena' : 'al millar'}`,
      pregunta: num(n),
      respuesta: num(r),
      distractores: distractores(r, [r === abajo ? abajo + a : abajo, n, abajo - a, r + a, Math.floor(n / (a * 10)) * a * 10], { paso: a, min: 0 }),
    }
  }

const secuencia =
  (tipo: 'saltos' | 'sumar' | 'multiplicar'): Generador =>
  (azar) => {
    let terminos: number[]
    if (tipo === 'multiplicar') {
      const f = elegir(azar, [2, 3])
      const ini = entero(azar, 1, f === 2 ? 6 : 3)
      terminos = [0, 1, 2, 3].map((i) => ini * f ** i)
    } else {
      const paso = tipo === 'saltos' ? elegir(azar, [2, 5, 10]) : entero(azar, 3, 9)
      // Al restar se empieza alto para no llegar a negativos.
      const baja = tipo === 'sumar' && azar() < 0.4
      const ini = baja ? entero(azar, paso * 5, paso * 5 + 40) : entero(azar, 0, 30)
      // Los saltos de 2, 5 o 10 empiezan en un múltiplo, como al contar en voz alta.
      const inicio = tipo === 'saltos' ? Math.round(ini / paso) * paso : ini
      terminos = [0, 1, 2, 3].map((i) => (baja ? inicio - i * paso : inicio + i * paso))
    }
    const [, , penultimo, ultimo] = terminos
    const sigue = tipo === 'multiplicar' ? ultimo * (ultimo / penultimo) : ultimo + (ultimo - penultimo)
    // En las de multiplicar, el error típico es seguir sumando la última diferencia.
    const pasoAditivo = ultimo + (ultimo - penultimo)
    return {
      consigna: '¿Qué número sigue?',
      pregunta: `${terminos.map(num).join(', ')}, ?`,
      respuesta: num(sigue),
      distractores: distractores(sigue, [pasoAditivo, sigue + 1, sigue - 1, ultimo + 1, sigue + (ultimo - penultimo), ultimo], { min: 0 }),
    }
  }

// ---------- Operaciones ----------

const sumar =
  (minA: number, maxA: number, maxTotal: number): Generador =>
  (azar) => {
    const a = entero(azar, minA, maxA)
    const b = entero(azar, Math.max(1, Math.round(minA / 2)), Math.max(1, maxTotal - a))
    const s = a + b
    // Los errores de llevar solo tienen sentido con dos cifras o más.
    const frecuentes =
      maxTotal <= 10
        ? [s + 1, s - 1, Math.abs(a - b), s + 2]
        : [sumaSinLlevar(a, b), s + 10, s - 10, s + 1, s - 1, Math.abs(a - b), ...(maxTotal > 100 ? [s + 100, s - 100] : [])]
    return { pregunta: op(`${num(a)} + ${num(b)}`), respuesta: num(s), distractores: distractores(s, frecuentes, { min: 0 }) }
  }

const restar =
  (minA: number, maxA: number): Generador =>
  (azar) => {
    const a = entero(azar, minA, maxA)
    const b = entero(azar, 1, a - 1)
    const d = a - b
    const frecuentes =
      maxA <= 10
        ? [d + 1, d - 1, a + b, d + 2]
        : [restaAlReves(a, b), d + 10, d - 10, d + 1, d - 1, a + b, ...(maxA > 100 ? [d + 100, d - 100] : [])]
    return { pregunta: op(`${num(a)} − ${num(b)}`), respuesta: num(d), distractores: distractores(d, frecuentes, { min: 0 }) }
  }

const tabla =
  (factores: number[]): Generador =>
  (azar) => {
    const a = elegir(azar, factores)
    const b = entero(azar, 1, 10)
    const p = a * b
    return {
      pregunta: op(`${a} × ${b}`),
      respuesta: num(p),
      distractores: distractores(p, [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, a + b, p + 1, p - 1, p + 10], { min: 1 }),
    }
  }

const dividir =
  (divisores: number[]): Generador =>
  (azar) => {
    const d = elegir(azar, divisores)
    const q = entero(azar, 2, 10)
    const a = d * q
    return {
      pregunta: op(`${a} ÷ ${d}`),
      respuesta: num(q),
      distractores: distractores(q, [q + 1, q - 1, d, a - d, q * 2, q + 2], { min: 1 }),
    }
  }

const doblesMitades =
  (tipo: 'dobles' | 'mitades' | 'ambos', max: number): Generador =>
  (azar) => {
    const doble = tipo === 'dobles' || (tipo === 'ambos' && azar() < 0.5)
    if (doble) {
      const n = entero(azar, 2, max)
      return { pregunta: op(`Doble de ${n}`), respuesta: num(2 * n), distractores: distractores(2 * n, [n + 2, 3 * n, n + 1, 2 * n + 1, 2 * n - 1, n], { min: 1 }) }
    }
    const n = entero(azar, 2, Math.floor(max / 2)) * 2
    const m = n / 2
    return { pregunta: op(`Mitad de ${n}`), respuesta: num(m), distractores: distractores(m, [n * 2, m + 1, m - 1, n - 2, m + 2], { min: 1 }) }
  }

const combinadas =
  (parentesis: boolean): Generador =>
  (azar) =>
    hasta(() => {
      const a = entero(azar, 2, 12)
      const b = entero(azar, 2, 9)
      const c = entero(azar, 2, 9)
      const forma = entero(azar, 0, 1)
      let texto: string
      let r: number
      let error: number
      if (!parentesis) {
        if (forma === 0) {
          texto = `${a} + ${b} × ${c}`
          r = a + b * c
          error = (a + b) * c
        } else {
          const grande = b * c + entero(azar, 1, 20)
          texto = `${grande} − ${b} × ${c}`
          r = grande - b * c
          error = (grande - b) * c
        }
      } else if (forma === 0) {
        texto = `(${a} + ${b}) × ${c}`
        r = (a + b) * c
        error = a + b * c
      } else {
        if (b <= c) return null
        texto = `${a} × (${b} − ${c})`
        r = a * (b - c)
        error = a * b - c
      }
      return { pregunta: op(texto), respuesta: num(r), distractores: distractores(r, [error, r + 1, r - 1, r + 10, r - 10], { min: 0 }) }
    })

// ---------- Fracciones ----------

const fraccionPintada =
  (denominadores: number[]): Generador =>
  (azar) => {
    const n = elegir(azar, denominadores)
    const k = entero(azar, 1, n - 1)
    const correcta = frac(k, n)
    return {
      consigna: '¿Qué fracción está pintada?',
      pregunta: '',
      visual: { tipo: 'fraccion', partes: [k, n] },
      respuesta: correcta,
      distractores: soloIncorrectas(correcta, [
        frac(n, k),
        frac(n - k, n),
        frac(k + 1, n),
        frac(k, n + 1),
        frac(k, n - 1),
        frac(Math.max(1, k - 1), n),
        frac(k, n * 2),
        frac(n - k, k),
        frac(k + 2, n + 2),
        frac(1, n),
        frac(k, n + 2),
      ]),
    }
  }

const equivalentes =
  (base: [number, number][] | null): Generador =>
  (azar) => {
    const [a, b] = base ? elegir(azar, base) : hasta(() => {
      const d = entero(azar, 2, 10)
      const n = entero(azar, 1, d - 1)
      return fracSimple(n, d) === frac(n, d) ? ([n, d] as [number, number]) : null
    })
    const m = entero(azar, 2, base ? 4 : 5)
    if (azar() < 0.6) {
      const r = a * m
      return { consigna: 'Completa la fracción equivalente', pregunta: `${frac(a, b)} = ?/${b * m}`, respuesta: num(r), distractores: distractores(r, [a + m, r + 1, r - 1, b * m, m, a * (m + 1)], { min: 1 }) }
    }
    const r = b * m
    return { consigna: 'Completa la fracción equivalente', pregunta: `${frac(a, b)} = ${a * m}/?`, respuesta: num(r), distractores: distractores(r, [b + m, r + 1, r - 1, a * m, b * (m + 1), m], { min: 1 }) }
  }

const fraccionDe =
  (simples: boolean): Generador =>
  (azar) => {
    const b = elegir(azar, simples ? [2, 3, 4] : [2, 3, 4, 5, 6, 8, 10])
    const a = simples ? 1 : entero(azar, 1, b - 1)
    const parte = entero(azar, 2, simples ? 10 : 12)
    const n = b * parte
    const r = a * parte
    return {
      pregunta: op(`${frac(a, b)} de ${n}`),
      respuesta: num(r),
      distractores: distractores(r, [parte, n * a, n - a, n, r + 1, r - 1, n * b, r + parte], { min: 1 }),
    }
  }

const operarFracciones =
  (igualDenominador: boolean): Generador =>
  (azar) =>
    hasta(() => {
      const resta = azar() < 0.4
      if (igualDenominador) {
        const d = entero(azar, 3, 12)
        const a = entero(azar, 1, d - 2)
        const b = entero(azar, 1, d - 1 - a)
        const [x, y] = resta ? [a + b, b] : [a, b]
        const r = resta ? x - y : x + y
        const correcta = frac(r, d)
        return {
          pregunta: op(`${frac(x, d)} ${resta ? '−' : '+'} ${frac(y, d)}`),
          respuesta: correcta,
          // El error clásico al sumar es sumar también los denominadores: 1/5 + 2/5 = 3/10.
          distractores: soloIncorrectas(correcta, [
            resta ? frac(x + y, d) : frac(r, d * 2),
            resta ? frac(r, d * 2) : frac(Math.abs(x - y) || 1, d),
            frac(r + 1, d),
            frac(r > 1 ? r - 1 : r + 2, d),
            frac(r, d * d),
            frac(r, d + 1),
            frac(r + 2, d),
          ]),
        }
      }
      const d1 = elegir(azar, [2, 3, 4, 5])
      const d2 = d1 * elegir(azar, [2, 3])
      const a = entero(azar, 1, d1 - 1)
      const b = entero(azar, 1, d2 - 1)
      const num1 = a * (d2 / d1)
      const r = resta ? num1 - b : num1 + b
      if (r <= 0 || r % d2 === 0) return null
      const correcta = fracSimple(r, d2)
      return {
        pregunta: op(`${frac(a, d1)} ${resta ? '−' : '+'} ${frac(b, d2)}`),
        respuesta: correcta,
        distractores: soloIncorrectas(correcta, [
          frac(resta ? Math.abs(a - b) || 1 : a + b, d1 + d2),
          frac(resta ? Math.abs(a - b) || 1 : a + b, d2),
          frac(r + 1, d2),
          frac(Math.max(1, r - 1), d2),
          frac(r, d1 * d2),
          frac(r + 2, d2),
          frac(a + b, d1 * d2),
        ]),
      }
    })

// ---------- Decimales y porcentajes ----------

const DEC = { min: 0, decimales: true }

const sumarDecimos: Generador = (azar) => {
  const ta = entero(azar, 1, 9)
  const tb = entero(azar, 1, 9)
  const s = (ta + tb) / 10
  return {
    pregunta: op(`${num(ta / 10)} + ${num(tb / 10)}`),
    respuesta: num(s),
    // 0,7 + 0,5 = 0,12 es el error clásico: doce décimos escritos como doce centésimos.
    distractores: distractores(s, [(ta + tb) / 100, ta + tb, s + 0.1, s - 0.1, s + 1], { ...DEC, paso: 0.1 }),
  }
}

const sumarCentesimos: Generador = (azar) => {
  const a = entero(azar, 101, 899) / 100
  const b = entero(azar, 1, 9) / 10
  const s = Math.round((a + b) * 100) / 100
  // Sumar sin alinear la coma: 1,25 + 0,5 como si fuera 125 + 5.
  const desalineado = Math.round(a * 100 + b * 10) / 100
  return {
    pregunta: op(`${num(a)} + ${num(b)}`),
    respuesta: num(s),
    distractores: distractores(s, [desalineado, s + 0.1, s - 0.1, s + 1, Math.round(s * 10) / 100, s + 0.01], { ...DEC, paso: 0.01 }),
  }
}

const porPotenciaDe10: Generador = (azar) => {
  const a = entero(azar, 101, 999) / 100
  const f = elegir(azar, [10, 100, 1000])
  const r = Math.round(a * f * 1000) / 1000
  return {
    pregunta: op(`${num(a)} × ${num(f)}`),
    respuesta: num(r),
    distractores: distractores(r, [a, r * 10, r / 10, a / f, r / 100, r + 1], { ...DEC, paso: f / 100 }),
  }
}

const porcentaje =
  (faciles: boolean): Generador =>
  (azar) =>
    hasta(() => {
      const p = faciles ? elegir(azar, [50, 25, 10]) : elegir(azar, [5, 15, 20, 30, 40, 60, 75])
      const n = elegir(azar, [20, 40, 60, 80, 100, 120, 200, 300, 400, 500])
      const r = (p * n) / 100
      if (!Number.isInteger(r)) return null
      return {
        pregunta: op(`${p} % de ${n}`),
        respuesta: num(r),
        distractores: distractores(r, [n - p, (n * 50) / 100, n / 10, p, n + p, r * 2, r + 10, r - 10], { min: 1 }),
      }
    })

// ---------- Álgebra y enteros ----------

const potencia =
  (cuadrados: boolean): Generador =>
  (azar) =>
    hasta(() => {
      const b = cuadrados ? entero(azar, 2, 12) : entero(azar, 2, 5)
      const e = cuadrados ? 2 : entero(azar, 2, 5)
      const r = b ** e
      if (r > 1024) return null
      return {
        pregunta: op(`${b}${exponente(e)}`),
        respuesta: num(r),
        // El error clásico es multiplicar la base por el exponente: 7² = 14.
        distractores: distractores(r, cuadrados ? [b * e, (b + 1) ** 2, (b - 1) ** 2, r + 1, r - 1, b + e] : [b * e, e ** b, b ** (e + 1), b ** (e - 1), r + 1, r - 1], { min: 1 }),
      }
    })

const raiz: Generador = (azar) => {
  const n = entero(azar, 2, 15)
  const sq = n * n
  return {
    pregunta: op(`√${sq}`),
    respuesta: num(n),
    distractores: distractores(n, [sq / 2, n + 1, n - 1, sq, n * 2, n + 2], { min: 1 }),
  }
}

const ecuacion =
  (tipo: 'suma' | 'producto' | 'dos-pasos'): Generador =>
  (azar) => {
    const x = entero(azar, 2, 12)
    if (tipo === 'suma') {
      const a = entero(azar, 2, 20)
      if (azar() < 0.5) {
        return { consigna: '¿Cuánto vale x?', pregunta: `x + ${a} = ${x + a}`, respuesta: num(x), distractores: distractores(x, [x + 2 * a, x + 1, x - 1, a, x + a], { min: 1 }) }
      }
      return { consigna: '¿Cuánto vale x?', pregunta: `x − ${a} = ${x}`, respuesta: num(x + a), distractores: distractores(x + a, [x, x + a + 1, x + a - 1, a, x - a], { min: 1 }) }
    }
    const a = entero(azar, 2, 9)
    if (tipo === 'producto') {
      return { consigna: '¿Cuánto vale x?', pregunta: `${a}x = ${a * x}`, respuesta: num(x), distractores: distractores(x, [a * x - a, a * x + a, a * x * a, x + 1, x - 1], { min: 1 }) }
    }
    const b = entero(azar, 1, 15)
    const c = a * x + b
    return {
      consigna: '¿Cuánto vale x?',
      pregunta: `${a}x + ${b} = ${c}`,
      respuesta: num(x),
      distractores: distractores(x, [(c + b) / a, c - b, (c - b) * a, x + 1, x - 1, c / a], { min: 1 }),
    }
  }

const enteros =
  (tipo: 'sumar' | 'sumar-restar' | 'multiplicar'): Generador =>
  (azar) =>
    hasta(() => {
      const a = entero(azar, -12, 12)
      const b = entero(azar, -12, 12)
      if (a === 0 || b === 0 || (a > 0 && b > 0)) return null
      const MIN = { min: -1000 }
      if (tipo === 'multiplicar') {
        if (azar() < 0.5) {
          const r = a * b
          return { pregunta: op(`${num(a)} × ${conSigno(b)}`), respuesta: num(r), distractores: distractores(r, [-r, a + b, -(a + b), r + 1], MIN) }
        }
        const r = a * b
        return { pregunta: op(`${num(r)} ÷ ${conSigno(b)}`), respuesta: num(a), distractores: distractores(a, [-a, r - b, r + b, r * b], MIN) }
      }
      if (tipo === 'sumar' || azar() < 0.5) {
        const r = a + b
        return {
          pregunta: op(`${num(a)} + ${conSigno(b)}`),
          respuesta: num(r),
          distractores: distractores(r, [-r, a - b, Math.abs(a) + Math.abs(b), -(Math.abs(a) + Math.abs(b)), r + 1, r - 1], MIN),
        }
      }
      const r = a - b
      return {
        pregunta: op(`${num(a)} − ${conSigno(b)}`),
        respuesta: num(r),
        distractores: distractores(r, [a + b, -r, -(a + b), r + 1, r - 1], MIN),
      }
    })

// ---------- Medidas ----------

const convertir =
  (tipo: 'longitud' | 'masa' | 'tiempo' | 'capacidad'): Generador =>
  (azar) => {
    if (tipo === 'tiempo') {
      if (azar() < 0.5) {
        const h = entero(azar, 1, 5)
        const r = h * 60
        return { pregunta: `${h} h = ? min`, respuesta: num(r), distractores: distractores(r, [h * 100, h * 10, r + 60, r - 60, 60, h * 60 + 30], { paso: 10, min: 10 }) }
      }
      const h = entero(azar, 1, 3)
      const m = elegir(azar, [10, 15, 20, 30, 40, 45])
      const r = h * 60 + m
      return { pregunta: `${h} h ${m} min = ? min`, respuesta: num(r), distractores: distractores(r, [h * 100 + m, h + m, r + 60, r - 60, h * 60, r + 10], { paso: 5, min: 5 }) }
    }
    const [grande, chica, f] = { longitud: ['m', 'cm', 100], masa: ['kg', 'g', 1000], capacidad: ['L', 'mL', 1000] }[tipo] as [string, string, number]
    const n = entero(azar, 2, 9)
    if (azar() < 0.6) {
      const r = n * f
      return { pregunta: `${n} ${grande} = ? ${chica}`, respuesta: num(r), distractores: distractores(r, [n * 10, n * f * 10, n * (f / 10), n, r + f / 10, r + 1], { paso: f / 10, min: 1 }) }
    }
    return { pregunta: `${num(n * f)} ${chica} = ? ${grande}`, respuesta: num(n), distractores: distractores(n, [n * 10, n * f, n * 100, n + 1, n - 1, n * 1000], { min: 1 }) }
  }

// ---------- Catálogo ----------

export const HABILIDADES: Habilidad[] = [
  {
    id: 'contar',
    nombre: 'Contar',
    grupo: 'Números',
    claves: /\b(contar|conteo|cuantos hay|cuantificar)\b/,
    niveles: [
      { nombre: 'Hasta 5', grados: I(3, 4), generar: contar(1, 5) },
      { nombre: 'Hasta 10', grados: [...I(5), ...P(1)], generar: contar(3, 10) },
      { nombre: 'Hasta 20', grados: P(1, 2), generar: contar(8, 20) },
    ],
  },
  {
    id: 'comparar',
    nombre: 'Mayor, menor o igual',
    grupo: 'Números',
    claves: /\b(compar\w*|mayor que|menor que|ordena\w* numeros)\b/,
    niveles: [
      { nombre: 'Hasta 20', grados: P(1), generar: comparar(20) },
      { nombre: 'Hasta 100', grados: P(1, 2), generar: comparar(100, 10) },
      { nombre: 'Hasta 1000', grados: P(2, 3), generar: comparar(1000, 100) },
      { nombre: 'Hasta 100 000', grados: P(3, 4, 5), generar: comparar(100_000, 1000) },
    ],
  },
  {
    id: 'valor-posicional',
    nombre: 'Valor posicional',
    grupo: 'Números',
    claves: /\b(valor posicional|decenas?|centenas?|millar\w*|descompo\w*|tablero posicional)\b/,
    niveles: [
      { nombre: 'Decenas y unidades', grados: P(1, 2), generar: valorPosicional(2) },
      { nombre: 'Centenas', grados: P(2, 3), generar: valorPosicional(3) },
      { nombre: 'Millares', grados: P(3, 4), generar: valorPosicional(4) },
    ],
  },
  {
    id: 'redondeo',
    nombre: 'Redondear',
    grupo: 'Números',
    claves: /\b(redonde\w*|aproxima\w*|estima\w*)\b/,
    niveles: [
      { nombre: 'A la decena', grados: P(3, 4), generar: redondear(10) },
      { nombre: 'A la centena', grados: P(4, 5), generar: redondear(100) },
      { nombre: 'Al millar', grados: P(5, 6), generar: redondear(1000) },
    ],
  },
  {
    id: 'secuencias',
    nombre: 'Secuencias',
    grupo: 'Números',
    claves: /\b(secuencia\w*|patron\w*|sucesion\w*|regularidad\w*|serie\w* numerica\w*)\b/,
    niveles: [
      { nombre: 'De 2 en 2, de 5 en 5, de 10 en 10', grados: P(1, 2), generar: secuencia('saltos') },
      { nombre: 'Sumando o restando', grados: P(2, 3, 4), generar: secuencia('sumar') },
      { nombre: 'Multiplicando', grados: P(4, 5, 6), generar: secuencia('multiplicar') },
    ],
  },
  {
    id: 'sumar',
    nombre: 'Sumar',
    grupo: 'Operaciones',
    claves: /\b(suma\w*|adicion\w*|agregar|juntar)\b/,
    niveles: [
      { nombre: 'Hasta 10', grados: [...I(5), ...P(1)], generar: sumar(1, 9, 10) },
      { nombre: 'Hasta 20', grados: P(1, 2), generar: sumar(3, 15, 20) },
      { nombre: 'Hasta 100', grados: P(2, 3), generar: sumar(11, 85, 99) },
      { nombre: 'Hasta 1000', grados: P(3, 4), generar: sumar(100, 850, 999) },
      { nombre: 'Hasta 10 000', grados: P(4, 5, 6), generar: sumar(1000, 8500, 9999) },
    ],
  },
  {
    id: 'restar',
    nombre: 'Restar',
    grupo: 'Operaciones',
    claves: /\b(resta\w*|sustraccion\w*|quitar)\b/,
    niveles: [
      { nombre: 'Hasta 10', grados: [...I(5), ...P(1)], generar: restar(3, 10) },
      { nombre: 'Hasta 20', grados: P(1, 2), generar: restar(11, 20) },
      { nombre: 'Hasta 100', grados: P(2, 3), generar: restar(30, 99) },
      { nombre: 'Hasta 1000', grados: P(3, 4), generar: restar(200, 999) },
      { nombre: 'Hasta 10 000', grados: P(4, 5, 6), generar: restar(2000, 9999) },
    ],
  },
  {
    id: 'tablas',
    nombre: 'Tablas de multiplicar',
    grupo: 'Operaciones',
    claves: /\b(multiplica\w*|tablas?|producto\w*|veces)\b/,
    niveles: [
      ...[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({ nombre: `Del ${n}`, grados: n <= 5 || n === 10 ? P(2, 3) : P(3, 4), generar: tabla([n]) })),
      { nombre: 'Del 2 al 5', grados: P(2, 3), generar: tabla([2, 3, 4, 5]) },
      { nombre: 'Del 6 al 9', grados: P(3, 4), generar: tabla([6, 7, 8, 9]) },
      { nombre: 'Todas', grados: P(4, 5, 6), generar: tabla([2, 3, 4, 5, 6, 7, 8, 9, 10]) },
    ],
  },
  {
    id: 'dividir',
    nombre: 'Dividir',
    grupo: 'Operaciones',
    claves: /\b(divisi\w*|dividir|divide\w*|reparto\w*|repartir|cociente\w*)\b/,
    niveles: [
      { nombre: 'Entre 2, 3, 4 y 5', grados: P(3), generar: dividir([2, 3, 4, 5]) },
      { nombre: 'Entre 6, 7, 8 y 9', grados: P(3, 4), generar: dividir([6, 7, 8, 9]) },
      { nombre: 'Todas', grados: P(4, 5, 6), generar: dividir([2, 3, 4, 5, 6, 7, 8, 9]) },
    ],
  },
  {
    id: 'dobles-mitades',
    nombre: 'Dobles y mitades',
    grupo: 'Operaciones',
    claves: /\b(dobles?|mitad\w*|triples?)\b/,
    niveles: [
      { nombre: 'Dobles hasta 10', grados: P(1, 2), generar: doblesMitades('dobles', 10) },
      { nombre: 'Mitades hasta 20', grados: P(1, 2), generar: doblesMitades('mitades', 20) },
      { nombre: 'Dobles y mitades hasta 100', grados: P(2, 3), generar: doblesMitades('ambos', 50) },
    ],
  },
  {
    id: 'combinadas',
    nombre: 'Operaciones combinadas',
    grupo: 'Operaciones',
    claves: /\b(operaciones combinadas|jerarquia|signos de agrupacion)\b/,
    niveles: [
      { nombre: 'Sin paréntesis', grados: P(5, 6), generar: combinadas(false) },
      { nombre: 'Con paréntesis', grados: [...P(6), ...S(1)], generar: combinadas(true) },
    ],
  },
  {
    id: 'fracciones-reconocer',
    nombre: 'Fracciones: reconocer',
    grupo: 'Fracciones',
    claves: /\bfraccion\w*\b/,
    niveles: [
      { nombre: 'Medios, tercios y cuartos', grados: P(2, 3), generar: fraccionPintada([2, 3, 4]) },
      { nombre: 'Hasta octavos', grados: P(3, 4), generar: fraccionPintada([2, 3, 4, 5, 6, 8]) },
      { nombre: 'Hasta doceavos', grados: P(5, 6), generar: fraccionPintada([5, 6, 7, 8, 9, 10, 12]) },
    ],
  },
  {
    id: 'fracciones-equivalentes',
    nombre: 'Fracciones equivalentes',
    grupo: 'Fracciones',
    claves: /\b(equivalen\w*|amplifica\w*|simplifica\w*|valen lo mismo|valer lo mismo)\b/,
    niveles: [
      { nombre: 'Medios, tercios y cuartos', grados: P(3, 4), generar: equivalentes([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4]]) },
      { nombre: 'Cualquier fracción', grados: P(4, 5, 6), generar: equivalentes(null) },
    ],
  },
  {
    id: 'fraccion-de',
    nombre: 'Fracción de un número',
    grupo: 'Fracciones',
    claves: /\b(fraccion de (un|una)|parte de una cantidad|fraccion de una coleccion)\b/,
    niveles: [
      { nombre: 'Mitad, tercio y cuarto', grados: P(3, 4), generar: fraccionDe(true) },
      { nombre: 'Cualquier fracción', grados: P(5, 6), generar: fraccionDe(false) },
    ],
  },
  {
    id: 'fracciones-operar',
    nombre: 'Sumar y restar fracciones',
    grupo: 'Fracciones',
    claves: /\b((suma\w*|resta\w*|adicion\w*|sustraccion\w*|operaciones) (de|con) fracciones|fracciones homogeneas|fracciones heterogeneas)\b/,
    niveles: [
      { nombre: 'Igual denominador', grados: P(4, 5), generar: operarFracciones(true) },
      { nombre: 'Distinto denominador', grados: [...P(6), ...S(1)], generar: operarFracciones(false) },
    ],
  },
  {
    id: 'decimales',
    nombre: 'Decimales',
    grupo: 'Decimales y porcentajes',
    claves: /\bdecimal\w*\b/,
    niveles: [
      { nombre: 'Sumar décimos', grados: P(4, 5), generar: sumarDecimos },
      { nombre: 'Sumar con centésimos', grados: P(5, 6), generar: sumarCentesimos },
      { nombre: 'Por 10, 100 y 1000', grados: [...P(5, 6), ...S(1)], generar: porPotenciaDe10 },
    ],
  },
  {
    id: 'porcentajes',
    nombre: 'Porcentajes',
    grupo: 'Decimales y porcentajes',
    claves: /\b(porcentaje\w*|por ciento|tanto por ciento)\b/,
    niveles: [
      { nombre: '50 %, 25 % y 10 %', grados: [...P(6), ...S(1)], generar: porcentaje(true) },
      { nombre: 'Cualquier porcentaje', grados: S(1, 2, 3), generar: porcentaje(false) },
    ],
  },
  {
    id: 'potencias',
    nombre: 'Potencias',
    grupo: 'Álgebra y enteros',
    claves: /\b(potencia\w*|exponente\w*|al cuadrado|al cubo|potenciacion)\b/,
    niveles: [
      { nombre: 'Cuadrados', grados: P(5, 6), generar: potencia(true) },
      { nombre: 'Cualquier exponente', grados: [...P(6), ...S(1, 2)], generar: potencia(false) },
    ],
  },
  {
    id: 'raices',
    nombre: 'Raíz cuadrada',
    grupo: 'Álgebra y enteros',
    claves: /\b(raiz|raices|radicacion)\b/,
    niveles: [{ nombre: 'Exactas hasta 225', grados: [...P(6), ...S(1, 2)], generar: raiz }],
  },
  {
    id: 'ecuaciones',
    nombre: 'Ecuaciones',
    grupo: 'Álgebra y enteros',
    claves: /\b(ecuacion\w*|incognita\w*|valor desconocido|igualdad\w*)\b/,
    niveles: [
      { nombre: 'x + a = b', grados: P(5, 6), generar: ecuacion('suma') },
      { nombre: 'ax = b', grados: [...P(6), ...S(1)], generar: ecuacion('producto') },
      { nombre: 'ax + b = c', grados: S(1, 2, 3), generar: ecuacion('dos-pasos') },
    ],
  },
  {
    id: 'enteros',
    nombre: 'Números enteros',
    grupo: 'Álgebra y enteros',
    claves: /\b(numeros enteros|negativ\w*|enteros negativos)\b/,
    niveles: [
      { nombre: 'Sumar', grados: S(1), generar: enteros('sumar') },
      { nombre: 'Sumar y restar', grados: S(1, 2), generar: enteros('sumar-restar') },
      { nombre: 'Multiplicar y dividir', grados: S(1, 2), generar: enteros('multiplicar') },
    ],
  },
  {
    id: 'medidas',
    nombre: 'Medidas',
    grupo: 'Medidas',
    claves: /\b(medida\w*|longitud\w*|metros?|centimetros?|masa|kilogramos?|gramos?|capacidad|litros?|mililitros?|horas?|minutos?)\b/,
    niveles: [
      { nombre: 'Horas y minutos', grados: P(3, 4), generar: convertir('tiempo') },
      { nombre: 'Metros y centímetros', grados: P(3, 4), generar: convertir('longitud') },
      { nombre: 'Kilos y gramos', grados: P(4, 5), generar: convertir('masa') },
      { nombre: 'Litros y mililitros', grados: P(4, 5), generar: convertir('capacidad') },
    ],
  },
]

export const GRUPOS_HABILIDAD: GrupoHabilidad[] = ['Números', 'Operaciones', 'Fracciones', 'Decimales y porcentajes', 'Álgebra y enteros', 'Medidas']

export const habilidadPorId = (id: string) => HABILIDADES.find((h) => h.id === id)

const ORDEN_GRADOS = [...I(3, 4, 5), ...P(1, 2, 3, 4, 5, 6), ...S(1, 2, 3, 4, 5)]

/** Posición del grado de inicial a secundaria (−1 si no se conoce). */
export const indiceGrado = (gradoId: string) => ORDEN_GRADOS.indexOf(gradoId)

/** El nivel que se suele trabajar en ese grado: el más avanzado de los que lo incluyen, o el más cercano. */
export function nivelPara(h: Habilidad, gradoId: string): number {
  let ultimo = -1
  h.niveles.forEach((n, i) => {
    if (n.grados.includes(gradoId)) ultimo = i
  })
  if (ultimo >= 0) return ultimo
  const g = ORDEN_GRADOS.indexOf(gradoId)
  if (g < 0) return 0
  let mejor = 0
  let distancia = Infinity
  h.niveles.forEach((n, i) => {
    for (const x of n.grados) {
      const d = Math.abs(ORDEN_GRADOS.indexOf(x) - g)
      if (d < distancia || (d === distancia && i > mejor)) {
        distancia = d
        mejor = i
      }
    }
  })
  return mejor
}

/** Verifica un reto generado: útil en pruebas y para descartar casos raros antes de mostrarlos. */
export function retoValido(r: Reto) {
  if (!r.respuesta || r.distractores.length === 0) return false
  if (r.distractores.includes(r.respuesta)) return false
  const v = valor(r.respuesta)
  return v === null || r.distractores.every((d) => valor(d) !== v)
}
