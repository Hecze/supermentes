import { Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { colegioActivo, colegiosGuardados, elegirColegioActivo, ensenanzaGuardada, ensenanzaValida } from '../app/perfil'
import { useStore, type Vista } from '../app/store'
import { fichaDeResultado } from '../app/temaInstantaneo'
import { buscarEnGrado, buscarEnTodos, esDelCurso, normalizar, sugerenciasPara, type Resultado } from '../curriculo/buscar'
import { GRADOS_DOCENTE, areaPorId, nivelDe, nombreCursos, nombreGrados, type Nivel } from '../curriculo/catalogo'
import { cargarNivel, type GradoCurriculo } from '../curriculo/cargar'
import { FiltroCursos, FiltroGrados } from './GradosCursos'
import { cx } from './ui'

const NOMBRES = Object.fromEntries(GRADOS_DOCENTE.map((g) => [g.id, g.corto]))
const MAXIMO = 8

/** El currículo de los grados elegidos (cada nivel se descarga una vez). */
function useGrados(ids: string[]): GradoCurriculo[] | null {
  const [porId, setPorId] = useState<Record<string, GradoCurriculo>>({})
  const niveles = [...new Set(ids.map(nivelDe))].sort().join(',')
  useEffect(() => {
    let vivo = true
    void Promise.all((niveles ? (niveles.split(',') as Nivel[]) : []).map(cargarNivel)).then((datos) => {
      if (vivo) setPorId(Object.fromEntries(datos.flatMap((d) => d?.grados ?? []).map((g) => [g.id, g])))
    })
    return () => {
      vivo = false
    }
  }, [niveles])
  const grados = ids.map((id) => porId[id]).filter(Boolean)
  return grados.length === ids.length ? grados : null
}

/** Con varios grados, los resultados se turnan (el mejor de cada grado primero) para que ninguno quede tapado. */
function turnar(rs: Resultado[]): Resultado[] {
  const grupos = new Map<string, Resultado[]>()
  for (const r of rs) grupos.set(r.gradoId, [...(grupos.get(r.gradoId) ?? []), r])
  const listas = [...grupos.values()]
  const res: Resultado[] = []
  for (let i = 0; res.length < rs.length; i++) for (const l of listas) if (l[i]) res.push(l[i])
  return res
}

/** Las palabras que coinciden con lo escrito van en negrita, como en un buscador. */
function Resaltado({ texto, q }: { texto: string; q: string }) {
  const buscadas = normalizar(q).split(/[^a-z0-9]+/).filter((p) => p.length > 1)
  const partes: ReactNode[] = texto.split(/(\s+)/).map((p, i) => {
    const n = normalizar(p)
    return buscadas.some((b) => n.startsWith(b)) ? (
      <strong key={i} className="font-semibold text-ink">
        {p}
      </strong>
    ) : (
      p
    )
  })
  return <>{partes}</>
}

/**
 * Buscar un tema: un solo buscador, como el de YouTube. Mientras se escribe aparecen temas del Currículo Nacional
 * y con un clic el tema queda creado. No hay que esperar a la IA: la ficha se completa después (temaInstantaneo.ts).
 * Busca en los grados y cursos de su colegio (de "Mi perfil"; si enseña en varios, elige el colegio con un clic). Los
 * filtros son para los imprevistos (suplir a otro profe) y no cambian el perfil.
 */
export function NuevoTema() {
  const { nuevoTemaAbierto, previoTema, cerrarNuevoTema, setFicha, completarFicha, ir } = useStore()
  const dialogo = useRef<HTMLDialogElement>(null)
  const buscador = useRef<HTMLInputElement>(null)
  const [filtro, setFiltro] = useState(ensenanzaGuardada)
  const [q, setQ] = useState('')
  const [activo, setActivo] = useState(0)
  const [otros, setOtros] = useState<Resultado[]>([])

  const [colegios, setColegios] = useState(colegiosGuardados)
  const [colegio, setColegio] = useState<number | null>(colegioActivo)

  const grados = useGrados(filtro.grados)
  const porId = Object.fromEntries((grados ?? []).map((g) => [g.id, g]))
  const enFiltro = (r: Resultado) =>
    filtro.grados.includes(r.gradoId) && (!filtro.cursos.length || filtro.cursos.some((c) => esDelCurso(porId[r.gradoId], r, c)))
  const variosGrados = filtro.grados.length > 1
  // Los cursos propios de un privado se ofrecen si el colegio es privado (o, filtrando a mano, si tiene alguno privado).
  const tipo = (colegio !== null ? colegios[colegio]?.tipo : colegios.some((c) => c.tipo === 'privado') ? 'privado' : 'publico') ?? 'publico'

  function usarColegio(i: number) {
    const c = colegios[i]
    if (!c) return
    setColegio(i)
    setFiltro({ grados: c.grados, cursos: c.cursos })
    elegirColegioActivo(i)
  }

  async function crear(r: Resultado, destino: Vista = 'ficha') {
    const nueva = await fichaDeResultado(r)
    if (!nueva) return
    setFicha(nueva)
    cerrarNuevoTema()
    ir(destino)
    completarFicha(nueva)
  }

  useEffect(() => {
    const d = dialogo.current
    if (!d) return
    if (nuevoTemaAbierto && previoTema?.texto && previoTema.areaId) {
      // Desde el currículo ya viene el tema: se crea directo, sin mostrar el buscador.
      const g = previoTema.gradoId ?? ensenanzaGuardada().grados[0]
      void crear({
        tema: previoTema.texto,
        gradoId: g,
        grado: NOMBRES[g] ?? g,
        areaId: previoTema.areaId,
        area: areaPorId(g, previoTema.areaId)?.nombre ?? previoTema.areaId,
        indiceCompetencia: previoTema.indiceCompetencia,
      }, previoTema.destino)
      return
    }
    if (nuevoTemaAbierto && !d.open) {
      // Cada vez abre con lo que enseña en su colegio; si viene de otro grado (p. ej. del currículo), con ese grado.
      const perfil = ensenanzaGuardada()
      const g = previoTema?.gradoId
      const otroGrado = g && !perfil.grados.includes(g) ? ensenanzaValida({ grados: [g], cursos: [] }) : null
      setColegios(colegiosGuardados())
      setColegio(otroGrado ? null : colegioActivo())
      setFiltro(otroGrado ?? perfil)
      setQ('')
      setActivo(0)
      d.showModal()
      buscador.current?.focus()
    }
    if (!nuevoTemaAbierto && d.open) d.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nuevoTemaAbierto, previoTema])

  const propios = useMemo(
    () =>
      grados && q.trim()
        ? grados.flatMap((g) => buscarEnGrado(g, NOMBRES[g.id] ?? g.id, q).filter((r) => !filtro.cursos.length || filtro.cursos.some((c) => esDelCurso(g, r, c))))
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [grados, filtro, q],
  )
  const exactos = propios.filter((r) => !r.parcial && !r.cita)

  // Si en sus grados y cursos hay pocos temas con ese nombre, se suman los de otros grados y cursos.
  useEffect(() => {
    setOtros([])
    if (q.trim().length < 3 || exactos.length >= 3) return
    let vivo = true
    const t = window.setTimeout(() => void buscarEnTodos(q, NOMBRES).then((r) => vivo && setOtros(r.filter((x) => !enFiltro(x)).slice(0, 4))), 200)
    return () => {
      vivo = false
      window.clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, filtro, exactos.length])

  const sugerencias = useMemo(() => {
    if (!grados) return []
    if (!q.trim()) return sugerenciasPara(grados, filtro.cursos, NOMBRES, MAXIMO)
    const vistos = new Set<string>()
    return [...turnar(exactos), ...otros, ...turnar(propios.filter((r) => !r.parcial && r.cita)), ...turnar(propios.filter((r) => r.parcial))]
      .filter((r) => {
        const k = `${r.gradoId}|${r.areaId}|${normalizar(r.tema)}`
        if (vistos.has(k)) return false
        vistos.add(k)
        return true
      })
      .slice(0, MAXIMO)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grados, q, propios, otros])

  useEffect(() => setActivo(0), [q, filtro])

  const perfil = colegio !== null ? colegios[colegio] : undefined
  const esPerfil = !!perfil && perfil.grados.join() === filtro.grados.join() && perfil.cursos.join() === filtro.cursos.join()

  function teclas(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActivo((a) => Math.min(sugerencias.length - 1, a + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActivo((a) => Math.max(0, a - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const r = sugerencias[activo] ?? sugerencias[0]
      if (r) void crear(r)
    }
  }

  return (
    <dialog
      ref={dialogo}
      onClose={cerrarNuevoTema}
      onClick={(e) => e.target === dialogo.current && cerrarNuevoTema()}
      aria-labelledby="nuevo-tema-titulo"
      className="mx-auto mb-auto mt-[8dvh] w-[min(42rem,calc(100vw-2rem))] overflow-visible rounded-3xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/45"
    >
      <div className="flex flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 id="nuevo-tema-titulo" className="font-display text-xl font-bold sm:text-2xl">
            ¿Qué tema vas a enseñar?
          </h2>
          <button type="button" onClick={cerrarNuevoTema} className="rounded-lg p-1.5 text-ink-soft hover:bg-surface-2 hover:text-ink" aria-label="Cerrar">
            <X className="size-5" />
          </button>
        </div>

        <label htmlFor="nuevo-tema-buscar" className="relative min-w-0">
          <span className="sr-only">Buscar tema</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-ink-soft" aria-hidden />
          <input
            id="nuevo-tema-buscar"
            ref={buscador}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={teclas}
            placeholder="Fracciones, ciclo del agua, sustantivos…"
            autoComplete="off"
            role="combobox"
            aria-expanded={sugerencias.length > 0}
            aria-controls="nuevo-tema-sugerencias"
            aria-activedescendant={sugerencias.length ? `sugerencia-${activo}` : undefined}
            className="h-13 w-full rounded-2xl border-2 border-line bg-surface pl-11 pr-4 text-lg focus:border-ink focus:outline-none"
          />
        </label>

        {colegios.length > 1 && (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Colegio">
            {colegios.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => usarColegio(i)}
                aria-pressed={colegio === i}
                className={cx(
                  'h-10 max-w-full cursor-pointer truncate rounded-full border-2 px-4 text-sm font-semibold transition',
                  colegio === i ? 'border-primary bg-primary text-primary-ink' : 'border-line bg-surface hover:border-ink-soft',
                )}
              >
                {c.nombre || `Colegio ${i + 1}`}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <FiltroGrados
            valor={filtro.grados}
            onChange={(g) => {
              if (!g.length) return
              setColegio(null)
              setFiltro(ensenanzaValida({ grados: g, cursos: filtro.cursos }) ?? filtro)
            }}
          />
          <FiltroCursos
            grados={filtro.grados}
            tipo={tipo}
            valor={filtro.cursos}
            onChange={(c) => {
              setColegio(null)
              setFiltro({ ...filtro, cursos: c })
            }}
          />
          {esPerfil ? (
            <button
              type="button"
              onClick={() => {
                cerrarNuevoTema()
                ir('perfil')
              }}
              className="cursor-pointer px-1 text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline"
            >
              Cambiar en Mi perfil
            </button>
          ) : (
            <button type="button" onClick={() => usarColegio(colegioActivo())} className="cursor-pointer px-1 text-sm font-semibold underline-offset-4 hover:underline">
              Volver a lo que enseño
            </button>
          )}
        </div>

        {!q.trim() && grados && (
          <p className="px-1 text-sm text-ink-soft">
            Temas de {nombreGrados(filtro.grados)} · {nombreCursos(filtro.cursos)}
          </p>
        )}

        <ul id="nuevo-tema-sugerencias" role="listbox" aria-label="Temas del Currículo Nacional" className="-mx-1 flex flex-col">
          {sugerencias.map((r, i) => (
            <li key={`${r.gradoId}-${r.areaId}-${r.tema}`} id={`sugerencia-${i}`} role="option" aria-selected={i === activo}>
              <button
                type="button"
                onClick={() => void crear(r)}
                onMouseEnter={() => setActivo(i)}
                className={cx('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left', i === activo && 'bg-surface-2')}
              >
                <Search className="size-4 shrink-0 text-ink-soft" aria-hidden />
                {/* En el celular el curso va debajo, para que el tema se lea completo. */}
                <span className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center sm:gap-3">
                  <span className="min-w-0 flex-1 text-lg leading-snug text-ink-soft sm:truncate">
                    <Resaltado texto={r.tema} q={q} />
                  </span>
                  <span className="shrink-0 text-sm text-ink-soft">
                    {r.area}
                    {(variosGrados || !enFiltro(r)) && ` · ${r.grado}`}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        {q.trim().length > 1 && grados && sugerencias.length === 0 && (
          <p className="px-1 text-ink-soft">No encontramos «{q.trim()}» en el currículo. Prueba con otra palabra.</p>
        )}
        {!grados && <p className="px-1 text-ink-soft">Cargando el currículo…</p>}

        <p className="border-t border-line px-1 pt-3 text-sm text-ink-soft">Solo temas del Currículo Nacional. Elige uno y lo preparamos al instante.</p>
      </div>
    </dialog>
  )
}
