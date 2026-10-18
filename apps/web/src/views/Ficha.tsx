import { BookMarked, Check, ChevronRight, Library, LoaderCircle, TriangleAlert } from 'lucide-react'
import { HERRAMIENTAS, ORDEN_HERRAMIENTAS } from '../app/herramientas'
import { useStore } from '../app/store'
import { SinTema } from '../components/Shell'
import { Desplegable, Editable, tinte } from '../components/ui'
import { RecursosDelTema } from './RecursosDelTema'

export function Ficha() {
  const { ficha, ir, resultados, verCurriculo, completando, completarFicha } = useStore()

  if (!ficha) return <SinTema />

  const listos: Partial<Record<string, boolean>> = {
    sesion: !!resultados.sesion,
    cancion: !!resultados.cancion,
    examen: !!resultados.examen || !!resultados.hojas,
    juego: !!resultados.juego,
    crucigrama: !!resultados.crucigrama?.filas.some((f) => f.palabra.trim().length > 1),
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

      <button
        type="button"
        onClick={() => verCurriculo(ficha.gradoId, ficha.areaId)}
        className="group flex items-center gap-4 rounded-2xl border-2 border-line bg-surface p-4 text-left transition hover:border-ink sm:p-5"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-surface-2">
          <BookMarked className="size-6" aria-hidden />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-semibold">
            Basado en el Currículo Nacional: {ficha.area}, {ficha.grado}
          </span>
          <span className="text-ink-soft">
            Competencia: {ficha.curriculo.competencia}. Todo lo que crees parte de este tema y de este currículo.
          </span>
        </span>
        <span className="hidden items-center gap-1 font-medium sm:inline-flex">
          Ver currículo <ChevronRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
        </span>
      </button>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">¿Qué necesitas para tu clase?</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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

      <RecursosDelTema ficha={ficha} />

      {ficha.coincidenciasBiblioteca > 0 && (
        <button type="button" onClick={() => ir('biblioteca')} className="flex items-center gap-2 self-start rounded-lg text-ink-soft hover:text-ink">
          <Library className="size-5" aria-hidden />
          Otros profes ya hicieron {ficha.coincidenciasBiblioteca} materiales de este tema. Usarlos es gratis.
          <ChevronRight className="size-4" aria-hidden />
        </button>
      )}

      {/* El tema se crea al instante; la IA completa esto en segundo plano (app/temaInstantaneo.ts). */}
      {completando[ficha.id] === 'cargando' && (
        <p className="-mb-4 flex items-center gap-2 text-ink-soft" role="status">
          <LoaderCircle className="size-4 shrink-0 animate-spin" aria-hidden />
          Completando las ideas clave y las palabras del tema. Mientras tanto, ya puedes usar las herramientas.
        </p>
      )}
      {completando[ficha.id] === 'error' && (
        <p className="-mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-soft" role="status">
          <TriangleAlert className="size-4 shrink-0 text-warn" aria-hidden />
          No pudimos completar las ideas clave y las palabras del tema.
          <button type="button" onClick={() => completarFicha(ficha)} className="font-medium text-ink underline underline-offset-4">
            Reintentar
          </button>
        </p>
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
            Currículo Nacional: {[ficha.curriculo.competencia, ficha.curriculo.capacidad].filter(Boolean).join(' · ')}
          </p>
          <p>Fuente: {ficha.fuente}</p>
        </div>
      </Desplegable>
    </>
  )
}
