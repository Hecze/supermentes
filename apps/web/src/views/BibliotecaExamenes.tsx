// La biblioteca de exámenes listos: un examen por cada tema de los grados con banco (hoy, 4.º de primaria), para
// encontrarlo por curso o por nombre y abrirlo con un clic. Al abrirlo, el tema se crea al instante y se va directo
// a su examen.
import { ChevronRight, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../app/store'
import { cargarBanco, tieneBanco, type TemaBanco } from '../banco/banco'
import { Chip, cx } from '../components/ui'
import { normalizar } from '../curriculo/buscar'
import { areasDe, gradoPorId } from '../curriculo/catalogo'
import { cantidadesPorDefecto } from '../examenes/armar'
import { tiposDelTema } from '../examenes/catalogo'

const GRADO = 'primaria-4'
const COLOR = 'var(--examen)'

type Fila = { areaId: string; area: string; t: TemaBanco; retos: number; conDibujos: boolean }

export function BibliotecaExamenes() {
  const { abrirNuevoTema } = useStore()
  const areas = useMemo(() => areasDe(GRADO).filter((a) => tieneBanco(GRADO, a.id)), [])
  const [filas, setFilas] = useState<Fila[] | null>(null)
  const [area, setArea] = useState<string | null>(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    let vivo = true
    Promise.all(areas.map(async (a) => ({ a, temas: (await cargarBanco(GRADO, a.id)) ?? [] }))).then((r) => {
      if (!vivo) return
      setFilas(
        r.flatMap(({ a, temas }) =>
          temas.map((t) => {
            const tipos = tiposDelTema(GRADO, a.id, t.tema, t)
            const retos = [...cantidadesPorDefecto(tipos).values()].reduce((s, n) => s + n, 0)
            return { areaId: a.id, area: a.nombre, t, retos, conDibujos: tipos.some((x) => x.cambia === 'numeros') }
          }),
        ),
      )
    })
    return () => {
      vivo = false
    }
  }, [areas])

  const palabras = normalizar(q).split(/\s+/).filter(Boolean)
  const visibles = (filas ?? []).filter((f) => (!area || f.areaId === area) && palabras.every((p) => normalizar(f.t.tema).includes(p)))
  const porArea = areas.map((a) => ({ a, lista: visibles.filter((f) => f.areaId === a.id) })).filter((g) => g.lista.length)
  const cuantos = (id: string) => filas?.filter((f) => f.areaId === id).length ?? 0

  return (
    <>
      <p className="-mt-2 max-w-3xl text-lg text-ink-soft">
        Un examen listo por cada tema de {gradoPorId(GRADO)?.nombre}, gratis y para imprimir en blanco y negro, con su hoja de respuestas. Con «Otra
        versión» salen las mismas preguntas con otros números y otras respuestas.
      </p>

      <div className="flex flex-col gap-3">
        <label htmlFor="bib-examen-buscar" className="relative max-w-xl">
          <span className="sr-only">Buscar un tema</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-ink-soft" aria-hidden />
          <input
            id="bib-examen-buscar"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Busca un tema: fracciones, los refranes, el ciclo del agua…"
            className="h-12 w-full rounded-2xl border-2 border-line bg-surface pl-10 pr-3 text-lg focus:border-ink focus:outline-none"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Chip activo={!area} color={COLOR} onClick={() => setArea(null)}>
            Todos los cursos {filas && `(${filas.length})`}
          </Chip>
          {areas.map((a) => (
            <Chip key={a.id} activo={area === a.id} color={COLOR} onClick={() => setArea(area === a.id ? null : a.id)}>
              {a.nombre} {filas && `(${cuantos(a.id)})`}
            </Chip>
          ))}
        </div>
      </div>

      {!filas ? (
        <p className="text-ink-soft" role="status">
          Cargando los exámenes…
        </p>
      ) : !visibles.length ? (
        <p className="text-lg text-ink-soft">No encontramos «{q.trim()}». Prueba con otra palabra o elige otro curso.</p>
      ) : (
        porArea.map(({ a, lista }) => (
          <section key={a.id} className="flex flex-col gap-3">
            <h2 className="font-display text-2xl font-bold">
              {a.nombre} <span className="text-lg font-normal text-ink-soft">· {lista.length} exámenes</span>
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {lista.map((f) => (
                <li key={f.t.tema}>
                  <button
                    type="button"
                    onClick={() => abrirNuevoTema({ texto: f.t.tema, gradoId: GRADO, areaId: f.areaId, indiceCompetencia: f.t.competencia - 1, destino: 'examen' })}
                    className="group flex h-full w-full items-center gap-3 rounded-2xl border-2 border-line bg-surface p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="text-lg font-semibold leading-snug">{f.t.tema}</span>
                      <span className={cx('text-ink-soft', f.conDibujos && 'font-medium')} style={f.conDibujos ? { color: COLOR } : undefined}>
                        {f.retos} retos{f.conDibujos ? ' · con dibujos y números que cambian' : ''}
                      </span>
                    </span>
                    <ChevronRight className="size-5 shrink-0 text-ink-soft transition group-hover:translate-x-0.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  )
}
