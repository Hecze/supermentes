// Exámenes listos para imprimir: el examen del tema aparece armado apenas se abre, gratis y sin esperar a la IA.
// "Otra versión" trae los mismos tipos de pregunta con otros números y otras respuestas; "Fila A y B" imprime dos
// versiones para que no se copien. Cada tipo de pregunta muestra en su «i» qué parte del currículo evalúa.
import { BadgeCheck, CircleCheck, Columns2, Dices, Download, Eye, Minus, Plus, Printer, RefreshCw, RotateCcw, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { Ficha } from '../api'
import { useStore } from '../app/store'
import type { TemaBanco } from '../banco/banco'
import { BarraHoja, Boton, Desplegable, Hoja, cx, descargar, imprimir, tinte } from '../components/ui'
import { useCurriculo } from '../curriculo/cargar'
import { nivelDe } from '../curriculo/catalogo'
import { ubicarCita } from '../curriculo/citas'
import { armarVersiones, cambiarCantidad, cambiarItem, cantidadesPorDefecto, contar, nuevoExamen, otraVersion } from '../examenes/armar'
import { citaDelTipo } from '../examenes/catalogo'
import type { ConfigExamen, Dibujo, Item, TipoPregunta, Version } from '../examenes/tipos'
import { letra } from '../examenes/util'
import { nombreArchivo } from '../lib/pdfExamen'
import { Bloque, BotonInfo, Cita, useSustento } from './SustentoJuego'

const COLOR = 'var(--examen)'

function VerDibujo({ d }: { d: Dibujo }) {
  return (
    <div
      role="img"
      aria-label={d.alt}
      className="max-w-full [&>svg]:h-auto [&>svg]:w-full"
      style={{ width: d.ancho }}
      // El SVG lo arma la app (examenes/dibujos.ts) y escapa todo el texto.
      dangerouslySetInnerHTML={{ __html: d.svg }}
    />
  )
}

/** Por qué este tipo de pregunta cumple el currículo: lo que abarca el tema y la parte exacta del desempeño. */
function SustentoTipo({ tipo, ficha, banco }: { tipo: TipoPregunta; ficha: Ficha; banco: TemaBanco | null }) {
  const { verCurriculo } = useStore()
  const s = useSustento(ficha, { fuente: 'tema' }, banco)
  const c = citaDelTipo(tipo, ficha.gradoId, banco)
  const cur = useCurriculo(nivelDe(ficha.gradoId), ficha.gradoId, c?.area ?? ficha.areaId)
  const u = cur.estado === 'listo' && cur.area && c ? ubicarCita(cur.area, c.cita, c.competencia) : null
  const mismo = !!u && u.desempeno === s?.tema.desempeno?.desempeno
  return (
    <div className="flex flex-col gap-3 leading-snug">
      <div>
        <p className="text-base font-semibold">Por qué cumple el Currículo Nacional</p>
        <p className="text-ink-soft">
          {s?.tema.area ?? ficha.area} · {s?.grado ?? ficha.grado}
        </p>
      </div>
      {s && (
        <Bloque titulo="El tema abarca">
          La competencia <strong>«{s.tema.competencia}»</strong>
          {s.tema.desempeno && !mismo ? ', con este desempeño oficial del grado:' : '.'}
          {s.tema.desempeno && !mismo && <Cita u={s.tema.desempeno} />}
        </Bloque>
      )}
      <Bloque titulo="La pregunta abarca">
        <strong>{tipo.nombre}.</strong> {tipo.queHacen}
        {u && c && <Cita u={u} cita={c.cita} />}
        {u && (
          <span className="mt-1.5 flex items-start gap-1.5 font-medium text-ok">
            <BadgeCheck className="mt-px size-4 shrink-0" aria-hidden />
            {mismo ? 'Es justo lo resaltado del desempeño del tema.' : `Es justo lo resaltado, de la competencia «${u.competencia}» del mismo grado.`}
          </span>
        )}
      </Bloque>
      <p className="border-t border-line pt-2 text-sm text-ink-soft">
        Texto copiado tal cual del programa curricular (MINEDU); la cita se verifica letra por letra.{' '}
        <button type="button" onClick={() => verCurriculo(ficha.gradoId, ficha.areaId)} className="underline underline-offset-2 hover:text-ink">
          Ver en el currículo
        </button>
      </p>
    </div>
  )
}

/** Una estrella para pintar, como en la hoja impresa. */
function Estrella() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 shrink-0" aria-hidden>
      <path d="M12 2.5l2.9 6.2 6.6.7-5 4.5 1.4 6.6L12 17.2l-5.9 3.3 1.4-6.6-5-4.5 6.6-.7z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

function Carita({ animo }: { animo: 1 | 0 | -1 }) {
  const boca = animo === 1 ? 'M8 14.5q4 3.5 8 0' : animo === 0 ? 'M8.5 15.5h7' : 'M8 16.5q4-3.5 8 0'
  return (
    <svg viewBox="0 0 24 24" className="size-9 shrink-0" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8.5" cy="9.5" r="1.1" fill="currentColor" />
      <circle cx="15.5" cy="9.5" r="1.1" fill="currentColor" />
      <path d={boca} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/** El circulito para marcar. Con `marcado`, una X encima, como la marcaría el alumno (solo en la pantalla). */
function Circulo({ marcado }: { marcado?: boolean }) {
  return (
    <span className="relative grid size-5 shrink-0 place-items-center" aria-hidden>
      <span className="size-4 rounded-full border-2 border-ink-soft" />
      {marcado && (
        <svg viewBox="0 0 24 24" className="absolute -inset-1.5 size-8 print:hidden" style={{ color: COLOR }}>
          <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
        </svg>
      )}
    </span>
  )
}

/** Lo que se escribe a mano en una línea; con `respuestas`, la respuesta ya escrita (solo en la pantalla). */
function Linea({ ancho, respuesta }: { ancho: string; respuesta?: string }) {
  return (
    <span className={cx('relative inline-flex min-h-8 items-end border-b-2 border-ink-soft pb-0.5', ancho)}>
      {respuesta && (
        <span className="px-1 text-lg font-semibold leading-tight print:hidden" style={{ color: COLOR }}>
          {respuesta}
        </span>
      )}
    </span>
  )
}

/** Une con flechas: con `respuestas`, las líneas ya trazadas entre los puntos (solo en la pantalla). */
function Unir({ it, respuestas }: { it: Extract<Item, { forma: 'unir' }>; respuestas: boolean }) {
  const n = it.izquierda.length
  return (
    <div className="grid max-w-2xl grid-cols-[minmax(0,1fr)_7rem_minmax(0,1fr)] text-lg sm:grid-cols-[minmax(0,1fr)_10rem_minmax(0,1fr)]">
      <div className="flex flex-col">
        {it.izquierda.map((a, k) => (
          <span key={k} className="flex h-14 items-center leading-tight">
            {a}
          </span>
        ))}
      </div>
      <div className="relative">
        {it.izquierda.map((_, k) => (
          <span key={k} className="flex h-14 items-center justify-between px-2" aria-hidden>
            <span className="size-3 rounded-full bg-ink" />
            <span className="size-3 rounded-full bg-ink" />
          </span>
        ))}
        {respuestas && (
          <svg className="absolute inset-0 size-full print:hidden" viewBox={`0 0 100 ${n * 10}`} preserveAspectRatio="none" aria-hidden>
            {it.solucion.map((d, k) => (
              <line key={k} x1="8" y1={k * 10 + 5} x2="92" y2={d * 10 + 5} stroke={COLOR} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
            ))}
          </svg>
        )}
      </div>
      <div className="flex flex-col">
        {it.derecha.map((b, k) => (
          <span key={k} className="flex h-14 items-center leading-tight">
            {b}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Lo que el alumno responde, según la forma de la pregunta. Con `respuestas`, se ve resuelto solo en la pantalla. */
function Responder({ it, respuestas }: { it: Item; respuestas: boolean }) {
  if (it.forma === 'opciones') {
    const enFila = it.alternativas.every((a) => a.length <= 16)
    return (
      <ul className={cx('flex gap-x-10 gap-y-3', enFila ? 'flex-wrap' : 'flex-col')}>
        {it.alternativas.map((a, k) => (
          <li key={k} className="flex items-center gap-3 text-lg">
            <Circulo marcado={respuestas && k === it.correcta} />
            {letra(k)}) {a}
          </li>
        ))}
      </ul>
    )
  }
  if (it.forma === 'abierta') {
    if (it.espacio === 'dibujo')
      return respuestas ? (
        <p className="text-lg font-semibold print:hidden" style={{ color: COLOR }}>
          {it.respuesta}
        </p>
      ) : null
    if (it.espacio === 'renglones')
      return (
        <div className="flex flex-col gap-3">
          <Linea ancho="w-full" respuesta={respuestas ? it.respuesta : undefined} />
          <Linea ancho="w-full" />
        </div>
      )
    return (
      <p className="flex flex-wrap items-end gap-3 text-lg">
        Respuesta: <Linea ancho="w-72 max-w-full" respuesta={respuestas ? it.respuesta : undefined} />
      </p>
    )
  }
  if (it.forma === 'unir') return <Unir it={it} respuestas={respuestas} />
  return (
    <div className="flex flex-col gap-4">
      <p className="flex flex-wrap gap-x-8 gap-y-1 rounded-xl border-2 border-dashed border-line px-4 py-3 text-lg font-semibold">
        {it.palabras.map((p) => (
          <span key={p}>{p}</span>
        ))}
      </p>
      <ol className="flex flex-col gap-3 text-lg">
        {it.frases.map((f, k) => (
          <li key={k} className="flex flex-wrap items-end gap-x-3 gap-y-1">
            <span>
              {k + 1}. {f.replace('____', '').trim()}
            </span>
            <Linea ancho="w-44" respuesta={respuestas ? it.respuestas[k] : undefined} />
          </li>
        ))}
      </ol>
    </div>
  )
}

function HojaExamen({
  v,
  ficha,
  respuestas,
  tipos,
  banco,
  cambiar,
  quitar,
}: {
  v: Version
  ficha: Ficha
  respuestas: boolean
  tipos: Map<string, TipoPregunta>
  banco: TemaBanco | null
  cambiar: (indice: number) => void
  quitar: (indice: number) => void
}) {
  return (
    <div className="papel">
      <Hoja className="gap-7">
        <header className="flex flex-col gap-3">
          <p className="flex flex-wrap items-center justify-between gap-2 text-ink-soft">
            <span>
              {ficha.area} · {ficha.grado}
            </span>
            {v.fila && <span className="font-semibold text-ink">{v.fila}</span>}
          </p>
          <h2 className="font-display text-3xl font-bold leading-tight">{ficha.titulo}</h2>
          <p className="flex flex-wrap gap-x-8 gap-y-2 text-lg">
            <span className="flex items-end gap-2">
              Nombre: <span className="mb-1 h-px w-56 bg-ink-soft sm:w-72" aria-hidden />
            </span>
            <span className="flex items-end gap-2">
              Fecha: <span className="mb-1 h-px w-24 bg-ink-soft" aria-hidden />
            </span>
          </p>
          <div className="flex flex-col gap-2 rounded-2xl bg-surface-2 px-4 py-3">
            <p className="text-lg">
              Resuelve los {v.items.length} retos. Por cada reto que logres, pinta una estrella.
            </p>
            <div className="flex flex-wrap gap-1.5 text-ink">
              {v.items.map((it) => (
                <Estrella key={it.indice} />
              ))}
            </div>
          </div>
        </header>

        <ol className="flex flex-col">
          {v.items.map((it, i) => {
            const tipo = tipos.get(it.tipo)!
            return (
              <li key={`${it.indice}-${it.clave}`} className="group relative flex flex-col gap-3 border-t border-line py-6 first:border-t-0 first:pt-0">
                <div className="flex items-start gap-3 pr-0 sm:pr-28">
                  <span className="shrink-0 rounded-lg bg-ink px-2.5 py-0.5 font-bold text-surface">Reto {i + 1}</span>
                  <p className="text-lg font-semibold leading-snug">{it.enunciado}</p>
                </div>
                {it.dibujo && <VerDibujo d={it.dibujo} />}
                {it.pregunta && <p className="text-lg">{it.pregunta}</p>}
                <Responder it={it} respuestas={respuestas} />
                {respuestas && it.nota && (
                  <p className="text-lg font-semibold print:hidden" style={{ color: COLOR }}>
                    {it.nota}
                  </p>
                )}
                {/* Solo en la pantalla: cambiar esta pregunta, quitarla o ver qué evalúa. */}
                <div className="flex items-center gap-1 print:hidden sm:absolute sm:right-0 sm:top-5 sm:opacity-60 sm:transition sm:group-first:top-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={() => cambiar(it.indice)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 font-medium text-ink-soft hover:bg-surface-2 hover:text-ink"
                    title={tipo.cambia === 'numeros' ? 'Otros números para esta pregunta' : 'Otra pregunta del tema'}
                  >
                    <RefreshCw className="size-4" aria-hidden />
                    <span className="sm:sr-only">{tipo.cambia === 'numeros' ? 'Otros números' : 'Otra pregunta'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => quitar(it.indice)}
                    className="inline-flex size-9 items-center justify-center rounded-lg text-ink-soft hover:bg-surface-2 hover:text-ink"
                    aria-label={`Quitar el reto ${i + 1}`}
                    title="Quitar esta pregunta"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                  <BotonInfo etiqueta={`Qué evalúa el reto ${i + 1}`}>
                    <SustentoTipo tipo={tipo} ficha={ficha} banco={banco} />
                  </BotonInfo>
                </div>
              </li>
            )
          })}
        </ol>

        <footer className="flex flex-col gap-3 rounded-2xl border border-line px-4 py-4">
          <p className="text-lg font-semibold">¿Cómo me fue? Marca una carita.</p>
          <div className="flex flex-wrap gap-x-10 gap-y-3 text-lg">
            <span className="flex items-center gap-2">
              <Carita animo={1} /> ¡Lo logré!
            </span>
            <span className="flex items-center gap-2">
              <Carita animo={0} /> Lo logré con ayuda
            </span>
            <span className="flex items-center gap-2">
              <Carita animo={-1} /> Necesito practicar más
            </span>
          </div>
        </footer>
      </Hoja>
    </div>
  )
}

/** Cuántas preguntas de un tipo caben sin repetirse. Marcar y ¿tiene razón? comparten las preguntas del banco. */
function maximo(tipo: TipoPregunta, banco: TemaBanco | null, cuantas: Map<string, number>) {
  if (tipo.cambia === 'numeros') return 4
  const preguntas = banco?.preguntas.length ?? 0
  if (tipo.id === 'banco-opciones') return preguntas - (cuantas.get('banco-detective') ?? 0)
  if (tipo.id === 'banco-detective') return Math.min(3, preguntas - (cuantas.get('banco-opciones') ?? 0))
  return 2
}

function FilaTipo({ tipo, n, max, cambiar, ficha, banco }: { tipo: TipoPregunta; n: number; max: number; cambiar: (d: 1 | -1) => void; ficha: Ficha; banco: TemaBanco | null }) {
  return (
    <li className="flex items-center gap-2 py-1.5">
      <span className={cx('min-w-0 flex-1 leading-snug', n === 0 && 'text-ink-soft')}>{tipo.nombre}</span>
      <BotonInfo etiqueta={`Qué evalúa «${tipo.nombre}»`}>
        <SustentoTipo tipo={tipo} ficha={ficha} banco={banco} />
      </BotonInfo>
      <span className="flex shrink-0 items-center rounded-xl border border-line">
        <button type="button" onClick={() => cambiar(-1)} disabled={n === 0} className="grid size-8 place-items-center rounded-l-xl hover:bg-surface-2 disabled:opacity-30" aria-label={`Una pregunta menos de «${tipo.nombre}»`}>
          <Minus className="size-4" aria-hidden />
        </button>
        <span className="w-6 text-center font-semibold tabular-nums" aria-label={`${n} preguntas`}>
          {n}
        </span>
        <button type="button" onClick={() => cambiar(1)} disabled={n >= max} className="grid size-8 place-items-center rounded-r-xl hover:bg-surface-2 disabled:opacity-30" aria-label={`Una pregunta más de «${tipo.nombre}»`}>
          <Plus className="size-4" aria-hidden />
        </button>
      </span>
    </li>
  )
}

/** El panel para elegir qué preguntas lleva el examen. */
function ElegirPreguntas({
  tipos,
  config,
  cambiar,
  reiniciar,
  ficha,
  banco,
}: {
  tipos: TipoPregunta[]
  config: ConfigExamen
  cambiar: (tipo: string, d: 1 | -1) => void
  reiniciar: () => void
  ficha: Ficha
  banco: TemaBanco | null
}) {
  const n = contar(config)
  const grupos = [
    { titulo: 'Con dibujos y números que cambian', lista: tipos.filter((t) => t.cambia === 'numeros') },
    { titulo: 'Con preguntas del tema', lista: tipos.filter((t) => t.cambia === 'orden') },
  ].filter((g) => g.lista.length)
  return (
    <div className="flex flex-col gap-4">
      {grupos.map((g) => (
        <div key={g.titulo} className="flex flex-col">
          <p className="font-semibold text-ink-soft">{g.titulo}</p>
          <ul className="flex flex-col divide-y divide-line">
            {g.lista.map((t) => (
              <FilaTipo key={t.id} tipo={t} n={n.get(t.id) ?? 0} max={maximo(t, banco, n)} cambiar={(d) => cambiar(t.id, d)} ficha={ficha} banco={banco} />
            ))}
          </ul>
        </div>
      ))}
      <button type="button" onClick={reiniciar} className="inline-flex items-center gap-1.5 self-start text-ink-soft underline-offset-4 hover:text-ink hover:underline">
        <RotateCcw className="size-4" aria-hidden /> Volver al examen sugerido
      </button>
    </div>
  )
}

export function ExamenListo({ ficha, banco, tipos }: { ficha: Ficha; banco: TemaBanco | null; tipos: TipoPregunta[] }) {
  const { resultados, guardar, avisar } = useStore()
  const porId = useMemo(() => new Map(tipos.map((t) => [t.id, t])), [tipos])
  const [config, setConfig] = useState<ConfigExamen>(() => resultados.examenListo ?? nuevoExamen(tipos, cantidadesPorDefecto(tipos)))
  const [fila, setFila] = useState(0)
  const [respuestas, setRespuestas] = useState(false)
  const [armando, setArmando] = useState<'examen' | 'respuestas' | null>(null)
  const versiones = useMemo(() => armarVersiones(config, porId, banco), [config, porId, banco])
  const v = versiones[Math.min(fila, versiones.length - 1)]
  const total = v.items.length

  // Se guarda en el tema: al volver, sigue la misma versión (la que quizás ya se imprimió).
  useEffect(() => {
    if (resultados.examenListo !== config) guardar('examenListo', config)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config])

  function otra() {
    const nueva = otraVersion(config)
    setConfig(nueva)
    avisar('Nueva versión: las mismas preguntas con otros números y otras respuestas.', 'ok')
  }

  const cur = useCurriculo(nivelDe(ficha.gradoId), ficha.gradoId, ficha.areaId)
  const sustento = (id: string) => {
    const t = porId.get(id)
    const c = t ? citaDelTipo(t, ficha.gradoId, banco) : null
    const u = c && cur.estado === 'listo' && cur.area ? ubicarCita(cur.area, c.cita, c.competencia) : null
    return { nombre: t?.nombre ?? id, competencia: u?.competencia, cita: c?.cita }
  }

  async function bajar(conRespuestas: boolean) {
    setArmando(conRespuestas ? 'respuestas' : 'examen')
    try {
      const { pdfExamenListo } = await import('../examenes/pdf')
      const pdf = await pdfExamenListo({ tema: ficha.titulo, area: ficha.area, grado: ficha.grado, versiones, sustento }, { respuestas: conRespuestas })
      const sufijo = conRespuestas ? 'respuestas' : config.filas ? 'filas-a-y-b' : 'examen'
      await descargar(pdf, nombreArchivo(`${ficha.titulo} ${versiones.map((x) => x.codigo).join(' ')}`, sufijo), avisar)
    } catch {
      avisar('No pudimos armar el PDF. Intenta de nuevo.', 'error')
    } finally {
      setArmando(null)
    }
  }

  const panel = (
    <ElegirPreguntas
      tipos={tipos}
      config={config}
      ficha={ficha}
      banco={banco}
      cambiar={(t, d) => setConfig(cambiarCantidad(config, t, d, tipos))}
      reiniciar={() => setConfig(nuevoExamen(tipos, cantidadesPorDefecto(tipos), config.filas))}
    />
  )

  return (
    <>
      <p className="-mt-3 max-w-3xl text-lg text-ink-soft print:hidden">
        Listo para imprimir y gratis. Con «Otra versión» salen las mismas preguntas con otros números y otras respuestas.
      </p>

      <BarraHoja>
        <Boton variante="herramienta" herramienta="examen" onClick={() => bajar(false)} cargando={armando === 'examen'} disabled={!total}>
          {armando !== 'examen' && <Download className="size-5" aria-hidden />} Descargar PDF
        </Boton>
        <Boton variante="contorno" onClick={() => bajar(true)} cargando={armando === 'respuestas'} disabled={!total}>
          {armando !== 'respuestas' && <CircleCheck className="size-5" aria-hidden />} PDF de respuestas
        </Boton>
        <Boton variante="contorno" onClick={otra}>
          <Dices className="size-5" aria-hidden /> Otra versión
        </Boton>
        <Boton
          variante="contorno"
          onClick={() => {
            setConfig({ ...config, filas: !config.filas })
            setFila(0)
          }}
          aria-pressed={config.filas}
          style={config.filas ? { background: tinte(COLOR, 12), borderColor: COLOR } : undefined}
          title="Dos versiones con las mismas preguntas y otros números, para que no se copien"
        >
          <Columns2 className="size-5" aria-hidden /> Fila A y B
        </Boton>
        <Boton variante="contorno" onClick={() => setRespuestas(!respuestas)} aria-pressed={respuestas} style={respuestas ? { background: tinte(COLOR, 12), borderColor: COLOR } : undefined}>
          <Eye className="size-5" aria-hidden /> Respuestas
        </Boton>
        <Boton variante="contorno" onClick={() => imprimir(avisar)} aria-label="Imprimir">
          <Printer className="size-5" aria-hidden /> <span className="hidden sm:inline">Imprimir</span>
        </Boton>
      </BarraHoja>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="xl:hidden">
            <Desplegable titulo={`Elegir preguntas (${total})`}>{panel}</Desplegable>
          </div>
          {config.filas && (
            <div role="tablist" aria-label="Versión" className="flex gap-1 self-start rounded-xl bg-surface-2 p-1 print:hidden">
              {versiones.map((x, k) => (
                <button
                  key={x.fila}
                  role="tab"
                  type="button"
                  aria-selected={k === fila}
                  onClick={() => setFila(k)}
                  className={cx('rounded-lg px-4 py-1.5 font-medium', k === fila ? 'bg-surface shadow-sm' : 'text-ink-soft hover:text-ink')}
                >
                  {x.fila}
                </button>
              ))}
            </div>
          )}
          {total ? (
            <HojaExamen
              v={v}
              ficha={ficha}
              respuestas={respuestas}
              tipos={porId}
              banco={banco}
              cambiar={(i) => setConfig(cambiarItem(config, i, porId, banco))}
              quitar={(i) => setConfig({ ...config, items: config.items.filter((_, k) => k !== i) })}
            />
          ) : (
            <p className="rounded-2xl border border-dashed border-line px-5 py-6 text-ink-soft">Tu examen no tiene preguntas. Agrega algunas desde «Elegir preguntas».</p>
          )}
        </div>
        <aside className="sticky top-20 hidden flex-col gap-3 rounded-2xl border border-line bg-surface p-4 xl:flex print:hidden">
          <div>
            <h2 className="font-display text-xl font-bold">Elige las preguntas</h2>
            <p className="text-ink-soft">
              {total} {total === 1 ? 'reto' : 'retos'}. Toca la «i» para ver qué evalúa cada una.
            </p>
          </div>
          {panel}
        </aside>
      </div>
    </>
  )
}
