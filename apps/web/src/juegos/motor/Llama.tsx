// La llamita de Supermentes, con su manta andina. Se reutiliza en la carrera, el tira y afloja y las portadas.

export type ColoresLlama = { lana: string; sombra: string; manta: [string, string, string] }

export const LLAMAS: Record<'crema' | 'cafe' | 'blanca' | 'gris', ColoresLlama> = {
  crema: { lana: '#f7ead6', sombra: '#e5cfae', manta: ['#e63946', '#ffc93c', '#2a9d8f'] },
  cafe: { lana: '#c98d5c', sombra: '#a8703f', manta: ['#4f6dff', '#ffc93c', '#ff6fbf'] },
  blanca: { lana: '#ffffff', sombra: '#e3e1ee', manta: ['#9f63ff', '#2fc46f', '#ff9636'] },
  gris: { lana: '#d8d3ce', sombra: '#b9b2ab', manta: ['#2fb2ff', '#ff5d73', '#ffc93c'] },
}

const pata = { transformBox: 'fill-box', transformOrigin: '50% 8%' } as const

export function Llama({
  colores = LLAMAS.crema,
  corriendo = false,
  izquierda = false,
  tam = 120,
  x,
  y,
  className,
}: {
  colores?: ColoresLlama
  corriendo?: boolean
  /** Mira hacia la izquierda. */
  izquierda?: boolean
  tam?: number | string
  /** Posición, cuando la llama va dentro de otro dibujo SVG. */
  x?: number
  y?: number
  className?: string
}) {
  const { lana, sombra, manta } = colores
  return (
    <svg
      width={tam}
      height={tam}
      x={x}
      y={y}
      viewBox="0 0 120 130"
      className={`${corriendo ? 'corriendo' : ''} ${className ?? ''}`}
      style={izquierda ? { transform: 'scaleX(-1)' } : undefined}
      aria-hidden
    >
      <ellipse cx={60} cy={124} rx={40} ry={4.5} fill="rgb(30 20 60 / 0.16)" />
      {/* Patas de atrás, un poco más oscuras */}
      <g className="pata-b" style={pata}>
        <rect x={31} y={90} width={10} height={32} rx={5} fill={sombra} />
        <rect x={31} y={116} width={10} height={6} rx={3} fill="#6b4a3a" />
      </g>
      <g className="pata-a" style={pata}>
        <rect x={74} y={90} width={10} height={32} rx={5} fill={sombra} />
        <rect x={74} y={116} width={10} height={6} rx={3} fill="#6b4a3a" />
      </g>
      {/* Colita */}
      <circle cx={23} cy={74} r={7} fill={lana} />
      <circle cx={19} cy={80} r={5} fill={lana} />
      {/* Cuerpo esponjoso */}
      <rect x={22} y={62} width={74} height={38} rx={19} fill={lana} />
      {[30, 40, 50, 60, 70, 80, 88].map((x) => (
        <circle key={x} cx={x} cy={64} r={6.5} fill={lana} />
      ))}
      {[30, 42, 54, 66, 78, 88].map((x) => (
        <circle key={x} cx={x} cy={99} r={5.5} fill={lana} />
      ))}
      {/* Manta andina */}
      <g>
        <rect x={40} y={58} width={36} height={32} rx={7} fill={manta[0]} />
        <rect x={40} y={66} width={36} height={5} fill={manta[1]} />
        <rect x={40} y={75} width={36} height={4} fill={manta[2]} />
        <path d="M40 83 l4.5 -3.5 l4.5 3.5 l4.5 -3.5 l4.5 3.5 l4.5 -3.5 l4.5 3.5 l4.5 -3.5 l4.5 3.5" fill="none" stroke={manta[1]} strokeWidth={2} strokeLinejoin="round" />
        {[43, 51, 59, 67, 74].map((x, i) => (
          <circle key={x} cx={x} cy={92} r={2.6} fill={manta[i % 3]} />
        ))}
      </g>
      {/* Patas de adelante */}
      <g className="pata-a" style={pata}>
        <rect x={40} y={92} width={10} height={30} rx={5} fill={lana} />
        <rect x={40} y={116} width={10} height={6} rx={3} fill="#7d5845" />
      </g>
      <g className="pata-b" style={pata}>
        <rect x={84} y={92} width={10} height={30} rx={5} fill={lana} />
        <rect x={84} y={116} width={10} height={6} rx={3} fill="#7d5845" />
      </g>
      {/* Cuello */}
      <rect x={76} y={22} width={19} height={54} rx={9.5} fill={lana} />
      {[30, 40, 50, 60].map((y) => (
        <circle key={y} cx={77} cy={y} r={5} fill={lana} />
      ))}
      {/* Orejas con borlas */}
      <g>
        <ellipse cx={81} cy={10} rx={4.6} ry={10} transform="rotate(-16 81 10)" fill={lana} />
        <ellipse cx={81} cy={11} rx={2.2} ry={6.5} transform="rotate(-16 81 11)" fill="#ffb3c6" />
        <ellipse cx={94} cy={8} rx={4.6} ry={10} transform="rotate(14 94 8)" fill={lana} />
        <ellipse cx={94} cy={9} rx={2.2} ry={6.5} transform="rotate(14 94 9)" fill="#ffb3c6" />
        <circle cx={78} cy={17} r={3.4} fill={manta[1]} />
        <circle cx={97} cy={15} r={3.4} fill={manta[0]} />
      </g>
      {/* Cabeza */}
      <ellipse cx={90} cy={27} rx={17} ry={14} fill={lana} />
      <circle cx={84} cy={15} r={5} fill={lana} />
      <circle cx={90} cy={13.5} r={5.2} fill={lana} />
      <circle cx={95.5} cy={15.5} r={4.4} fill={lana} />
      <ellipse cx={103} cy={32} rx={9.5} ry={7.5} fill="#fff8ee" />
      <ellipse cx={108.5} cy={29} rx={1.3} ry={1} fill="#6b4a3a" />
      <path d="M102.5 35.5 q3.2 2.6 6.4 0" fill="none" stroke="#2b2d5c" strokeWidth={1.7} strokeLinecap="round" />
      <circle cx={95} cy={24} r={3.8} fill="#2b2d5c" />
      <circle cx={96.3} cy={22.6} r={1.4} fill="#ffffff" />
      <path d="M91.5 19.5 q3.5 -2.4 7 -0.4" fill="none" stroke="#2b2d5c" strokeWidth={1.3} strokeLinecap="round" />
      <ellipse cx={91} cy={32} rx={4} ry={2.6} fill="#ff8fab" opacity={0.75} />
    </svg>
  )
}
