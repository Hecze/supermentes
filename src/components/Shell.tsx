import { ArrowLeft, BookOpen, CircleAlert, CircleCheck, Coins, House, Info, Library, Moon, Sun } from 'lucide-react'
import type { ReactNode } from 'react'
import { CREDITOS_MENSUALES, MODO_EJEMPLO, type HerramientaId } from '../api'
import { DOCENTE } from '../api/ejemplos'
import { HERRAMIENTAS, ORDEN_HERRAMIENTAS } from '../app/herramientas'
import { useStore, type Vista } from '../app/store'
import { Boton, IconoHerramienta, cx } from './ui'

/** Cinco plumones en su estuche: uno por herramienta. */
export function Logo({ compacto }: { compacto?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-8 items-end gap-[3px] rounded-lg border border-line bg-surface-2 px-1.5 pb-1" aria-hidden>
        {ORDEN_HERRAMIENTAS.map((id, i) => (
          <span key={id} className="w-[4px] rounded-full" style={{ background: HERRAMIENTAS[id].color, height: [18, 14, 20, 12, 16][i] }} />
        ))}
      </span>
      {!compacto && <span className="font-display text-xl font-bold tracking-tight">Supermentes</span>}
    </span>
  )
}

function Creditos({ className }: { className?: string }) {
  const { creditos } = useStore()
  return (
    <span
      className={cx('inline-flex items-center gap-1.5 rounded-full bg-warn/12 px-3 py-1 text-sm font-medium text-warn tabular-nums', className)}
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
      aria-label={oscuro ? 'Cambiar a cuaderno (tema claro)' : 'Cambiar a pizarra (tema oscuro)'}
      title={oscuro ? 'Cuaderno' : 'Pizarra'}
    >
      {oscuro ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  )
}

function ItemNav({ vista, icono, children, activo }: { vista: Vista; icono: ReactNode; children: ReactNode; activo: boolean }) {
  const { ir } = useStore()
  return (
    <button
      type="button"
      onClick={() => ir(vista)}
      aria-current={activo ? 'page' : undefined}
      className={cx(
        'flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] transition',
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
    <div className="min-h-dvh lg:pl-64">
      {/* Barra lateral (escritorio) */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-6 border-r border-line bg-surface px-4 py-5 lg:flex"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)' }}
      >
        <button type="button" onClick={() => ir('inicio')} className="self-start rounded-lg">
          <Logo />
        </button>
        <nav className="flex flex-col gap-1" aria-label="Principal">
          <ItemNav vista="inicio" icono={<House className="size-5" />} activo={vista === 'inicio'}>
            Inicio
          </ItemNav>
          <ItemNav vista="ficha" icono={<BookOpen className="size-5" />} activo={vista === 'ficha'}>
            Tema actual
          </ItemNav>
          <ItemNav vista="biblioteca" icono={<Library className="size-5" />} activo={vista === 'biblioteca'}>
            Biblioteca
          </ItemNav>
        </nav>
        <div className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">Herramientas</p>
          {ORDEN_HERRAMIENTAS.map((id: HerramientaId) => (
            <ItemNav key={id} vista={id} icono={<IconoHerramienta id={id} tam="sm" />} activo={vista === id}>
              {HERRAMIENTAS[id].nombre}
            </ItemNav>
          ))}
        </div>
        <div className="mt-auto flex flex-col gap-3 border-t border-line pt-4">
          <div className="flex items-center justify-between">
            <Creditos />
            <BotonTema />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Prof. {DOCENTE.nombre}</p>
            <p className="truncate text-xs text-ink-soft">{DOCENTE.colegio}</p>
          </div>
        </div>
      </aside>

      {/* Barra superior (celular) */}
      <header
        className="gutter sticky z-30 flex h-14 items-center justify-between border-b border-line bg-surface lg:hidden"
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

      <main className="gutter pb-28 pt-5 lg:pb-14 lg:pt-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          {MODO_EJEMPLO && (
            <p className="flex items-start gap-2 rounded-xl border border-dashed border-line bg-surface/70 px-3 py-2 text-xs text-ink-soft">
              <Info className="mt-px size-4 shrink-0" aria-hidden />
              Prototipo con datos de ejemplo: todavía no se llama a ninguna IA y los créditos no son reales.
            </p>
          )}
          {enHerramienta && ficha && (
            <button
              type="button"
              onClick={() => ir('ficha')}
              className="-mb-2 inline-flex items-center gap-1.5 self-start rounded-lg text-sm text-ink-soft hover:text-ink"
            >
              <ArrowLeft className="size-4" aria-hidden />
              {ficha.titulo} · {ficha.grado}
            </button>
          )}
          {children}
        </div>
      </main>

      {/* Barra inferior (celular) */}
      <nav
        className="gutter fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-line bg-surface lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label="Principal"
      >
        {(
          [
            ['inicio', 'Inicio', House],
            ['ficha', 'Tema', BookOpen],
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
      className="pointer-events-none fixed inset-x-0 z-40 flex flex-col items-center gap-2 px-4 lg:left-auto lg:right-6 lg:items-end"
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

/** Encabezado común de cada herramienta. */
export function EncabezadoHerramienta({ id, children }: { id: HerramientaId; children?: ReactNode }) {
  const h = HERRAMIENTAS[id]
  return (
    <header className="flex flex-wrap items-start gap-4">
      <IconoHerramienta id={id} tam="lg" />
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{h.nombre}</h1>
        <p className="mt-1 max-w-2xl text-ink-soft">{h.descripcion}</p>
      </div>
      {children}
    </header>
  )
}

/** Lo que ve una herramienta si todavía no hay tema preparado. */
export function SinTema() {
  const { ir } = useStore()
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-line bg-surface p-6">
      <h2 className="font-display text-2xl font-bold">Primero, cuéntanos qué vas a enseñar</h2>
      <p className="max-w-xl text-ink-soft">
        Cada herramienta parte de la ficha de tu tema. Escríbelo, díctalo o sácale una foto a la página del libro.
      </p>
      <Boton onClick={() => ir('inicio')}>Preparar un tema</Boton>
    </div>
  )
}
