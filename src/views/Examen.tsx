import { CircleCheck, Eye, ImagePlus, Printer, Upload } from 'lucide-react'
import { useState } from 'react'
import { api, COSTOS, type OpcionesExamen } from '../api'
import { INTERESES } from '../app/herramientas'
import { useStore } from '../app/store'
import { useGeneracion } from '../app/useGeneracion'
import { EncabezadoHerramienta, SinTema } from '../components/Shell'
import { Acciones, Boton, Chip, Desplegable, Editable, Generando, Hoja, NotaCreditos, Pastel, Pregunta, imprimir, tinte } from '../components/ui'

const POR_DEFECTO: OpcionesExamen = { interes: 'Fútbol', formato: 'mision' }
const COLOR = 'var(--examen)'

function ElegirInteres({ opciones, cambiar }: { opciones: OpcionesExamen; cambiar: (o: OpcionesExamen) => void }) {
  const [otro, setOtro] = useState(!INTERESES.includes(opciones.interes))
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {INTERESES.map((i) => (
          <Chip
            key={i}
            grande
            activo={!otro && opciones.interes === i}
            color={COLOR}
            onClick={() => {
              setOtro(false)
              cambiar({ ...opciones, interes: i })
            }}
          >
            {i}
          </Chip>
        ))}
        <Chip grande activo={otro} color={COLOR} onClick={() => setOtro(true)}>
          Otra cosa
        </Chip>
      </div>
      {otro && (
        <label htmlFor="examen-interes" className="flex max-w-md flex-col gap-1">
          <span className="text-ink-soft">¿Qué le gusta a tu clase?</span>
          <input
            id="examen-interes"
            autoFocus
            value={INTERESES.includes(opciones.interes) ? '' : opciones.interes}
            onChange={(e) => cambiar({ ...opciones, interes: e.target.value })}
            placeholder="Ej.: dinosaurios, superhéroes, la chacra"
            className="h-12 rounded-xl border-2 border-line bg-surface px-4 text-lg focus:border-ink focus:outline-none"
          />
        </label>
      )}
    </div>
  )
}

function MasOpciones({ opciones, cambiar }: { opciones: OpcionesExamen; cambiar: (o: OpcionesExamen) => void }) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <p className="font-medium">Estilo</p>
        <div className="flex flex-wrap gap-2">
          <Chip activo={opciones.formato === 'mision'} color={COLOR} onClick={() => cambiar({ ...opciones, formato: 'mision' })}>
            Una misión con niveles
          </Chip>
          <Chip activo={opciones.formato === 'contextualizado'} color={COLOR} onClick={() => cambiar({ ...opciones, formato: 'contextualizado' })}>
            Solo cambiar la historia de las preguntas
          </Chip>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p className="font-medium">¿Ya tienes tu examen?</p>
        <p className="text-sm text-ink-soft">Súbelo y lo transformamos manteniendo tus mismas preguntas.</p>
        <label
          htmlFor="examen-propio"
          className="inline-flex h-11 cursor-pointer items-center gap-2 self-start rounded-xl border border-line bg-surface px-4 font-medium hover:bg-surface-2"
        >
          <Upload className="size-5" aria-hidden />
          {opciones.examenPropio ? opciones.examenPropio.name : 'Subir mi examen (foto o PDF)'}
          <input
            id="examen-propio"
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            className="sr-only"
            onChange={(e) => cambiar({ ...opciones, examenPropio: e.target.files?.[0] })}
          />
        </label>
      </div>
    </>
  )
}

export function Examen() {
  const { ficha, resultados, guardar, avisar, creditos } = useStore()
  const { ocupado, generar } = useGeneracion()
  const examen = resultados.examen
  const [opciones, setOpciones] = useState<OpcionesExamen>(examen?.opciones ?? POR_DEFECTO)
  const [respuestas, setRespuestas] = useState(false)
  const [original, setOriginal] = useState(false)
  const [dibujando, setDibujando] = useState(false)

  if (!ficha) return <SinTema />

  const listo = opciones.interes.trim().length > 1
  const costoDibujos = (examen?.preguntas.length ?? 0) * COSTOS.ilustracion
  const conDibujos = !!examen?.preguntas.some((p) => p.ilustracion)

  async function crear() {
    const nuevo = await generar(COSTOS.examen, 'Examen', () => api.generarExamen(ficha!, opciones))
    if (nuevo) guardar('examen', nuevo)
  }

  async function dibujar() {
    if (!examen) return
    setDibujando(true)
    const nuevo = await generar(costoDibujos, 'Dibujos', () => api.generarIlustraciones(examen))
    if (nuevo) guardar('examen', nuevo)
    setDibujando(false)
  }

  if (!examen) {
    return (
      <>
        <EncabezadoHerramienta id="examen" />
        <Pregunta titulo="¿Qué le gusta a tu clase?">
          <p className="-mt-1 text-ink-soft">Las preguntas evalúan lo mismo, pero cuentan una historia que les interesa.</p>
          <ElegirInteres opciones={opciones} cambiar={setOpciones} />
        </Pregunta>
        <div className="flex flex-col items-start gap-2">
          <Boton tam="lg" variante="herramienta" herramienta="examen" onClick={crear} cargando={ocupado} disabled={!listo}>
            Crear el examen
          </Boton>
          <NotaCreditos n={COSTOS.examen} quedan={creditos} />
        </div>
        {ocupado && <Generando texto="Escribiendo cada pregunta con lo que le gusta a tu clase…" />}
        <Desplegable titulo="Más opciones">
          <MasOpciones opciones={opciones} cambiar={setOpciones} />
        </Desplegable>
      </>
    )
  }

  return (
    <>
      <EncabezadoHerramienta id="examen" />

      {ocupado && !dibujando ? (
        <Generando texto="Escribiendo otra versión del examen…" />
      ) : (
        <Hoja>
          <header className="flex flex-col gap-2 rounded-xl p-4 sm:p-5" style={{ background: tinte(COLOR, 10) }}>
            <Editable como="h2" className="font-display text-2xl font-bold sm:text-3xl">
              <span style={{ color: COLOR }}>{examen.titulo}</span>
            </Editable>
            <Editable>{examen.intro}</Editable>
            <p className="text-ink-soft">Nombre: ______________________ · {ficha.grado}</p>
          </header>
          <ol className="flex flex-col gap-7">
            {examen.preguntas.map((p, i) => (
              <li key={i} className="flex gap-4">
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <p className="text-sm font-semibold" style={{ color: COLOR }}>
                    {examen.etiquetaPaso} {i + 1}
                  </p>
                  {original && <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm text-ink-soft print:hidden">Original: {p.original}</p>}
                  <Editable className="text-lg">{p.texto}</Editable>
                  {respuestas ? <p className="rounded-lg bg-ok/10 px-3 py-2 text-ok">Respuesta: {p.respuesta}</p> : <div className="renglones" aria-hidden />}
                </div>
                {p.ilustracion && p.fraccion && (
                  <div className="grid size-24 shrink-0 place-items-center rounded-xl border border-line sm:size-28">
                    <Pastel fraccion={p.fraccion} tam={64} color={COLOR} />
                  </div>
                )}
              </li>
            ))}
          </ol>
        </Hoja>
      )}

      <Acciones>
        <Boton variante="herramienta" herramienta="examen" onClick={() => imprimir(avisar)}>
          <Printer className="size-5" aria-hidden /> Imprimir
        </Boton>
        <Boton variante="contorno" onClick={() => setRespuestas(!respuestas)}>
          <CircleCheck className="size-5" aria-hidden /> {respuestas ? 'Ocultar respuestas' : 'Ver respuestas'}
        </Boton>
        {!conDibujos && (
          <Boton variante="contorno" onClick={dibujar} cargando={dibujando} disabled={ocupado}>
            <ImagePlus className="size-5" aria-hidden /> Agregar dibujos
          </Boton>
        )}
        <Boton variante="suave" onClick={() => setOriginal(!original)}>
          <Eye className="size-5" aria-hidden /> {original ? 'Ocultar original' : 'Ver original'}
        </Boton>
      </Acciones>
      {!conDibujos && <p className="-mt-4 text-sm text-ink-soft print:hidden">Los dibujos usan {costoDibujos} de tus {creditos} créditos.</p>}

      <Desplegable titulo="Cambiar la historia o crear otra versión">
        <p className="font-medium">¿Qué le gusta a tu clase?</p>
        <ElegirInteres opciones={opciones} cambiar={setOpciones} />
        <MasOpciones opciones={opciones} cambiar={setOpciones} />
        <div className="flex flex-wrap items-center gap-3">
          <Boton onClick={crear} cargando={ocupado && !dibujando} disabled={!listo}>
            Crear otra versión
          </Boton>
          <NotaCreditos n={COSTOS.examen} quedan={creditos} />
        </div>
      </Desplegable>
    </>
  )
}
