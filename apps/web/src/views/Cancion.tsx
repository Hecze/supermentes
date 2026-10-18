import { ArrowLeft, Pause, Play, Printer, Share2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { api, COSTOS, type OpcionesCancion } from '../api'
import { MELODIAS, RITMOS } from '../app/herramientas'
import { useStore } from '../app/store'
import { useGeneracion } from '../app/useGeneracion'
import { useBanco } from '../banco/banco'
import { EncabezadoHerramienta, SinTema } from '../components/Shell'
import { Acciones, Boton, Chip, Desplegable, Editable, Generando, Hoja, NotaCreditos, Pregunta, cx, imprimir, tinte } from '../components/ui'
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

function Reproductor({ duracion, url }: { duracion: number; url: string | null }) {
  const [sonando, setSonando] = useState(false)
  const [t, setT] = useState(0)
  const audio = useRef<HTMLAudioElement | null>(null)
  const barras = useMemo(() => Array.from({ length: 48 }, (_, i) => 0.3 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)) * 0.7), [])

  // Con audio real suena el mp3; sin url (datos de ejemplo) solo avanza la barra.
  useEffect(() => {
    if (!url) return
    const a = new Audio(url)
    a.ontimeupdate = () => setT(Math.floor(a.currentTime))
    a.onended = () => { setSonando(false); setT(0) }
    audio.current = a
    return () => { a.pause(); audio.current = null }
  }, [url])

  useEffect(() => {
    if (url) {
      if (sonando) audio.current?.play().catch(() => setSonando(false))
      else audio.current?.pause()
      return
    }
    if (!sonando) return
    const id = window.setInterval(() => setT((x) => Math.min(x + 1, duracion)), 1000)
    return () => window.clearInterval(id)
  }, [sonando, duracion, url])

  useEffect(() => {
    if (!url && t >= duracion) {
      setSonando(false)
      setT(0)
    }
  }, [t, duracion, url])

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-3 print:hidden">
      <button
        type="button"
        onClick={() => setSonando(!sonando)}
        className="grid size-12 shrink-0 place-items-center rounded-full text-on-tool"
        style={{ background: COLOR }}
        aria-label={sonando ? 'Pausar' : 'Reproducir'}
      >
        {sonando ? <Pause className="size-5" /> : <Play className="ml-0.5 size-5" />}
      </button>
      <div className="flex h-10 min-w-0 flex-1 items-center gap-[3px]" aria-hidden>
        {barras.map((h, i) => (
          <span
            key={i}
            className={cx('min-w-[2px] flex-1 rounded-full', sonando && 'barra-onda')}
            style={{ height: `${h * 100}%`, background: i / barras.length <= t / duracion ? COLOR : tinte(COLOR, 28), animationDelay: `${(i % 7) * 0.09}s` }}
          />
        ))}
      </div>
      <span className="text-sm text-ink-soft tabular-nums">{url ? minutos(duracion - t) : `${minutos(t)} · ejemplo sin sonido`}</span>
    </div>
  )
}

export function Cancion() {
  const { ficha, resultados, guardar, creditos, avisar } = useStore()
  const { ocupado, generar } = useGeneracion()
  const cancion = resultados.cancion
  const audio = resultados.audio
  const [opciones, setOpciones] = useState<OpcionesCancion>(cancion?.opciones ?? POR_DEFECTO)
  const [grabando, setGrabando] = useState(false)
  const banco = useBanco(ficha)

  if (!ficha) return <SinTema />
  const delBanco = !!cancion && !!banco?.canciones.some((c) => c.titulo === cancion.titulo)

  async function crearLetra() {
    const nueva = await generar(COSTOS.letra, 'Canción', () => api.generarCancion(ficha!, opciones))
    if (nueva) {
      guardar('cancion', nueva)
      guardar('audio', undefined)
    }
  }

  async function crearAudio() {
    if (!cancion) return
    setGrabando(true)
    const a = await generar(COSTOS.audio, 'Audio', () => api.generarAudio(cancion))
    if (a) guardar('audio', a)
    setGrabando(false)
  }

  if (!cancion) {
    return (
      <>
        <EncabezadoHerramienta id="cancion" />
        {banco && <CancionesDelTema tema={banco} ficha={ficha} />}
        <CancionesExistentes ficha={ficha} plegado={!!banco} />
        <div className="flex flex-col gap-1 border-t border-line pt-6">
          <h2 className="font-display text-2xl font-bold">O crea una canción nueva</h2>
          <p className="text-ink-soft">Con las palabras de tu tema y el ritmo que le guste a tu clase.</p>
        </div>
        <Pregunta titulo="¿Con qué ritmo?">
          <ElegirRitmo opciones={opciones} cambiar={setOpciones} />
        </Pregunta>
        <div className="flex flex-col items-start gap-2">
          <Boton tam="lg" variante="herramienta" herramienta="cancion" onClick={crearLetra} cargando={ocupado}>
            Crear la canción
          </Boton>
          <NotaCreditos n={COSTOS.letra} quedan={creditos} />
        </div>
        {ocupado && <Generando texto="Escribiendo la letra con las palabras de tu tema…" />}
      </>
    )
  }

  return (
    <>
      <EncabezadoHerramienta id="cancion" />
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

      {cancion.opciones.modo === 'ritmo' &&
        (audio ? (
          <Reproductor duracion={audio.duracionSeg} url={audio.url} />
        ) : grabando ? (
          <Generando texto="Grabando la canción. Puede tardar un minuto…" />
        ) : null)}

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

      <Acciones>
        {cancion.opciones.modo === 'ritmo' && !audio && (
          <Boton variante="herramienta" herramienta="cancion" onClick={crearAudio} cargando={grabando} disabled={ocupado}>
            <Play className="size-5" aria-hidden /> Escuchar la canción
          </Boton>
        )}
        <Boton variante="contorno" onClick={() => imprimir(avisar)}>
          <Printer className="size-5" aria-hidden /> Imprimir la letra
        </Boton>
        <Boton variante="contorno" onClick={() => avisar('Link de la canción copiado para tu clase.', 'ok')}>
          <Share2 className="size-5" aria-hidden /> Compartir
        </Boton>
      </Acciones>
      {cancion.opciones.modo === 'ritmo' && !audio && <NotaCreditos n={COSTOS.audio} quedan={creditos} />}

      <Desplegable titulo="Cambiar el ritmo o crear otra versión">
        <ElegirRitmo opciones={opciones} cambiar={setOpciones} />
        <div className="flex flex-wrap items-center gap-3">
          <Boton onClick={crearLetra} cargando={ocupado && !grabando}>
            Crear otra versión
          </Boton>
          <NotaCreditos n={COSTOS.letra} quedan={creditos} />
        </div>
      </Desplegable>

      <CancionesExistentes ficha={ficha} plegado />
    </>
  )
}
