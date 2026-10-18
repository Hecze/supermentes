// 2 · Dar la clase: la guía minuto a minuto con el material del tema y, aparte, la sesión en formato MINEDU.
import { ChevronRight, Presentation } from 'lucide-react'
import { HERRAMIENTAS } from '../app/herramientas'
import { useStore } from '../app/store'
import { SinTema } from '../components/Shell'
import { GuiaClase } from './GuiaClase'

export function Clase() {
  const { ficha, ir } = useStore()
  if (!ficha) return <SinTema />
  const sesion = HERRAMIENTAS.sesion
  return (
    <>
      <header className="flex items-center gap-4 print:hidden">
        <span className="grid size-14 place-items-center rounded-2xl" style={{ background: `color-mix(in srgb, ${sesion.color} 14%, transparent)` }}>
          <Presentation className="size-7" style={{ color: sesion.color }} aria-hidden />
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">Dar la clase</h1>
          <p className="text-ink-soft">
            «{ficha.titulo}» · {ficha.grado}
          </p>
        </div>
      </header>
      <GuiaClase ficha={ficha} />
      <button
        type="button"
        onClick={() => ir('sesion')}
        className="group flex items-center gap-4 rounded-2xl border-2 border-line bg-surface p-4 text-left transition hover:border-ink sm:p-5 print:hidden"
      >
        <sesion.icono className="size-7 shrink-0" style={{ color: sesion.color }} aria-hidden />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-semibold">Tu sesión de aprendizaje para el director</span>
          <span className="text-ink-soft">En el formato del MINEDU, con competencias, criterios y tiempos.</span>
        </span>
        <ChevronRight className="size-5 text-ink-soft transition group-hover:translate-x-0.5" aria-hidden />
      </button>
    </>
  )
}
