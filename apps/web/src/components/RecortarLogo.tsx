// Recortar el logo en un cuadrado, como en LinkedIn: se arrastra la imagen dentro del recuadro y se acerca con la
// barra (o la rueda del mouse). Sale un logo 1:1 de 256 px para los documentos.
import { Minus, Plus } from 'lucide-react'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { logoRecortado } from '../app/documento'
import { Boton, Ventana } from './ui'

const LADO = 288
const ZOOM_MAX = 4

export function RecortarLogo({ imagen, listo, cancelar }: { imagen: HTMLImageElement | null; listo: (logo: string) => void; cancelar: () => void }) {
  const w = imagen?.naturalWidth || 1
  const h = imagen?.naturalHeight || 1
  // Con zoom 1 la imagen cubre justo el recuadro por su lado más corto.
  const cubre = LADO / Math.min(w, h)
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const arrastre = useRef<{ x: number; y: number; px: number; py: number } | null>(null)
  const s = cubre * zoom

  const limitar = (x: number, y: number, escala: number) => ({
    x: Math.min(0, Math.max(LADO - w * escala, x)),
    y: Math.min(0, Math.max(LADO - h * escala, y)),
  })

  // Cada imagen nueva empieza centrada y sin zoom.
  useEffect(() => {
    setZoom(1)
    setPos({ x: (LADO - w * cubre) / 2, y: (LADO - h * cubre) / 2 })
  }, [imagen, w, h, cubre])

  function acercar(nuevo: number) {
    const z = Math.min(ZOOM_MAX, Math.max(1, nuevo))
    const s2 = cubre * z
    // Se acerca hacia el centro del recuadro.
    const c = LADO / 2
    setPos((p) => limitar(c - ((c - p.x) * s2) / s, c - ((c - p.y) * s2) / s, s2))
    setZoom(z)
  }

  function mover(e: PointerEvent<HTMLDivElement>) {
    const a = arrastre.current
    if (!a) return
    setPos(limitar(a.px + e.clientX - a.x, a.py + e.clientY - a.y, s))
  }

  return (
    <Ventana abierta={!!imagen} cerrar={cancelar} titulo="Recorta el logo">
      <div className="flex flex-col items-center gap-5">
        <div
          className="relative cursor-grab touch-none select-none overflow-hidden rounded-2xl bg-surface-2 active:cursor-grabbing"
          style={{ width: LADO, height: LADO }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            arrastre.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y }
          }}
          onPointerMove={mover}
          onPointerUp={() => (arrastre.current = null)}
          onPointerCancel={() => (arrastre.current = null)}
          onWheel={(e) => acercar(zoom - e.deltaY * 0.002)}
        >
          {imagen && (
            <img
              src={imagen.src}
              alt=""
              draggable={false}
              className="pointer-events-none absolute max-w-none"
              style={{ left: pos.x, top: pos.y, width: w * s, height: h * s }}
            />
          )}
          {/* Lo que queda dentro del cuadrado es el logo. */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-inset ring-primary/70" />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: 'linear-gradient(to right, rgb(255 255 255 / .35) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / .35) 1px, transparent 1px)',
              backgroundSize: `${LADO / 3}px ${LADO / 3}px`,
            }}
          />
        </div>

        <label className="flex w-full max-w-xs items-center gap-3">
          <button type="button" onClick={() => acercar(zoom - 0.25)} className="rounded-lg p-1.5 text-ink-soft hover:bg-surface-2" aria-label="Alejar">
            <Minus className="size-5" />
          </button>
          <input
            type="range"
            min={1}
            max={ZOOM_MAX}
            step={0.01}
            value={zoom}
            onChange={(e) => acercar(Number(e.target.value))}
            aria-label="Zoom"
            className="flex-1 cursor-pointer accent-[var(--primary)]"
          />
          <button type="button" onClick={() => acercar(zoom + 0.25)} className="rounded-lg p-1.5 text-ink-soft hover:bg-surface-2" aria-label="Acercar">
            <Plus className="size-5" />
          </button>
        </label>

        <div className="flex w-full justify-end gap-2">
          <Boton variante="contorno" onClick={cancelar}>
            Cancelar
          </Boton>
          <Boton
            onClick={() => {
              if (!imagen) return
              const logo = logoRecortado(imagen, -pos.x / s, -pos.y / s, LADO / s)
              if (logo) listo(logo)
            }}
          >
            Usar este logo
          </Boton>
        </div>
      </div>
    </Ventana>
  )
}
