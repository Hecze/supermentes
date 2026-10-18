// Carrera de llamas: si aciertas, tu llama avanza; si fallas, avanza la rival. Sin reloj, para leer con calma:
// sirve también para preguntas largas del tema.
import { useMemo, useState } from 'react'
import { fuenteDeRetos, opcionesDe } from '../contenido'
import { crearAzar } from '../motor/azar'
import { useTeclas, useTemporizadores } from '../motor/bucle'
import { Llama, LLAMAS } from '../motor/Llama'
import { Enunciado, TextoMat, colorBoton, elogio } from '../motor/piezas'
import { sonar } from '../motor/sonido'
import type { PropsJuego } from '../tipos'

const INICIO = 3
const META = 82

function Corredora({ pasos, meta, colores, carril, corriendo }: { pasos: number; meta: number; colores: typeof LLAMAS.crema; carril: 0 | 1; corriendo: boolean }) {
  const x = INICIO + (pasos / meta) * (META - INICIO)
  return (
    <div
      className="absolute transition-[left] duration-700 ease-out"
      style={{ left: `${x}%`, bottom: carril === 0 ? '3%' : '25%', zIndex: carril === 0 ? 3 : 2 }}
    >
      {carril === 0 && (
        <span className="absolute -top-[1.6cqmin] left-[66%] block h-[2.4cqmin] w-[3cqmin] -translate-x-1/2 bg-[#ff4d6d]" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} aria-hidden />
      )}
      <Llama colores={colores} tam={carril === 0 ? 'clamp(60px, min(20cqmin, 19cqh), 170px)' : 'clamp(50px, min(17cqmin, 16cqh), 145px)'} corriendo={corriendo} />
    </div>
  )
}

function Marcador({ colores, texto, pasos, meta }: { colores: typeof LLAMAS.crema; texto: string; pasos: number; meta: number }) {
  return (
    <span className="flex items-center gap-[0.6cqmin] rounded-full bg-white/90 py-[0.2cqmin] pl-[0.6cqmin] pr-[1.6cqmin] font-semibold tabular-nums shadow" style={{ fontSize: 'clamp(13px, 3cqmin, 24px)' }}>
      <Llama colores={colores} tam="1.9em" />
      {texto} {pasos}/{meta}
    </span>
  )
}

export default function Carrera({ contenido, ritmo, semilla, terminar }: PropsJuego) {
  const azar = useMemo(() => crearAzar(semilla), [semilla])
  const siguienteReto = useMemo(() => fuenteDeRetos(contenido, azar), [contenido, azar])
  const meta = ritmo === 1 ? 6 : 8
  const despues = useTemporizadores()

  const [ronda, setRonda] = useState(() => {
    const reto = siguienteReto()
    return { reto, opciones: opcionesDe(reto, 4, azar), n: 0 }
  })
  const [elegida, setElegida] = useState<string | null>(null)
  const [mios, setMios] = useState(0)
  const [rival, setRival] = useState(0)
  const [corre, setCorre] = useState<'yo' | 'rival' | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)

  function siguiente() {
    const reto = siguienteReto()
    setRonda((r) => ({ reto, opciones: opcionesDe(reto, 4, azar), n: r.n + 1 }))
    setElegida(null)
    setMensaje(null)
  }

  function elegir(o: string) {
    if (elegida) return
    setElegida(o)
    const bien = o === ronda.reto.respuesta
    if (bien) {
      sonar.acierto()
      setMios(mios + 1)
      setMensaje(elogio(azar))
    } else {
      sonar.error()
      setRival(rival + 1)
      setMensaje('¡Avanza la rival!')
    }
    setCorre(bien ? 'yo' : 'rival')
    despues(() => setCorre(null), 750)
    const yo = bien ? mios + 1 : mios
    const ella = bien ? rival : rival + 1
    if (yo >= meta || ella >= meta) {
      despues(() => {
        const gane = yo >= meta
        terminar({
          estrellas: gane ? (ella <= 1 ? 3 : ella <= 3 ? 2 : 1) : 0,
          titulo: gane ? '¡Tu llama ganó la carrera!' : '¡Ganó la rival!',
          puntaje: Math.max(0, yo * 100 - ella * 50),
          detalle: gane ? (ella === 0 ? 'Llegaste a la meta sin ningún error.' : `Llegaste a la meta con ${ella} ${ella === 1 ? 'error' : 'errores'}.`) : `Acertaste ${yo} de ${yo + ella}. ¡Pide la revancha!`,
        })
      }, 1300)
      return
    }
    // Si fallaste, hay más tiempo para leer la respuesta correcta.
    despues(siguiente, bien ? 1100 : 2300)
  }

  useTeclas((t) => {
    const n = Number(t)
    if (n >= 1 && n <= ronda.opciones.length) elegir(ronda.opciones[n - 1])
  })

  const largas = ronda.opciones.some((o) => [...o].length > 14)

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-[#fff6ea]">
      {/* Pista; en la laptop o el proyector, más alta, para que las llamas se vean y no sobre espacio abajo */}
      <div className="relative h-[40%] shrink-0 overflow-hidden [@container(orientation:landscape)]:h-[52%]" style={{ background: 'linear-gradient(#ffc98a, #ffeedb)' }}>
        <div className="absolute right-[24%] top-[12%] size-[12cqmin] rounded-full bg-[#ff9d5c] opacity-80" aria-hidden />
        <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="absolute inset-x-0 bottom-[38%] h-[60%] w-full" aria-hidden>
          <path d="M0 80 L40 40 L80 66 L130 18 L180 62 L220 38 L270 74 L320 26 L370 58 L400 44 V100 H0 Z" fill="#a08bdc" />
          <path d="M118 30 L130 18 L142 30 L136 29 L130 34 L124 29 Z M308 38 L320 26 L332 38 L326 37 L320 42 L314 37 Z" fill="#ffffff" />
          <path d="M0 90 L60 64 L120 84 L200 60 L260 86 L330 66 L400 82 V100 H0 Z" fill="#c3a6e8" />
        </svg>
        <div className="absolute inset-x-0 bottom-0 h-[42%] bg-[#8fd16a]" aria-hidden />
        <div className="absolute inset-x-0 bottom-[23%] h-[14%] bg-[#e7bd85]" aria-hidden />
        <div className="absolute inset-x-0 bottom-[3%] h-[16%] bg-[#e7bd85]" aria-hidden />
        <div
          className="absolute bottom-[3%] h-[34%] w-[2.4%]"
          style={{ left: `${META + 9}%`, backgroundImage: 'repeating-conic-gradient(#2b2d5c 0 25%, #fff 0 50%)', backgroundSize: '1.6cqmin 1.6cqmin' }}
          aria-hidden
        />
        <div className="absolute bottom-[30%] h-[44%] w-[0.5cqmin] bg-[#6b4a3a]" style={{ left: `${META + 11}%` }} aria-hidden>
          <span className="absolute left-full top-0 h-[34%] w-[5cqmin] bg-[#ff5d73]" style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }} />
        </div>
        <Corredora pasos={rival} meta={meta} colores={LLAMAS.cafe} carril={1} corriendo={corre === 'rival'} />
        <Corredora pasos={mios} meta={meta} colores={LLAMAS.crema} carril={0} corriendo={corre === 'yo'} />
        <div className="absolute left-[3cqmin] top-[2.2cqmin] flex flex-wrap gap-[1.2cqmin]">
          <Marcador colores={LLAMAS.crema} texto="Tú" pasos={mios} meta={meta} />
          <Marcador colores={LLAMAS.cafe} texto="Rival" pasos={rival} meta={meta} />
        </div>
      </div>

      {/* Pregunta */}
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-[2.4cqmin] p-[3cqmin]">
        <div key={ronda.n} className="tarjeta-juego entrar flex w-full max-w-[min(94cqw,820px)] items-center justify-center px-[3cqmin] py-[2cqmin]">
          <Enunciado reto={ronda.reto} tam="clamp(24px, 5.6cqmin, 52px)" />
        </div>
        <div className={`grid w-full max-w-[min(94cqw,820px)] gap-[1.8cqmin] ${largas ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {ronda.opciones.map((o, i) => {
            const correcta = elegida !== null && o === ronda.reto.respuesta
            const mal = elegida === o && !correcta
            return (
              <button
                key={`${ronda.n}-${o}`}
                type="button"
                onClick={() => elegir(o)}
                disabled={elegida !== null}
                className={`b3d sombra-texto min-h-[clamp(54px,10cqh,110px)] px-[2cqmin] py-[1.4cqmin] ${largas ? 'text-left' : ''} ${correcta ? 'bien' : ''} ${mal ? 'mal' : ''} ${elegida && !correcta && !mal ? 'apagado' : ''}`}
                style={{ ...colorBoton(i), fontSize: largas ? 'clamp(20px, 3.6cqmin, 32px)' : 'clamp(24px, 4.6cqmin, 42px)' }}
              >
                <TextoMat texto={o} />
              </button>
            )
          })}
        </div>
        {mensaje && (
          <p key={mensaje + ronda.n} className="entrar absolute bottom-[1.5cqmin] font-bold" style={{ color: elegida === ronda.reto.respuesta ? '#1f9d55' : '#e23b55', fontSize: 'clamp(15px, 3.4cqmin, 28px)' }}>
            {mensaje}
          </p>
        )}
      </div>
    </div>
  )
}
