// Más recursos: material real que ya existe en internet, para leer, imprimir o consultar. Nada inventado: se enlaza
// la fuente original. Arriba, los videos y fichas del tema (api/recursos.ts, buscados en internet); debajo, el
// catálogo de libros, exámenes, guías y normas oficiales (recursos/recursos.json), filtrado por el grado y curso del tema.
import { ExternalLink, FileDown, Library, SearchX } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../app/store'
import { EncabezadoSeccion } from '../components/Shell'
import { Chip, cx } from '../components/ui'
import { GRADOS_DOCENTE, areasDe } from '../curriculo/catalogo'
import { ORDEN_TIPOS, TIPOS, filtrar, useRecursos, type RecursoOficial, type TipoRecurso } from '../recursos/catalogo'
import { RecursosDelTema } from './RecursosDelTema'

const campo = 'h-11 rounded-xl border-2 border-line bg-surface px-3 font-medium focus:border-ink focus:outline-none'

const fecha = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })

function TarjetaRecurso({ r }: { r: RecursoOficial }) {
  const t = TIPOS[r.tipo]
  const Icono = t.icono
  return (
    <li className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
        <Icono className="size-4" aria-hidden /> {t.nombre} · {r.fuente}
        {r.anio ? ` · ${r.anio}` : ''}
      </p>
      <h3 className="font-semibold leading-snug [overflow-wrap:anywhere]">{r.titulo}</h3>
      {r.subtitulo && <p className="line-clamp-3 text-sm text-ink-soft">{r.subtitulo}</p>}
      <p className="text-sm">{r.descripcion}</p>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
        <a
          href={r.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-ink hover:opacity-90"
        >
          <ExternalLink className="size-4" aria-hidden /> Abrir
        </a>
        {r.pdf && r.pdf !== r.url && (
          <a href={r.pdf} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-semibold hover:bg-surface-2">
            <FileDown className="size-4" aria-hidden /> PDF
          </a>
        )}
        <span className="ml-auto text-xs text-ink-soft">Revisado el {fecha(r.verificado)}</span>
      </div>
    </li>
  )
}

function Catalogo() {
  const { ficha } = useStore()
  const todos = useRecursos()
  const [gradoId, setGradoId] = useState(ficha?.gradoId ?? '')
  const [areaId, setAreaId] = useState(ficha?.areaId ?? '')
  const [tipo, setTipo] = useState<TipoRecurso | null>(null)
  if (!todos) return null

  const cursos = gradoId ? areasDe(gradoId) : areasDe('primaria-1')
  const lista = filtrar(todos, gradoId, areaId, tipo)
  const hay = (t: TipoRecurso) => filtrar(todos, gradoId, areaId, t).length > 0

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Libros, exámenes y normas oficiales</h2>
        <p className="text-ink-soft">Del MINEDU y otras fuentes oficiales. Se abren en su página original.</p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label htmlFor="recursos-grado" className="flex flex-col gap-1.5">
          <span className="text-sm text-ink-soft">Grado</span>
          <select id="recursos-grado" value={gradoId} onChange={(e) => setGradoId(e.target.value)} className={campo}>
            <option value="">Todos los grados</option>
            {GRADOS_DOCENTE.map((g) => (
              <option key={g.id} value={g.id}>
                {g.corto}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="recursos-curso" className="flex flex-col gap-1.5">
          <span className="text-sm text-ink-soft">Curso</span>
          <select id="recursos-curso" value={areaId} onChange={(e) => setAreaId(e.target.value)} className={campo}>
            <option value="">Todos los cursos</option>
            {cursos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <Chip activo={!tipo} onClick={() => setTipo(null)}>
          Todo
        </Chip>
        {ORDEN_TIPOS.filter(hay).map((t) => (
          <Chip key={t} activo={tipo === t} onClick={() => setTipo(t)}>
            {TIPOS[t].plural}
          </Chip>
        ))}
      </div>
      {lista.length ? (
        <ul className={cx('grid gap-3 sm:grid-cols-2 xl:grid-cols-3')}>
          {lista.map((r) => (
            <TarjetaRecurso key={r.url} r={r} />
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-2 rounded-2xl border border-dashed border-line px-5 py-4 text-ink-soft">
          <SearchX className="size-5 shrink-0" aria-hidden /> No tenemos material oficial con esos filtros. Prueba con «Todos los cursos».
        </p>
      )}
    </section>
  )
}

export function Recursos() {
  const { ficha } = useStore()
  return (
    <>
      <EncabezadoSeccion icono={Library} titulo="Más recursos">
        Material que ya existe en internet: libros, exámenes, normas y fichas, con el enlace a su fuente.
      </EncabezadoSeccion>
      {ficha && <RecursosDelTema ficha={ficha} />}
      <Catalogo />
    </>
  )
}
