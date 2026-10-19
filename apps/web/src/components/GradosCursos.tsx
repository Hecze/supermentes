// Elegir grados y cursos: en "Mi perfil", en el onboarding y como filtro del buscador de temas.
// Lo común se hace con un clic: "Toda primaria" (la docente de aula) o un curso en varios grados (secundaria).
import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { GRADOS_DOCENTE, NIVELES_DOCENTE, cursosDe, nombreCursos, nombreGrados } from '../curriculo/catalogo'
import { cx } from './ui'

function Opcion({ activo, onClick, children, ancho }: { activo: boolean; onClick: () => void; children: ReactNode; ancho?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={cx(
        'inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border-2 font-semibold transition',
        ancho ? 'px-4' : 'px-3',
        activo ? 'border-primary bg-primary text-primary-ink' : 'border-line bg-surface text-ink hover:border-ink-soft',
      )}
    >
      {activo && <Check className="size-4 shrink-0" aria-hidden />}
      {children}
    </button>
  )
}

/** Grados por nivel; "Toda primaria" marca (o desmarca) los seis de una vez. */
export function ElegirGrados({ valor, onChange }: { valor: string[]; onChange: (grados: string[]) => void }) {
  const orden = (ids: string[]) => GRADOS_DOCENTE.filter((g) => ids.includes(g.id)).map((g) => g.id)
  return (
    <div className="flex flex-col gap-4">
      {NIVELES_DOCENTE.map((n) => {
        const del = GRADOS_DOCENTE.filter((g) => g.nivel === n.id)
        const todos = del.every((g) => valor.includes(g.id))
        return (
          <div key={n.id} className="flex flex-col gap-2" role="group" aria-label={n.nombre}>
            <p className="text-sm font-semibold text-ink-soft">{n.nombre}</p>
            <div className="flex flex-wrap gap-2">
              <Opcion
                ancho
                activo={todos}
                onClick={() => onChange(todos ? valor.filter((id) => !del.some((g) => g.id === id)) : orden([...valor, ...del.map((g) => g.id)]))}
              >
                Toda {n.nombre.toLowerCase()}
              </Opcion>
              {del.map((g) => {
                const activo = valor.includes(g.id)
                return (
                  <Opcion key={g.id} activo={activo} onClick={() => onChange(activo ? valor.filter((id) => id !== g.id) : orden([...valor, g.id]))}>
                    {g.corto.split(' ')[0]}
                  </Opcion>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** "Todos los cursos" o los que elija; los cursos que se ofrecen son los de los niveles de sus grados. */
export function ElegirCursos({ grados, valor, onChange }: { grados: string[]; valor: string[]; onChange: (cursos: string[]) => void }) {
  const cursos = cursosDe(grados)
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Cursos">
      <Opcion ancho activo={!valor.length} onClick={() => onChange([])}>
        Todos los cursos
      </Opcion>
      {cursos.map((a) => {
        const activo = valor.includes(a.id)
        return (
          <Opcion
            key={a.id}
            activo={activo}
            onClick={() => onChange(activo ? valor.filter((id) => id !== a.id) : cursos.filter((c) => c.id === a.id || valor.includes(c.id)).map((c) => c.id))}
          >
            {a.nombre}
          </Opcion>
        )
      })}
    </div>
  )
}

/** Botón que muestra lo elegido y abre los chips debajo, como el filtro de una columna de Excel. */
function Filtro({ etiqueta, resumen, children }: { etiqueta: string; resumen: string; children: ReactNode }) {
  const [abierto, setAbierto] = useState(false)
  const caja = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return
    const fuera = (e: MouseEvent) => !caja.current?.contains(e.target as Node) && setAbierto(false)
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // Escape cierra el filtro, no la ventana del buscador.
      e.preventDefault()
      e.stopPropagation()
      setAbierto(false)
    }
    document.addEventListener('mousedown', fuera)
    document.addEventListener('keydown', tecla, true)
    return () => {
      document.removeEventListener('mousedown', fuera)
      document.removeEventListener('keydown', tecla, true)
    }
  }, [abierto])

  return (
    <div ref={caja} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        aria-expanded={abierto}
        className={cx(
          'flex h-11 max-w-full items-center gap-2 rounded-xl border-2 px-3 text-left transition',
          abierto ? 'border-ink' : 'border-line hover:border-ink-soft',
        )}
      >
        <span className="text-sm text-ink-soft">{etiqueta}:</span>
        <span className="truncate font-semibold">{resumen}</span>
        <ChevronDown className={cx('size-4 shrink-0 text-ink-soft transition', abierto && 'rotate-180')} aria-hidden />
      </button>
      {abierto && (
        <div className="absolute left-0 z-50 mt-2 w-[min(37rem,calc(100vw-2.5rem))] rounded-2xl border border-line bg-surface p-4 shadow-xl">
          {children}
          <div className="mt-4 flex justify-end">
            <button type="button" onClick={() => setAbierto(false)} className="h-10 rounded-xl bg-primary px-4 font-semibold text-primary-ink hover:opacity-90">
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function FiltroGrados({ valor, onChange }: { valor: string[]; onChange: (grados: string[]) => void }) {
  return (
    <Filtro etiqueta="Grados" resumen={nombreGrados(valor)}>
      <ElegirGrados valor={valor} onChange={onChange} />
    </Filtro>
  )
}

export function FiltroCursos({ grados, valor, onChange }: { grados: string[]; valor: string[]; onChange: (cursos: string[]) => void }) {
  return (
    <Filtro etiqueta="Cursos" resumen={nombreCursos(valor)}>
      <ElegirCursos grados={grados} valor={valor} onChange={onChange} />
    </Filtro>
  )
}
