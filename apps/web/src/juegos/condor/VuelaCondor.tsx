// Vuela, cóndor: se toca la pantalla para aletear y hay que pasar por el hueco de las nubes que tiene la
// respuesta correcta. Inspirado en Flappy Bird, pero amable con los chicos: el piso y el techo no matan, solo
// cuenta por qué hueco pasa el cóndor.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { fuenteDeRetos, opcionesDe } from '../contenido'
import { crearAzar } from '../motor/azar'
import { useBucle, useTamano, useTeclas, useTemporizadores } from '../motor/bucle'
import { Enunciado, Flotante, TextoMat, Vidas, elogio, letraOpciones } from '../motor/piezas'
import { sonar } from '../motor/sonido'
import type { PropsJuego, Reto } from '../tipos'

const VIDAS = 3
const X_CONDOR = 0.26

/** `centro`: dónde está el hueco dentro de la zona de vuelo (0 arriba, 1 abajo). */
type Hueco = { centro: number; texto: string }
type Zona = { arriba: number; abajo: number; alto: number }
type Puerta = { id: number; reto: Reto; huecos: [Hueco, Hueco]; correcta: 0 | 1 }

function Condor({ aleteo }: { aleteo: number }) {
  return (
    <svg viewBox="0 0 120 80" className="block h-auto w-full overflow-visible" aria-hidden>
      {/* Ala de atrás */}
      <path key={`b${aleteo}`} className="ala" d="M58 38 C40 10 14 8 2 18 C18 22 30 30 44 44 Z" fill="#1f1f2e" style={{ transformOrigin: '58px 40px' }} />
      {/* Cuerpo */}
      <ellipse cx={58} cy={44} rx={32} ry={17} fill="#2a2a3d" />
      <path d="M26 46 L4 54 L10 44 L2 40 L26 40 Z" fill="#2a2a3d" />
      {/* Ala de adelante, con la franja blanca del cóndor andino */}
      <g key={`a${aleteo}`} className="ala" style={{ transformOrigin: '60px 42px' }}>
        <path d="M60 40 C46 8 20 2 6 10 C22 18 36 30 48 48 Z" fill="#33334a" />
        <path d="M44 22 C34 14 22 10 12 12 C22 16 30 22 38 30 Z" fill="#f2f2f2" />
      </g>
      {/* Collar blanco */}
      <ellipse cx={86} cy={36} rx={9} ry={8} fill="#ffffff" />
      {/* Cabeza */}
      <circle cx={95} cy={30} r={9} fill="#c96b5a" />
      <circle cx={98} cy={28} r={2.4} fill="#fff" />
      <circle cx={98.6} cy={28} r={1.3} fill="#1b1b2b" />
      <path d="M103 28 Q114 30 108 37 Q106 34 101 33 Z" fill="#e8c27a" />
    </svg>
  )
}

function Nube({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div className={`absolute rounded-[3cqmin] bg-white/95 shadow-[inset_0_-1cqmin_0_rgb(160_190_230/0.45)] ${className ?? ''}`} style={style}>
      <span className="absolute -left-[22%] top-[10%] h-[60%] w-[50%] rounded-full bg-white/95" />
      <span className="absolute -right-[22%] top-[25%] h-[55%] w-[48%] rounded-full bg-white/95" />
    </div>
  )
}

export default function VuelaCondor({ contenido, ritmo, semilla, terminar }: PropsJuego) {
  const azar = useMemo(() => crearAzar(semilla), [semilla])
  const siguienteReto = useMemo(() => fuenteDeRetos(contenido, azar), [contenido, azar])
  const meta = ritmo === 1 ? 8 : 10
  // Lo que tarda una puerta en llegar al cóndor: el tiempo para leer la pregunta.
  const cruce = [0, 6.5, 5.2, 4.3][ritmo] * (contenido.generar ? 1 : 1.35)
  const hueco = [0, 0.3, 0.27, 0.24][ritmo]
  const despues = useTemporizadores()

  const raiz = useRef<HTMLDivElement>(null)
  const tarjeta = useRef<HTMLDivElement>(null)
  const { ancho, alto } = useTamano(raiz)
  const condor = useRef<HTMLDivElement>(null)
  const nodoPuerta = useRef<HTMLDivElement>(null)
  const fisica = useRef({ y: 0, vy: 0, t: 0, x: 0, evaluada: false, empezo: false })
  const contador = useRef(0)

  const [puerta, setPuerta] = useState<Puerta | null>(null)
  const [aleteo, setAleteo] = useState(0)
  const [empezo, setEmpezo] = useState(false)
  const [pasadas, setPasadas] = useState(0)
  const [aciertos, setAciertos] = useState(0)
  const [vidas, setVidas] = useState(VIDAS)
  const [terminado, setTerminado] = useState(false)
  const [flotantes, setFlotantes] = useState<{ id: number; y: string; texto: string; color?: string }[]>([])
  const [golpe, setGolpe] = useState(0)

  /** Zona de vuelo: entre la pregunta y el pasto. */
  const zona = (): Zona => {
    const arriba = (tarjeta.current ? tarjeta.current.offsetTop + tarjeta.current.offsetHeight : alto * 0.25) + 10
    const abajo = alto * 0.9
    return { arriba, abajo, alto: Math.max(120, abajo - arriba) }
  }
  const rango = (h: Hueco, z: Zona) => ({ arriba: z.arriba + (h.centro - hueco / 2) * z.alto, abajo: z.arriba + (h.centro + hueco / 2) * z.alto })
  // La zona se mide cuando cambia la pregunta (su tarjeta puede ser más alta o más baja).
  const [z, setZ] = useState<Zona>({ arriba: 0, abajo: 0, alto: 0 })

  function nuevaPuerta() {
    const reto = siguienteReto()
    const [o1, o2] = opcionesDe(reto, 2, azar)
    const corrimiento = (azar() - 0.5) * 0.08
    const p: Puerta = {
      id: ++contador.current,
      reto,
      huecos: [
        { centro: 0.27 + corrimiento, texto: o1 },
        { centro: 0.73 + corrimiento, texto: o2 },
      ],
      correcta: o1 === reto.respuesta ? 0 : 1,
    }
    fisica.current.x = ancho + 40
    fisica.current.evaluada = false
    setPuerta(p)
  }

  // La primera puerta, cuando ya se sabe el tamaño de la escena.
  useEffect(() => {
    if (!puerta && ancho > 0 && alto > 0) {
      fisica.current.y = alto * 0.5
      nuevaPuerta()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ancho, alto])

  useLayoutEffect(() => {
    setZ(zona())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puerta?.id, ancho, alto])

  function aletear() {
    if (terminado) return
    const f = fisica.current
    if (!f.empezo) {
      f.empezo = true
      setEmpezo(true)
    }
    f.vy = -0.48 * alto
    sonar.paso()
    setAleteo((a) => a + 1)
  }

  useTeclas((t) => {
    if (t === ' ' || t === 'ArrowUp' || t === 'Enter') aletear()
  })

  function flotar(texto: string, y: number, color?: string) {
    const id = ++contador.current
    // Por debajo de la pregunta, para que no se encime con ella.
    const yy = Math.max(y, zona().arriba + 24)
    setFlotantes((f) => [...f, { id, y: `${(yy / alto) * 100}%`, texto, color }])
    despues(() => setFlotantes((f) => f.filter((x) => x.id !== id)), 900)
  }

  function evaluar(p: Puerta, y: number) {
    const zz = zona()
    const dentro = p.huecos.findIndex((h) => {
      const r = rango(h, zz)
      return y >= r.arriba - 6 && y <= r.abajo + 6
    })
    const n = pasadas + 1
    setPasadas(n)
    let quedan = vidas
    if (dentro === p.correcta) {
      sonar.acierto()
      setAciertos((a) => a + 1)
      flotar(elogio(azar), y)
    } else {
      sonar.error()
      setGolpe((g) => g + 1)
      quedan = vidas - 1
      setVidas(quedan)
      flotar(dentro === -1 ? '¡Choque!' : `Era ${p.reto.respuesta}`, y, '#ff6b6b')
    }
    const acertadas = aciertos + (dentro === p.correcta ? 1 : 0)
    if (quedan <= 0 || n >= meta) {
      setTerminado(true)
      despues(
        () =>
          terminar(
            quedan <= 0
              ? {
                  estrellas: acertadas >= meta / 2 ? 1 : 0,
                  titulo: '¡Aterrizaje de emergencia!',
                  detalle: `Pasaste ${acertadas} de ${n} puertas por la respuesta correcta.`,
                  puntaje: acertadas * 100,
                }
              : {
                  estrellas: quedan,
                  titulo: '¡Vuelo completo!',
                  detalle: quedan === VIDAS ? `${meta} de ${meta}, sin ningún error.` : `${acertadas} de ${meta} por la respuesta correcta.`,
                  puntaje: acertadas * 100 + quedan * 100,
                },
          ),
        900,
      )
    }
  }

  useBucle((dt) => {
    const f = fisica.current
    const el = condor.current
    if (!el || alto === 0) return
    const tam = el.offsetWidth
    f.t += dt
    const z = zona()
    if (!f.empezo) {
      // Antes del primer toque, el cóndor planea en su sitio.
      f.y = z.arriba + z.alto * 0.5 + Math.sin(f.t * 3) * 8
    } else {
      f.vy = Math.min(f.vy + 1.25 * alto * dt, 0.75 * alto)
      f.y = Math.max(z.arriba + tam * 0.45, Math.min(z.abajo - tam * 0.25, f.y + f.vy * dt))
      if (f.y >= z.abajo - tam * 0.25) f.vy = 0
      // La puerta avanza hacia el cóndor.
      if (puerta && !terminado) {
        const cx = ancho * X_CONDOR
        f.x -= ((ancho + 40 - cx) / cruce) * dt
        if (!f.evaluada && f.x <= cx) {
          f.evaluada = true
          evaluar(puerta, f.y)
        }
        if (f.x < -ancho * 0.25 && pasadas < meta && vidas > 0) nuevaPuerta()
      }
    }
    const giro = f.empezo ? Math.max(-25, Math.min(35, f.vy / (alto * 0.02))) : 0
    el.style.transform = `translate(${ancho * X_CONDOR - tam / 2}px, ${f.y - tam * 0.33}px) rotate(${giro}deg)`
    if (nodoPuerta.current) nodoPuerta.current.style.transform = `translateX(${f.x}px)`
  }, !terminado)

  const anchoPuerta = Math.max(80, ancho * 0.22)

  return (
    <div
      ref={raiz}
      onPointerDown={aletear}
      className="absolute inset-0 touch-none overflow-hidden"
      style={{ background: 'linear-gradient(#5ab8ff, #a8dcff 55%, #e6f6ff)' }}
    >
      {/* Andes al fondo */}
      <svg className="pointer-events-none absolute inset-x-0 bottom-[10%] h-[34%] w-full" viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden>
        <path d="M0 100 L0 60 L40 30 L70 50 L110 10 L150 45 L190 20 L230 55 L270 15 L310 40 L350 22 L400 50 L400 100 Z" fill="#9db3d9" />
        <path d="M100 18 L110 10 L120 20 L113 18 L110 22 Z M260 22 L270 15 L280 24 L273 22 L270 26 Z M182 26 L190 20 L198 28 L192 26 Z" fill="#fff" />
        <path d="M0 100 L0 75 L60 55 L120 72 L180 50 L250 74 L320 56 L400 70 L400 100 Z" fill="#7f9bc8" />
      </svg>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[10%] bg-[#8fd16a] shadow-[inset_0_0.8cqmin_0_#6fb84e]" aria-hidden />

      {/* La puerta de nubes con sus dos huecos */}
      {puerta && z.alto > 0 && (
        <div ref={nodoPuerta} className="pointer-events-none absolute inset-y-0 left-0" style={{ width: anchoPuerta, transform: `translateX(${fisica.current.x}px)` }} aria-hidden>
          <Nube style={{ top: -20, height: rango(puerta.huecos[0], z).arriba + 20, left: 0, right: 0 }} />
          <Nube style={{ top: rango(puerta.huecos[0], z).abajo, height: rango(puerta.huecos[1], z).arriba - rango(puerta.huecos[0], z).abajo, left: 0, right: 0 }} />
          <Nube style={{ top: rango(puerta.huecos[1], z).abajo, height: alto * 0.9 - rango(puerta.huecos[1], z).abajo, left: 0, right: 0 }} />
          {puerta.huecos.map((h, i) => (
            <div key={i} className="absolute inset-x-[-40%] flex items-center justify-center" style={{ top: rango(h, z).arriba, height: rango(h, z).abajo - rango(h, z).arriba }}>
              <span
                className="whitespace-nowrap rounded-[1.4cqmin] border-[0.5cqmin] border-[#b7804a] bg-[#f6d6a3] px-[1.4cqmin] py-[0.6cqmin] font-bold text-[#4a2c00] shadow-md"
                style={{ fontSize: letraOpciones(puerta.huecos.map((x) => x.texto), '38cqw', 'clamp(24px, 5.6cqmin, 46px)', 22) }}
              >
                <TextoMat texto={h.texto} />
              </span>
            </div>
          ))}
        </div>
      )}

      <div ref={condor} className={`pointer-events-none absolute left-0 top-0 w-[clamp(64px,17cqmin,150px)] ${golpe ? 'parpadeo' : ''}`} key={`c${golpe}`}>
        <Condor aleteo={aleteo} />
      </div>

      {/* Vidas, avance y la pregunta */}
      <div className="pointer-events-none relative z-10 flex flex-col items-center gap-[1.4cqmin] px-[3cqmin] pt-[2.2cqmin]">
        <div className="flex w-full items-center gap-[1.5cqmin] pr-[17cqmin]">
          <span className="rounded-full bg-white/85 px-[1.4cqmin] py-[0.6cqmin] shadow-sm">
            <Vidas quedan={vidas} total={VIDAS} />
          </span>
          <span className="rounded-full bg-white/85 px-[1.8cqmin] py-[0.5cqmin] font-semibold tabular-nums shadow-sm" style={{ fontSize: 'clamp(15px, 3.4cqmin, 28px)' }}>
            🏔️ {pasadas} / {meta}
          </span>
          <span className="rounded-full bg-white/85 px-[1.8cqmin] py-[0.5cqmin] font-semibold tabular-nums text-[#1f9d55] shadow-sm" style={{ fontSize: 'clamp(15px, 3.4cqmin, 28px)' }}>
            ✓ {aciertos}
          </span>
        </div>
        {puerta && (
          <div ref={tarjeta} key={puerta.id} className="tarjeta-juego entrar px-[3.5cqmin] py-[1.2cqmin]" style={{ maxWidth: 'min(88cqw, 720px)' }}>
            <Enunciado reto={puerta.reto} tam="clamp(20px, 5cqmin, 44px)" />
          </div>
        )}
      </div>

      {!empezo && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[16%] z-10 flex justify-center">
          <span className="latir rounded-full bg-[#2b2d5c]/85 px-[4cqmin] py-[1.6cqmin] font-bold text-white shadow-xl" style={{ fontSize: 'clamp(18px, 5cqmin, 40px)' }}>
            Toca la pantalla para volar
          </span>
        </div>
      )}

      {flotantes.map((f) => (
        <Flotante key={f.id} x={`${X_CONDOR * 100 + 12}%`} y={f.y} texto={f.texto} color={f.color} />
      ))}
    </div>
  )
}
