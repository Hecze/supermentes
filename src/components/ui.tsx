import { ChevronDown, LoaderCircle } from 'lucide-react'
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import { textoCosto, type Fraccion, type HerramientaId } from '../api'
import { HERRAMIENTAS } from '../app/herramientas'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

export const tinte = (color: string, pct: number) => `color-mix(in oklab, ${color} ${pct}%, transparent)`

/** Dentro de un visor embebido (como la vista previa) el navegador no deja imprimir ni descargar. */
function embebido() {
  try {
    return window.self !== window.top
  } catch {
    return true
  }
}

/** Imprime solo la hoja visible. */
export function imprimir(avisar: (texto: string) => void) {
  if (embebido()) avisar('En la app se abre la ventana para imprimir solo esta hoja (o guardarla como PDF).')
  else window.print()
}

/** Descarga un archivo generado en el navegador. */
export function descargar(archivo: Blob, nombre: string, avisar: (texto: string, tono?: 'info' | 'ok' | 'error') => void) {
  if (embebido()) {
    avisar(`En la app se descarga "${nombre}". Esta vista previa no permite descargas.`)
    return
  }
  const url = URL.createObjectURL(archivo)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  avisar(`Descargaste "${nombre}".`, 'ok')
}

type BotonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: 'primario' | 'contorno' | 'suave' | 'herramienta'
  herramienta?: HerramientaId
  tam?: 'sm' | 'md' | 'lg'
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
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-medium transition active:translate-y-px disabled:pointer-events-none disabled:opacity-50 print:hidden',
        { sm: 'h-9 px-3 text-sm', md: 'h-11 px-4', lg: 'h-14 rounded-2xl px-7 text-lg' }[tam],
        estilos[variante],
        className,
      )}
      style={color}
      disabled={disabled || cargando}
      {...rest}
    >
      {cargando && <LoaderCircle className="size-5 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

/** Línea discreta bajo un botón que gasta créditos. */
export function NotaCreditos({ n, quedan }: { n: number; quedan: number }) {
  if (n === 0) return <p className="text-sm text-ink-soft">No gasta créditos.</p>
  return (
    <p className="text-sm text-ink-soft tabular-nums">
      Usa {textoCosto(n)} de tus {quedan}.
    </p>
  )
}

export function Tarjeta({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <section className={cx('rounded-2xl border border-line bg-surface p-4 sm:p-5', className)} style={style}>
      {children}
    </section>
  )
}

/** El resultado de cada herramienta: se ve y se imprime como una hoja. */
export function Hoja({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <article
      className={cx(
        'hoja flex flex-col gap-6 rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_0_var(--line),0_12px_32px_-18px_rgb(0_0_0/0.25)] sm:p-10',
        className,
      )}
    >
      {children}
    </article>
  )
}

/** Fila de acciones debajo de la hoja. No se imprime. */
export function Acciones({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2 print:hidden">{children}</div>
}

/** Pregunta simple con su respuesta debajo (chips, opciones…). */
export function Pregunta({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-display text-2xl font-bold">{titulo}</h2>
      {children}
    </div>
  )
}

/** Sección plegada: lo avanzado queda a un clic, sin estorbar. */
export function Desplegable({ titulo, children, abierto }: { titulo: ReactNode; children: ReactNode; abierto?: boolean }) {
  return (
    <details className="group rounded-2xl border border-line bg-surface print:hidden" open={abierto}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 font-medium sm:px-5 [&::-webkit-details-marker]:hidden">
        {titulo}
        <ChevronDown className="size-5 shrink-0 text-ink-soft transition group-open:rotate-180" aria-hidden />
      </summary>
      <div className="flex flex-col gap-4 border-t border-line px-4 py-4 sm:px-5">{children}</div>
    </details>
  )
}

export function Chip({
  activo,
  onClick,
  children,
  color = 'var(--ink)',
  grande,
}: {
  activo?: boolean
  onClick?: () => void
  children: ReactNode
  color?: string
  grande?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border-2 transition',
        grande ? 'h-12 px-5 text-base' : 'h-9 px-3.5 text-sm',
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
    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-line bg-surface px-5 py-6 text-ink-soft print:hidden" role="status">
      <LoaderCircle className="size-5 animate-spin" aria-hidden />
      {texto}
    </div>
  )
}

/** Texto que el docente puede corregir con un clic, como una celda. */
export function Editable({ children, className, como: Tag = 'p' }: { children: ReactNode; className?: string; como?: 'p' | 'span' | 'h2' | 'h3' }) {
  return (
    <Tag
      className={cx('rounded-md outline-none transition hover:bg-surface-2/70 focus:bg-surface-2 focus:ring-2 focus:ring-line', className)}
      contentEditable
      suppressContentEditableWarning
      spellCheck
    >
      {children}
    </Tag>
  )
}
