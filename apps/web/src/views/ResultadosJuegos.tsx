// "Resultados de juegos": todos los juegos que el docente mandó a las familias, de todos sus temas, con quién
// jugó y su puntaje más alto. Está en el menú y no depende del tema abierto, para que nunca salga vacío solo
// porque el docente está parado en otro tema.
import { ChevronDown, Gamepad2, LoaderCircle, RefreshCw, Trophy } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { cuando, useStore } from '../app/store'
import { Boton, cx } from '../components/ui'
import { juegoPorId } from '../juegos/catalogo'
import { cargarResultados, enviados, type Enviado, type FilaResultado } from '../juegos/compartir/resultados'
import { TextoMat } from '../juegos/motor/piezas'
import { num } from '../juegos/matematica/formato'
import type { TareaRevisada } from '../juegos/compartir/tareas'
import { RevisarTarea, TareasPorSalon, useTareas } from './Tareas'

const MEDALLAS = ['🥇', '🥈', '🥉']

/** Juegos enviados desde esta computadora; se actualiza al enviar uno nuevo. */
export function useEnviados() {
  const [lista, setLista] = useState(enviados)
  useEffect(() => {
    const actualizar = () => setLista(enviados())
    window.addEventListener('supermentes-enviados', actualizar)
    return () => window.removeEventListener('supermentes-enviados', actualizar)
  }, [])
  return lista
}

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

  const actualizar = (
    <button
      type="button"
      onClick={() => {
        setFilas(null)
        setVez((v) => v + 1)
      }}
      className="inline-flex items-center gap-1.5 self-start rounded-lg py-1 text-sm text-ink-soft hover:text-ink"
    >
      <RefreshCw className="size-4" aria-hidden /> Actualizar
    </button>
  )

  if (error) {
    return (
      <div className="flex flex-col gap-2 px-4 pb-4">
        <p className="text-ink-soft">No pudimos traer los resultados. Revisa tu conexión y vuelve a intentar.</p>
        {actualizar}
      </div>
    )
  }
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
        <>
          <p className="text-sm text-ink-soft">
            {filas.length === 1 ? 'Jugó 1 alumno' : `Jugaron ${filas.length} alumnos`}, del puntaje más alto al más bajo.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[22rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-line text-sm text-ink-soft">
                  <th className="py-2 pr-2 font-medium">Alumno</th>
                  <th className="py-2 pr-3 text-right font-medium">Puntaje más alto</th>
                  <th className="py-2 pr-2 font-medium">Estrellas</th>
                  <th className="py-2 font-medium">Cuándo</th>
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
                    <td className="py-2 pr-3 text-right font-semibold tabular-nums">{num(f.mejor.puntaje)}</td>
                    <td className="whitespace-nowrap py-2 pr-2" aria-label={`${f.mejor.estrellas} de 3 estrellas`}>
                      <span className="text-warn">{'★'.repeat(f.mejor.estrellas)}</span>
                      <span className="text-line">{'★'.repeat(3 - f.mejor.estrellas)}</span>
                    </td>
                    <td className="py-2 text-ink-soft">{cuando(f.mejor.fecha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {actualizar}
    </div>
  )
}

function FilaEnvio({ envio, abierto, alternar }: { envio: Enviado; abierto: boolean; alternar: () => void }) {
  const def = juegoPorId(envio.juego)
  const Miniatura = def?.Miniatura
  return (
    <div className="border-t border-line">
      <button type="button" onClick={alternar} aria-expanded={abierto} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2">
        <span className="hidden w-20 shrink-0 overflow-hidden rounded-lg border border-line sm:block" aria-hidden>
          {Miniatura ? <Miniatura /> : <Gamepad2 className="m-auto size-6" />}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-semibold">{def?.nombre ?? 'Juego'}</span>
          {envio.practica && (
            <span className="truncate text-sm text-ink-soft">
              <TextoMat texto={envio.practica} />
            </span>
          )}
        </span>
        <span className="shrink-0 text-right text-sm text-ink-soft">
          Enviado {cuando(envio.fecha).toLowerCase()}
          <span className="block font-mono tracking-widest">{envio.codigo}</span>
        </span>
        <ChevronDown className={cx('size-5 shrink-0 text-ink-soft transition', abierto && 'rotate-180')} aria-hidden />
      </button>
      {abierto && <TablaResultados envio={envio} />}
    </div>
  )
}

export function ResultadosJuegos() {
  const { ficha, ir } = useStore()
  const lista = useEnviados()
  const tareas = useTareas()
  const [tarea, setTarea] = useState<TareaRevisada | null>(null)

  // Agrupados por tema: primero el tema abierto (si mandó juegos de él) y luego por el envío más reciente.
  const temas = useMemo(() => {
    const grupos = new Map<string, Enviado[]>()
    for (const e of lista) grupos.set(`${e.tema}|${e.grado ?? ''}`, [...(grupos.get(`${e.tema}|${e.grado ?? ''}`) ?? []), e])
    const esAbierto = (e: Enviado) => Number(e.tema === ficha?.titulo && (!e.grado || e.grado === ficha?.grado))
    return [...grupos.values()].sort((a, b) => esAbierto(b[0]) - esAbierto(a[0]))
  }, [lista, ficha?.titulo])

  // Se abre solo el envío más reciente del primer tema: el que el docente probablemente viene a ver.
  const [abierto, setAbierto] = useState<string | null>(() => temas[0]?.[0]?.codigo ?? null)

  if (tarea) return <RevisarTarea tarea={tarea} volver={() => setTarea(null)} />

  return (
    <>
      {tareas && <TareasPorSalon tareas={tareas} abrir={setTarea} />}
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-4xl font-bold">Resultados de juegos</h1>
        <p className="max-w-2xl text-lg text-ink-soft">Quién jugó cada juego que mandaste a las familias y su puntaje más alto.</p>
      </header>

      {lista.length === 0 ? (
        <section className="flex flex-col items-start gap-4 rounded-3xl border-2 border-dashed border-line bg-surface p-6 sm:p-8">
          <span className="grid size-12 place-items-center rounded-xl bg-warn/12 text-warn">
            <Trophy className="size-6" aria-hidden />
          </span>
          <h2 className="text-xl font-semibold">Todavía no mandaste juegos desde esta computadora</h2>
          <p className="max-w-xl text-ink-soft">
            Abre un tema, entra a <strong className="text-ink">Juego web</strong> y toca <strong className="text-ink">Enviar a las familias</strong>. Cuando tus alumnos jueguen,
            aquí verás quién jugó y su puntaje más alto.
          </p>
          {ficha && <Boton onClick={() => ir('juego')}>Ir a Juego web</Boton>}
        </section>
      ) : (
        <>
          {temas.map((envios) => (
            <section key={`${envios[0].tema}|${envios[0].grado ?? ''}`} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
              <header className="flex flex-wrap items-baseline gap-x-2 px-4 py-3">
                <h2 className="text-lg font-semibold">{envios[0].tema}</h2>
                {envios[0].grado && <span className="text-ink-soft">· {envios[0].grado}</span>}
              </header>
              {envios.map((e) => (
                <FilaEnvio key={e.codigo} envio={e} abierto={abierto === e.codigo} alternar={() => setAbierto(abierto === e.codigo ? null : e.codigo)} />
              ))}
            </section>
          ))}
          <p className="text-sm text-ink-soft">Aquí aparecen los juegos que mandaste desde esta computadora.</p>
        </>
      )}
    </>
  )
}

/** Una línea en Juego web: cuántos juegos de este tema mandó y un atajo a sus resultados. No empuja la lista de juegos. */
export function AtajoResultados({ tema }: { tema: string }) {
  const { ir } = useStore()
  const n = useEnviados().filter((e) => e.tema === tema).length
  if (!n) return null
  return (
    <button
      type="button"
      onClick={() => ir('resultados')}
      className="flex items-center gap-2.5 self-start rounded-xl border border-line bg-surface px-3 py-2 text-left hover:bg-surface-2 print:hidden"
    >
      <Trophy className="size-5 shrink-0 text-warn" aria-hidden />
      <span>
        Mandaste {n === 1 ? 'un juego' : `${n} juegos`} de este tema a las familias. <span className="font-semibold underline underline-offset-4">Ver resultados</span>
      </span>
    </button>
  )
}
