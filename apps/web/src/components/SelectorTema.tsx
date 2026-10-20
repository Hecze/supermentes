import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { claveTema, useAbrirTema } from '../app/abrirTema'
import { useColegios } from '../app/perfil'
import { useStore } from '../app/store'
import { coincide, temasPorCurso, type Resultado, type TemasDelCurso } from '../curriculo/buscar'
import { useGrados } from '../curriculo/cargar'
import { GRADOS_CURRICULO } from '../curriculo/catalogo'
import { cx } from './ui'

const NOMBRES = Object.fromEntries(GRADOS_CURRICULO.map((g) => [g.id, g.corto]))

type TemasDelGrado = { gradoId: string; grado: string; cursos: TemasDelCurso[] }

/** Todos los temas de lo que enseña (los grados y cursos de cada colegio de "Mi perfil"): por grado y, dentro, por curso. */
function useTemasDelPerfil(): TemasDelGrado[] | null {
  const colegios = useColegios()
  const ids = GRADOS_CURRICULO.filter((g) => colegios.some((c) => c.grados.includes(g.id))).map((g) => g.id)
  const grados = useGrados(ids)
  return useMemo(() => {
    if (!grados) return null
    const porGrado = grados.map((g) => {
      const vistos = new Set<string>()
      const cursos = colegios
        .filter((c) => c.grados.includes(g.id))
        .flatMap((c) => temasPorCurso([g], c.cursos, NOMBRES))
        .filter((x) => !vistos.has(x.cursoId) && vistos.add(x.cursoId))
      return { gradoId: g.id, grado: NOMBRES[g.id] ?? g.id, cursos }
    })
    return porGrado.filter((g) => g.cursos.length)
  }, [grados, colegios])
}

/** Solo los temas que coinciden con lo escrito; sin nada escrito, todos. */
function filtrar(grados: TemasDelGrado[], q: string): TemasDelGrado[] {
  if (!q.trim()) return grados
  return grados
    .map((g) => ({ ...g, cursos: g.cursos.map((c) => ({ ...c, temas: c.temas.filter((t) => coincide(q, t.tema)) })).filter((c) => c.temas.length) }))
    .filter((g) => g.cursos.length)
}

function ListaTemas({ grados, actual, elegir }: { grados: TemasDelGrado[]; actual: string; elegir: (t: Resultado) => void }) {
  return grados.map((g) => (
    <div key={g.gradoId} role="group" aria-label={g.grado}>
      <p className="sticky top-0 z-10 flex h-9 items-center border-y border-line bg-surface-2 px-4 text-sm font-bold">{g.grado}</p>
      {g.cursos.map((c) => (
        <div key={c.cursoId} role="group" aria-label={`${c.curso}, ${g.grado}`}>
          <p className="sticky top-9 bg-surface px-4 pb-1 pt-3 text-xs font-bold tracking-wide text-ink-soft">{c.curso.toUpperCase()}</p>
          {c.temas.map((t) => {
            const k = claveTema(t.gradoId, t.areaId, t.tema)
            return (
              <button
                key={k}
                type="button"
                role="option"
                aria-selected={k === actual}
                onClick={() => elegir(t)}
                className="flex w-full items-start gap-2 px-4 py-2 text-left leading-snug hover:bg-surface-2"
              >
                <span className={cx('min-w-0 flex-1', k === actual && 'font-semibold')}>{t.tema}</span>
                {k === actual && <Check className="mt-0.5 size-4 shrink-0" aria-hidden />}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  ))
}

/**
 * Muestra el tema actual. Al abrirlo lista todos los temas del currículo de los grados y cursos de "Mi perfil" (por
 * grado y luego por curso), con un buscador arriba; el que ya se abrió vuelve con lo que tenía y el nuevo se crea al
 * instante. Para un grado o curso que no enseña (suplir a otro profe), "Buscar en otro grado o curso".
 */
export function SelectorTema({ compacto }: { compacto?: boolean }) {
  const { ficha, abrirNuevoTema } = useStore()
  const abrirTema = useAbrirTema()
  const [abierto, setAbierto] = useState(false)
  const [q, setQ] = useState('')
  const caja = useRef<HTMLDivElement>(null)
  const lista = useRef<HTMLDivElement>(null)
  const grados = useTemasDelPerfil()
  const visibles = useMemo(() => filtrar(grados ?? [], q), [grados, q])

  // Abre con el tema actual a la vista.
  useEffect(() => {
    const l = lista.current
    const el = l?.querySelector<HTMLElement>('[aria-selected="true"]')
    if (abierto && l && el) l.scrollTop = el.offsetTop - l.clientHeight / 2
  }, [abierto, grados])

  useEffect(() => {
    if (!abierto) return
    setQ('')
    const fuera = (e: MouseEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false)
    }
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false)
    document.addEventListener('mousedown', fuera)
    document.addEventListener('keydown', tecla)
    return () => {
      document.removeEventListener('mousedown', fuera)
      document.removeEventListener('keydown', tecla)
    }
  }, [abierto])

  if (!ficha) {
    return (
      <button
        type="button"
        onClick={() => abrirNuevoTema()}
        className={cx(
          'flex items-center gap-2 rounded-xl border-2 border-dashed border-line text-left font-medium hover:border-ink-soft',
          compacto ? 'h-10 px-3' : 'px-3 py-3',
        )}
      >
        <Search className="size-5" aria-hidden /> Buscar mi primer tema
      </button>
    )
  }

  function elegir(t: Resultado) {
    setAbierto(false)
    void abrirTema(t)
  }

  return (
    <div ref={caja} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        aria-expanded={abierto}
        aria-haspopup="listbox"
        className={cx(
          'flex w-full items-center gap-2 rounded-xl text-left transition',
          compacto ? 'h-10 px-2 hover:bg-surface-2' : 'border-2 px-3 py-2.5',
          !compacto && (abierto ? 'border-ink' : 'border-line hover:border-ink-soft'),
        )}
      >
        <span className="flex min-w-0 flex-1 flex-col">
          {!compacto && <span className="text-xs text-ink-soft">Tema</span>}
          <span className={cx('font-semibold leading-snug', compacto ? 'truncate' : 'line-clamp-2')}>{ficha.titulo}</span>
          {!compacto && <span className="text-sm text-ink-soft">{ficha.grado}</span>}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-ink-soft" aria-hidden />
      </button>

      {abierto && (
        <div
          className={cx(
            'absolute z-50 mt-2 flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-xl',
            compacto ? 'left-0 w-[min(22rem,calc(100vw-2rem))]' : 'inset-x-0',
          )}
        >
          <label className="relative m-2">
            <span className="sr-only">Buscar entre tus temas</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" aria-hidden />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar entre tus temas"
              autoComplete="off"
              className="h-10 w-full rounded-xl border-2 border-line bg-surface pl-9 pr-3 focus:border-ink focus:outline-none"
            />
          </label>

          <div ref={lista} role="listbox" aria-label="Tus temas" className="relative max-h-[min(60dvh,28rem)] overflow-y-auto pb-1">
            {!grados && <p className="px-4 py-3 text-sm text-ink-soft">Cargando el currículo…</p>}
            {grados && !visibles.length && <p className="px-4 py-3 text-sm text-ink-soft">No está entre tus temas. Búscalo en otro grado o curso.</p>}
            <ListaTemas grados={visibles} actual={claveTema(ficha.gradoId, ficha.areaId, ficha.titulo)} elegir={elegir} />
          </div>

          <button
            type="button"
            onClick={() => {
              setAbierto(false)
              abrirNuevoTema()
            }}
            className="flex items-center gap-2 border-t border-line px-4 py-3 text-left font-semibold hover:bg-surface-2"
          >
            <Search className="size-5" aria-hidden /> Buscar en otro grado o curso
          </button>
        </div>
      )}
    </div>
  )
}
