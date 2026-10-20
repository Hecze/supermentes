// El reloj de cada pregunta: una barra que se vacía. Cuenta el tiempo de verdad (motor/bucle), así que no se pausa
// si el alumno sale del juego: no alcanza para ir a buscar la respuesta en ChatGPT y volver.
import { useEffect, useRef, useState } from 'react'
import type { Contenido, Ritmo } from '../tipos'
import { useBucle } from './bucle'
import { sonar } from './sonido'

/**
 * Segundos para responder una pregunta de opciones, por ritmo (1.º–2.º, 3.º–4.º, 5.º en adelante): alcanzan para
 * leer y pensar, no para buscar la respuesta. Las preguntas del tema se leen, así que tienen un poco más que el cálculo.
 * Cada juego los usa tal cual o los ajusta a su mecánica (un verdadero o falso se decide más rápido que cuatro opciones).
 */
export function segundosPorPregunta(ritmo: Ritmo, contenido: Pick<Contenido, 'generar'>) {
  return (contenido.generar ? [0, 25, 20, 15] : [0, 30, 25, 20])[ritmo]
}

/**
 * Cuenta `segundos` mientras `activo` sea true y llama a `alVencer` una sola vez. Vuelve a empezar cuando cambia
 * `vuelta` (otra pregunta, otra ronda). Suena un tic en los últimos segundos. La barra se mueve sin redibujar React.
 */
export function useReloj({ segundos, activo, vuelta, alVencer }: { segundos: number; activo: boolean; vuelta: unknown; alVencer: () => void }) {
  const pasado = useRef(0)
  const vencido = useRef(false)
  const barra = useRef<HTMLDivElement>(null)
  const [quedan, setQuedan] = useState(segundos)
  const vencer = useRef(alVencer)
  vencer.current = alVencer

  useEffect(() => {
    pasado.current = 0
    vencido.current = false
    setQuedan(segundos)
    pintar(barra.current, 1)
  }, [vuelta, segundos])

  useBucle((dt) => {
    if (vencido.current) return
    pasado.current += dt
    const resta = Math.max(0, segundos - pasado.current)
    pintar(barra.current, resta / segundos)
    const s = Math.ceil(resta)
    if (s !== quedan) {
      setQuedan(s)
      if (s <= 3 && s > 0) sonar.tic()
    }
    if (resta <= 0) {
      vencido.current = true
      vencer.current()
    }
  }, activo)

  return { barra, quedan }
}

function pintar(el: HTMLDivElement | null, f: number) {
  if (!el) return
  el.style.transform = `scaleX(${f})`
  el.style.background = f > 0.5 ? '#2fc46f' : f > 0.25 ? '#ffb020' : '#ff4d4d'
}

/** La barra del reloj, para poner junto a la pregunta. */
export function BarraReloj({ reloj, className = '' }: { reloj: ReturnType<typeof useReloj>; className?: string }) {
  return (
    <div
      className={`h-[1.3cqmin] min-h-[6px] w-full overflow-hidden rounded-full bg-black/12 ${className}`}
      role="timer"
      aria-label={`Quedan ${reloj.quedan} segundos`}
    >
      <div ref={reloj.barra} className="h-full w-full origin-left rounded-full bg-[#2fc46f]" />
    </div>
  )
}
