// Tipos de pregunta que salen del banco del tema (banco/<grado>/<área>.json): sirven para todos los temas y cursos
// del grado. No cambian números: en cada versión se eligen otras preguntas, otras parejas y otro orden de las
// alternativas. Su cita es la del tema en el banco, ya verificada letra por letra.
import { barajar, elegir } from '../juegos/motor/azar'
import { normalizar } from '../curriculo/buscar'
import type { TipoPregunta } from './tipos'
import { alternativas, nombre } from './util'

export const opcionesDelBanco: TipoPregunta = {
  id: 'banco-opciones',
  nombre: 'Marca la respuesta correcta',
  queHacen: 'Leen cada pregunta del tema y marcan la alternativa correcta; las otras son los errores más comunes.',
  cambia: 'orden',
  generar({ azar, banco }) {
    if (!banco?.preguntas.length) return null
    const i = Math.floor(azar() * banco.preguntas.length)
    const p = banco.preguntas[i]
    const alt = alternativas(azar, p.respuesta, barajar(azar, p.distractores), 4)
    if (!alt) return null
    return { forma: 'opciones', clave: `pregunta:${i}`, enunciado: p.pregunta, ...alt }
  },
}

export const detectiveDelBanco: TipoPregunta = {
  id: 'banco-detective',
  nombre: '¿Tiene razón?',
  queHacen: 'Revisan la respuesta de un compañero: dicen si tiene razón y, si no, escriben la correcta.',
  cambia: 'orden',
  generar({ azar, banco }) {
    if (!banco?.preguntas.length) return null
    const i = Math.floor(azar() * banco.preguntas.length)
    const p = banco.preguntas[i]
    const quien = nombre(azar)
    const acierta = azar() < 0.4
    const dijo = acierta ? p.respuesta : p.distractores[0]
    if (!dijo) return null
    return {
      forma: 'opciones',
      clave: `pregunta:${i}`,
      enunciado: `${quien} resolvió esta pregunta: «${p.pregunta}»`,
      pregunta: `${quien} respondió: «${dijo}». ¿Tiene razón?`,
      alternativas: ['Sí, tiene razón.', 'No. La respuesta correcta es: ____________'],
      correcta: acierta ? 0 : 1,
      nota: acierta ? undefined : `No. Es «${p.respuesta}».`,
    }
  },
}

export const unirDelBanco: TipoPregunta = {
  id: 'banco-unir',
  nombre: 'Une con flechas',
  queHacen: 'Unen con una flecha cada cosa con la que le corresponde.',
  cambia: 'orden',
  generar({ azar, banco }) {
    const pares = banco?.pares ?? []
    if (pares.length < 3) return null
    const elegidos = barajar(azar, pares.map((_, i) => i)).slice(0, Math.min(4, pares.length))
    const derecha = barajar(azar, elegidos)
    // Que no quede todo en línea recta: si la derecha salió en el mismo orden, se rota.
    if (derecha.every((d, k) => d === elegidos[k])) derecha.push(derecha.shift()!)
    return {
      forma: 'unir',
      clave: `unir:${[...elegidos].sort().join(',')}`,
      enunciado: 'Une con una flecha cada uno con su pareja.',
      izquierda: elegidos.map((i) => pares[i].a),
      derecha: derecha.map((i) => pares[i].b),
      solucion: elegidos.map((i) => derecha.indexOf(i)),
    }
  },
}

export const completarDelBanco: TipoPregunta = {
  id: 'banco-completar',
  nombre: 'Completa con la palabra',
  queHacen: 'Leen cada pista y escriben la palabra del tema que le corresponde, eligiéndola del recuadro.',
  cambia: 'orden',
  generar({ azar, banco }) {
    // Una pista que ya dice la palabra no sirve.
    const utiles = (banco?.palabras ?? []).filter((p) => !normalizar(p.pista).includes(normalizar(p.palabra)))
    if (utiles.length < 3) return null
    const elegidas = barajar(azar, utiles).slice(0, 4)
    const resto = utiles.filter((p) => !elegidas.includes(p))
    // Una palabra de más en el recuadro, para que la última no salga por descarte.
    const extra = resto.length ? [elegir(azar, resto).palabra] : []
    return {
      forma: 'completar',
      clave: `completar:${elegidas.map((p) => p.palabra).sort().join(',')}`,
      enunciado: 'Escribe la palabra del recuadro que corresponde a cada pista.',
      palabras: barajar(azar, [...elegidas.map((p) => p.palabra), ...extra]),
      frases: elegidas.map((p) => `${p.pista} ____`),
      respuestas: elegidas.map((p) => p.palabra),
    }
  },
}

export const TIPOS_DEL_BANCO = [opcionesDelBanco, detectiveDelBanco, unirDelBanco, completarDelBanco]
