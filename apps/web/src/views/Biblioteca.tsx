import { BookMarked, FileText, Library, Search, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api, type HerramientaId, type Material } from '../api'
import { GRADOS, HERRAMIENTAS, ORDEN_HERRAMIENTAS } from '../app/herramientas'
import { useStore } from '../app/store'
import { Boton, Chip, IconoHerramienta, Tarjeta, cx } from '../components/ui'
import { BibliotecaExamenes } from './BibliotecaExamenes'
import { VisorCurriculo } from './Curriculo'

function MaterialesComunidad() {
  const { avisar } = useStore()
  const [materiales, setMateriales] = useState<Material[] | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [tipo, setTipo] = useState<HerramientaId | null>(null)
  const [grado, setGrado] = useState('')

  useEffect(() => {
    let vivo = true
    api
      .biblioteca()
      .then((m) => vivo && setMateriales(m))
      .catch(() => vivo && setMateriales([]))
    return () => {
      vivo = false
    }
  }, [])

  const q = busqueda.trim().toLowerCase()
  const filtrados = (materiales ?? []).filter(
    (m) =>
      (!tipo || m.tipo === tipo) &&
      (!grado || m.grado === grado) &&
      (!q || `${m.titulo} ${m.area} ${m.autor} ${m.lugar}`.toLowerCase().includes(q)),
  )

  return (
    <>
      <p className="-mt-2 max-w-2xl text-lg text-ink-soft">Canciones, juegos, crucigramas y exámenes que hicieron profes de todo el Perú. Usarlos es gratis.</p>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor="bib-buscar" className="relative flex-1">
            <span className="sr-only">Buscar</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-ink-soft" aria-hidden />
            <input
              id="bib-buscar"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Busca un tema: fracciones, ciclo del agua…"
              className="h-12 w-full rounded-2xl border-2 border-line bg-surface pl-10 pr-3 text-lg focus:border-ink focus:outline-none"
            />
          </label>
          <label htmlFor="bib-grado" className="sr-only">
            Grado
          </label>
          <select
            id="bib-grado"
            value={grado}
            onChange={(e) => setGrado(e.target.value)}
            className="h-12 rounded-2xl border-2 border-line bg-surface px-3 focus:border-ink focus:outline-none"
          >
            <option value="">Todos los grados</option>
            {GRADOS.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip activo={!tipo} onClick={() => setTipo(null)}>
            Todo
          </Chip>
          {ORDEN_HERRAMIENTAS.map((id) => (
            <Chip key={id} activo={tipo === id} color={HERRAMIENTAS[id].color} onClick={() => setTipo(id)}>
              {HERRAMIENTAS[id].nombre}
            </Chip>
          ))}
        </div>
      </div>

      {materiales === null ? (
        <p className="text-ink-soft">Cargando materiales…</p>
      ) : filtrados.length === 0 ? (
        <Tarjeta className="flex flex-col items-start gap-2">
          <Library className="size-6 text-ink-soft" aria-hidden />
          <p className="font-semibold">No encontramos materiales con esos filtros.</p>
          <p className="text-sm text-ink-soft">Prueba con otra palabra o quita el filtro de grado. Si lo creas tú, aparecerá aquí para otros profes.</p>
        </Tarjeta>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {filtrados.map((m) => (
            <Tarjeta key={m.id} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <IconoHerramienta id={m.tipo} tam="sm" />
                <span className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: HERRAMIENTAS[m.tipo].color }}>
                  {HERRAMIENTAS[m.tipo].nombre}
                </span>
              </div>
              <h2 className="font-semibold leading-snug">{m.titulo}</h2>
              <p className="text-sm text-ink-soft">
                {m.grado} · {m.area}
              </p>
              <p className="text-sm">
                {m.esMio ? 'Tú' : `Prof. ${m.autor}`} · {m.lugar}
              </p>
              <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3">
                <span className="text-xs text-ink-soft tabular-nums">Usado {m.usos} veces</span>
                {m.esMio ? (
                  <span className="text-xs text-ink-soft">Lo compartiste tú</span>
                ) : (
                  <Boton variante="contorno" tam="sm" onClick={() => avisar(`"${m.titulo}" se agregó a tus materiales.`, 'ok')}>
                    Usar
                  </Boton>
                )}
              </div>
            </Tarjeta>
          ))}
        </div>
      )}
    </>
  )
}

const PESTANAS = [
  { id: 'curriculo', nombre: 'Currículo nacional', icono: BookMarked },
  { id: 'examenes', nombre: 'Exámenes listos', icono: FileText },
  { id: 'materiales', nombre: 'Materiales de la comunidad', icono: Users },
] as const

/** Biblioteca: la base de conocimiento (currículo oficial) y lo que crearon otros profes. */
export function Biblioteca() {
  const { pestanaBiblioteca, setPestanaBiblioteca } = useStore()
  return (
    <>
      <header className="flex flex-col gap-4 print:hidden">
        <h1 className="font-display text-4xl font-bold">Biblioteca</h1>
        <div className="flex max-w-full gap-1 self-start overflow-x-auto rounded-2xl bg-surface-2 p-1" role="tablist" aria-label="Biblioteca">
          {PESTANAS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={pestanaBiblioteca === p.id}
              onClick={() => setPestanaBiblioteca(p.id)}
              className={cx(
                'inline-flex h-11 shrink-0 items-center gap-2 rounded-xl px-4 transition',
                pestanaBiblioteca === p.id ? 'bg-surface font-semibold shadow-sm' : 'text-ink-soft hover:text-ink',
              )}
            >
              <p.icono className="size-5" aria-hidden />
              {p.nombre}
            </button>
          ))}
        </div>
      </header>
      {pestanaBiblioteca === 'curriculo' ? <VisorCurriculo /> : pestanaBiblioteca === 'examenes' ? <BibliotecaExamenes /> : <MaterialesComunidad />}
    </>
  )
}
