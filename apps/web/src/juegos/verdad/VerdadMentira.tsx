// ¿Verdad o mentira?: aparece una carta con una respuesta y hay que decidir si es correcta, deslizándola o con
// los botones. Las "mentiras" son los errores típicos (1/5 + 2/5 = 3/10), así que el juego enseña a detectarlos.
// Inspirado en el "Verdadero o falso" de Wordwall y en las cartas que se deslizan de las apps.
import { Check, X } from 'lucide-react'
import { useMemo, useRef, useState, type CSSProperties, type PointerEvent as EventoPuntero } from 'react'
import { fuenteDeRetos, sinIgual } from '../contenido'
import { crearAzar } from '../motor/azar'
import { useTeclas, useTemporizadores } from '../motor/bucle'
import { Flotante, TextoMat, VisualDe, elogio } from '../motor/piezas'
import { sonar } from '../motor/sonido'
import type { PropsJuego, Reto } from '../tipos'

type Carta = { reto: Reto; candidato: string; verdad: boolean; n: number }

/** La afirmación de la carta: "7 × 8 = 54", "45 < 54" o la pregunta con la respuesta propuesta. */
function Afirmacion({ c }: { c: Carta }) {
  const p = c.reto.pregunta
  const tam = 'clamp(26px, 8cqmin, 72px)'
  if (!c.reto.visual && /=\s*\?$/.test(p)) {
    return (
      <p className="font-bold leading-tight" style={{ fontSize: tam }}>
        <TextoMat texto={`${sinIgual(p)} = ${c.candidato}`} />
      </p>
    )
  }
  if (!c.reto.visual && p.includes('▢')) {
    return (
      <p className="font-bold leading-tight" style={{ fontSize: tam }}>
        <TextoMat texto={p.replace('▢', c.candidato)} />
      </p>
    )
  }
  const escala = p.length > 70 ? 0.5 : p.length > 36 ? 0.62 : 0.8
  return (
    <div className="flex flex-col items-center gap-[2cqmin]">
      {c.reto.consigna && (
        <p className="font-medium text-[#5d6290]" style={{ fontSize: 'clamp(15px, 3.6cqmin, 30px)' }}>
          {c.reto.consigna}
        </p>
      )}
      {c.reto.visual && <VisualDe visual={c.reto.visual} tam="clamp(90px, 24cqmin, 220px)" />}
      {p && (
        <p className="font-semibold leading-tight text-balance" style={{ fontSize: `max(17px, calc(${tam} * ${escala}))` }}>
          <TextoMat texto={p} />
        </p>
      )}
      <p className="rounded-[1.6cqmin] bg-[#fff3c4] px-[3cqmin] py-[1cqmin] font-bold text-[#7a4b00]" style={{ fontSize: 'clamp(22px, 6.4cqmin, 56px)' }}>
        <TextoMat texto={c.candidato} />
      </p>
    </div>
  )
}

export default function VerdadMentira({ contenido, ritmo, semilla, terminar }: PropsJuego) {
  const azar = useMemo(() => crearAzar(semilla), [semilla])
  const siguienteReto = useMemo(() => fuenteDeRetos(contenido, azar), [contenido, azar])
  const total = ritmo === 1 ? 10 : 12
  const despues = useTemporizadores()

  function nuevaCarta(n: number): Carta {
    const reto = siguienteReto()
    // Mitad y mitad; las mentiras usan los primeros distractores, que son los errores más comunes.
    const verdad = azar() < 0.5
    const candidato = verdad ? reto.respuesta : reto.distractores[Math.floor(azar() * (reto.distractoresAlAzar ? reto.distractores.length : Math.min(2, reto.distractores.length)))]
    return { reto, candidato, verdad, n }
  }

  const [carta, setCarta] = useState<Carta>(() => nuevaCarta(1))
  const [salida, setSalida] = useState<'izq' | 'der' | null>(null)
  const [aviso, setAviso] = useState<{ bien: boolean; texto: string } | null>(null)
  const [aciertos, setAciertos] = useState(0)
  const [racha, setRacha] = useState(0)
  const [mejorRacha, setMejorRacha] = useState(0)
  const [flotante, setFlotante] = useState<{ id: number; texto: string } | null>(null)
  const nodo = useRef<HTMLDivElement>(null)
  const arrastre = useRef<{ x0: number; dx: number } | null>(null)
  const ocupado = useRef(false)

  function mover(dx: number) {
    const el = nodo.current
    if (!el) return
    el.style.transition = 'none'
    el.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`
    el.style.setProperty('--si', String(Math.max(0, Math.min(1, dx / 90))))
    el.style.setProperty('--no', String(Math.max(0, Math.min(1, -dx / 90))))
  }

  function soltar() {
    const el = nodo.current
    if (!el) return
    el.style.transition = 'transform 0.25s ease'
    el.style.transform = ''
    el.style.setProperty('--si', '0')
    el.style.setProperty('--no', '0')
  }

  // La carta que se ve: el aviso de error avanza solo o con un toque, y solo la primera vez cuenta.
  const actual = useRef(carta.n)
  actual.current = carta.n

  function siguiente(desde = carta.n) {
    if (actual.current !== desde) return
    actual.current = desde + 1
    setAviso(null)
    if (desde >= total) return
    setSalida(null)
    soltar()
    setCarta(nuevaCarta(desde + 1))
    ocupado.current = false
  }

  function responder(diceVerdad: boolean) {
    if (ocupado.current || aviso) return
    ocupado.current = true
    const bien = diceVerdad === carta.verdad
    setSalida(diceVerdad ? 'der' : 'izq')
    const nAciertos = aciertos + (bien ? 1 : 0)
    const nRacha = bien ? racha + 1 : 0
    const nMejor = Math.max(mejorRacha, nRacha)
    setAciertos(nAciertos)
    setRacha(nRacha)
    setMejorRacha(nMejor)

    if (bien) {
      sonar.acierto()
      const id = Math.random()
      setFlotante({ id, texto: elogio(azar) })
      despues(() => setFlotante((f) => (f?.id === id ? null : f)), 900)
    } else {
      sonar.error()
      setAviso({
        bien: false,
        texto: carta.verdad ? `Era verdad: ${carta.candidato} está bien.` : `Era mentira. La respuesta es ${carta.reto.respuesta}.`,
      })
    }

    if (carta.n >= total) {
      const r = nAciertos / total
      despues(
        () =>
          terminar({
            estrellas: r >= 0.9 ? 3 : r >= 0.7 ? 2 : r >= 0.4 ? 1 : 0,
            titulo: r >= 0.9 ? '¡Detective de errores!' : r >= 0.6 ? '¡Bien hecho!' : '¡Sigue practicando!',
            detalle: `Acertaste ${nAciertos} de ${total} cartas.${nMejor >= 3 ? ` Tu mejor racha: ${nMejor} seguidas.` : ''}`,
            puntaje: nAciertos * 100 + nMejor * 10,
          }),
        bien ? 700 : 2200,
      )
      return
    }
    const n = carta.n
    despues(() => siguiente(n), bien ? 380 : 2600)
  }

  useTeclas((t) => {
    if (aviso && (t === 'Enter' || t === ' ')) siguiente()
    else if (t === 'ArrowRight' || t === 'v') responder(true)
    else if (t === 'ArrowLeft' || t === 'm') responder(false)
  })

  function alBajar(e: EventoPuntero<HTMLDivElement>) {
    if (ocupado.current) return
    e.currentTarget.setPointerCapture(e.pointerId)
    arrastre.current = { x0: e.clientX, dx: 0 }
  }
  function alMover(e: EventoPuntero<HTMLDivElement>) {
    if (!arrastre.current) return
    arrastre.current.dx = e.clientX - arrastre.current.x0
    mover(arrastre.current.dx)
  }
  function alSubir() {
    const a = arrastre.current
    arrastre.current = null
    if (!a) return
    const umbral = Math.min(110, (nodo.current?.offsetWidth ?? 300) * 0.28)
    if (Math.abs(a.dx) >= umbral) responder(a.dx > 0)
    else soltar()
  }

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: 'linear-gradient(165deg, #3dd6c4, #2f7bff 70%, #4b37c9)' }}>
      <div className="pointer-events-none absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 2px)', backgroundSize: '26px 26px' }} aria-hidden />

      {/* Avance y racha; a la derecha están el sonido y la pantalla completa */}
      <div className="relative z-10 flex items-center gap-[1.5cqmin] px-[3cqmin] pr-[17cqmin] pt-[2.2cqmin] text-white" style={{ fontSize: 'clamp(15px, 3.4cqmin, 28px)' }}>
        <span className="rounded-full bg-black/20 px-[2cqmin] py-[0.5cqmin] font-semibold tabular-nums">
          Carta {carta.n} de {total}
        </span>
        {racha >= 2 && <span className="rounded-full bg-black/20 px-[2cqmin] py-[0.5cqmin] font-semibold">🔥 {racha}</span>}
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-[5cqmin] py-[2cqmin]">
        {/* Las cartas de atrás dan la idea de mazo */}
        <div className="relative w-full max-w-[min(84cqw,640px)]" style={{ height: 'min(100%, 62cqh)' }}>
          <div className="absolute inset-0 translate-y-[2.4cqmin] scale-[0.94] rounded-[3cqmin] bg-white/40" aria-hidden />
          <div className="absolute inset-0 translate-y-[1.2cqmin] scale-[0.97] rounded-[3cqmin] bg-white/60" aria-hidden />
          {/* La animación de entrada va afuera: la de adentro es la que se arrastra. */}
          <div key={carta.n} className="entrar absolute inset-0">
            <div
              ref={nodo}
              onPointerDown={alBajar}
              onPointerMove={alMover}
              onPointerUp={alSubir}
              onPointerCancel={alSubir}
              className="absolute inset-0 flex touch-none select-none flex-col items-center justify-center rounded-[3cqmin] bg-white px-[4cqmin] py-[3cqmin] text-center text-[#2b2d5c] shadow-2xl"
              style={{
                cursor: 'grab',
                transition: salida ? 'transform 0.35s ease-in, opacity 0.35s ease-in' : undefined,
                transform: salida ? `translateX(${salida === 'der' ? 130 : -130}%) rotate(${salida === 'der' ? 18 : -18}deg)` : undefined,
                opacity: salida ? 0 : 1,
              }}
              aria-live="polite"
            >
              <p className="mb-[2cqmin] font-semibold uppercase tracking-wide text-[#8a8fb8]" style={{ fontSize: 'clamp(12px, 2.8cqmin, 22px)' }}>
                ¿Es correcto?
              </p>
              <Afirmacion c={carta} />
              {/* Sellos que aparecen al arrastrar */}
              <span
                className="pointer-events-none absolute left-[5cqmin] top-[5cqmin] -rotate-12 rounded-[1.2cqmin] border-[0.6cqmin] border-[#1f9d55] px-[2cqmin] font-bold text-[#1f9d55]"
                style={{ opacity: 'var(--si, 0)', fontSize: 'clamp(18px, 5cqmin, 44px)' }}
                aria-hidden
              >
                VERDAD
              </span>
              <span
                className="pointer-events-none absolute right-[5cqmin] top-[5cqmin] rotate-12 rounded-[1.2cqmin] border-[0.6cqmin] border-[#d64545] px-[2cqmin] font-bold text-[#d64545]"
                style={{ opacity: 'var(--no, 0)', fontSize: 'clamp(18px, 5cqmin, 44px)' }}
                aria-hidden
              >
                MENTIRA
              </span>
            </div>
          </div>
        </div>
        <p className="mt-[2.6cqmin] text-white/85" style={{ fontSize: 'clamp(13px, 2.8cqmin, 22px)' }}>
          Desliza la carta o toca un botón
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-2 gap-[3cqmin] px-[4cqmin] pb-[4cqmin]">
        <button
          type="button"
          onClick={() => responder(false)}
          disabled={!!salida}
          aria-keyshortcuts="ArrowLeft"
          className="b3d flex min-h-[clamp(56px,13cqh,120px)] items-center justify-center gap-[1.5cqmin] font-bold"
          style={{ '--c': '#ff5d73', fontSize: 'clamp(20px, 5.6cqmin, 46px)' } as CSSProperties}
        >
          <X className="size-[1.2em]" strokeWidth={3.5} aria-hidden /> Mentira
        </button>
        <button
          type="button"
          onClick={() => responder(true)}
          disabled={!!salida}
          aria-keyshortcuts="ArrowRight"
          className="b3d flex min-h-[clamp(56px,13cqh,120px)] items-center justify-center gap-[1.5cqmin] font-bold"
          style={{ '--c': '#2fc46f', fontSize: 'clamp(20px, 5.6cqmin, 46px)' } as CSSProperties}
        >
          <Check className="size-[1.2em]" strokeWidth={3.5} aria-hidden /> Verdad
        </button>
      </div>

      {aviso && (
        <button
          type="button"
          onClick={() => siguiente()}
          className="entrar absolute inset-x-[5cqmin] top-[34%] z-20 mx-auto flex max-w-[min(90cqw,620px)] flex-col items-center gap-[1cqmin] rounded-[2.4cqmin] bg-[#e5484d] px-[4cqmin] py-[3cqmin] text-center text-white shadow-2xl"
        >
          <span className="font-bold" style={{ fontSize: 'clamp(22px, 6cqmin, 52px)' }}>
            ¡Ups!
          </span>
          <span className="font-semibold leading-tight" style={{ fontSize: 'clamp(17px, 4.4cqmin, 36px)' }}>
            <TextoMat texto={aviso.texto} />
          </span>
          <span className="opacity-85" style={{ fontSize: 'clamp(12px, 2.6cqmin, 20px)' }}>
            Toca para seguir
          </span>
        </button>
      )}

      {flotante && <Flotante key={flotante.id} x="50%" y="40%" texto={flotante.texto} />}
    </div>
  )
}
