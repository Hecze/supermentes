// Más recursos: material real que ya existe en internet, para leer, imprimir o consultar. Nada inventado: se enlaza
// la fuente original. Libros, fichas, exámenes, guías y normas oficiales (recursos/recursos.json), por pestañas y
// con la portada de cada PDF; abre en la más visual (libros). Debajo, los videos y fichas del tema que se buscan en
// internet (api/recursos.ts).
import { FileDown, Library, SearchX } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../app/store'
import { EncabezadoSeccion } from '../components/Shell'
import { Chip, cx } from '../components/ui'
import { GRADOS_CURRICULO, areasDe } from '../curriculo/catalogo'
import { ORDEN_TIPOS, TIPOS, afinidad, filtrar, useRecursos, type RecursoOficial, type TipoRecurso } from '../recursos/catalogo'
import { RecursosDelTema } from './RecursosDelTema'

const campo = 'h-11 rounded-xl border-2 border-line bg-surface px-3 font-medium focus:border-ink focus:outline-none'

/** La primera página del PDF, como la tapa de un libro en una tienda. Sin miniatura, el icono del tipo. */
function Tapa({ r }: { r: RecursoOficial }) {
  const Icono = TIPOS[r.tipo].icono
  return (
    <span className="relative grid aspect-[3/4] w-full place-items-center overflow-hidden rounded-xl border border-line bg-white shadow-sm transition group-hover:-translate-y-0.5 group-hover:shadow-md">
      {r.portada ? <img src={r.portada} alt="" loading="lazy" className="size-full object-contain" /> : <Icono className="size-10 text-ink-soft" aria-hidden />}
    </span>
  )
}

const meta = (r: RecursoOficial) => [r.fuente.replace(' · Refuerzo Escolar', ''), r.anio].filter(Boolean).join(' · ')

/** Archivos que van juntos (la prueba con su registro y su manual; las fichas de un tema): botones chicos. */
function Partes({ partes, corto }: { partes: NonNullable<RecursoOficial['partes']>; corto?: (nombre: string) => string }) {
  return (
    <span className={cx('flex flex-wrap', corto ? 'gap-1' : 'gap-1.5')}>
      {partes.map((p) => (
        <a
          key={p.url}
          href={p.url}
          target="_blank"
          rel="noreferrer"
          title={p.detalle}
          className={cx(
            'inline-flex h-8 items-center gap-1 rounded-lg border border-line bg-surface text-xs font-semibold hover:bg-surface-2',
            corto ? 'px-1.5' : 'px-2',
          )}
        >
          {corto ? corto(p.nombre) : p.nombre}
        </a>
      ))}
    </span>
  )
}

const nivelCorto = (n: string) => n.replace('En inicio', 'Inicio').replace('En proceso', 'Proceso').replace('Logro esperado', 'Logro')

/** Libros, guías, exámenes y fichas: la tapa manda; debajo, el título y quién lo publica. La tapa abre el PDF. */
function TarjetaTapa({ r, delTema }: { r: RecursoOficial; delTema?: boolean }) {
  const fichas = r.tipo === 'teoria'
  const partes = r.partes && (fichas || r.partes.length > 1) ? r.partes : null
  return (
    <li className="flex flex-col gap-2">
      <a href={r.url} target="_blank" rel="noreferrer" title={r.descripcion} className="group flex flex-col gap-2">
        <Tapa r={r} />
        <span className="line-clamp-2 text-sm font-semibold leading-snug [overflow-wrap:anywhere]">
          {delTema && <span className="mr-1 rounded bg-marker px-1 text-ink">De tu tema</span>}
          {r.titulo}
        </span>
      </a>
      {!fichas && <span className="-mt-1 text-xs text-ink-soft">{meta(r)}</span>}
      {partes && <Partes partes={partes} corto={fichas ? nivelCorto : undefined} />}
    </li>
  )
}

/** Normas: su primera página es texto, así que van en lista, sin tapa. */
function FilaNorma({ r }: { r: RecursoOficial }) {
  return (
    <li>
      <a href={r.pdf ?? r.url} target="_blank" rel="noreferrer" title={r.descripcion} className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-surface-2">
        <FileDown className="mt-0.5 size-5 shrink-0 text-ink-soft" aria-hidden />
        <span className="min-w-0">
          <span className="font-semibold">{r.titulo}</span>
          {r.subtitulo && <span className="line-clamp-1 text-sm text-ink-soft">{r.subtitulo}</span>}
        </span>
      </a>
    </li>
  )
}

function Catalogo() {
  const { ficha } = useStore()
  const todos = useRecursos()
  const [gradoId, setGradoId] = useState(ficha?.gradoId ?? '')
  const [areaId, setAreaId] = useState(ficha?.areaId ?? '')
  const [elegido, setElegido] = useState<TipoRecurso>('libro')
  if (!todos) return null

  const cursos = gradoId ? areasDe(gradoId) : areasDe('primaria-1')
  // El tema del docente ordena primero sus fichas, solo si se miran su grado y curso.
  const tema = ficha && gradoId === ficha.gradoId && areaId === ficha.areaId ? ficha.titulo : ''
  const pestanas = ORDEN_TIPOS.map((t) => ({ t, n: filtrar(todos, gradoId, areaId, t).length })).filter((p) => p.n)
  // Si con estos filtros no hay de lo elegido, se abre la primera pestaña que tenga algo.
  const tipo = pestanas.some((p) => p.t === elegido) ? elegido : pestanas[0]?.t
  const lista = tipo ? filtrar(todos, gradoId, areaId, tipo, tema) : []

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-3">
        <label htmlFor="recursos-grado" className="flex flex-col gap-1.5">
          <span className="text-sm text-ink-soft">Grado</span>
          <select id="recursos-grado" value={gradoId} onChange={(e) => setGradoId(e.target.value)} className={campo}>
            <option value="">Todos los grados</option>
            {GRADOS_CURRICULO.map((g) => (
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
      <div className="flex flex-wrap gap-2" aria-label="Tipo de recurso">
        {pestanas.map(({ t, n }) => (
          <Chip key={t} activo={tipo === t} onClick={() => setElegido(t)}>
            {TIPOS[t].plural} <span className="opacity-60">{n}</span>
          </Chip>
        ))}
      </div>
      {!tipo ? (
        <p className="flex items-center gap-2 rounded-2xl border border-dashed border-line px-5 py-4 text-ink-soft">
          <SearchX className="size-5 shrink-0" aria-hidden /> No tenemos material oficial con esos filtros. Prueba con «Todos los cursos».
        </p>
      ) : tipo === 'norma' ? (
        <ul className="flex max-w-3xl flex-col">
          {lista.map((r) => (
            <FilaNorma key={r.url} r={r} />
          ))}
        </ul>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {lista.map((r) => (
            <TarjetaTapa key={r.url} r={r} delTema={!!tema && afinidad(r, tema) >= 0.5} />
          ))}
        </ul>
      )}
    </section>
  )
}

export function Recursos() {
  const { ficha } = useStore()
  return (
    <>
      <EncabezadoSeccion icono={Library} titulo="Más recursos">
        Libros, fichas, exámenes y normas oficiales del MINEDU. Se abren en su fuente.
      </EncabezadoSeccion>
      <Catalogo />
      {ficha && <RecursosDelTema ficha={ficha} />}
    </>
  )
}
