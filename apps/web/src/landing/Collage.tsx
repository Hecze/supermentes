import { Play } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { mejorCrucigrama } from '../lib/crucigrama'

// Lienzo de diseño fijo; se escala para entrar en el ancho disponible.
const ANCHO = 560
const ALTO = 580

function Hoja({ children, style, color, retraso = 0 }: { children: ReactNode; style: CSSProperties; color: string; retraso?: number }) {
  const { rotate, ...posicion } = style
  return (
    <div className="flotar absolute" style={{ ...posicion, animationDelay: `${retraso}s` }}>
      <div
        className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-[0_24px_48px_-24px_rgb(0_0_0/0.35)]"
        style={{ borderTop: `6px solid ${color}`, rotate }}
      >
        {children}
      </div>
    </div>
  )
}

function Pastel({ k, n, color, tam = 34 }: { k: number; n: number; color: string; tam?: number }) {
  const c = tam / 2
  const r = c - 1.5
  return (
    <svg width={tam} height={tam} viewBox={`0 0 ${tam} ${tam}`} aria-hidden>
      {Array.from({ length: n }, (_, i) => {
        const a0 = (i / n) * 2 * Math.PI - Math.PI / 2
        const a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2
        return (
          <path
            key={i}
            d={`M${c},${c} L${c + r * Math.cos(a0)},${c + r * Math.sin(a0)} A${r},${r} 0 0 1 ${c + r * Math.cos(a1)},${c + r * Math.sin(a1)} Z`}
            fill={i < k ? color : 'var(--surface)'}
            stroke="var(--ink)"
            strokeWidth={1.2}
          />
        )
      })}
    </svg>
  )
}

function MiniCrucigrama() {
  const c = useMemo(
    () =>
      mejorCrucigrama(
        ['mitad', 'tercio', 'entero', 'cuarto', 'octavo'].map((palabra) => ({ palabra, pista: '' })),
        3,
        8,
      ),
    [],
  )
  return (
    <div className="grid w-max" style={{ gridTemplateColumns: `repeat(${c.cols}, 18px)` }} aria-hidden>
      {c.letras.flatMap((fila, f) =>
        fila.map((letra, col) => (
          <span key={`${f}-${col}`} className={letra ? 'relative -ml-px -mt-px size-[18px] border border-ink bg-surface' : 'size-[18px]'}>
            {c.numeros[f][col] && <span className="absolute left-px top-0 text-[6px] font-bold leading-none">{c.numeros[f][col]}</span>}
          </span>
        )),
      )}
    </div>
  )
}

/** Hojas de ejemplo de lo que crea Supermentes, flotando una sobre otra. */
export function Collage() {
  const caja = useRef<HTMLDivElement>(null)
  const [escala, setEscala] = useState(1)

  useEffect(() => {
    const el = caja.current
    if (!el) return
    const medir = () => setEscala(Math.min(1, el.clientWidth / ANCHO))
    medir()
    const obs = new ResizeObserver(medir)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={caja}
      className="relative w-full min-w-0"
      style={{ height: ALTO * escala }}
      role="img"
      aria-label="Ejemplos de lo que crea Supermentes: un examen gamificado, un crucigrama, una canción y un juego de memoria"
    >
      {/* Posición absoluta: el lienzo escalado no debe ensanchar la página. */}
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: ANCHO, height: ALTO, transform: `scale(${escala})` }}>
        <Hoja color="var(--examen)" style={{ left: 0, top: 70, width: 310, rotate: '-4deg' }} retraso={0}>
          <div className="rounded-lg px-3 py-2" style={{ background: 'color-mix(in oklab, var(--examen) 12%, transparent)' }}>
            <p className="font-display text-[17px] font-bold leading-tight text-examen">Misión: ¡la final del campeonato!</p>
            <p className="text-[11px] text-ink-soft">Nombre: ________________ · 4.º primaria</p>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-[10px] font-semibold text-examen">Jugada 1</p>
              <p className="text-[12.5px] leading-snug">Tu equipo patea 4 penales y mete 3. ¿Qué fracción terminó en gol?</p>
            </div>
            <Pastel k={3} n={4} color="var(--examen)" tam={40} />
          </div>
          <div className="renglones !h-8" />
          <p className="text-[10px] font-semibold text-examen">Jugada 2</p>
          <p className="text-[12.5px] leading-snug">Sofía toma 1/2 jarra de chicha morada y Luis 1/4. ¿Quién tomó más?</p>
          <div className="renglones !h-8" />
        </Hoja>

        <Hoja color="var(--crucigrama)" style={{ right: 0, top: 0, width: 236, rotate: '5deg' }} retraso={1.2}>
          <p className="font-display text-[17px] font-bold">Crucigrama</p>
          <MiniCrucigrama />
          <div className="flex flex-col gap-1 text-[10.5px] leading-snug">
            <p>
              <b className="text-crucigrama">1</b> Una de dos partes iguales.
            </p>
            <p>
              <b className="text-crucigrama">2</b> La pizza completa.
            </p>
          </div>
        </Hoja>

        <Hoja color="var(--cancion)" style={{ left: 36, bottom: 6, width: 280, rotate: '3deg' }} retraso={0.6}>
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full text-on-tool" style={{ background: 'var(--cancion)' }}>
              <Play className="ml-0.5 size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-display text-[15px] font-bold leading-tight">El rap del sistema digestivo</p>
              <div className="mt-1 flex h-4 items-center gap-[2px]">
                {[5, 9, 13, 7, 15, 10, 6, 12, 16, 8, 11, 14, 6, 9, 13, 7, 10, 15, 8, 12].map((h, i) => (
                  <span key={i} className="w-[3px] rounded-full" style={{ height: h, background: i < 8 ? 'var(--cancion)' : 'color-mix(in oklab, var(--cancion) 30%, transparent)' }} />
                ))}
              </div>
            </div>
          </div>
          <p className="font-display text-[13px] leading-snug">
            Mastico y el estómago va a mezclar,
            <br />
            ¡nutrientes a la sangre van a pasar!
          </p>
        </Hoja>

        <Hoja color="var(--juego)" style={{ right: 14, bottom: 70, width: 206, rotate: '-6deg' }} retraso={1.8}>
          <p className="font-display text-[15px] font-bold">Memoria</p>
          <div className="grid grid-cols-3 gap-1.5">
            {[0, 1, 2, 3, 4, 5].map((i) =>
              i === 1 ? (
                <span key={i} className="grid aspect-[4/5] place-items-center rounded-lg border-2 border-juego bg-surface">
                  <Pastel k={1} n={2} color="var(--juego)" tam={26} />
                </span>
              ) : i === 4 ? (
                <span key={i} className="grid aspect-[4/5] place-items-center rounded-lg border-2 border-juego bg-surface font-display text-[15px] font-bold">
                  1/2
                </span>
              ) : (
                <span key={i} className="grid aspect-[4/5] place-items-center rounded-lg font-display text-[16px] font-bold text-on-tool" style={{ background: 'var(--juego)' }}>
                  ?
                </span>
              ),
            )}
          </div>
        </Hoja>
      </div>
    </div>
  )
}
