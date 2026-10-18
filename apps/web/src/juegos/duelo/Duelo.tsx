// Duelo de robots: un juego de pelea sin sangre. Cada respuesta correcta es un golpe; tres seguidas, un especial.
// Se juega contra la máquina (en el celular) o de a dos en la pizarra (táctil o teclas A S D F y H J K L).
// Pensado para secundaria: la estética de arcade de pelea engancha más que lo "de niños".
import { Bot, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { fuenteDeRetos, opcionesDe } from '../contenido'
import { crearAzar } from '../motor/azar'
import { useBucle, useTeclas, useTemporizadores } from '../motor/bucle'
import { Confeti } from '../motor/Confeti'
import { CuentaRegresiva } from '../motor/CuentaRegresiva'
import { Enunciado, TextoMat } from '../motor/piezas'
import { ROBOTS, Robot } from '../motor/Robot'
import { sonar } from '../motor/sonido'
import type { PropsJuego, Reto } from '../tipos'

type Lado = 'volt' | 'nova'
type Modo = 'cpu' | 'dos'
type Pose = 'guardia' | 'golpe' | 'recibe' | 'ko'
type Ronda = { reto: Reto; opciones: string[]; id: number }

const DANO = 20
const DANO_ESPECIAL = 35
const TECLAS: Record<Lado, string[]> = { volt: ['a', 's', 'd', 'f'], nova: ['h', 'j', 'k', 'l'] }
const otro = (l: Lado): Lado => (l === 'volt' ? 'nova' : 'volt')

function Barra({ lado, vida }: { lado: Lado; vida: number }) {
  const r = ROBOTS[lado]
  const derecha = lado === 'nova'
  return (
    <div className={`flex min-w-0 flex-1 flex-col gap-[0.6cqmin] ${derecha ? 'items-end' : ''}`}>
      <div className="relative h-[3.2cqmin] min-h-3 w-full overflow-hidden rounded-[0.6cqmin] border-[0.35cqmin] border-white/70 bg-[#3a0d1f] -skew-x-12">
        <div
          className={`absolute inset-y-0 transition-[width] duration-300 ${derecha ? 'right-0' : 'left-0'}`}
          style={{ width: `${Math.max(0, vida)}%`, background: vida > 40 ? `linear-gradient(${r.neon}, color-mix(in oklab, ${r.neon} 60%, #000))` : 'linear-gradient(#ffd23d, #ff5d3d)' }}
        />
      </div>
      <span className="texto-neon tracking-widest" style={{ '--brillo': r.neon, fontSize: 'clamp(13px, 3cqmin, 26px)' } as CSSProperties}>
        {r.nombre}
      </span>
    </div>
  )
}

function Panel({
  lado,
  ronda,
  bloqueado,
  conTeclas,
  elegir,
  marca,
}: {
  lado: Lado
  ronda: Ronda
  bloqueado: boolean
  conTeclas: boolean
  elegir: (i: number) => void
  marca: { opcion: string; bien: boolean } | null
}) {
  const r = ROBOTS[lado]
  return (
    <div
      className="tarjeta-juego relative flex min-w-0 flex-1 flex-col gap-[1.2cqmin] p-[1.6cqmin]"
      style={{ boxShadow: `0 0 0 0.35cqmin ${r.neon}, 0 0 2cqmin color-mix(in oklab, ${r.neon} 45%, transparent)` }}
    >
      <div key={ronda.id} className="entrar flex min-h-0 flex-1 items-center justify-center">
        <Enunciado reto={ronda.reto} tam="clamp(22px, 4.4cqmin, 42px)" />
      </div>
      <div className={`grid grid-cols-2 gap-[1.2cqmin] transition ${bloqueado ? 'opacity-35' : ''}`}>
        {ronda.opciones.map((o, i) => (
          <button
            key={`${ronda.id}-${o}`}
            type="button"
            disabled={bloqueado}
            onPointerDown={() => elegir(i)}
            onClick={(e) => e.detail === 0 && elegir(i)}
            aria-keyshortcuts={conTeclas ? TECLAS[lado][i].toUpperCase() : undefined}
            className={`boton-neon relative flex min-h-[clamp(40px,8cqh,84px)] items-center justify-center px-[1cqmin] py-[0.8cqmin] ${marca?.opcion === o ? (marca.bien ? 'bien' : 'mal') : ''}`}
            style={{ '--c': r.neon, fontSize: `max(15px, calc(clamp(22px, 4.2cqmin, 38px) * ${[...o].length > 8 ? 0.62 : [...o].length > 4 ? 0.8 : 1}))` } as CSSProperties}
          >
            {conTeclas && (
              <span aria-hidden className="absolute left-[0.6cqmin] top-[0.4cqmin] hidden text-[clamp(10px,1.8cqmin,15px)] uppercase opacity-60 [@media(pointer:fine)]:block">
                {TECLAS[lado][i]}
              </span>
            )}
            <TextoMat texto={o} />
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Duelo({ contenido, ritmo, semilla, terminar }: PropsJuego) {
  const azar = useMemo(() => crearAzar(semilla), [semilla])
  const fuentes = useMemo(() => ({ volt: fuenteDeRetos(contenido, crearAzar(semilla + 1)), nova: fuenteDeRetos(contenido, crearAzar(semilla + 2)) }), [contenido, semilla])
  // La máquina carga su golpe más rápido con los grandes; si hay que leer preguntas del tema, más despacio.
  const carga = [0, 11, 9, 7][ritmo] * (contenido.generar ? 1 : 1.6)
  const despues = useTemporizadores()

  const nueva = useCallback(
    (l: Lado): Ronda => {
      const reto = fuentes[l]()
      return { reto, opciones: opcionesDe(reto, 4, azar), id: Math.random() }
    },
    [fuentes, azar],
  )

  const [modo, setModo] = useState<Modo | null>(null)
  const [fase, setFase] = useState<'elige' | 'cuenta' | 'pelea' | 'fin'>('elige')
  const [vida, setVida] = useState<Record<Lado, number>>({ volt: 100, nova: 100 })
  const [rondas, setRondas] = useState<Record<Lado, Ronda>>(() => ({ volt: nueva('volt'), nova: nueva('nova') }))
  const [pose, setPose] = useState<Record<Lado, { pose: Pose; n: number }>>({ volt: { pose: 'guardia', n: 0 }, nova: { pose: 'guardia', n: 0 } })
  const [aturdido, setAturdido] = useState<Record<Lado, boolean>>({ volt: false, nova: false })
  const [marca, setMarca] = useState<Record<Lado, { opcion: string; bien: boolean } | null>>({ volt: null, nova: null })
  const [anuncio, setAnuncio] = useState<{ texto: string; color: string; n: number } | null>(null)
  const [chispas, setChispas] = useState<{ lado: Lado; n: number } | null>(null)
  const [sacude, setSacude] = useState(0)
  const [ganador, setGanador] = useState<Lado | null>(null)
  const racha = useRef<Record<Lado, number>>({ volt: 0, nova: 0 })
  const aciertos = useRef<Record<Lado, number>>({ volt: 0, nova: 0 })
  const cargado = useRef(0)
  const barraCpu = useRef<HTMLDivElement>(null)
  const vidaRef = useRef(vida)
  vidaRef.current = vida
  const arena = useRef<HTMLDivElement>(null)

  // La pantalla tiembla con cada golpe: se reinicia la animación sin volver a crear la arena.
  useEffect(() => {
    const el = arena.current
    if (!sacude || !el) return
    el.classList.remove('sacudir')
    void el.offsetWidth
    el.classList.add('sacudir')
  }, [sacude])

  const empezar = useCallback(() => {
    setFase('pelea')
    anunciar('¡A PELEAR!', '#ffc23d')
  }, [])

  function anunciar(texto: string, color: string) {
    setAnuncio({ texto, color, n: Math.random() })
  }

  function posar(l: Lado, p: Pose) {
    setPose((x) => ({ ...x, [l]: { pose: p, n: x[l].n + 1 } }))
    if (p === 'golpe' || p === 'recibe') despues(() => setPose((x) => (x[l].pose === p ? { ...x, [l]: { pose: 'guardia', n: x[l].n + 1 } } : x)), 420)
  }

  /** `atacante` golpea a su rival. Devuelve true si lo noqueó. */
  function golpear(atacante: Lado, especial: boolean) {
    const victima = otro(atacante)
    const dano = especial ? DANO_ESPECIAL : DANO
    const restante = vidaRef.current[victima] - dano
    setVida((v) => ({ ...v, [victima]: Math.max(0, v[victima] - dano) }))
    posar(atacante, 'golpe')
    despues(() => {
      posar(victima, restante <= 0 ? 'ko' : 'recibe')
      setChispas({ lado: victima, n: Math.random() })
      setSacude((s) => s + 1)
      if (especial) sonar.especial()
      sonar.golpe()
    }, 140)
    if (restante <= 0) {
      setFase('fin')
      setGanador(atacante)
      despues(() => {
        sonar.explosion()
        anunciar('K.O.', '#ff3d5a')
      }, 350)
      despues(() => {
        const r = ROBOTS[atacante].nombre
        if (modo === 'cpu') {
          const gane = atacante === 'volt'
          const v = vidaRef.current.volt
          terminar({
            estrellas: gane ? (v >= 70 ? 3 : v >= 40 ? 2 : 1) : 0,
            titulo: gane ? '¡Le ganaste a la máquina!' : '¡Ganó la máquina!',
            detalle: gane ? `${r} ganó con ${v} de vida y ${aciertos.current.volt} golpes.` : `Acertaste ${aciertos.current.volt}. ¡Pide la revancha!`,
            puntaje: aciertos.current.volt * 100 + (gane ? v * 5 : 0),
          })
        } else {
          terminar({ estrellas: 3, titulo: `¡${r} gana!`, detalle: `VOLT acertó ${aciertos.current.volt} y NOVA acertó ${aciertos.current.nova}. ¿Revancha?` })
        }
      }, 2300)
      return true
    }
    return false
  }

  function elegir(l: Lado, i: number) {
    if (fase !== 'pelea' || aturdido[l]) return
    const r = rondas[l]
    const opcion = r.opciones[i]
    const bien = opcion === r.reto.respuesta
    setMarca((m) => ({ ...m, [l]: { opcion, bien } }))
    despues(() => setMarca((m) => ({ ...m, [l]: null })), 380)
    if (bien) {
      racha.current[l] += 1
      aciertos.current[l] += 1
      const especial = racha.current[l] % 3 === 0
      if (especial) anunciar(`¡ESPECIAL x${racha.current[l]}!`, ROBOTS[l].neon)
      else if (racha.current[l] === 2) anunciar('¡COMBO!', ROBOTS[l].neon)
      cargado.current = 0
      if (!golpear(l, especial)) setRondas((rs) => ({ ...rs, [l]: nueva(l) }))
      return
    }
    sonar.error()
    racha.current[l] = 0
    if (modo === 'cpu') {
      // Contra la máquina, un error es un contraataque.
      anunciar('¡CONTRAATAQUE!', ROBOTS.nova.neon)
      cargado.current = 0
      if (!golpear('nova', false)) setRondas((rs) => ({ ...rs, volt: nueva('volt') }))
      return
    }
    anunciar('¡ATURDIDO!', '#ffc23d')
    setAturdido((a) => ({ ...a, [l]: true }))
    despues(() => {
      setAturdido((a) => ({ ...a, [l]: false }))
      setRondas((rs) => ({ ...rs, [l]: nueva(l) }))
    }, 1300)
  }

  // Contra la máquina: su golpe se carga mientras piensas.
  // Tiempo real: la carga del robot sigue si el jugador sale del juego.
  useBucle((_dt, real) => {
    cargado.current = Math.min(1, cargado.current + real / carga)
    if (barraCpu.current) barraCpu.current.style.transform = `scaleX(${cargado.current})`
    if (cargado.current >= 1) {
      cargado.current = 0
      racha.current.volt = 0
      anunciar('¡MUY LENTO!', ROBOTS.nova.neon)
      if (!golpear('nova', false)) setRondas((rs) => ({ ...rs, volt: nueva('volt') }))
    }
  }, fase === 'pelea' && modo === 'cpu')

  useTeclas((t) => {
    const k = t.toLowerCase()
    for (const l of ['volt', 'nova'] as Lado[]) {
      if (modo === 'cpu' && l === 'nova') continue
      const i = TECLAS[l].indexOf(k)
      if (i >= 0) elegir(l, i)
      else if (modo === 'cpu' && /^[1-4]$/.test(k)) elegir('volt', Number(k) - 1)
    }
  }, fase === 'pelea')

  function luchador(l: Lado) {
    const p = pose[l]
    const clase = p.pose === 'golpe' ? 'golpeando' : p.pose === 'recibe' ? 'recibiendo' : p.pose === 'ko' ? 'noqueado' : 'en-guardia'
    return (
      <div className={`absolute bottom-[6%] ${l === 'volt' ? 'left-[16%] [@container(orientation:portrait)]:left-[4%]' : 'right-[16%] [@container(orientation:portrait)]:right-[4%]'}`} style={{ width: 'min(30cqmin, 38cqw)' }}>
        <div style={l === 'nova' ? { transform: 'scaleX(-1)' } : undefined}>
          <div key={p.n} className={clase}>
            <Robot colores={ROBOTS[l]} className="block h-auto w-full" />
          </div>
        </div>
        {chispas?.lado === l && (
          <span key={chispas.n} className="pointer-events-none absolute left-1/2 top-[45%]" aria-hidden>
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI * 2
              return (
                <span
                  key={i}
                  className="chispa absolute block size-[1.4cqmin] rounded-full"
                  style={{ background: i % 2 ? '#fff6a8' : ROBOTS[otro(l)].neon, boxShadow: '0 0 1cqmin #fff', '--dx': `${Math.cos(a) * 11}cqmin`, '--dy': `${Math.sin(a) * 11}cqmin` } as CSSProperties}
                />
              )
            })}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-[#090a1c]">
      {/* Arena */}
      <div ref={arena} className="relative h-[50%] shrink-0 overflow-hidden" style={{ background: 'linear-gradient(#24104f, #120a2e 55%, #090a1c)' }}>
        <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="absolute inset-x-0 bottom-[34%] h-[46%] w-full" aria-hidden>
          <path d="M0 100 V60 h20 V40 h18 V70 h14 V30 h22 V55 h16 V20 h24 V65 h12 V45 h20 V75 h18 V35 h26 V58 h14 V25 h22 V62 h16 V42 h20 V70 h18 V50 h20 V100 Z" fill="#1a1440" />
          {Array.from({ length: 40 }, (_, i) => (
            <rect key={i} x={(i * 37) % 390 + 4} y={30 + ((i * 53) % 60)} width={3} height={2} fill={i % 3 ? '#ff3dc8' : '#22e3f5'} opacity={0.5} />
          ))}
        </svg>
        <div className="absolute inset-x-0 bottom-[34%] h-[0.5cqmin] bg-[#ff3dc8] shadow-[0_0_2cqmin_#ff3dc8]" aria-hidden />
        <div className="piso-neon absolute inset-x-[-30%] bottom-[-20%] h-[56%]" aria-hidden />

        <div className="absolute inset-x-[3cqmin] top-[10cqmin] flex items-start gap-[3cqmin]">
          <Barra lado="volt" vida={vida.volt} />
          <span className="texto-neon shrink-0" style={{ '--brillo': '#ffc23d', fontSize: 'clamp(16px, 4cqmin, 34px)' } as CSSProperties}>
            VS
          </span>
          <Barra lado="nova" vida={vida.nova} />
        </div>

        {luchador('volt')}
        {luchador('nova')}

        {anuncio && (
          <div key={anuncio.n} className="pointer-events-none absolute inset-x-0 top-[38%] flex justify-center" aria-live="assertive">
            <span className="anuncio texto-neon italic" style={{ '--brillo': anuncio.color, fontSize: 'clamp(30px, 9cqmin, 90px)' } as CSSProperties}>
              {anuncio.texto}
            </span>
          </div>
        )}
        {ganador && <Confeti colores={[ROBOTS[ganador].neon, '#ffffff', '#ffc23d']} />}
      </div>

      {/* Preguntas */}
      <div className="flex min-h-0 flex-1 flex-col gap-[1.4cqmin] p-[2cqmin]">
        {modo === 'cpu' && (
          <div className="flex items-center gap-[1.4cqmin]" style={{ fontSize: 'clamp(12px, 2.6cqmin, 22px)' }}>
            <span className="shrink-0 text-[var(--j-tinta-suave)]">NOVA carga su golpe</span>
            <div className="h-[1.6cqmin] min-h-2 flex-1 overflow-hidden rounded-full bg-[#2a1a45]">
              <div ref={barraCpu} className="h-full w-full origin-left rounded-full" style={{ background: ROBOTS.nova.neon, boxShadow: `0 0 1.4cqmin ${ROBOTS.nova.neon}`, transform: 'scaleX(0)' }} />
            </div>
          </div>
        )}
        <div className="flex min-h-0 flex-1 gap-[2cqmin]">
          <Panel lado="volt" ronda={rondas.volt} bloqueado={aturdido.volt || fase !== 'pelea'} conTeclas={modo === 'dos'} elegir={(i) => elegir('volt', i)} marca={marca.volt} />
          {modo === 'dos' && <Panel lado="nova" ronda={rondas.nova} bloqueado={aturdido.nova || fase !== 'pelea'} conTeclas elegir={(i) => elegir('nova', i)} marca={marca.nova} />}
        </div>
      </div>

      {fase === 'elige' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-[3cqmin] bg-[rgb(9_10_28/0.88)] p-[4cqmin] text-center">
          <p className="texto-neon" style={{ '--brillo': '#22e3f5', fontSize: 'clamp(24px, 6.4cqmin, 60px)' } as CSSProperties}>
            ¿Cómo pelean?
          </p>
          <div className="flex flex-wrap justify-center gap-[3cqmin]">
            {(
              [
                { m: 'cpu', icono: Bot, titulo: '1 jugador', texto: 'Contra la máquina', c: '#22e3f5' },
                { m: 'dos', icono: Users, titulo: '2 jugadores', texto: 'En la pizarra o la laptop', c: '#ff3dc8' },
              ] as const
            ).map((x) => (
              <button
                key={x.m}
                type="button"
                onClick={() => {
                  setModo(x.m)
                  setFase('cuenta')
                }}
                className="boton-neon flex w-[min(40cqw,300px)] flex-col items-center gap-[1cqmin] px-[2cqmin] py-[2.4cqmin]"
                style={{ '--c': x.c } as CSSProperties}
              >
                <x.icono className="size-[clamp(28px,7cqmin,56px)]" aria-hidden />
                <span style={{ fontSize: 'clamp(18px, 4.6cqmin, 40px)' }}>{x.titulo}</span>
                <span className="font-sans text-[clamp(12px,2.6cqmin,20px)] opacity-80">{x.texto}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {fase === 'cuenta' && <CuentaRegresiva alTerminar={empezar} />}
    </div>
  )
}
