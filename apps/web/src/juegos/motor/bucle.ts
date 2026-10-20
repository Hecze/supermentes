import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'

/** Lo más que se recupera de una ausencia: alcanza para que venza cualquier pregunta. */
const MAX_AUSENCIA = 300

/**
 * Llama a `paso(dt, real)` en cada cuadro mientras `activo` sea true, con el tiempo de verdad. El navegador no dibuja
 * con la pestaña oculta, así que al volver se recupera lo que el alumno estuvo fuera (por ejemplo, buscando la
 * respuesta en ChatGPT): el juego no se pausa, los globos se escaparon y el reloj corrió. Un salto grande se da en
 * pasos de 0,1 s para que nada atraviese a otro de golpe; por eso lo que `paso` decide una sola vez (perder una
 * vida, dar la pregunta por vencida) se marca en una ref y no en el estado, que no cambia entre pasos del mismo cuadro.
 * `dt` y `real` son iguales; `real` queda por los relojes que lo usaban.
 */
export function useBucle(paso: (dt: number, real: number) => void, activo = true) {
  const ultimo = useRef(paso)
  ultimo.current = paso
  useEffect(() => {
    if (!activo) return
    let id = 0
    let antes = performance.now()
    const cuadro = (ahora: number) => {
      let resta = Math.min(MAX_AUSENCIA, Math.max(0, (ahora - antes) / 1000))
      antes = ahora
      while (resta > 1e-6) {
        const dt = Math.min(0.1, resta)
        ultimo.current(dt, dt)
        resta -= dt
      }
      id = requestAnimationFrame(cuadro)
    }
    id = requestAnimationFrame(cuadro)
    return () => cancelAnimationFrame(id)
  }, [activo])
}

/** Cuántas veces el jugador salió del juego (otra pestaña u otra aplicación) mientras `activo` sea true. */
export function useSalidas(activo = true) {
  const salidas = useRef(0)
  useEffect(() => {
    if (!activo) return
    const f = () => document.visibilityState === 'hidden' && salidas.current++
    document.addEventListener('visibilitychange', f)
    return () => document.removeEventListener('visibilitychange', f)
  }, [activo])
  return salidas
}

/** Ancho y alto de un elemento, actualizados al cambiar de tamaño (pantalla completa, girar el celular). */
export function useTamano(ref: RefObject<HTMLElement | null>) {
  const [tam, setTam] = useState({ ancho: 0, alto: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const medir = () => setTam({ ancho: el.clientWidth, alto: el.clientHeight })
    medir()
    const obs = new ResizeObserver(medir)
    obs.observe(el)
    return () => obs.disconnect()
  }, [ref])
  return tam
}

/** Ejecuta `f` después de `ms` y lo cancela si el componente se desmonta antes. */
export function useTemporizadores() {
  const ids = useRef<number[]>([])
  useEffect(() => () => ids.current.forEach((id) => window.clearTimeout(id)), [])
  return (f: () => void, ms: number) => {
    ids.current.push(window.setTimeout(f, ms))
  }
}

/** Teclas físicas: útil en el proyector con la laptop. Ignora lo que se escribe en campos de texto. */
export function useTeclas(alPresionar: (tecla: string) => void, activo = true) {
  const ultimo = useRef(alPresionar)
  ultimo.current = alPresionar
  useEffect(() => {
    if (!activo) return
    const f = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (e.ctrlKey || e.metaKey || e.altKey || t?.closest('input, textarea, [contenteditable="true"]')) return
      ultimo.current(e.key)
    }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [activo])
}
