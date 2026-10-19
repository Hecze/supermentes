// Onboarding (flujo "entrar y primer tema" en pen): solo la primera vez que entra con su cuenta.
// 1 · cómo la llaman, 2 · qué enseña (grados y cursos), 3 · el tema de mañana. Termina con su primera clase lista.
import { ArrowRight, Search } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useCuenta } from '../app/cuenta'
import { ENSENANZA_INICIAL, guardarPerfil, type Ensenanza } from '../app/perfil'
import { useStore } from '../app/store'
import { tieneBanco } from '../banco/banco'
import { ElegirCursos, ElegirGrados } from '../components/GradosCursos'
import { Logo } from '../components/Logo'
import { cx } from '../components/ui'
import { sugerenciasPara } from '../curriculo/buscar'
import { GRADOS_CURRICULO, nivelDe } from '../curriculo/catalogo'
import { useCurriculo } from '../curriculo/cargar'

const COLORES: Record<string, string> = {
  comunicacion: 'var(--cancion)',
  matematica: 'var(--examen)',
  'ciencia-y-tecnologia': 'var(--juego)',
  'personal-social': 'var(--crucigrama)',
}

function Paso({ n, children }: { n: number; children: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col bg-bg px-6 py-8 text-ink sm:px-12 sm:py-12">
      <header className="flex items-center justify-between gap-4">
        <Logo />
        <span className="flex items-center gap-3 text-sm text-ink-soft">
          Paso {n} de 3
          <span className="flex gap-1.5" aria-hidden>
            {[1, 2, 3].map((i) => (
              <span key={i} className={cx('h-2.5 rounded-full', i === n ? 'w-8' : 'w-2.5', i <= n ? 'bg-ok' : 'bg-line')} />
            ))}
          </span>
        </span>
      </header>
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 py-10 text-center">{children}</div>
    </main>
  )
}

function Seguir({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      className="inline-flex h-15 w-full max-w-sm items-center justify-center gap-2.5 rounded-2xl bg-ok px-6 text-lg font-semibold text-white hover:opacity-90 disabled:opacity-50"
      {...rest}
    >
      {children} <ArrowRight className="size-5" aria-hidden />
    </button>
  )
}

const titulo = 'font-display text-4xl font-bold leading-tight sm:text-5xl'

export function Onboarding() {
  const cuenta = useCuenta()
  const { abrirNuevoTema } = useStore()
  const [paso, setPaso] = useState(1)
  const [nombre, setNombre] = useState(cuenta.nombre ? `Profe ${cuenta.nombre}` : '')
  const [colegio, setColegio] = useState('')
  const [ensenanza, setEnsenanza] = useState<Ensenanza>(ENSENANZA_INICIAL)
  // Los temas del paso 3 salen de su primer grado (y de sus cursos).
  const grado = ensenanza.grados[0] ?? 'primaria-4'
  const cur = useCurriculo(nivelDe(grado), grado)
  const corto = GRADOS_CURRICULO.find((g) => g.id === grado)?.corto ?? ''
  const temas = cur.estado === 'listo' ? sugerenciasPara([cur.grado], ensenanza.cursos, { [grado]: corto }, 4) : []

  function terminar(previo: Parameters<typeof abrirNuevoTema>[0]) {
    guardarPerfil({ nombre: nombre.trim(), colegio: colegio.trim() || undefined, grado, grados: ensenanza.grados, cursos: ensenanza.cursos })
    abrirNuevoTema(previo)
  }

  if (paso === 1) {
    return (
      <Paso n={1}>
        <p className="text-lg text-ink-soft">¡Bienvenida a Supermentes! 🎉</p>
        <h1 className={titulo}>¿Cómo te llaman tus alumnos?</h1>
        <p className="text-lg text-ink-soft">Así te saludamos en Supermentes.</p>
        <form
          className="flex w-full max-w-xl flex-col items-center gap-5"
          onSubmit={(e) => {
            e.preventDefault()
            if (nombre.trim()) setPaso(2)
          }}
        >
          <label className="flex w-full flex-col gap-2 text-left font-semibold">
            Tu nombre en clase
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Profe Rosa"
              maxLength={60}
              autoFocus
              className="h-16 rounded-2xl border-2 border-ink bg-surface px-5 text-xl font-normal"
            />
          </label>
          <label className="flex w-full flex-col gap-2 text-left font-semibold">
            Tu colegio (opcional)
            <input
              value={colegio}
              onChange={(e) => setColegio(e.target.value)}
              placeholder="I.E. N.º 2048 · San Juan de Lurigancho"
              maxLength={120}
              className="h-16 rounded-2xl border-2 border-line bg-surface px-5 text-xl font-normal"
            />
          </label>
          {cuenta.nombre && <p className="text-sm text-ink-soft">Lo tomamos de tu cuenta; cámbialo si quieres.</p>}
          <Seguir disabled={!nombre.trim()}>Seguir</Seguir>
        </form>
      </Paso>
    )
  }

  if (paso === 2) {
    return (
      <Paso n={2}>
        <p className="text-lg text-ink-soft">Hola, {nombre.trim()} 👋</p>
        <h1 className={titulo}>¿Qué enseñas?</h1>
        <p className="text-lg text-ink-soft">Así te mostramos primero los temas del Currículo Nacional de tus grados y cursos.</p>
        <form
          className="flex w-full flex-col items-center gap-6 text-left"
          onSubmit={(e) => {
            e.preventDefault()
            if (ensenanza.grados.length) setPaso(3)
          }}
        >
          <div className="flex w-full flex-col gap-3">
            <p className="font-semibold">Tus grados (todos los que quieras)</p>
            <ElegirGrados valor={ensenanza.grados} onChange={(grados) => setEnsenanza({ ...ensenanza, grados })} />
          </div>
          <div className="flex w-full flex-col gap-3">
            <p className="font-semibold">Tus cursos</p>
            <ElegirCursos grados={ensenanza.grados} valor={ensenanza.cursos} onChange={(cursos) => setEnsenanza({ ...ensenanza, cursos })} />
          </div>
          <Seguir disabled={!ensenanza.grados.length}>Seguir</Seguir>
          <p className="text-sm text-ink-soft">Puedes cambiarlo cuando quieras en «Mi perfil».</p>
        </form>
      </Paso>
    )
  }

  return (
    <Paso n={3}>
      <p className="text-lg text-ink-soft">Último paso, {nombre.trim()}</p>
      <h1 className={titulo}>¿Qué tema toca mañana?</h1>
      <button
        type="button"
        onClick={() => terminar({ gradoId: grado })}
        className="flex w-full items-center gap-3 rounded-2xl border-2 border-ink bg-surface px-5 py-4 text-left text-lg text-ink-soft hover:shadow-md"
      >
        <Search className="size-6 shrink-0 text-ink" aria-hidden />
        <span className="truncate">Escribe tu tema: fracciones, los refranes, el ciclo del agua…</span>
      </button>
      {temas.length > 0 && (
        <>
          <p className="text-ink-soft">o elige uno de {corto}{temas.every((t) => tieneBanco(t.gradoId, t.areaId)) ? ', ya listo' : ''}:</p>
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {temas.map((t) => (
              <button
                key={`${t.areaId}-${t.tema}`}
                type="button"
                onClick={() => terminar({ texto: t.tema, gradoId: t.gradoId, areaId: t.areaId, indiceCompetencia: t.indiceCompetencia })}
                className="flex min-h-40 flex-col items-start gap-2 rounded-2xl border-2 border-line bg-surface p-4 text-left transition hover:-translate-y-0.5 hover:border-ink"
              >
                <span className="text-xs font-semibold" style={{ color: COLORES[t.areaId] }}>
                  {t.area}
                </span>
                <span className="font-display text-xl font-bold leading-tight">{t.tema}</span>
                <span className="mt-auto text-sm text-ink-soft">{tieneBanco(t.gradoId, t.areaId) ? 'Juego · canción · examen ✓' : 'Listo en segundos'}</span>
              </button>
            ))}
          </div>
        </>
      )}
      <p className="text-sm text-ink-soft">Un clic y tu clase está lista. Siempre puedes buscar otro tema.</p>
    </Paso>
  )
}
