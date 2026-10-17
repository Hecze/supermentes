// Tira y afloja: dos equipos en la misma pantalla. Cada respuesta correcta jala la soga hacia su lado.
// Inspirado en "Tug of War" (Arcademic Skill Builders). Pensado para la pizarra digital o la laptop con proyector:
// cada equipo toca su mitad o usa sus teclas (A S D F y H J K L).
import { useCallback, useMemo, useState } from 'react'
import { fuenteDeRetos, opcionesDe } from '../contenido'
import { crearAzar } from '../motor/azar'
import { useTeclas, useTemporizadores } from '../motor/bucle'
import { Confeti } from '../motor/Confeti'
import { CuentaRegresiva } from '../motor/CuentaRegresiva'
import { Llama, LLAMAS } from '../motor/Llama'
import { Enunciado, TextoMat, colorBoton } from '../motor/piezas'
import { sonar } from '../motor/sonido'
import type { PropsJuego, Reto } from '../tipos'

type Equipo = 'rojo' | 'azul'

const EQUIPOS: Record<Equipo, { nombre: string; color: string; teclas: string[]; llamas: [typeof LLAMAS.crema, typeof LLAMAS.crema] }> = {
  rojo: { nombre: 'Equipo Rojo', color: '#ff4d6d', teclas: ['a', 's', 'd', 'f'], llamas: [LLAMAS.crema, LLAMAS.blanca] },
  azul: { nombre: 'Equipo Azul', color: '#4f6dff', teclas: ['h', 'j', 'k', 'l'], llamas: [LLAMAS.cafe, LLAMAS.gris] },
}

/** Cuánto se mueve la soga por cada acierto, en % del ancho de la escena. */
const PASO = 2.4

/** Tamaño de cada llama: cabe en pantallas anchas (proyector) y angostas (celular). */
const LLAMA = 'min(17cqmin, 11.5cqw)'

type Ronda = { reto: Reto; opciones: string[]; id: number }

function Panel({
  equipo,
  ronda,
  aciertos,
  bloqueado,
  elegir,
  ultimo,
}: {
  equipo: Equipo
  ronda: Ronda
  aciertos: number
  bloqueado: boolean
  elegir: (i: number) => void
  ultimo: 'bien' | 'mal' | null
}) {
  const e = EQUIPOS[equipo]
  return (
    <div
      className={`tarjeta-juego relative flex min-w-0 flex-1 flex-col gap-[1.4cqmin] p-[1.8cqmin] ${ultimo === 'mal' ? 'temblar' : ''}`}
      style={{ boxShadow: `0 0.3rem 0 ${e.color}, 0 0 0 0.5cqmin ${e.color} inset` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full px-[1.6cqmin] py-[0.3cqmin] font-bold text-white" style={{ background: e.color, fontSize: 'clamp(13px, 2.8cqmin, 26px)' }}>
          {e.nombre}
        </span>
        <span className="font-bold tabular-nums" style={{ color: e.color, fontSize: 'clamp(14px, 3cqmin, 28px)' }}>
          ✓ {aciertos}
        </span>
      </div>
      <div key={ronda.id} className="entrar flex min-h-0 flex-1 items-center justify-center">
        <Enunciado reto={ronda.reto} tam="clamp(17px, 4.6cqmin, 44px)" />
      </div>
      <div className={`grid grid-cols-2 gap-[1.4cqmin] transition ${bloqueado ? 'opacity-40 grayscale' : ''}`}>
        {ronda.opciones.map((o, i) => (
          <button
            key={`${ronda.id}-${o}`}
            type="button"
            disabled={bloqueado}
            onPointerDown={() => elegir(i)}
            onClick={(ev) => ev.detail === 0 && elegir(i)}
            aria-keyshortcuts={e.teclas[i].toUpperCase()}
            className="b3d sombra-texto relative flex min-h-[clamp(40px,8.5cqh,90px)] items-center justify-center px-[1cqmin] py-[0.8cqmin]"
            style={{ ...colorBoton(i + (equipo === 'azul' ? 4 : 0)), fontSize: `max(14px, calc(clamp(16px, 4.4cqmin, 40px) * ${[...o].length > 8 ? 0.62 : [...o].length > 4 ? 0.8 : 1}))` }}
          >
            <span aria-hidden className="absolute left-[0.5cqmin] top-[0.4cqmin] hidden rounded-[0.4em] bg-white/30 px-[0.5em] text-[clamp(10px,1.8cqmin,16px)] uppercase leading-normal [@media(pointer:fine)]:block">
              {e.teclas[i]}
            </span>
            <TextoMat texto={o} />
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Soga({ contenido, ritmo, semilla, terminar }: PropsJuego) {
  const azar = useMemo(() => crearAzar(semilla), [semilla])
  // Cada equipo tiene su propia fila de retos: no se pueden copiar.
  const fuentes = useMemo(() => ({ rojo: fuenteDeRetos(contenido, crearAzar(semilla + 1)), azul: fuenteDeRetos(contenido, crearAzar(semilla + 2)) }), [contenido, semilla])
  const limite = ritmo === 1 ? 4 : 5
  const despues = useTemporizadores()

  const nueva = useCallback(
    (eq: Equipo): Ronda => {
      const reto = fuentes[eq]()
      return { reto, opciones: opcionesDe(reto, 4, azar), id: Math.random() }
    },
    [fuentes, azar],
  )

  const [fase, setFase] = useState<'cuenta' | 'juega' | 'fin'>('cuenta')
  const [pos, setPos] = useState(0)
  const [rondas, setRondas] = useState<Record<Equipo, Ronda>>(() => ({ rojo: nueva('rojo'), azul: nueva('azul') }))
  const [aciertos, setAciertos] = useState<Record<Equipo, number>>({ rojo: 0, azul: 0 })
  const [bloqueo, setBloqueo] = useState<Record<Equipo, boolean>>({ rojo: false, azul: false })
  const [ultimo, setUltimo] = useState<Record<Equipo, 'bien' | 'mal' | null>>({ rojo: null, azul: null })
  const [tira, setTira] = useState<Equipo | null>(null)
  const [ganador, setGanador] = useState<Equipo | null>(null)

  const empezar = useCallback(() => setFase('juega'), [])

  function elegir(eq: Equipo, i: number) {
    if (fase !== 'juega' || bloqueo[eq]) return
    const r = rondas[eq]
    if (r.opciones[i] === r.reto.respuesta) {
      const nuevaPos = pos + (eq === 'rojo' ? -1 : 1)
      const total = { ...aciertos, [eq]: aciertos[eq] + 1 }
      sonar.paso()
      setPos(nuevaPos)
      setAciertos(total)
      setRondas((rs) => ({ ...rs, [eq]: nueva(eq) }))
      setUltimo((u) => ({ ...u, [eq]: 'bien' }))
      setTira(eq)
      despues(() => setTira((t) => (t === eq ? null : t)), 450)
      if (Math.abs(nuevaPos) >= limite) {
        setFase('fin')
        setGanador(eq)
        despues(
          () =>
            terminar({
              estrellas: 3,
              titulo: `¡Ganó el ${EQUIPOS[eq].nombre}!`,
              detalle: `Rojo acertó ${total.rojo} y Azul acertó ${total.azul}. ¿Revancha?`,
            }),
          1600,
        )
      }
      return
    }
    sonar.error()
    setUltimo((u) => ({ ...u, [eq]: 'mal' }))
    setBloqueo((b) => ({ ...b, [eq]: true }))
    // Un error congela al equipo un momento: así no conviene tocar al azar.
    despues(() => {
      setBloqueo((b) => ({ ...b, [eq]: false }))
      setUltimo((u) => ({ ...u, [eq]: null }))
      setRondas((rs) => ({ ...rs, [eq]: nueva(eq) }))
    }, 1300)
  }

  useTeclas((t) => {
    const k = t.toLowerCase()
    for (const eq of ['rojo', 'azul'] as Equipo[]) {
      const i = EQUIPOS[eq].teclas.indexOf(k)
      if (i >= 0 && i < rondas[eq].opciones.length) elegir(eq, i)
    }
  }, fase === 'juega')

  const perdedor: Equipo | null = ganador ? (ganador === 'rojo' ? 'azul' : 'rojo') : null

  // Una función y no un componente: así las llamas no se vuelven a crear y sus transiciones se ven.
  function llamasDe(eq: Equipo) {
    const izquierda = eq === 'rojo'
    const cae = perdedor === eq
    return (
      <div className={`absolute bottom-0 flex items-end gap-[1cqmin] ${izquierda ? 'left-[12%]' : 'right-[12%] flex-row-reverse'}`}>
        {EQUIPOS[eq].llamas.map((c, i) => (
          <div
            key={i}
            className="transition-transform duration-500"
            style={{
              transformOrigin: 'bottom center',
              transform: cae ? `translateY(18%) rotate(${izquierda ? 28 : -28}deg)` : `rotate(${izquierda ? -7 : 7}deg)`,
            }}
          >
            <Llama colores={c} tam={LLAMA} izquierda={!izquierda} corriendo={tira === eq} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-[#e9f6ff]">
      {/* Escena */}
      <div className="relative h-[46%] shrink-0 overflow-hidden" style={{ background: 'linear-gradient(#7fcaff, #d5efff)' }}>
        <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="absolute inset-x-0 bottom-[26%] h-[55%] w-full" aria-hidden>
          <path d="M0 70 L50 30 L85 55 L140 12 L190 60 L230 35 L290 70 L340 25 L400 60 V100 H0 Z" fill="#a7b4dd" />
          <path d="M128 22 L140 12 L152 23 L146 22 L140 27 L134 22 Z M330 33 L340 25 L350 34 L345 33 L340 37 L335 33 Z" fill="#ffffff" />
          <path d="M0 85 L70 55 L130 80 L210 50 L280 82 L360 58 L400 75 V100 H0 Z" fill="#8fd16a" />
        </svg>
        <div className="absolute inset-x-0 bottom-0 h-[28%] bg-[#6fcf55]" />
        <div className="absolute bottom-[5%] left-1/2 h-[14%] w-[16%] -translate-x-1/2 rounded-[50%] bg-[#8a5a3b] shadow-[inset_0_0.6cqmin_0_rgb(0_0_0/0.18)]" aria-hidden />
        {(['rojo', 'azul'] as Equipo[]).map((eq) => (
          <div
            key={eq}
            className="absolute bottom-[8%] h-[30%] w-[0.6cqmin] rounded-full bg-[#6b4a3a]"
            style={{ left: `calc(50% ${eq === 'rojo' ? '-' : '+'} ${limite * PASO}%)` }}
            aria-hidden
          >
            <span className="absolute left-full top-0 h-[40%] w-[3.4cqmin]" style={{ background: EQUIPOS[eq].color, clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }} />
          </div>
        ))}

        <div
          className="absolute inset-x-0 bottom-[10%] transition-transform duration-300 ease-out"
          style={{ height: LLAMA, transform: `translateX(${pos * PASO}%)` }}
        >
          <div className="absolute inset-x-[14%] top-[25%] h-[1.3cqmin] rounded-full bg-[repeating-linear-gradient(60deg,#c48a4a_0_6px,#9b6a35_6px_10px)] shadow-sm" aria-hidden />
          <div className="absolute left-1/2 top-[25%] -translate-x-1/2" aria-hidden>
            <span className="block h-[5cqmin] w-[3.2cqmin] bg-[#ffc93c]" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
          </div>
          {llamasDe('rojo')}
          {llamasDe('azul')}
        </div>
        {ganador && <Confeti colores={[EQUIPOS[ganador].color, '#ffc93c', '#ffffff']} />}
      </div>

      {/* Paneles de cada equipo */}
      <div className="flex min-h-0 flex-1 gap-[2cqmin] p-[2cqmin]">
        <Panel equipo="rojo" ronda={rondas.rojo} aciertos={aciertos.rojo} bloqueado={bloqueo.rojo} ultimo={ultimo.rojo} elegir={(i) => elegir('rojo', i)} />
        <Panel equipo="azul" ronda={rondas.azul} aciertos={aciertos.azul} bloqueado={bloqueo.azul} ultimo={ultimo.azul} elegir={(i) => elegir('azul', i)} />
      </div>

      {fase === 'cuenta' && <CuentaRegresiva alTerminar={empezar} />}
    </div>
  )
}
