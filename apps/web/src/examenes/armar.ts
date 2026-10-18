// Arma un examen a partir de su configuración: qué tipo de pregunta va en cada lugar y con qué semilla. La misma
// configuración da siempre el mismo examen (para volver a bajar las respuestas de la versión que se imprimió) y
// otra semilla da el mismo tipo de pregunta con otros números.
import type { TemaBanco } from '../banco/banco'
import { crearAzar, nuevaSemilla } from '../juegos/motor/azar'
import type { ConfigExamen, Generado, TipoPregunta, Version } from './tipos'

/** Mezcla dos enteros en uno nuevo (para derivar semillas: la de la Fila B, la del reintento k). */
export function mezclar(a: number, b: number) {
  let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x632be5ab, 0xc2b2ae35)
  h ^= h >>> 15
  h = Math.imul(h, 0x2c1b3c6d)
  h ^= h >>> 12
  return (h >>> 1) % 2 ** 31
}

const SIN_CONFUSION = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

/** Código corto y fácil de leer de una versión (sin 0, O, 1 ni I): "K7Q2". */
export function codigoDe(semilla: number) {
  let n = semilla >>> 0
  let c = ''
  for (let i = 0; i < 4; i++) {
    c += SIN_CONFUSION[n % SIN_CONFUSION.length]
    n = Math.floor(n / SIN_CONFUSION.length)
  }
  return c
}

const INTENTOS = 24

/** Una pregunta del tipo con esa semilla; si sale repetida (misma clave), prueba semillas derivadas. */
function generarSinRepetir(tipo: TipoPregunta, semilla: number, banco: TemaBanco | null, usadas: Set<string>): Generado | null {
  for (let k = 0; k < INTENTOS; k++) {
    const g = tipo.generar({ azar: crearAzar(k === 0 ? semilla : mezclar(semilla, k)), banco })
    if (g && !usadas.has(g.clave)) return g
  }
  return null
}

export function armarVersion(config: ConfigExamen, tipos: Map<string, TipoPregunta>, banco: TemaBanco | null, fila: 0 | 1 = 0): Version {
  const usadas = new Set<string>()
  const items: Version['items'] = []
  for (const it of config.items) {
    const tipo = tipos.get(it.tipo)
    if (!tipo) continue
    const g = generarSinRepetir(tipo, fila === 0 ? it.semilla : mezclar(it.semilla, 7919), banco, usadas)
    if (!g) continue
    usadas.add(g.clave)
    items.push({ ...g, tipo: tipo.id })
  }
  const semilla = fila === 0 ? config.semilla : mezclar(config.semilla, 7919)
  return { fila: config.filas ? (fila === 0 ? 'Fila A' : 'Fila B') : '', codigo: codigoDe(semilla), items }
}

/** Las versiones a imprimir: una, o la Fila A y la Fila B. */
export function armarVersiones(config: ConfigExamen, tipos: Map<string, TipoPregunta>, banco: TemaBanco | null): Version[] {
  return config.filas ? [armarVersion(config, tipos, banco, 0), armarVersion(config, tipos, banco, 1)] : [armarVersion(config, tipos, banco, 0)]
}

/** Cuántas preguntas de cada tipo lleva el examen del tema si el docente no elige nada. */
export function cantidadesPorDefecto(tipos: TipoPregunta[]): Map<string, number> {
  const numeros = tipos.filter((t) => t.cambia === 'numeros')
  const delTema = tipos.filter((t) => t.cambia === 'orden')
  const n = new Map<string, number>()
  // Con dibujos y números: hasta 6 preguntas, repartidas entre los tipos del tema.
  const total = numeros.length >= 3 ? 6 : numeros.length * 2
  for (let i = 0; i < total; i++) n.set(numeros[i % numeros.length].id, (n.get(numeros[i % numeros.length].id) ?? 0) + 1)
  const del = (id: string, k: number) => delTema.some((t) => t.id === id) && n.set(id, k)
  if (numeros.length) {
    del('banco-opciones', 2)
    del('banco-unir', 1)
  } else {
    del('banco-opciones', 4)
    del('banco-detective', 2)
    del('banco-unir', 1)
    del('banco-completar', 1)
  }
  return n
}

/**
 * El orden de las preguntas: primero las de dibujos y números, alternando los tipos para que no se repita el mismo
 * seguido; después las del tema, agrupadas (todas las de marcar juntas, luego unir, luego completar).
 */
export function ordenarItems(tipos: TipoPregunta[], cantidades: Map<string, number>): string[] {
  const numeros = tipos.filter((t) => t.cambia === 'numeros')
  const resto = tipos.filter((t) => t.cambia === 'orden')
  const quedan = new Map(cantidades)
  const orden: string[] = []
  for (let vuelta = true; vuelta; ) {
    vuelta = false
    for (const t of numeros) {
      const k = quedan.get(t.id) ?? 0
      if (k > 0) {
        orden.push(t.id)
        quedan.set(t.id, k - 1)
        vuelta = true
      }
    }
  }
  for (const t of resto) for (let k = 0; k < (cantidades.get(t.id) ?? 0); k++) orden.push(t.id)
  return orden
}

/** Un examen nuevo con estos tipos y cantidades. Cada pregunta lleva su propia semilla. */
export function nuevoExamen(tipos: TipoPregunta[], cantidades: Map<string, number>, filas = false, semilla = nuevaSemilla()): ConfigExamen {
  return {
    semilla,
    filas,
    items: ordenarItems(tipos, cantidades).map((tipo, i) => ({ tipo, semilla: mezclar(semilla, i + 1) })),
  }
}

/** Otra versión: los mismos tipos en el mismo orden, con otras semillas. */
export function otraVersion(config: ConfigExamen, semilla = nuevaSemilla()): ConfigExamen {
  return { ...config, semilla, items: config.items.map((it, i) => ({ tipo: it.tipo, semilla: mezclar(semilla, i + 1) })) }
}

/** Cambia una sola pregunta por otra del mismo tipo que no se repita con las demás. */
export function cambiarItem(config: ConfigExamen, i: number, tipos: Map<string, TipoPregunta>, banco: TemaBanco | null): ConfigExamen {
  const actual = armarVersion(config, tipos, banco)
  const otras = new Set(actual.items.filter((_, k) => k !== i).map((x) => x.clave))
  const antes = actual.items[i]?.clave
  const tipo = tipos.get(config.items[i].tipo)
  if (!tipo) return config
  for (let k = 0; k < INTENTOS; k++) {
    const semilla = nuevaSemilla()
    const g = tipo.generar({ azar: crearAzar(semilla), banco })
    if (g && g.clave !== antes && !otras.has(g.clave)) {
      return { ...config, items: config.items.map((it, j) => (j === i ? { ...it, semilla } : it)) }
    }
  }
  return config
}

/** Cuántas preguntas de cada tipo tiene el examen. */
export function contar(config: ConfigExamen) {
  const n = new Map<string, number>()
  for (const it of config.items) n.set(it.tipo, (n.get(it.tipo) ?? 0) + 1)
  return n
}

/** Agrega o quita una pregunta de un tipo; las demás conservan sus números. */
export function cambiarCantidad(config: ConfigExamen, tipo: string, delta: 1 | -1, tipos: TipoPregunta[]): ConfigExamen {
  if (delta < 0) {
    const i = config.items.map((it) => it.tipo).lastIndexOf(tipo)
    return i < 0 ? config : { ...config, items: config.items.filter((_, k) => k !== i) }
  }
  const nuevo = { tipo, semilla: nuevaSemilla() }
  // Va después de la última de su tipo; si no había, en el lugar de su grupo.
  const ultima = config.items.map((it) => it.tipo).lastIndexOf(tipo)
  if (ultima >= 0) return { ...config, items: [...config.items.slice(0, ultima + 1), nuevo, ...config.items.slice(ultima + 1)] }
  const esNumeros = tipos.find((t) => t.id === tipo)?.cambia === 'numeros'
  const primeraDelTema = config.items.findIndex((it) => tipos.find((t) => t.id === it.tipo)?.cambia === 'orden')
  const donde = esNumeros && primeraDelTema >= 0 ? primeraDelTema : config.items.length
  return { ...config, items: [...config.items.slice(0, donde), nuevo, ...config.items.slice(donde)] }
}
