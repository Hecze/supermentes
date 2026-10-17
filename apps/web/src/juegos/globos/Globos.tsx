// Globos: suben globos con respuestas y hay que reventar el correcto antes de que se escape.
// Inspirado en los "balloon pop" de matemática. Sirve para cualquier reto con respuestas cortas.
import { useEffect, useId, useMemo, useReducer, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { fuenteDeRetos, opcionesDe } from '../contenido'
import { barajar, crearAzar } from '../motor/azar'
import { useBucle, useTamano, useTemporizadores } from '../motor/bucle'
import { Enunciado, Flotante, PALETA, TextoMat, Vidas, elogio } from '../motor/piezas'
import { sonar } from '../motor/sonido'
import type { PropsJuego, Reto } from '../tipos'

const VIDAS = 3

type Globo = {
  id: number
  texto: string
  correcto: boolean
  /** Centro del globo como fracción del ancho y del alto de la escena. */
  x: number
  y: number
  vel: number
  color: number
  fase: number
  estado: 'vuela' | 'revienta' | 'mal' | 'escapa' | 'fuera'
}

type Efecto = { id: number; x: number; y: number; color: string; texto?: string }

function tamTexto(t: string) {
  const n = [...t].length
  // Una fracción ocupa dos renglones: se achica para que quepa en el globo.
  const fraccion = t.includes('/') ? 0.78 : 1
  return fraccion * (n <= 2 ? 1 : n <= 4 ? 0.82 : n <= 6 ? 0.64 : n <= 9 ? 0.5 : 0.42)
}

export function DibujoGlobo({ color, gradiente }: { color: string; gradiente: string }) {
  return (
    <svg viewBox="0 0 100 150" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
      <path d="M50 118 q -7 9 0 17 q 7 8 0 15" fill="none" stroke="rgb(60 50 90 / 0.55)" strokeWidth={1.8} />
      <path
        d="M50 3 C79 3 97 27 97 53 C97 84 72 106 54 111 L50 113 L46 111 C28 106 3 84 3 53 C3 27 21 3 50 3 Z"
        fill={`url(#${gradiente})`}
        stroke={color}
        strokeWidth={1}
      />
      <path d="M43 120 L50 111 L57 120 Q50 123 43 120 Z" fill={color} />
      <ellipse cx={30} cy={32} rx={8} ry={15} transform="rotate(28 30 32)" fill="#ffffff" opacity={0.5} />
      <circle cx={37} cy={55} r={3} fill="#ffffff" opacity={0.35} />
    </svg>
  )
}

export function Cielo({ children }: { children?: ReactNode }) {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(#6cc4ff, #aee0ff 55%, #dff4ff)' }} aria-hidden>
      <div className="absolute -left-[6cqmin] top-[10cqh] size-[24cqmin] opacity-90">
        <svg viewBox="0 0 100 100" className="girar-lento h-full w-full">
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x={48} y={2} width={4} height={16} rx={2} fill="#ffe27a" transform={`rotate(${i * 30} 50 50)`} />
          ))}
        </svg>
        <div className="absolute inset-[24%] rounded-full bg-[#ffd84a] shadow-[0_0_40px_#ffe9a3]" />
      </div>
      {[
        { top: '18%', dur: 70, retraso: -10, escala: 1 },
        { top: '42%', dur: 95, retraso: -60, escala: 0.7 },
        { top: '8%', dur: 120, retraso: -85, escala: 0.55 },
      ].map((n, i) => (
        <div key={i} className="nube absolute left-0" style={{ top: n.top, animationDuration: `${n.dur}s`, animationDelay: `${n.retraso}s` }}>
          <svg viewBox="0 0 120 50" style={{ width: `calc(30cqmin * ${n.escala})` }}>
            <ellipse cx={40} cy={34} rx={30} ry={14} fill="#fff" />
            <ellipse cx={66} cy={26} rx={26} ry={20} fill="#fff" />
            <ellipse cx={90} cy={35} rx={22} ry={12} fill="#fff" />
          </svg>
        </div>
      ))}
      {children}
    </div>
  )
}

export function Colinas() {
  return (
    <svg viewBox="0 0 400 60" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[14cqh] w-full" aria-hidden>
      <path d="M0 30 Q60 5 120 26 T240 22 T400 18 V60 H0 Z" fill="#7ad65a" />
      <path d="M0 44 Q80 22 170 40 T330 36 T400 34 V60 H0 Z" fill="#4fbf45" />
      {[30, 95, 210, 300, 360].map((x, i) => (
        <g key={x} transform={`translate(${x} ${46 - (i % 2) * 6})`}>
          <circle r={3.2} fill={['#ff6fbf', '#ffc93c', '#ffffff'][i % 3]} />
          <circle r={1.3} fill="#ff9636" />
        </g>
      ))}
    </svg>
  )
}

export default function Globos({ contenido, ritmo, semilla, terminar }: PropsJuego) {
  const azar = useMemo(() => crearAzar(semilla), [semilla])
  const siguienteReto = useMemo(() => fuenteDeRetos(contenido, azar), [contenido, azar])
  const meta = ritmo === 1 ? 8 : 10
  const opcionesPorReto = ritmo === 1 ? 3 : 4
  const velocidadBase = [0, 1 / 9, 1 / 7, 1 / 5.6][ritmo]

  const escena = useRef<HTMLDivElement>(null)
  const { ancho, alto } = useTamano(escena)
  const despues = useTemporizadores()
  const prefijo = useId().replace(/:/g, '')
  const [, refrescar] = useReducer((x: number) => x + 1, 0)
  const globos = useRef<Globo[]>([])
  const nodos = useRef(new Map<number, HTMLElement>())
  const contador = useRef(0)
  const tiempo = useRef(0)
  const [reto, setReto] = useState<Reto | null>(null)
  const [aciertos, setAciertos] = useState(0)
  const [vidas, setVidas] = useState(VIDAS)
  const [efectos, setEfectos] = useState<Efecto[]>([])
  const [terminado, setTerminado] = useState(false)
  const bloqueado = useRef(false)

  function lanzar(r: Reto, aciertosAhora: number) {
    const opciones = opcionesDe(r, opcionesPorReto, azar)
    const carriles = barajar(azar, opciones.map((_, i) => i))
    const vel = velocidadBase * (1 + aciertosAhora * 0.04)
    const colores = barajar(azar, PALETA.map((_, i) => i))
    globos.current = [
      ...globos.current.filter((g) => g.estado === 'escapa'),
      ...opciones.map((texto, i) => ({
        id: ++contador.current,
        texto,
        correcto: texto === r.respuesta,
        x: (carriles[i] + 0.5) / opciones.length + (azar() - 0.5) * 0.06,
        y: 1.04 + i * 0.13 + azar() * 0.06,
        vel: vel * (0.85 + azar() * 0.3),
        color: colores[i % colores.length],
        fase: azar() * 6.28,
        estado: 'vuela' as const,
      })),
    ]
    setReto(r)
    bloqueado.current = false
    refrescar()
  }

  // Primera oleada al empezar. Si se llama dos veces (modo estricto), la segunda reemplaza a la primera.
  useEffect(() => {
    lanzar(siguienteReto(), 0)
  }, [])

  function efecto(e: Omit<Efecto, 'id'>) {
    const id = ++contador.current
    setEfectos((l) => [...l, { ...e, id }])
    despues(() => setEfectos((l) => l.filter((x) => x.id !== id)), 950)
  }

  function quitar(id: number) {
    globos.current = globos.current.filter((g) => g.id !== id)
    nodos.current.delete(id)
    refrescar()
  }

  function tocar(g: Globo) {
    if (terminado || bloqueado.current || g.estado !== 'vuela') return
    const px = g.x * ancho
    const py = g.y * alto
    if (g.correcto) {
      bloqueado.current = true
      g.estado = 'revienta'
      for (const otro of globos.current) if (otro.estado === 'vuela') otro.estado = 'escapa'
      sonar.pop()
      sonar.acierto()
      efecto({ x: px, y: py, color: PALETA[g.color].c })
      efecto({ x: px, y: py - 30, color: '#2fc46f', texto: elogio(azar) })
      const total = aciertos + 1
      setAciertos(total)
      refrescar()
      despues(() => quitar(g.id), 260)
      if (total >= meta) {
        setTerminado(true)
        despues(
          () =>
            terminar({
              estrellas: vidas,
              titulo: '¡Reventaste todos!',
              detalle: vidas === VIDAS ? `${meta} respuestas correctas sin ningún error.` : `${meta} respuestas correctas y ${VIDAS - vidas} ${VIDAS - vidas === 1 ? 'error' : 'errores'}.`,
            }),
          900,
        )
      } else despues(() => lanzar(siguienteReto(), total), 700)
      return
    }
    g.estado = 'mal'
    sonar.error()
    refrescar()
    const quedan = vidas - 1
    setVidas(quedan)
    despues(() => {
      sonar.pop()
      quitar(g.id)
    }, 420)
    if (quedan <= 0) {
      setTerminado(true)
      despues(
        () =>
          terminar({
            estrellas: aciertos >= meta / 2 ? 1 : 0,
            titulo: aciertos > 0 ? '¡Buen intento!' : '¡Casi!',
            detalle: `Reventaste ${aciertos} de ${meta}. La respuesta era ${reto?.respuesta}. ¡Otra vez!`,
          }),
        1000,
      )
    }
  }

  useBucle((dt) => {
    tiempo.current += dt
    if (!ancho || !alto) return
    let salieron = false
    for (const g of globos.current) {
      if (g.estado === 'vuela') {
        g.y -= g.vel * dt
        // Al escaparse por arriba vuelve a salir por abajo: la respuesta siempre está en juego.
        if (g.y < -0.22) {
          g.y = 1.2 + azar() * 0.1
          g.x = Math.min(0.9, Math.max(0.1, g.x + (azar() - 0.5) * 0.1))
        }
      } else if (g.estado === 'escapa') {
        g.y -= g.vel * 3.2 * dt
        if (g.y < -0.3) {
          g.estado = 'fuera'
          salieron = true
        }
      }
      const el = nodos.current.get(g.id)
      if (!el) continue
      const vaiven = Math.sin(tiempo.current * 1.4 + g.fase) * 0.012
      el.style.transform = `translate3d(${(g.x + vaiven) * ancho}px, ${g.y * alto}px, 0) translate(-50%, -38%) rotate(${vaiven * 140}deg)`
      if (g.estado === 'escapa') el.style.opacity = String(Math.max(0, Math.min(1, (g.y + 0.3) * 2)))
    }
    if (salieron) {
      globos.current = globos.current.filter((g) => g.estado !== 'fuera')
      refrescar()
    }
  }, !terminado || globos.current.some((g) => g.estado === 'escapa'))

  return (
    <div ref={escena} className="absolute inset-0 overflow-hidden">
      <Cielo />
      <svg width={0} height={0} className="absolute" aria-hidden>
        <defs>
          {PALETA.map((p, i) => (
            <radialGradient key={i} id={`${prefijo}-g${i}`} cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor={`color-mix(in oklab, ${p.c} 55%, white)`} />
              <stop offset="55%" stopColor={p.c} />
              <stop offset="100%" stopColor={`color-mix(in oklab, ${p.c} 80%, #3a1060)`} />
            </radialGradient>
          ))}
        </defs>
      </svg>

      {globos.current.map((g) => {
        const p = PALETA[g.color]
        return (
          <button
            key={g.id}
            type="button"
            ref={(el) => {
              if (el) nodos.current.set(g.id, el)
            }}
            onPointerDown={() => tocar(g)}
            onClick={(e) => e.detail === 0 && tocar(g)}
            disabled={g.estado !== 'vuela'}
            aria-label={g.texto}
            className="absolute left-0 top-0 z-10 aspect-[100/150] w-[clamp(78px,19cqmin,150px)] will-change-transform"
            style={{ transform: 'translate3d(-200px, -200px, 0)' }}
          >
            <span className={`absolute inset-0 ${g.estado === 'revienta' ? 'reventar' : ''} ${g.estado === 'mal' ? 'temblar grayscale' : ''}`}>
              <DibujoGlobo color={p.c} gradiente={`${prefijo}-g${g.color}`} />
              <span
                className="absolute inset-x-[6%] top-[8%] grid h-[62%] place-items-center text-center font-bold leading-none"
                style={{
                  color: p.t,
                  fontSize: `max(17px, calc(clamp(28px, 7cqmin, 56px) * ${tamTexto(g.texto)}))`,
                  textShadow: p.t === '#ffffff' ? '0 2px 0 rgb(40 20 90 / 0.35)' : undefined,
                }}
              >
                <TextoMat texto={g.texto} />
              </span>
            </span>
          </button>
        )
      })}

      {efectos.map((e) =>
        e.texto ? (
          <Flotante key={e.id} x={e.x} y={e.y} texto={e.texto} />
        ) : (
          <span key={e.id} className="pointer-events-none absolute z-30" style={{ left: e.x, top: e.y }} aria-hidden>
            {Array.from({ length: 10 }, (_, i) => {
              const a = (i / 10) * Math.PI * 2
              return (
                <span
                  key={i}
                  className="chispa absolute block size-[1.6cqmin] rounded-full"
                  style={{ background: i % 3 === 0 ? '#ffffff' : e.color, '--dx': `${Math.cos(a) * 12}cqmin`, '--dy': `${Math.sin(a) * 12}cqmin` } as CSSProperties}
                />
              )
            })}
          </span>
        ),
      )}

      <Colinas />

      {/* Lo que hay que buscar */}
      <div className="absolute inset-x-0 top-0 z-30 flex flex-col items-center gap-[1.5cqmin] px-[3cqmin] pt-[2.2cqmin]">
        <div className="flex w-full items-center gap-[1.5cqmin] pr-[17cqmin]">
          <span className="rounded-full bg-white/85 px-[1.4cqmin] py-[0.6cqmin] shadow-sm">
            <Vidas quedan={vidas} total={VIDAS} />
          </span>
          <span className="rounded-full bg-white/85 px-[1.8cqmin] py-[0.5cqmin] font-semibold tabular-nums shadow-sm" style={{ fontSize: 'clamp(15px, 3.4cqmin, 28px)' }}>
            🎈 {aciertos} / {meta}
          </span>
        </div>
        {reto && (
          <div key={aciertos} className="tarjeta-juego entrar px-[3.5cqmin] py-[1.6cqmin]" style={{ maxWidth: 'min(86cqw, 720px)' }}>
            <Enunciado reto={reto} tam="clamp(26px, 6cqmin, 52px)" />
          </div>
        )}
      </div>
    </div>
  )
}
