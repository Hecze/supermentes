// Arma una hoja (examen, práctica o balotario) a partir de su configuración: qué tipo de pregunta de qué tema va en
// cada lugar y con qué semilla. La misma configuración da siempre la misma hoja (para volver a bajar la clave de la
// versión que se imprimió) y otra semilla da el mismo tipo de pregunta con otros números. Las preguntas fijadas no
// cambian nunca: ni con «Otra versión» ni en la Fila B.
import { crearAzar, nuevaSemilla } from '../juegos/motor/azar'
import type { Clase, ConfigHoja, Fuente, Generado, ItemHoja, TipoPregunta, Version } from './tipos'

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

export type Fuentes = Map<string, Fuente>

/** El último índice que cumple (Array.prototype.findLastIndex no está en el lib del proyecto). */
function ultimo<T>(lista: T[], cumple: (x: T) => boolean) {
  for (let i = lista.length - 1; i >= 0; i--) if (cumple(lista[i])) return i
  return -1
}

const INTENTOS = 24

/** Nivel de una pregunta: el suyo, o 2 si es de dibujos y números y 1 si es del banco. */
const nivelDe = (g: Generado, tipo: TipoPregunta) => g.nivel ?? (tipo.cambia === 'numeros' ? 2 : 1)

/** Una pregunta del tipo con esa semilla; si sale repetida (misma clave), prueba semillas derivadas. */
function generarSinRepetir(tipo: TipoPregunta, semilla: number, f: Fuente, usadas: Set<string>): Generado | null {
  for (let k = 0; k < INTENTOS; k++) {
    const g = tipo.generar({ azar: crearAzar(k === 0 ? semilla : mezclar(semilla, k)), banco: f.banco, problemas: f.problemas })
    if (g && !usadas.has(`${f.tema}|${g.clave}`)) return g
  }
  return null
}

const tipoDe = (fuentes: Fuentes, it: ItemHoja) => fuentes.get(it.tema)?.tipos.find((t) => t.id === it.tipo)

export function armarVersion(config: ConfigHoja, fuentes: Fuentes, fila: 0 | 1 = 0): Version {
  const usadas = new Set<string>()
  let items: Version['items'] = []
  for (const [indice, it] of config.items.entries()) {
    const f = fuentes.get(it.tema)
    const tipo = tipoDe(fuentes, it)
    if (!f || !tipo) continue
    // La Fila B usa otra semilla, salvo en las preguntas fijadas.
    const g = generarSinRepetir(tipo, fila === 0 || it.fija ? it.semilla : mezclar(it.semilla, 7919), f, usadas)
    if (!g) continue
    usadas.add(`${f.tema}|${g.clave}`)
    items.push({ ...g, nivel: nivelDe(g, tipo), tipo: tipo.id, tema: it.tema, indice, fija: !!it.fija })
  }
  // La práctica va de menos a más dentro de cada tema; el resto conserva su orden.
  if (config.clase === 'practica') {
    const orden = (t: string) => config.temas.indexOf(t)
    items = [...items].sort((a, b) => orden(a.tema) - orden(b.tema) || (a.nivel ?? 1) - (b.nivel ?? 1) || a.indice - b.indice)
  }
  const semilla = fila === 0 ? config.semilla : mezclar(config.semilla, 7919)
  const filas = config.clase === 'examen' && config.filas
  return { fila: filas ? (fila === 0 ? 'Fila A' : 'Fila B') : '', codigo: codigoDe(semilla), items }
}

/** Las versiones a imprimir: una, o la Fila A y la Fila B (solo en el examen). */
export function armarVersiones(config: ConfigHoja, fuentes: Fuentes): Version[] {
  return config.clase === 'examen' && config.filas ? [armarVersion(config, fuentes, 0), armarVersion(config, fuentes, 1)] : [armarVersion(config, fuentes, 0)]
}

/** Cuántas preguntas de cada tipo lleva un tema en cada clase de hoja, si el docente no elige nada. */
function cantidades(f: Fuente, clase: Clase, nTemas: number): Map<string, number> {
  const numeros = f.tipos.filter((t) => t.cambia === 'numeros')
  const hay = (id: string) => f.tipos.some((t) => t.id === id)
  const n = new Map<string, number>()
  const poner = (id: string, k: number) => k > 0 && hay(id) && n.set(id, (n.get(id) ?? 0) + k)
  // Reparte k preguntas entre los tipos con dibujos, alternándolos.
  const conDibujos = (k: number) => {
    for (let i = 0; i < k && numeros.length; i++) poner(numeros[i % numeros.length].id, 1)
  }
  const problemas = hay('problemas')
  const varios = nTemas > 1
  if (clase === 'examen') {
    if (varios) {
      conDibujos(numeros.length ? 2 : 0)
      poner('problemas', 1)
      poner('banco-opciones', numeros.length || problemas ? 1 : 2)
      if (!numeros.length) poner('banco-detective', 1)
    } else if (numeros.length) {
      conDibujos(4)
      poner('problemas', 2)
      poner('banco-opciones', problemas ? 2 : 3)
      poner('banco-unir', 1)
    } else {
      poner('problemas', 2)
      poner('banco-opciones', 4)
      poner('banco-detective', 2)
      poner('banco-unir', 1)
      poner('banco-completar', 1)
    }
  } else if (clase === 'practica') {
    if (varios) {
      conDibujos(numeros.length ? 2 : 0)
      poner('problemas', 3)
      poner('banco-opciones', problemas ? 0 : 2)
    } else {
      conDibujos(numeros.length ? (problemas ? 4 : 6) : 0)
      poner('problemas', 6)
      poner('banco-opciones', problemas ? 2 : 4)
      if (!numeros.length) poner('banco-detective', 2)
    }
  } else {
    // Balotario: unas 30 preguntas entre todos los temas; se resuelven en el cuaderno.
    const k = Math.max(6, Math.round(30 / nTemas))
    const nProblemas = problemas ? Math.min(f.problemas?.problemas.length ?? 0, Math.round(k * 0.4)) : 0
    const nOpciones = Math.min(f.banco?.preguntas.length ?? 0, Math.round(k * 0.25))
    poner('problemas', nProblemas)
    poner('banco-opciones', nOpciones)
    conDibujos(numeros.length ? k - nProblemas - nOpciones : 0)
    if (!numeros.length) poner('banco-detective', Math.min(2, (f.banco?.preguntas.length ?? 0) - nOpciones))
  }
  return n
}

/** Orden dentro de un tema: dibujos y números alternando los tipos, luego problemas y luego lo del banco. */
const ORDEN_DEL_TEMA = ['problemas', 'banco-opciones', 'banco-detective', 'banco-unir', 'banco-completar']

function ordenar(f: Fuente, n: Map<string, number>): string[] {
  const numeros = f.tipos.filter((t) => t.cambia === 'numeros')
  const quedan = new Map(n)
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
  for (const id of ORDEN_DEL_TEMA) for (let k = 0; k < (n.get(id) ?? 0); k++) orden.push(id)
  return orden
}

/** Una hoja nueva de esta clase con los temas dados (en orden). Cada pregunta lleva su propia semilla. */
export function hojaNueva(clase: Clase, temas: Fuente[], filas = false, semilla = nuevaSemilla()): ConfigHoja {
  const items: ItemHoja[] = []
  for (const f of temas) for (const tipo of ordenar(f, cantidades(f, clase, temas.length))) items.push({ tipo, tema: f.tema, semilla: mezclar(semilla, items.length + 1) })
  return { clase, temas: temas.map((f) => f.tema), areas: Object.fromEntries(temas.map((f) => [f.tema, f.areaId])), semilla, items, filas }
}

/** Otra versión: los mismos tipos en el mismo orden, con otras semillas; las fijadas no cambian. */
export function otraVersion(config: ConfigHoja, semilla = nuevaSemilla()): ConfigHoja {
  return { ...config, semilla, items: config.items.map((it, i) => (it.fija ? it : { ...it, semilla: mezclar(semilla, i + 1) })) }
}

/** Cambia una sola pregunta (`i`: su lugar en `config.items`) por otra del mismo tipo que no se repita con las demás. */
export function cambiarItem(config: ConfigHoja, i: number, fuentes: Fuentes): ConfigHoja {
  const it = config.items[i]
  const f = fuentes.get(it?.tema)
  const tipo = it && tipoDe(fuentes, it)
  if (!f || !tipo) return config
  const actual = armarVersion(config, fuentes)
  const otras = new Set(actual.items.filter((x) => x.indice !== i).map((x) => `${x.tema}|${x.clave}`))
  const antes = actual.items.find((x) => x.indice === i)?.clave
  for (let k = 0; k < INTENTOS; k++) {
    const semilla = nuevaSemilla()
    const g = tipo.generar({ azar: crearAzar(semilla), banco: f.banco, problemas: f.problemas })
    if (g && g.clave !== antes && !otras.has(`${f.tema}|${g.clave}`)) {
      return { ...config, items: config.items.map((x, j) => (j === i ? { ...x, semilla, fija: false } : x)) }
    }
  }
  return config
}

/** Fija o suelta una pregunta. */
export const fijarItem = (config: ConfigHoja, i: number): ConfigHoja => ({
  ...config,
  items: config.items.map((x, j) => (j === i ? { ...x, fija: !x.fija } : x)),
})

/** Cuántas preguntas de cada tipo y tema tiene la hoja (clave "tema|tipo"). */
export function contar(config: ConfigHoja) {
  const n = new Map<string, number>()
  for (const it of config.items) n.set(`${it.tema}|${it.tipo}`, (n.get(`${it.tema}|${it.tipo}`) ?? 0) + 1)
  return n
}

/** Agrega o quita una pregunta de un tipo de un tema; las demás conservan sus números. */
export function cambiarCantidad(config: ConfigHoja, tema: string, tipo: string, delta: 1 | -1): ConfigHoja {
  const es = (it: ItemHoja) => it.tema === tema && it.tipo === tipo
  if (delta < 0) {
    // Se quita la última que no esté fijada.
    const i = ultimo(config.items, (it) => es(it) && !it.fija)
    return i < 0 ? config : { ...config, items: config.items.filter((_, k) => k !== i) }
  }
  const nuevo: ItemHoja = { tipo, tema, semilla: nuevaSemilla() }
  // Va después de la última de su tipo y tema; si no había, al final de su tema.
  const ultima = ultimo(config.items, es)
  const donde = ultima >= 0 ? ultima + 1 : ultimo(config.items, (it) => it.tema === tema) + 1 || config.items.length
  return { ...config, items: [...config.items.slice(0, donde), nuevo, ...config.items.slice(donde)] }
}

/** Suma un tema a la hoja: se rehace el reparto entre todos los temas, conservando las preguntas fijadas. */
export function agregarTema(config: ConfigHoja, f: Fuente, fuentes: Fuentes): ConfigHoja {
  if (config.temas.includes(f.tema)) return config
  const temas = [...config.temas.map((t) => fuentes.get(t)).filter((x): x is Fuente => !!x), f]
  return conFijas(hojaNueva(config.clase, temas, config.filas), config.items)
}

/** Quita un tema (el primero, el tema abierto, no se quita). */
export function quitarTema(config: ConfigHoja, tema: string, fuentes: Fuentes): ConfigHoja {
  if (config.temas[0] === tema || !config.temas.includes(tema)) return config
  const temas = config.temas.filter((t) => t !== tema).map((t) => fuentes.get(t)).filter((x): x is Fuente => !!x)
  return conFijas(hojaNueva(config.clase, temas, config.filas), config.items.filter((it) => it.tema !== tema))
}

/** Las fijadas de antes se quedan, en el lugar de su tema. */
function conFijas(nueva: ConfigHoja, antes: ItemHoja[]): ConfigHoja {
  const fijas = antes.filter((it) => it.fija && nueva.temas.includes(it.tema))
  const items = [...fijas, ...nueva.items].sort((a, b) => nueva.temas.indexOf(a.tema) - nueva.temas.indexOf(b.tema))
  return { ...nueva, items }
}

/**
 * El examen que sale del balotario: las preguntas fijadas pasan igualitas; el resto, hasta completar, sale de otras
 * preguntas del balotario, parecidas (el mismo tipo con otros números; las del banco van igualitas, porque no tienen
 * números que cambiar).
 */
export function examenDesdeBalotario(balotario: ConfigHoja, fuentes: Fuentes, cuantas = 10, semilla = nuevaSemilla()): ConfigHoja {
  const fijas = balotario.items.filter((it) => it.fija).map((it) => ({ ...it }))
  const resto = balotario.items.filter((it) => !it.fija)
  // Se reparten las que faltan entre los temas, en el orden del balotario.
  const faltan = Math.max(0, cuantas - fijas.length)
  const azar = crearAzar(semilla)
  const porTema = balotario.temas.map((t) => resto.filter((it) => it.tema === t).sort(() => azar() - 0.5))
  const elegidas: ItemHoja[] = []
  for (let r = 0; elegidas.length < faltan && porTema.some((l) => l.length > r); r++) {
    for (const l of porTema) if (l[r] && elegidas.length < faltan) elegidas.push(l[r])
  }
  const parecidas = elegidas.map((it, k) => {
    const tipo = tipoDe(fuentes, it)
    return tipo?.cambia === 'numeros' ? { tipo: it.tipo, tema: it.tema, semilla: mezclar(semilla, k + 1) } : { tipo: it.tipo, tema: it.tema, semilla: it.semilla }
  })
  // En el orden del balotario: por tema.
  const items = [...fijas, ...parecidas].sort((a, b) => balotario.temas.indexOf(a.tema) - balotario.temas.indexOf(b.tema))
  return { clase: 'examen', temas: balotario.temas, areas: balotario.areas, semilla, items, filas: false }
}

/** Las preguntas de una versión por tema, en el orden de la hoja (así se numeran en la pantalla, el PDF y la clave). */
export const porTema = (v: Version, temas: string[]) =>
  temas.map((tema) => ({ tema, items: v.items.filter((it) => it.tema === tema) })).filter((g) => g.items.length)
