import { Copy, Flag, Footprints, Maximize2, MessageCircle, RotateCcw, Share2, Trophy } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { api, COSTOS, type Carta, type Juego as DatosJuego } from '../api'
import { normalizar } from '../lib/crucigrama'
import { useStore } from '../app/store'
import { useGeneracion } from '../app/useGeneracion'
import { EncabezadoHerramienta, SinTema } from '../components/Shell'
import { Acciones, Boton, Generando, NotaCreditos, Pastel, Pregunta, QrEjemplo, cx, tinte } from '../components/ui'

const COLOR = 'var(--juego)'

type Plantilla = 'memoria' | 'carrera' | 'palabra'

const PLANTILLAS: { id: Plantilla; nombre: string }[] = [
  { id: 'memoria', nombre: 'Memoria' },
  { id: 'carrera', nombre: 'Carrera de preguntas' },
  { id: 'palabra', nombre: 'Adivina la palabra' },
]

function barajar<T>(lista: T[], semilla: number) {
  const a = [...lista]
  let s = semilla
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function Ganaste({ texto, otraVez }: { texto: string; otraVez: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl p-3" style={{ background: tinte(COLOR, 12) }}>
      <Trophy className="size-6" style={{ color: COLOR }} aria-hidden />
      <p className="flex-1 font-semibold">{texto}</p>
      <Boton variante="contorno" tam="sm" onClick={otraVez}>
        <RotateCcw className="size-4" aria-hidden /> Otra vez
      </Boton>
    </div>
  )
}

function CaraCarta({ carta }: { carta: Carta }) {
  return carta.fraccion ? (
    <span className="flex flex-col items-center gap-1">
      <Pastel fraccion={carta.fraccion} tam={44} color={COLOR} />
      <span className="text-[11px] leading-tight">{carta.texto}</span>
    </span>
  ) : (
    <span className="font-display text-2xl font-bold">{carta.texto}</span>
  )
}

function Memoria({ juego }: { juego: DatosJuego }) {
  const [ronda, setRonda] = useState(1)
  const cartas = useMemo(
    () => barajar(juego.pares.flatMap((p, i) => [{ par: i, carta: p.a }, { par: i, carta: p.b }]), ronda * 7 + 3),
    [juego, ronda],
  )
  const [abiertas, setAbiertas] = useState<number[]>([])
  const [encontradas, setEncontradas] = useState<Set<number>>(new Set())
  const [intentos, setIntentos] = useState(0)

  function tocar(i: number) {
    if (abiertas.length === 2 || abiertas.includes(i) || encontradas.has(cartas[i].par)) return
    const nuevas = [...abiertas, i]
    setAbiertas(nuevas)
    if (nuevas.length < 2) return
    setIntentos((n) => n + 1)
    const [a, b] = nuevas
    if (cartas[a].par === cartas[b].par) {
      setEncontradas((e) => new Set(e).add(cartas[a].par))
      setAbiertas([])
    } else {
      window.setTimeout(() => setAbiertas([]), 900)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-ink-soft tabular-nums">
        Encuentra las parejas · {encontradas.size} de {juego.pares.length}
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6">
        {cartas.map((c, i) => {
          const visible = abiertas.includes(i) || encontradas.has(c.par)
          return (
            <button
              key={`${ronda}-${i}`}
              type="button"
              onClick={() => tocar(i)}
              className={cx('voltear aspect-[4/5] w-full', visible && 'volteada')}
              aria-label={visible ? c.carta.texto : 'Carta tapada'}
            >
              <span className="voltear-interior block">
                <span className="cara grid place-items-center rounded-xl font-display text-3xl font-bold text-on-tool" style={{ background: COLOR }}>
                  ?
                </span>
                <span
                  className="cara cara-frente grid place-items-center rounded-xl border-2 bg-surface p-1"
                  style={{ borderColor: encontradas.has(c.par) ? COLOR : 'var(--line)' }}
                >
                  <CaraCarta carta={c.carta} />
                </span>
              </span>
            </button>
          )
        })}
      </div>
      {encontradas.size === juego.pares.length && (
        <Ganaste
          texto={`¡Lo lograron en ${intentos} intentos!`}
          otraVez={() => {
            setRonda((r) => r + 1)
            setAbiertas([])
            setEncontradas(new Set())
            setIntentos(0)
          }}
        />
      )}
    </div>
  )
}

function Carrera({ juego }: { juego: DatosJuego }) {
  const [i, setI] = useState(0)
  const [elegida, setElegida] = useState<number | null>(null)
  const [puntos, setPuntos] = useState(0)
  const total = juego.preguntas.length
  const p = juego.preguntas[Math.min(i, total - 1)]
  const avance = puntos / total

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-10 rounded-full bg-surface-2" aria-label={`Avance: ${puntos} de ${total}`}>
        <div className="absolute inset-y-0 left-0 rounded-full transition-all" style={{ width: `${avance * 100}%`, background: tinte(COLOR, 30) }} />
        <span
          className="absolute top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-on-tool transition-all"
          style={{ left: `calc(${avance * 100}% - ${avance * 32}px)`, background: COLOR }}
          aria-hidden
        >
          <Footprints className="size-4" />
        </span>
        <Flag className="absolute right-3 top-1/2 size-5 -translate-y-1/2 text-ink-soft" aria-hidden />
      </div>
      {i >= total ? (
        <Ganaste
          texto={`Llegaron a la meta con ${puntos} de ${total} respuestas correctas.`}
          otraVez={() => {
            setI(0)
            setPuntos(0)
            setElegida(null)
          }}
        />
      ) : (
        <>
          <p className="font-display text-xl font-semibold sm:text-2xl">{p.pregunta}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {p.opciones.map((o, k) => {
              const correcta = elegida !== null && k === p.correcta
              const mal = elegida === k && k !== p.correcta
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => {
                    if (elegida !== null) return
                    setElegida(k)
                    if (k === p.correcta) setPuntos((x) => x + 1)
                  }}
                  className={cx(
                    'min-h-14 rounded-xl border-2 px-4 py-2 text-left text-lg font-medium transition',
                    correcta ? 'border-ok bg-ok/12' : mal ? 'border-danger bg-danger/10' : 'border-line bg-surface hover:bg-surface-2',
                  )}
                >
                  {o}
                </button>
              )
            })}
          </div>
          {elegida !== null && (
            <Boton
              className="self-end"
              onClick={() => {
                setI(i + 1)
                setElegida(null)
              }}
            >
              {i + 1 < total ? 'Siguiente' : 'Ver resultado'}
            </Boton>
          )}
        </>
      )}
    </div>
  )
}

const ABECEDARIO = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('')
const GLOBOS = 6

function AdivinaPalabra({ juego }: { juego: DatosJuego }) {
  const [n, setN] = useState(0)
  const [usadas, setUsadas] = useState<Set<string>>(new Set())
  const actual = juego.palabras[n % juego.palabras.length]
  const palabra = normalizar(actual.palabra)
  const errores = [...usadas].filter((l) => !palabra.includes(l)).length
  const gano = palabra.split('').every((l) => usadas.has(l))
  const perdio = errores >= GLOBOS

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center gap-2 text-2xl" aria-label={`Quedan ${GLOBOS - errores} globos`}>
        {Array.from({ length: GLOBOS }, (_, i) => (
          <span key={i} className={cx('transition', i < errores && 'scale-75 opacity-20 grayscale')} aria-hidden>
            🎈
          </span>
        ))}
      </div>
      <p className="text-center text-ink-soft">Pista: {actual.pista}</p>
      <p className="flex flex-wrap justify-center gap-1.5 font-display text-3xl font-bold" aria-live="polite">
        {palabra.split('').map((l, i) => (
          <span key={i} className="grid h-11 w-8 place-items-end justify-center border-b-[3px] border-ink pb-0.5">
            {usadas.has(l) || perdio ? l : ''}
          </span>
        ))}
      </p>
      {gano || perdio ? (
        <Ganaste
          texto={gano ? '¡Adivinaron!' : `La palabra era ${palabra}.`}
          otraVez={() => {
            setN(n + 1)
            setUsadas(new Set())
          }}
        />
      ) : (
        <div className="flex flex-wrap justify-center gap-1.5">
          {ABECEDARIO.map((l) => (
            <button
              key={l}
              type="button"
              disabled={usadas.has(l)}
              onClick={() => setUsadas(new Set(usadas).add(l))}
              className={cx(
                'size-10 rounded-lg border border-line font-semibold transition disabled:opacity-35',
                usadas.has(l) && palabra.includes(l) ? 'bg-ok/15' : 'bg-surface hover:bg-surface-2',
              )}
            >
              {l}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Compartir({ juego, titulo }: { juego: DatosJuego; titulo: string }) {
  const { avisar } = useStore()
  const enlace = `supermentes.pe/j/${juego.codigo}`
  const mensaje = `¡Hola! Hoy jugamos sobre "${titulo}". Entra aquí: https://${enlace} (código ${juego.codigo})`

  async function copiar() {
    try {
      await navigator.clipboard.writeText(`https://${enlace}`)
      avisar('Link copiado.', 'ok')
    } catch {
      avisar(`Copia este link: https://${enlace}`)
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border-2 bg-surface p-5 sm:flex-row sm:items-center" style={{ borderColor: COLOR }}>
      <QrEjemplo semilla={juego.codigo} tam={136} />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div>
          <p className="font-semibold">Tus alumnos escanean el código con el celular</p>
          <p className="text-ink-soft">
            O entran a {enlace} con el código <strong className="text-ink">{juego.codigo}</strong>. No necesitan cuenta.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-xl px-4 font-medium text-on-tool hover:opacity-90"
            style={{ background: COLOR }}
          >
            <MessageCircle className="size-5" aria-hidden /> Enviar por WhatsApp
          </a>
          <Boton variante="contorno" onClick={copiar}>
            <Copy className="size-5" aria-hidden /> Copiar link
          </Boton>
        </div>
        <p className="text-xs text-ink-soft">Código y link de ejemplo hasta que el juego se publique desde el servidor.</p>
      </div>
    </section>
  )
}

export function Juego() {
  const { ficha, resultados, guardar, avisar, creditos } = useStore()
  const { ocupado, generar } = useGeneracion()
  const [plantilla, setPlantilla] = useState<Plantilla>('memoria')
  const [compartir, setCompartir] = useState(false)
  const escenario = useRef<HTMLDivElement>(null)
  const juego = resultados.juego

  if (!ficha) return <SinTema />

  async function crear() {
    const nuevo = await generar(COSTOS.juego, 'Juego', () => api.generarJuego(ficha!))
    if (nuevo) guardar('juego', nuevo)
  }

  if (!juego) {
    return (
      <>
        <EncabezadoHerramienta id="juego" />
        <Pregunta titulo="Creamos juegos con tu tema">
          <p className="max-w-2xl text-lg text-ink-soft">
            Memoria, carrera de preguntas y adivina la palabra. Se juegan proyectados en clase o desde el celular de cada alumno.
          </p>
        </Pregunta>
        <div className="flex flex-col items-start gap-2">
          <Boton tam="lg" variante="herramienta" herramienta="juego" onClick={crear} cargando={ocupado}>
            Crear los juegos
          </Boton>
          <NotaCreditos n={COSTOS.juego} quedan={creditos} />
        </div>
        {ocupado && <Generando texto="Preparando preguntas, parejas y palabras…" />}
      </>
    )
  }

  return (
    <>
      <EncabezadoHerramienta id="juego" />

      <div className="flex gap-1 overflow-x-auto rounded-2xl bg-surface-2 p-1" role="tablist" aria-label="Juego">
        {PLANTILLAS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={plantilla === p.id}
            onClick={() => setPlantilla(p.id)}
            className={cx(
              'h-11 flex-1 whitespace-nowrap rounded-xl px-4 transition',
              plantilla === p.id ? 'bg-surface font-semibold shadow-sm' : 'text-ink-soft hover:text-ink',
            )}
          >
            {p.nombre}
          </button>
        ))}
      </div>

      <div ref={escenario} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 sm:p-8">
        {plantilla === 'memoria' && <Memoria juego={juego} />}
        {plantilla === 'carrera' && <Carrera juego={juego} />}
        {plantilla === 'palabra' && <AdivinaPalabra juego={juego} />}
      </div>

      <Acciones>
        <Boton variante="herramienta" herramienta="juego" onClick={() => setCompartir(!compartir)}>
          <Share2 className="size-5" aria-hidden /> Compartir con mis alumnos
        </Boton>
        <Boton
          variante="contorno"
          onClick={() => escenario.current?.requestFullscreen?.().catch(() => avisar('Tu navegador no permite pantalla completa aquí.', 'error'))}
        >
          <Maximize2 className="size-5" aria-hidden /> Proyectar en clase
        </Boton>
      </Acciones>

      {compartir && <Compartir juego={juego} titulo={ficha.titulo} />}
    </>
  )
}
