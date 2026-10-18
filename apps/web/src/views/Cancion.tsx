import { ArrowLeft, Copy, LoaderCircle, Pause, PenLine, Play, Plus, Printer, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { api, COSTOS, textoCosto, type AudioCancion, type Cancion as CancionTipo, type OpcionesCancion } from '../api'
import { MELODIAS, RITMOS } from '../app/herramientas'
import { useStore } from '../app/store'
import { useGeneracion } from '../app/useGeneracion'
import { useBanco } from '../banco/banco'
import { partesDeLetra } from '../canciones/letra'
import { EncabezadoHerramienta, SinTema } from '../components/Shell'
import { BarraHoja, Boton, Chip, Editable, Generando, Hoja, NotaCreditos, Ventana, cx, imprimir, tinte } from '../components/ui'
import { CancionesDelTema } from './CancionesDelTema'
import { CancionesExistentes } from './CancionesExistentes'

const POR_DEFECTO: OpcionesCancion = { modo: 'ritmo', ritmo: 'Cumbia', melodia: 'Los pollitos dicen' }
const COLOR = 'var(--cancion)'

function minutos(seg: number) {
  return `${Math.floor(seg / 60)}:${String(Math.floor(seg % 60)).padStart(2, '0')}`
}

function ElegirRitmo({ opciones, cambiar }: { opciones: OpcionesCancion; cambiar: (o: OpcionesCancion) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {RITMOS.map((r) => (
          <Chip key={r} grande activo={opciones.modo === 'ritmo' && opciones.ritmo === r} color={COLOR} onClick={() => cambiar({ ...opciones, modo: 'ritmo', ritmo: r })}>
            {r}
          </Chip>
        ))}
        <Chip grande activo={opciones.modo === 'melodia'} color={COLOR} onClick={() => cambiar({ ...opciones, modo: 'melodia' })}>
          Una melodía que ya conocen
        </Chip>
      </div>
      {opciones.modo === 'melodia' && (
        <div className="flex flex-col gap-2 rounded-2xl p-4" style={{ background: tinte(COLOR, 8) }}>
          <p>¿Cuál? La cantan juntos, sin necesidad de parlantes.</p>
          <div className="flex flex-wrap gap-2">
            {MELODIAS.map((m) => (
              <Chip key={m} activo={opciones.melodia === m} color={COLOR} onClick={() => cambiar({ ...opciones, melodia: m })}>
                {m}
              </Chip>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * El reproductor, siempre en el mismo lugar: antes de tener audio, ▶ lo crea (Lyria, api/audio.ts) y suena ahí
 * mismo apenas llega; mientras tanto el mismo botón muestra que está cargando.
 */
function Reproductor({ audio, crear, creando }: { audio?: AudioCancion; crear: () => void; creando: boolean }) {
  const [sonando, setSonando] = useState(false)
  const [t, setT] = useState(0)
  const reproductor = useRef<HTMLAudioElement | null>(null)
  // Se tocó ▶ antes de que hubiera audio: suena apenas llegue.
  const pedido = useRef(false)
  const url = audio?.url ?? null
  const duracion = audio?.duracionSeg ?? 0
  const barras = useMemo(() => Array.from({ length: 48 }, (_, i) => 0.3 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)) * 0.7), [])

  // Con audio real suena el mp3; sin url (datos de ejemplo) solo avanza la barra.
  useEffect(() => {
    setT(0)
    if (!audio) return setSonando(false)
    if (pedido.current) {
      pedido.current = false
      setSonando(true)
    }
    if (!url) return
    const a = new Audio(url)
    a.ontimeupdate = () => setT(Math.floor(a.currentTime))
    a.onended = () => {
      setSonando(false)
      setT(0)
    }
    reproductor.current = a
    return () => {
      a.pause()
      reproductor.current = null
    }
  }, [audio, url])

  useEffect(() => {
    if (url) {
      if (sonando) reproductor.current?.play().catch(() => setSonando(false))
      else reproductor.current?.pause()
      return
    }
    if (!sonando || !audio) return
    const id = window.setInterval(() => setT((x) => Math.min(x + 1, duracion)), 1000)
    return () => window.clearInterval(id)
  }, [sonando, duracion, url, audio])

  useEffect(() => {
    if (audio && !url && t >= duracion) {
      setSonando(false)
      setT(0)
    }
  }, [t, duracion, url, audio])

  function tocar() {
    if (creando) return
    if (!audio) {
      pedido.current = true
      return crear()
    }
    setSonando(!sonando)
  }

  const estado = creando ? 'Creando la música… hasta 1 minuto' : !audio ? `Escuchar · usa ${textoCosto(COSTOS.audio)}` : url ? minutos(duracion - t) : `${minutos(t)} · ejemplo sin sonido`
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-line bg-surface p-2.5 pr-4">
      <button
        type="button"
        onClick={tocar}
        className="grid size-11 shrink-0 place-items-center rounded-full text-on-tool transition hover:scale-105"
        style={{ background: COLOR }}
        aria-label={creando ? 'Creando la música' : sonando ? 'Pausar' : 'Escuchar la canción'}
      >
        {creando ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : sonando ? <Pause className="size-5" aria-hidden /> : <Play className="ml-0.5 size-5" aria-hidden />}
      </button>
      <div className="hidden h-9 min-w-0 flex-1 items-center gap-[3px] sm:flex" aria-hidden>
        {barras.map((h, i) => (
          <span
            key={i}
            className={cx('min-w-[2px] flex-1 rounded-full', (sonando || creando) && 'barra-onda')}
            style={{ height: `${h * 100}%`, background: audio && i / barras.length <= t / duracion ? COLOR : tinte(COLOR, 28), animationDelay: `${(i % 7) * 0.09}s` }}
          />
        ))}
      </div>
      <span className="min-w-0 truncate text-sm text-ink-soft tabular-nums" role="status">
        {estado}
      </span>
    </div>
  )
}

const EJEMPLO_LETRA = `[Estrofa 1]
Escribe aquí la primera estrofa…

[Coro]
Y aquí el coro, que se repite…`

/**
 * Crear una canción nueva, como en Suno: la letra la escribe Supermentes con las palabras del tema o la escribe el
 * docente. Luego se elige el ritmo. Se abre desde el botón de arriba a la derecha.
 */
function CrearCancion({
  abierta,
  cerrar,
  opciones,
  cambiar,
  crearAuto,
  crearPropia,
  tituloTema,
}: {
  abierta: boolean
  cerrar: () => void
  opciones: OpcionesCancion
  cambiar: (o: OpcionesCancion) => void
  crearAuto: () => void
  crearPropia: (titulo: string, partes: CancionTipo['partes']) => void
  tituloTema: string
}) {
  const { creditos } = useStore()
  const [modo, setModo] = useState<'auto' | 'propia'>('auto')
  const [titulo, setTitulo] = useState('')
  const [letra, setLetra] = useState('')
  const partes = useMemo(() => partesDeLetra(letra), [letra])

  const pestana = (m: 'auto' | 'propia', icono: ReactNode, texto: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={modo === m}
      onClick={() => setModo(m)}
      className={cx('flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-2 py-2.5 text-[15px] font-medium transition sm:text-base', modo === m ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft hover:text-ink')}
    >
      {icono}
      {texto}
    </button>
  )

  return (
    <Ventana abierta={abierta} cerrar={cerrar} titulo="Crear una canción">
      <div role="tablist" aria-label="¿Quién escribe la letra?" className="grid grid-cols-2 gap-1 rounded-2xl bg-surface-2 p-1">
        {pestana('auto', <Sparkles className="size-4 shrink-0" aria-hidden />, 'La escribimos')}
        {pestana('propia', <PenLine className="size-4 shrink-0" aria-hidden />, 'Yo la escribo')}
      </div>

      {modo === 'auto' ? (
        <p className="-mt-1 text-ink-soft">Escribimos la letra con las palabras de «{tituloTema}». Después la puedes corregir.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold">Título</span>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder={tituloTema}
              maxLength={80}
              className="h-12 rounded-xl border-2 border-line bg-surface px-3 focus:border-ink focus:outline-none"
            />
          </label>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="crear-cancion-letra" className="font-semibold">
              Letra
            </label>
            <textarea
              id="crear-cancion-letra"
              aria-describedby="crear-cancion-ayuda"
              value={letra}
              onChange={(e) => setLetra(e.target.value)}
              placeholder={EJEMPLO_LETRA}
              rows={9}
              maxLength={3000}
              className="resize-y rounded-xl border-2 border-line bg-surface px-3 py-2.5 font-display text-lg leading-relaxed focus:border-ink focus:outline-none"
            />
            <p id="crear-cancion-ayuda" className="text-sm text-ink-soft">
              Marca las partes con [Coro] o [Estrofa 1] en su propia línea. Si no, cada párrafo es una estrofa.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="font-semibold">Ritmo</p>
        <ElegirRitmo opciones={opciones} cambiar={cambiar} />
      </div>

      <div className="flex flex-col items-start gap-2">
        {modo === 'auto' ? (
          <>
            <Boton tam="lg" variante="herramienta" herramienta="cancion" onClick={crearAuto}>
              Crear la canción
            </Boton>
            <NotaCreditos n={COSTOS.letra} quedan={creditos} />
          </>
        ) : (
          <>
            <Boton tam="lg" variante="herramienta" herramienta="cancion" onClick={() => crearPropia(titulo.trim() || tituloTema, partes)} disabled={!partes.length}>
              Crear la canción
            </Boton>
            <p className="text-sm text-ink-soft">Tu letra no gasta créditos. Escucharla con música usa {COSTOS.audio}.</p>
          </>
        )}
      </div>
    </Ventana>
  )
}

export function Cancion() {
  const { ficha, resultados, guardar, avisar } = useStore()
  const { ocupado, generar } = useGeneracion()
  const cancion = resultados.cancion
  const audio = resultados.audio
  const [opciones, setOpciones] = useState<OpcionesCancion>(cancion?.opciones ?? POR_DEFECTO)
  const [grabando, setGrabando] = useState(false)
  const [creando, setCreando] = useState(false)
  const banco = useBanco(ficha)

  if (!ficha) return <SinTema />
  const delBanco = !!cancion && !!banco?.canciones.some((c) => c.titulo === cancion.titulo)

  async function crearLetra() {
    setCreando(false)
    const nueva = await generar(COSTOS.letra, 'Canción', () => api.generarCancion(ficha!, opciones))
    if (nueva) {
      guardar('cancion', nueva)
      guardar('audio', undefined)
    }
  }

  function crearPropia(titulo: string, partes: CancionTipo['partes']) {
    setCreando(false)
    guardar('cancion', { titulo, opciones, partes })
    guardar('audio', undefined)
  }

  async function copiarLetra() {
    if (!cancion) return
    const texto = [cancion.titulo, '', ...cancion.partes.flatMap((p) => [`[${p.etiqueta}]`, ...p.lineas, ''])].join('\n').trim()
    try {
      await navigator.clipboard.writeText(texto)
      avisar('Letra copiada. Pégala en el grupo de WhatsApp de las familias.', 'ok')
    } catch {
      avisar('No se pudo copiar. Selecciona la letra y cópiala a mano.', 'error')
    }
  }

  async function crearAudio() {
    if (!cancion) return
    setGrabando(true)
    const a = await generar(COSTOS.audio, 'Audio', () => api.generarAudio(cancion))
    if (a) guardar('audio', a)
    setGrabando(false)
  }

  const encabezado = (
    <>
      <EncabezadoHerramienta
        id="cancion"
        accion={
          <Boton variante="herramienta" herramienta="cancion" onClick={() => setCreando(true)} cargando={ocupado && !grabando}>
            {!(ocupado && !grabando) && <Plus className="size-5" aria-hidden />} Crear canción
          </Boton>
        }
      />
      <CrearCancion
        abierta={creando}
        cerrar={() => setCreando(false)}
        opciones={opciones}
        cambiar={setOpciones}
        crearAuto={crearLetra}
        crearPropia={crearPropia}
        tituloTema={ficha.titulo}
      />
    </>
  )

  if (!cancion) {
    return (
      <>
        {encabezado}
        {ocupado && <Generando texto="Escribiendo la letra con las palabras de tu tema…" />}
        {banco && <CancionesDelTema tema={banco} ficha={ficha} />}
        <CancionesExistentes ficha={ficha} plegado={!!banco} />
      </>
    )
  }

  return (
    <>
      {encabezado}
      {delBanco && (
        <Boton
          variante="suave"
          onClick={() => {
            guardar('cancion', undefined)
            guardar('audio', undefined)
          }}
          className="-ml-3 self-start print:hidden"
        >
          <ArrowLeft className="size-5" aria-hidden /> Canciones del tema
        </Boton>
      )}

      <BarraHoja>
        {cancion.opciones.modo === 'ritmo' && <Reproductor audio={audio} crear={crearAudio} creando={grabando} />}
        <Boton variante="contorno" onClick={() => imprimir(avisar)} aria-label="Imprimir la letra">
          <Printer className="size-5" aria-hidden /> <span className="hidden sm:inline">Imprimir</span>
        </Boton>
        <Boton variante="contorno" onClick={() => void copiarLetra()} aria-label="Copiar la letra para WhatsApp">
          <Copy className="size-5" aria-hidden /> <span className="hidden sm:inline">Copiar letra</span>
        </Boton>
      </BarraHoja>

      {ocupado && !grabando ? (
        <Generando texto="Escribiendo otra versión…" />
      ) : (
        <Hoja>
          <header className="flex flex-col gap-1">
            <Editable como="h2" className="font-display text-3xl font-bold">
              {cancion.titulo}
            </Editable>
            <p className="text-ink-soft">
              {cancion.opciones.modo === 'melodia' ? `Se canta con la melodía de "${cancion.opciones.melodia}"` : `Ritmo: ${cancion.opciones.ritmo}`}
            </p>
          </header>
          <div className="flex flex-col gap-5">
            {cancion.partes.map((p, i) => (
              <div key={i} className="flex flex-col">
                <p className="text-sm font-semibold" style={{ color: COLOR }}>
                  {p.etiqueta}
                </p>
                {p.lineas.map((l, j) => (
                  <Editable key={j} className={cx('font-display text-xl leading-relaxed', p.etiqueta === 'Coro' && 'font-semibold')}>
                    {l}
                  </Editable>
                ))}
              </div>
            ))}
          </div>
        </Hoja>
      )}

      <CancionesExistentes ficha={ficha} plegado />
    </>
  )
}
