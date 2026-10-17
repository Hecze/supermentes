import { ArrowLeft, BookOpen, Camera, Check, ChevronRight, FileText, LoaderCircle, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { api } from '../api'
import { useStore } from '../app/store'
import { buscarEnGrado, buscarEnTodos, fundamento, type Fundamento, type Resultado } from '../curriculo/buscar'
import { GRADOS_CURRICULO, NIVELES, areaPorId, areasDe, gradoPorId, nivelDe } from '../curriculo/catalogo'
import { cargarNivel, useCurriculo } from '../curriculo/cargar'
import { Boton, cx } from './ui'

type Material = { nombre: string; url: string | null; archivo?: File; tipo: 'foto' | 'archivo' }

const PASOS = ['Leyendo lo que pide el currículo', 'Buscando las ideas y palabras clave', 'Preparando tu tema']

const NOMBRES = Object.fromEntries(GRADOS_CURRICULO.map((g) => [g.id, g.corto]))

const selectCls = 'h-12 rounded-xl border-2 border-line bg-surface px-3 text-lg focus:border-ink focus:outline-none'

/** Una fila de resultados: el tema, su curso (y grado si es otro) y, si viene de un desempeño, la cita. */
function FilaResultado({ r, otroGrado, elegir }: { r: Resultado; otroGrado?: boolean; elegir: (r: Resultado) => void }) {
  return (
    <li>
      <button type="button" onClick={() => elegir(r)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface-2">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-semibold leading-snug">{r.tema}</span>
          <span className="text-sm text-ink-soft">
            {r.area}
            {otroGrado && ` · ${r.grado}`}
          </span>
          {r.cita && <span className="mt-0.5 line-clamp-2 text-sm text-ink-soft">En el currículo: «{r.cita}»</span>}
        </span>
        <ChevronRight className="size-5 shrink-0 text-ink-soft" aria-hidden />
      </button>
    </li>
  )
}

/**
 * Ventana para elegir un tema. Solo se eligen temas que el Currículo Nacional respalda: así cada tema
 * llega con su competencia y sus desempeños, y todo lo que se genera parte de ahí.
 */
export function NuevoTema() {
  const { nuevoTemaAbierto, previoTema, cerrarNuevoTema, setFicha, ir, avisar, ficha, verCurriculo } = useStore()
  const dialogo = useRef<HTMLDialogElement>(null)
  const buscador = useRef<HTMLInputElement>(null)
  const [gradoId, setGradoId] = useState(ficha?.gradoId ?? 'primaria-4')
  const [areaId, setAreaId] = useState('')
  const [q, setQ] = useState('')
  const [elegido, setElegido] = useState<(Resultado & Fundamento) | null>(null)
  const [otros, setOtros] = useState<Resultado[] | null>(null)
  const [material, setMaterial] = useState<Material | null>(null)
  const [paso, setPaso] = useState<number | null>(null)
  const temporizadores = useRef<number[]>([])

  const cur = useCurriculo(nivelDe(gradoId), gradoId)
  const grado = cur.estado === 'listo' ? cur.grado : null

  async function elegir(r: Resultado) {
    const datos = await cargarNivel(nivelDe(r.gradoId))
    const area = datos?.grados.find((g) => g.id === r.gradoId)?.areas.find((a) => a.id === r.areaId)
    if (!area) return
    setElegido({ ...r, ...fundamento(area, r.tema, r.cita, r.indiceCompetencia) })
  }

  useEffect(() => {
    const d = dialogo.current
    if (!d) return
    if (nuevoTemaAbierto && !d.open) {
      const g = previoTema?.gradoId ?? ficha?.gradoId ?? 'primaria-4'
      setGradoId(g)
      setAreaId(previoTema?.areaId ?? '')
      setQ('')
      setElegido(null)
      setMaterial(null)
      setPaso(null)
      d.showModal()
      // Desde el currículo ya viene el tema: se pasa directo a confirmar.
      if (previoTema?.texto && previoTema.areaId) {
        void elegir({
          tema: previoTema.texto,
          gradoId: g,
          grado: NOMBRES[g] ?? g,
          areaId: previoTema.areaId,
          area: areaPorId(g, previoTema.areaId)?.nombre ?? previoTema.areaId,
          indiceCompetencia: previoTema.indiceCompetencia,
        })
      } else buscador.current?.focus()
    }
    if (!nuevoTemaAbierto && d.open) d.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nuevoTemaAbierto, previoTema, ficha])

  useEffect(() => () => temporizadores.current.forEach((t) => window.clearTimeout(t)), [])

  const resultados = useMemo(() => (grado ? buscarEnGrado(grado, NOMBRES[gradoId] ?? gradoId, q, areaId || undefined) : []), [grado, gradoId, q, areaId])

  // Si en el grado elegido no aparece tal cual, se busca también entre los temas de los demás grados.
  const sinResultados = q.trim().length > 2 && grado !== null && !resultados.some((r) => !r.parcial)
  useEffect(() => {
    setOtros(null)
    if (!sinResultados) return
    let vivo = true
    const t = window.setTimeout(() => {
      void buscarEnTodos(q, NOMBRES, gradoId).then((r) => vivo && setOtros(r.slice(0, 8)))
    }, 250)
    return () => {
      vivo = false
      window.clearTimeout(t)
    }
  }, [sinResultados, q, gradoId])

  function cambiarGrado(id: string) {
    setGradoId(id)
    if (areaId && !areaPorId(id, areaId)) setAreaId('')
  }

  const ocupado = paso !== null

  async function crear(e: FormEvent) {
    e.preventDefault()
    if (ocupado) return
    if (!elegido) {
      // Enter en el buscador elige el primer resultado.
      if (resultados[0]) void elegir(resultados[0])
      return
    }
    setPaso(0)
    temporizadores.current.push(
      window.setTimeout(() => setPaso(1), 600),
      window.setTimeout(() => setPaso(2), 1200),
    )
    try {
      const nueva = await api.prepararFicha({
        tipo: material ? material.tipo : 'texto',
        texto: elegido.tema,
        archivo: material?.archivo,
        gradoId: elegido.gradoId,
        areaId: elegido.areaId,
        grado: gradoPorId(elegido.gradoId)?.corto ?? elegido.grado,
        area: areaPorId(elegido.gradoId, elegido.areaId)?.nombre ?? elegido.area,
        competencia: elegido.competencia,
        capacidad: elegido.capacidad,
        desempenos: elegido.desempenos,
      })
      // El tema guarda los desempeños oficiales de los que partió: con ellos se sustenta todo lo que se cree después.
      setFicha({ ...nueva, curriculo: { ...nueva.curriculo, desempenos: nueva.curriculo.desempenos ?? elegido.desempenos } })
      cerrarNuevoTema()
      ir('ficha')
    } catch {
      avisar('No pudimos preparar el tema. Revisa tu conexión e intenta de nuevo.', 'error')
      setPaso(null)
    }
  }

  function elegirArchivo(f: File | undefined) {
    if (!f) return
    const esFoto = f.type.startsWith('image/')
    setMaterial({ nombre: f.name, url: esFoto ? URL.createObjectURL(f) : null, archivo: f, tipo: esFoto ? 'foto' : 'archivo' })
  }

  // Cursos en el orden del catálogo (Comunicación, Matemática…).
  const orden = areasDe(gradoId).map((a) => a.id)
  const posicion = (id: string) => (orden.includes(id) ? orden.indexOf(id) : orden.length)
  const areas = grado ? grado.areas.filter((a) => !areaId || a.id === areaId).sort((a, b) => posicion(a.id) - posicion(b.id)) : []

  return (
    <dialog
      ref={dialogo}
      onClose={cerrarNuevoTema}
      onCancel={(e) => ocupado && e.preventDefault()}
      onClick={(e) => e.target === dialogo.current && !ocupado && cerrarNuevoTema()}
      aria-labelledby="nuevo-tema-titulo"
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(46rem,calc(100vw-2rem))] overflow-y-auto rounded-3xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/45"
    >
      <form onSubmit={crear} className="flex flex-col">
        <header className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            <h2 id="nuevo-tema-titulo" className="font-display text-2xl font-bold">
              {elegido ? 'Tu tema' : 'Busca tu tema'}
            </h2>
            <p className="text-ink-soft">
              {elegido ? 'Esto es lo que pide el currículo. De aquí parte todo lo que prepares.' : 'Elige un tema del Currículo Nacional y preparamos todo lo demás.'}
            </p>
          </div>
          {!ocupado && (
            <button type="button" onClick={cerrarNuevoTema} className="rounded-lg p-1.5 text-ink-soft hover:bg-surface-2 hover:text-ink" aria-label="Cerrar">
              <X className="size-5" />
            </button>
          )}
        </header>

        {ocupado ? (
          <div className="flex flex-col gap-4 px-6 py-8 text-lg" role="status">
            {PASOS.map((p, i) => (
              <p key={p} className={cx('flex items-center gap-3', i > paso && 'text-ink-soft')}>
                {i < paso ? (
                  <Check className="size-6 text-ok" aria-hidden />
                ) : i === paso ? (
                  <LoaderCircle className="size-6 animate-spin" aria-hidden />
                ) : (
                  <span className="size-6" />
                )}
                {p}
              </p>
            ))}
          </div>
        ) : elegido ? (
          <div className="flex flex-col gap-5 px-6 py-6">
            <button
              type="button"
              onClick={() => {
                setElegido(null)
                window.setTimeout(() => buscador.current?.focus())
              }}
              className="-mt-2 inline-flex items-center gap-1.5 self-start text-sm text-ink-soft hover:text-ink"
            >
              <ArrowLeft className="size-4" aria-hidden /> Buscar otro tema
            </button>

            <div className="flex flex-col gap-3 rounded-2xl border-2 border-line p-5">
              <div>
                <p className="font-display text-2xl font-bold leading-tight">{elegido.tema}</p>
                <p className="text-ink-soft">
                  {elegido.area} · {elegido.grado}
                </p>
              </div>
              {elegido.competencia && (
                <div className="flex flex-col gap-1.5 border-t border-line pt-3">
                  <p className="text-sm text-ink-soft">Competencia del Currículo Nacional</p>
                  <p className="-mt-1 font-semibold">{elegido.competencia}</p>
                  <ul className="flex flex-col gap-1.5">
                    {elegido.desempenos.map((d) => (
                      <li key={d} className="flex gap-2 text-sm">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ink" aria-hidden />
                        <span className="line-clamp-3">{d}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => {
                      cerrarNuevoTema()
                      verCurriculo(elegido.gradoId, elegido.areaId)
                    }}
                    className="inline-flex items-center gap-1.5 self-start text-sm text-ink-soft underline underline-offset-4 hover:text-ink"
                  >
                    <BookOpen className="size-4" aria-hidden /> Ver todo el currículo de {elegido.area}
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <p className="font-medium">
                ¿Vas a usar el libro o tu sesión? <span className="font-normal text-ink-soft">(opcional)</span>
              </p>
              <p className="-mt-1 text-sm text-ink-soft">Súbelos y usamos tus mismos ejemplos.</p>
              {material ? (
                <div className="flex items-center gap-3 rounded-xl border-2 border-line px-3 py-2">
                  {material.url ? (
                    <img src={material.url} alt="" className="h-12 w-9 rounded object-cover" />
                  ) : material.tipo === 'foto' ? (
                    <Camera className="size-5 text-examen" aria-hidden />
                  ) : (
                    <FileText className="size-5 text-examen" aria-hidden />
                  )}
                  <span className="min-w-0 flex-1 truncate">{material.nombre}</span>
                  <button type="button" onClick={() => setMaterial(null)} className="rounded-lg p-1 text-ink-soft hover:text-ink" aria-label="Quitar material">
                    <X className="size-5" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <label
                      htmlFor="nuevo-tema-foto"
                      className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-line font-medium hover:bg-surface-2"
                    >
                      <Camera className="size-5" aria-hidden /> Foto del libro
                      <input id="nuevo-tema-foto" type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => elegirArchivo(e.target.files?.[0])} />
                    </label>
                    <label
                      htmlFor="nuevo-tema-archivo"
                      className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-line font-medium hover:bg-surface-2"
                    >
                      <FileText className="size-5" aria-hidden /> Archivo
                      <input
                        id="nuevo-tema-archivo"
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,image/*"
                        className="sr-only"
                        onChange={(e) => elegirArchivo(e.target.files?.[0])}
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMaterial({ nombre: 'Página 48 del libro de Matemática', url: null, tipo: 'foto' })}
                    className="self-start text-sm text-ink-soft underline underline-offset-4 hover:text-ink"
                  >
                    Probar con una foto de ejemplo
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-6 py-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <label htmlFor="nuevo-tema-grado" className="flex flex-col gap-1.5">
                <span className="font-medium">Grado</span>
                <select id="nuevo-tema-grado" value={gradoId} onChange={(e) => cambiarGrado(e.target.value)} className={selectCls}>
                  {NIVELES.map((n) => (
                    <optgroup key={n.id} label={n.nombre}>
                      {GRADOS_CURRICULO.filter((g) => g.nivel === n.id).map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.corto}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <label htmlFor="nuevo-tema-curso" className="flex flex-col gap-1.5">
                <span className="font-medium">Curso</span>
                <select id="nuevo-tema-curso" value={areaId} onChange={(e) => setAreaId(e.target.value)} className={selectCls}>
                  <option value="">Todos los cursos</option>
                  {areasDe(gradoId).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label htmlFor="nuevo-tema-buscar" className="relative">
              <span className="sr-only">Buscar tema</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-ink-soft" aria-hidden />
              <input
                id="nuevo-tema-buscar"
                ref={buscador}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Busca: fracciones, ciclo del agua, sustantivos…"
                autoComplete="off"
                className="h-12 w-full rounded-xl border-2 border-line bg-surface pl-11 pr-4 text-lg focus:border-ink focus:outline-none"
              />
            </label>

            <div className="flex max-h-[min(26rem,50dvh)] flex-col overflow-y-auto">
              {!grado ? (
                <p className="flex items-center gap-2 px-3 py-2 text-ink-soft" role="status">
                  <LoaderCircle className="size-5 animate-spin" aria-hidden /> Cargando el currículo…
                </p>
              ) : !q.trim() ? (
                // Sin búsqueda: todos los temas del grado, por curso.
                <div className="flex flex-col gap-4">
                  {areas
                    .filter((a) => a.temas.length)
                    .map((a) => (
                      <section key={a.id} className="flex flex-col gap-1.5">
                        <h3 className="text-sm font-semibold text-ink-soft">{a.nombre}</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {a.temas.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => void elegir({ tema: t, gradoId, grado: NOMBRES[gradoId] ?? gradoId, areaId: a.id, area: a.nombre })}
                              className="rounded-full border border-line px-3 py-1 text-sm hover:border-ink hover:bg-surface-2"
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </section>
                    ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {resultados.length > 0 ? (
                    <ul className="-mx-3 flex flex-col">
                      {resultados.map((r) => (
                        <FilaResultado key={`${r.areaId}-${r.tema}-${r.cita ?? ''}`} r={r} elegir={elegir} />
                      ))}
                    </ul>
                  ) : (
                    <>
                      <p className="px-0.5">
                        No encontramos «{q.trim()}» en el currículo de {NOMBRES[gradoId]}
                        {areaId && ` (${areaPorId(gradoId, areaId)?.nombre})`}. Prueba con otra palabra{areaId && ' o busca en todos los cursos'}.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setQ('')
                          buscador.current?.focus()
                        }}
                        className="self-start text-sm text-ink-soft underline underline-offset-4 hover:text-ink"
                      >
                        Ver los temas de cada curso
                      </button>
                    </>
                  )}
                  {sinResultados && otros && otros.length > 0 && (
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-ink-soft">{resultados.length ? 'Tal cual aparece en otros grados:' : 'Aparece en otros grados:'}</p>
                      <ul className="-mx-3 flex flex-col">
                        {otros.map((r) => (
                          <FilaResultado key={`${r.gradoId}-${r.areaId}-${r.tema}`} r={r} otroGrado elegir={elegir} />
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {!ocupado && (
          <footer className="flex justify-end gap-2 border-t border-line px-6 py-4">
            <Boton variante="suave" onClick={cerrarNuevoTema}>
              Cancelar
            </Boton>
            {elegido && <Boton type="submit">Preparar tema</Boton>}
          </footer>
        )}
      </form>
    </dialog>
  )
}
