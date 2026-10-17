// Registro de juegos. Para sumar un juego nuevo: su componente (PropsJuego), su miniatura y una entrada aquí.
// `preparar` decide con los datos si el juego se puede jugar con un contenido; así el docente solo ve los compatibles.
import { lazy } from 'react'
import { normalizar } from '../lib/crucigrama'
import { conRetos, cortos, largo } from './contenido'
import { MiniCarrera, MiniGlobos, MiniMemoria, MiniPalabra, MiniPupiletras, MiniRapido, MiniRuleta, MiniSoga, MiniTopo } from './miniaturas'
import type { Contenido, DefinicionJuego, JuegoId, Ritmo } from './tipos'

/** Parejas que caben en una carta: textos cortos o un dibujo. */
function paresCortos(c: Contenido): Contenido | null {
  const cabe = (l: { texto: string; visual?: unknown }) => !!l.visual || (largo(l.texto) > 0 && largo(l.texto) <= 16)
  const pares = c.pares.filter((p) => cabe(p.a) && cabe(p.b))
  return pares.length >= 4 ? { ...c, pares } : null
}

/** Palabras de una sola pieza, de 3 a 12 letras: para adivinar letra por letra o buscar en el pupiletras. */
const palabrasSueltas =
  (minimo: number) =>
  (c: Contenido): Contenido | null => {
    const palabras = c.palabras.filter((p) => !/\s/.test(p.palabra.trim()) && normalizar(p.palabra).length >= 3 && normalizar(p.palabra).length <= 12)
    return palabras.length >= minimo ? { ...c, palabras } : null
  }

export const JUEGOS: DefinicionJuego[] = [
  {
    id: 'globos',
    nombre: 'Globos',
    lema: 'Revientan el globo con la respuesta antes de que se escape.',
    instrucciones: 'Lee la pregunta y toca el globo con la respuesta correcta. Tienes tres vidas.',
    donde: ['celular', 'clase'],
    color: '#2fb2ff',
    inspirado: 'Balloon Pop (Wordwall, Arcademic)',
    preparar: (c) => conRetos(c, cortos(12, 3), 4),
    Miniatura: MiniGlobos,
    Componente: lazy(() => import('./globos/Globos')),
  },
  {
    id: 'rapido',
    nombre: 'Botones rápidos',
    lema: '¿Cuántas aciertan en un minuto? Ideal para tablas y cálculo mental.',
    instrucciones: 'Tienes un minuto. Toca el botón con la respuesta lo más rápido que puedas.',
    donde: ['celular', 'clase'],
    color: '#7b5cff',
    inspirado: 'Hit the Button (Topmarks)',
    preparar: (c) => conRetos(c, cortos(14, 3), 4),
    Miniatura: MiniRapido,
    Componente: lazy(() => import('./rapido/BotonesRapidos')),
  },
  {
    id: 'soga',
    nombre: 'Tira y afloja',
    lema: 'Dos equipos en la pizarra: cada acierto jala la soga hacia su lado.',
    instrucciones: 'Rojo a la izquierda, azul a la derecha. Cada respuesta correcta jala la soga. Un error congela al equipo un momento.',
    donde: ['clase'],
    color: '#ff5d73',
    inspirado: 'Tug of War (Arcademic Skill Builders)',
    preparar: (c) => conRetos(c, cortos(20, 2), 6),
    Miniatura: MiniSoga,
    Componente: lazy(() => import('./soga/Soga')),
  },
  {
    id: 'memoria',
    nombre: 'Memoria',
    lema: 'Voltean cartas de a dos hasta encontrar todas las parejas.',
    instrucciones: 'Voltea dos cartas. Si van juntas, se quedan a la vista. ¡Encuentra todas las parejas con pocos intentos!',
    donde: ['celular', 'clase'],
    color: '#21b35f',
    inspirado: 'Matching pairs (Wordwall)',
    preparar: paresCortos,
    Miniatura: MiniMemoria,
    Componente: lazy(() => import('./memoria/Memoria')),
  },
  {
    id: 'carrera',
    nombre: 'Carrera de llamas',
    lema: 'Sin reloj: si aciertan, su llama avanza; si fallan, avanza la rival.',
    instrucciones: 'Lee con calma y elige la respuesta. Si aciertas, tu llama avanza; si fallas, avanza la rival.',
    donde: ['celular', 'clase'],
    color: '#ff9636',
    inspirado: 'Math Racing',
    preparar: (c) => conRetos(c, (r) => (largo(r.pregunta) <= 160 ? cortos(60, 2)(r) : null), 3),
    Miniatura: MiniCarrera,
    Componente: lazy(() => import('./carrera/Carrera')),
  },
  {
    id: 'palabra',
    nombre: 'Adivina la palabra',
    lema: 'Descubren la palabra letra por letra antes de que se revienten los globos.',
    instrucciones: 'Lee la pista y elige letras. Cada letra que no está revienta un globo de la llamita.',
    donde: ['celular', 'clase'],
    color: '#ff4f9a',
    inspirado: 'Ahorcado, sin horca',
    preparar: palabrasSueltas(1),
    Miniatura: MiniPalabra,
    Componente: lazy(() => import('./palabra/AdivinaPalabra')),
  },
  {
    id: 'pupiletras',
    nombre: 'Pupiletras',
    lema: 'Encuentran las palabras del tema escondidas en la sopa de letras.',
    instrucciones: 'Arrastra el dedo de la primera a la última letra de cada palabra, o toca una y luego la otra.',
    donde: ['celular', 'clase'],
    color: '#17998f',
    inspirado: 'Pupiletras (sopa de letras)',
    preparar: palabrasSueltas(4),
    Miniatura: MiniPupiletras,
    Componente: lazy(() => import('./pupiletras/Pupiletras')),
  },
  {
    id: 'topo',
    nombre: 'Atrapa al cuy',
    lema: 'Los cuyes se asoman con carteles: atrapan al que tiene la respuesta.',
    instrucciones: 'Lee la pregunta y toca al cuy que tiene la respuesta correcta. ¡Rápido, que se esconden!',
    donde: ['celular', 'clase'],
    color: '#45b03a',
    inspirado: 'Whack-a-mole (Wordwall)',
    preparar: (c) => conRetos(c, cortos(12, 3), 4),
    Miniatura: MiniTopo,
    Componente: lazy(() => import('./topo/Topo')),
  },
  {
    id: 'ruleta',
    nombre: 'Ruleta de preguntas',
    lema: 'Giran la ruleta en el proyector, sale una pregunta y toda la clase responde.',
    instrucciones: 'Gira la ruleta. Lean la pregunta en voz alta, que la clase piense y luego toca «Ver respuesta».',
    donde: ['clase'],
    color: '#c2185b',
    inspirado: 'Ruleta aleatoria (Wordwall)',
    preparar: (c) => conRetos(c, (r) => (largo(r.pregunta) <= 200 ? cortos(60, 2)(r) : null), 4),
    Miniatura: MiniRuleta,
    Componente: lazy(() => import('./ruleta/Ruleta')),
  },
]

export const juegoPorId = (id: JuegoId) => JUEGOS.find((j) => j.id === id)

/** Juegos que se pueden jugar con este contenido, cada uno con el contenido ya preparado para él. */
export function juegosCompatibles(c: Contenido) {
  return JUEGOS.flatMap((def) => {
    const preparado = def.preparar(c)
    return preparado ? [{ def, contenido: preparado }] : []
  })
}

/** Más lento para los más chicos. */
export function ritmoDe(gradoId: string): Ritmo {
  if (/^inicial|^primaria-[12]$/.test(gradoId)) return 1
  if (/^primaria-[34]$/.test(gradoId)) return 2
  return 3
}
