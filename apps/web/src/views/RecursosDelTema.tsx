// Videos y fichas que ya existen en internet para el tema (api/recursos.ts, buscados con Exa).
// No traen cita del currículo: se presentan como material para revisar, no como material verificado.
import { ExternalLink, FileText, Play, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api, type Ficha, type Recurso } from '../api'

export function RecursosDelTema({ ficha }: { ficha: Ficha }) {
  const [recursos, setRecursos] = useState<Recurso[] | 'cargando' | 'error'>('cargando')
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vivo = true
    setRecursos('cargando')
    api.buscarRecursos(ficha).then(
      (r) => vivo && setRecursos(r),
      () => vivo && setRecursos('error'),
    )
    return () => {
      vivo = false
    }
  }, [ficha.titulo, ficha.grado, ficha.area, intento]) // eslint-disable-line react-hooks/exhaustive-deps

  // Solo aparece cuando trae videos o fichas: mientras busca no se muestra nada, para que nada aparezca y se vaya.
  if (recursos === 'cargando' || (Array.isArray(recursos) && recursos.length === 0)) return null

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Videos y fichas de tu tema</h2>
        <p className="text-ink-soft">Los encontramos en internet para {ficha.grado}. Míralos antes de usarlos en clase.</p>
      </div>
      {recursos === 'error' && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-soft" role="status">
          <TriangleAlert className="size-4 shrink-0 text-warn" aria-hidden />
          No pudimos buscar videos y fichas.
          <button type="button" onClick={() => setIntento((n) => n + 1)} className="font-medium text-ink underline underline-offset-4">
            Reintentar
          </button>
        </p>
      )}
      {Array.isArray(recursos) && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {recursos.map((r) => (
            <a
              key={r.url}
              href={r.url}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col overflow-hidden rounded-2xl border-2 border-line bg-surface transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="relative grid aspect-video place-items-center bg-surface-2">
                {r.imagen && <img src={r.imagen} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" onError={(e) => e.currentTarget.remove()} />}
                {r.tipo === 'video' ? (
                  <Play className="relative size-10 rounded-full bg-ink/70 p-2.5 text-white" aria-hidden />
                ) : (
                  !r.imagen && <FileText className="size-10 text-ink-soft" aria-hidden />
                )}
              </span>
              <span className="flex flex-1 flex-col gap-1 p-3">
                <span className="line-clamp-2 font-semibold leading-snug">{r.titulo}</span>
                <span className="mt-auto inline-flex items-center gap-1 text-sm text-ink-soft">
                  {r.tipo === 'video' ? 'Video' : 'Ficha'} · {r.fuente}
                  <ExternalLink className="size-3.5" aria-hidden />
                </span>
              </span>
            </a>
          ))}
        </div>
      )}
    </section>
  )
}
