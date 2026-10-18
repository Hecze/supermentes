// Concurso: preguntas con reloj, cuatro colores con figuras y puntos por rapidez, como en Kahoot.
// Se juega en el celular o proyectado (la clase elige en voz alta y el docente toca).
import { Check, X } from 'lucide-react'
import { useCallback, useMemo, useRef, useState, type CSSProperties } from 'react'
import { fuenteDeRetos, opcionesDe } from '../contenido'
import { crearAzar } from '../motor/azar'
import { useBucle, useTeclas, useTemporizadores } from '../motor/bucle'
import { Enunciado, TextoMat } from '../motor/piezas'
import { num } from '../matematica/formato'
import { sonar } from '../motor/sonido'
import type { PropsJuego, Reto } from '../tipos'

/** Rojo con triángulo, azul con rombo, amarillo con círculo, verde con cuadrado: se distinguen sin leer. */
const FICHAS = [
  { color: '#e21b3c', forma: 'M50 12 L90 84 H10 Z', nombre: 'triángulo' },
  { color: '#1368ce', forma: 'M50 8 L92 50 L50 92 L8 50 Z', nombre: 'rombo' },
  { color: '#d89e00', forma: 'M50 10 A40 40 0 1 1 49.9 10 Z', nombre: 'círculo' },
  { color: '#26890c', forma: 'M14 14 H86 V86 H14 Z', nombre: 'cuadrado' },
]

function Forma({ i, className }: { i: number; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <path d={FICHAS[i].forma} fill="#ffffff" />
    </svg>
  )
}

type Fase = 'lee' | 'responde' | 'resultado'

export default function Concurso({ contenido, ritmo, semilla, tarea, terminar }: PropsJuego) {
  const azar = useMemo(() => crearAzar(semilla), [semilla])
  const siguienteReto = useMemo(() => fuenteDeRetos(contenido, azar), [contenido, azar])
  const total = ritmo === 1 ? 8 : 10
  // Más tiempo para los chicos y para las preguntas del tema, que hay que leer. En una tarea, lo justo para
  // pensar y no para copiar la pregunta en otra aplicación.
  const segundos = tarea ? [0, 20, 15, 12][ritmo] : contenido.generar ? [0, 25, 20, 15][ritmo] : 30
  const lectura = contenido.generar ? 1.6 : 3
  const despues = useTemporizadores()

  const nueva = useCallback(() => {
    const reto = siguienteReto()
    return { reto, opciones: opcionesDe(reto, 4, azar) }
  }, [siguienteReto, azar])

  const [n, setN] = useState(1)
  const [pregunta, setPregunta] = useState<{ reto: Reto; opciones: string[] }>(nueva)
  const [fase, setFase] = useState<Fase>('lee')
  const [elegida, setElegida] = useState<number | null>(null)
  const [puntos, setPuntos] = useState(0)
  const [ganados, setGanados] = useState(0)
  const [aciertos, setAciertos] = useState(0)
  const [racha, setRacha] = useState(0)
  const [mejorRacha, setMejorRacha] = useState(0)
  const [fallos, setFallos] = useState<string[]>([])
  const [quedan, setQuedan] = useState(segundos)
  const reloj = useRef(0)
  const barra = useRef<HTMLDivElement>(null)

  useBucle((dt) => {
    reloj.current += dt
    if (fase === 'lee') {
      if (barra.current) barra.current.style.transform = `scaleX(${Math.max(0, 1 - reloj.current / lectura)})`
      if (reloj.current >= lectura) {
        reloj.current = 0
        setFase('responde')
      }
      return
    }
    const resta = Math.max(0, Math.ceil(segundos - reloj.current))
    if (resta !== quedan) {
      setQuedan(resta)
      if (resta <= 5 && resta > 0) sonar.tic()
    }
    if (reloj.current >= segundos) responder(null)
  }, fase !== 'resultado')

  function responder(i: number | null) {
    if (fase !== 'responde') return
    const bien = i !== null && pregunta.opciones[i] === pregunta.reto.respuesta
    setElegida(i)
    setFase('resultado')
    seguirLuego(n)
    if (bien) {
      // Hasta 1000 puntos: la mitad se gana por acertar y la otra mitad por rapidez; la racha suma un poco más.
      const base = Math.round(1000 * (1 - Math.min(1, reloj.current / segundos) / 2))
      const extra = Math.min(500, racha * 100)
      setGanados(base + extra)
      setPuntos((p) => p + base + extra)
      setAciertos((a) => a + 1)
      setRacha((r) => r + 1)
      setMejorRacha((m) => Math.max(m, racha + 1))
      sonar.acierto()
    } else {
      setGanados(0)
      setRacha(0)
      const { consigna, pregunta: texto, respuesta } = pregunta.reto
      setFallos((f) => [...f, (consigna ? `${consigna}${/[?:.!]$/.test(consigna) ? ' ' : ': '}${texto}` : texto).trim() || `La del dibujo (era ${respuesta})`])
      sonar.error()
    }
  }

  // El resultado se ve unos segundos y sigue solo; tocar lo adelanta.
  const numero = useRef(n)
  numero.current = n
  function seguirLuego(cual: number) {
    despues(() => numero.current === cual && seguirRef.current(), 3500)
  }

  function seguir() {
    if (fase !== 'resultado') return
    if (n >= total) {
      const r = aciertos / total
      terminar({
        estrellas: r >= 0.9 ? 3 : r >= 0.7 ? 2 : r >= 0.4 ? 1 : 0,
        titulo: `¡${num(puntos)} puntos!`,
        detalle: `Acertaste ${aciertos} de ${total}.${mejorRacha >= 3 ? ` Tu mejor racha: ${mejorRacha} seguidas.` : ''}`,
        puntaje: puntos,
        revision: tarea ? { preguntas: total, fallos } : undefined,
      })
      return
    }
    reloj.current = 0
    setN(n + 1)
    setPregunta(nueva())
    setElegida(null)
    setQuedan(segundos)
    setFase('lee')
  }

  const seguirRef = useRef(seguir)
  seguirRef.current = seguir

  useTeclas((t) => {
    if (fase === 'responde' && /^[1-4]$/.test(t)) responder(Number(t) - 1)
    else if (fase === 'resultado' && (t === 'Enter' || t === ' ')) seguir()
  })

  const acerto = fase === 'resultado' && elegida !== null && pregunta.opciones[elegida] === pregunta.reto.respuesta

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: '#46178f', fontFamily: '"Fredoka", system-ui, sans-serif' }}>
      {/* Figuras de fondo */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]" aria-hidden>
        <circle cx="12%" cy="78%" r="14%" fill="#fff" />
        <rect x="78%" y="8%" width="20%" height="20%" fill="#fff" transform="rotate(18)" />
        <circle cx="90%" cy="85%" r="8%" fill="#fff" />
      </svg>

      {/* Reloj y puntos, a la izquierda: a la derecha están el sonido y la pantalla completa */}
      <div className="relative z-10 flex items-center gap-[1.6cqmin] px-[2cqmin] pt-[2cqmin]">
        <div
          className="grid size-[clamp(48px,11cqmin,100px)] shrink-0 place-items-center rounded-full bg-[#864cbf] font-bold text-white shadow-lg tabular-nums"
          style={{ fontSize: 'clamp(20px, 5cqmin, 46px)' }}
          aria-label={`Quedan ${quedan} segundos`}
        >
          {fase === 'lee' ? '…' : quedan}
        </div>
        <div className="flex items-center gap-[1.4cqmin] rounded-[1.2cqmin] bg-[#2e0f63]/70 px-[1.8cqmin] py-[0.8cqmin] text-white" style={{ fontSize: 'clamp(12px, 2.8cqmin, 24px)' }}>
          <span className="flex flex-col leading-tight">
            <span className="opacity-80">Puntos</span>
            <span className="font-bold tabular-nums" style={{ fontSize: 'clamp(16px, 4.2cqmin, 38px)' }}>
              {num(puntos)}
            </span>
          </span>
          {racha >= 2 && <span className="font-semibold text-[#ffc93c]">🔥 {racha}</span>}
        </div>
      </div>

      {/* Pregunta, grande y al centro */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-[2cqmin] px-[3cqmin] py-[2cqmin]">
        <div key={n} className="entrar w-full max-w-[min(92cqw,860px)] rounded-[1.6cqmin] bg-white px-[3cqmin] py-[2.4cqmin] text-[#2b2d5c] shadow-xl">
          <Enunciado reto={pregunta.reto} tam="clamp(26px, 7cqmin, 64px)" />
        </div>
        {fase === 'lee' && (
          <div className="flex w-[min(70cqw,520px)] flex-col items-center gap-[1.4cqmin] text-white">
            <p className="font-bold" style={{ fontSize: 'clamp(15px, 3.6cqmin, 32px)' }}>
              Pregunta {n} de {total}
            </p>
            <div className="h-[1.4cqmin] min-h-2 w-full overflow-hidden rounded-full bg-white/25">
              <div ref={barra} className="h-full w-full origin-left rounded-full bg-white" />
            </div>
          </div>
        )}
      </div>

      {/* Respuestas */}
      <div className="relative z-10 grid grid-cols-2 gap-[1.4cqmin] p-[2cqmin] pt-0" style={{ height: '42%' }}>
        {pregunta.opciones.map((o, i) => {
          const correcta = o === pregunta.reto.respuesta
          const apagada = fase === 'resultado' && !correcta
          return (
            <button
              key={`${n}-${o}`}
              type="button"
              onPointerDown={() => responder(i)}
              onClick={(e) => e.detail === 0 && responder(i)}
              disabled={fase !== 'responde'}
              aria-keyshortcuts={String(i + 1)}
              className={`relative flex items-center gap-[2cqmin] rounded-[1cqmin] px-[2.4cqmin] text-left font-bold text-white shadow-[0_0.6cqmin_0_rgb(0_0_0/0.25)] transition ${fase === 'lee' ? 'opacity-0' : ''} ${apagada ? 'opacity-35' : ''} ${elegida === i && fase === 'resultado' ? 'ring-[0.6cqmin] ring-white' : ''}`}
              style={{ background: FICHAS[i].color, fontSize: `max(16px, calc(clamp(24px, 7cqmin, 48px) * ${[...o].length > 18 ? 0.6 : [...o].length > 9 ? 0.75 : 1}))` } as CSSProperties}
            >
              <Forma i={i} className="size-[clamp(24px,6cqmin,56px)] shrink-0" />
              <span className="min-w-0 flex-1 leading-tight [text-shadow:0_0.1em_0_rgb(0_0_0/0.25)]">
                <TextoMat texto={o} />
              </span>
              {fase === 'resultado' && correcta && <Check className="size-[clamp(24px,6cqmin,56px)] shrink-0" strokeWidth={3.5} aria-label="Correcta" />}
              {fase === 'resultado' && elegida === i && !correcta && <X className="size-[clamp(24px,6cqmin,56px)] shrink-0" strokeWidth={3.5} aria-label="Tu respuesta" />}
            </button>
          )
        })}
      </div>

      {/* Resultado de la pregunta */}
      {fase === 'resultado' && (
        <button
          type="button"
          onClick={seguir}
          className="entrar absolute inset-x-0 top-[38%] z-20 mx-auto flex w-[min(80cqw,560px)] flex-col items-center gap-[1cqmin] rounded-[2cqmin] px-[3cqmin] py-[2cqmin] text-white shadow-2xl"
          style={{ background: acerto ? '#26890c' : '#e21b3c' }}
        >
          <span className="font-bold" style={{ fontSize: 'clamp(24px, 7cqmin, 64px)' }}>
            {acerto ? '¡Correcto!' : elegida === null ? '¡Se acabó el tiempo!' : 'Incorrecto'}
          </span>
          <span className="rounded-full bg-black/25 px-[2cqmin] py-[0.4cqmin] font-semibold" style={{ fontSize: 'clamp(15px, 3.6cqmin, 32px)' }}>
            {acerto ? `+ ${num(ganados)}` : (
              <>
                Era: <TextoMat texto={pregunta.reto.respuesta} />
              </>
            )}
          </span>
          <span className="opacity-85" style={{ fontSize: 'clamp(12px, 2.6cqmin, 20px)' }}>
            {n >= total ? 'Toca para ver el resultado' : 'Toca para seguir'}
          </span>
        </button>
      )}
    </div>
  )
}
