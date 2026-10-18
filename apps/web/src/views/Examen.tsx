import { ArrowLeft, Check, CircleCheck, Columns2, Download, Eye, FileText, Printer, RefreshCw, Sparkles, Upload, X } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { api, COSTOS, MODO_EJEMPLO, type Necesidad, type OpcionesExamen } from '../api'
import { INTERESES } from '../app/herramientas'
import { useStore } from '../app/store'
import { useGeneracion } from '../app/useGeneracion'
import { EncabezadoHerramienta, SinTema } from '../components/Shell'
import { BarraHoja, Boton, Chip, Generando, Hoja, NotaCreditos, Pregunta, Ventana, cx, descargar, imprimir, tinte } from '../components/ui'
import { useBanco } from '../banco/banco'
import { tiposDelTema } from '../examenes/catalogo'
import { nombreArchivo, pdfExamen } from '../lib/pdfExamen'
import { ExamenListo } from './ExamenListo'

const COLOR = 'var(--examen)'

// Primero lo que el docente observa en el aula; el nombre técnico va después, en pequeño.
const NECESIDADES: { id: Necesidad; titulo: string; nombre: string }[] = [
  { id: 'tdah', titulo: 'Le cuesta concentrarse', nombre: 'TDAH' },
  { id: 'dislexia', titulo: 'Le cuesta leer', nombre: 'Dislexia' },
  { id: 'tea', titulo: 'Necesita instrucciones claras y literales', nombre: 'TEA' },
  { id: 'facil', titulo: 'Necesita textos más simples', nombre: 'Lectura fácil' },
]

type Eleccion = Omit<OpcionesExamen, 'examen'>

const POR_DEFECTO: Eleccion = { interes: null, necesidades: [] }

// El último examen que subió el docente en cada tema, para volver a adaptarlo sin subirlo otra vez.
const SUBIDOS = new Map<string, File>()

/** Una opción que se marca y se desmarca, con su casilla. */
function Opcion({ activa, onClick, titulo, detalle }: { activa: boolean; onClick: () => void; titulo: string; detalle?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activa}
      className="flex items-center gap-3 rounded-2xl border-2 bg-surface p-4 text-left transition hover:bg-surface-2"
      style={{ borderColor: activa ? COLOR : 'var(--line)', background: activa ? tinte(COLOR, 8) : undefined }}
    >
      <span
        className="grid size-6 shrink-0 place-items-center rounded-md border-2"
        style={{ borderColor: activa ? COLOR : 'var(--line)', background: activa ? COLOR : undefined }}
        aria-hidden
      >
        {activa && <Check className="size-4 text-on-tool" />}
      </span>
      <span className="flex flex-col">
        <span className="text-lg font-medium">{titulo}</span>
        {detalle && <span className="text-sm text-ink-soft">{detalle}</span>}
      </span>
    </button>
  )
}

/** Cómo adaptarlo: ambientarlo en lo que le gusta a la clase y/o para quien aprende distinto. */
function ElegirAdaptacion({ eleccion, cambiar }: { eleccion: Eleccion; cambiar: (e: Eleccion) => void }) {
  const [otro, setOtro] = useState(eleccion.interes !== null && !INTERESES.includes(eleccion.interes))
  const conInteres = eleccion.interes !== null
  const alternar = (n: Necesidad) =>
    cambiar({ ...eleccion, necesidades: eleccion.necesidades.includes(n) ? eleccion.necesidades.filter((x) => x !== n) : [...eleccion.necesidades, n] })

  return (
    <div className="flex flex-col gap-3">
      <Opcion
        activa={conInteres}
        onClick={() => cambiar({ ...eleccion, interes: conInteres ? null : INTERESES[0] })}
        titulo="Con lo que le gusta a tu clase"
        detalle="Las mismas preguntas, contadas con fútbol, animales, cocina o lo que elijas."
      />
      {conInteres && (
        <div className="-mt-1 flex flex-col gap-3 pl-1">
          <div className="flex flex-wrap gap-2">
            {INTERESES.map((i) => (
              <Chip
                key={i}
                activo={!otro && eleccion.interes === i}
                color={COLOR}
                onClick={() => {
                  setOtro(false)
                  cambiar({ ...eleccion, interes: i })
                }}
              >
                {i}
              </Chip>
            ))}
            <Chip activo={otro} color={COLOR} onClick={() => setOtro(true)}>
              Otra cosa
            </Chip>
          </div>
          {otro && (
            <label htmlFor="examen-interes" className="flex max-w-md flex-col gap-1">
              <span className="text-ink-soft">¿Qué le gusta a tu clase?</span>
              <input
                id="examen-interes"
                autoFocus
                value={eleccion.interes && !INTERESES.includes(eleccion.interes) ? eleccion.interes : ''}
                onChange={(e) => cambiar({ ...eleccion, interes: e.target.value })}
                placeholder="Ej.: dinosaurios, superhéroes, la chacra"
                className="h-12 rounded-xl border-2 border-line bg-surface px-4 text-lg focus:border-ink focus:outline-none"
              />
            </label>
          )}
        </div>
      )}

      <p className="mt-2 font-medium">Para quien aprende distinto</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {NECESIDADES.map((n) => (
          <Opcion key={n.id} activa={eleccion.necesidades.includes(n.id)} onClick={() => alternar(n.id)} titulo={n.titulo} detalle={n.nombre} />
        ))}
      </div>
    </div>
  )
}

function SubirExamen({ archivo, cambiar }: { archivo: File | null; cambiar: (f: File | null) => void }) {
  if (archivo) {
    return (
      <div className="flex max-w-xl items-center gap-3 rounded-2xl border-2 border-line bg-surface px-4 py-3">
        <FileText className="size-6 shrink-0" style={{ color: COLOR }} aria-hidden />
        <span className="min-w-0 flex-1 truncate font-medium">{archivo.name}</span>
        <button type="button" onClick={() => cambiar(null)} className="rounded-lg p-1.5 text-ink-soft hover:bg-surface-2 hover:text-ink" aria-label="Quitar el examen">
          <X className="size-5" />
        </button>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-start gap-2">
      <label
        htmlFor="examen-archivo"
        className="flex w-full max-w-xl cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line bg-surface px-6 py-8 text-center hover:border-ink-soft"
      >
        <Upload className="size-7" style={{ color: COLOR }} aria-hidden />
        <span className="text-lg font-semibold">Elegir mi examen</span>
        <span className="text-sm text-ink-soft">PDF o foto de la hoja</span>
        <input
          id="examen-archivo"
          type="file"
          accept=".pdf,application/pdf,image/*"
          className="sr-only"
          onChange={(e) => cambiar(e.target.files?.[0] ?? null)}
        />
      </label>
      {MODO_EJEMPLO && (
        <button
          type="button"
          onClick={() => cambiar(new File(['ejemplo'], 'Examen de fracciones - 4.º B.pdf', { type: 'application/pdf' }))}
          className="text-sm text-ink-soft underline underline-offset-4 hover:text-ink"
        >
          Probar con un examen de ejemplo
        </button>
      )}
    </div>
  )
}

const resumen = (e: Eleccion) =>
  [e.interes && `con ${e.interes.toLowerCase()}`, ...NECESIDADES.filter((n) => e.necesidades.includes(n.id)).map((n) => n.titulo.toLowerCase())]
    .filter(Boolean)
    .join(' · ')

/** Adaptar el examen del docente: lo sube en PDF o foto y recibe un PDF adaptado (con IA, gasta créditos). */
function AdaptarExamen({ accion }: { accion?: ReactNode }) {
  const { ficha, resultados, guardar, avisar, creditos } = useStore()
  const { ocupado, generar } = useGeneracion()
  const examen = resultados.examen
  const [archivo, setArchivo] = useState<File | null>(null)
  const [eleccion, setEleccion] = useState<Eleccion>(examen?.opciones ?? POR_DEFECTO)
  const [respuestas, setRespuestas] = useState(false)
  const [original, setOriginal] = useState(false)
  const [armando, setArmando] = useState(false)
  const [otra, setOtra] = useState(false)

  if (!ficha) return <SinTema />

  const eligio = (eleccion.interes !== null && eleccion.interes.trim().length > 1) || eleccion.necesidades.length > 0
  const listo = !!archivo && eligio

  const anterior = SUBIDOS.get(ficha.id) ?? (MODO_EJEMPLO && examen ? new File(['ejemplo'], examen.archivo, { type: 'application/pdf' }) : undefined)
  const aAdaptar = archivo ?? anterior

  async function adaptar() {
    if (!aAdaptar) return
    SUBIDOS.set(ficha!.id, aAdaptar)
    const nuevo = await generar(COSTOS.examen, 'Examen adaptado', () => api.adaptarExamen(ficha!, { ...eleccion, examen: aAdaptar }))
    if (nuevo) {
      guardar('examen', nuevo)
      setArchivo(null)
    }
  }

  async function bajarPdf(conRespuestas: boolean) {
    if (!examen) return
    setArmando(true)
    try {
      const pdf = await pdfExamen(examen, ficha!.grado, { respuestas: conRespuestas })
      await descargar(pdf, nombreArchivo(examen.titulo, conRespuestas ? 'respuestas' : 'adaptado'), avisar)
    } catch {
      avisar('No pudimos armar el PDF. Intenta de nuevo.', 'error')
    } finally {
      setArmando(false)
    }
  }

  if (!examen) {
    return (
      <>
        <EncabezadoHerramienta id="examen" accion={accion} />
        <Pregunta titulo="1. Sube tu examen">
          <p className="-mt-1 text-ink-soft">El de siempre. Mantenemos tus mismas preguntas y lo que evalúan.</p>
          <SubirExamen archivo={archivo} cambiar={setArchivo} />
        </Pregunta>
        <Pregunta titulo="2. ¿Cómo lo adaptamos?">
          <p className="-mt-1 text-ink-soft">Elige una o varias. No hace falta poner el nombre de ningún estudiante.</p>
          <ElegirAdaptacion eleccion={eleccion} cambiar={setEleccion} />
        </Pregunta>
        <div className="flex flex-col items-start gap-2">
          <Boton tam="lg" variante="herramienta" herramienta="examen" onClick={adaptar} cargando={ocupado} disabled={!listo}>
            <Sparkles className="size-5" aria-hidden /> Adaptar mi examen
          </Boton>
          <p className="text-sm text-ink-soft">
            {!archivo ? 'Primero sube tu examen.' : !eligio ? 'Elige cómo adaptarlo.' : 'Recibirás el examen adaptado en PDF, listo para imprimir.'}
          </p>
          <NotaCreditos n={COSTOS.examen} quedan={creditos} />
        </div>
        {ocupado && <Generando texto="Leyendo tu examen y adaptando cada pregunta…" />}
      </>
    )
  }

  const n = examen.opciones.necesidades
  const grande = n.includes('dislexia') || n.includes('facil')

  return (
    <>
      <EncabezadoHerramienta id="examen" accion={accion} />
      <p className="-mt-3 text-ink-soft print:hidden">
        Tu examen «{examen.archivo}», adaptado {resumen(examen.opciones)}.
      </p>

      <BarraHoja>
        <Boton variante="herramienta" herramienta="examen" onClick={() => bajarPdf(false)} cargando={armando} disabled={ocupado}>
          <Download className="size-5" aria-hidden /> Descargar PDF
        </Boton>
        <Boton variante="contorno" onClick={() => bajarPdf(true)} disabled={armando || ocupado}>
          <CircleCheck className="size-5" aria-hidden /> PDF con respuestas
        </Boton>
        <Boton variante="contorno" onClick={() => imprimir(avisar)} disabled={ocupado} aria-label="Imprimir">
          <Printer className="size-5" aria-hidden /> <span className="hidden sm:inline">Imprimir</span>
        </Boton>
        <Boton variante="contorno" onClick={() => setRespuestas(!respuestas)} aria-pressed={respuestas} style={respuestas ? { background: tinte(COLOR, 12), borderColor: COLOR } : undefined}>
          <Eye className="size-5" aria-hidden /> Respuestas
        </Boton>
        <Boton variante="contorno" onClick={() => setOriginal(!original)} aria-pressed={original} style={original ? { background: tinte(COLOR, 12), borderColor: COLOR } : undefined}>
          <Columns2 className="size-5" aria-hidden /> Original
        </Boton>
        <Boton variante="contorno" onClick={() => setOtra(true)} cargando={ocupado}>
          {!ocupado && <RefreshCw className="size-5" aria-hidden />} Adaptar de nuevo
        </Boton>
      </BarraHoja>

      {ocupado ? (
        <Generando texto="Adaptando otra vez tu examen…" />
      ) : (
        <Hoja className={cx(grande && 'text-lg leading-loose tracking-wide')}>
          <header className="flex flex-col gap-2">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">{examen.titulo}</h2>
            <p className="text-ink-soft">Nombre: ______________________ · {ficha.grado} · Fecha: __________</p>
            <p className="rounded-xl bg-surface-2 px-4 py-3">{examen.instrucciones}</p>
          </header>
          <ol className="flex flex-col gap-7">
            {examen.preguntas.map((p, i) => (
              <li key={i} className={cx('flex flex-col gap-2', n.includes('tdah') && 'border-b border-line pb-6 last:border-0')}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold" style={{ color: COLOR }}>
                    {examen.etiquetaPaso} {i + 1}
                  </p>
                  {n.includes('tdah') && (
                    <span className="flex items-center gap-1.5 text-xs text-ink-soft">
                      Listo <span className="size-5 rounded border-2 border-ink-soft" aria-hidden />
                    </span>
                  )}
                </div>
                {original && <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm text-ink-soft print:hidden">Original: {p.original}</p>}
                <p className="text-lg">{p.texto}</p>
                {p.alternativas && (
                  <ul className="flex flex-col gap-1.5">
                    {p.alternativas.map((a, k) => (
                      <li key={a} className="flex items-center gap-2.5">
                        <span className="size-4 shrink-0 rounded-full border-2 border-ink-soft" aria-hidden />
                        {String.fromCharCode(97 + k)}) {a}
                      </li>
                    ))}
                  </ul>
                )}
                {p.apoyo && <p className="rounded-lg border border-dashed border-line px-3 py-2 text-ink-soft">Ayuda: {p.apoyo}</p>}
                {respuestas ? (
                  <p className="rounded-lg bg-ok/10 px-3 py-2 text-ok">Respuesta: {p.respuesta}</p>
                ) : (
                  !p.alternativas && <div className="renglones" aria-hidden />
                )}
              </li>
            ))}
          </ol>
        </Hoja>
      )}

      <Ventana abierta={otra} cerrar={() => setOtra(false)} titulo="Adaptar de nuevo">
        <SubirExamen archivo={archivo} cambiar={setArchivo} />
        {!archivo && anterior && <p className="-mt-2 text-sm text-ink-soft">Si no subes otro, volvemos a adaptar «{examen.archivo}».</p>}
        <ElegirAdaptacion eleccion={eleccion} cambiar={setEleccion} />
        <div className="flex flex-col items-start gap-2">
          <Boton
            tam="lg"
            variante="herramienta"
            herramienta="examen"
            disabled={!eligio || !aAdaptar}
            onClick={() => {
              setOtra(false)
              window.scrollTo({ top: 0, behavior: 'smooth' })
              void adaptar()
            }}
          >
            Adaptar de nuevo
          </Boton>
          <NotaCreditos n={COSTOS.examen} quedan={creditos} />
        </div>
      </Ventana>
    </>
  )
}

/**
 * El examen del tema. Si el tema tiene examen listo (hoy, 4.º de primaria), se ve armado apenas se abre: gratis, con
 * otra versión cuando se quiera. Arriba a la derecha queda "Adaptar mi examen" para quien prefiere subir el suyo.
 */
export function Examen() {
  const { ficha } = useStore()
  if (!ficha) return <SinTema />
  return <ExamenDelTema ficha={ficha} />
}

function ExamenDelTema({ ficha }: { ficha: NonNullable<ReturnType<typeof useStore>['ficha']> }) {
  const { resultados } = useStore()
  const banco = useBanco(ficha)
  const tipos = useMemo(() => (banco === undefined ? null : tiposDelTema(ficha.gradoId, ficha.areaId, ficha.titulo, banco)), [banco, ficha.gradoId, ficha.areaId, ficha.titulo])
  // Si ya adaptó su examen en este tema, vuelve a ver ese.
  const [adaptar, setAdaptar] = useState(!!resultados.examen && !resultados.examenListo)

  if (tipos === null) return <EncabezadoHerramienta id="examen" />
  if (!tipos.length || adaptar) {
    const volver = tipos.length ? (
      <Boton variante="contorno" onClick={() => setAdaptar(false)}>
        <ArrowLeft className="size-5" aria-hidden /> Examen listo del tema
      </Boton>
    ) : undefined
    return <AdaptarExamen accion={volver} />
  }
  return (
    <>
      <EncabezadoHerramienta
        id="examen"
        accion={
          <Boton variante="contorno" onClick={() => setAdaptar(true)}>
            <Upload className="size-5" aria-hidden /> Adaptar mi examen
          </Boton>
        }
      />
      <ExamenListo ficha={ficha} banco={banco ?? null} tipos={tipos} />
    </>
  )
}
