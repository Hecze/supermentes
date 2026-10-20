// Registro de juegos. Para sumar un juego nuevo: su componente (PropsJuego), su miniatura y una entrada aquí.
// `preparar` decide con los datos si el juego se puede jugar con un contenido; así el docente solo ve los compatibles.
import { lazy } from 'react'
import { normalizar } from '../lib/crucigrama'
import { conRetos, cortos, largo } from './contenido'
import { indiceGrado } from './matematica/habilidades'
import {
  MiniCarrera,
  MiniCarriles,
  MiniConcurso,
  MiniCondor,
  MiniDuelo,
  MiniGlobos,
  MiniInvasion,
  MiniMemoria,
  MiniMichi,
  MiniPalabra,
  MiniPupiletras,
  MiniRapido,
  MiniRuleta,
  MiniSoga,
  MiniTopo,
  MiniUne,
  MiniVerdad,
} from './miniaturas'
import type { Contenido, DefinicionJuego, JuegoId, Ritmo } from './tipos'

/** Parejas que caben en una carta: textos cortos o un dibujo. */
function paresCortos(c: Contenido): Contenido | null {
  const cabe = (l: { texto: string; visual?: unknown }) => !!l.visual || (largo(l.texto) > 0 && largo(l.texto) <= 16)
  const pares = c.pares.filter((p) => cabe(p.a) && cabe(p.b))
  return pares.length >= 4 ? { ...c, pares } : null
}

/** Parejas que caben en una tarjeta de "Une con flechas" (más ancha que una carta de Memoria). */
function paresUne(c: Contenido): Contenido | null {
  const cabe = (l: { texto: string; visual?: unknown }) => !!l.visual || (largo(l.texto) > 0 && largo(l.texto) <= 26)
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
    id: 'concurso',
    estilo: 'neutro',
    nombre: 'Concurso',
    lema: 'Como Kahoot: reloj, cuatro colores y puntos por rapidez.',
    accion: 'responden con reloj, eligiendo entre cuatro opciones; la rapidez da más puntos',
    instrucciones: 'Lee la pregunta y toca el color de la respuesta antes de que se acabe el tiempo. ¡Mientras más rápido, más puntos!',
    donde: ['celular', 'clase'],
    color: '#46178f',
    inspirado: 'Kahoot',
    preparar: (c) => conRetos(c, (r) => (largo(r.pregunta) <= 160 ? cortos(40, 2)(r) : null), 4),
    Miniatura: MiniConcurso,
    Componente: lazy(() => import('./concurso/Concurso')),
  },
  {
    id: 'globos',
    estilo: 'infantil',
    nombre: 'Globos',
    lema: 'Revientan el globo con la respuesta antes de que se escape.',
    accion: 'eligen la respuesta correcta entre varias antes de que el globo se escape',
    instrucciones: 'Lee la pregunta y revienta el globo con la respuesta correcta antes de que se escape. Tienes tres vidas.',
    donde: ['celular', 'clase'],
    color: '#2fb2ff',
    inspirado: 'Balloon Pop (Wordwall, Arcademic)',
    preparar: (c) => conRetos(c, cortos(12, 3), 4),
    Miniatura: MiniGlobos,
    Componente: lazy(() => import('./globos/Globos')),
  },
  {
    id: 'verdad',
    estilo: 'neutro',
    nombre: '¿Verdad o mentira?',
    lema: 'Una carta con una respuesta: la deslizan a "verdad" o a "mentira". Las mentiras son los errores típicos.',
    accion: 'deciden si la respuesta de cada carta es correcta o es un error típico',
    instrucciones: '¿La respuesta de la carta está bien? Deslízala a la derecha si es verdad o a la izquierda si es mentira, antes de que se acabe el tiempo. También puedes tocar los botones.',
    donde: ['celular', 'clase'],
    color: '#2f7bff',
    inspirado: 'Verdadero o falso (Wordwall) y las cartas que se deslizan',
    preparar: (c) => conRetos(c, (r) => (largo(r.pregunta) <= 140 ? cortos(30, 2)(r) : null), 4),
    Miniatura: MiniVerdad,
    Componente: lazy(() => import('./verdad/VerdadMentira')),
  },
  {
    id: 'une',
    estilo: 'infantil',
    nombre: 'Une con flechas',
    lema: 'Relacionan columnas contra el reloj: tocan un lado y luego su pareja, y quedan unidos con una línea.',
    accion: 'relacionan cada elemento con su pareja, uniendo las dos columnas',
    instrucciones: 'Toca uno de la izquierda y luego su pareja de la derecha. Si están bien, quedan unidos con una línea. ¡Únelos todos antes de que se acabe el tiempo!',
    donde: ['celular', 'clase'],
    color: '#ff9f68',
    inspirado: 'Relaciona columnas (cuadernos) y Match up (Wordwall)',
    preparar: paresUne,
    Miniatura: MiniUne,
    Componente: lazy(() => import('./une/UneFlechas')),
  },
  {
    id: 'condor',
    estilo: 'neutro',
    nombre: 'Vuela, cóndor',
    lema: 'Como Flappy Bird: tocan para aletear y pasan por el hueco con la respuesta.',
    accion: 'leen la pregunta y guían al cóndor por el hueco con la respuesta correcta',
    instrucciones: 'Toca la pantalla para aletear. Pasa por el hueco de las nubes que tiene la respuesta correcta. Tienes tres vidas.',
    donde: ['celular'],
    color: '#5ab8ff',
    inspirado: 'Flappy Bird',
    desde: 'primaria-2',
    preparar: (c) => conRetos(c, (r) => (largo(r.pregunta) <= 120 ? cortos(10, 2)(r) : null), 4),
    Miniatura: MiniCondor,
    Componente: lazy(() => import('./condor/VuelaCondor')),
  },
  {
    id: 'carriles',
    estilo: 'neutro',
    nombre: 'Corre, cuy',
    lema: 'Como Subway Surfers: el cuy corre y se cambia al carril de la respuesta.',
    accion: 'leen la pregunta y se cambian al carril con la respuesta correcta antes de que llegue',
    instrucciones: 'Toca un carril o desliza para mover al cuy. Ponte en el carril de la respuesta correcta antes de que lleguen las cajas.',
    donde: ['celular'],
    color: '#d9a86c',
    inspirado: 'Subway Surfers',
    preparar: (c) => conRetos(c, (r) => (largo(r.pregunta) <= 120 ? cortos(10, 3)(r) : null), 4),
    Miniatura: MiniCarriles,
    Componente: lazy(() => import('./carriles/CorreCuy')),
  },
  {
    id: 'michi',
    estilo: 'neutro',
    nombre: 'Michi',
    lema: 'Tres en raya contra la compu: para marcar una casilla hay que responder bien y a tiempo.',
    accion: 'responden una pregunta por cada casilla que quieren marcar y piensan su jugada',
    instrucciones: 'Elige una casilla y responde la pregunta antes de que se acabe el tiempo. Si aciertas, la casilla es tuya; si fallas, juega la compu. Gana quien haga tres en raya.',
    donde: ['celular', 'clase'],
    color: '#7b5cff',
    inspirado: 'Tres en raya (michi)',
    preparar: (c) => conRetos(c, (r) => (largo(r.pregunta) <= 160 ? cortos(30, 3)(r) : null), 4),
    Miniatura: MiniMichi,
    Componente: lazy(() => import('./michi/Michi')),
  },
  {
    id: 'rapido',
    estilo: 'neutro',
    nombre: 'Botones rápidos',
    lema: '¿Cuántas aciertan en un minuto? Ideal para tablas y cálculo mental.',
    accion: 'resuelven todos los ejercicios que puedan en un minuto',
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
    estilo: 'infantil',
    nombre: 'Tira y afloja',
    lema: 'Dos equipos en la pizarra: cada acierto jala la soga hacia su lado.',
    accion: 'dos equipos responden por turnos y cada acierto suma para su equipo',
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
    estilo: 'neutro',
    nombre: 'Memoria',
    lema: 'Voltean cartas de a dos hasta encontrar todas las parejas antes de que se acabe el tiempo.',
    accion: 'relacionan cada pregunta con su respuesta y recuerdan dónde está',
    instrucciones: 'Voltea dos cartas. Si van juntas, se quedan a la vista. ¡Encuentra todas las parejas antes de que se acabe el tiempo!',
    donde: ['celular', 'clase'],
    color: '#21b35f',
    inspirado: 'Matching pairs (Wordwall)',
    preparar: paresCortos,
    Miniatura: MiniMemoria,
    Componente: lazy(() => import('./memoria/Memoria')),
  },
  {
    id: 'carrera',
    estilo: 'infantil',
    nombre: 'Carrera de llamas',
    lema: 'Una carrera de verdad: la rival corre sola; cada acierto hace avanzar a su llama y cada error adelanta a la rival.',
    accion: 'resuelven uno tras otro; cada acierto hace avanzar a su llama',
    instrucciones: '¡La otra llama no se detiene! Responde bien para avanzar y llegar primero a la meta. Si fallas, la rival se adelanta.',
    donde: ['celular', 'clase'],
    color: '#ff9636',
    inspirado: 'Math Racing',
    preparar: (c) => conRetos(c, (r) => (largo(r.pregunta) <= 160 ? cortos(60, 2)(r) : null), 3),
    Miniatura: MiniCarrera,
    Componente: lazy(() => import('./carrera/Carrera')),
  },
  {
    id: 'palabra',
    estilo: 'infantil',
    nombre: 'Adivina la palabra',
    lema: 'Descubren la palabra letra por letra antes de que se revienten los globos.',
    accion: 'descubren una palabra clave del tema a partir de su pista',
    instrucciones: 'Lee la pista y elige letras. Cada letra que no está revienta un globo de la llamita, y si tardas en elegir, también.',
    donde: ['celular', 'clase'],
    color: '#ff4f9a',
    inspirado: 'Ahorcado, sin horca',
    preparar: palabrasSueltas(1),
    Miniatura: MiniPalabra,
    Componente: lazy(() => import('./palabra/AdivinaPalabra')),
  },
  {
    id: 'pupiletras',
    estilo: 'neutro',
    nombre: 'Pupiletras',
    lema: 'Encuentran las palabras del tema escondidas en la sopa de letras antes de que se acabe el tiempo.',
    accion: 'encuentran en la sopa de letras las palabras clave del tema',
    instrucciones: 'Arrastra el dedo de la primera a la última letra de cada palabra, o toca una y luego la otra. ¡Encuéntralas todas antes de que se acabe el tiempo!',
    donde: ['celular', 'clase'],
    color: '#17998f',
    inspirado: 'Pupiletras (sopa de letras)',
    preparar: palabrasSueltas(4),
    Miniatura: MiniPupiletras,
    Componente: lazy(() => import('./pupiletras/Pupiletras')),
  },
  {
    id: 'topo',
    estilo: 'infantil',
    nombre: 'Atrapa al cuy',
    lema: 'Los cuyes se asoman con carteles: atrapan al que tiene la respuesta.',
    accion: 'atrapan al cuy que tiene la respuesta correcta',
    instrucciones: 'Lee la pregunta y toca al cuy que tiene la respuesta correcta antes de que se acabe el tiempo. ¡Rápido, que se esconden!',
    donde: ['celular', 'clase'],
    color: '#45b03a',
    inspirado: 'Whack-a-mole (Wordwall)',
    preparar: (c) => conRetos(c, cortos(12, 3), 4),
    Miniatura: MiniTopo,
    Componente: lazy(() => import('./topo/Topo')),
  },
  {
    id: 'ruleta',
    estilo: 'neutro',
    nombre: 'Ruleta de preguntas',
    lema: 'Giran la ruleta en el proyector, sale una pregunta y toda la clase responde.',
    accion: 'responden en voz alta la pregunta que les toca en la ruleta',
    instrucciones: 'Gira la ruleta. Lean la pregunta en voz alta, que la clase piense y luego toca «Ver respuesta».',
    donde: ['clase'],
    color: '#c2185b',
    inspirado: 'Ruleta aleatoria (Wordwall)',
    preparar: (c) => conRetos(c, (r) => (largo(r.pregunta) <= 200 ? cortos(60, 2)(r) : null), 4),
    Miniatura: MiniRuleta,
    Componente: lazy(() => import('./ruleta/Ruleta')),
  },
  {
    id: 'duelo',
    estilo: 'juvenil',
    nombre: 'Duelo de robots',
    lema: 'Pelea de robots: cada acierto es un golpe y tres seguidos, un especial. Sin sangre.',
    accion: 'cada respuesta correcta es un golpe de su robot',
    instrucciones: 'Contra la máquina o de a dos. Responde bien para golpear; si fallas o tardas, te golpean a ti.',
    donde: ['celular', 'clase'],
    color: '#ff3dc8',
    inspirado: 'Juegos de pelea (Mortal Kombat, Street Fighter), sin violencia gráfica',
    preparar: (c) => conRetos(c, cortos(20, 3), 6),
    Miniatura: MiniDuelo,
    Componente: lazy(() => import('./duelo/Duelo')),
  },
  {
    id: 'invasion',
    estilo: 'juvenil',
    nombre: 'Invasión',
    lema: 'Drones bajan hacia la base: disparan el láser al que tiene la respuesta.',
    accion: 'disparan al dron que tiene la respuesta correcta',
    instrucciones: 'Toca el dron con la respuesta correcta antes de que llegue a la base. Si fallas, pierdes un escudo.',
    donde: ['celular', 'clase'],
    color: '#22e3f5',
    inspirado: 'Arcades de naves (Space Invaders, Alien Addition), sin violencia',
    preparar: (c) => conRetos(c, cortos(12, 3), 4),
    Miniatura: MiniInvasion,
    Componente: lazy(() => import('./invasion/Invasion')),
  },
]

export const juegoPorId = (id: JuegoId) => JUEGOS.find((j) => j.id === id)

const ORDEN_ESTILO = { grandes: { juvenil: 0, neutro: 1, infantil: 2 }, chicos: { infantil: 0, neutro: 1, juvenil: 2 } }

/**
 * Juegos que se pueden jugar con este contenido, cada uno con el contenido ya preparado para él.
 * Con el grado, se quitan los que no son para esa edad y se ordenan: desde 5.º de primaria, los juveniles primero.
 */
export function juegosCompatibles(c: Contenido, gradoId?: string) {
  const g = gradoId ? indiceGrado(gradoId) : -1
  const lista = JUEGOS.filter((def) => g < 0 || !def.desde || g >= indiceGrado(def.desde)).flatMap((def) => {
    const preparado = def.preparar(c)
    return preparado ? [{ def, contenido: preparado }] : []
  })
  if (g < 0) return lista
  const orden = ORDEN_ESTILO[g >= indiceGrado('primaria-5') ? 'grandes' : 'chicos']
  return lista.sort((a, b) => orden[a.def.estilo] - orden[b.def.estilo])
}

/** Más lento para los más chicos. */
export function ritmoDe(gradoId: string): Ritmo {
  if (/^primaria-[12]$/.test(gradoId)) return 1
  if (/^primaria-[34]$/.test(gradoId)) return 2
  return 3
}
