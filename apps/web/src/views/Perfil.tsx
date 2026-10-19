// Mi perfil: lo que enseña la docente (grados y cursos) y cómo la llaman. El buscador de temas abre con sus
// grados y cursos, así casi nunca tiene que filtrar; para un imprevisto (suplir a otro profe) usa los filtros del
// buscador sin cambiar esto. Se guarda solo, sin botón.
import { Check, Search } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useCuenta } from '../app/cuenta'
import { ensenanzaValida, guardarEnsenanza, guardarPerfil, useEnsenanza, usePerfil, type Ensenanza } from '../app/perfil'
import { useStore } from '../app/store'
import { ElegirCursos, ElegirGrados } from '../components/GradosCursos'
import { Boton } from '../components/ui'
import { nombreCursos, nombreGrados } from '../curriculo/catalogo'

function Seccion({ titulo, ayuda, children }: { titulo: string; ayuda: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-5 sm:p-7">
      <div>
        <h2 className="font-display text-2xl font-bold">{titulo}</h2>
        <p className="text-ink-soft">{ayuda}</p>
      </div>
      {children}
    </section>
  )
}

function Guardado({ visible }: { visible: boolean }) {
  return (
    <p className="flex h-6 items-center gap-1.5 text-sm font-semibold text-ok" aria-live="polite">
      {visible && (
        <>
          <Check className="size-4" aria-hidden /> Guardado
        </>
      )}
    </p>
  )
}

export function Perfil() {
  const { abrirNuevoTema } = useStore()
  const { entro, nombre: nombreCuenta } = useCuenta()
  const { perfil } = usePerfil()
  const guardada = useEnsenanza()
  // Mientras elige puede quedarse sin grados; se guarda solo cuando hay al menos uno.
  const [ensenanza, setEnsenanza] = useState<Ensenanza>(guardada)
  const [guardo, setGuardo] = useState(false)
  const [nombre, setNombre] = useState(perfil?.nombre ?? (nombreCuenta ? `Profe ${nombreCuenta}` : ''))
  const [colegio, setColegio] = useState(perfil?.colegio ?? '')

  function cambiar(e: Ensenanza) {
    setEnsenanza(e)
    const valida = ensenanzaValida(e)
    setGuardo(!!valida)
    if (valida) guardarEnsenanza(valida)
  }

  function guardarNombre() {
    if (!nombre.trim()) return
    guardarPerfil({ ...perfil, nombre: nombre.trim(), colegio: colegio.trim() || undefined, grado: guardada.grados[0], grados: guardada.grados, cursos: guardada.cursos })
  }

  const sinGrados = !ensenanza.grados.length

  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">Mi perfil</h1>
        <p className="max-w-2xl text-lg text-ink-soft">Dinos qué enseñas y te mostramos primero esos temas. Puedes elegir varios grados y cursos.</p>
      </header>

      <Seccion titulo="¿Qué grados enseñas?" ayuda="«Toda primaria» o «Toda secundaria» los marca de una vez.">
        <ElegirGrados valor={ensenanza.grados} onChange={(grados) => cambiar({ ...ensenanza, grados })} />
        {sinGrados && <p className="font-semibold text-warn">Elige al menos un grado.</p>}
      </Seccion>

      <Seccion titulo="¿Qué cursos?" ayuda="En primaria casi siempre son todos. En secundaria, elige tu curso (o tus cursos).">
        <ElegirCursos grados={ensenanza.grados} valor={ensenanza.cursos} onChange={(cursos) => cambiar({ ...ensenanza, cursos })} />
      </Seccion>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <Boton tam="lg" onClick={() => abrirNuevoTema()} disabled={sinGrados}>
          <Search className="size-5" aria-hidden /> Buscar un tema
        </Boton>
        <div>
          <p className="text-ink-soft">
            Al buscar verás temas de <strong className="text-ink">{nombreGrados(guardada.grados)}</strong> ·{' '}
            <strong className="text-ink">{nombreCursos(guardada.cursos)}</strong>.
          </p>
          <Guardado visible={guardo} />
        </div>
      </div>

      {(entro || perfil) && (
        <Seccion titulo="Cómo te llaman" ayuda="Así te saludamos en Supermentes.">
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault()
              guardarNombre()
            }}
          >
            <label className="flex flex-col gap-1.5 font-semibold">
              Tu nombre en clase
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                onBlur={guardarNombre}
                placeholder="Profe Rosa"
                maxLength={60}
                className="h-12 rounded-xl border-2 border-line bg-surface px-4 font-normal focus:border-ink focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1.5 font-semibold">
              Tu colegio (opcional)
              <input
                value={colegio}
                onChange={(e) => setColegio(e.target.value)}
                onBlur={guardarNombre}
                placeholder="I.E. N.º 2048 · San Juan de Lurigancho"
                maxLength={120}
                className="h-12 rounded-xl border-2 border-line bg-surface px-4 font-normal focus:border-ink focus:outline-none"
              />
            </label>
          </form>
        </Seccion>
      )}
    </>
  )
}
