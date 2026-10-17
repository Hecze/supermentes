import { Check, ChevronRight, Library } from 'lucide-react'
import { HERRAMIENTAS, ORDEN_HERRAMIENTAS } from '../app/herramientas'
import { useStore } from '../app/store'
import { SinTema } from '../components/Shell'
import { Desplegable, Editable, tinte } from '../components/ui'

export function Ficha() {
  const { ficha, ir, resultados } = useStore()

  if (!ficha) return <SinTema />

  const listos: Partial<Record<string, boolean>> = {
    cancion: !!resultados.cancion,
    examen: !!resultados.examen,
    juego: !!resultados.juego,
    crucigrama: false,
    adaptar: !!resultados.adaptacion,
  }

  return (
    <>
      <header className="flex flex-col gap-2">
        <p className="text-ink-soft">Tu tema</p>
        <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">{ficha.titulo}</h1>
        <p className="text-lg text-ink-soft">
          {ficha.grado} · {ficha.area}
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">¿Qué necesitas para tu clase?</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {ORDEN_HERRAMIENTAS.map((id) => {
            const h = HERRAMIENTAS[id]
            const Icono = h.icono
            return (
              <button
                key={id}
                type="button"
                onClick={() => ir(id)}
                className="group flex items-center gap-4 rounded-2xl border-2 border-line bg-surface p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
              >
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl" style={{ background: tinte(h.color, 14), color: h.color }}>
                  <Icono className="size-7" aria-hidden />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-lg font-semibold">{h.pedido}</span>
                  <span className="text-ink-soft">{h.descripcion}</span>
                </span>
                {listos[id] ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-ok/12 px-2.5 py-1 text-sm font-medium text-ok">
                    <Check className="size-4" aria-hidden /> Listo
                  </span>
                ) : (
                  <ChevronRight className="size-5 text-ink-soft transition group-hover:translate-x-0.5" aria-hidden />
                )}
              </button>
            )
          })}
        </div>
      </section>

      {ficha.coincidenciasBiblioteca > 0 && (
        <button type="button" onClick={() => ir('biblioteca')} className="flex items-center gap-2 self-start rounded-lg text-ink-soft hover:text-ink">
          <Library className="size-5" aria-hidden />
          Otros profes ya hicieron {ficha.coincidenciasBiblioteca} materiales de este tema. Usarlos es gratis.
          <ChevronRight className="size-4" aria-hidden />
        </button>
      )}

      <Desplegable titulo="Revisa lo que entendimos de tu tema">
        <p className="text-sm text-ink-soft">Si algo no está bien, haz clic sobre el texto y corrígelo. Todas las herramientas usan esto.</p>
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold">Propósito de la clase</h3>
          <Editable>{ficha.proposito}</Editable>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold">Ideas principales</h3>
          <ul className="flex flex-col gap-1">
            {ficha.conceptos.map((c) => (
              <li key={c} className="flex gap-2">
                <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-ink" aria-hidden />
                <Editable como="span" className="flex-1">
                  {c}
                </Editable>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold">Palabras clave</h3>
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {ficha.vocabulario.map((v) => (
              <div key={v.palabra}>
                <dt className="font-medium">{v.palabra}</dt>
                <dd>
                  <Editable className="text-sm text-ink-soft">{v.definicion}</Editable>
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold">Lo que suelen confundir</h3>
          <Editable>{ficha.errorFrecuente}</Editable>
        </div>
        <div className="flex flex-col gap-1 border-t border-line pt-4 text-sm text-ink-soft">
          <p>
            Currículo Nacional: {ficha.curriculo.competencia} · {ficha.curriculo.capacidad}
          </p>
          <p>Fuente: {ficha.fuente}</p>
        </div>
      </Desplegable>
    </>
  )
}
