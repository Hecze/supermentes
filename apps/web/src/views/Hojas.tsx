// Hojas listas para imprimir: examen, práctica y balotario son la misma hoja de preguntas con otro largo y otra
// forma de imprimirse (ver obsidian/MATERIALES.md). Parten del tema abierto en la barra lateral, que ya dice el grado y
// el curso, y aparecen armadas apenas se abre, gratis y sin esperar a la IA. Tres gestos por pregunta, iguales en las
// tres: cambiar, fijar y quitar. «+ Tema» la vuelve una miscelánea. Cada pregunta muestra en su «i» qué parte del
// currículo evalúa.
import { BadgeCheck, CircleCheck, Columns2, Dices, Download, Eye, FileStack, Minus, Pin, Plus, Printer, RefreshCw, RotateCcw, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { Ficha } from '../api'
import { useStore } from '../app/store'
import { BarraHoja, Boton, Desplegable, Hoja, Ventana, cx, descargar, imprimir, tinte } from '../components/ui'
import { normalizar } from '../curriculo/buscar'
import { cargarNivel, useCurriculo } from '../curriculo/cargar'
import { nivelDe } from '../curriculo/catalogo'
import { ubicarCita } from '../curriculo/citas'
import {
  agregarTema,
  armarVersiones,
  cambiarCantidad,
  cambiarItem,
  cambiarNivelHoja,
  cambiarNivelItem,
  contar,
  examenDesdeBalotario,
  fijarItem,
  hojaNueva,
  nivelPedido,
  otraVersion,
  porTema,
  quitarTema,
  type Fuentes,
} from '../examenes/armar'
import { citaDelTipo } from '../examenes/catalogo'
import type { Clase, ConfigHoja, Dibujo, Fuente, Item, Nivel, Teoria, TipoPregunta, Version } from '../examenes/tipos'
import { cargarArea, fuenteDe, useAreas, useColegio, useTemasDelGrado, type Area, type Colegio } from '../examenes/usar'
import { letra } from '../examenes/util'
import { Bloque, BotonInfo, Cita, useSustento } from './SustentoJuego'

const COLOR = 'var(--examen)'

const CLASES: { id: Clase; nombre: string }[] = [
  { id: 'examen', nombre: 'Examen' },
  { id: 'practica', nombre: 'Práctica' },
  { id: 'balotario', nombre: 'Balotario' },
]

const TITULOS: Record<Clase, string> = { examen: 'Examen', practica: 'Práctica', balotario: 'Balotario' }

const NIVELES: { n: Nivel; nombre: string }[] = [
  { n: 1, nombre: 'Fácil' },
  { n: 2, nombre: 'Normal' },
  { n: 3, nombre: 'Difícil' },
]

/** La dificultad en tres puntitos: ●○○ fácil, ●●○ normal, ●●● difícil. */
function Puntos({ n }: { n: Nivel }) {
  return (
    <span className="flex gap-0.5" aria-hidden>
      {[1, 2, 3].map((k) => (
        <span key={k} className={cx('size-1.5 rounded-full', k <= n ? 'bg-current' : 'bg-line')} />
      ))}
    </span>
  )
}

const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

/** El nombre del PDF: «examen-fracciones-de-una-cantidad-k7q2-clave.pdf». */
const nombreArchivo = (titulo: string, sufijo: string) =>
  `${titulo
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'hoja'}-${sufijo}.pdf`

/** Los cursos de la hoja, sin repetir: «Matemática», o «Matemática · Comunicación» en una miscelánea de varios. */
const cursosDe = (config: ConfigHoja, fuentes: Fuentes) => [...new Set(config.temas.map((t) => fuentes.get(t)?.area).filter(Boolean))].join(' · ')

/** El título de la hoja: con uno o dos temas, sus nombres; con más, el curso (los temas van de subtítulo). */
const tituloDe = (config: ConfigHoja, fuentes: Fuentes) =>
  config.temas.length <= 2 ? `${TITULOS[config.clase]}: ${config.temas.join(' · ')}` : `${TITULOS[config.clase]} de ${cursosDe(config, fuentes)}`

function VerDibujo({ d, escala = 1 }: { d: Dibujo; escala?: number }) {
  return (
    <div
      role="img"
      aria-label={d.alt}
      title={d.credito}
      className="max-w-full [&>svg]:h-auto [&>svg]:w-full"
      style={{ width: d.ancho * escala }}
      // El SVG lo arma la app (examenes/dibujos.ts) y escapa todo el texto.
      dangerouslySetInnerHTML={{ __html: d.svg }}
    />
  )
}

/**
 * Por qué este tipo de pregunta cumple el currículo: lo que abarca el tema y la parte exacta del desempeño. En un tema
 * sumado a la miscelánea se muestra solo lo de la pregunta (lo del tema sale de la ficha del tema abierto).
 */
function SustentoTipo({ tipo, ficha, f }: { tipo: TipoPregunta; ficha: Ficha; f: Fuente }) {
  const { verCurriculo } = useStore()
  const principal = f.areaId === ficha.areaId && normalizar(f.tema) === normalizar(ficha.titulo)
  const s = useSustento(principal ? ficha : null, { fuente: 'tema' }, f.banco)
  const c = citaDelTipo(tipo, ficha.gradoId, f.banco)
  const cur = useCurriculo(nivelDe(ficha.gradoId), ficha.gradoId, c?.area ?? f.areaId)
  const u = cur.estado === 'listo' && cur.area && c ? ubicarCita(cur.area, c.cita, c.competencia) : null
  const mismo = !!u && u.desempeno === s?.tema.desempeno?.desempeno
  return (
    <div className="flex flex-col gap-3 leading-snug">
      <div>
        <p className="text-base font-semibold">Por qué cumple el Currículo Nacional</p>
        <p className="text-ink-soft">
          {!principal && `«${f.tema}» · `}
          {f.area} · {s?.grado ?? ficha.grado}
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
            {!s ? `Es justo lo resaltado, de la competencia «${u.competencia}».` : mismo ? 'Es justo lo resaltado del desempeño del tema.' : `Es justo lo resaltado, de la competencia «${u.competencia}» del mismo grado.`}
          </span>
        )}
      </Bloque>
      <p className="border-t border-line pt-2 text-sm text-ink-soft">
        Texto copiado tal cual del programa curricular (MINEDU); la cita se verifica letra por letra.{' '}
        <button type="button" onClick={() => verCurriculo(ficha.gradoId, f.areaId)} className="underline underline-offset-2 hover:text-ink">
          Ver en el currículo
        </button>
      </p>
    </div>
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

/** Lo que se escribe a mano en una línea; con `respuesta`, la respuesta ya escrita (solo en la pantalla). */
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
function Responder({ it, respuestas, compacta }: { it: Item; respuestas: boolean; compacta?: boolean }) {
  if (it.forma === 'opciones') {
    const enFila = compacta || it.alternativas.every((a) => a.length <= 16)
    return (
      <ul className={cx('flex gap-x-10 gap-y-3', enFila ? 'flex-wrap' : 'flex-col', compacta && 'gap-x-8 gap-y-1.5')}>
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
    // En el balotario se resuelve en el cuaderno: sin espacio, y la respuesta solo con «Respuestas».
    if (compacta)
      return respuestas ? (
        <p className="text-lg font-semibold print:hidden" style={{ color: COLOR }}>
          {it.respuesta}
        </p>
      ) : null
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
        Respuesta: <Linea ancho="w-60 max-w-full" respuesta={respuestas ? it.respuesta : undefined} />
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

/** Los pasos de la clave, debajo de la pregunta (solo en la pantalla, con «Respuestas»). */
function Pasos({ pasos, nota }: { pasos?: string[]; nota?: string }) {
  if (!pasos?.length && !nota) return null
  return (
    <div className="flex flex-col gap-1 border-l-4 pl-3 print:hidden" style={{ borderColor: COLOR, color: COLOR }}>
      {pasos?.map((p, k) => (
        <p key={k} className="text-lg">
          {p}
        </p>
      ))}
      {nota && <p className="text-lg font-semibold">{nota}</p>}
    </div>
  )
}

/**
 * Un dato del encabezado que se escribe directo sobre la hoja, como una celda; queda guardado para todas las hojas.
 * Vacío, su `placeholder` solo orienta en la pantalla y no se imprime (salvo `imprimirVacio`, cuando es un dato real).
 */
function Campo({ valor, cambiar, placeholder, className, imprimirVacio }: { valor: string; cambiar: (v: string) => void; placeholder: string; className?: string; imprimirVacio?: boolean }) {
  return (
    <input
      value={valor}
      onChange={(e) => cambiar(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      size={Math.max(valor.length, placeholder.length, 4)}
      className={cx(
        'min-w-0 max-w-full rounded-md border-b-2 border-dashed bg-transparent px-1 hover:border-ink-soft focus:border-ink focus:outline-none print:border-0',
        valor ? 'border-transparent' : 'border-line',
        !imprimirVacio && 'print:placeholder:text-transparent',
        imprimirVacio && 'placeholder:text-ink',
        className,
      )}
    />
  )
}

/** «Recuerda»: la idea del tema y un ejemplo resuelto, arriba de la práctica. */
function Recuerda({ teoria }: { teoria: Teoria }) {
  return (
    <section className="flex flex-col gap-2 rounded-2xl border-2 border-line px-5 py-4">
      <p className="text-lg font-bold">Recuerda</p>
      <p className="text-lg">{teoria.idea}</p>
      <div className="flex flex-col gap-1 rounded-xl bg-surface-2 px-4 py-3">
        <p className="text-lg">
          <span className="font-semibold">Ejemplo: </span>
          {teoria.ejemplo.enunciado}
        </p>
        {teoria.ejemplo.pasos.map((p, k) => (
          <p key={k} className="text-lg">
            {p}
          </p>
        ))}
        <p className="text-lg font-semibold">Respuesta: {teoria.ejemplo.respuesta}</p>
      </div>
    </section>
  )
}

/** Una pregunta de la hoja con sus gestos: más fácil o más difícil, cambiar, fijar y quitar (y la «i» del currículo). */
function Pregunta({
  it,
  n,
  clase,
  respuestas,
  tipo,
  ficha,
  f,
  nivel,
  cambiarNivel,
  cambiar,
  fijar,
  quitar,
}: {
  it: Version['items'][number]
  n: number
  clase: Clase
  respuestas: boolean
  tipo: TipoPregunta
  ficha: Ficha
  f: Fuente
  /** La dificultad pedida, o null si este tipo de pregunta no cambia con ella. */
  nivel: Nivel | null
  cambiarNivel: (d: 1 | -1) => void
  cambiar: () => void
  fijar: () => void
  quitar: () => void
}) {
  const compacta = clase === 'balotario'
  // Como en el libro: el enunciado a la izquierda y el recuadro para el procedimiento a la derecha.
  const conRecuadro = !compacta && it.forma === 'abierta' && it.espacio === 'procedimiento'
  const cabeza = (
    <div className={cx('flex items-start gap-3', !conRecuadro && (nivel ? 'sm:pr-60' : 'sm:pr-40'))}>
      <span className="shrink-0 text-lg font-bold tabular-nums">{n}.</span>
      <p className={cx('text-lg leading-snug', !compacta && 'font-semibold')}>{it.enunciado}</p>
    </div>
  )
  const datos = (
    <>
      {/* En el balotario, más chicos: así entra en menos hojas. */}
      {it.dibujo && <VerDibujo d={it.dibujo} escala={compacta ? 0.7 : 1} />}
      {it.pregunta && <p className="text-lg">{it.pregunta}</p>}
    </>
  )
  return (
    <li className={cx('group relative flex flex-col gap-3 border-t border-line first:border-t-0 first:pt-0', compacta ? 'py-4' : 'py-6')}>
      {conRecuadro ? (
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-3">
            {cabeza}
            {datos}
          </div>
          <div className="flex min-h-40 flex-col rounded-xl border-2 border-line px-3 py-2 sm:mt-11">
            <span className="text-ink-soft">Procedimiento</span>
          </div>
        </div>
      ) : (
        <>
          {cabeza}
          {datos}
        </>
      )}
      <Responder it={it} respuestas={respuestas} compacta={compacta} />
      {respuestas && <Pasos pasos={it.pasos} nota={it.nota} />}
      {/* Solo en la pantalla: más fácil o más difícil, cambiar, fijar, quitar y ver qué evalúa. */}
      <div className="flex items-center gap-1 print:hidden sm:absolute sm:right-0 sm:top-5 sm:group-first:top-0">
        {nivel && (
          <span className="mr-1 inline-flex items-center rounded-lg border border-line text-ink-soft opacity-70 transition group-hover:opacity-100" title={`Dificultad: ${NIVELES[nivel - 1].nombre.toLowerCase()}`}>
            <button type="button" onClick={() => cambiarNivel(-1)} disabled={nivel === 1} className="grid size-8 place-items-center rounded-l-lg hover:bg-surface-2 hover:text-ink disabled:opacity-30" aria-label={`Más fácil la pregunta ${n}`} title="Más fácil">
              <Minus className="size-3.5" aria-hidden />
            </button>
            <span role="img" aria-label={`Dificultad: ${NIVELES[nivel - 1].nombre.toLowerCase()}`} className="px-0.5">
              <Puntos n={nivel} />
            </span>
            <button type="button" onClick={() => cambiarNivel(1)} disabled={nivel === 3} className="grid size-8 place-items-center rounded-r-lg hover:bg-surface-2 hover:text-ink disabled:opacity-30" aria-label={`Más difícil la pregunta ${n}`} title="Más difícil">
              <Plus className="size-3.5" aria-hidden />
            </button>
          </span>
        )}
        <button
          type="button"
          onClick={cambiar}
          className="inline-flex size-9 items-center justify-center rounded-lg text-ink-soft opacity-70 transition hover:bg-surface-2 hover:text-ink group-hover:opacity-100"
          aria-label={tipo.cambia === 'numeros' ? `Otros números para la pregunta ${n}` : `Otra pregunta en el lugar ${n}`}
          title={tipo.cambia === 'numeros' ? 'Otros números' : 'Otra pregunta'}
        >
          <RefreshCw className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={fijar}
          aria-pressed={it.fija}
          className={cx('inline-flex size-9 items-center justify-center rounded-lg transition hover:bg-surface-2', !it.fija && 'text-ink-soft opacity-70 hover:text-ink group-hover:opacity-100')}
          style={it.fija ? { color: COLOR, background: tinte(COLOR, 12) } : undefined}
          aria-label={it.fija ? `Soltar la pregunta ${n}` : `Fijar la pregunta ${n}`}
          title={it.fija ? 'Fijada: no cambia' : 'Fijar'}
        >
          <Pin className={cx('size-4', it.fija && 'fill-current')} aria-hidden />
        </button>
        <button
          type="button"
          onClick={quitar}
          className="inline-flex size-9 items-center justify-center rounded-lg text-ink-soft opacity-70 transition hover:bg-surface-2 hover:text-ink group-hover:opacity-100"
          aria-label={`Quitar la pregunta ${n}`}
          title="Quitar"
        >
          <X className="size-4" aria-hidden />
        </button>
        <BotonInfo etiqueta={`Qué evalúa la pregunta ${n}`}>
          <SustentoTipo tipo={tipo} ficha={ficha} f={f} />
        </BotonInfo>
      </div>
    </li>
  )
}

function VistaHoja({
  config,
  v,
  ficha,
  fuentes,
  colegio,
  cambiarColegio,
  respuestas,
  acciones,
}: {
  config: ConfigHoja
  v: Version
  ficha: Ficha
  fuentes: Fuentes
  colegio: Colegio
  cambiarColegio: (c: Partial<Colegio>) => void
  respuestas: boolean
  acciones: { cambiar: (i: number) => void; fijar: (i: number) => void; quitar: (i: number) => void; nivel: (i: number, d: 1 | -1) => void }
}) {
  const clase = config.clase
  const grupos = porTema(v, config.temas)
  const conSubtitulos = config.temas.length > 1
  let n = 0
  return (
    <div className="papel">
      <Hoja className="gap-6">
        <header className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Campo valor={colegio.colegio} cambiar={(x) => cambiarColegio({ colegio: x })} placeholder="Nombre del colegio" className="text-lg font-semibold" />
              <p className="flex flex-wrap items-center gap-x-1.5 text-lg text-ink-soft">
                <span>{cursosDe(config, fuentes)} ·</span>
                <Campo valor={colegio.seccion} cambiar={(x) => cambiarColegio({ seccion: x })} placeholder={ficha.grado} imprimirVacio />
                <span>·</span>
                <Campo valor={colegio.docente} cambiar={(x) => cambiarColegio({ docente: x })} placeholder="Docente" />
              </p>
            </div>
            {clase === 'examen' && (
              <div className="flex shrink-0 flex-col items-center gap-1">
                <span className="text-ink-soft">Nota</span>
                <span className="size-16 rounded-xl border-2 border-ink" aria-hidden />
              </div>
            )}
          </div>
          <h2 className="font-display text-3xl font-bold leading-tight">{tituloDe(config, fuentes)}</h2>
          <p className="flex flex-wrap gap-x-8 gap-y-2 text-lg">
            <span className="flex items-end gap-2">
              Nombre: <span className="mb-1 h-px w-56 bg-ink-soft sm:w-72" aria-hidden />
            </span>
            <span className="flex items-end gap-2">
              {clase === 'balotario' ? 'Para el examen del' : 'Fecha'}: <span className="mb-1 h-px w-24 bg-ink-soft" aria-hidden />
            </span>
            {v.fila && <span className="font-semibold">{v.fila}</span>}
          </p>
        </header>

        {grupos.map((g, k) => {
          const f = fuentes.get(g.tema)
          if (!f) return null
          return (
            <section key={g.tema} className="flex flex-col gap-3">
              {conSubtitulos && (
                <h3 className="text-xl font-bold">
                  {ROMANOS[k] ?? k + 1}. {g.tema}
                </h3>
              )}
              {clase === 'practica' && f.problemas?.teoria && <Recuerda teoria={f.problemas.teoria} />}
              <ol className="flex flex-col">
                {g.items.map((it) => {
                  n++
                  const tipo = f.tipos.find((t) => t.id === it.tipo)
                  if (!tipo) return null
                  return (
                    <Pregunta
                      key={`${it.indice}-${it.clave}`}
                      it={it}
                      n={n}
                      clase={clase}
                      respuestas={respuestas}
                      tipo={tipo}
                      ficha={ficha}
                      f={f}
                      nivel={tipo.niveles ? nivelPedido(config, config.items[it.indice]) : null}
                      cambiarNivel={(d) => acciones.nivel(it.indice, d)}
                      cambiar={() => acciones.cambiar(it.indice)}
                      fijar={() => acciones.fijar(it.indice)}
                      quitar={() => acciones.quitar(it.indice)}
                    />
                  )
                })}
              </ol>
            </section>
          )
        })}
      </Hoja>
    </div>
  )
}

/** Cuántas preguntas de un tipo caben sin repetirse. Marcar y ¿tiene razón? comparten las preguntas del banco. */
function maximo(tipo: TipoPregunta, f: Fuente, cuantas: Map<string, number>) {
  if (tipo.cambia === 'numeros') return 12
  const preguntas = f.banco?.preguntas.length ?? 0
  const de = (id: string) => cuantas.get(`${f.tema}|${id}`) ?? 0
  if (tipo.id === 'problemas') return f.problemas?.problemas.length ?? 0
  if (tipo.id === 'banco-opciones') return preguntas - de('banco-detective')
  if (tipo.id === 'banco-detective') return Math.min(3, preguntas - de('banco-opciones'))
  return 2
}

function FilaTipo({ tipo, n, max, cambiar, ficha, f }: { tipo: TipoPregunta; n: number; max: number; cambiar: (d: 1 | -1) => void; ficha: Ficha; f: Fuente }) {
  return (
    <li className="flex items-center gap-2 py-1.5">
      <span className={cx('min-w-0 flex-1 leading-snug', n === 0 && 'text-ink-soft')}>{tipo.nombre}</span>
      <BotonInfo etiqueta={`Qué evalúa «${tipo.nombre}»`}>
        <SustentoTipo tipo={tipo} ficha={ficha} f={f} />
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

/** El panel: cuántas preguntas de cada tipo, por tema. */
function ElegirPreguntas({ config, fuentes, cambiar, reiniciar, ficha }: { config: ConfigHoja; fuentes: Fuentes; cambiar: (tema: string, tipo: string, d: 1 | -1) => void; reiniciar: () => void; ficha: Ficha }) {
  const n = contar(config)
  return (
    <div className="flex flex-col gap-4">
      {config.temas.map((t) => {
        const f = fuentes.get(t)
        if (!f) return null
        return (
          <div key={t} className="flex flex-col">
            {config.temas.length > 1 && <p className="font-semibold">{t}</p>}
            <ul className="flex flex-col divide-y divide-line">
              {f.tipos.map((tipo) => (
                <FilaTipo key={tipo.id} tipo={tipo} n={n.get(`${t}|${tipo.id}`) ?? 0} max={maximo(tipo, f, n)} cambiar={(d) => cambiar(t, tipo.id, d)} ficha={ficha} f={f} />
              ))}
            </ul>
          </div>
        )
      })}
      <button type="button" onClick={reiniciar} className="inline-flex items-center gap-1.5 self-start text-ink-soft underline-offset-4 hover:text-ink hover:underline">
        <RotateCcw className="size-4" aria-hidden /> Volver a la hoja sugerida
      </button>
    </div>
  )
}

/**
 * Sumar otro tema (así se arma la miscelánea del bimestre). Muestra los temas del curso abierto; al buscar, también
 * encuentra los de otros cursos del grado, con el nombre de su curso: es la única vez que aparece otro curso.
 */
function ElegirTema({ abierta, cerrar, ficha, delCurso, ya, elegir }: { abierta: boolean; cerrar: () => void; ficha: Ficha; delCurso: string[]; ya: string[]; elegir: (tema: string, areaId: string) => void }) {
  const [q, setQ] = useState('')
  const todos = useTemasDelGrado(ficha.gradoId, abierta && !!q.trim())
  const palabras = normalizar(q).split(/\s+/).filter(Boolean)
  const coincide = (t: string) => !ya.includes(t) && palabras.every((p) => normalizar(t).includes(p))
  const lista = [
    ...delCurso.filter(coincide).map((tema) => ({ tema, areaId: ficha.areaId, area: '' })),
    ...(palabras.length && todos ? todos.filter((x) => x.areaId !== ficha.areaId && coincide(x.tema)) : []),
  ]
  return (
    <Ventana abierta={abierta} cerrar={cerrar} titulo="Sumar un tema">
      <label className="relative">
        <span className="sr-only">Buscar tema</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-ink-soft" aria-hidden />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar tema"
          className="h-12 w-full rounded-xl border-2 border-line bg-surface pl-10 pr-3 text-lg focus:border-ink focus:outline-none"
        />
      </label>
      <ul className="-mx-2 flex max-h-[50dvh] flex-col overflow-y-auto">
        {lista.map((x) => (
          <li key={`${x.areaId}|${x.tema}`}>
            <button
              type="button"
              onClick={() => {
                elegir(x.tema, x.areaId)
                cerrar()
                setQ('')
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-lg hover:bg-surface-2"
            >
              <Plus className="size-4 shrink-0 text-ink-soft" aria-hidden />
              <span className="min-w-0 flex-1">{x.tema}</span>
              {x.area && <span className="shrink-0 text-base text-ink-soft">{x.area}</span>}
            </button>
          </li>
        ))}
        {!lista.length && <li className="px-3 py-2.5 text-lg text-ink-soft">{palabras.length && !todos ? 'Buscando…' : `No encontramos «${q.trim()}».`}</li>}
      </ul>
    </Ventana>
  )
}

function Chip({ children, quitar }: { children: string; quitar?: () => void }) {
  return (
    <span className="inline-flex h-10 max-w-full items-center gap-1 rounded-full border-2 border-line bg-surface pl-4 pr-1.5 font-medium">
      <span className="truncate">{children}</span>
      {quitar ? (
        <button type="button" onClick={quitar} className="grid size-7 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-surface-2 hover:text-ink" aria-label={`Quitar «${children}»`}>
          <X className="size-4" aria-hidden />
        </button>
      ) : (
        <span className="w-2.5" />
      )}
    </span>
  )
}

/** Las hojas del tema abierto: examen, práctica y balotario, con sus temas, sus preguntas y sus dos PDF. */
export function Hojas({ ficha, area }: { ficha: Ficha; area: Area }) {
  const { resultados, guardar, avisar } = useStore()
  const [colegio, cambiarColegio] = useColegio()
  const [clase, setClase] = useState<Clase>(resultados.hojaAbierta ?? 'examen')
  const [hojas, setHojas] = useState<Partial<Record<Clase, ConfigHoja>>>(() => resultados.hojas ?? {})
  const [fila, setFila] = useState(0)
  const [respuestas, setRespuestas] = useState(false)
  const [armando, setArmando] = useState<'hoja' | 'clave' | null>(null)
  const [sumarTema, setSumarTema] = useState(false)

  const fuenteTema = useMemo(() => fuenteDe(ficha.gradoId, ficha.titulo, area), [ficha.gradoId, ficha.titulo, area])
  const config = useMemo(() => hojas[clase] ?? hojaNueva(clase, [fuenteTema]), [hojas, clase, fuenteTema])
  const areaDe = (t: string) => config.areas?.[t] ?? ficha.areaId
  const areas = useAreas(ficha.gradoId, config.temas.map(areaDe))
  const fuentes: Fuentes = useMemo(
    () =>
      new Map(
        config.temas.flatMap((t) => {
          if (t === fuenteTema.tema) return [[t, fuenteTema] as const]
          const a = areas?.get(config.areas?.[t] ?? ficha.areaId)
          return a ? [[t, fuenteDe(ficha.gradoId, t, a)] as const] : []
        }),
      ),
    [config, areas, fuenteTema, ficha.gradoId, ficha.areaId],
  )
  const versiones = useMemo(() => armarVersiones(config, fuentes), [config, fuentes])
  const v = versiones[Math.min(fila, versiones.length - 1)]
  const total = v.items.length

  const poner = (c: ConfigHoja) => setHojas((h) => ({ ...h, [c.clase]: c }))
  // Se guardan en el tema: al volver, siguen las mismas versiones (las que quizás ya se imprimieron).
  useEffect(() => {
    if (!hojas[clase]) poner(config)
    guardar('hojaAbierta', clase)
    setFila(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clase])
  useEffect(() => {
    guardar('hojas', hojas)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hojas])

  async function bajar(clave: boolean) {
    setArmando(clave ? 'clave' : 'hoja')
    try {
      const [{ pdfHoja }, cur] = await Promise.all([import('../examenes/pdf'), cargarNivel(nivelDe(ficha.gradoId))])
      const grado = cur?.grados.find((g) => g.id === ficha.gradoId)
      const pdf = await pdfHoja(
        {
          clase,
          titulo: tituloDe(config, fuentes),
          curso: cursosDe(config, fuentes),
          grado: colegio.seccion || ficha.grado,
          colegio: colegio.colegio,
          docente: colegio.docente,
          temas: config.temas.map((t) => ({ tema: t, teoria: fuentes.get(t)?.problemas?.teoria ?? null })),
          subtitulos: config.temas.length > 1,
          versiones,
          sustento: (tema, id) => {
            const f = fuentes.get(tema)
            const t = f?.tipos.find((x) => x.id === id)
            const c = t && f ? citaDelTipo(t, ficha.gradoId, f.banco) : null
            const a = c && f && grado?.areas.find((x) => x.id === (c.area ?? f.areaId))
            const u = a && c ? ubicarCita(a, c.cita, c.competencia) : null
            return { nombre: t?.nombre ?? id, cita: c?.cita, competencia: u?.competencia }
          },
        },
        { clave },
      )
      const sufijo = clave ? 'clave' : clase === 'examen' && config.filas ? 'filas-a-y-b' : clase
      await descargar(pdf, nombreArchivo(`${TITULOS[clase]} ${config.temas[0]} ${versiones.map((x) => x.codigo).join(' ')}`, sufijo), avisar)
    } catch {
      avisar('No pudimos armar el PDF. Intenta de nuevo.', 'error')
    } finally {
      setArmando(null)
    }
  }

  async function elegirTema(tema: string, areaId: string) {
    try {
      const a = areaId === area.areaId ? area : await cargarArea(ficha.gradoId, areaId)
      poner(agregarTema(config, fuenteDe(ficha.gradoId, tema, a), fuentes))
    } catch {
      avisar('No pudimos sumar el tema. Intenta de nuevo.', 'error')
    }
  }

  const panel = (
    <ElegirPreguntas
      config={config}
      fuentes={fuentes}
      ficha={ficha}
      cambiar={(t, tipo, d) => poner(cambiarCantidad(config, t, tipo, d))}
      reiniciar={() => poner(hojaNueva(clase, config.temas.flatMap((t) => fuentes.get(t) ?? []), config.filas, undefined, config.nivel))}
    />
  )

  const activo = (si: boolean) => (si ? { background: tinte(COLOR, 12), borderColor: COLOR } : undefined)
  // La dificultad de la hoja se ofrece si alguna de sus preguntas cambia con ella.
  const conNiveles = config.items.some((it) => fuentes.get(it.tema)?.tipos.find((t) => t.id === it.tipo)?.niveles)

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 print:hidden">
        <div role="tablist" aria-label="Hoja" className="flex gap-1 rounded-2xl bg-surface-2 p-1">
          {CLASES.map((c) => (
            <button
              key={c.id}
              role="tab"
              type="button"
              aria-selected={c.id === clase}
              onClick={() => setClase(c.id)}
              className={cx('h-11 rounded-xl px-5 text-lg transition', c.id === clase ? 'bg-surface font-semibold shadow-sm' : 'text-ink-soft hover:text-ink')}
            >
              {c.nombre}
            </button>
          ))}
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {config.temas.map((t, k) => (
            <Chip key={t} quitar={k === 0 ? undefined : () => poner(quitarTema(config, t, fuentes))}>
              {t}
            </Chip>
          ))}
          <button type="button" onClick={() => setSumarTema(true)} className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 font-medium text-ink-soft hover:bg-surface-2 hover:text-ink">
            <Plus className="size-4" aria-hidden /> Tema
          </button>
        </div>
        {conNiveles && (
          <div className="flex items-center gap-2 xl:ml-auto">
            <span className="text-ink-soft">Dificultad</span>
            <div role="radiogroup" aria-label="Dificultad de toda la hoja" className="flex gap-1 rounded-2xl bg-surface-2 p-1">
              {NIVELES.map((x) => (
                <button
                  key={x.n}
                  role="radio"
                  type="button"
                  aria-checked={x.n === (config.nivel ?? 2)}
                  onClick={() => poner(cambiarNivelHoja(config, x.n))}
                  className={cx('h-10 rounded-xl px-4 transition', x.n === (config.nivel ?? 2) ? 'bg-surface font-semibold shadow-sm' : 'text-ink-soft hover:text-ink')}
                >
                  {x.nombre}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <BarraHoja>
        <Boton variante="herramienta" herramienta="examen" onClick={() => bajar(false)} cargando={armando === 'hoja'} disabled={!total}>
          {armando !== 'hoja' && <Download className="size-5" aria-hidden />} Descargar PDF
        </Boton>
        <Boton variante="contorno" onClick={() => bajar(true)} cargando={armando === 'clave'} disabled={!total}>
          {armando !== 'clave' && <CircleCheck className="size-5" aria-hidden />} Clave
        </Boton>
        <Boton
          variante="contorno"
          onClick={() => {
            poner(otraVersion(config))
            avisar('Otra versión: las mismas preguntas con otros números.', 'ok')
          }}
        >
          <Dices className="size-5" aria-hidden /> Otra versión
        </Boton>
        {clase === 'examen' && (
          <Boton
            variante="contorno"
            onClick={() => {
              poner({ ...config, filas: !config.filas })
              setFila(0)
            }}
            aria-pressed={config.filas}
            style={activo(config.filas)}
          >
            <Columns2 className="size-5" aria-hidden /> Fila A y B
          </Boton>
        )}
        {clase === 'balotario' && (
          <Boton
            variante="contorno"
            onClick={() => {
              const examen = examenDesdeBalotario(config, fuentes)
              setHojas((h) => ({ ...h, examen }))
              setClase('examen')
              avisar('Examen armado con preguntas del balotario: las fijadas, igualitas.', 'ok')
            }}
          >
            <FileStack className="size-5" aria-hidden /> Armar examen
          </Boton>
        )}
        <Boton variante="contorno" onClick={() => setRespuestas(!respuestas)} aria-pressed={respuestas} style={activo(respuestas)}>
          <Eye className="size-5" aria-hidden /> Respuestas
        </Boton>
        <Boton variante="contorno" onClick={() => imprimir(avisar)} aria-label="Imprimir">
          <Printer className="size-5" aria-hidden /> <span className="hidden sm:inline">Imprimir</span>
        </Boton>
      </BarraHoja>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="xl:hidden">
            <Desplegable titulo={`Preguntas (${total})`}>{panel}</Desplegable>
          </div>
          {clase === 'examen' && config.filas && (
            <div role="tablist" aria-label="Fila" className="flex gap-1 self-start rounded-xl bg-surface-2 p-1 print:hidden">
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
          {!areas ? (
            <p className="text-lg text-ink-soft" role="status">
              Cargando la hoja…
            </p>
          ) : total ? (
            <VistaHoja
              config={config}
              v={v}
              ficha={ficha}
              fuentes={fuentes}
              colegio={colegio}
              cambiarColegio={cambiarColegio}
              respuestas={respuestas}
              acciones={{
                cambiar: (i) => poner(cambiarItem(config, i, fuentes)),
                fijar: (i) => poner(fijarItem(config, i)),
                quitar: (i) => poner({ ...config, items: config.items.filter((_, k) => k !== i) }),
                nivel: (i, d) => poner(cambiarNivelItem(config, i, d)),
              }}
            />
          ) : (
            <p className="rounded-2xl border border-dashed border-line px-5 py-6 text-lg text-ink-soft">Sin preguntas.</p>
          )}
        </div>
        <aside className="sticky top-20 hidden flex-col gap-3 rounded-2xl border border-line bg-surface p-4 xl:flex print:hidden">
          <h2 className="font-display text-xl font-bold">Preguntas ({total})</h2>
          {panel}
        </aside>
      </div>

      <ElegirTema abierta={sumarTema} cerrar={() => setSumarTema(false)} ficha={ficha} delCurso={area.bancos.map((b) => b.tema)} ya={config.temas} elegir={elegirTema} />
    </>
  )
}
