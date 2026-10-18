// Corre, cuy: el cuy corre por un camino de tres carriles y se acercan cajas con respuestas. Hay que cambiarse
// al carril de la correcta antes de llegar. Inspirado en Subway Surfers; se juega tocando el carril o deslizando.
import { useEffect, useMemo, useRef, useState, type PointerEvent as EventoPuntero } from 'react'
import { fuenteDeRetos, opcionesDe } from '../contenido'
import { crearAzar } from '../motor/azar'
import { useBucle, useTamano, useTeclas, useTemporizadores } from '../motor/bucle'
import { Cuy } from '../motor/Cuy'
import { Enunciado, Flotante, TextoMat, Vidas, elogio, letraOpciones } from '../motor/piezas'
import { sonar } from '../motor/sonido'
import type { PropsJuego, Reto } from '../tipos'

const VIDAS = 3
const CARRILES = 3
const Y_CUY = 0.82

type Fila = { id: number; reto: Reto; opciones: string[] }

export default function CorreCuy({ contenido, ritmo, semilla, terminar }: PropsJuego) {
  const azar = useMemo(() => crearAzar(semilla), [semilla])
  const siguienteReto = useMemo(() => fuenteDeRetos(contenido, azar), [contenido, azar])
  const meta = ritmo === 1 ? 8 : 10
  // Lo que tarda una fila de cajas en llegar al cuy: el tiempo para leer y decidir.
  const viaje = [0, 6.5, 5.2, 4.2][ritmo] * (contenido.generar ? 1 : 1.35)
  const despues = useTemporizadores()

  const raiz = useRef<HTMLDivElement>(null)
  const tarjeta = useRef<HTMLDivElement>(null)
  const nodoFila = useRef<HTMLDivElement>(null)
  const { alto } = useTamano(raiz)
  const avance = useRef(0)
  const evaluada = useRef(false)
  const contador = useRef(0)
  const toque = useRef<{ x: number } | null>(null)

  const [fila, setFila] = useState<Fila | null>(null)
  const [carril, setCarril] = useState(1)
  const [pasadas, setPasadas] = useState(0)
  const [aciertos, setAciertos] = useState(0)
  const [vidas, setVidas] = useState(VIDAS)
  const [resultado, setResultado] = useState<{ id: number; bien: boolean; carril: number } | null>(null)
  const [terminado, setTerminado] = useState(false)
  const [flotantes, setFlotantes] = useState<{ id: number; x: string; texto: string; color?: string }[]>([])
  const carrilRef = useRef(carril)
  carrilRef.current = carril

  function nuevaFila() {
    const reto = siguienteReto()
    avance.current = 0
    evaluada.current = false
    setResultado(null)
    setFila({ id: ++contador.current, reto, opciones: opcionesDe(reto, CARRILES, azar) })
  }

  useEffect(() => {
    nuevaFila()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function mover(a: number) {
    if (terminado) return
    const n = Math.max(0, Math.min(CARRILES - 1, a))
    if (n !== carrilRef.current) {
      sonar.paso()
      setCarril(n)
    }
  }

  useTeclas((t) => {
    if (t === 'ArrowLeft') mover(carrilRef.current - 1)
    else if (t === 'ArrowRight') mover(carrilRef.current + 1)
    else if (/^[1-3]$/.test(t)) mover(Number(t) - 1)
  })

  // Tocar un carril lleva al cuy ahí; deslizar lo mueve un carril.
  function alBajar(e: EventoPuntero<HTMLDivElement>) {
    toque.current = { x: e.clientX }
  }
  function alSubir(e: EventoPuntero<HTMLDivElement>) {
    const t = toque.current
    toque.current = null
    if (!t || !raiz.current) return
    const dx = e.clientX - t.x
    if (Math.abs(dx) > 40) {
      mover(carrilRef.current + (dx > 0 ? 1 : -1))
      return
    }
    const r = raiz.current.getBoundingClientRect()
    mover(Math.floor(((e.clientX - r.left) / r.width) * CARRILES))
  }

  function flotar(texto: string, c: number, color?: string) {
    const id = ++contador.current
    setFlotantes((f) => [...f, { id, x: `${((c + 0.5) / CARRILES) * 100}%`, texto, color }])
    despues(() => setFlotantes((f) => f.filter((x) => x.id !== id)), 900)
  }

  function evaluar(f: Fila) {
    const c = carrilRef.current
    const bien = f.opciones[c] === f.reto.respuesta
    const n = pasadas + 1
    setPasadas(n)
    setResultado({ id: f.id, bien, carril: c })
    let quedan = vidas
    if (bien) {
      sonar.acierto()
      setAciertos((a) => a + 1)
      flotar(elogio(azar), c)
    } else {
      sonar.error()
      quedan = vidas - 1
      setVidas(quedan)
      flotar(`Era ${f.reto.respuesta}`, c, '#ff6b6b')
    }
    const acertadas = aciertos + (bien ? 1 : 0)
    if (quedan <= 0 || n >= meta) {
      setTerminado(true)
      despues(
        () =>
          terminar(
            quedan <= 0
              ? {
                  estrellas: acertadas >= meta / 2 ? 1 : 0,
                  titulo: '¡El cuy se cansó!',
                  detalle: `Llegó a ${acertadas} de ${meta} respuestas correctas.`,
                  puntaje: acertadas * 100,
                }
              : {
                  estrellas: quedan,
                  titulo: '¡Carrera completa!',
                  detalle: quedan === VIDAS ? `${meta} de ${meta}, sin ningún error.` : `${acertadas} de ${meta} respuestas correctas.`,
                  puntaje: acertadas * 100 + quedan * 100,
                },
          ),
        900,
      )
      return
    }
    despues(nuevaFila, 650)
  }

  useBucle((dt) => {
    if (!fila || alto === 0) return
    avance.current = Math.min(1, avance.current + dt / viaje)
    const p = avance.current
    // Las cajas salen debajo de la pregunta y llegan a la altura del cuy, creciendo como si se acercaran.
    const desde = tarjeta.current ? tarjeta.current.offsetTop + tarjeta.current.offsetHeight + 8 : alto * 0.3
    const y = desde + (alto * Y_CUY - desde) * p
    if (nodoFila.current) {
      nodoFila.current.style.transform = `translateY(${y}px) scale(${0.55 + 0.45 * p})`
      nodoFila.current.style.opacity = String(Math.min(1, p * 5))
    }
    if (!evaluada.current && p >= 1) {
      evaluada.current = true
      evaluar(fila)
    }
  }, !terminado)

  return (
    <div
      ref={raiz}
      onPointerDown={alBajar}
      onPointerUp={alSubir}
      className="absolute inset-0 touch-none overflow-hidden"
      style={{ background: 'linear-gradient(#8fd3ff, #c9ecff 30%, #8fd16a 30.5%, #6fbf4f)' }}
    >
      {/* Cerros y el camino de tres carriles */}
      <svg className="pointer-events-none absolute inset-x-0 top-[14%] h-[17%] w-full" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden>
        <path d="M0 60 L0 38 L50 14 L90 34 L140 6 L190 32 L240 12 L290 36 L340 10 L400 30 L400 60 Z" fill="#9e8bd8" />
        <path d="M132 13 L140 6 L148 14 L142 12 Z M332 17 L340 10 L348 18 L342 16 Z" fill="#fff" />
      </svg>
      <div className="pointer-events-none absolute inset-x-[4%] bottom-0 top-[30%] bg-[#d9a86c] shadow-[inset_0_0_0_0.8cqmin_#b9844a]" aria-hidden>
        {[1, 2].map((i) => (
          <div key={i} className="carril-linea absolute inset-y-0 w-[1cqmin]" style={{ left: `calc(${(i / CARRILES) * 100}% - 0.5cqmin)` }} />
        ))}
      </div>

      {/* La fila de cajas */}
      {fila && (
        <div ref={nodoFila} key={fila.id} className="pointer-events-none absolute inset-x-[4%] top-0 grid origin-top grid-cols-3 gap-[2cqmin] px-[2cqmin]" style={{ opacity: 0 }}>
          {fila.opciones.map((o, i) => {
            const r = resultado?.id === fila.id ? resultado : null
            const esta = o === fila.reto.respuesta
            return (
              <div
                key={i}
                className={`grid min-h-[clamp(52px,11cqh,110px)] place-items-center rounded-[1.6cqmin] border-[0.7cqmin] px-[1cqmin] text-center font-bold shadow-lg ${r && r.carril === i && !r.bien ? 'temblar' : ''}`}
                style={{
                  background: r ? (esta ? '#2fc46f' : r.carril === i ? '#ff6b6b' : '#e9d7b8') : '#f6d6a3',
                  borderColor: r ? (esta ? '#1f9d55' : '#b7804a') : '#b7804a',
                  color: r && (esta || r.carril === i) ? '#fff' : '#4a2c00',
                  fontSize: letraOpciones(fila.opciones, '25cqw', 'clamp(24px, 6cqmin, 48px)'),
                }}
              >
                <TextoMat texto={o} />
              </div>
            )
          })}
        </div>
      )}

      {/* El cuy, en su carril */}
      <div
        className="pointer-events-none absolute w-[clamp(64px,19cqmin,160px)] -translate-x-1/2 transition-[left] duration-150 ease-out"
        style={{ left: `calc(4% + ${((carril + 0.5) / CARRILES) * 92}%)`, top: `calc(${Y_CUY * 100}% + 2cqmin)` }}
        aria-hidden
      >
        <div className="trotar">
          <Cuy className="h-auto w-full" />
        </div>
      </div>

      {/* Vidas, avance y la pregunta */}
      <div className="pointer-events-none relative z-10 flex flex-col items-center gap-[1.4cqmin] px-[3cqmin] pt-[2.2cqmin]">
        <div className="flex w-full items-center gap-[1.5cqmin] pr-[17cqmin]">
          <span className="rounded-full bg-white/85 px-[1.4cqmin] py-[0.6cqmin] shadow-sm">
            <Vidas quedan={vidas} total={VIDAS} />
          </span>
          <span className="rounded-full bg-white/85 px-[1.8cqmin] py-[0.5cqmin] font-semibold tabular-nums shadow-sm" style={{ fontSize: 'clamp(15px, 3.4cqmin, 28px)' }}>
            🏁 {pasadas} / {meta}
          </span>
        </div>
        {fila && (
          <div ref={tarjeta} key={fila.id} className="tarjeta-juego entrar px-[3.5cqmin] py-[1.2cqmin]" style={{ maxWidth: 'min(88cqw, 720px)' }}>
            <Enunciado reto={fila.reto} tam="clamp(20px, 5cqmin, 44px)" />
          </div>
        )}
      </div>

      {pasadas === 0 && (
        <p className="pointer-events-none absolute inset-x-0 bottom-[2%] z-10 text-center" style={{ fontSize: 'clamp(15px, 3.4cqmin, 26px)' }}>
          <span className="rounded-full bg-[#2b2d5c]/80 px-[1em] py-[0.35em] font-semibold text-white">Toca un carril o desliza para cambiarte</span>
        </p>
      )}

      {flotantes.map((f) => (
        <Flotante key={f.id} x={f.x} y="62%" texto={f.texto} color={f.color} />
      ))}
    </div>
  )
}
