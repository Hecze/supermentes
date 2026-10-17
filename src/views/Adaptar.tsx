import { BookOpen, Coffee, Download, Hand, Lightbulb, MessagesSquare, PenLine, PieChart, Scale, Timer, type LucideProps } from 'lucide-react'
import { useState, type ComponentType } from 'react'
import { api, COSTOS, textoCosto, type Necesidad } from '../api'
import { useStore } from '../app/store'
import { useGeneracion } from '../app/useGeneracion'
import { EncabezadoHerramienta, SinTema } from '../components/Shell'
import { BarraCambios, Boton, Etiqueta, Generando, Tarjeta, cx, tinte } from '../components/ui'

const COLOR = 'var(--adaptar)'

const NECESIDADES: { id: Necesidad; nombre: string; descripcion: string }[] = [
  { id: 'tdah', nombre: 'TDAH', descripcion: 'Un paso a la vez, con pausas y tiempo visible.' },
  { id: 'dislexia', nombre: 'Dislexia', descripcion: 'Letra más grande, más espacio y palabras clave resaltadas.' },
  { id: 'tea', nombre: 'TEA', descripcion: 'Pictogramas, agenda para anticipar y lenguaje literal.' },
  { id: 'facil', nombre: 'Lectura fácil', descripcion: 'Frases cortas con palabras de todos los días.' },
]

// Pictogramas provisionales. En producción se reemplazan por los de ARASAAC.
const PICTOS: Record<string, ComponentType<LucideProps>> = {
  saludar: Hand,
  leer: BookOpen,
  escribir: PenLine,
  dibujar: PieChart,
  comparar: Scale,
  pausa: Coffee,
  compartir: MessagesSquare,
}

function Picto({ clave, texto }: { clave: string; texto: string }) {
  const Icono = PICTOS[clave] ?? Lightbulb
  return (
    <span className="flex w-16 shrink-0 flex-col items-center gap-1">
      <span className="grid size-12 place-items-center rounded-xl border-2 bg-surface" style={{ borderColor: COLOR, color: COLOR }}>
        <Icono className="size-6" aria-hidden />
      </span>
      <span className="text-center text-[11px] font-semibold leading-tight">{texto}</span>
    </span>
  )
}

export function Adaptar() {
  const { ficha, resultados, guardar, avisar } = useStore()
  const { ocupado, generar } = useGeneracion()
  const adaptacion = resultados.adaptacion
  const [necesidades, setNecesidades] = useState<Necesidad[]>(adaptacion?.necesidades ?? ['tdah', 'tea'])
  const [hechos, setHechos] = useState<Set<number>>(new Set())

  if (!ficha) return <SinTema />

  const cambio = !!adaptacion && [...necesidades].sort().join() !== [...adaptacion.necesidades].sort().join()

  function alternar(n: Necesidad) {
    setNecesidades((lista) => (lista.includes(n) ? lista.filter((x) => x !== n) : [...lista, n]))
  }

  async function crear() {
    const nueva = await generar(COSTOS.adaptacion, 'Versión adaptada', () => api.adaptar(ficha!, necesidades))
    if (nueva) guardar('adaptacion', nueva)
  }

  const activas = adaptacion?.necesidades ?? []
  const tiene = (n: Necesidad) => activas.includes(n)

  return (
    <>
      <EncabezadoHerramienta id="adaptar" />

      <Tarjeta className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Etiqueta>¿Para quién adaptamos?</Etiqueta>
          <p className="text-sm text-ink-soft">Puedes elegir varias. No necesitas poner el nombre del estudiante.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {NECESIDADES.map((n) => {
              const activa = necesidades.includes(n.id)
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => alternar(n.id)}
                  aria-pressed={activa}
                  className="flex flex-col gap-0.5 rounded-xl border-2 bg-surface p-3 text-left transition hover:bg-surface-2"
                  style={{ borderColor: activa ? COLOR : 'var(--line)', background: activa ? tinte(COLOR, 8) : undefined }}
                >
                  <span className="font-semibold">{n.nombre}</span>
                  <span className="text-sm text-ink-soft">{n.descripcion}</span>
                </button>
              )
            })}
          </div>
        </div>
        {!adaptacion && (
          <Boton variante="herramienta" herramienta="adaptar" className="self-start" onClick={crear} cargando={ocupado} disabled={necesidades.length === 0}>
            Crear versión adaptada · {textoCosto(COSTOS.adaptacion)}
          </Boton>
        )}
        {cambio && necesidades.length > 0 && (
          <BarraCambios costo={COSTOS.adaptacion} ocupado={ocupado} onGenerar={crear} onDescartar={() => setNecesidades(adaptacion.necesidades)} />
        )}
      </Tarjeta>

      {ocupado && <Generando texto="Adaptando la consigna y preparando consejos para el aula…" />}

      {adaptacion && (
        <div className={cx('flex flex-col gap-4', ocupado && 'opacity-50')}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-surface-2 px-3 py-1 text-sm">{adaptacion.material}</span>
            <Boton tam="sm" className="sm:ml-auto" onClick={() => avisar('Descargando la versión adaptada en PDF.', 'ok')}>
              <Download className="size-4" aria-hidden /> Descargar PDF
            </Boton>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Tarjeta className="flex flex-col gap-2 self-start">
              <Etiqueta>Consigna original</Etiqueta>
              <p className="text-ink-soft">{adaptacion.original}</p>
            </Tarjeta>

            <Tarjeta className="flex flex-col gap-4" style={{ borderColor: tinte(COLOR, 45) }}>
              <div className="flex flex-wrap items-center gap-2">
                <Etiqueta>Versión adaptada</Etiqueta>
                {activas.map((n) => (
                  <span key={n} className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: tinte(COLOR, 14), color: COLOR }}>
                    {NECESIDADES.find((x) => x.id === n)?.nombre}
                  </span>
                ))}
              </div>

              {tiene('tea') && (
                <div className="flex flex-col gap-2 rounded-xl bg-surface-2 p-3">
                  <p className="text-sm font-semibold">Hoy vamos a:</p>
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {adaptacion.agenda.map((a) => (
                      <Picto key={a.texto} clave={a.picto} texto={a.texto} />
                    ))}
                  </div>
                </div>
              )}

              {tiene('tdah') && (
                <p className="inline-flex items-center gap-2 self-start rounded-full bg-surface-2 px-3 py-1 text-sm">
                  <Timer className="size-4" aria-hidden /> 5 minutos por paso
                </p>
              )}

              <ol className={cx('flex flex-col gap-3', tiene('dislexia') && 'text-lg leading-loose tracking-wide')}>
                {adaptacion.pasos.flatMap((p, i) => {
                  const texto = tiene('facil') ? p.textoFacil : p.texto
                  const item = (
                    <li key={i} className="flex items-center gap-3">
                      {tiene('tea') && <Picto clave={p.picto} texto={p.picto[0].toUpperCase() + p.picto.slice(1)} />}
                      {tiene('tdah') ? (
                        <label htmlFor={`paso-${i}`} className="flex flex-1 cursor-pointer items-start gap-3">
                          <input
                            id={`paso-${i}`}
                            type="checkbox"
                            checked={hechos.has(i)}
                            onChange={() => {
                              const s = new Set(hechos)
                              if (s.has(i)) s.delete(i)
                              else s.add(i)
                              setHechos(s)
                            }}
                            className="mt-1.5 size-5 shrink-0 accent-[var(--adaptar)]"
                          />
                          <span className={cx(hechos.has(i) && 'text-ink-soft line-through')}>
                            <span className="font-semibold">
                              Paso {i + 1} de {adaptacion.pasos.length}:
                            </span>{' '}
                            {texto}
                          </span>
                        </label>
                      ) : (
                        <span className="flex-1">
                          {tiene('dislexia') ? <strong>{texto.split(' ')[0]}</strong> : texto.split(' ')[0]} {texto.split(' ').slice(1).join(' ')}
                        </span>
                      )}
                    </li>
                  )
                  return tiene('tdah') && i === 1
                    ? [
                        item,
                        <li key="pausa" className="flex items-center gap-2 rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok">
                          <Coffee className="size-4" aria-hidden /> Pausa activa: ponte de pie y estírate un minuto.
                        </li>,
                      ]
                    : [item]
                })}
              </ol>
              {tiene('tea') && <p className="text-xs text-ink-soft">Pictogramas provisionales. La versión final usa los pictogramas de ARASAAC.</p>}
            </Tarjeta>
          </div>

          <Tarjeta className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="size-5" style={{ color: COLOR }} aria-hidden />
              <h2 className="font-display text-xl font-bold">Consejos para el aula</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {activas.map((n) => (
                <div key={n} className="flex flex-col gap-2">
                  <p className="font-semibold">{NECESIDADES.find((x) => x.id === n)?.nombre}</p>
                  <ul className="flex flex-col gap-1.5 text-sm">
                    {adaptacion.consejos[n].map((c) => (
                      <li key={c} className="flex gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full" style={{ background: COLOR }} aria-hidden />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="rounded-xl bg-surface-2 p-3 text-sm text-ink-soft">
              Son orientaciones pedagógicas, no un diagnóstico. Coordina con el SAANEE, el área de psicología de tu colegio y la familia.
            </p>
          </Tarjeta>
        </div>
      )}
    </>
  )
}
