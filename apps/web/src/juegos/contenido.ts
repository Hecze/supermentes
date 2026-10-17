// De dónde sale lo que se juega: una habilidad de cálculo (generada, gratis) o el tema del docente
// (su vocabulario y, si se crearon, las preguntas y parejas de la IA). Todo termina en un Contenido.
import type { Ficha, Juego } from '../api'
import { normalizar } from '../lib/crucigrama'
import { barajar, bolsa, crearAzar } from './motor/azar'
import { habilidadPorId } from './matematica/habilidades'
import type { Practica } from './matematica/deducir'
import type { Contenido, Par, Palabra, Reto, Visual } from './tipos'

const claveVisual = (v?: Visual) => (!v ? '' : v.tipo === 'fraccion' ? v.partes.join('/') : `${v.figura}${v.cantidad}`)
const claveReto = (r: Reto) => `${r.consigna ?? ''}|${r.pregunta}|${claveVisual(r.visual)}`

/** "7 × 8 = ?" se muestra como "7 × 8" en una carta. */
export const sinIgual = (pregunta: string) => pregunta.replace(/\s*=\s*\?$/, '')

export function nombrePractica(p: Practica) {
  const h = habilidadPorId(p.habilidad)
  if (!h) return ''
  const n = h.niveles[Math.min(p.nivel, h.niveles.length - 1)]
  return h.niveles.length > 1 ? `${h.nombre} · ${n.nombre}` : h.nombre
}

export function contenidoMatematica(p: Practica, semilla = 1): Contenido | null {
  const h = habilidadPorId(p.habilidad)
  if (!h) return null
  const nivel = h.niveles[Math.min(Math.max(p.nivel, 0), h.niveles.length - 1)]
  const azar = crearAzar(semilla)

  // Una muestra fija para los juegos que necesitan una lista (Memoria) y para revisar el nivel.
  const retos: Reto[] = []
  const vistos = new Set<string>()
  for (let i = 0; i < 80 && retos.length < 16; i++) {
    const r = nivel.generar(azar)
    if (vistos.has(claveReto(r))) continue
    vistos.add(claveReto(r))
    retos.push(r)
  }

  // Parejas pregunta ↔ respuesta sin respuestas repetidas, para que cada carta tenga una sola pareja.
  const pares: Par[] = []
  const respuestas = new Set<string>()
  for (const r of retos) {
    if (respuestas.has(r.respuesta) || (!r.pregunta && !r.visual)) continue
    respuestas.add(r.respuesta)
    pares.push({ a: { texto: sinIgual(r.pregunta), visual: r.visual }, b: { texto: r.respuesta } })
  }

  return { titulo: nombrePractica(p), retos, pares, palabras: [], generar: nivel.generar }
}

/** Palabras del tema: las del juego creado y las de la ficha, sin repetir. */
function palabrasDelTema(ficha: Ficha, juego?: Juego): Palabra[] {
  const todas = [...(juego?.palabras ?? []), ...ficha.vocabulario.map((v) => ({ palabra: v.palabra, pista: v.definicion }))]
  const vistas = new Set<string>()
  return todas.filter((p) => {
    const k = normalizar(p.palabra)
    if (!k || vistas.has(k)) return false
    vistas.add(k)
    return true
  })
}

export function contenidoDelTema(ficha: Ficha, juego?: Juego): Contenido {
  const palabras = palabrasDelTema(ficha, juego)
  const pares: Par[] = (juego?.pares ?? []).map((p) => ({
    a: { texto: p.a.texto, visual: p.a.fraccion && { tipo: 'fraccion', partes: p.a.fraccion } },
    b: { texto: p.b.texto, visual: p.b.fraccion && { tipo: 'fraccion', partes: p.b.fraccion } },
  }))

  const retos: Reto[] = [
    ...(juego?.preguntas ?? []).map((p) => ({
      pregunta: p.pregunta,
      respuesta: p.opciones[p.correcta],
      distractores: p.opciones.filter((_, i) => i !== p.correcta),
    })),
    // Cada pareja también es un reto: se muestra un lado y se busca el otro entre los demás.
    ...pares.map((p, i) => ({
      consigna: 'Busca la pareja',
      pregunta: p.b.visual ? '' : p.b.texto,
      visual: p.b.visual,
      respuesta: p.a.texto,
      distractores: pares.filter((_, j) => j !== i).map((x) => x.a.texto),
    })),
    // Y cada palabra clave: se lee la pista y se busca la palabra.
    ...palabras.map((p, i) => ({
      consigna: '¿Qué palabra es?',
      pregunta: p.pista,
      respuesta: p.palabra,
      distractores: palabras.filter((_, j) => j !== i).map((x) => x.palabra),
    })),
  ].filter((r) => r.respuesta && r.distractores.length > 0)

  return { titulo: ficha.titulo, retos, pares, palabras }
}

/** Respuesta correcta y hasta n − 1 distractores, en orden al azar. */
export function opcionesDe(reto: Reto, n: number, azar: () => number) {
  return barajar(azar, [reto.respuesta, ...reto.distractores.slice(0, Math.max(1, n - 1))])
}

/** Fuente de retos para una partida: sin fin si se generan, o la lista barajada que vuelve a empezar. */
export function fuenteDeRetos(c: Contenido, azar: () => number): () => Reto {
  if (!c.generar) return bolsa(azar, c.retos)
  const generar = c.generar
  const recientes: string[] = []
  return () => {
    let r = generar(azar)
    for (let i = 0; i < 12 && recientes.includes(claveReto(r)); i++) r = generar(azar)
    recientes.push(claveReto(r))
    if (recientes.length > 8) recientes.shift()
    return r
  }
}

/**
 * Deja solo los retos que caben en un juego, ya recortados (por ejemplo, sin distractores largos).
 * Si el contenido se genera, el generador también se ajusta. Devuelve null si quedan menos de `minimo`.
 */
export function conRetos(c: Contenido, ajustar: (r: Reto) => Reto | null, minimo: number): Contenido | null {
  const retos = c.retos.map(ajustar).filter((r): r is Reto => r !== null)
  if (c.generar) {
    if (retos.length < Math.min(minimo, 3)) return null
    const generar = c.generar
    return {
      ...c,
      retos,
      generar: (azar) => {
        for (let i = 0; i < 30; i++) {
          const r = ajustar(generar(azar))
          if (r) return r
        }
        return retos[Math.floor(azar() * retos.length)]
      },
    }
  }
  return retos.length >= minimo ? { ...c, retos } : null
}

/** Retos con respuesta y distractores de hasta `max` caracteres, con al menos `opciones` opciones en total. */
export const cortos =
  (max: number, opciones = 2) =>
  (r: Reto): Reto | null => {
    if (largo(r.respuesta) > max) return null
    const distractores = r.distractores.filter((d) => largo(d) <= max)
    return distractores.length + 1 >= opciones ? { ...r, distractores } : null
  }

/** Largo visible de un texto (los emojis cuentan como uno). */
export const largo = (t: string) => [...t].length
