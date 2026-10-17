import { BookOpen, CircleAlert, CircleCheck, Coins, House, Info, Library, Moon, Plus, Sun } from 'lucide-react'
import type { ReactNode } from 'react'
import { CREDITOS_MENSUALES, MODO_EJEMPLO, type HerramientaId } from '../api'
import { DOCENTE } from '../api/ejemplos'
import { HERRAMIENTAS, ORDEN_HERRAMIENTAS } from '../app/herramientas'
import { useStore, type Vista } from '../app/store'
import { Boton, IconoHerramienta, cx } from './ui'

/** Cinco plumones en su estuche: uno por herramienta. */
export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-8 items-end gap-[3px] rounded-lg border border-line bg-surface-2 px-1.5 pb-1" aria-hidden>
        {ORDEN_HERRAMIENTAS.map((id, i) => (
          <span key={id} className="w-[4px] rounded-full" style={{ background: HERRAMIENTAS[id].color, height: [18, 14, 20, 12, 16][i] }} />
        ))}
      </span>
      <span className="font-display text-xl font-bold tracking-tight">Supermentes</span>
    </span>
  )
}

function Creditos() {
  const { creditos } = useStore()
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-warn/12 px-3 py-1 text-sm font-medium text-warn tabular-nums"
      title={`Te quedan ${creditos} de ${CREDITOS_MENSUALES} créditos este mes`}
    >
      <Coins className="size-4" aria-hidden />
      {creditos}
      <span className="sr-only"> créditos</span>
    </span>
  )
}

function BotonTema() {
  const { tema, cambiarTema } = useStore()
  const oscuro = tema === 'dark'
  return (
    <button
      type="button"
      onClick={cambiarTema}
      className="inline-flex size-9 items-center justify-center rounded-xl text-ink-soft hover:bg-surface-2 hover:text-ink"
      aria-label={oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
    >
      {oscuro ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  )
}

function ItemNav({ vista, icono, children }: { vista: Vista; icono: ReactNode; children: ReactNode }) {
  const { ir, vista: actual } = useStore()
  const activo = actual === vista
  return (
    <button
      type="button"
      onClick={() => ir(vista)}
      aria-current={activo ? 'page' : undefined}
      className={cx(
        'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-1.5 text-left transition',
        activo ? 'bg-surface-2 font-semibold text-ink' : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
      )}
    >
      {icono}
      {children}
    </button>
  )
}

export function Shell({ children }: { children: ReactNode }) {
  const { vista, ir, ficha } = useStore()
  const enHerramienta = (ORDEN_HERRAMIENTAS as string[]).includes(vista)

  return (
    <div className="min-h-dvh lg:pl-72 print:pl-0">
      {/* Barra lateral (escritorio) */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col gap-5 overflow-y-auto border-r border-line bg-surface px-4 py-5 lg:flex print:hidden"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)' }}
      >
        <button type="button" onClick={() => ir('inicio')} className="self-start rounded-lg">
          <Logo />
        </button>

        <Boton variante="contorno" onClick={() => ir('inicio')} className="justify-start">
          <Plus className="size-5" aria-hidden /> Nuevo tema
        </Boton>

        {ficha && (
          <button
            type="button"
            onClick={() => ir('ficha')}
            aria-current={vista === 'ficha' ? 'page' : undefined}
            className={cx(
              'flex flex-col gap-0.5 rounded-xl border-2 px-3 py-2.5 text-left transition',
              vista === 'ficha' ? 'border-ink' : 'border-line hover:border-ink-soft',
            )}
          >
            <span className="text-xs text-ink-soft">Tu tema</span>
            <span className="line-clamp-2 font-semibold leading-snug">{ficha.titulo}</span>
            <span className="text-sm text-ink-soft">{ficha.grado}</span>
          </button>
        )}

        <nav className="flex flex-col gap-1" aria-label="Herramientas">
          <p className="px-3 pb-1 text-sm text-ink-soft">Herramientas</p>
          {ORDEN_HERRAMIENTAS.map((id: HerramientaId) => (
            <ItemNav key={id} vista={id} icono={<IconoHerramienta id={id} tam="sm" />}>
              {HERRAMIENTAS[id].nombre}
            </ItemNav>
          ))}
        </nav>

        <nav className="flex flex-col gap-1 border-t border-line pt-4" aria-label="Más">
          <ItemNav vista="biblioteca" icono={<Library className="size-5" />}>
            Biblioteca
          </ItemNav>
        </nav>

        <div className="mt-auto flex flex-col gap-3 border-t border-line pt-4">
          <div className="flex items-center justify-between">
            <Creditos />
            <BotonTema />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Prof. {DOCENTE.nombre}</p>
            <p className="truncate text-xs text-ink-soft">{DOCENTE.colegio}</p>
          </div>
          {MODO_EJEMPLO && (
            <p className="flex items-start gap-1.5 text-xs text-ink-soft">
              <Info className="mt-px size-3.5 shrink-0" aria-hidden />
              Prototipo con datos de ejemplo.
            </p>
          )}
        </div>
      </aside>

      {/* Barra superior (celular) */}
      <header
        className="gutter sticky z-30 flex h-14 items-center justify-between border-b border-line bg-surface lg:hidden print:hidden"
        style={{ top: 'env(safe-area-inset-top, 0px)' }}
      >
        <button type="button" onClick={() => ir('inicio')} className="rounded-lg">
          <Logo />
        </button>
        <div className="flex items-center gap-1">
          <Creditos />
          <BotonTema />
        </div>
      </header>

      <main className="gutter pb-28 pt-6 lg:pb-16 lg:pt-10 print:p-0">
        <div className="mx-auto flex max-w-4xl flex-col gap-7">{children}</div>
      </main>

      {/* Barra inferior (celular) */}
      <nav
        className="gutter fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-line bg-surface lg:hidden print:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label="Principal"
      >
        {(
          [
            ['inicio', 'Nuevo tema', House],
            ['ficha', 'Mi tema', BookOpen],
            ['biblioteca', 'Biblioteca', Library],
          ] as const
        ).map(([v, texto, Icono]) => {
          const activo = vista === v || (v === 'ficha' && enHerramienta)
          return (
            <button
              key={v}
              type="button"
              onClick={() => ir(v)}
              aria-current={activo ? 'page' : undefined}
              className={cx('flex h-16 flex-col items-center justify-center gap-1 text-xs', activo ? 'font-semibold text-ink' : 'text-ink-soft')}
            >
              <Icono className="size-5" aria-hidden />
              {texto}
            </button>
          )
        })}
      </nav>

      <Avisos />
    </div>
  )
}

function Avisos() {
  const { avisos } = useStore()
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-40 flex flex-col items-center gap-2 px-4 lg:left-auto lg:right-6 lg:items-end print:hidden"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 84px)' }}
      aria-live="polite"
    >
      {avisos.map((a) => (
        <div
          key={a.id}
          className="aviso-entra pointer-events-auto flex max-w-sm items-start gap-2 rounded-xl bg-primary px-4 py-3 text-sm text-primary-ink shadow-lg"
        >
          {a.tono === 'error' ? (
            <CircleAlert className="mt-px size-4 shrink-0" aria-hidden />
          ) : a.tono === 'ok' ? (
            <CircleCheck className="mt-px size-4 shrink-0" aria-hidden />
          ) : (
            <Info className="mt-px size-4 shrink-0" aria-hidden />
          )}
          {a.texto}
        </div>
      ))}
    </div>
  )
}

/** Encabezado común de cada herramienta: de qué tema es y qué herramienta estás usando. */
export function EncabezadoHerramienta({ id }: { id: HerramientaId }) {
  const { ficha, ir } = useStore()
  const h = HERRAMIENTAS[id]
  return (
    <header className="flex items-center gap-4 print:hidden">
      <IconoHerramienta id={id} tam="lg" />
      <div className="min-w-0">
        {ficha && (
          <button type="button" onClick={() => ir('ficha')} className="max-w-full truncate rounded text-left text-sm text-ink-soft hover:text-ink lg:hidden">
            {ficha.titulo} · {ficha.grado}
          </button>
        )}
        <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{h.nombre}</h1>
      </div>
    </header>
  )
}

/** Lo que ve una herramienta si todavía no hay tema preparado. */
export function SinTema() {
  const { ir } = useStore()
  return (
    <div className="flex flex-col items-start gap-4 rounded-2xl border border-dashed border-line bg-surface p-6">
      <h2 className="font-display text-2xl font-bold">Primero, cuéntanos qué vas a enseñar</h2>
      <p className="max-w-xl text-ink-soft">Escribe el tema o sácale una foto a la página del libro. Con eso preparamos todo lo demás.</p>
      <Boton tam="lg" onClick={() => ir('inicio')}>
        Empezar
      </Boton>
    </div>
  )
}
