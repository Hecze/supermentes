// Invasión: drones bajan hacia la base con respuestas; hay que dispararle con el láser al correcto.
// Inspirado en los arcades de naves (Space Invaders, "Alien Addition") con la estética de los shooters que
// juegan los chicos de secundaria, pero sin violencia: solo drones y chispas.
import { useEffect, useMemo, useReducer, useRef, useState, type CSSProperties } from 'react'
import { fuenteDeRetos, opcionesDe } from '../contenido'
import { barajar, crearAzar } from '../motor/azar'
import { useBucle, useTamano, useTemporizadores } from '../motor/bucle'
import { Enunciado, TextoMat } from '../motor/piezas'
import { sonar } from '../motor/sonido'
import type { PropsJuego, Reto } from '../tipos'

const ESCUDOS = 3
const BASE = 0.8

type Dron = { id: number; texto: string; correcto: boolean; x: number; y: number; vel: number; fase: number; estado: 'baja' | 'explota' | 'blindado' | 'fuera' }
type Disparo = { id: number; x: number; y: number; acierto: boolean }

const COLORES = ['#22e3f5', '#ff3dc8', '#b6ff3b', '#ffc23d']

function DibujoDron({ color, blindado }: { color: string; blindado: boolean }) {
  const brillo = { filter: `drop-shadow(0 0 3px ${color}) drop-shadow(0 0 7px ${color})` }
  return (
    <svg viewBox="0 0 100 80" className="block h-auto w-full overflow-visible" aria-hidden>
      <line x1={30} y1={14} x2={22} y2={2} stroke="#5b5f8f" strokeWidth={3} />
      <line x1={70} y1={14} x2={78} y2={2} stroke="#5b5f8f" strokeWidth={3} />
      <circle cx={22} cy={2} r={3} fill={color} style={brillo} />
      <circle cx={78} cy={2} r={3} fill={color} style={brillo} />
      <path d="M6 40 L18 22 H82 L94 40 L82 58 H18 Z" fill="#1d2048" stroke={color} strokeWidth={2.5} style={brillo} />
      <rect x={0} y={36} width={14} height={8} rx={3} fill="#2c3168" />
      <rect x={86} y={36} width={14} height={8} rx={3} fill="#2c3168" />
      <circle cx={50} cy={40} r={13} fill="#0b0d24" stroke={color} strokeWidth={2} />
      <circle cx={50} cy={40} r={6.5} fill={color} style={brillo} />
      <circle cx={52.5} cy={37.5} r={2} fill="#fff" />
      {blindado && <circle cx={50} cy={40} r={46} fill="none" stroke="#ff4d4d" strokeWidth={3} strokeDasharray="6 5" style={{ filter: 'drop-shadow(0 0 6px #ff4d4d)' }} />}
    </svg>
  )
}

export default function Invasion({ contenido, ritmo, semilla, terminar }: PropsJuego) {
  const azar = useMemo(() => crearAzar(semilla), [semilla])
  const siguienteReto = useMemo(() => fuenteDeRetos(contenido, azar), [contenido, azar])
  const meta = ritmo === 1 ? 8 : 10
  const opcionesPorOleada = ritmo === 1 ? 3 : 4
  // Lo que tarda un dron en llegar a la base; más tiempo si hay que leer preguntas del tema.
  const viaje = [0, 12, 10, 8][ritmo] * (contenido.generar ? 1 : 1.4)

  const escena = useRef<HTMLDivElement>(null)
  const { ancho, alto } = useTamano(escena)
  const despues = useTemporizadores()
  const [, refrescar] = useReducer((x: number) => x + 1, 0)
  const drones = useRef<Dron[]>([])
  const nodos = useRef(new Map<number, HTMLElement>())
  const contador = useRef(0)
  const tiempo = useRef(0)
  const bloqueado = useRef(false)
  const [reto, setReto] = useState<Reto | null>(null)
  const [oleada, setOleada] = useState(0)
  const [escudos, setEscudos] = useState(ESCUDOS)
  const [puntos, setPuntos] = useState(0)
  const [combo, setCombo] = useState(1)
  const [disparos, setDisparos] = useState<Disparo[]>([])
  const [explosiones, setExplosiones] = useState<{ id: number; x: number; y: number; color: string }[]>([])
  const [aviso, setAviso] = useState<{ texto: string; color: string; n: number } | null>(null)
  const [terminado, setTerminado] = useState(false)
  const escudosRef = useRef(escudos)
  escudosRef.current = escudos

  function lanzar(r: Reto, n: number) {
    const opciones = opcionesDe(r, opcionesPorOleada, azar)
    const carriles = barajar(azar, opciones.map((_, i) => i))
    const vel = ((BASE - 0.26) / viaje) * (1 + n * 0.04)
    drones.current = [
      ...drones.current.filter((d) => d.estado === 'explota'),
      ...opciones.map((texto, i) => ({
        id: ++contador.current,
        texto,
        correcto: texto === r.respuesta,
        x: (carriles[i] + 0.5) / opciones.length,
        y: 0.26 - i * 0.05 - azar() * 0.04,
        vel: vel * (0.85 + azar() * 0.3),
        fase: azar() * 6.28,
        estado: 'baja' as const,
      })),
    ]
    setReto(r)
    bloqueado.current = false
    refrescar()
  }

  useEffect(() => {
    lanzar(siguienteReto(), 0)
  }, [])

  function avisar(texto: string, color: string) {
    setAviso({ texto, color, n: Math.random() })
  }

  function explotar(d: Dron, color: string) {
    const id = ++contador.current
    setExplosiones((e) => [...e, { id, x: d.x * ancho, y: d.y * alto, color }])
    despues(() => setExplosiones((e) => e.filter((x) => x.id !== id)), 700)
  }

  function perderEscudo(motivo: string) {
    const quedan = escudosRef.current - 1
    setEscudos(quedan)
    setCombo(1)
    avisar(motivo, '#ff4d4d')
    if (quedan <= 0) {
      setTerminado(true)
      despues(
        () =>
          terminar({
            estrellas: oleada >= meta / 2 ? 1 : 0,
            titulo: '¡La base cayó!',
            detalle: `Despejaste ${oleada} de ${meta} oleadas con ${puntos} puntos. ¡Otra vez!`,
            puntaje: puntos,
          }),
        1200,
      )
    }
    return quedan
  }

  function disparar(d: Dron) {
    if (terminado || bloqueado.current || d.estado !== 'baja') return
    const id = ++contador.current
    setDisparos((x) => [...x, { id, x: d.x * ancho, y: d.y * alto, acierto: d.correcto }])
    despues(() => setDisparos((x) => x.filter((z) => z.id !== id)), 160)
    sonar.laser()
    if (d.correcto) {
      bloqueado.current = true
      d.estado = 'explota'
      despues(() => sonar.explosion(), 60)
      explotar(d, COLORES[d.id % COLORES.length])
      // Los demás drones se retiran.
      for (const o of drones.current) if (o !== d && o.estado === 'baja') o.estado = 'fuera'
      const ganados = 100 * combo
      const total = puntos + ganados
      const n = oleada + 1
      setPuntos(total)
      setOleada(n)
      setCombo((c) => Math.min(5, c + 1))
      avisar(combo >= 2 ? `COMBO x${combo}  +${ganados}` : `+${ganados}`, '#b6ff3b')
      refrescar()
      despues(() => {
        drones.current = drones.current.filter((x) => x.id !== d.id)
        refrescar()
      }, 400)
      if (n >= meta) {
        setTerminado(true)
        const e = escudosRef.current
        despues(
          () =>
            terminar({
              estrellas: e,
              titulo: '¡Sector despejado!',
              detalle: `${meta} oleadas con ${total} puntos${e === ESCUDOS ? ' y la base intacta' : ''}.`,
              puntaje: total,
            }),
          900,
        )
      } else despues(() => lanzar(siguienteReto(), n), 700)
      return
    }
    sonar.error()
    d.estado = 'blindado'
    refrescar()
    despues(() => {
      if (d.estado === 'blindado') d.estado = 'baja'
      refrescar()
    }, 500)
    perderEscudo('¡BLINDADO!')
  }

  useBucle((dt) => {
    tiempo.current += dt
    if (!ancho || !alto) return
    let cambio = false
    for (const d of drones.current) {
      if (d.estado === 'baja' || d.estado === 'blindado') {
        d.y += d.vel * dt
        if (d.y >= BASE && d.estado === 'baja') {
          if (d.correcto && !bloqueado.current) {
            // La respuesta correcta llegó a la base: se pierde un escudo y la oleada vuelve a empezar.
            bloqueado.current = true
            sonar.explosion()
            explotar(d, '#ff4d4d')
            for (const o of drones.current) o.estado = 'fuera'
            const quedan = perderEscudo('¡IMPACTO EN LA BASE!')
            if (quedan > 0) despues(() => lanzar(siguienteReto(), oleada), 900)
            cambio = true
          } else if (!d.correcto) {
            d.y = 0.22
            d.x = Math.min(0.9, Math.max(0.1, d.x + (azar() - 0.5) * 0.2))
          }
        }
      } else if (d.estado === 'fuera') {
        d.y -= dt * 1.2
        if (d.y < -0.3) {
          d.estado = 'explota'
          cambio = true
        }
      }
      const el = nodos.current.get(d.id)
      if (!el) continue
      const vaiven = Math.sin(tiempo.current * 1.6 + d.fase) * 0.01
      el.style.transform = `translate3d(${(d.x + vaiven) * ancho}px, ${d.y * alto}px, 0) translate(-50%, -50%)`
      // Aparecen debajo del marcador con un fundido, sin tapar los puntos ni la pregunta.
      const entrada = Math.max(0, Math.min(1, (d.y - 0.2) / 0.1))
      el.style.opacity = d.estado === 'fuera' ? '0.4' : d.estado === 'explota' ? '0' : String(entrada)
    }
    if (cambio) {
      drones.current = drones.current.filter((d) => !(d.estado === 'explota' && d.y < -0.2))
      refrescar()
    }
  }, !terminado)

  return (
    <div ref={escena} className="absolute inset-0 cursor-crosshair overflow-hidden" style={{ background: 'radial-gradient(ellipse at 50% 110%, #3b1470, #0c0b2a 55%, #05051a)' }}>
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage: 'radial-gradient(1px 1px at 20% 30%, #fff, transparent), radial-gradient(1.5px 1.5px at 70% 20%, #fff, transparent), radial-gradient(1px 1px at 40% 70%, #c9c3ff, transparent), radial-gradient(1px 1px at 85% 60%, #fff, transparent)',
          backgroundSize: '180px 160px',
        }}
        aria-hidden
      />
      <div className="piso-neon pointer-events-none absolute inset-x-[-30%] top-[84%] h-[40%] opacity-70" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-[84%] h-[0.4cqmin] bg-[#ff3dc8] shadow-[0_0_2cqmin_#ff3dc8]" aria-hidden />

      {drones.current.map((d) => {
        const color = COLORES[d.id % COLORES.length]
        return (
          <button
            key={d.id}
            type="button"
            ref={(el) => {
              if (el) nodos.current.set(d.id, el)
            }}
            onPointerDown={() => disparar(d)}
            onClick={(e) => e.detail === 0 && disparar(d)}
            disabled={d.estado !== 'baja'}
            aria-label={d.texto}
            className={`absolute left-0 top-0 z-10 flex w-[clamp(84px,17cqmin,150px)] cursor-crosshair flex-col items-center will-change-transform ${d.estado === 'blindado' ? 'temblar' : ''}`}
            style={{ transform: 'translate3d(-300px, -300px, 0)' }}
          >
            <DibujoDron color={color} blindado={d.estado === 'blindado'} />
            <span
              className="mt-[0.4cqmin] rounded-[0.8cqmin] border-[0.3cqmin] bg-[#0b0d24]/90 px-[1.2cqmin] py-[0.3cqmin] leading-tight text-white"
              style={{ borderColor: color, boxShadow: `0 0 1.4cqmin ${color}`, fontSize: `max(15px, calc(clamp(18px, 4.4cqmin, 40px) * ${[...d.texto].length > 7 ? 0.62 : [...d.texto].length > 4 ? 0.8 : 1}))` }}
            >
              <TextoMat texto={d.texto} />
            </span>
          </button>
        )
      })}

      {/* Rayos láser desde el cañón */}
      <svg className="pointer-events-none absolute inset-0 z-20 h-full w-full" aria-hidden>
        {disparos.map((s) => (
          <line
            key={s.id}
            x1={ancho / 2}
            y1={alto * 0.9}
            x2={s.x}
            y2={s.y}
            stroke={s.acierto ? '#b6ff3b' : '#ff4d4d'}
            strokeWidth={4}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${s.acierto ? '#b6ff3b' : '#ff4d4d'})` }}
          />
        ))}
      </svg>
      {explosiones.map((e) => (
        <span key={e.id} className="pointer-events-none absolute z-20" style={{ left: e.x, top: e.y }} aria-hidden>
          <span className="reventar absolute block size-[14cqmin] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: `radial-gradient(circle, #fff, ${e.color} 40%, transparent 70%)` }} />
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i / 14) * Math.PI * 2
            return (
              <span
                key={i}
                className="chispa absolute block size-[1.3cqmin] rounded-full"
                style={{ background: i % 2 ? '#fff' : e.color, boxShadow: `0 0 1cqmin ${e.color}`, '--dx': `${Math.cos(a) * 14}cqmin`, '--dy': `${Math.sin(a) * 14}cqmin` } as CSSProperties}
              />
            )
          })}
        </span>
      ))}

      {/* Cañón */}
      <svg viewBox="0 0 100 60" className="pointer-events-none absolute bottom-[3%] left-1/2 z-20 w-[clamp(70px,16cqmin,140px)] -translate-x-1/2" aria-hidden>
        <rect x={44} y={0} width={12} height={30} rx={4} fill="#2c3168" stroke="#22e3f5" strokeWidth={2} />
        <rect x={47} y={2} width={6} height={10} rx={2} fill="#22e3f5" style={{ filter: 'drop-shadow(0 0 4px #22e3f5)' }} />
        <path d="M10 60 Q10 26 50 22 Q90 26 90 60 Z" fill="#1d2048" stroke="#22e3f5" strokeWidth={2.5} style={{ filter: 'drop-shadow(0 0 5px #22e3f5)' }} />
        <circle cx={50} cy={44} r={7} fill="#22e3f5" style={{ filter: 'drop-shadow(0 0 5px #22e3f5)' }} />
      </svg>

      {/* Marcador y pregunta */}
      <div className="absolute inset-x-0 top-0 z-30 flex flex-col items-center gap-[1.4cqmin] px-[3cqmin] pt-[2.2cqmin]">
        <div className="flex w-full items-center gap-[2cqmin] pr-[17cqmin]" style={{ fontSize: 'clamp(13px, 3cqmin, 26px)' }}>
          <span className="flex gap-[0.8cqmin]" aria-label={`Quedan ${escudos} escudos`}>
            {Array.from({ length: ESCUDOS }, (_, i) => (
              <svg key={i} viewBox="0 0 20 22" className="w-[clamp(18px,4.2cqmin,34px)]" aria-hidden>
                <path d="M10 1 L19 6 V16 L10 21 L1 16 V6 Z" fill={i < escudos ? '#22e3f5' : 'transparent'} stroke="#22e3f5" strokeWidth={1.6} style={{ filter: i < escudos ? 'drop-shadow(0 0 4px #22e3f5)' : undefined }} opacity={i < escudos ? 1 : 0.35} />
              </svg>
            ))}
          </span>
          <span className="texto-neon tabular-nums" style={{ '--brillo': '#b6ff3b' } as CSSProperties}>
            {puntos} pts
          </span>
          <span className="text-[var(--j-tinta-suave)] tabular-nums">
            Oleada {Math.min(oleada + 1, meta)}/{meta}
          </span>
        </div>
        {reto && (
          <div key={oleada} className="tarjeta-juego entrar px-[3cqmin] py-[1.2cqmin]" style={{ maxWidth: 'min(86cqw, 720px)' }}>
            <Enunciado reto={reto} tam="clamp(22px, 5cqmin, 46px)" />
          </div>
        )}
      </div>

      {aviso && (
        <div key={aviso.n} className="pointer-events-none absolute inset-x-0 top-[55%] z-30 flex justify-center">
          <span className="anuncio texto-neon italic" style={{ '--brillo': aviso.color, fontSize: 'clamp(22px, 6cqmin, 60px)' } as CSSProperties}>
            {aviso.texto}
          </span>
        </div>
      )}
    </div>
  )
}
