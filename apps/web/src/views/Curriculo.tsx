import { BookMarked, ExternalLink, LoaderCircle, Plus, Printer, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useStore } from '../app/store'
import { GRADOS_CURRICULO, NIVELES, areasDe, gradoPorId, nivelDe } from '../curriculo/catalogo'
import { useCurriculo } from '../curriculo/cargar'
import { EncabezadoSeccion } from '../components/Shell'
import { Boton, Hoja, cx, imprimir } from '../components/ui'

/** Documento del Currículo Nacional para un grado y curso, con la lista de cursos del grado al costado. */
export function VisorCurriculo() {
  const { ficha, curriculoAbierto, abrirNuevoTema, avisar } = useStore()
  const [gradoId, setGradoId] = useState(curriculoAbierto?.gradoId ?? ficha?.gradoId ?? 'primaria-4')
  const [areaId, setAreaId] = useState(curriculoAbierto?.areaId ?? ficha?.areaId ?? 'matematica')
  const cur = useCurriculo(nivelDe(gradoId), gradoId, areaId)

  // Al llegar desde otra pantalla ("Ver currículo"), se abre ese documento.
  useEffect(() => {
    if (!curriculoAbierto) return
    setGradoId(curriculoAbierto.gradoId)
    setAreaId(curriculoAbierto.areaId)
  }, [curriculoAbierto])

  const grado = gradoPorId(gradoId)
  // Los cursos salen del documento cuando ya cargó; si no, del catálogo.
  // Se ordenan como en el catálogo (Comunicación, Matemática…); lo que no está en él va al final.
  const orden = areasDe(gradoId).map((a) => a.id)
  const posicion = (id: string) => (orden.includes(id) ? orden.indexOf(id) : orden.length)
  const cursos =
    cur.estado === 'listo'
      ? cur.grado.areas.map((a) => ({ id: a.id, nombre: a.nombre })).sort((a, b) => posicion(a.id) - posicion(b.id))
      : areasDe(gradoId)

  function cambiarGrado(id: string) {
    setGradoId(id)
    if (!areasDe(id).some((a) => a.id === areaId)) setAreaId(areasDe(id)[0].id)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-3 print:hidden">
        <label htmlFor="curriculo-grado" className="flex flex-col gap-1.5">
          <span className="text-sm text-ink-soft">Grado</span>
          <select
            id="curriculo-grado"
            value={gradoId}
            onChange={(e) => cambiarGrado(e.target.value)}
            className="h-11 min-w-56 rounded-xl border-2 border-line bg-surface px-3 font-medium focus:border-ink focus:outline-none"
          >
            {NIVELES.map((n) => (
              <optgroup key={n.id} label={n.nombre}>
                {GRADOS_CURRICULO.filter((g) => g.nivel === n.id).map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nombre}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <Boton variante="contorno" className="ml-auto" onClick={() => imprimir(avisar)}>
          <Printer className="size-5" aria-hidden /> Imprimir
        </Boton>
      </div>

      <div className="grid gap-5 lg:grid-cols-[13rem_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible print:hidden" aria-label="Cursos">
          {cursos.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAreaId(a.id)}
              aria-current={a.id === areaId ? 'true' : undefined}
              className={cx(
                'shrink-0 rounded-xl px-3 py-2 text-left transition',
                a.id === areaId ? 'bg-primary font-semibold text-primary-ink' : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
              )}
            >
              {a.nombre}
            </button>
          ))}
        </nav>

        <Hoja className="min-w-0">
          {cur.estado === 'cargando' ? (
            <p className="flex items-center gap-2 text-ink-soft" role="status">
              <LoaderCircle className="size-5 animate-spin" aria-hidden /> Cargando el currículo…
            </p>
          ) : cur.estado === 'sin-datos' ? (
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-2xl font-bold">Todavía no está disponible</h2>
              <p className="text-ink-soft">Estamos cargando el currículo de {grado?.nombre}. Vuelve en un rato.</p>
            </div>
          ) : !cur.area ? (
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-2xl font-bold">{cursos.find((a) => a.id === areaId)?.nombre ?? 'Este curso'}</h2>
              <p className="text-ink-soft">El programa oficial no trae desempeños de este curso para {grado?.nombre}. Elige otro curso a la izquierda.</p>
            </div>
          ) : (
            <>
              <header className="flex flex-col gap-1">
                <p className="text-sm text-ink-soft">Currículo Nacional · {cur.fuente.titulo}</p>
                <h2 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{cur.area.nombre}</h2>
                <p className="text-lg text-ink-soft">
                  {cur.grado.nombre} · Ciclo {cur.grado.ciclo}
                </p>
                <a
                  href={cur.fuente.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 self-start text-sm text-ink-soft underline underline-offset-4 hover:text-ink print:hidden"
                >
                  Documento oficial del MINEDU (PDF) <ExternalLink className="size-3.5" aria-hidden />
                </a>
              </header>

              <div className="flex gap-3 rounded-xl bg-surface-2 p-4 print:hidden">
                <Sparkles className="mt-0.5 size-5 shrink-0" aria-hidden />
                <p>
                  Cuando creas un tema de <strong>{cur.area.nombre}</strong> para <strong>{grado?.corto}</strong>, Supermentes parte de estas
                  competencias y desempeños para preparar la sesión, los ejercicios y los juegos, y para elegir las canciones.
                </p>
              </div>

              {cur.area.temas.length > 0 && (
                <section className="flex flex-col gap-2 print:hidden">
                  <h3 className="text-lg font-semibold">Temas de este grado</h3>
                  <p className="-mt-1 text-sm text-ink-soft">Resumen a partir de los desempeños (no es texto oficial). Toca uno para crear un tema.</p>
                  <div className="flex flex-wrap gap-2">
                    {cur.area.temas.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => abrirNuevoTema({ texto: t, gradoId, areaId })}
                        className="inline-flex items-center gap-1.5 rounded-full border-2 border-line px-3.5 py-1.5 hover:border-ink"
                      >
                        <Plus className="size-4" aria-hidden /> {t}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <div className="flex flex-col gap-8">
                {cur.area.competencias.map((c, i) => (
                  <section key={c.nombre} className="flex flex-col gap-3 border-t border-line pt-6">
                    <p className="text-sm font-semibold text-ink-soft">Competencia {i + 1}</p>
                    <h3 className="-mt-2 text-2xl font-semibold leading-snug">{c.nombre}</h3>
                    {/amada por Dios/i.test(c.nombre) && (
                      <p className="-mt-1 text-sm text-ink-soft">
                        Competencia de educación religiosa. El programa oficial respeta el derecho de las familias a exonerarse de ella.
                      </p>
                    )}

                    {c.temas && c.temas.length > 0 && (
                      <div className="flex flex-col gap-1.5 print:hidden">
                        <p className="text-sm text-ink-soft">Temas que trabaja, como suelen llamarse en libros y sesiones (no es texto oficial):</p>
                        <div className="flex flex-wrap gap-2">
                          {c.temas.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => abrirNuevoTema({ texto: t, gradoId, areaId, indiceCompetencia: i })}
                              className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-sm hover:border-ink"
                            >
                              <Plus className="size-3.5" aria-hidden /> {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* En pantallas anchas: capacidades y estándar a la izquierda, desempeños a la derecha. */}
                    <div className="grid gap-x-8 gap-y-3 xl:grid-cols-2">
                      <div className="flex flex-col gap-3">
                        {c.capacidades.length > 0 && (
                          <div className="flex flex-col gap-1">
                            <h4 className="font-semibold">Capacidades</h4>
                            <ul className="flex flex-col gap-1">
                              {c.capacidades.map((cap) => (
                                <li key={cap} className="flex gap-2">
                                  <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-ink" aria-hidden />
                                  {cap}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {c.estandar && (
                          <div className="flex flex-col gap-1">
                            <h4 className="font-semibold">Estándar de aprendizaje del ciclo {cur.grado.ciclo}</h4>
                            <blockquote className="border-l-4 border-line pl-4 text-ink-soft">{c.estandar}</blockquote>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        <h4 className="font-semibold">Desempeños de {grado?.corto}</h4>
                        {c.desempenos.length === 0 && <p className="text-ink-soft">El programa oficial indica que en esta edad no se evidencian desempeños.</p>}
                        <ul className="flex flex-col gap-2">
                          {c.desempenos.map((d) => (
                            <li key={d} className="flex gap-2.5">
                              <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-ink" aria-hidden />
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            </>
          )}
        </Hoja>
      </div>
    </div>
  )
}

/** La sección «Currículo nacional» del menú: el documento oficial del grado y curso, abierto en los del tema. */
export function CurriculoNacional() {
  return (
    <>
      <EncabezadoSeccion icono={BookMarked} titulo="Currículo nacional">
        Competencias, capacidades y desempeños de cada grado y curso, copiados tal cual de los programas del MINEDU.
      </EncabezadoSeccion>
      <VisorCurriculo />
    </>
  )
}
