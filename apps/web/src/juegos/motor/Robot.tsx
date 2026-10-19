// Robots de pelea para el Duelo: metal y neón, sin sangre. Miran a la derecha; el de la derecha se refleja.

export type ColoresRobot = { neon: string; metal: string; oscuro: string }

export const ROBOTS: Record<'volt' | 'nova', ColoresRobot & { nombre: string }> = {
  volt: { nombre: 'VOLT', neon: '#22e3f5', metal: '#3d4f86', oscuro: '#232c55' },
  nova: { nombre: 'NOVA', neon: '#ff3dc8', metal: '#6b3f8f', oscuro: '#36214f' },
}

export function Robot({ colores, className }: { colores: ColoresRobot; className?: string }) {
  const { neon, metal, oscuro } = colores
  const brillo = { filter: `drop-shadow(0 0 3px ${neon}) drop-shadow(0 0 6px ${neon})` }
  return (
    <svg viewBox="0 0 120 150" className={className} aria-hidden>
      <ellipse cx={60} cy={146} rx={36} ry={4} fill="rgb(0 0 0 / 0.45)" />
      {/* Brazo de atrás */}
      <rect x={24} y={58} width={15} height={30} rx={7} fill={oscuro} />
      <rect x={20} y={84} width={22} height={19} rx={6} fill={oscuro} stroke={neon} strokeOpacity={0.5} strokeWidth={1.5} />
      {/* Piernas */}
      <rect x={42} y={98} width={15} height={40} rx={6} fill={oscuro} />
      <rect x={64} y={98} width={15} height={40} rx={6} fill={metal} />
      <rect x={66} y={112} width={11} height={5} rx={2} fill={neon} style={brillo} />
      <rect x={37} y={134} width={24} height={10} rx={4} fill={oscuro} />
      <rect x={61} y={134} width={27} height={10} rx={4} fill={oscuro} />
      {/* Torso */}
      <rect x={33} y={50} width={54} height={52} rx={14} fill={metal} />
      <path d="M40 60 h40 l-6 22 h-28 Z" fill={oscuro} opacity={0.55} />
      <circle cx={60} cy={72} r={8} fill={neon} style={brillo} />
      <circle cx={60} cy={72} r={3.5} fill="#ffffff" opacity={0.85} />
      <rect x={36} y={94} width={48} height={8} rx={3} fill={oscuro} />
      {/* Cabeza */}
      <line x1={52} y1={4} x2={52} y2={16} stroke={oscuro} strokeWidth={3} />
      <circle cx={52} cy={4} r={3.2} fill={neon} style={brillo} />
      <rect x={40} y={14} width={42} height={34} rx={11} fill={metal} />
      <rect x={42} y={38} width={38} height={8} rx={3} fill={oscuro} opacity={0.6} />
      <rect x={55} y={25} width={26} height={9} rx={4.5} fill={neon} style={brillo} />
      <rect x={70} y={27} width={6} height={3} rx={1.5} fill="#ffffff" opacity={0.9} />
      {/* Brazo de adelante, en guardia */}
      <circle cx={82} cy={60} r={9} fill={oscuro} />
      <rect x={80} y={56} width={26} height={13} rx={6} fill={metal} />
      <rect x={98} y={48} width={21} height={24} rx={7} fill={metal} stroke={neon} strokeWidth={2} />
      <rect x={103} y={53} width={3} height={14} rx={1.5} fill={neon} style={brillo} />
      <rect x={109} y={53} width={3} height={14} rx={1.5} fill={neon} style={brillo} />
    </svg>
  )
}
