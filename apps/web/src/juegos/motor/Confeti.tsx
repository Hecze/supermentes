import { useEffect, useRef } from 'react'
import { PALETA } from './piezas'

const COLORES = PALETA.map((p) => p.c)

/** Lluvia de confeti desde las dos esquinas de abajo. Se lanza al montarse; con otra `key` se vuelve a lanzar. */
export function Confeti({ colores = COLORES, cantidad = 150 }: { colores?: string[]; cantidad?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const lienzo = ref.current
    const ctx = lienzo?.getContext('2d')
    if (!lienzo || !ctx) return
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    } catch {
      // Sin matchMedia se lanza igual.
    }
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const W = lienzo.clientWidth
    const H = lienzo.clientHeight
    lienzo.width = W * dpr
    lienzo.height = H * dpr
    ctx.scale(dpr, dpr)

    const fuerza = Math.max(H, 400) * 1.9
    const piezas = Array.from({ length: cantidad }, (_, i) => {
      const izq = i % 2 === 0
      // Hacia arriba y hacia el centro.
      const angulo = -Math.PI / 2 + (izq ? 1 : -1) * (0.25 + Math.random() * 0.45)
      const v = fuerza * (0.55 + Math.random() * 0.5)
      return {
        x: izq ? W * 0.05 : W * 0.95,
        y: H + 10,
        vx: Math.cos(angulo) * v,
        vy: Math.sin(angulo) * v,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 14,
        w: 6 + Math.random() * 7,
        h: 9 + Math.random() * 9,
        color: colores[i % colores.length],
        redondo: Math.random() < 0.3,
        retraso: Math.random() * 0.25,
      }
    })

    let id = 0
    let antes = performance.now()
    let t = 0
    const cuadro = (ahora: number) => {
      const dt = Math.min(0.05, (ahora - antes) / 1000)
      antes = ahora
      t += dt
      ctx.clearRect(0, 0, W, H)
      for (const p of piezas) {
        if (t < p.retraso) continue
        p.vy += 1500 * dt
        p.vx *= 1 - 1.6 * dt
        p.vy *= 1 - 1.2 * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.rot += p.vr * dt
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        if (p.redondo) {
          ctx.beginPath()
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2)
          ctx.fill()
        } else {
          // El ancho que oscila simula que el papelito gira en el aire.
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w * Math.abs(Math.cos(p.rot * 1.7)), p.h)
        }
        ctx.restore()
      }
      if (t < 4.5) id = requestAnimationFrame(cuadro)
      else ctx.clearRect(0, 0, W, H)
    }
    id = requestAnimationFrame(cuadro)
    return () => cancelAnimationFrame(id)
  }, [colores, cantidad])

  return <canvas ref={ref} className="pointer-events-none absolute inset-0 z-40 h-full w-full" aria-hidden />
}
