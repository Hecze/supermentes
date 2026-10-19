// Mi perfil: su nombre completo (va en sus documentos) y dónde enseña. Cada colegio es público o privado y tiene sus grados y cursos (en un
// privado, Matemática se parte en Álgebra, Geometría…). El buscador de temas abre con los de su colegio. Nada se
// guarda hasta tocar «Guardar» (arriba, siempre a la vista): una sola petición a la base.
import { Check, ImagePlus, Plus, Trash2 } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { cargarImagen, esCuadrada, logoRecortado } from '../app/documento'
import { useCuenta } from '../app/cuenta'
import { COLEGIO_NUEVO, colegioValido, guardarColegios, guardarPerfil, useColegios, usePerfil, type Colegio } from '../app/perfil'
import { useStore } from '../app/store'
import { ElegirCursos, ElegirGrados, ElegirTipo } from '../components/GradosCursos'
import { RecortarLogo } from '../components/RecortarLogo'
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

/** El logo para el encabezado de sus documentos, siempre cuadrado: si la imagen no lo es, se recorta en una ventana. */
function Logo({ logo, cambiar }: { logo?: string; cambiar: (logo?: string) => void }) {
  const entrada = useRef<HTMLInputElement>(null)
  const { avisar } = useStore()
  const [recortar, setRecortar] = useState<HTMLImageElement | null>(null)
  const elegir = () => entrada.current?.click()
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={elegir}
        className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-line bg-surface-2 text-ink-soft hover:border-ink-soft hover:text-ink"
        aria-label={logo ? 'Cambiar el logo' : 'Subir el logo'}
      >
        {logo ? <img src={logo} alt="Logo del colegio" className="size-full object-contain" /> : <ImagePlus className="size-7" aria-hidden />}
      </button>
      <div className="flex flex-col items-start gap-1 text-sm">
        <button type="button" onClick={elegir} className="font-semibold underline-offset-4 hover:underline">
          {logo ? 'Cambiar logo' : 'Subir logo'}
        </button>
        {logo && (
          <button type="button" onClick={() => cambiar(undefined)} className="text-ink-soft underline-offset-4 hover:text-danger hover:underline">
            Quitar
          </button>
        )}
      </div>
      <input
        ref={entrada}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={async (e) => {
          const archivo = e.target.files?.[0]
          e.target.value = ''
          if (!archivo) return
          const img = await cargarImagen(archivo)
          if (!img) return avisar('No pudimos usar esa imagen. Prueba con un PNG o JPG.', 'error')
          if (!esCuadrada(img)) return setRecortar(img)
          const lado = Math.min(img.naturalWidth, img.naturalHeight)
          const listo = logoRecortado(img, (img.naturalWidth - lado) / 2, (img.naturalHeight - lado) / 2, lado)
          if (listo) cambiar(listo)
        }}
      />
      <RecortarLogo
        imagen={recortar}
        cancelar={() => setRecortar(null)}
        listo={(l) => {
          cambiar(l)
          setRecortar(null)
        }}
      />
    </div>
  )
}

function TarjetaColegio({ colegio, n, cambiar, quitar }: { colegio: Colegio; n: number; cambiar: (c: Colegio) => void; quitar?: () => void }) {
  return (
    <article className="flex flex-col gap-5 rounded-3xl border border-line bg-surface p-5 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-xl font-bold">Colegio {n}</h3>
        <div className="flex items-center gap-2">
          <ElegirTipo
            valor={colegio.tipo}
            // En un público no existen los cursos partidos: se quitan los que ya no aplican.
            onChange={(tipo) => cambiar(colegioValido({ ...colegio, tipo }) ?? { ...colegio, tipo })}
          />
          {quitar && (
            <button
              type="button"
              onClick={quitar}
              className="grid size-11 place-items-center rounded-xl text-ink-soft hover:bg-surface-2 hover:text-danger"
              aria-label={`Quitar el colegio ${n}`}
            >
              <Trash2 className="size-5" />
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <Logo logo={colegio.logo} cambiar={(logo) => cambiar({ ...colegio, logo })} />
        <label className="flex w-32 flex-col gap-1.5 font-semibold">
          N.º de I.E.
          <input
            value={colegio.numero ?? ''}
            onChange={(e) => cambiar({ ...colegio, numero: e.target.value })}
            placeholder="2048"
            maxLength={12}
            className={campo}
          />
        </label>
        <label className="flex min-w-56 flex-1 flex-col gap-1.5 font-semibold">
          Nombre del colegio
          <input
            value={colegio.nombre}
            onChange={(e) => cambiar({ ...colegio, nombre: e.target.value })}
            placeholder="José Carlos Mariátegui"
            maxLength={120}
            className={campo}
          />
        </label>
        <label className="flex w-full flex-col gap-1.5 font-semibold">
          Lema (opcional)
          <input
            value={colegio.lema ?? ''}
            onChange={(e) => cambiar({ ...colegio, lema: e.target.value })}
            placeholder="El colegio de la disciplina y la excelencia académica"
            maxLength={120}
            className={campo}
          />
        </label>
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
  const { entro, nombreCompleto } = useCuenta()
  const { perfil } = usePerfil()
  const guardados = useColegios()
  // Con cuenta el nombre es obligatorio; sin cuenta es opcional y solo se guarda en este navegador.
  const conNombre = entro || !!perfil

  const inicial = { nombre: perfil?.nombre ?? nombreCompleto ?? '', colegios: guardados }
  const [borrador, setBorrador] = useState(inicial)
  const [base, setBase] = useState(JSON.stringify(inicial))
  const [guardando, setGuardando] = useState(false)

  const cambios = JSON.stringify(borrador) !== base
  const completo = borrador.colegios.every((c) => c.grados.length) && (!conNombre || !!borrador.nombre.trim())
  const colegios = (cs: Colegio[]) => setBorrador({ ...borrador, colegios: cs })

  async function guardar() {
    setGuardando(true)
    const nombre = borrador.nombre.trim()
    const ok =
      perfil || nombre
        ? await guardarPerfil({ ...perfil, nombre, grado: perfil?.grado ?? borrador.colegios[0].grados[0] }, borrador.colegios)
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

      <Seccion titulo="¿Cuál es tu nombre completo?">
        <input
          value={borrador.nombre}
          onChange={(e) => setBorrador({ ...borrador, nombre: e.target.value })}
          placeholder="Rosa María Quispe Huamán"
          maxLength={100}
          autoComplete="name"
          aria-label="Tu nombre completo"
          className={`${campo} max-w-md`}
        />
      </Seccion>

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
