// Un cuy tricolor, el que sale de los huecos en el Topo.
export function Cuy({ mareado = false, className }: { mareado?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 100 80" className={className} aria-hidden>
      {/* Orejas */}
      <circle cx={24} cy={22} r={10} fill="#a8703f" />
      <circle cx={24} cy={23} r={5} fill="#ffb3c6" />
      <circle cx={76} cy={22} r={10} fill="#a8703f" />
      <circle cx={76} cy={23} r={5} fill="#ffb3c6" />
      {/* Cabeza y cuerpo */}
      <ellipse cx={50} cy={50} rx={40} ry={32} fill="#c98d5c" />
      <ellipse cx={64} cy={56} rx={22} ry={22} fill="#fff7ec" />
      <ellipse cx={30} cy={36} rx={13} ry={11} fill="#4a3428" />
      {/* Ojos */}
      {mareado ? (
        <>
          <path d="M33 38 l8 8 M41 38 l-8 8" stroke="#2b2d5c" strokeWidth={3} strokeLinecap="round" />
          <path d="M59 38 l8 8 M67 38 l-8 8" stroke="#2b2d5c" strokeWidth={3} strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx={37} cy={42} r={5.5} fill="#2b2d5c" />
          <circle cx={39} cy={40} r={1.9} fill="#fff" />
          <circle cx={63} cy={42} r={5.5} fill="#2b2d5c" />
          <circle cx={65} cy={40} r={1.9} fill="#fff" />
        </>
      )}
      {/* Nariz, boca y cachetes */}
      <ellipse cx={50} cy={53} rx={4.5} ry={3.2} fill="#ff7a9a" />
      <path d="M44 58 q3 4 6 0 q3 4 6 0" fill="none" stroke="#2b2d5c" strokeWidth={2} strokeLinecap="round" />
      <ellipse cx={30} cy={56} rx={6} ry={3.6} fill="#ff8fab" opacity={0.65} />
      <ellipse cx={70} cy={56} rx={6} ry={3.6} fill="#ff8fab" opacity={0.65} />
      {/* Patitas */}
      <ellipse cx={34} cy={74} rx={7} ry={5} fill="#a8703f" />
      <ellipse cx={66} cy={74} rx={7} ry={5} fill="#a8703f" />
    </svg>
  )
}
