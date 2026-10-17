import { Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useStore } from '../app/store'
import { fichaDesdeCurriculo } from '../app/temaInstantaneo'
import { buscarEnGrado, buscarEnTodos, fundamento, normalizar, temasDe, type Resultado } from '../curriculo/buscar'
import { GRADOS_CURRICULO, NIVELES, areaPorId, nivelDe } from '../curriculo/catalogo'
import { cargarNivel, useCurriculo, type GradoCurriculo } from '../curriculo/cargar'
import { cx } from './ui'

const NOMBRES = Object.fromEntries(GRADOS_CURRICULO.map((g) => [g.id, g.corto]))
const CLAVE_GRADO = 'supermentes-grado'
const MAXIMO = 8

function gradoGuardado() {
  try {
    const g = localStorage.getItem(CLAVE_GRADO)
    return g && NOMBRES[g] ? g : null
  } catch {
    return null
  }
}

/** Sin escribir nada: dos temas de cada curso principal del grado, para empezar con un clic. */
function sugerenciasDelGrado(grado: GradoCurriculo): Resultado[] {
  const principales = ['matematica', 'comunicacion', 'ciencia-y-tecnologia', 'personal-social']
  return principales.flatMap((id) => {
    const a = grado.areas.find((x) => x.id === id)
    if (!a) return []
    return temasDe(a)
      .slice(0, 2)
      .map((t) => ({ tema: t.tema, indiceCompetencia: t.indiceCompetencia, gradoId: grado.id, grado: NOMBRES[grado.id] ?? grado.id, areaId: a.id, area: a.nombre }))
  })
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
 */
export function NuevoTema() {
  const { nuevoTemaAbierto, previoTema, cerrarNuevoTema, setFicha, completarFicha, ir, ficha } = useStore()
  const dialogo = useRef<HTMLDialogElement>(null)
  const buscador = useRef<HTMLInputElement>(null)
  const [gradoId, setGradoId] = useState(() => ficha?.gradoId ?? gradoGuardado() ?? 'primaria-4')
  const [q, setQ] = useState('')
  const [activo, setActivo] = useState(0)
  const [otros, setOtros] = useState<Resultado[]>([])

  const cur = useCurriculo(nivelDe(gradoId), gradoId)
  const grado = cur.estado === 'listo' ? cur.grado : null

  async function crear(r: Resultado) {
    const datos = await cargarNivel(nivelDe(r.gradoId))
    const area = datos?.grados.find((g) => g.id === r.gradoId)?.areas.find((a) => a.id === r.areaId)
    if (!area) return
    const nueva = fichaDesdeCurriculo({ ...r, ...fundamento(area, r.tema, r.cita, r.indiceCompetencia) })
    try {
      localStorage.setItem(CLAVE_GRADO, r.gradoId)
    } catch {
      // Sin almacenamiento se vuelve a elegir el grado la próxima vez.
    }
    setFicha(nueva)
    cerrarNuevoTema()
    ir('ficha')
    completarFicha(nueva)
  }

  useEffect(() => {
    const d = dialogo.current
    if (!d) return
    if (nuevoTemaAbierto && previoTema?.texto && previoTema.areaId) {
      // Desde el currículo ya viene el tema: se crea directo, sin mostrar el buscador.
      const g = previoTema.gradoId ?? ficha?.gradoId ?? 'primaria-4'
      void crear({
        tema: previoTema.texto,
        gradoId: g,
        grado: NOMBRES[g] ?? g,
        areaId: previoTema.areaId,
        area: areaPorId(g, previoTema.areaId)?.nombre ?? previoTema.areaId,
        indiceCompetencia: previoTema.indiceCompetencia,
      })
      return
    }
    if (nuevoTemaAbierto && !d.open) {
      setGradoId(previoTema?.gradoId ?? ficha?.gradoId ?? gradoGuardado() ?? 'primaria-4')
      setQ('')
      setActivo(0)
      d.showModal()
      buscador.current?.focus()
    }
    if (!nuevoTemaAbierto && d.open) d.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nuevoTemaAbierto, previoTema])

  const propios = useMemo(() => (grado && q.trim() ? buscarEnGrado(grado, NOMBRES[gradoId] ?? gradoId, q) : []), [grado, gradoId, q])
  const exactos = propios.filter((r) => !r.parcial && !r.cita)

  // Si en el grado hay pocos temas con ese nombre, se suman los de otros grados.
  useEffect(() => {
    setOtros([])
    if (q.trim().length < 3 || exactos.length >= 3) return
    let vivo = true
    const t = window.setTimeout(() => void buscarEnTodos(q, NOMBRES, gradoId).then((r) => vivo && setOtros(r.slice(0, 4))), 200)
    return () => {
      vivo = false
      window.clearTimeout(t)
    }
  }, [q, gradoId, exactos.length])

  const sugerencias = useMemo(() => {
    if (!grado) return []
    if (!q.trim()) return sugerenciasDelGrado(grado)
    const vistos = new Set<string>()
    return [...exactos, ...otros, ...propios.filter((r) => !r.parcial && r.cita), ...propios.filter((r) => r.parcial)]
      .filter((r) => {
        const k = `${r.gradoId}|${r.areaId}|${normalizar(r.tema)}`
        if (vistos.has(k)) return false
        vistos.add(k)
        return true
      })
      .slice(0, MAXIMO)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grado, q, propios, otros])

  useEffect(() => setActivo(0), [q, gradoId])

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

        <div className="flex items-stretch gap-2">
          <label htmlFor="nuevo-tema-buscar" className="relative min-w-0 flex-1">
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
          <label htmlFor="nuevo-tema-grado" className="shrink-0">
            <span className="sr-only">Grado</span>
            <select
              id="nuevo-tema-grado"
              value={gradoId}
              onChange={(e) => setGradoId(e.target.value)}
              className="h-13 rounded-2xl border-2 border-line bg-surface px-3 font-medium focus:border-ink focus:outline-none"
            >
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
        </div>

        {!q.trim() && grado && <p className="px-1 text-sm text-ink-soft">Temas de {NOMBRES[gradoId]}</p>}

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
                <span className="min-w-0 flex-1 truncate text-lg text-ink-soft">
                  <Resaltado texto={r.tema} q={q} />
                </span>
                <span className="shrink-0 text-sm text-ink-soft">
                  {r.area}
                  {r.gradoId !== gradoId && ` · ${r.grado}`}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {q.trim().length > 1 && grado && sugerencias.length === 0 && (
          <p className="px-1 text-ink-soft">No encontramos «{q.trim()}» en el currículo. Prueba con otra palabra.</p>
        )}
        {!grado && <p className="px-1 text-ink-soft">Cargando el currículo…</p>}

        <p className="border-t border-line px-1 pt-3 text-sm text-ink-soft">Solo temas del Currículo Nacional. Elige uno y lo preparamos al instante.</p>
      </div>
    </dialog>
  )
}
