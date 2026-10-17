import { AlertTriangle, BookOpen, Camera, Check, FileUp, Library, Pencil, PenLine } from 'lucide-react'
import { useState } from 'react'
import { HERRAMIENTAS, ORDEN_HERRAMIENTAS } from '../app/herramientas'
import { useStore } from '../app/store'
import { SinTema } from '../components/Shell'
import { Boton, Costo, Etiqueta, IconoHerramienta, Tarjeta, cx } from '../components/ui'

export function Ficha() {
  const { ficha, ir, resultados, avisar } = useStore()
  const [editando, setEditando] = useState(false)

  if (!ficha) return <SinTema />

  const IconoFuente = ficha.fuente.startsWith('Foto') ? Camera : ficha.fuente.startsWith('Archivo') ? FileUp : PenLine
  const hechos: Partial<Record<string, boolean>> = {
    cancion: !!resultados.cancion,
    examen: !!resultados.examen,
    juego: !!resultados.juego,
    adaptar: !!resultados.adaptacion,
  }
  const editable = editando ? 'rounded-md outline-dashed outline-1 outline-offset-4 outline-line focus:outline-ink' : ''

  return (
    <>
      <header className="flex flex-col gap-3">
        <Etiqueta>Ficha del tema</Etiqueta>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1
            className={cx('min-w-0 font-display text-4xl font-bold leading-tight', editable)}
            contentEditable={editando}
            suppressContentEditableWarning
          >
            {ficha.titulo}
          </h1>
          <Boton
            variante="contorno"
            tam="sm"
            onClick={() => {
              if (editando) avisar('Guardamos tus cambios en la ficha.', 'ok')
              setEditando(!editando)
            }}
          >
            {editando ? <Check className="size-4" aria-hidden /> : <Pencil className="size-4" aria-hidden />}
            {editando ? 'Listo' : 'Editar ficha'}
          </Boton>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {[ficha.grado, ficha.area, ficha.duracion].map((d) => (
            <span key={d} className="rounded-full bg-surface-2 px-3 py-1">
              {d}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-ink-soft">
            <IconoFuente className="size-3.5" aria-hidden />
            {ficha.fuente}
          </span>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Tarjeta className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Etiqueta>Propósito de la clase</Etiqueta>
            <p className={cx('text-lg', editable)} contentEditable={editando} suppressContentEditableWarning>
              {ficha.proposito}
            </p>
          </div>
          <div className="flex flex-col gap-1.5 rounded-xl bg-surface-2 p-3.5">
            <Etiqueta>Currículo Nacional (CNEB)</Etiqueta>
            <p className="text-sm">
              <span className="text-ink-soft">Competencia:</span> {ficha.curriculo.competencia}
            </p>
            <p className="text-sm">
              <span className="text-ink-soft">Capacidad:</span> {ficha.curriculo.capacidad}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Etiqueta>Conceptos clave</Etiqueta>
            <ul className="flex flex-col gap-2">
              {ficha.conceptos.map((c) => (
                <li key={c} className="flex gap-2.5">
                  <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-ink" aria-hidden />
                  <span className={editable} contentEditable={editando} suppressContentEditableWarning>
                    {c}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-1.5">
            <Etiqueta>Ejemplo para la clase</Etiqueta>
            <p className={editable} contentEditable={editando} suppressContentEditableWarning>
              {ficha.ejemplo}
            </p>
          </div>
          <div className="flex gap-3 rounded-xl bg-warn/10 p-3.5">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warn" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-warn">Lo que suelen confundir</p>
              <p className={cx('text-sm', editable)} contentEditable={editando} suppressContentEditableWarning>
                {ficha.errorFrecuente}
              </p>
            </div>
          </div>
        </Tarjeta>

        <div className="flex flex-col gap-4">
          <Tarjeta className="flex flex-col gap-3">
            <Etiqueta>Vocabulario</Etiqueta>
            <dl className="flex flex-col gap-2.5">
              {ficha.vocabulario.map((v) => (
                <div key={v.palabra} className="flex flex-col">
                  <dt className="font-semibold">{v.palabra}</dt>
                  <dd className="text-sm text-ink-soft">{v.definicion}</dd>
                </div>
              ))}
            </dl>
          </Tarjeta>
          {ficha.coincidenciasBiblioteca > 0 && (
            <Tarjeta className="flex flex-col gap-3 bg-ok/8" style={{ borderColor: 'color-mix(in oklab, var(--ok) 35%, transparent)' }}>
              <div className="flex items-start gap-3">
                <Library className="mt-0.5 size-5 shrink-0 text-ok" aria-hidden />
                <p className="text-sm">
                  <strong>Otros profes ya crearon {ficha.coincidenciasBiblioteca} materiales</strong> sobre este tema. Usarlos es gratis y puedes
                  ajustarlos a tu clase.
                </p>
              </div>
              <Boton variante="contorno" tam="sm" className="self-start" onClick={() => ir('biblioteca')}>
                <BookOpen className="size-4" aria-hidden />
                Ver en la biblioteca
              </Boton>
            </Tarjeta>
          )}
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-2xl font-bold">¿Qué quieres crear con este tema?</h2>
        <p className="-mt-1 text-sm text-ink-soft">Elige solo lo que vas a usar. Cada herramienta parte de esta ficha.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ORDEN_HERRAMIENTAS.map((id) => {
            const h = HERRAMIENTAS[id]
            return (
              <button
                key={id}
                type="button"
                onClick={() => ir(id)}
                className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex items-center justify-between gap-2">
                  <IconoHerramienta id={id} />
                  {hechos[id] ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-ok/12 px-2 py-0.5 text-xs font-medium text-ok">
                      <Check className="size-3.5" aria-hidden /> Creado
                    </span>
                  ) : id === 'crucigrama' ? (
                    <Costo n={0} />
                  ) : null}
                </span>
                <span className="font-semibold">{h.nombre}</span>
                <span className="text-sm text-ink-soft">{h.descripcion}</span>
              </button>
            )
          })}
        </div>
      </section>
    </>
  )
}
