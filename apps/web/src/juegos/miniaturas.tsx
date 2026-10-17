// Ilustraciones de cada juego para el catálogo y la portada. Todas en SVG: pesan poco y se ven nítidas al proyectar.
// Muestran el contenido elegido (muestraDe): si el tema es de fracciones, Globos muestra fracciones y no "7 × 8".
// Sin muestra, cada una tiene su dibujo de siempre.
import { useId } from 'react'
import { crearAzar } from './motor/azar'
import { Cuy } from './motor/Cuy'
import { Robot, ROBOTS } from './motor/Robot'
import { Llama, LLAMAS } from './motor/Llama'
import type { Contenido, Lado, Muestra, Reto, Visual } from './tipos'

const marco = { viewBox: '0 0 160 100', className: 'block h-auto w-full', 'aria-hidden': true } as const

// ---------- La muestra del contenido ----------

const largo = (t: string) => [...t].length

/**
 * Un ejemplo corto del contenido para dibujarlo: en una miniatura solo caben textos breves. La respuesta correcta
 * queda en `opciones[1]` (el globo grande, el dron del láser, el cartel del cuy).
 */
export function muestraDe(c: Contenido): Muestra {
  const azar = crearAzar(7)
  const candidatos: Reto[] = c.generar ? Array.from({ length: 12 }, () => c.generar!(azar)) : c.retos
  const peso = (r: Reto) => Math.max(largo(r.pregunta || r.consigna || '') / 3, largo(r.respuesta), ...r.distractores.slice(0, 3).map(largo))
  const r = candidatos.filter((x) => x.distractores.length > 0).sort((a, b) => peso(a) - peso(b))[0]
  const palabras = c.palabras.map((p) => p.palabra.toUpperCase()).filter((p) => /^[A-ZÁÉÍÓÚÑÜ]{3,}$/.test(p))
  return {
    reto: r && { pregunta: r.pregunta || r.consigna || '', visual: r.visual, opciones: [r.distractores[0], r.respuesta, ...r.distractores.slice(1, 5)] },
    par: c.pares.find((p) => (p.a.visual || largo(p.a.texto) <= 9) && (p.b.visual || largo(p.b.texto) <= 9)) ?? c.pares[0],
    palabras: [...palabras].sort((a, b) => largo(a) - largo(b)),
  }
}

const cabe = (texto: string, s: number, w: number) => largo(texto) * s * 0.56 <= w

/** El tamaño de letra con el que entran todos los textos de un grupo (botones, globos), sin bajar de `min`. */
function tamComun(textos: string[], w: number, tam: number, min: number) {
  let s = tam
  while (s > min && textos.some((t) => !cabe(t, s, w))) s -= 0.5
  return s
}

/** Texto que entra en `w`: achica la letra hasta `min` (legible) y, si aun así no entra, lo corta con "…". `y` es el centro. */
function Texto({ x, y, w, t, tam, min = 7, fill = '#2b2d5c', fuente = 'Fredoka, sans-serif' }: { x: number; y: number; w: number; t: string; tam: number; min?: number; fill?: string; fuente?: string }) {
  let s = tam
  while (s > min && !cabe(t, s, w)) s -= 0.5
  let texto = t
  while (!cabe(texto, s, w) && largo(texto) > 2) texto = `${[...texto].slice(0, -2).join('')}…`
  return (
    <text x={x} y={y + s * 0.36} textAnchor="middle" fontSize={s} fontWeight={700} fill={fill} fontFamily={fuente}>
      {texto}
    </text>
  )
}

/** Pastel de fracción: k de n porciones pintadas. */
function PastelMini({ x, y, r, partes: [k, n] }: { x: number; y: number; r: number; partes: [number, number] }) {
  const punto = (i: number) => {
    const a = (i / n) * 2 * Math.PI - Math.PI / 2
    return `${x + r * Math.cos(a)} ${y + r * Math.sin(a)}`
  }
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#fff" stroke="#2b2d5c" strokeWidth={0.8} />
      {Array.from({ length: n }, (_, i) => (
        <path key={i} d={`M${x} ${y} L${punto(i)} A${r} ${r} 0 0 1 ${punto(i + 1)} Z`} fill={i < k ? '#ff9636' : '#fff'} stroke="#2b2d5c" strokeWidth={0.6} />
      ))}
    </g>
  )
}

function VisualMini({ x, y, tam, visual }: { x: number; y: number; tam: number; visual: Visual }) {
  if (visual.tipo === 'fraccion') return <PastelMini x={x} y={y} r={tam / 2} partes={visual.partes} />
  return <Texto x={x} y={y} w={tam * 2.6} t={visual.figura.repeat(Math.min(visual.cantidad, 5))} tam={tam * 0.55} />
}

/** La pregunta de la muestra dentro de un recuadro de ancho `w` centrado en (x, y). */
function Pregunta({ x, y, w, tam, muestra, defecto }: { x: number; y: number; w: number; tam: number; muestra?: Muestra; defecto: string }) {
  const r = muestra?.reto
  if (r?.visual) {
    return (
      <g>
        <VisualMini x={x - tam * 0.7} y={y} tam={tam * 1.3} visual={r.visual} />
        <Texto x={x + tam * 0.9} y={y} w={tam * 2} t="= ?" tam={tam} />
      </g>
    )
  }
  return <Texto x={x} y={y} w={w} t={r?.pregunta || defecto} tam={tam} />
}

/** Las opciones de la muestra, o las de siempre. */
const opciones = (muestra: Muestra | undefined, defecto: string[]) => {
  const o = muestra?.reto?.opciones.filter(Boolean)
  return o && o.length >= 2 ? o : defecto
}

/** Un lado de una pareja en una carta: su dibujo, una fracción apilada o el texto. */
function LadoMini({ x, y, lado }: { x: number; y: number; lado: Lado }) {
  if (lado.visual) return <VisualMini x={x} y={y} tam={16} visual={lado.visual} />
  const f = /^(\d+)\/(\d+)$/.exec(lado.texto)
  if (f) {
    return (
      <g>
        <Texto x={x} y={y - 5} w={20} t={f[1]} tam={9} />
        <rect x={x - 5} y={y - 0.6} width={10} height={1.2} fill="#2b2d5c" />
        <Texto x={x} y={y + 6} w={20} t={f[2]} tam={9} />
      </g>
    )
  }
  return <Texto x={x} y={y} w={21} t={lado.texto} tam={8} min={5.5} />
}

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

function Globo({ x, y, c, texto, escala = 1, tam = 11 }: { x: number; y: number; c: string; texto: string; escala?: number; tam?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`}>
      <path d="M0 22 q-3 5 0 10 q3 5 0 10" fill="none" stroke="#5a5480" strokeWidth={0.8} />
      <ellipse cx={0} cy={0} rx={13} ry={16} fill={c} />
      <path d="M-3 17 L0 14 L3 17 Z" fill={c} />
      <ellipse cx={-5} cy={-6} rx={3} ry={5.5} fill="#fff" opacity={0.5} transform="rotate(25 -5 -6)" />
      <Texto x={0} y={0} w={24} t={texto} tam={tam} min={tam} fill="#fff" />
    </g>
  )
}

export function MiniGlobos({ muestra }: { muestra?: Muestra }) {
  const [a, b, c, d] = opciones(muestra, ['54', '56', '48', '63'])
  const t = tamComun([a, b, c, d].filter(Boolean), 24, 11, 6.5)
  return (
    <svg {...marco}>
      <Fondo de="#62bfff" a="#d8f1ff" />
      <circle cx={16} cy={14} r={11} fill="#ffd84a" />
      <ellipse cx={128} cy={20} rx={16} ry={6} fill="#fff" />
      <ellipse cx={138} cy={16} rx={10} ry={6} fill="#fff" />
      <rect x={36} y={4} width={88} height={22} rx={6} fill="#fff" />
      <Pregunta x={80} y={15} w={82} tam={11} muestra={muestra} defecto="7 × 8 = ?" />
      <Globo x={34} y={56} c="#ff5d73" texto={a} tam={t} />
      <Globo x={68} y={44} c="#2fc46f" texto={b} escala={1.1} tam={t} />
      {c && <Globo x={102} y={60} c="#9f63ff" texto={c} tam={t} />}
      {d && <Globo x={134} y={48} c="#ff9636" texto={d} tam={t} />}
      <path d="M0 84 Q30 72 60 82 T120 80 T160 76 V100 H0 Z" fill="#7ad65a" />
      <path d="M0 92 Q40 82 85 90 T160 88 V100 H0 Z" fill="#4fbf45" />
    </svg>
  )
}

export function MiniRapido({ muestra }: { muestra?: Muestra }) {
  const colores = ['#ff5d73', '#ff9636', '#ffc93c', '#2fc46f', '#2fb2ff', '#9f63ff']
  const numeros = opciones(muestra, ['24', '28', '32', '36', '40', '45']).slice(0, 6)
  const t = tamComun(numeros, 36, 12, 7)
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
      <Pregunta x={98} y={23} w={86} tam={13} muestra={muestra} defecto="4 × 9" />
      {numeros.map((n, i) => {
        const x = 14 + (i % 3) * 46
        const y = 44 + Math.floor(i / 3) * 27
        return (
          <g key={i}>
            <rect x={x} y={y + 3} width={40} height={20} rx={6} fill="rgb(20 10 60 / 0.35)" />
            <rect x={x} y={y} width={40} height={20} rx={6} fill={colores[i]} />
            <Texto x={x + 20} y={y + 10} w={36} t={n} tam={t} min={t} fill={i === 2 ? '#5a3a00' : '#fff'} />
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

export function MiniMemoria({ muestra }: { muestra?: Muestra }) {
  const par = muestra?.par
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
              {par ? (
                <LadoMini x={c.x + 12} y={c.y + 17} lado={c.pastel ? par.b : par.a} />
              ) : c.pastel ? (
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

export function MiniPalabra({ muestra }: { muestra?: Muestra }) {
  // La palabra más corta del tema, con algunas letras por descubrir.
  const palabra = muestra?.palabras.find((p) => largo(p) <= 7)
  const letras = palabra ? [...palabra].map((l, i) => (i % 3 === 1 ? '' : l)) : ['L', '', 'A', 'M', '']
  const caja = Math.min(18, 128 / letras.length - 4)
  const inicio = 80 - (letras.length * (caja + 4) - 4) / 2
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
          <rect x={inicio + i * (caja + 4)} y={78} width={caja} height={16} rx={4} fill="#fff" />
          <Texto x={inicio + i * (caja + 4) + caja / 2} y={86} w={caja} t={l} tam={11} />
        </g>
      ))}
    </svg>
  )
}

/** Una sopa de 6 × 5 con hasta dos palabras del tema en filas, rellenada siempre igual. */
function sopa(palabras: string[]) {
  const cortas = palabras.filter((p) => largo(p) <= 6).slice(0, 2)
  if (!cortas.length) return null
  const azar = crearAzar(3)
  const relleno = () => 'ABCDEFGILMNOPRSTU'[Math.floor(azar() * 17)]
  const filas = Array.from({ length: 5 }, () => Array.from({ length: 6 }, relleno))
  cortas.forEach((p, i) => [...p].forEach((l, c) => (filas[i * 2 + 1][c] = l)))
  return { filas: filas.map((f) => f.join('')), cortas }
}

export function MiniPupiletras({ muestra }: { muestra?: Muestra }) {
  const propia = muestra && sopa(muestra.palabras)
  const letras = propia?.filas ?? ['NUBEQA', 'ROVAPE', 'LLUVIA', 'MARSOL', 'GTIERA']
  return (
    <svg {...marco}>
      <Fondo de="#6fe3cf" a="#17998f" />
      <rect x={34} y={8} width={92} height={84} rx={8} fill="#fff" />
      {propia ? (
        propia.cortas.map((p, i) => (
          <line key={p} x1={44} y1={38 + i * 32} x2={44 + (largo(p) - 1) * 14} y2={38 + i * 32} stroke={i ? '#2fb2ff' : '#ff9636'} strokeOpacity={0.55} strokeWidth={11} strokeLinecap="round" />
        ))
      ) : (
        <>
          <line x1={44} y1={22} x2={86} y2={22} stroke="#ff9636" strokeOpacity={0.55} strokeWidth={11} strokeLinecap="round" />
          <line x1={44} y1={54} x2={114} y2={54} stroke="#2fb2ff" strokeOpacity={0.55} strokeWidth={11} strokeLinecap="round" />
          <line x1={58} y1={38} x2={100} y2={70} stroke="#ff6fbf" strokeOpacity={0.5} strokeWidth={11} strokeLinecap="round" />
        </>
      )}
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

export function MiniTopo({ muestra }: { muestra?: Muestra }) {
  const [mal, bien] = opciones(muestra, ['56', '54'])
  const t = tamComun([mal, bien], 27, 10, 7)
  return (
    <svg {...marco}>
      <Fondo de="#a6e98f" a="#45b03a" />
      <rect x={40} y={4} width={80} height={20} rx={5} fill="#fff" />
      <Pregunta x={80} y={14} w={74} tam={10} muestra={muestra} defecto="9 × 6 = ?" />
      {[
        { x: 30, y: 62, texto: bien, arriba: true },
        { x: 80, y: 74, texto: '', arriba: false },
        { x: 130, y: 62, texto: mal, arriba: true },
      ].map((h, i) => (
        <g key={i}>
          <ellipse cx={h.x} cy={h.y + 14} rx={20} ry={6} fill="#4a2f22" />
          {h.arriba && (
            <>
              <rect x={h.x - 15} y={h.y - 30} width={30} height={14} rx={3} fill="#f6d6a3" stroke="#b7804a" strokeWidth={1.5} />
              <Texto x={h.x} y={h.y - 23} w={27} t={h.texto} tam={t} min={t} fill="#4a2c00" />
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

export function MiniInvasion({ muestra }: { muestra?: Muestra }) {
  const [uno, dos, tres] = opciones(muestra, ['54', '56', '48'])
  const t = tamComun([uno, dos, tres].filter(Boolean), 19, 7, 5.5)
  const dron = (x: number, y: number, c: string, texto: string) => (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-14 0 L-9 -8 H9 L14 0 L9 8 H-9 Z" fill="#1d2048" stroke={c} strokeWidth={1.4} />
      <circle r={3.4} fill={c} />
      <rect x={-10} y={11} width={20} height={9} rx={2} fill="#0b0d24" stroke={c} strokeWidth={1} />
      <Texto x={0} y={15.5} w={19} t={texto} tam={t} min={t} fill="#fff" fuente="'Russo One', sans-serif" />
    </g>
  )
  return (
    <svg {...marco}>
      <Fondo de="#05051a" a="#3b1470" />
      {[12, 40, 66, 98, 120, 148, 30, 84, 134].map((x, i) => (
        <circle key={i} cx={x} cy={(i * 23) % 60 + 4} r={0.8} fill="#fff" opacity={0.8} />
      ))}
      {dron(34, 30, '#22e3f5', uno)}
      {dron(80, 18, '#ff3dc8', dos)}
      {tres && dron(124, 34, '#b6ff3b', tres)}
      <line x1={80} y1={84} x2={80} y2={30} stroke="#b6ff3b" strokeWidth={2} />
      <rect y={86} width={160} height={1.2} fill="#ff3dc8" />
      <path d="M66 100 Q66 86 80 84 Q94 86 94 100 Z" fill="#1d2048" stroke="#22e3f5" strokeWidth={1.5} />
    </svg>
  )
}

export function MiniConcurso({ muestra }: { muestra?: Muestra }) {
  const textos = opciones(muestra, ['54', '56', '48', '63']).slice(0, 4)
  const t = tamComun(textos, 50, 9, 7)
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
      <Pregunta x={80} y={15} w={134} tam={10} muestra={muestra} defecto="¿Cuánto es 8 × 7?" />
      <circle cx={22} cy={40} r={9} fill="#864cbf" />
      <text x={22} y={43.5} textAnchor="middle" fontSize={9} fontWeight={700} fill="#fff" fontFamily="Fredoka, sans-serif">
        18
      </text>
      <rect x={124} y={33} width={28} height={14} rx={3} fill="#2e0f63" />
      <text x={138} y={43} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="#fff" fontFamily="Fredoka, sans-serif">
        2 450
      </text>
      {fichas.slice(0, textos.length).map((f, i) => {
        const x = 8 + (i % 2) * 74
        const y = 54 + Math.floor(i / 2) * 22
        return (
          <g key={i}>
            <rect x={x} y={y} width={70} height={19} rx={2.5} fill={f.c} />
            <path d={f.d} transform={`translate(${x + 11} ${y + 9.5})`} fill="#fff" />
            <Texto x={x + 40} y={y + 9.5} w={50} t={textos[i]} tam={t} min={t} fill="#fff" />
          </g>
        )
      })}
    </svg>
  )
}

/** "7 × 8 = 56", "45 < 54" o la pregunta: la afirmación que muestra la carta de Verdad o mentira. */
function afirmacion(muestra: Muestra | undefined) {
  const r = muestra?.reto
  if (!r) return '7 × 8 = 54'
  const propuesta = r.opciones[0] ?? r.opciones[1]
  if (/=\s*\?$/.test(r.pregunta)) return r.pregunta.replace(/\?$/, propuesta)
  if (r.pregunta.includes('▢')) return r.pregunta.replace('▢', propuesta)
  return propuesta
}

export function MiniVerdad({ muestra }: { muestra?: Muestra }) {
  const r = muestra?.reto
  return (
    <svg {...marco}>
      <Fondo de="#3dd6c4" a="#2f7bff" />
      <rect x={48} y={14} width={64} height={58} rx={7} fill="#fff" opacity={0.45} transform="rotate(-6 80 43)" />
      <g transform="rotate(5 80 40)">
        <rect x={42} y={8} width={76} height={62} rx={7} fill="#fff" />
        <text x={80} y={20} textAnchor="middle" fontSize={5.5} fontWeight={700} fill="#8a8fb8" fontFamily="Fredoka, sans-serif">
          ¿ES CORRECTO?
        </text>
        {r?.visual ? (
          <>
            <VisualMini x={70} y={42} tam={20} visual={r.visual} />
            <Texto x={96} y={42} w={30} t={`= ${r.opciones[0]}`} tam={10} />
          </>
        ) : (
          <Texto x={80} y={42} w={68} t={afirmacion(muestra)} tam={12} />
        )}
        <rect x={50} y={52} width={30} height={10} rx={2} fill="none" stroke="#1f9d55" strokeWidth={1.2} transform="rotate(-10 65 57)" />
        <text x={65} y={59.5} textAnchor="middle" fontSize={6} fontWeight={700} fill="#1f9d55" fontFamily="Fredoka, sans-serif" transform="rotate(-10 65 57)">
          VERDAD
        </text>
      </g>
      <rect x={16} y={78} width={58} height={16} rx={5} fill="#ff5d73" />
      <text x={45} y={89.5} textAnchor="middle" fontSize={9} fontWeight={700} fill="#fff" fontFamily="Fredoka, sans-serif">
        ✕ Mentira
      </text>
      <rect x={86} y={78} width={58} height={16} rx={5} fill="#2fc46f" />
      <text x={115} y={89.5} textAnchor="middle" fontSize={9} fontWeight={700} fill="#fff" fontFamily="Fredoka, sans-serif">
        ✓ Verdad
      </text>
    </svg>
  )
}

export function MiniUne({ muestra }: { muestra?: Muestra }) {
  const par = muestra?.par
  const filas = [14, 42, 70]
  return (
    <svg {...marco}>
      <Fondo de="#ffd166" a="#ff7aa2" />
      <line x1={58} y1={filas[0] + 9} x2={102} y2={filas[2] + 9} stroke="#fff" strokeWidth={5} strokeLinecap="round" />
      <line x1={58} y1={filas[0] + 9} x2={102} y2={filas[2] + 9} stroke="#4f6dff" strokeWidth={3} strokeLinecap="round" />
      <line x1={58} y1={filas[1] + 9} x2={102} y2={filas[0] + 9} stroke="#fff" strokeWidth={5} strokeLinecap="round" />
      <line x1={58} y1={filas[1] + 9} x2={102} y2={filas[0] + 9} stroke="#2fc46f" strokeWidth={3} strokeLinecap="round" />
      {filas.map((y, i) => (
        <g key={i}>
          <rect x={14} y={y} width={44} height={18} rx={4} fill={i === 0 ? '#4f6dff' : i === 1 ? '#2fc46f' : '#fff'} />
          <rect x={102} y={y} width={44} height={18} rx={4} fill={i === 2 ? '#4f6dff' : i === 0 ? '#2fc46f' : '#fff'} />
        </g>
      ))}
      {par ? (
        <>
          <LadoMiniEn x={36} y={filas[0] + 9} lado={par.a} claro />
          <LadoMiniEn x={124} y={filas[2] + 9} lado={par.b} claro />
        </>
      ) : (
        <>
          <Texto x={36} y={filas[0] + 9} w={40} t="7 × 8" tam={9} fill="#fff" />
          <Texto x={124} y={filas[2] + 9} w={40} t="56" tam={9} fill="#fff" />
        </>
      )}
      <rect x={22} y={filas[2] + 7} width={28} height={4} rx={2} fill="#e3d7ff" />
      <rect x={110} y={filas[1] + 7} width={28} height={4} rx={2} fill="#e3d7ff" />
      <circle cx={58} cy={filas[0] + 9} r={2.6} fill="#4f6dff" stroke="#fff" />
      <circle cx={102} cy={filas[2] + 9} r={2.6} fill="#4f6dff" stroke="#fff" />
    </svg>
  )
}

/** Un lado de una pareja dentro de una tarjeta de color (texto blanco). */
function LadoMiniEn({ x, y, lado, claro }: { x: number; y: number; lado: Lado; claro?: boolean }) {
  if (lado.visual) return <VisualMini x={x} y={y} tam={14} visual={lado.visual} />
  return <Texto x={x} y={y} w={40} t={lado.texto} tam={9} min={6} fill={claro ? '#fff' : '#2b2d5c'} />
}

export function MiniCondor({ muestra }: { muestra?: Muestra }) {
  const [mal, bien] = opciones(muestra, ['63', '56'])
  const t = tamComun([mal, bien], 30, 10, 6.5)
  return (
    <svg {...marco}>
      <Fondo de="#5ab8ff" a="#e6f6ff" />
      <path d="M0 92 L0 66 L28 46 L50 62 L82 36 L112 60 L136 44 L160 58 V92 Z" fill="#9db3d9" />
      <path d="M76 41 L82 36 L88 42 L84 41 Z M130 48 L136 44 L142 49 Z" fill="#fff" />
      <rect y={90} width={160} height={10} fill="#8fd16a" />
      {/* Muro de nubes con dos huecos */}
      <rect x={104} y={-4} width={26} height={30} rx={8} fill="#fff" />
      <rect x={104} y={46} width={26} height={12} rx={6} fill="#fff" />
      <rect x={104} y={78} width={26} height={14} rx={7} fill="#fff" />
      <rect x={100} y={29} width={34} height={14} rx={3} fill="#f6d6a3" stroke="#b7804a" strokeWidth={1.2} />
      <Texto x={117} y={36} w={30} t={bien} tam={t} min={t} fill="#4a2c00" />
      <rect x={100} y={61} width={34} height={14} rx={3} fill="#f6d6a3" stroke="#b7804a" strokeWidth={1.2} />
      <Texto x={117} y={68} w={30} t={mal} tam={t} min={t} fill="#4a2c00" />
      {/* Cóndor */}
      <g transform="translate(36 30) scale(0.42)">
        <path d="M58 38 C40 10 14 8 2 18 C18 22 30 30 44 44 Z" fill="#1f1f2e" />
        <ellipse cx={58} cy={44} rx={32} ry={17} fill="#2a2a3d" />
        <path d="M60 40 C46 8 20 2 6 10 C22 18 36 30 48 48 Z" fill="#33334a" />
        <path d="M44 22 C34 14 22 10 12 12 C22 16 30 22 38 30 Z" fill="#f2f2f2" />
        <ellipse cx={86} cy={36} rx={9} ry={8} fill="#fff" />
        <circle cx={95} cy={30} r={9} fill="#c96b5a" />
        <path d="M103 28 Q114 30 108 37 Q106 34 101 33 Z" fill="#e8c27a" />
      </g>
      <rect x={10} y={6} width={74} height={16} rx={5} fill="#fff" />
      <Pregunta x={47} y={14} w={68} tam={9} muestra={muestra} defecto="8 × 7 = ?" />
    </svg>
  )
}

export function MiniCarriles({ muestra }: { muestra?: Muestra }) {
  const [a, b, c] = opciones(muestra, ['54', '56', '48'])
  const textos = [a, b, c ?? '63']
  const t = tamComun(textos, 34, 10, 6.5)
  return (
    <svg {...marco}>
      <Fondo de="#8fd3ff" a="#c9ecff" />
      <path d="M0 40 L0 26 L30 12 L52 26 L84 6 L112 24 L140 10 L160 22 V40 Z" fill="#9e8bd8" />
      <rect y={34} width={160} height={66} fill="#8fd16a" />
      <path d="M40 34 H120 L150 100 H10 Z" fill="#d9a86c" />
      <path d="M66 34 L56 100 M94 34 L104 100" stroke="#fff6e0" strokeWidth={1.4} strokeDasharray="5 4" />
      {textos.map((x, i) => (
        <g key={i}>
          <rect x={[34, 62, 90][i]} y={44} width={36} height={16} rx={3} fill={i === 1 ? '#2fc46f' : '#f6d6a3'} stroke={i === 1 ? '#1f9d55' : '#b7804a'} strokeWidth={1.2} />
          <Texto x={[52, 80, 108][i]} y={52} w={32} t={x} tam={t} min={t} fill={i === 1 ? '#fff' : '#4a2c00'} />
        </g>
      ))}
      <svg x={64} y={68} width={32} height={26} viewBox="0 0 100 80">
        <Cuy />
      </svg>
      <rect x={30} y={4} width={100} height={14} rx={4} fill="#fff" />
      <Pregunta x={80} y={11} w={94} tam={8.5} muestra={muestra} defecto="7 × 8 = ?" />
    </svg>
  )
}

export function MiniMichi({ muestra }: { muestra?: Muestra }) {
  const marcas = ['X', 'O', '', '', 'X', '', 'O', '', 'X']
  return (
    <svg {...marco}>
      <Fondo de="#4f6dff" a="#b05cff" />
      <rect x={46} y={22} width={68} height={72} rx={6} fill="#fff" opacity={0.2} />
      {marcas.map((m, i) => {
        const x = 50 + (i % 3) * 21.3
        const y = 26 + Math.floor(i / 3) * 21.6
        const linea = i === 0 || i === 4 || i === 8
        return (
          <g key={i}>
            <rect x={x} y={y} width={18.5} height={18.5} rx={3} fill={linea ? '#ffd23f' : '#fff'} />
            {m && (
              <text x={x + 9.25} y={y + 14} textAnchor="middle" fontSize={14} fontWeight={700} fill={m === 'X' ? '#2f7bff' : '#ff4d6d'} fontFamily="Fredoka, sans-serif">
                {m}
              </text>
            )}
          </g>
        )
      })}
      <rect x={20} y={3} width={120} height={16} rx={5} fill="#fff" />
      <Pregunta x={80} y={11} w={112} tam={9} muestra={muestra} defecto="¿Cuánto es 6 × 7?" />
    </svg>
  )
}
