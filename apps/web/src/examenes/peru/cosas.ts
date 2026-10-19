// Cosas del Perú con las que el alumno se identifica (el cuy, la combi, el choclo, la chicha morada…), en fotos reales
// con licencia libre (ver README.md de esta carpeta y cosas/creditos.json). Lo genérico (una gallina, un huevo, un
// carro) se queda en dibujo: la foto es para lo que es de aquí. Un problema que habla de una de estas cosas la muestra.
import { el, rect, svg } from '../dibujos'
import type { Dibujo } from '../tipos'
import creditos from './cosas/creditos.json'
import alpaca from './cosas/alpaca.webp'
import anticuchos from './cosas/anticuchos.webp'
import causa from './cosas/causa.webp'
import chicha from './cosas/chicha.webp'
import choclo from './cosas/choclo.webp'
import chullo from './cosas/chullo.webp'
import combi from './cosas/combi.webp'
import condor from './cosas/condor.webp'
import cuy from './cosas/cuy.webp'
import llama from './cosas/llama.webp'
import machupicchu from './cosas/machupicchu.webp'
import mango from './cosas/mango.webp'
import misti from './cosas/misti.webp'
import mototaxi from './cosas/mototaxi.webp'
import papas from './cosas/papas.webp'
import picarones from './cosas/picarones.webp'
import quinua from './cosas/quinua.webp'
import totora from './cosas/totora.webp'
import uros from './cosas/uros.webp'

export type Cosa = {
  id: keyof typeof creditos
  nombre: string
  /** Cómo aparece en un enunciado. */
  buscar: RegExp
  foto: string
  /** Qué muestra la foto, para quien no la ve. */
  alt: string
}

const LETRA = '[\\wáéíóúüñÁÉÍÓÚÜÑ]'

/** Una palabra entera (con tildes: «papá» no es «papa»), sin importar mayúsculas. */
const palabra = (patron: string) => new RegExp(`(?<!${LETRA})(?:${patron})(?!${LETRA})`, 'i')

// Primero las más específicas.
export const COSAS: Cosa[] = [
  { id: 'chicha', nombre: 'Chicha morada', buscar: palabra('chicha morada'), foto: chicha, alt: 'Un vaso de chicha morada' },
  { id: 'causa', nombre: 'Causa limeña', buscar: palabra('causas? limeñas?|causas? rellenas?|(?:una|la) causa(?! de)'), foto: causa, alt: 'Una causa limeña en un plato' },
  { id: 'picarones', nombre: 'Picarones', buscar: palabra('picarones?'), foto: picarones, alt: 'Picarones en una bandeja' },
  { id: 'anticuchos', nombre: 'Anticuchos', buscar: palabra('anticuchos?'), foto: anticuchos, alt: 'Un plato de anticuchos' },
  { id: 'quinua', nombre: 'Quinua', buscar: palabra('quinua'), foto: quinua, alt: 'Granos de quinua' },
  { id: 'choclo', nombre: 'Choclo', buscar: palabra('choclos?'), foto: choclo, alt: 'Dos choclos de grano grande y blanco' },
  { id: 'papas', nombre: 'Papa', buscar: palabra('papas?'), foto: papas, alt: 'Papas rojas y amarillas recién cosechadas' },
  { id: 'cuy', nombre: 'Cuy', buscar: palabra('cuy(?:es)?'), foto: cuy, alt: 'Tres cuyes en su casita' },
  { id: 'llama', nombre: 'Llama', buscar: palabra('llamas|(?:una|la) llama'), foto: llama, alt: 'Una llama comiendo pasto en los Andes' },
  { id: 'alpaca', nombre: 'Alpaca', buscar: palabra('alpacas?'), foto: alpaca, alt: 'Alpacas en el campo' },
  { id: 'condor', nombre: 'Cóndor andino', buscar: palabra('c[óo]ndor(?:es)?'), foto: condor, alt: 'Un cóndor andino volando' },
  { id: 'combi', nombre: 'Combi', buscar: palabra('combis?'), foto: combi, alt: 'Una combi en una avenida de Lima' },
  { id: 'mototaxi', nombre: 'Mototaxi', buscar: palabra('mototaxis?'), foto: mototaxi, alt: 'Un mototaxi rojo y blanco' },
  { id: 'mango', nombre: 'Mango', buscar: palabra('mangos?'), foto: mango, alt: 'Un mango maduro en la mano' },
  { id: 'chullo', nombre: 'Chullo', buscar: palabra('chullos?'), foto: chullo, alt: 'Un chullo tejido de muchos colores' },
  { id: 'machupicchu', nombre: 'Machu Picchu', buscar: palabra('machu ?picchu'), foto: machupicchu, alt: 'Machu Picchu y las montañas' },
  { id: 'totora', nombre: 'Caballito de totora', buscar: palabra('caballitos? de totora'), foto: totora, alt: 'Un pescador en un caballito de totora' },
  { id: 'uros', nombre: 'Islas de los Uros', buscar: palabra('uros'), foto: uros, alt: 'Una casa y un bote de totora en las islas de los Uros' },
  { id: 'misti', nombre: 'El Misti', buscar: palabra('misti'), foto: misti, alt: 'El volcán Misti visto desde Arequipa' },
]

/** La primera cosa del Perú que aparece en el texto, si hay. */
export const cosaEn = (texto: string): Cosa | null => COSAS.find((c) => c.buscar.test(texto)) ?? null

/** El crédito de la foto, como lo pide su licencia: título, autor y licencia. */
export function creditoDe(c: Cosa): string {
  const x = creditos[c.id]
  return `«${x.titulo}», ${x.autor} (${x.licencia})`
}

const FW = 168
const FH = 126

/** La foto como dibujo de la pregunta, chica y con un filo, al lado del enunciado. */
export function fotoDe(c: Cosa): Dibujo {
  const cuerpo = [
    el('image', { href: c.foto, x: 0, y: 0, width: FW, height: FH, preserveAspectRatio: 'xMidYMid slice' }),
    rect(0.5, 0.5, FW - 1, FH - 1, { trazo: '#9a9a9a', grosor: 1, redondeo: 6 }),
  ].join('')
  return { ...svg(FW, FH, cuerpo, c.alt), credito: creditoDe(c) }
}
