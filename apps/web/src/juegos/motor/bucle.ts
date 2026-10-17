import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'

/**
 * Llama a `paso(dt)` en cada cuadro mientras `activo` sea true. `dt` va en segundos y se limita a 0,1
 * para que nada salte al volver de otra pestaña.
 */
export function useBucle(paso: (dt: number) => void, activo = true) {
  const ultimo = useRef(paso)
  ultimo.current = paso
  useEffect(() => {
    if (!activo) return
    let id = 0
    let antes = performance.now()
    const cuadro = (ahora: number) => {
      const dt = Math.min(0.1, (ahora - antes) / 1000)
      antes = ahora
      ultimo.current(dt)
      id = requestAnimationFrame(cuadro)
    }
    id = requestAnimationFrame(cuadro)
    return () => cancelAnimationFrame(id)
  }, [activo])
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
