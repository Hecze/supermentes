import { Library, Search, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api, type HerramientaId, type Material } from '../api'
import { GRADOS, HERRAMIENTAS, ORDEN_HERRAMIENTAS } from '../app/herramientas'
import { useStore } from '../app/store'
import { Boton, Chip, Costo, IconoHerramienta, Tarjeta } from '../components/ui'

export function Biblioteca() {
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
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-bold">Biblioteca</h1>
        <p className="max-w-2xl text-ink-soft">Materiales que crearon profes de todo el Perú. Úsalos tal cual o ajústalos a tu clase.</p>
      </header>

      <div className="flex items-start gap-3 rounded-2xl border border-ok/35 bg-ok/8 p-4">
        <Users className="mt-0.5 size-5 shrink-0 text-ok" aria-hidden />
        <p className="text-sm">
          <strong>Usar un material de la biblioteca es gratis.</strong> Cada vez que alguien reutiliza algo, nadie paga por generarlo de nuevo.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor="bib-buscar" className="relative flex-1">
            <span className="sr-only">Buscar</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" aria-hidden />
            <input
              id="bib-buscar"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Busca un tema: fracciones, ciclo del agua…"
              className="h-11 w-full rounded-xl border border-line bg-surface pl-9 pr-3 focus:border-ink focus:outline-none"
            />
          </label>
          <label htmlFor="bib-grado" className="sr-only">
            Grado
          </label>
          <select
            id="bib-grado"
            value={grado}
            onChange={(e) => setGrado(e.target.value)}
            className="h-11 rounded-xl border border-line bg-surface px-3 focus:border-ink focus:outline-none"
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                    Usar <Costo n={0} />
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
