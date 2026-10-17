import { FileText, Gamepad2, Grid3x3, HeartHandshake, Music, type LucideProps } from 'lucide-react'
import type { ComponentType } from 'react'
import { COSTOS, textoCosto, type HerramientaId } from '../api'

export type Herramienta = {
  id: HerramientaId
  nombre: string
  descripcion: string
  icono: ComponentType<LucideProps>
  color: string
  costo: string
}

export const ORDEN_HERRAMIENTAS: HerramientaId[] = ['cancion', 'examen', 'juego', 'crucigrama', 'adaptar']

export const HERRAMIENTAS: Record<HerramientaId, Herramienta> = {
  cancion: {
    id: 'cancion',
    nombre: 'Canción',
    descripcion: 'Una canción pegadiza para memorizar el tema.',
    icono: Music,
    color: 'var(--cancion)',
    costo: `Letra ${textoCosto(COSTOS.letra)} · audio ${textoCosto(COSTOS.audio)}`,
  },
  examen: {
    id: 'examen',
    nombre: 'Examen gamificado',
    descripcion: 'Tu evaluación convertida en una misión con lo que le gusta a tu clase.',
    icono: FileText,
    color: 'var(--examen)',
    costo: `${textoCosto(COSTOS.examen)} · ilustraciones aparte`,
  },
  juego: {
    id: 'juego',
    nombre: 'Juego web',
    descripcion: 'Un minijuego que tus estudiantes abren con un QR, sin instalar nada.',
    icono: Gamepad2,
    color: 'var(--juego)',
    costo: textoCosto(COSTOS.juego),
  },
  crucigrama: {
    id: 'crucigrama',
    nombre: 'Crucigrama',
    descripcion: 'Con el vocabulario del tema, listo para imprimir.',
    icono: Grid3x3,
    color: 'var(--crucigrama)',
    costo: textoCosto(COSTOS.crucigrama),
  },
  adaptar: {
    id: 'adaptar',
    nombre: 'Adaptar para inclusión',
    descripcion: 'Versiones para estudiantes con TDAH, dislexia o TEA, con consejos para el aula.',
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
