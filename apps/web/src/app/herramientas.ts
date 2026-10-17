import { FileText, Gamepad2, Grid3x3, HeartHandshake, Music, type LucideProps } from 'lucide-react'
import type { ComponentType } from 'react'
import { COSTOS, textoCosto, type HerramientaId } from '../api'

export type Herramienta = {
  id: HerramientaId
  nombre: string
  /** Cómo lo pide el docente: "Una canción", "Un juego"… */
  pedido: string
  descripcion: string
  icono: ComponentType<LucideProps>
  color: string
  costo: string
}

export const ORDEN_HERRAMIENTAS: HerramientaId[] = ['cancion', 'examen', 'juego', 'crucigrama', 'adaptar']

export const HERRAMIENTAS: Record<HerramientaId, Herramienta> = {
  cancion: {
    id: 'cancion',
    pedido: 'Una canción',
    nombre: 'Canción',
    descripcion: 'Para que memoricen el tema cantando.',
    icono: Music,
    color: 'var(--cancion)',
    costo: `Letra ${textoCosto(COSTOS.letra)} · audio ${textoCosto(COSTOS.audio)}`,
  },
  examen: {
    id: 'examen',
    pedido: 'Un examen divertido',
    nombre: 'Examen gamificado',
    descripcion: 'Tu evaluación con lo que le gusta a tu clase.',
    icono: FileText,
    color: 'var(--examen)',
    costo: `${textoCosto(COSTOS.examen)} · ilustraciones aparte`,
  },
  juego: {
    id: 'juego',
    pedido: 'Un juego',
    nombre: 'Juego web',
    descripcion: 'Lo juegan en el celular o proyectado en clase.',
    icono: Gamepad2,
    color: 'var(--juego)',
    costo: textoCosto(COSTOS.juego),
  },
  crucigrama: {
    id: 'crucigrama',
    pedido: 'Un crucigrama',
    nombre: 'Crucigrama',
    descripcion: 'Con las palabras que tú elijas, listo para imprimir.',
    icono: Grid3x3,
    color: 'var(--crucigrama)',
    costo: textoCosto(COSTOS.crucigrama),
  },
  adaptar: {
    id: 'adaptar',
    pedido: 'Adaptar para un estudiante',
    nombre: 'Adaptar para inclusión',
    descripcion: 'Una versión para quien aprende distinto.',
    icono: HeartHandshake,
    color: 'var(--adaptar)',
    costo: textoCosto(COSTOS.adaptacion),
  },
}

export const GRADOS = [
  '1.º primaria',
  '2.º primaria',
  '3.º primaria',
  '4.º primaria',
  '5.º primaria',
  '6.º primaria',
  '1.º secundaria',
  '2.º secundaria',
  '3.º secundaria',
  '4.º secundaria',
  '5.º secundaria',
]

export const AREAS = ['Matemática', 'Comunicación', 'Ciencia y Tecnología', 'Personal Social', 'Arte y Cultura', 'Inglés']

export const DURACIONES = ['30 min', '45 min', '90 min']

export const RITMOS = ['Cumbia', 'Huayno', 'Festejo', 'Rap', 'Balada']

export const MELODIAS = ['Los pollitos dicen', 'Arroz con leche', 'Pin Pon']

export const INTERESES = ['Fútbol', 'Animales', 'Cocina']
