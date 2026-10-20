// Una partida: portada con el botón "¡Jugar!", el juego y la pantalla final con estrellas.
// La escena es la misma en la app del docente, al proyectar y en el celular del alumno.
import { LayoutGrid, Maximize2, Minimize2, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { Suspense, useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import type { Contenido, DefinicionJuego, Resultado, Ritmo } from '../tipos'
import { nuevaSemilla } from './azar'
import { Confeti } from './Confeti'
import { muestraDe } from '../miniaturas'
import { Llama } from './Llama'
import { num } from '../matematica/formato'
import { Estrellas, TextoMat } from './piezas'
import { activarAudio, alternarSilencio, sonar, useSilencio } from './sonido'
import '../juegos.css'

/** Pantalla completa con la API del navegador o, donde no existe (iPhone), tapando toda la ventana. */
export function usePantallaCompleta() {
  const ref = useRef<HTMLDivElement>(null)
  const [nativa, setNativa] = useState(false)
  const [fija, setFija] = useState(false)

  useEffect(() => {
    const f = () => setNativa(!!ref.current && document.fullscreenElement === ref.current)
    document.addEventListener('fullscreenchange', f)
    return () => document.removeEventListener('fullscreenchange', f)
  }, [])

  useEffect(() => {
    if (!fija) return
    const salir = (e: KeyboardEvent) => e.key === 'Escape' && setFija(false)
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', salir)
    return () => {
      document.body.style.overflow = antes
      window.removeEventListener('keydown', salir)
    }
  }, [fija])

  const alternar = useCallback(async () => {
    const el = ref.current
    if (!el) return
    if (document.fullscreenElement) return void document.exitFullscreen().catch(() => {})
    if (fija) return setFija(false)
    if (el.requestFullscreen && document.fullscreenEnabled) {
      try {
        await el.requestFullscreen()
        return
      } catch {
        // Algunos visores lo bloquean: se usa la ventana completa.
      }
    }
    setFija(true)
  }, [fija])

  return { ref, activa: nativa || fija, fija, alternar }
}

export type PantallaCompleta = ReturnType<typeof usePantallaCompleta>

function claveRecord(def: DefinicionJuego, c: Contenido) {
  return `supermentes-record:${def.id}:${c.titulo}`
}

function leerRecord(clave: string) {
  try {
    return Number(localStorage.getItem(clave)) || 0
  } catch {
    return 0
  }
}

function BotonEsquina({ onClick, etiqueta, children }: { onClick: () => void; etiqueta: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      title={etiqueta}
      className="grid size-[clamp(36px,7cqmin,52px)] place-items-center rounded-full bg-white/85 text-[#2b2d5c] shadow-md backdrop-blur-sm transition hover:bg-white"
    >
      {children}
    </button>
  )
}

function Controles({ pantalla }: { pantalla: PantallaCompleta }) {
  const silencio = useSilencio()
  const icono = 'size-[55%]'
  return (
    <div className="absolute right-[2.2cqmin] top-[2.2cqmin] z-50 flex gap-[1.5cqmin]">
      <BotonEsquina onClick={alternarSilencio} etiqueta={silencio ? 'Activar sonido' : 'Silenciar'}>
        {silencio ? <VolumeX className={icono} /> : <Volume2 className={icono} />}
      </BotonEsquina>
      <BotonEsquina onClick={pantalla.alternar} etiqueta={pantalla.activa ? 'Salir de pantalla completa' : 'Pantalla completa'}>
        {pantalla.activa ? <Minimize2 className={icono} /> : <Maximize2 className={icono} />}
      </BotonEsquina>
    </div>
  )
}

function Portada({ def, contenido, jugar, pie }: { def: DefinicionJuego; contenido: Contenido; jugar: () => void; pie?: ReactNode }) {
  const { Miniatura } = def
  const oscuro = def.estilo === 'juvenil'
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-[2.6cqmin] overflow-hidden px-[5cqmin] text-center text-white"
      style={{
        background: oscuro
          ? `radial-gradient(circle at 50% 35%, color-mix(in oklab, ${def.color} 45%, #090a1c), #090a1c 75%)`
          : `radial-gradient(circle at 50% 35%, color-mix(in oklab, ${def.color} 70%, white), ${def.color} 70%)`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{ backgroundImage: 'radial-gradient(circle, rgb(255 255 255 / 0.9) 1.5px, transparent 2px)', backgroundSize: '26px 26px' }}
        aria-hidden
      />
      <div className="entrar relative w-[min(46cqw,44cqh)] -rotate-2 overflow-hidden rounded-[3cqmin] border-[1cqmin] border-white shadow-xl">
        <Miniatura muestra={muestraDe(contenido)} />
      </div>
      <h2
        className={`entrar relative font-bold leading-none ${oscuro ? 'texto-neon uppercase' : 'sombra-texto'}`}
        style={{ fontSize: 'clamp(30px, 9cqmin, 88px)', animationDelay: '80ms', '--brillo': def.color } as CSSProperties}
      >
        {def.nombre}
      </h2>
      <p className="relative max-w-[60ch] font-medium leading-snug" style={{ fontSize: 'clamp(15px, 3.4cqmin, 28px)' }}>
        {def.instrucciones}
      </p>
      <p className="relative rounded-full bg-white/20 px-[2.4cqmin] py-[0.8cqmin] font-medium" style={{ fontSize: 'clamp(13px, 2.8cqmin, 24px)' }}>
        Practican: <TextoMat texto={contenido.titulo} className="font-semibold" />
      </p>
      <button
        type="button"
        onClick={jugar}
        className="b3d latir relative mt-[1cqmin] inline-flex items-center gap-[0.35em] px-[1.1em] py-[0.45em]"
        style={{ '--c': '#ffc93c', '--t': '#4a2c00', fontSize: 'clamp(24px, 7cqmin, 60px)' } as CSSProperties}
      >
        <Play className="size-[0.9em] fill-current" aria-hidden /> ¡Jugar!
      </button>
      {pie && <div className="relative">{pie}</div>}
    </div>
  )
}

function Final({
  resultado,
  record,
  nuevoRecord,
  otraVez,
  alSalir,
}: {
  resultado: Resultado
  record: number
  nuevoRecord: boolean
  otraVez: () => void
  alSalir?: () => void
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[rgb(30_20_80/0.45)] p-[4cqmin] backdrop-blur-[2px]">
      {resultado.estrellas >= 2 && <Confeti />}
      <div className="tarjeta-juego entrar relative flex w-[min(92cqw,560px)] flex-col items-center gap-[2.4cqmin] px-[5cqmin] pb-[4cqmin] pt-[3cqmin] text-center">
        <Estrellas n={resultado.estrellas} tam="clamp(40px, 11cqmin, 84px)" />
        <h2 className="font-bold leading-tight" style={{ fontSize: 'clamp(26px, 7cqmin, 56px)' }}>
          {resultado.titulo}
        </h2>
        <p className="text-[var(--j-tinta-suave)]" style={{ fontSize: 'clamp(15px, 3.4cqmin, 26px)' }}>
          {resultado.detalle}
        </p>
        {resultado.puntaje !== undefined && record > 0 && (
          <p className="rounded-full bg-[#fff4cf] px-4 py-1 font-semibold text-[#8a5a00]" style={{ fontSize: 'clamp(14px, 3cqmin, 22px)' }}>
            {nuevoRecord ? '¡Nuevo récord en este dispositivo!' : `Récord: ${num(record)}`}
          </p>
        )}
        <div className="mt-[1cqmin] flex flex-wrap justify-center gap-[2cqmin]" style={{ fontSize: 'clamp(17px, 4cqmin, 30px)' }}>
          <button type="button" onClick={otraVez} className="b3d inline-flex items-center gap-2 px-[1em] py-[0.5em]" style={{ '--c': '#2fc46f' } as CSSProperties}>
            <RotateCcw className="size-[1em]" aria-hidden /> Otra vez
          </button>
          {alSalir && (
            <button type="button" onClick={alSalir} className="b3d b3d-blanco inline-flex items-center gap-2 px-[1em] py-[0.5em]">
              <LayoutGrid className="size-[1em]" aria-hidden /> Otro juego
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Si el alumno sale del juego (a otra app o pestaña) y vuelve, se le dice que el juego no se detuvo: el reloj siguió
 * corriendo (motor/bucle). Así entiende por qué perdió la pregunta y no lo vuelve a intentar.
 */
function AvisoSalida({ activo }: { activo: boolean }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!activo) return
    let desde = 0
    let id = 0
    const f = () => {
      if (document.visibilityState === 'hidden') desde = performance.now()
      else if (desde && performance.now() - desde > 1500) {
        setVisible(true)
        window.clearTimeout(id)
        id = window.setTimeout(() => setVisible(false), 3500)
      }
    }
    document.addEventListener('visibilitychange', f)
    return () => {
      document.removeEventListener('visibilitychange', f)
      window.clearTimeout(id)
    }
  }, [activo])
  if (!visible || !activo) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[6%] z-50 flex justify-center px-[4cqmin]" role="status">
      <span className="entrar rounded-full bg-[#2b2d5c]/90 px-[3cqmin] py-[1.2cqmin] text-center font-semibold text-white shadow-xl" style={{ fontSize: 'clamp(15px, 3.6cqmin, 28px)' }}>
        ⏱️ El juego no se detiene: siguió mientras no estabas.
      </span>
    </div>
  )
}

function Cargando() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-[#bfe8ff]">
      <Llama tam="28cqmin" className="flotar" />
    </div>
  )
}

export function Partida({
  def,
  contenido,
  ritmo,
  pantalla,
  alSalir,
  alTerminar,
  pie,
  className,
}: {
  def: DefinicionJuego
  contenido: Contenido
  ritmo: Ritmo
  pantalla: PantallaCompleta
  /** Si se indica, la pantalla final ofrece "Otro juego". */
  alSalir?: () => void
  /** Cada vez que termina una partida (por ejemplo, para mandar el puntaje al docente). */
  alTerminar?: (r: Resultado) => void
  /** Algo más bajo el botón "¡Jugar!" de la portada (por ejemplo, con qué nombre juega el alumno). */
  pie?: ReactNode
  className?: string
}) {
  const [fase, setFase] = useState<'portada' | 'jugando' | 'final'>('portada')
  const [semilla, setSemilla] = useState(nuevaSemilla)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [record, setRecord] = useState({ valor: 0, nuevo: false })
  const Juego = def.Componente

  function jugar() {
    activarAudio()
    setSemilla(nuevaSemilla())
    setResultado(null)
    setFase('jugando')
  }

  const terminar = useCallback(
    (r: Resultado) => {
      setResultado(r)
      setFase('final')
      alTerminar?.(r)
      if (r.estrellas >= 1) sonar.victoria()
      else sonar.fin()
      if (r.puntaje !== undefined) {
        const clave = claveRecord(def, contenido)
        const antes = leerRecord(clave)
        const nuevo = r.puntaje > antes
        if (nuevo) {
          try {
            localStorage.setItem(clave, String(r.puntaje))
          } catch {
            // Sin almacenamiento no se guarda el récord.
          }
        }
        setRecord({ valor: Math.max(antes, r.puntaje), nuevo: nuevo && antes > 0 })
      }
    },
    [def, contenido, alTerminar],
  )

  return (
    <div
      ref={pantalla.ref as RefObject<HTMLDivElement>}
      className={`escena relative overflow-hidden bg-[#bfe8ff] ${def.estilo === 'juvenil' ? 'escena-oscura' : ''} ${pantalla.fija ? 'escena-fija' : ''} ${className ?? ''}`}
    >
      {fase === 'portada' ? (
        <Portada def={def} contenido={contenido} jugar={jugar} pie={pie} />
      ) : (
        <Suspense fallback={<Cargando />}>
          <Juego key={semilla} contenido={contenido} ritmo={ritmo} semilla={semilla} terminar={terminar} />
        </Suspense>
      )}
      {/* Los juegos de la clase (Ruleta, Tira y afloja) los guía el docente: ahí no corre ningún reloj. */}
      <AvisoSalida activo={fase === 'jugando' && def.donde.includes('celular')} />
      {fase === 'final' && resultado && (
        <Final resultado={resultado} record={record.valor} nuevoRecord={record.nuevo} otraVez={jugar} alSalir={alSalir} />
      )}
      <Controles pantalla={pantalla} />
    </div>
  )
}
