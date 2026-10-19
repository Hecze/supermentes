import { BookMarked, CircleAlert, CircleCheck, Info, Library, LoaderCircle, Menu, Moon, Search, Sun, UserRound, X, type LucideProps } from 'lucide-react'
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { MODO_EJEMPLO, type HerramientaId } from '../api'
import { DOCENTE } from '../api/ejemplos'
import { useCuenta } from '../app/cuenta'
import { useColegios, useEnsenanza, usePerfil } from '../app/perfil'
import { HERRAMIENTAS } from '../app/herramientas'
import { useStore, type Vista } from '../app/store'
import { temaPorDefecto } from '../app/temaInstantaneo'
import { nombreCursos, nombreGrados } from '../curriculo/catalogo'
import { Logo } from './Logo'
import { NuevoTema } from './NuevoTema'
import { SelectorTema } from './SelectorTema'
import { Boton, IconoHerramienta, cx } from './ui'

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

function Docente() {
  const { entro, nombre, salir } = useCuenta()
  const { perfil } = usePerfil()
  if (!entro) {
    return (
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{perfil?.nombre ?? `Prof. ${DOCENTE.nombre}`}</p>
        <p className="truncate text-xs text-ink-soft">{perfil ? perfil.colegio : DOCENTE.colegio}</p>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{perfil?.nombre ?? nombre ?? ''}</p>
        {perfil?.colegio && <p className="truncate text-xs text-ink-soft">{perfil.colegio}</p>}
      </div>
      <button type="button" onClick={salir} className="text-xs text-ink-soft underline-offset-4 hover:underline">
        Salir
      </button>
    </div>
  )
}

type Seccion = { vista: Vista; nombre: string; icono: ComponentType<LucideProps>; color: string }
const herramienta = (id: HerramientaId): Seccion => ({ vista: id, ...HERRAMIENTAS[id] })

/** El menú, en este orden. Juego web y crucigrama no van aquí: se abren desde la ficha del tema. */
const MENU: Seccion[] = [
  { vista: 'curriculo', nombre: 'Currículo nacional', icono: BookMarked, color: 'var(--ink)' },
  herramienta('sesion'),
  herramienta('ejercicios'),
  herramienta('cancion'),
  { vista: 'recursos', nombre: 'Más recursos', icono: Library, color: 'var(--ink)' },
]

function ItemMenu({ s }: { s: Seccion }) {
  const { ir, vista } = useStore()
  const Icono = s.icono
  const activo = vista === s.vista
  return (
    <button
      type="button"
      onClick={() => ir(s.vista)}
      aria-current={activo ? 'page' : undefined}
      className={cx(
        'flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm transition',
        activo ? 'bg-surface-2 font-semibold text-ink' : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
      )}
    >
      <Icono className="size-4 shrink-0" style={{ color: s.color }} aria-hidden />
      <span className="truncate">{s.nombre}</span>
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

/** Lo que va en la barra lateral: en escritorio siempre visible, en el celular dentro del menú. */
function ContenidoLateral() {
  const { ir } = useStore()
  return (
    <>
      <button type="button" onClick={() => ir('ficha')} className="self-start rounded-lg">
        <Logo />
      </button>

      <SelectorTema />

      <nav className="flex flex-col gap-1" aria-label="Herramientas">
        <p className="px-3 pb-1 text-xs font-bold tracking-wider text-ink-soft">HERRAMIENTAS</p>
        {MENU.map((s) => (
          <ItemMenu key={s.vista} s={s} />
        ))}
      </nav>

      <nav className="flex flex-col gap-1 border-t border-line pt-4" aria-label="Más">
        <ItemNav vista="perfil" icono={<UserRound className="size-5" />}>
          <span className="flex min-w-0 flex-col">
            Mi perfil
            <LoQueEnsena />
          </span>
        </ItemNav>
      </nav>

      <div className="mt-auto flex flex-col gap-3 border-t border-line pt-4">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <Docente />
          </div>
          <BotonTema />
        </div>
        {MODO_EJEMPLO && (
          <p className="flex items-start gap-1.5 text-xs text-ink-soft">
            <Info className="mt-px size-3.5 shrink-0" aria-hidden />
            Prototipo con datos de ejemplo.
          </p>
        )}
      </div>
    </>
  )
}

/** Debajo de "Mi perfil": dónde enseña, para que sepa por qué el buscador muestra esos temas. */
function LoQueEnsena() {
  const colegios = useColegios()
  const [c] = colegios
  return (
    <span className="truncate text-xs font-normal text-ink-soft">
      {colegios.length > 1 ? `${colegios.length} colegios` : `${nombreGrados(c.grados)} · ${nombreCursos(c.cursos)}`}
    </span>
  )
}

/** Nunca falta un tema: si la docente no tiene ninguno, se crea el primero de lo que enseña (4.º de primaria al empezar). */
function useTemaSiempre() {
  const { ficha, nuevoTemaAbierto, setFicha, completarFicha } = useStore()
  const ensenanza = useEnsenanza()
  const creando = useRef(false)
  useEffect(() => {
    if (ficha || nuevoTemaAbierto || creando.current) return
    creando.current = true
    temaPorDefecto(ensenanza)
      .then((f) => {
        if (!f) return
        setFicha(f)
        completarFicha(f)
      })
      .catch(() => {})
      .finally(() => {
        creando.current = false
      })
  }, [ficha, nuevoTemaAbierto, ensenanza, setFicha, completarFicha])
}

export function Shell({ children }: { children: ReactNode }) {
  const { vista, ficha } = useStore()
  const [menu, setMenu] = useState(false)
  useTemaSiempre()

  // Al navegar o cambiar de tema, el menú del celular se cierra.
  useEffect(() => setMenu(false), [vista, ficha?.id])

  return (
    <div className="min-h-dvh lg:pl-72 print:pl-0">
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col gap-5 overflow-y-auto border-r border-line bg-surface px-4 py-5 lg:flex print:hidden"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)' }}
      >
        <ContenidoLateral />
      </aside>

      {/* Barra superior (celular): menú y tema actual */}
      <header
        className="gutter sticky z-30 flex h-14 items-center gap-1 border-b border-line bg-surface lg:hidden print:hidden"
        style={{ top: 'env(safe-area-inset-top, 0px)' }}
      >
        <button
          type="button"
          onClick={() => setMenu(true)}
          className="-ml-2 grid size-10 shrink-0 place-items-center rounded-xl hover:bg-surface-2"
          aria-label="Abrir menú"
        >
          <Menu className="size-6" />
        </button>
        <div className="min-w-0 flex-1">
          <SelectorTema compacto />
        </div>
      </header>

      {menu && (
        <div className="fixed inset-0 z-40 lg:hidden print:hidden">
          <button type="button" className="absolute inset-0 bg-black/45" onClick={() => setMenu(false)} aria-label="Cerrar menú" />
          <aside
            className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col gap-5 overflow-y-auto bg-surface px-4 py-5 shadow-2xl"
            style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)', paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))' }}
          >
            <button type="button" onClick={() => setMenu(false)} className="absolute right-3 top-4 rounded-lg p-1.5 text-ink-soft hover:bg-surface-2" aria-label="Cerrar menú">
              <X className="size-5" />
            </button>
            <ContenidoLateral />
          </aside>
        </div>
      )}

      <main className="gutter pb-16 pt-6 lg:pt-10 print:p-0">
        <div className="mx-auto flex max-w-7xl flex-col gap-7">
          {/* Publicada sin VITE_API=real, la app solo muestra ejemplos: se avisa a la vista, nunca en silencio. */}
          {MODO_EJEMPLO && import.meta.env.PROD && (
            <p role="status" className="flex items-start gap-2 rounded-2xl bg-warn/12 px-4 py-3 text-warn print:hidden">
              <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
              <span>
                <strong>Versión de prueba:</strong> la IA no está conectada, así que ves ejemplos
                {import.meta.env.MODE !== 'artifact' && ' (falta VITE_API=real al publicar)'}.
              </span>
            </p>
          )}
          {children}
        </div>
      </main>

      <NuevoTema />
      <Avisos />
    </div>
  )
}

function Avisos() {
  const { avisos } = useStore()
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[60] flex flex-col items-center gap-2 px-4 lg:left-auto lg:right-6 lg:items-end print:hidden"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
      aria-live="polite"
    >
      {avisos.map((a) => (
        <div
          key={a.id}
          className="aviso-entra pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-xl bg-primary px-4 py-3 text-sm text-primary-ink shadow-lg"
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

/** Encabezado común de cada herramienta: qué herramienta es y de qué tema y currículo parte. */
/** Título de la herramienta; `accion` va arriba a la derecha (en el celular, debajo). */
export function EncabezadoHerramienta({ id, accion }: { id: HerramientaId; accion?: ReactNode }) {
  const { ficha, verCurriculo } = useStore()
  const h = HERRAMIENTAS[id]
  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-3 print:hidden">
      <IconoHerramienta id={id} tam="lg" />
      <div className="min-w-0 flex-1 basis-64">
        <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{h.nombre}</h1>
        {ficha && (
          <p className="text-ink-soft">
            A partir de «{ficha.titulo}» y del Currículo Nacional de {ficha.area}, {ficha.grado}.{' '}
            <button type="button" onClick={() => verCurriculo(ficha.gradoId, ficha.areaId)} className="underline underline-offset-4 hover:text-ink">
              Ver currículo
            </button>
          </p>
        )}
      </div>
      {accion && <div className="flex shrink-0 flex-wrap items-center gap-2">{accion}</div>}
    </header>
  )
}

/** Encabezado de las secciones que no son una herramienta del tema (Currículo nacional, Más recursos). */
export function EncabezadoSeccion({ icono: Icono, titulo, children }: { icono: ComponentType<LucideProps>; titulo: string; children?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-3 print:hidden">
      <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-surface-2">
        <Icono className="size-7" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 basis-64">
        <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{titulo}</h1>
        {children && <p className="text-ink-soft">{children}</p>}
      </div>
    </header>
  )
}

/** Lo que se ve el momento en que se prepara el primer tema (useTemaSiempre). */
export function SinTema() {
  const { abrirNuevoTema } = useStore()
  const { grados } = useEnsenanza()
  return (
    <div className="flex flex-col items-start gap-4 rounded-3xl border-2 border-dashed border-line bg-surface p-8">
      <p className="flex items-center gap-2 text-lg text-ink-soft">
        <LoaderCircle className="size-5 animate-spin" aria-hidden /> Preparando un tema de {nombreGrados(grados)}…
      </p>
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Tu clase, a partir del Currículo Nacional</h1>
      <Boton tam="lg" variante="contorno" onClick={() => abrirNuevoTema()}>
        <Search className="size-5" aria-hidden /> Buscar otro tema
      </Boton>
    </div>
  )
}
