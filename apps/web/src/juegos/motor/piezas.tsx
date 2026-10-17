// Piezas que comparten todos los juegos: textos con fracciones apiladas, dibujos, estrellas y corazones.
import type { CSSProperties, ReactNode } from 'react'
import type { Reto, Visual } from '../tipos'

/** Colores de globos, cartas y botones, con el color de texto que se lee bien encima. */
export const PALETA: { c: string; t: string }[] = [
  { c: '#ff5d73', t: '#ffffff' },
  { c: '#ff9636', t: '#ffffff' },
  { c: '#ffc93c', t: '#5a3a00' },
  { c: '#2fc46f', t: '#ffffff' },
  { c: '#2fb2ff', t: '#ffffff' },
  { c: '#4f6dff', t: '#ffffff' },
  { c: '#9f63ff', t: '#ffffff' },
  { c: '#ff6fbf', t: '#ffffff' },
]

export const colorBoton = (i: number) => ({ '--c': PALETA[i % PALETA.length].c, '--t': PALETA[i % PALETA.length].t }) as CSSProperties

const FRAC = /(\?|\d+)\/(\?|\d+)/g

/** Texto con las fracciones escritas como en el cuaderno: 3/4 se ve con el 3 sobre el 4. */
export function TextoMat({ texto, className }: { texto: string; className?: string }) {
  const partes: ReactNode[] = []
  let i = 0
  for (const m of texto.matchAll(FRAC)) {
    if (m.index > i) partes.push(texto.slice(i, m.index))
    partes.push(
      <span key={m.index} className="frac" aria-hidden>
        <span>{m[1]}</span>
        <span>{m[2]}</span>
      </span>,
      <span key={`l${m.index}`} className="sr-only">
        {m[0]}
      </span>,
    )
    i = m.index + m[0].length
  }
  if (i < texto.length) partes.push(texto.slice(i))
  return <span className={className}>{partes}</span>
}

/** Círculo dividido en partes iguales con algunas pintadas. */
export function Pastel({ partes: [k, n], tam = 96, color = '#ff9636' }: { partes: [number, number]; tam?: number | string; color?: string }) {
  const c = 50
  const r = 44
  const porciones =
    n <= 1 ? (
      <circle cx={c} cy={c} r={r} fill={k >= 1 ? color : '#ffffff'} />
    ) : (
      Array.from({ length: n }, (_, i) => {
        const a0 = (i / n) * 2 * Math.PI - Math.PI / 2
        const a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2
        const d = `M${c},${c} L${c + r * Math.cos(a0)},${c + r * Math.sin(a0)} A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${c + r * Math.cos(a1)},${c + r * Math.sin(a1)} Z`
        return <path key={i} d={d} fill={i < k ? color : '#ffffff'} stroke="#2b2d5c" strokeWidth={2.6} strokeLinejoin="round" />
      })
    )
  return (
    <svg width={tam} height={tam} viewBox="0 0 100 100" role="img" aria-label={`${k} de ${n} partes pintadas`}>
      <circle cx={c} cy={c + 3} r={r + 1} fill="rgb(30 20 80 / 0.18)" />
      {porciones}
      <circle cx={c} cy={c} r={r} fill="none" stroke="#2b2d5c" strokeWidth={3} />
    </svg>
  )
}

/** Cosas para contar, en filas de cinco como en el ábaco de la escuela. */
export function Contar({ figura, cantidad, tam = '1.6em' }: { figura: string; cantidad: number; tam?: string }) {
  const filas = Array.from({ length: Math.ceil(cantidad / 5) }, (_, f) => Math.min(5, cantidad - f * 5))
  return (
    <span className="inline-flex flex-col items-start gap-[0.1em] leading-none" role="img" aria-label={`${cantidad} ${figura}`} style={{ fontSize: tam }}>
      {filas.map((n, f) => (
        <span key={f} className="flex gap-[0.12em]" aria-hidden>
          {Array.from({ length: n }, (_, i) => (
            <span key={i}>{figura}</span>
          ))}
        </span>
      ))}
    </span>
  )
}

export function VisualDe({ visual, tam = '5em' }: { visual: Visual; tam?: string }) {
  if (visual.tipo === 'fraccion') return <Pastel partes={visual.partes} tam={tam} />
  const t = visual.cantidad <= 5 ? 0.42 : visual.cantidad <= 10 ? 0.32 : 0.24
  return <Contar figura={visual.figura} cantidad={visual.cantidad} tam={`calc(${tam} * ${t})`} />
}

/** La pregunta de un reto: consigna chica, dibujo y pregunta grande. */
export function Enunciado({ reto, tam = 'clamp(22px, 7cqmin, 64px)', className }: { reto: Reto; tam?: string; className?: string }) {
  const largo = reto.pregunta.length
  const escala = largo > 60 ? 0.48 : largo > 34 ? 0.6 : largo > 18 ? 0.8 : 1
  return (
    <div className={`flex flex-col items-center gap-[0.4em] text-center ${className ?? ''}`}>
      {reto.consigna && (
        <p className="font-medium text-[var(--j-tinta-suave)]" style={{ fontSize: `max(14px, calc(${tam} * 0.42))` }}>
          {reto.consigna}
        </p>
      )}
      {reto.visual && <VisualDe visual={reto.visual} tam={`calc(${tam} * 2.6)`} />}
      {reto.pregunta && (
        <p className="font-semibold leading-tight text-balance" style={{ fontSize: `max(17px, calc(${tam} * ${escala}))` }}>
          <TextoMat texto={reto.pregunta} />
        </p>
      )}
    </div>
  )
}

const PUNTAS = Array.from({ length: 10 }, (_, i) => {
  const r = i % 2 === 0 ? 46 : 20
  const a = (i / 10) * 2 * Math.PI - Math.PI / 2
  return `${50 + r * Math.cos(a)},${52 + r * Math.sin(a)}`
}).join(' ')

export function Estrella({ llena, tam = 48, retraso = 0 }: { llena: boolean; tam?: number | string; retraso?: number }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 100 100" className="estrella-entra" style={{ animationDelay: `${retraso}ms` }} aria-hidden>
      <polygon points={PUNTAS} fill={llena ? '#ffc23d' : '#e6e8f5'} stroke={llena ? '#d98a00' : '#c4c8e3'} strokeWidth={6} strokeLinejoin="round" />
      {llena && <polygon points={PUNTAS} fill="none" stroke="#fff3c4" strokeWidth={3} strokeLinejoin="round" transform="translate(50 50) scale(0.62) translate(-50 -52)" opacity={0.8} />}
    </svg>
  )
}

export function Estrellas({ n, tam = 56 }: { n: number; tam?: number | string }) {
  return (
    <div className="flex items-end gap-2" role="img" aria-label={`${n} de 3 estrellas`}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ transform: i === 1 ? 'translateY(-14%)' : undefined }}>
          <Estrella llena={i < n} tam={i === 1 ? `calc(${typeof tam === 'number' ? `${tam}px` : tam} * 1.25)` : tam} retraso={250 + i * 260} />
        </div>
      ))}
    </div>
  )
}

export function Corazon({ lleno, tam = 28 }: { lleno: boolean; tam?: number | string }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 100 100" aria-hidden className={lleno ? '' : 'opacity-40'}>
      <path
        d="M50 86 C20 66 8 50 8 33 C8 20 18 10 31 10 C40 10 46 15 50 22 C54 15 60 10 69 10 C82 10 92 20 92 33 C92 50 80 66 50 86 Z"
        fill={lleno ? '#ff4d6d' : '#d3d6ea'}
        stroke={lleno ? '#c9184a' : '#b8bcd8'}
        strokeWidth={6}
        strokeLinejoin="round"
      />
      {lleno && <ellipse cx={30} cy={30} rx={9} ry={6} fill="#fff" opacity={0.55} transform="rotate(-30 30 30)" />}
    </svg>
  )
}

export function Vidas({ quedan, total }: { quedan: number; total: number }) {
  return (
    <div className="flex gap-1" role="img" aria-label={`Quedan ${quedan} de ${total} vidas`}>
      {Array.from({ length: total }, (_, i) => (
        <Corazon key={i} lleno={i < quedan} tam="clamp(22px, 5.5cqmin, 40px)" />
      ))}
    </div>
  )
}

const ELOGIOS = ['¡Muy bien!', '¡Genial!', '¡Excelente!', '¡Bravo!', '¡Así se hace!', '¡Súper!', '¡Lo lograste!']
export const elogio = (azar: () => number = Math.random) => ELOGIOS[Math.floor(azar() * ELOGIOS.length)]

/** Un texto que sube y se desvanece donde ocurrió algo: "+1", "¡Genial!". */
export function Flotante({ x, y, texto, color = '#2fc46f' }: { x: number | string; y: number | string; texto: string; color?: string }) {
  return (
    <span
      className="flotante pointer-events-none absolute z-30 whitespace-nowrap font-bold sombra-texto"
      style={{ left: x, top: y, color, fontSize: 'clamp(20px, 6cqmin, 48px)', WebkitTextStroke: '0.04em white', paintOrder: 'stroke' }}
      aria-hidden
    >
      {texto}
    </span>
  )
}
