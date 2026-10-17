import { Coins, LoaderCircle } from 'lucide-react'
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import { textoCosto, type Fraccion, type HerramientaId } from '../api'
import { HERRAMIENTAS } from '../app/herramientas'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

export const tinte = (color: string, pct: number) => `color-mix(in oklab, ${color} ${pct}%, transparent)`

type BotonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: 'primario' | 'contorno' | 'suave' | 'herramienta'
  herramienta?: HerramientaId
  tam?: 'sm' | 'md'
  cargando?: boolean
}

export function Boton({ variante = 'primario', herramienta, tam = 'md', cargando, className, style, children, disabled, ...rest }: BotonProps) {
  const estilos: Record<string, string> = {
    primario: 'bg-primary text-primary-ink hover:opacity-90',
    contorno: 'border border-line bg-surface text-ink hover:bg-surface-2',
    suave: 'text-ink hover:bg-surface-2',
    herramienta: 'text-on-tool hover:opacity-90',
  }
  const color: CSSProperties | undefined =
    variante === 'herramienta' && herramienta ? { background: HERRAMIENTAS[herramienta].color, ...style } : style
  return (
    <button
      type="button"
      className={cx(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-medium transition active:translate-y-px disabled:pointer-events-none disabled:opacity-50',
        tam === 'sm' ? 'h-9 px-3 text-sm' : 'h-11 px-4',
        estilos[variante],
        className,
      )}
      style={color}
      disabled={disabled || cargando}
      {...rest}
    >
      {cargando && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

export function Costo({ n, className }: { n: number; className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
        n === 0 ? 'bg-ok/12 text-ok' : 'bg-warn/12 text-warn',
        className,
      )}
    >
      {n > 0 && <Coins className="size-3.5" aria-hidden />}
      {textoCosto(n)}
    </span>
  )
}

export function Tarjeta({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <section className={cx('rounded-2xl border border-line bg-surface p-4 sm:p-5', className)} style={style}>
      {children}
    </section>
  )
}

export function Etiqueta({ children }: { children: ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">{children}</p>
}

export function Chip({
  activo,
  onClick,
  children,
  color = 'var(--ink)',
}: {
  activo?: boolean
  onClick?: () => void
  children: ReactNode
  color?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={cx(
        'inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm transition',
        activo ? 'font-semibold' : 'border-line bg-surface text-ink hover:bg-surface-2',
      )}
      style={activo ? { borderColor: color, color, background: tinte(color, 12) } : undefined}
    >
      {children}
    </button>
  )
}

export function IconoHerramienta({ id, tam = 'md' }: { id: HerramientaId; tam?: 'sm' | 'md' | 'lg' }) {
  const h = HERRAMIENTAS[id]
  const Icono = h.icono
  const caja = { sm: 'size-7 rounded-lg', md: 'size-10 rounded-xl', lg: 'size-14 rounded-2xl' }[tam]
  const icono = { sm: 'size-4', md: 'size-5', lg: 'size-7' }[tam]
  return (
    <span className={cx('grid shrink-0 place-items-center', caja)} style={{ background: tinte(h.color, 14), color: h.color }}>
      <Icono className={icono} aria-hidden />
    </span>
  )
}

/** Círculo dividido en n partes con k pintadas. */
export function Pastel({ fraccion, tam = 56, color = 'var(--examen)' }: { fraccion: Fraccion; tam?: number; color?: string }) {
  const [k, n] = fraccion
  const c = tam / 2
  const r = tam / 2 - 2
  const partes =
    n <= 1 ? (
      <circle cx={c} cy={c} r={r} fill={k >= 1 ? color : 'var(--surface)'} stroke="var(--ink)" strokeWidth={1.5} />
    ) : (
      Array.from({ length: n }, (_, i) => {
        const a0 = (i / n) * 2 * Math.PI - Math.PI / 2
        const a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2
        const d = `M${c},${c} L${c + r * Math.cos(a0)},${c + r * Math.sin(a0)} A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${c + r * Math.cos(a1)},${c + r * Math.sin(a1)} Z`
        return <path key={i} d={d} fill={i < k ? color : 'var(--surface)'} stroke="var(--ink)" strokeWidth={1.5} strokeLinejoin="round" />
      })
    )
  return (
    <svg width={tam} height={tam} viewBox={`0 0 ${tam} ${tam}`} role="img" aria-label={`${k} de ${n} partes pintadas`}>
      {partes}
    </svg>
  )
}

/** Código QR de muestra: el patrón no es un QR real hasta que exista el link del juego. */
export function QrEjemplo({ semilla, tam = 148 }: { semilla: string; tam?: number }) {
  const N = 25
  let h = 2166136261
  for (const ch of semilla) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  const azar = () => {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    return ((h >>> 0) % 1000) / 1000
  }
  const enEsquina = (f: number, c: number) => (f < 8 && c < 8) || (f < 8 && c >= N - 8) || (f >= N - 8 && c < 8)
  const modulos: ReactNode[] = []
  for (let f = 0; f < N; f++)
    for (let c = 0; c < N; c++) if (!enEsquina(f, c) && azar() < 0.48) modulos.push(<rect key={`${f}-${c}`} x={c + 2} y={f + 2} width={1} height={1} />)
  const esquina = (f: number, c: number) => (
    <g key={`e${f}-${c}`}>
      <rect x={c + 2} y={f + 2} width={7} height={7} />
      <rect x={c + 3} y={f + 3} width={5} height={5} fill="#ffffff" />
      <rect x={c + 4} y={f + 4} width={3} height={3} />
    </g>
  )
  return (
    <svg width={tam} height={tam} viewBox={`0 0 ${N + 4} ${N + 4}`} role="img" aria-label="Código QR de ejemplo" shapeRendering="crispEdges">
      <rect width={N + 4} height={N + 4} fill="#ffffff" rx={1.5} />
      <g fill="#111111">
        {modulos}
        {esquina(0, 0)}
        {esquina(0, N - 7)}
        {esquina(N - 7, 0)}
      </g>
    </svg>
  )
}

export function Generando({ texto }: { texto: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-line bg-surface-2 px-4 py-3 text-sm text-ink-soft" role="status">
      <LoaderCircle className="size-4 animate-spin" aria-hidden />
      {texto}
    </div>
  )
}

/** Barra que aparece cuando el docente cambió opciones y falta volver a generar. */
export function BarraCambios({
  costo,
  ocupado,
  onGenerar,
  onDescartar,
  texto = 'Cambiaste las opciones.',
}: {
  costo: number
  ocupado: boolean
  onGenerar: () => void
  onDescartar?: () => void
  texto?: string
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-warn/40 bg-warn/8 px-4 py-3">
      <p className="min-w-0 flex-1 text-sm">{texto}</p>
      {onDescartar && (
        <Boton variante="suave" tam="sm" onClick={onDescartar} disabled={ocupado}>
          Descartar
        </Boton>
      )}
      <Boton tam="sm" onClick={onGenerar} cargando={ocupado}>
        Generar de nuevo · {textoCosto(costo)}
      </Boton>
    </div>
  )
}
