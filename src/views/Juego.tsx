import { Copy, Flag, Footprints, Maximize2, MessageCircle, RotateCcw, Trophy } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { api, COSTOS, textoCosto, type Carta, type Juego as DatosJuego } from '../api'
import { normalizar } from '../lib/crucigrama'
import { useStore } from '../app/store'
import { useGeneracion } from '../app/useGeneracion'
import { EncabezadoHerramienta, SinTema } from '../components/Shell'
import { Boton, Costo, Etiqueta, Generando, Pastel, QrEjemplo, Tarjeta, cx, tinte } from '../components/ui'

const COLOR = 'var(--juego)'

type Plantilla = 'memoria' | 'carrera' | 'palabra' | 'clasificar'

const PLANTILLAS: { id: Plantilla; nombre: string; descripcion: string }[] = [
  { id: 'memoria', nombre: 'Memoria', descripcion: 'Encuentra cada fracción con su dibujo.' },
  { id: 'carrera', nombre: 'Carrera de preguntas', descripcion: 'Cada respuesta correcta avanza en la pista.' },
  { id: 'palabra', nombre: 'Adivina la palabra', descripcion: 'Letra por letra, antes de que se revienten los globos.' },
  { id: 'clasificar', nombre: 'Clasificar', descripcion: 'Arrastra cada tarjeta a su grupo.' },
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
  const [movidas, setMovidas] = useState(0)
  const ganaste = encontradas.size === juego.pares.length

  function tocar(i: number) {
    if (abiertas.length === 2 || abiertas.includes(i) || encontradas.has(cartas[i].par)) return
    const nuevas = [...abiertas, i]
    setAbiertas(nuevas)
    if (nuevas.length === 2) {
      setMovidas((m) => m + 1)
      const [a, b] = nuevas
      if (cartas[a].par === cartas[b].par) {
        setEncontradas((e) => new Set(e).add(cartas[a].par))
        setAbiertas([])
      } else {
        window.setTimeout(() => setAbiertas([]), 900)
      }
    }
  }

  function reiniciar() {
    setRonda((r) => r + 1)
    setAbiertas([])
    setEncontradas(new Set())
    setMovidas(0)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm tabular-nums">
        <span>
          Parejas: {encontradas.size}/{juego.pares.length}
        </span>
        <span>Intentos: {movidas}</span>
      </div>
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
                <span
                  className="cara grid place-items-center rounded-xl font-display text-3xl font-bold text-on-tool"
                  style={{ background: COLOR }}
                >
                  ?
                </span>
                <span
                  className={cx('cara cara-frente grid place-items-center rounded-xl border-2 bg-surface p-1')}
                  style={{ borderColor: encontradas.has(c.par) ? COLOR : 'var(--line)' }}
                >
                  <CaraCarta carta={c.carta} />
                </span>
              </span>
            </button>
          )
        })}
      </div>
      {ganaste && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl p-3" style={{ background: tinte(COLOR, 12) }}>
          <Trophy className="size-6" style={{ color: COLOR }} aria-hidden />
          <p className="flex-1 font-semibold">¡Lo lograste en {movidas} intentos!</p>
          <Boton variante="contorno" tam="sm" onClick={reiniciar}>
            <RotateCcw className="size-4" aria-hidden /> Jugar otra vez
          </Boton>
        </div>
      )}
    </div>
  )
}

function Carrera({ juego }: { juego: DatosJuego }) {
  const [i, setI] = useState(0)
  const [elegida, setElegida] = useState<number | null>(null)
  const [puntos, setPuntos] = useState(0)
  const total = juego.preguntas.length
  const terminado = i >= total
  const p = juego.preguntas[Math.min(i, total - 1)]

  function elegir(o: number) {
    if (elegida !== null) return
    setElegida(o)
    if (o === p.correcta) setPuntos((x) => x + 1)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-10 rounded-full bg-surface-2" aria-label={`Avance: ${puntos} de ${total}`}>
        <div className="absolute inset-y-0 left-0 rounded-full transition-all" style={{ width: `${(puntos / total) * 100}%`, background: tinte(COLOR, 30) }} />
        <span
          className="absolute top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-on-tool transition-all"
          style={{ left: `calc(${(puntos / total) * 100}% - ${(puntos / total) * 32}px)`, background: COLOR }}
          aria-hidden
        >
          <Footprints className="size-4" />
        </span>
        <Flag className="absolute right-3 top-1/2 size-5 -translate-y-1/2 text-ink-soft" aria-hidden />
      </div>
      {terminado ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl p-3" style={{ background: tinte(COLOR, 12) }}>
          <Trophy className="size-6" style={{ color: COLOR }} aria-hidden />
          <p className="flex-1 font-semibold">
            Llegaste a la meta con {puntos} de {total} respuestas correctas.
          </p>
          <Boton
            variante="contorno"
            tam="sm"
            onClick={() => {
              setI(0)
              setPuntos(0)
              setElegida(null)
            }}
          >
            <RotateCcw className="size-4" aria-hidden /> Otra carrera
          </Boton>
        </div>
      ) : (
        <>
          <p className="text-sm text-ink-soft tabular-nums">
            Pregunta {i + 1} de {total}
          </p>
          <p className="font-display text-xl font-semibold">{p.pregunta}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {p.opciones.map((o, k) => {
              const correcta = elegida !== null && k === p.correcta
              const mal = elegida === k && k !== p.correcta
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => elegir(k)}
                  className={cx(
                    'min-h-12 rounded-xl border-2 px-4 py-2 text-left font-medium transition',
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

  function siguiente() {
    setN(n + 1)
    setUsadas(new Set())
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center gap-2 text-2xl" aria-label={`Quedan ${GLOBOS - errores} globos`}>
        {Array.from({ length: GLOBOS }, (_, i) => (
          <span key={i} className={cx('transition', i < errores && 'scale-75 opacity-20 grayscale')} aria-hidden>
            🎈
          </span>
        ))}
      </div>
      <p className="text-center text-sm text-ink-soft">Pista: {actual.pista}</p>
      <p className="flex flex-wrap justify-center gap-1.5 font-display text-3xl font-bold" aria-live="polite">
        {palabra.split('').map((l, i) => (
          <span key={i} className="grid h-11 w-8 place-items-end border-b-[3px] border-ink pb-0.5">
            {usadas.has(l) || perdio ? l : ''}
          </span>
        ))}
      </p>
      {gano || perdio ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl p-3" style={{ background: tinte(gano ? COLOR : 'var(--danger)', 12) }}>
          <p className="flex-1 font-semibold">{gano ? '¡Adivinaste!' : `La palabra era ${palabra}.`}</p>
          <Boton variante="contorno" tam="sm" onClick={siguiente}>
            Otra palabra
          </Boton>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-1.5">
          {ABECEDARIO.map((l) => (
            <button
              key={l}
              type="button"
              disabled={usadas.has(l)}
              onClick={() => setUsadas(new Set(usadas).add(l))}
              className={cx(
                'size-9 rounded-lg border border-line text-sm font-semibold transition disabled:opacity-35',
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

function ClasificarVistaPrevia() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap justify-center gap-2">
        {['1/8', '3/4', '1/3', '2/3'].map((f) => (
          <span key={f} className="rounded-lg border-2 border-line bg-surface px-3 py-1.5 font-display text-lg font-bold">
            {f}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {['Menos de la mitad', 'Más de la mitad'].map((g) => (
          <div key={g} className="grid min-h-28 place-items-center rounded-xl border-2 border-dashed border-line p-3 text-center text-sm text-ink-soft">
            {g}
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-ink-soft">Plantilla en diseño: todavía no se puede jugar.</p>
    </div>
  )
}

export function Juego() {
  const { ficha, resultados, guardar, avisar } = useStore()
  const { ocupado, generar } = useGeneracion()
  const [plantilla, setPlantilla] = useState<Plantilla>('memoria')
  const escenario = useRef<HTMLDivElement>(null)
  const juego = resultados.juego

  if (!ficha) return <SinTema />

  async function crear() {
    const nuevo = await generar(COSTOS.juego, 'Juego', () => api.generarJuego(ficha!))
    if (nuevo) guardar('juego', nuevo)
  }

  const enlace = juego ? `supermentes.pe/j/${juego.codigo}` : ''
  const mensajeWhatsapp = juego
    ? `¡Hola! Hoy jugamos sobre "${ficha.titulo}". Entra aquí: https://${enlace} (código ${juego.codigo})`
    : ''

  async function copiar() {
    try {
      await navigator.clipboard.writeText(`https://${enlace}`)
      avisar('Link copiado.', 'ok')
    } catch {
      avisar(`Copia este link: https://${enlace}`)
    }
  }

  function pantallaCompleta() {
    escenario.current?.requestFullscreen?.().catch(() => avisar('Tu navegador no permite pantalla completa aquí.', 'error'))
  }

  return (
    <>
      <EncabezadoHerramienta id="juego" />

      {!juego ? (
        <Tarjeta className="flex flex-col items-start gap-3">
          <p className="max-w-xl text-ink-soft">
            Creamos el contenido una sola vez a partir de tu ficha. Después puedes cambiar de plantilla gratis, porque todas usan el mismo contenido.
          </p>
          <Boton variante="herramienta" herramienta="juego" onClick={crear} cargando={ocupado}>
            Crear el juego · {textoCosto(COSTOS.juego)}
          </Boton>
          {ocupado && <Generando texto="Preparando preguntas, parejas y palabras…" />}
        </Tarjeta>
      ) : (
        <>
          <section className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Etiqueta>Plantilla</Etiqueta>
              <Costo n={0} />
              <span className="text-xs text-ink-soft">Cambiar de plantilla no gasta créditos.</span>
            </div>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {PLANTILLAS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlantilla(p.id)}
                  aria-pressed={plantilla === p.id}
                  className="flex flex-col gap-1 rounded-xl border-2 bg-surface p-3 text-left transition hover:bg-surface-2"
                  style={{ borderColor: plantilla === p.id ? COLOR : 'var(--line)' }}
                >
                  <span className="font-semibold">{p.nombre}</span>
                  <span className="text-xs text-ink-soft">{p.descripcion}</span>
                </button>
              ))}
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div ref={escenario} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-xl font-bold" style={{ color: COLOR }}>
                  {PLANTILLAS.find((p) => p.id === plantilla)?.nombre}
                </p>
                <Boton variante="suave" tam="sm" onClick={pantallaCompleta}>
                  <Maximize2 className="size-4" aria-hidden /> Proyectar
                </Boton>
              </div>
              {plantilla === 'memoria' && <Memoria juego={juego} />}
              {plantilla === 'carrera' && <Carrera juego={juego} />}
              {plantilla === 'palabra' && <AdivinaPalabra juego={juego} />}
              {plantilla === 'clasificar' && <ClasificarVistaPrevia />}
            </div>

            <Tarjeta className="flex flex-col gap-4 self-start">
              <div>
                <Etiqueta>Compartir con tu clase</Etiqueta>
                <p className="mt-1 text-sm text-ink-soft">Tus estudiantes entran desde cualquier celular, sin cuenta ni instalar nada.</p>
              </div>
              <div className="flex items-center gap-4">
                <QrEjemplo semilla={juego.codigo} tam={120} />
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-xs text-ink-soft">Código de la clase</span>
                  <span className="font-display text-2xl font-bold tracking-wide">{juego.codigo}</span>
                  <span className="truncate text-sm text-ink-soft">{enlace}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(mensajeWhatsapp)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium text-on-tool hover:opacity-90"
                  style={{ background: COLOR }}
                >
                  <MessageCircle className="size-4" aria-hidden /> Enviar por WhatsApp
                </a>
                <Boton variante="contorno" tam="sm" onClick={copiar}>
                  <Copy className="size-4" aria-hidden /> Copiar link
                </Boton>
              </div>
              <p className="text-xs text-ink-soft">QR y link de ejemplo: se activan cuando el juego se publica desde el backend.</p>
            </Tarjeta>
          </div>
        </>
      )}
    </>
  )
}
