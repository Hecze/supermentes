// Mi perfil: cómo la llaman y dónde enseña. Cada colegio es público o privado y tiene sus grados y cursos (en un
// privado, Matemática se parte en Álgebra, Geometría…). El buscador de temas abre con los de su colegio. Nada se
// guarda hasta tocar «Guardar» (arriba, siempre a la vista): una sola petición a la base.
import { Check, Plus, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useCuenta } from '../app/cuenta'
import { COLEGIO_NUEVO, colegioValido, guardarColegios, guardarPerfil, useColegios, usePerfil, type Colegio } from '../app/perfil'
import { useStore } from '../app/store'
import { ElegirCursos, ElegirGrados, ElegirTipo } from '../components/GradosCursos'
import { Boton } from '../components/ui'

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-2xl font-bold sm:text-3xl">{titulo}</h2>
      {children}
    </section>
  )
}

const campo = 'h-12 w-full rounded-xl border-2 border-line bg-surface px-4 font-normal focus:border-ink focus:outline-none'

function TarjetaColegio({ colegio, n, cambiar, quitar }: { colegio: Colegio; n: number; cambiar: (c: Colegio) => void; quitar?: () => void }) {
  return (
    <article className="flex flex-col gap-5 rounded-3xl border border-line bg-surface p-5 sm:p-7">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-56 flex-1 flex-col gap-1.5 font-semibold">
          Colegio {n}
          <input
            value={colegio.nombre}
            onChange={(e) => cambiar({ ...colegio, nombre: e.target.value })}
            placeholder="I.E. N.º 2048 · San Juan de Lurigancho"
            maxLength={120}
            className={campo}
          />
        </label>
        <ElegirTipo
          valor={colegio.tipo}
          // En un público no existen los cursos partidos: se quitan los que ya no aplican.
          onChange={(tipo) => cambiar(colegioValido({ ...colegio, tipo }) ?? { ...colegio, tipo })}
        />
        {quitar && (
          <button
            type="button"
            onClick={quitar}
            className="grid size-11 cursor-pointer place-items-center rounded-xl text-ink-soft hover:bg-surface-2 hover:text-danger"
            aria-label={`Quitar el colegio ${n}`}
          >
            <Trash2 className="size-5" />
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <p className="font-semibold">Grados</p>
        <ElegirGrados valor={colegio.grados} onChange={(grados) => cambiar({ ...colegio, grados, cursos: colegioValido({ ...colegio, grados })?.cursos ?? colegio.cursos })} />
        {!colegio.grados.length && <p className="font-semibold text-warn">Elige al menos un grado.</p>}
      </div>
      <div className="flex flex-col gap-2">
        <p className="font-semibold">Cursos</p>
        <ElegirCursos grados={colegio.grados} tipo={colegio.tipo} valor={colegio.cursos} onChange={(cursos) => cambiar({ ...colegio, cursos })} />
      </div>
    </article>
  )
}

export function Perfil() {
  const { avisar } = useStore()
  const { entro, nombre: nombreCuenta } = useCuenta()
  const { perfil } = usePerfil()
  const guardados = useColegios()
  const conNombre = entro || !!perfil

  const inicial = { nombre: perfil?.nombre ?? (nombreCuenta ? `Profe ${nombreCuenta}` : ''), colegios: guardados }
  const [borrador, setBorrador] = useState(inicial)
  const [base, setBase] = useState(JSON.stringify(inicial))
  const [guardando, setGuardando] = useState(false)

  const cambios = JSON.stringify(borrador) !== base
  const completo = borrador.colegios.every((c) => c.grados.length) && (!conNombre || !!borrador.nombre.trim())
  const colegios = (cs: Colegio[]) => setBorrador({ ...borrador, colegios: cs })

  async function guardar() {
    setGuardando(true)
    const ok = perfil
      ? await guardarPerfil({ ...perfil, nombre: borrador.nombre.trim() }, borrador.colegios)
      : await guardarColegios(borrador.colegios)
    setGuardando(false)
    setBase(JSON.stringify(borrador))
    avisar(ok ? 'Guardado.' : 'Quedó guardado en esta computadora; no pudimos subirlo. Prueba de nuevo más tarde.', ok ? 'ok' : 'error')
  }

  return (
    <>
      {/* Guardar arriba y siempre a la vista: en el celular, debajo de la barra del tema. */}
      <header className="sticky top-14 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 bg-bg/90 px-4 py-3 backdrop-blur lg:top-0 print:hidden">
        <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">Mi perfil</h1>
        <Boton tam="lg" onClick={guardar} disabled={!cambios || !completo} cargando={guardando}>
          {!cambios && !guardando ? (
            <>
              <Check className="size-5" aria-hidden /> Guardado
            </>
          ) : (
            'Guardar'
          )}
        </Boton>
      </header>

      {conNombre && (
        <Seccion titulo="¿Cómo te llaman tus alumnos?">
          <input
            value={borrador.nombre}
            onChange={(e) => setBorrador({ ...borrador, nombre: e.target.value })}
            placeholder="Profe Rosa"
            maxLength={60}
            aria-label="Tu nombre en clase"
            className={`${campo} max-w-md`}
          />
        </Seccion>
      )}

      <Seccion titulo="¿Dónde enseñas?">
        {borrador.colegios.map((c, i) => (
          <TarjetaColegio
            key={i}
            n={i + 1}
            colegio={c}
            cambiar={(nuevo) => colegios(borrador.colegios.map((x, j) => (j === i ? nuevo : x)))}
            quitar={borrador.colegios.length > 1 ? () => colegios(borrador.colegios.filter((_, j) => j !== i)) : undefined}
          />
        ))}
        {borrador.colegios.length < 6 && (
          <button
            type="button"
            onClick={() => colegios([...borrador.colegios, COLEGIO_NUEVO])}
            className="flex h-14 cursor-pointer items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-line font-semibold text-ink-soft transition hover:border-ink-soft hover:text-ink"
          >
            <Plus className="size-5" aria-hidden /> Agregar otro colegio
          </button>
        )}
      </Seccion>
    </>
  )
}
