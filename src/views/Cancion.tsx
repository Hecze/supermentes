import { Download, Music2, Pause, Play, Share2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { api, COSTOS, textoCosto, type OpcionesCancion } from '../api'
import { MELODIAS, RITMOS } from '../app/herramientas'
import { useStore } from '../app/store'
import { useGeneracion } from '../app/useGeneracion'
import { EncabezadoHerramienta, SinTema } from '../components/Shell'
import { BarraCambios, Boton, Chip, Costo, Etiqueta, Generando, Tarjeta, cx, tinte } from '../components/ui'

const POR_DEFECTO: OpcionesCancion = { modo: 'ritmo', ritmo: 'Cumbia', melodia: 'Los pollitos dicen' }
const COLOR = 'var(--cancion)'

function minutos(seg: number) {
  return `${Math.floor(seg / 60)}:${String(Math.floor(seg % 60)).padStart(2, '0')}`
}

function Reproductor({ duracion, url }: { duracion: number; url: string | null }) {
  const { avisar } = useStore()
  const [sonando, setSonando] = useState(false)
  const [t, setT] = useState(0)
  const barras = useMemo(() => Array.from({ length: 48 }, (_, i) => 0.3 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)) * 0.7), [])

  useEffect(() => {
    if (!sonando) return
    const id = window.setInterval(() => setT((x) => Math.min(x + 1, duracion)), 1000)
    return () => window.clearInterval(id)
  }, [sonando, duracion])

  useEffect(() => {
    if (t >= duracion) {
      setSonando(false)
      setT(0)
    }
  }, [t, duracion])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setSonando(!sonando)}
          className="grid size-14 shrink-0 place-items-center rounded-full text-on-tool"
          style={{ background: COLOR }}
          aria-label={sonando ? 'Pausar' : 'Reproducir'}
        >
          {sonando ? <Pause className="size-6" /> : <Play className="ml-0.5 size-6" />}
        </button>
        <div className="flex h-14 min-w-0 flex-1 items-center gap-[3px]" aria-hidden>
          {barras.map((h, i) => (
            <span
              key={i}
              className={cx('min-w-[2px] flex-1 rounded-full', sonando && 'barra-onda')}
              style={{
                height: `${h * 100}%`,
                background: i / barras.length <= t / duracion ? COLOR : tinte(COLOR, 28),
                animationDelay: `${(i % 7) * 0.09}s`,
              }}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink-soft tabular-nums">
        <span>
          {minutos(t)} / {minutos(duracion)}
        </span>
        {!url && <span>Audio de ejemplo: el prototipo no reproduce sonido.</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        <Boton variante="contorno" tam="sm" onClick={() => avisar('Descargando la canción en MP3.', 'ok')}>
          <Download className="size-4" aria-hidden /> Descargar MP3
        </Boton>
        <Boton variante="contorno" tam="sm" onClick={() => avisar('Link de la canción copiado para tu clase.', 'ok')}>
          <Share2 className="size-4" aria-hidden /> Compartir con la clase
        </Boton>
      </div>
    </div>
  )
}

export function Cancion() {
  const { ficha, resultados, guardar } = useStore()
  const { ocupado, generar } = useGeneracion()
  const cancion = resultados.cancion
  const audio = resultados.audio
  const [opciones, setOpciones] = useState<OpcionesCancion>(cancion?.opciones ?? POR_DEFECTO)
  const [generandoAudio, setGenerandoAudio] = useState(false)

  if (!ficha) return <SinTema />

  const cambio = !!cancion && JSON.stringify(opciones) !== JSON.stringify(cancion.opciones)
  const costoLetra = COSTOS.letra

  async function crearLetra() {
    const nueva = await generar(costoLetra, 'Letra de la canción', () => api.generarCancion(ficha!, opciones))
    if (nueva) {
      guardar('cancion', nueva)
      guardar('audio', undefined)
    }
  }

  async function crearAudio() {
    if (!cancion) return
    setGenerandoAudio(true)
    const a = await generar(COSTOS.audio, 'Audio de la canción', () => api.generarAudio(cancion))
    if (a) guardar('audio', a)
    setGenerandoAudio(false)
  }

  return (
    <>
      <EncabezadoHerramienta id="cancion" />

      <Tarjeta className="flex flex-col gap-4">
        <div className="flex gap-1 rounded-xl bg-surface-2 p-1" role="tablist">
          {(
            [
              ['ritmo', 'Canción nueva con audio'],
              ['melodia', 'Con una melodía conocida'],
            ] as const
          ).map(([m, texto]) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={opciones.modo === m}
              onClick={() => setOpciones({ ...opciones, modo: m })}
              className={cx(
                'h-10 flex-1 rounded-lg px-3 text-sm transition',
                opciones.modo === m ? 'bg-surface font-semibold shadow-sm' : 'text-ink-soft hover:text-ink',
              )}
            >
              {texto}
            </button>
          ))}
        </div>
        {opciones.modo === 'ritmo' ? (
          <div className="flex flex-col gap-2">
            <Etiqueta>Ritmo</Etiqueta>
            <div className="flex flex-wrap gap-2">
              {RITMOS.map((r) => (
                <Chip key={r} activo={opciones.ritmo === r} color={COLOR} onClick={() => setOpciones({ ...opciones, ritmo: r })}>
                  {r}
                </Chip>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Etiqueta>Melodía que tu clase ya conoce</Etiqueta>
            <div className="flex flex-wrap gap-2">
              {MELODIAS.map((m) => (
                <Chip key={m} activo={opciones.melodia === m} color={COLOR} onClick={() => setOpciones({ ...opciones, melodia: m })}>
                  {m}
                </Chip>
              ))}
            </div>
            <p className="text-sm text-ink-soft">No necesitas parlantes ni audio: la letra encaja en una melodía que todos saben cantar.</p>
          </div>
        )}
        {!cancion && (
          <Boton variante="herramienta" herramienta="cancion" className="self-start" onClick={crearLetra} cargando={ocupado}>
            Escribir la letra · {textoCosto(costoLetra)}
          </Boton>
        )}
        {cambio && <BarraCambios costo={costoLetra} ocupado={ocupado} onGenerar={crearLetra} onDescartar={() => setOpciones(cancion.opciones)} />}
      </Tarjeta>

      {ocupado && !generandoAudio && <Generando texto="Escribiendo la letra con el vocabulario de tu ficha…" />}

      {cancion && (
        <div className={cx('grid gap-4 lg:grid-cols-[1.3fr_1fr]', ocupado && !generandoAudio && 'opacity-50')}>
          <Tarjeta className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <Etiqueta>Paso 1 · Letra</Etiqueta>
                <h2 className="mt-1 font-display text-2xl font-bold">{cancion.titulo}</h2>
                {cancion.opciones.modo === 'melodia' && (
                  <p className="text-sm text-ink-soft">
                    Se canta con la melodía de <strong className="text-ink">{cancion.opciones.melodia}</strong>
                  </p>
                )}
              </div>
              <Boton variante="contorno" tam="sm" onClick={crearLetra} cargando={ocupado && !generandoAudio}>
                Otra versión · {textoCosto(costoLetra)}
              </Boton>
            </div>
            <div className="flex flex-col gap-4">
              {cancion.partes.map((p, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: COLOR }}>
                    {p.etiqueta}
                  </p>
                  {p.lineas.map((l, j) => (
                    <p key={j} className={cx('font-display text-lg leading-snug', p.etiqueta === 'Coro' && 'font-semibold')}>
                      {l}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </Tarjeta>

          <Tarjeta className="flex flex-col gap-4 self-start">
            <Etiqueta>Paso 2 · Audio</Etiqueta>
            {cancion.opciones.modo === 'melodia' ? (
              <div className="flex flex-col gap-2">
                <Music2 className="size-8" style={{ color: COLOR }} aria-hidden />
                <p>Esta versión no necesita audio: cántenla juntos con la melodía de {cancion.opciones.melodia}.</p>
                <Costo n={0} className="self-start" />
              </div>
            ) : audio ? (
              <Reproductor duracion={audio.duracionSeg} url={audio.url} />
            ) : generandoAudio ? (
              <Generando texto="Grabando la canción. Puede tardar un minuto…" />
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-ink-soft">Revisa la letra primero. Cuando te guste, genera el audio con ritmo de {cancion.opciones.ritmo.toLowerCase()}.</p>
                <Boton variante="herramienta" herramienta="cancion" className="self-start" onClick={crearAudio} disabled={cambio || ocupado}>
                  Generar audio · {textoCosto(COSTOS.audio)}
                </Boton>
                {cambio && <p className="text-sm text-warn">Primero genera la letra con las nuevas opciones.</p>}
              </div>
            )}
          </Tarjeta>
        </div>
      )}
    </>
  )
}
