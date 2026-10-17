// Ilustraciones de cada juego para el catálogo y la portada. Todas en SVG: pesan poco y se ven nítidas al proyectar.
import { useId } from 'react'
import { Cuy } from './motor/Cuy'
import { Robot, ROBOTS } from './motor/Robot'
import { Llama, LLAMAS } from './motor/Llama'

const marco = { viewBox: '0 0 160 100', className: 'block h-auto w-full', 'aria-hidden': true } as const

function Fondo({ de, a }: { de: string; a: string }) {
  // Cada dibujo tiene su propio degradado: la misma miniatura puede estar dos veces en pantalla.
  const id = useId()
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={de} />
          <stop offset="1" stopColor={a} />
        </linearGradient>
      </defs>
      <rect width={160} height={100} fill={`url(#${id})`} />
    </>
  )
}

function Globo({ x, y, c, texto, escala = 1 }: { x: number; y: number; c: string; texto: string; escala?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`}>
      <path d="M0 22 q-3 5 0 10 q3 5 0 10" fill="none" stroke="#5a5480" strokeWidth={0.8} />
      <ellipse cx={0} cy={0} rx={13} ry={16} fill={c} />
      <path d="M-3 17 L0 14 L3 17 Z" fill={c} />
      <ellipse cx={-5} cy={-6} rx={3} ry={5.5} fill="#fff" opacity={0.5} transform="rotate(25 -5 -6)" />
      <text y={4} textAnchor="middle" fontSize={11} fontWeight={700} fill="#fff" fontFamily="Fredoka, sans-serif">
        {texto}
      </text>
    </g>
  )
}

export function MiniGlobos() {
  return (
    <svg {...marco}>
      <Fondo de="#62bfff" a="#d8f1ff" />
      <circle cx={16} cy={14} r={11} fill="#ffd84a" />
      <ellipse cx={128} cy={20} rx={16} ry={6} fill="#fff" />
      <ellipse cx={138} cy={16} rx={10} ry={6} fill="#fff" />
      <rect x={44} y={6} width={72} height={18} rx={6} fill="#fff" />
      <text x={80} y={19} textAnchor="middle" fontSize={11} fontWeight={700} fill="#2b2d5c" fontFamily="Fredoka, sans-serif">
        7 × 8 = ?
      </text>
      <Globo x={34} y={56} c="#ff5d73" texto="54" />
      <Globo x={68} y={44} c="#2fc46f" texto="56" escala={1.1} />
      <Globo x={102} y={60} c="#9f63ff" texto="48" />
      <Globo x={134} y={48} c="#ff9636" texto="63" />
      <path d="M0 84 Q30 72 60 82 T120 80 T160 76 V100 H0 Z" fill="#7ad65a" />
      <path d="M0 92 Q40 82 85 90 T160 88 V100 H0 Z" fill="#4fbf45" />
    </svg>
  )
}

export function MiniRapido() {
  const colores = ['#ff5d73', '#ff9636', '#ffc93c', '#2fc46f', '#2fb2ff', '#9f63ff']
  const numeros = ['24', '28', '32', '36', '40', '45']
  return (
    <svg {...marco}>
      <Fondo de="#7b5cff" a="#4b37c9" />
      {Array.from({ length: 14 }, (_, i) => (
        <circle key={i} cx={(i * 37) % 160} cy={(i * 23) % 100} r={1.4} fill="#fff" opacity={0.35} />
      ))}
      <circle cx={26} cy={24} r={14} fill="#fff" />
      <circle cx={26} cy={24} r={11} fill="none" stroke="#e6e2ff" strokeWidth={4} />
      <path d="M26 13 A11 11 0 1 1 15.6 27.6" fill="none" stroke="#ff5d73" strokeWidth={4} strokeLinecap="round" />
      <text x={26} y={28} textAnchor="middle" fontSize={10} fontWeight={700} fill="#2b2d5c" fontFamily="Fredoka, sans-serif">
        42
      </text>
      <rect x={52} y={11} width={92} height={24} rx={7} fill="#fff" />
      <text x={98} y={28} textAnchor="middle" fontSize={13} fontWeight={700} fill="#2b2d5c" fontFamily="Fredoka, sans-serif">
        4 × 9
      </text>
      {numeros.map((n, i) => {
        const x = 14 + (i % 3) * 46
        const y = 44 + Math.floor(i / 3) * 27
        return (
          <g key={n}>
            <rect x={x} y={y + 3} width={40} height={20} rx={6} fill="rgb(20 10 60 / 0.35)" />
            <rect x={x} y={y} width={40} height={20} rx={6} fill={colores[i]} />
            <text x={x + 20} y={y + 14.5} textAnchor="middle" fontSize={12} fontWeight={700} fill={i === 2 ? '#5a3a00' : '#fff'} fontFamily="Fredoka, sans-serif">
              {n}
            </text>
          </g>
        )
      })}
      <path d="M150 40 l-8 14 h6 l-4 12 l11 -16 h-6 l5 -10 Z" fill="#ffc93c" />
    </svg>
  )
}

export function MiniSoga() {
  return (
    <svg {...marco}>
      <Fondo de="#8fd3ff" a="#e3f6ff" />
      <path d="M0 52 L30 26 L52 44 L80 18 L110 46 L130 30 L160 50 V100 H0 Z" fill="#a9b8d8" />
      <path d="M72 25 L80 18 L88 25 L84 24 L80 27 L76 24 Z" fill="#fff" />
      <rect y={60} width={160} height={40} fill="#7ad65a" />
      <ellipse cx={80} cy={82} rx={16} ry={5} fill="#8a5a3b" />
      <path d="M8 68 Q80 74 152 68" fill="none" stroke="#b07a42" strokeWidth={3} strokeLinecap="round" />
      <path d="M80 70 l-4 10 h8 Z" fill="#ff5d73" />
      <g transform="translate(6 40)">
        <Llama tam={34} colores={LLAMAS.crema} />
      </g>
      <g transform="translate(28 42)">
        <Llama tam={32} colores={LLAMAS.blanca} />
      </g>
      <g transform="translate(154 40) scale(-1 1)">
        <Llama tam={34} colores={LLAMAS.cafe} />
      </g>
      <g transform="translate(132 42) scale(-1 1)">
        <Llama tam={32} colores={LLAMAS.gris} />
      </g>
      <rect x={4} y={6} width={30} height={12} rx={6} fill="#ff5d73" />
      <rect x={126} y={6} width={30} height={12} rx={6} fill="#4f6dff" />
      <text x={19} y={15} textAnchor="middle" fontSize={8} fontWeight={700} fill="#fff" fontFamily="Fredoka, sans-serif">
        3
      </text>
      <text x={141} y={15} textAnchor="middle" fontSize={8} fontWeight={700} fill="#fff" fontFamily="Fredoka, sans-serif">
        2
      </text>
    </svg>
  )
}

export function MiniMemoria() {
  const cartas = [
    { x: 14, y: 12, tapada: true },
    { x: 50, y: 12, texto: '3/4' },
    { x: 86, y: 12, tapada: true },
    { x: 122, y: 12, tapada: true },
    { x: 14, y: 54, tapada: true },
    { x: 50, y: 54, tapada: true },
    { x: 86, y: 54, pastel: true },
    { x: 122, y: 54, tapada: true },
  ]
  return (
    <svg {...marco}>
      <Fondo de="#2fc46f" a="#16924f" />
      {cartas.map((c, i) => (
        <g key={i} transform={`rotate(${(i % 3) - 1} ${c.x + 12} ${c.y + 17})`}>
          <rect x={c.x} y={c.y + 2} width={24} height={34} rx={4} fill="rgb(0 40 20 / 0.3)" />
          {c.tapada ? (
            <>
              <rect x={c.x} y={c.y} width={24} height={34} rx={4} fill={['#ff5d73', '#4f6dff', '#ff9636', '#9f63ff'][i % 4]} />
              <rect x={c.x + 3} y={c.y + 3} width={18} height={28} rx={3} fill="none" stroke="#fff" strokeWidth={1} opacity={0.6} />
              <text x={c.x + 12} y={c.y + 22} textAnchor="middle" fontSize={13} fontWeight={700} fill="#fff" fontFamily="Fredoka, sans-serif">
                ?
              </text>
            </>
          ) : (
            <>
              <rect x={c.x} y={c.y} width={24} height={34} rx={4} fill="#fff" stroke="#ffc93c" strokeWidth={1.5} />
              {c.pastel ? (
                <g transform={`translate(${c.x + 12} ${c.y + 17})`}>
                  <circle r={8} fill="#fff" stroke="#2b2d5c" strokeWidth={1} />
                  <path d="M0 0 L0 -8 A8 8 0 1 1 -8 0 Z" fill="#ff9636" stroke="#2b2d5c" strokeWidth={1} />
                </g>
              ) : (
                <>
                  <text x={c.x + 12} y={c.y + 15} textAnchor="middle" fontSize={9} fontWeight={700} fill="#2b2d5c" fontFamily="Fredoka, sans-serif">
                    3
                  </text>
                  <rect x={c.x + 7} y={c.y + 17} width={10} height={1.2} fill="#2b2d5c" />
                  <text x={c.x + 12} y={c.y + 27} textAnchor="middle" fontSize={9} fontWeight={700} fill="#2b2d5c" fontFamily="Fredoka, sans-serif">
                    4
                  </text>
                </>
              )}
            </>
          )}
        </g>
      ))}
      <path d="M77 46 l2 4 4.5 .6 -3.3 3 .8 4.4 -4 -2.2 -4 2.2 .8 -4.4 -3.3 -3 4.5 -.6 Z" fill="#ffc93c" />
    </svg>
  )
}

export function MiniCarrera() {
  return (
    <svg {...marco}>
      <Fondo de="#ffcf8a" a="#ffeeda" />
      <circle cx={130} cy={22} r={10} fill="#ff9636" opacity={0.8} />
      <path d="M0 50 L26 22 L44 38 L70 12 L98 40 L118 26 L160 48 V70 H0 Z" fill="#9e8bd8" />
      <path d="M62 20 L70 12 L78 20 L74 19 L70 22 L66 19 Z" fill="#fff" />
      <rect y={56} width={160} height={44} fill="#8fd16a" />
      <rect y={62} width={160} height={14} fill="#e2b77f" />
      <rect y={80} width={160} height={14} fill="#e2b77f" />
      <path d="M0 78 H160" stroke="#fff" strokeWidth={1.2} strokeDasharray="5 4" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={i} x={144} y={62 + i * 4.6} width={4} height={4.6} fill={i % 2 ? '#2b2d5c' : '#fff'} />
      ))}
      <rect x={148} y={44} width={1.6} height={52} fill="#6b4a3a" />
      <path d="M149.6 44 h12 l-3 4 3 4 h-12 Z" fill="#ff5d73" />
      <g transform="translate(66 38)">
        <Llama tam={34} colores={LLAMAS.crema} />
      </g>
      <g transform="translate(34 56)">
        <Llama tam={34} colores={LLAMAS.cafe} />
      </g>
    </svg>
  )
}

export function MiniPalabra() {
  const letras = ['L', '', 'A', 'M', '']
  return (
    <svg {...marco}>
      <Fondo de="#ff9cc9" a="#ffe3f0" />
      {[
        { x: 52, y: 14, c: '#ff5d73' },
        { x: 64, y: 8, c: '#ffc93c' },
        { x: 76, y: 13, c: '#2fb2ff' },
        { x: 88, y: 9, c: '#2fc46f' },
      ].map((g, i) => (
        <g key={i}>
          <path d={`M${g.x} ${g.y + 9} L76 44`} stroke="#5a5480" strokeWidth={0.6} />
          <ellipse cx={g.x} cy={g.y} rx={7} ry={8.5} fill={g.c} />
          <ellipse cx={g.x - 2.5} cy={g.y - 3} rx={1.6} ry={3} fill="#fff" opacity={0.5} />
        </g>
      ))}
      <g transform="translate(58 36)">
        <Llama tam={36} colores={LLAMAS.blanca} />
      </g>
      {letras.map((l, i) => (
        <g key={i}>
          <rect x={28 + i * 22} y={78} width={18} height={16} rx={4} fill="#fff" />
          <text x={37 + i * 22} y={90.5} textAnchor="middle" fontSize={11} fontWeight={700} fill="#2b2d5c" fontFamily="Fredoka, sans-serif">
            {l}
          </text>
        </g>
      ))}
    </svg>
  )
}

export function MiniPupiletras() {
  const letras = ['NUBEQA', 'ROVAPE', 'LLUVIA', 'MARSOL', 'GTIERA']
  return (
    <svg {...marco}>
      <Fondo de="#6fe3cf" a="#17998f" />
      <rect x={34} y={8} width={92} height={84} rx={8} fill="#fff" />
      <line x1={44} y1={22} x2={86} y2={22} stroke="#ff9636" strokeOpacity={0.55} strokeWidth={11} strokeLinecap="round" />
      <line x1={44} y1={54} x2={114} y2={54} stroke="#2fb2ff" strokeOpacity={0.55} strokeWidth={11} strokeLinecap="round" />
      <line x1={58} y1={38} x2={100} y2={70} stroke="#ff6fbf" strokeOpacity={0.5} strokeWidth={11} strokeLinecap="round" />
      {letras.map((fila, f) =>
        [...fila].map((l, c) => (
          <text key={`${f}-${c}`} x={44 + c * 14} y={26 + f * 16} textAnchor="middle" fontSize={11} fontWeight={700} fill="#2b2d5c" fontFamily="Fredoka, sans-serif">
            {l}
          </text>
        )),
      )}
    </svg>
  )
}

export function MiniTopo() {
  return (
    <svg {...marco}>
      <Fondo de="#a6e98f" a="#45b03a" />
      <rect x={48} y={6} width={64} height={16} rx={5} fill="#fff" />
      <text x={80} y={18} textAnchor="middle" fontSize={10} fontWeight={700} fill="#2b2d5c" fontFamily="Fredoka, sans-serif">
        9 × 6 = ?
      </text>
      {[
        { x: 30, y: 62, texto: '54', arriba: true },
        { x: 80, y: 74, texto: '', arriba: false },
        { x: 130, y: 62, texto: '56', arriba: true },
      ].map((h, i) => (
        <g key={i}>
          <ellipse cx={h.x} cy={h.y + 14} rx={20} ry={6} fill="#4a2f22" />
          {h.arriba && (
            <>
              <rect x={h.x - 15} y={h.y - 30} width={30} height={14} rx={3} fill="#f6d6a3" stroke="#b7804a" strokeWidth={1.5} />
              <text x={h.x} y={h.y - 19.5} textAnchor="middle" fontSize={10} fontWeight={700} fill="#4a2c00" fontFamily="Fredoka, sans-serif">
                {h.texto}
              </text>
              <svg x={h.x - 15} y={h.y - 16} width={30} height={26} viewBox="0 0 100 80">
                <Cuy />
              </svg>
            </>
          )}
          <path d={`M${h.x - 22} ${h.y + 14} a22 7 0 0 0 44 0 Z`} fill="#8a5d3b" />
        </g>
      ))}
    </svg>
  )
}

export function MiniRuleta() {
  const colores = ['#ff5d73', '#ff9636', '#ffc93c', '#2fc46f', '#2fb2ff', '#4f6dff', '#9f63ff', '#ff6fbf']
  return (
    <svg {...marco}>
      <Fondo de="#ff8a9a" a="#c2185b" />
      <g transform="translate(80 54)">
        <circle r={40} fill="#fff" />
        {colores.map((c, i) => {
          const a0 = (i / 8) * 2 * Math.PI - Math.PI / 2
          const a1 = ((i + 1) / 8) * 2 * Math.PI - Math.PI / 2
          return <path key={c} d={`M0 0 L${38 * Math.cos(a0)} ${38 * Math.sin(a0)} A38 38 0 0 1 ${38 * Math.cos(a1)} ${38 * Math.sin(a1)} Z`} fill={c} stroke="#fff" strokeWidth={1} />
        })}
        <circle r={7} fill="#fff" stroke="#ffc93c" strokeWidth={2} />
      </g>
      <path d="M72 6 H88 L80 22 Z" fill="#ffc93c" stroke="#fff" strokeWidth={2} strokeLinejoin="round" />
    </svg>
  )
}

export function MiniDuelo() {
  return (
    <svg {...marco}>
      <Fondo de="#2a1158" a="#090a1c" />
      <path d="M0 62 V44 h10 V34 h9 V50 h8 V28 h11 V42 h9 V22 h12 V46 h7 V36 h10 V52 h9 V30 h13 V44 h8 V26 h11 V48 h9 V38 h10 V54 h9 V40 h10 V62 Z" fill="#1a1440" />
      <rect y={62} width={160} height={1.4} fill="#ff3dc8" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <line key={i} x1={80} y1={63} x2={-60 + i * 35} y2={100} stroke="#ff3dc8" strokeOpacity={0.45} strokeWidth={0.8} />
      ))}
      {[70, 78, 90].map((y) => (
        <line key={y} x1={0} y1={y} x2={160} y2={y} stroke="#ff3dc8" strokeOpacity={0.4} strokeWidth={0.8} />
      ))}
      <rect x={8} y={8} width={58} height={6} rx={1.5} fill="#3a0d1f" stroke="#fff" strokeOpacity={0.7} strokeWidth={0.8} />
      <rect x={8} y={8} width={40} height={6} rx={1.5} fill="#22e3f5" />
      <rect x={94} y={8} width={58} height={6} rx={1.5} fill="#3a0d1f" stroke="#fff" strokeOpacity={0.7} strokeWidth={0.8} />
      <rect x={118} y={8} width={34} height={6} rx={1.5} fill="#ff3dc8" />
      <text x={80} y={15} textAnchor="middle" fontSize={8} fill="#ffc23d" fontFamily="'Russo One', sans-serif">
        VS
      </text>
      <svg x={22} y={30} width={44} height={56} viewBox="0 0 120 150">
        <Robot colores={ROBOTS.volt} />
      </svg>
      <g transform="translate(138 0) scale(-1 1)">
        <svg x={0} y={30} width={44} height={56} viewBox="0 0 120 150">
          <Robot colores={ROBOTS.nova} />
        </svg>
      </g>
      <path d="M80 44 l3 6 6 1 -4.5 4 1.2 6 -5.7 -3 -5.7 3 1.2 -6 -4.5 -4 6 -1 Z" fill="#fff6a8" />
    </svg>
  )
}

export function MiniInvasion() {
  const dron = (x: number, y: number, c: string, t: string) => (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-14 0 L-9 -8 H9 L14 0 L9 8 H-9 Z" fill="#1d2048" stroke={c} strokeWidth={1.4} />
      <circle r={3.4} fill={c} />
      <rect x={-10} y={11} width={20} height={9} rx={2} fill="#0b0d24" stroke={c} strokeWidth={1} />
      <text y={18.2} textAnchor="middle" fontSize={7} fill="#fff" fontFamily="'Russo One', sans-serif">
        {t}
      </text>
    </g>
  )
  return (
    <svg {...marco}>
      <Fondo de="#05051a" a="#3b1470" />
      {[12, 40, 66, 98, 120, 148, 30, 84, 134].map((x, i) => (
        <circle key={i} cx={x} cy={(i * 23) % 60 + 4} r={0.8} fill="#fff" opacity={0.8} />
      ))}
      {dron(34, 30, '#22e3f5', '54')}
      {dron(80, 18, '#ff3dc8', '56')}
      {dron(124, 34, '#b6ff3b', '48')}
      <line x1={80} y1={84} x2={80} y2={30} stroke="#b6ff3b" strokeWidth={2} />
      <rect y={86} width={160} height={1.2} fill="#ff3dc8" />
      <path d="M66 100 Q66 86 80 84 Q94 86 94 100 Z" fill="#1d2048" stroke="#22e3f5" strokeWidth={1.5} />
    </svg>
  )
}

export function MiniConcurso() {
  const fichas = [
    { c: '#e21b3c', d: 'M0 -6 L6 5 H-6 Z' },
    { c: '#1368ce', d: 'M0 -6 L6 0 L0 6 L-6 0 Z' },
    { c: '#d89e00', d: 'M0 -6 A6 6 0 1 1 -0.1 -6 Z' },
    { c: '#26890c', d: 'M-5 -5 H5 V5 H-5 Z' },
  ]
  return (
    <svg {...marco}>
      <rect width={160} height={100} fill="#46178f" />
      <circle cx={18} cy={82} r={20} fill="#fff" opacity={0.07} />
      <rect x={10} y={6} width={140} height={18} rx={3} fill="#fff" />
      <text x={80} y={19} textAnchor="middle" fontSize={10} fontWeight={700} fill="#2b2d5c" fontFamily="Fredoka, sans-serif">
        ¿Cuánto es 8 × 7?
      </text>
      <circle cx={22} cy={40} r={9} fill="#864cbf" />
      <text x={22} y={43.5} textAnchor="middle" fontSize={9} fontWeight={700} fill="#fff" fontFamily="Fredoka, sans-serif">
        18
      </text>
      <rect x={124} y={33} width={28} height={14} rx={3} fill="#2e0f63" />
      <text x={138} y={43} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="#fff" fontFamily="Fredoka, sans-serif">
        2 450
      </text>
      {fichas.map((f, i) => {
        const x = 8 + (i % 2) * 74
        const y = 54 + Math.floor(i / 2) * 22
        return (
          <g key={i}>
            <rect x={x} y={y} width={70} height={19} rx={2.5} fill={f.c} />
            <path d={f.d} transform={`translate(${x + 11} ${y + 9.5})`} fill="#fff" />
            <text x={x + 40} y={y + 13} textAnchor="middle" fontSize={9} fontWeight={700} fill="#fff" fontFamily="Fredoka, sans-serif">
              {['54', '56', '48', '63'][i]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
