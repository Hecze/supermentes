// Lo que ve el docente de los juegos que mandó: quién jugó y su puntaje más alto. Una tabla y nada más.
import { ChevronDown, LoaderCircle, RefreshCw, Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cuando } from '../app/store'
import { cx } from '../components/ui'
import { juegoPorId } from '../juegos/catalogo'
import { cargarResultados, enviados, type Enviado, type FilaResultado } from '../juegos/compartir/resultados'
import { num } from '../juegos/matematica/formato'

const MEDALLAS = ['🥇', '🥈', '🥉']

function TablaResultados({ envio }: { envio: Enviado }) {
  const [filas, setFilas] = useState<FilaResultado[] | null>(null)
  const [error, setError] = useState(false)
  const [vez, setVez] = useState(0)

  useEffect(() => {
    let vivo = true
    setError(false)
    cargarResultados(envio).then(
      (f) => vivo && setFilas(f),
      () => vivo && setError(true),
    )
    return () => {
      vivo = false
    }
  }, [envio, vez])

  if (error) return <p className="px-4 pb-4 text-ink-soft">No pudimos traer los resultados. Revisa tu conexión y vuelve a intentar.</p>
  if (!filas) {
    return (
      <p className="flex items-center gap-2 px-4 pb-4 text-ink-soft" role="status">
        <LoaderCircle className="size-4 animate-spin" aria-hidden /> Buscando quién jugó…
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2 px-4 pb-4">
      {filas.length === 0 ? (
        <p className="text-ink-soft">Todavía nadie jugó. Cuando tus alumnos terminen una partida, aparecerán aquí.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[30rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-line text-sm text-ink-soft">
                <th className="py-2 pr-2 font-medium">Alumno</th>
                <th className="py-2 pr-2 text-right font-medium">Puntaje más alto</th>
                <th className="py-2 pr-2 font-medium">Estrellas</th>
                <th className="py-2 pr-2 text-right font-medium">Veces que jugó</th>
                <th className="py-2 font-medium">Última vez</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => (
                <tr key={f.id} className="border-b border-line last:border-0">
                  <td className="py-2 pr-2 font-medium">
                    <span className="inline-block w-7" aria-hidden>
                      {MEDALLAS[i] ?? ''}
                    </span>
                    {f.nombre}
                  </td>
                  <td className="py-2 pr-2 text-right font-semibold tabular-nums">{num(f.mejor.puntaje)}</td>
                  <td className="py-2 pr-2" aria-label={`${f.mejor.estrellas} de 3 estrellas`}>
                    <span className="text-warn">{'★'.repeat(f.mejor.estrellas)}</span>
                    <span className="text-line">{'★'.repeat(3 - f.mejor.estrellas)}</span>
                  </td>
                  <td className="py-2 pr-2 text-right tabular-nums">{f.intentos}</td>
                  <td className="py-2 text-ink-soft">{cuando(f.ultimo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          setFilas(null)
          setVez((v) => v + 1)
        }}
        className="inline-flex items-center gap-1.5 self-start rounded-lg py-1 text-sm text-ink-soft hover:text-ink">
        <RefreshCw className="size-4" aria-hidden /> Actualizar
      </button>
    </div>
  )
}

/** Juegos enviados de este tema, del más reciente al más antiguo. El más reciente se abre solo. */
export function ResultadosJuegos({ tema }: { tema: string }) {
  const [lista, setLista] = useState(() => enviados().filter((e) => e.tema === tema))
  const [abierto, setAbierto] = useState<string | null>(lista[0]?.codigo ?? null)

  useEffect(() => {
    const actualizar = () => {
      const nueva = enviados().filter((e) => e.tema === tema)
      setLista(nueva)
      setAbierto((a) => a ?? nueva[0]?.codigo ?? null)
    }
    window.addEventListener('supermentes-enviados', actualizar)
    return () => window.removeEventListener('supermentes-enviados', actualizar)
  }, [tema])

  if (!lista.length) return null

  return (
    <section className="flex flex-col rounded-2xl border border-line bg-surface">
      <header className="flex items-center gap-3 p-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-warn/12 text-warn">
          <Trophy className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Resultados de tus alumnos</h2>
          <p className="text-sm text-ink-soft">Quién jugó lo que enviaste y su puntaje más alto.</p>
        </div>
      </header>
      {lista.map((e) => {
        const abiertoAqui = abierto === e.codigo
        return (
          <div key={e.codigo} className="border-t border-line">
            <button
              type="button"
              onClick={() => setAbierto(abiertoAqui ? null : e.codigo)}
              aria-expanded={abiertoAqui}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2"
            >
              <span className="min-w-0 flex-1">
                <span className="font-medium">{juegoPorId(e.juego)?.nombre ?? 'Juego'}</span>
                <span className="text-ink-soft"> · enviado {cuando(e.fecha).toLowerCase()} · código {e.codigo}</span>
              </span>
              <ChevronDown className={cx('size-5 shrink-0 text-ink-soft transition', abiertoAqui && 'rotate-180')} aria-hidden />
            </button>
            {abiertoAqui && <TablaResultados envio={e} />}
          </div>
        )
      })}
    </section>
  )
}
