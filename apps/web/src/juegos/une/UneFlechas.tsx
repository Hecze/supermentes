// Une con flechas: dos columnas; se toca un lado y luego su pareja, y quedan unidos con una línea.
// Es el "relaciona columnas" de los cuadernos y de Wordwall ("Match up"), sin reloj: ideal para los más chicos.
import { Check } from 'lucide-react'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { paresDePartida } from '../contenido'
import { barajar, crearAzar } from '../motor/azar'
import { useTamano, useTemporizadores } from '../motor/bucle'
import { Flotante, TextoMat, VisualDe, elogio } from '../motor/piezas'
import { sonar } from '../motor/sonido'
import type { Lado, Par, PropsJuego } from '../tipos'

type Lado2 = 'a' | 'b'

/** Colores de las parejas unidas: sin rojo, que aquí es el color del error. */
const COLORES = ['#2fc46f', '#4f6dff', '#9f63ff', '#ff9636', '#2fb2ff', '#ff6fbf']
type Linea = { i: number; x1: number; y1: number; x2: number; y2: number }

function tamTexto(t: string) {
  const n = [...t].length
  return n <= 4 ? 1 : n <= 9 ? 0.82 : n <= 16 ? 0.66 : 0.54
}

function Contenido({ lado }: { lado: Lado }) {
  if (lado.visual) return <VisualDe visual={lado.visual} tam="clamp(54px, 13cqmin, 120px)" />
  return (
    <span className="leading-tight" style={{ fontSize: `calc(clamp(17px, 5cqmin, 42px) * ${tamTexto(lado.texto)})` }}>
      <TextoMat texto={lado.texto} />
    </span>
  )
}

export default function UneFlechas({ contenido, ritmo, semilla, terminar }: PropsJuego) {
  const azar = useMemo(() => crearAzar(semilla), [semilla])
  const despues = useTemporizadores()

  // Rondas de 4 o 5 parejas; con pocas parejas, menos rondas.
  const rondas = useMemo(() => {
    const todas = barajar(azar, paresDePartida(contenido, azar))
    const porRonda = Math.min(ritmo === 1 ? 4 : 5, todas.length)
    const cuantas = Math.max(1, Math.min(ritmo === 1 ? 2 : 3, Math.floor(todas.length / porRonda)))
    return Array.from({ length: cuantas }, (_, r) => todas.slice(r * porRonda, (r + 1) * porRonda))
  }, [contenido, ritmo, azar])
  const totalPares = rondas.reduce((n, r) => n + r.length, 0)

  const [r, setR] = useState(0)
  const pares: Par[] = rondas[r]
  const orden = useMemo(() => ({ a: barajar(azar, pares.map((_, i) => i)), b: barajar(azar, pares.map((_, i) => i)) }), [pares, azar])
  const [unidos, setUnidos] = useState<number[]>([])
  const [elegido, setElegido] = useState<{ lado: Lado2; i: number } | null>(null)
  const [fallo, setFallo] = useState<{ a: number; b: number } | null>(null)
  const [errores, setErrores] = useState(0)
  const [flotante, setFlotante] = useState<{ id: number; texto: string } | null>(null)
  const [terminado, setTerminado] = useState(false)

  const caja = useRef<HTMLDivElement>(null)
  const { ancho, alto } = useTamano(caja)
  const nodos = useRef(new Map<string, HTMLElement>())
  const [lineas, setLineas] = useState<Linea[]>([])

  // Las líneas van del borde derecho de un lado al borde izquierdo de su pareja.
  useLayoutEffect(() => {
    const c = caja.current?.getBoundingClientRect()
    if (!c) return
    setLineas(
      unidos.flatMap((i) => {
        const a = nodos.current.get(`a${i}`)?.getBoundingClientRect()
        const b = nodos.current.get(`b${i}`)?.getBoundingClientRect()
        return a && b ? [{ i, x1: a.right - c.left, y1: a.top + a.height / 2 - c.top, x2: b.left - c.left, y2: b.top + b.height / 2 - c.top }] : []
      }),
    )
  }, [unidos, r, ancho, alto])

  function unir(a: number, b: number) {
    setElegido(null)
    if (a !== b) {
      sonar.error()
      setErrores((e) => e + 1)
      setFallo({ a, b })
      despues(() => setFallo(null), 450)
      return
    }
    sonar.acierto()
    const nuevos = [...unidos, a]
    setUnidos(nuevos)
    if (nuevos.length < pares.length) return

    // Ronda completa
    const id = Math.random()
    setFlotante({ id, texto: r + 1 < rondas.length ? elogio(azar) : '¡Todo unido!' })
    despues(() => setFlotante((f) => (f?.id === id ? null : f)), 1000)
    if (r + 1 < rondas.length) {
      despues(() => {
        setR(r + 1)
        setUnidos([])
        setLineas([])
      }, 1100)
      return
    }
    setTerminado(true)
    despues(
      () =>
        terminar({
          estrellas: errores <= 1 ? 3 : errores <= 3 ? 2 : 1,
          titulo: errores === 0 ? '¡Sin ningún error!' : '¡Todo unido!',
          detalle: `Uniste ${totalPares} parejas${errores ? ` con ${errores} ${errores === 1 ? 'error' : 'errores'}` : ''}.`,
          puntaje: Math.max(0, totalPares * 100 - errores * 30),
        }),
      1100,
    )
  }

  function tocar(lado: Lado2, i: number) {
    if (terminado || unidos.includes(i)) return
    if (!elegido || elegido.lado === lado) {
      sonar.paso()
      setElegido(elegido?.lado === lado && elegido.i === i ? null : { lado, i })
      return
    }
    if (lado === 'a') unir(i, elegido.i)
    else unir(elegido.i, i)
  }

  // Una función y no un componente: así los botones no se vuelven a montar en cada cambio.
  function columna(lado: Lado2) {
    return (
      <div className="flex min-h-0 flex-col justify-center gap-[2cqmin]">
        {orden[lado].map((i) => {
          const hecho = unidos.includes(i)
          const activo = elegido?.lado === lado && elegido.i === i
          const mal = fallo?.[lado] === i
          const color = COLORES[i % COLORES.length]
          return (
            <button
              key={`${r}-${lado}-${i}`}
              ref={(el) => {
                if (el) nodos.current.set(`${lado}${i}`, el)
                else nodos.current.delete(`${lado}${i}`)
              }}
              type="button"
              onClick={() => tocar(lado, i)}
              aria-pressed={activo}
              className={`entrar relative flex min-h-[clamp(52px,11cqh,110px)] items-center justify-center rounded-[1.8cqmin] border-[0.6cqmin] px-[1.6cqmin] py-[1cqmin] text-center font-bold shadow-md transition ${mal ? 'temblar' : ''}`}
              style={{
                background: hecho ? color : mal ? '#ff6b6b' : '#ffffff',
                color: hecho || mal ? '#ffffff' : '#2b2d5c',
                borderColor: activo ? '#ffc93c' : hecho ? color : '#ffffff',
                boxShadow: activo ? '0 0 0 0.8cqmin rgb(255 201 60 / 0.55)' : undefined,
              }}
            >
              <Contenido lado={pares[i][lado]} />
              {hecho && <Check className="absolute right-[0.8cqmin] top-[0.8cqmin] size-[clamp(14px,3cqmin,24px)]" strokeWidth={3.5} aria-hidden />}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: 'linear-gradient(170deg, #ffd166, #ff9f68 55%, #ff7aa2)' }}>
      <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} aria-hidden />

      <div className="relative z-10 flex flex-col gap-[0.6cqmin] px-[3cqmin] pr-[17cqmin] pt-[2.2cqmin] text-[#5a2a00]">
        <p className="font-bold" style={{ fontSize: 'clamp(18px, 4.6cqmin, 38px)' }}>
          Une cada uno con su pareja
        </p>
        <p className="font-medium opacity-80" style={{ fontSize: 'clamp(13px, 3cqmin, 24px)' }}>
          {rondas.length > 1 ? `Ronda ${r + 1} de ${rondas.length} · ` : ''}
          Toca uno de la izquierda y luego su pareja
        </p>
      </div>

      <div ref={caja} className="relative z-10 grid min-h-0 flex-1 grid-cols-[1fr_minmax(10cqw,16cqw)_1fr] px-[3cqmin] pb-[3cqmin] pt-[1.5cqmin]">
        {columna('a')}
        <div aria-hidden />
        {columna('b')}
        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          {lineas.map((l) => {
            const color = COLORES[l.i % COLORES.length]
            return (
              <g key={l.i}>
                <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#ffffff" strokeWidth={9} strokeLinecap="round" />
                <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={color} strokeWidth={5} strokeLinecap="round" pathLength={1} className="trazo" />
                <circle cx={l.x1} cy={l.y1} r={6} fill={color} stroke="#fff" strokeWidth={2} />
                <circle cx={l.x2} cy={l.y2} r={6} fill={color} stroke="#fff" strokeWidth={2} />
              </g>
            )
          })}
        </svg>
      </div>

      {flotante && <Flotante key={flotante.id} x="50%" y="45%" texto={flotante.texto} />}
    </div>
  )
}
