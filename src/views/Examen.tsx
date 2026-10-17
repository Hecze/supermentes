import { CircleCheck, Download, Eye, EyeOff, ImagePlus, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { api, COSTOS, textoCosto, type OpcionesExamen } from '../api'
import { INTERESES } from '../app/herramientas'
import { useStore } from '../app/store'
import { useGeneracion } from '../app/useGeneracion'
import { EncabezadoHerramienta, SinTema } from '../components/Shell'
import { BarraCambios, Boton, Chip, Costo, Etiqueta, Generando, Pastel, Tarjeta, cx, tinte } from '../components/ui'

const POR_DEFECTO: OpcionesExamen = { interes: 'Fútbol', formato: 'mision' }
const COLOR = 'var(--examen)'

export function Examen() {
  const { ficha, resultados, guardar, avisar } = useStore()
  const { ocupado, generar } = useGeneracion()
  const examen = resultados.examen
  const [opciones, setOpciones] = useState<OpcionesExamen>(examen?.opciones ?? POR_DEFECTO)
  const [verOriginal, setVerOriginal] = useState(false)
  const [verRespuestas, setVerRespuestas] = useState(false)
  const [ilustrando, setIlustrando] = useState(false)

  if (!ficha) return <SinTema />

  const cambio = !!examen && JSON.stringify(opciones) !== JSON.stringify(examen.opciones)
  const conIlustraciones = !!examen?.preguntas.some((p) => p.ilustracion)
  const costoIlustraciones = (examen?.preguntas.length ?? 0) * COSTOS.ilustracion

  async function crear() {
    const nuevo = await generar(COSTOS.examen, 'Examen gamificado', () => api.generarExamen(ficha!, opciones))
    if (nuevo) guardar('examen', nuevo)
  }

  async function ilustrar() {
    if (!examen) return
    setIlustrando(true)
    const nuevo = await generar(costoIlustraciones, 'Ilustraciones', () => api.generarIlustraciones(examen))
    if (nuevo) guardar('examen', nuevo)
    setIlustrando(false)
  }

  return (
    <>
      <EncabezadoHerramienta id="examen" />

      <Tarjeta className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Etiqueta>A tu clase le gusta…</Etiqueta>
          <div className="flex flex-wrap gap-2">
            {INTERESES.map((i) => (
              <Chip key={i} activo={opciones.interes === i} color={COLOR} onClick={() => setOpciones({ ...opciones, interes: i })}>
                {i}
              </Chip>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Etiqueta>Formato</Etiqueta>
          <div className="flex flex-wrap gap-2">
            <Chip activo={opciones.formato === 'mision'} color={COLOR} onClick={() => setOpciones({ ...opciones, formato: 'mision' })}>
              Misión con niveles
            </Chip>
            <Chip activo={opciones.formato === 'contextualizado'} color={COLOR} onClick={() => setOpciones({ ...opciones, formato: 'contextualizado' })}>
              Solo cambiar el contexto
            </Chip>
          </div>
        </div>
        <p className="flex items-start gap-2 text-sm text-ink-soft">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden />
          La IA cambia la historia de cada pregunta, no lo que evalúa ni la respuesta correcta. Revísalo antes de imprimir.
        </p>
        {!examen && (
          <Boton variante="herramienta" herramienta="examen" className="self-start" onClick={crear} cargando={ocupado}>
            Gamificar el examen · {textoCosto(COSTOS.examen)}
          </Boton>
        )}
        {cambio && <BarraCambios costo={COSTOS.examen} ocupado={ocupado} onGenerar={crear} onDescartar={() => setOpciones(examen.opciones)} />}
      </Tarjeta>

      {ocupado && !ilustrando && <Generando texto="Reescribiendo cada pregunta con el tema de tu clase…" />}

      {examen && (
        <div className={cx('flex flex-col gap-4', ocupado && !ilustrando && 'opacity-50')}>
          <div className="flex flex-wrap items-center gap-2">
            <Boton variante="contorno" tam="sm" onClick={() => setVerOriginal(!verOriginal)}>
              {verOriginal ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
              {verOriginal ? 'Ocultar original' : 'Comparar con el original'}
            </Boton>
            <Boton variante="contorno" tam="sm" onClick={() => setVerRespuestas(!verRespuestas)}>
              <CircleCheck className="size-4" aria-hidden />
              {verRespuestas ? 'Ocultar respuestas' : 'Hoja de respuestas'}
            </Boton>
            {!conIlustraciones && (
              <Boton variante="contorno" tam="sm" onClick={ilustrar} cargando={ilustrando}>
                <ImagePlus className="size-4" aria-hidden />
                Agregar ilustraciones · {textoCosto(costoIlustraciones)}
              </Boton>
            )}
            <Boton tam="sm" className="sm:ml-auto" onClick={() => avisar('Descargando el examen en PDF, listo para imprimir.', 'ok')}>
              <Download className="size-4" aria-hidden />
              Descargar PDF
            </Boton>
            <Costo n={0} />
          </div>

          <article className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-5 sm:p-8">
            <header className="flex flex-col gap-2 rounded-xl p-4 sm:p-5" style={{ background: tinte(COLOR, 10) }}>
              <h2 className="font-display text-2xl font-bold sm:text-3xl" style={{ color: COLOR }}>
                {examen.titulo}
              </h2>
              <p>{examen.intro}</p>
              <p className="text-sm text-ink-soft">Nombre: ______________________ · Grado: {ficha.grado}</p>
            </header>
            <ol className="flex flex-col gap-6">
              {examen.preguntas.map((p, i) => (
                <li key={i} className={cx('grid gap-4', verOriginal && 'md:grid-cols-[1fr_1.4fr]')}>
                  {verOriginal && (
                    <div className="rounded-xl bg-surface-2 p-3 text-sm text-ink-soft">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em]">Original</p>
                      {p.original}
                    </div>
                  )}
                  <div className="flex gap-4">
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: COLOR }}>
                        {examen.etiquetaPaso} {i + 1}
                      </p>
                      <p className="text-[17px]">{p.texto}</p>
                      {verRespuestas ? (
                        <p className="rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok">Respuesta: {p.respuesta}</p>
                      ) : (
                        <div className="renglones" aria-hidden />
                      )}
                    </div>
                    {p.ilustracion && p.fraccion && (
                      <figure className="flex w-24 shrink-0 flex-col items-center gap-1 sm:w-28">
                        <div className="grid aspect-square w-full place-items-center rounded-xl border border-line bg-bg/50">
                          <Pastel fraccion={p.fraccion} tam={64} color={COLOR} />
                        </div>
                        <figcaption className="text-center text-[11px] text-ink-soft">Ilustración de ejemplo</figcaption>
                      </figure>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </article>
        </div>
      )}
    </>
  )
}
