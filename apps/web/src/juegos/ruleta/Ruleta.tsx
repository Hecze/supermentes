// Ruleta: el docente la gira en el proyector, sale una pregunta y la clase responde. Sin apuro y con suspenso.
// Inspirada en la "ruleta aleatoria" de Wordwall. Sirve también para preguntas largas del tema.
import { Eye, RotateCw } from 'lucide-react'
import { useMemo, useRef, useState, type CSSProperties } from 'react'
import { fuenteDeRetos, opcionesDe } from '../contenido'
import { crearAzar } from '../motor/azar'
import { useBucle, useTemporizadores } from '../motor/bucle'
import { Enunciado, PALETA, TextoMat } from '../motor/piezas'
import { sonar } from '../motor/sonido'
import type { PropsJuego, Reto } from '../tipos'

const LETRAS = ['A', 'B', 'C', 'D']
const VUELTA = 4.2

function angulo(el: Element) {
  const m = new DOMMatrix(getComputedStyle(el).transform)
  return ((Math.atan2(m.b, m.a) * 180) / Math.PI + 360) % 360
}

export default function Ruleta({ contenido, semilla, terminar }: PropsJuego) {
  const azar = useMemo(() => crearAzar(semilla), [semilla])
  const casillas = useMemo(() => {
    const siguiente = fuenteDeRetos(contenido, azar)
    const n = contenido.generar ? 8 : Math.min(10, contenido.retos.length)
    return Array.from({ length: n }, () => {
      const reto: Reto = siguiente()
      return { reto, opciones: opcionesDe(reto, 4, azar) }
    })
  }, [contenido, azar])
  const n = casillas.length
  const despues = useTemporizadores()

  const rueda = useRef<SVGGElement>(null)
  const [giro, setGiro] = useState(0)
  const [girando, setGirando] = useState(false)
  const [actual, setActual] = useState<number | null>(null)
  const [revelada, setRevelada] = useState(false)
  const [usadas, setUsadas] = useState<Set<number>>(new Set())
  const ultimoSector = useRef(0)

  // Tic-tic cada vez que una casilla pasa por la flecha.
  useBucle(() => {
    if (!rueda.current) return
    const sector = Math.floor(angulo(rueda.current) / (360 / n))
    if (sector !== ultimoSector.current) {
      ultimoSector.current = sector
      sonar.tic()
    }
  }, girando)

  function girar() {
    if (girando) return
    const libres = casillas.map((_, i) => i).filter((i) => !usadas.has(i))
    if (!libres.length) return
    // El resultado se elige primero y la ruleta se anima hasta caer en él.
    const elegida = libres[Math.floor(azar() * libres.length)]
    const centro = (elegida + 0.5) * (360 / n)
    const destino = 360 - centro + (azar() - 0.5) * (360 / n) * 0.6
    const base = giro - (giro % 360) + 360 * 5
    setGiro(base + destino)
    setGirando(true)
    setActual(null)
    setRevelada(false)
    despues(() => {
      setGirando(false)
      setActual(elegida)
      sonar.acierto()
    }, VUELTA * 1000 + 150)
  }

  function siguiente() {
    if (actual === null) return
    const ya = new Set(usadas).add(actual)
    setUsadas(ya)
    setActual(null)
    setRevelada(false)
    if (ya.size === n) terminarRepaso(ya.size)
  }

  function terminarRepaso(respondidas: number) {
    terminar({ estrellas: 3, titulo: '¡Buen repaso!', detalle: `Respondieron ${respondidas} ${respondidas === 1 ? 'pregunta' : 'preguntas'} de la ruleta.` })
  }

  const r = 46
  const sectores = casillas.map((_, i) => {
    const a0 = (i / n) * 2 * Math.PI - Math.PI / 2
    const a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2
    const am = (a0 + a1) / 2
    const d = `M50 50 L${50 + r * Math.cos(a0)} ${50 + r * Math.sin(a0)} A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${50 + r * Math.cos(a1)} ${50 + r * Math.sin(a1)} Z`
    return { d, tx: 50 + r * 0.68 * Math.cos(am), ty: 50 + r * 0.68 * Math.sin(am), rot: (am * 180) / Math.PI + 90 }
  })
  const casilla = actual !== null ? casillas[actual] : null

  return (
    <div
      className="absolute inset-0 flex items-center justify-center gap-[4cqmin] overflow-hidden p-[4cqmin] pt-[10cqmin] [@container(orientation:portrait)]:flex-col"
      style={{ background: 'radial-gradient(circle at 30% 40%, #ff8a9a, #c2185b 80%)' }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{ backgroundImage: 'radial-gradient(circle, #fff 1.6px, transparent 2.2px)', backgroundSize: '30px 30px' }}
        aria-hidden
      />
      <span className="absolute left-[3cqmin] top-[2.2cqmin] rounded-full bg-white/90 px-[1.8cqmin] py-[0.5cqmin] font-semibold tabular-nums shadow-md" style={{ fontSize: 'clamp(15px, 3.4cqmin, 28px)' }}>
        ✓ {usadas.size} / {n}
      </span>

      {/* Ruleta */}
      <div className="relative flex shrink-0 flex-col items-center gap-[3cqmin]">
        <div className="relative" style={{ width: 'min(64cqh, 46cqw)' }}>
          <svg viewBox="0 0 100 100" className="block h-auto w-full drop-shadow-[0_1.4cqmin_0_rgb(80_0_40/0.35)]" role="img" aria-label="Ruleta de preguntas">
            <circle cx={50} cy={50} r={49} fill="#ffffff" />
            <g
              ref={rueda}
              style={{ transform: `rotate(${giro}deg)`, transformOrigin: '50px 50px', transition: `transform ${VUELTA}s cubic-bezier(0.15, 0.65, 0.2, 1)` }}
            >
              {sectores.map((s, i) => (
                <g key={i}>
                  <path d={s.d} fill={usadas.has(i) ? '#d9d4e3' : PALETA[i % PALETA.length].c} stroke="#ffffff" strokeWidth={0.8} />
                  <text
                    x={s.tx}
                    y={s.ty}
                    textAnchor="middle"
                    dominantBaseline="central"
                    transform={`rotate(${s.rot} ${s.tx} ${s.ty})`}
                    fontSize={n > 8 ? 7 : 8.5}
                    fontWeight={700}
                    fill={usadas.has(i) ? '#9a94ab' : PALETA[i % PALETA.length].t}
                    fontFamily="Fredoka, sans-serif"
                  >
                    {usadas.has(i) ? '✓' : i + 1}
                  </text>
                </g>
              ))}
            </g>
            <circle cx={50} cy={50} r={8} fill="#ffffff" stroke="#ffc93c" strokeWidth={2.5} />
            <path d="M50 46 l1.2 2.5 2.8 .4 -2 2 .5 2.8 -2.5 -1.3 -2.5 1.3 .5 -2.8 -2 -2 2.8 -.4 Z" fill="#ffc93c" />
          </svg>
          {/* Flecha */}
          <svg viewBox="0 0 20 24" className="absolute left-1/2 top-[-4%] w-[11%] -translate-x-1/2 drop-shadow-md" aria-hidden>
            <path d="M2 2 H18 L10 22 Z" fill="#ffc93c" stroke="#ffffff" strokeWidth={2.5} strokeLinejoin="round" />
          </svg>
        </div>
        {!casilla && (
          <button
            type="button"
            onClick={girar}
            disabled={girando}
            className={`b3d inline-flex items-center gap-[0.35em] px-[1em] py-[0.4em] ${girando ? '' : 'latir'}`}
            style={{ '--c': '#ffc93c', '--t': '#4a2c00', fontSize: 'clamp(22px, 6cqmin, 54px)' } as CSSProperties}
          >
            <RotateCw className="size-[0.9em]" aria-hidden /> {girando ? 'Girando…' : '¡Girar!'}
          </button>
        )}
      </div>

      {/* Pregunta que salió */}
      {casilla && actual !== null && (
        <div className="tarjeta-juego entrar relative flex w-full max-w-[min(52cqw,640px)] flex-col gap-[2cqmin] p-[3cqmin] [@container(orientation:portrait)]:max-w-full">
          <span
            className="absolute -top-[3cqmin] left-[3cqmin] grid size-[7cqmin] min-h-9 min-w-9 place-items-center rounded-full font-bold text-white shadow-md"
            style={{ background: PALETA[actual % PALETA.length].c, fontSize: 'clamp(16px, 3.6cqmin, 32px)' }}
          >
            {actual + 1}
          </span>
          <Enunciado reto={casilla.reto} tam="clamp(20px, 5cqmin, 46px)" />
          <ul className="grid gap-[1.2cqmin]">
            {casilla.opciones.map((o, i) => {
              const bien = revelada && o === casilla.reto.respuesta
              return (
                <li
                  key={o}
                  className={`flex items-center gap-[1.6cqmin] rounded-[1.6cqmin] border-[0.4cqmin] px-[1.6cqmin] py-[1cqmin] font-semibold transition ${bien ? 'border-[#1f9d55] bg-[#e3f8eb]' : revelada ? 'border-transparent bg-[#f3f3f8] opacity-50' : 'border-[#e5e7f5] bg-white'}`}
                  style={{ fontSize: 'clamp(15px, 3.4cqmin, 30px)' }}
                >
                  <span className="grid size-[1.6em] shrink-0 place-items-center rounded-full text-white" style={{ background: bien ? '#1f9d55' : PALETA[i].c }}>
                    {LETRAS[i]}
                  </span>
                  <TextoMat texto={o} />
                </li>
              )
            })}
          </ul>
          <div className="flex flex-wrap justify-end gap-[1.6cqmin]" style={{ fontSize: 'clamp(16px, 3.4cqmin, 28px)' }}>
            {!revelada ? (
              <button
                type="button"
                onClick={() => {
                  setRevelada(true)
                  sonar.victoria()
                }}
                className="b3d inline-flex items-center gap-2 px-[0.9em] py-[0.4em]" style={{ '--c': '#2fc46f' } as CSSProperties}>
                <Eye className="size-[1em]" aria-hidden /> Ver respuesta
              </button>
            ) : (
              <button type="button" onClick={siguiente} className="b3d inline-flex items-center gap-2 px-[0.9em] py-[0.4em]" style={{ '--c': '#4f6dff' } as CSSProperties}>
                <RotateCw className="size-[1em]" aria-hidden /> {usadas.size + 1 === n ? 'Terminar' : 'Girar otra vez'}
              </button>
            )}
          </div>
        </div>
      )}

      {!casilla && usadas.size > 0 && !girando && (
        <button
          type="button"
          onClick={() => terminarRepaso(usadas.size)}
          className="absolute bottom-[2.4cqmin] right-[3cqmin] rounded-full bg-white/85 px-[1.8cqmin] py-[0.6cqmin] font-semibold shadow-md"
          style={{ fontSize: 'clamp(13px, 2.8cqmin, 22px)' }}
        >
          Terminar el repaso
        </button>
      )}
    </div>
  )
}
