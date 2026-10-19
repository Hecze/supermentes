import { ClipboardList, FileText, Gamepad2, Grid3x3, Music, type LucideProps } from 'lucide-react'
import type { ComponentType } from 'react'
import type { HerramientaId } from '../api'

export type Herramienta = {
  id: HerramientaId
  nombre: string
  /** Cómo lo pide el docente: "Una canción", "Un juego"… */
  pedido: string
  descripcion: string
  icono: ComponentType<LucideProps>
  color: string
}

// Así se ofrecen en la ficha del tema. El menú (components/Shell.tsx) solo lleva sesión, ejercicios y canciones;
// juego y crucigrama se abren desde la ficha.
export const ORDEN_HERRAMIENTAS: HerramientaId[] = ['sesion', 'ejercicios', 'cancion', 'juego', 'crucigrama']

export const HERRAMIENTAS: Record<HerramientaId, Herramienta> = {
  sesion: {
    id: 'sesion',
    pedido: 'Mi sesión de aprendizaje',
    nombre: 'Sesión de aprendizaje',
    descripcion: 'En construcción: todavía no la uses.',
    icono: ClipboardList,
    color: 'var(--sesion)',
  },
  cancion: {
    id: 'cancion',
    pedido: 'Canciones',
    nombre: 'Canciones',
    descripcion: 'Para que memoricen el tema cantando.',
    icono: Music,
    color: 'var(--cancion)',
  },
  ejercicios: {
    id: 'ejercicios',
    pedido: 'Ejercicios',
    nombre: 'Ejercicios',
    descripcion: 'Examen, práctica y balotario listos para imprimir, con su clave.',
    icono: FileText,
    color: 'var(--examen)',
  },
  juego: {
    id: 'juego',
    pedido: 'Un juego',
    nombre: 'Juego web',
    descripcion: 'Lo juegan en el celular o proyectado en clase.',
    icono: Gamepad2,
    color: 'var(--juego)',
  },
  crucigrama: {
    id: 'crucigrama',
    pedido: 'Un crucigrama',
    nombre: 'Crucigrama',
    descripcion: 'Con las palabras que tú elijas, listo para imprimir.',
    icono: Grid3x3,
    color: 'var(--crucigrama)',
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

export const INTERESES = ['Fútbol', 'Animales', 'Cocina']
