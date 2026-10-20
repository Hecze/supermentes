import { Check, Copy, LoaderCircle, Share2 } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { cx } from '../components/ui'

// ---------- Datos ----------

export type Origen = { invitadoPor?: string; fuente?: string; medio?: string; campana?: string }
export type Registro = { correo: string; codigo: string; perfil: boolean }
type Respuesta = { ok: true; nuevo: boolean; codigo: string | null; total: number | null }

const CLAVE_REGISTRO = 'supermentes-lista'
const CLAVE_ORIGEN = 'supermentes-origen'

export const ROLES = [
  'Docente de primaria',
  'Docente de secundaria',
  'Director/a o coordinador/a',
  'Psicólogo/a o SAANEE',
  'Madre o padre de familia',
  'Otro',
]

export const REGIONES = [
  'Amazonas', 'Áncash', 'Apurímac', 'Arequipa', 'Ayacucho', 'Cajamarca', 'Callao', 'Cusco', 'Huancavelica', 'Huánuco', 'Ica',
  'Junín', 'La Libertad', 'Lambayeque', 'Lima Metropolitana', 'Lima Provincias', 'Loreto', 'Madre de Dios', 'Moquegua', 'Pasco',
  'Piura', 'Puno', 'San Martín', 'Tacna', 'Tumbes', 'Ucayali', 'Fuera del Perú',
]

/** De qué enlace llegó la visita (?ref= de una invitación y utm_* de una publicación). Se recuerda durante la visita. */
export function leerOrigen(): Origen {
  try {
    const p = new URLSearchParams(window.location.search)
    const nuevo: Origen = {
      invitadoPor: p.get('ref') ?? undefined,
      fuente: p.get('utm_source') ?? undefined,
      medio: p.get('utm_medium') ?? undefined,
      campana: p.get('utm_campaign') ?? undefined,
    }
    if (Object.values(nuevo).some(Boolean)) {
      sessionStorage.setItem(CLAVE_ORIGEN, JSON.stringify(nuevo))
      return nuevo
    }
    return JSON.parse(sessionStorage.getItem(CLAVE_ORIGEN) ?? '{}') as Origen
  } catch {
    return {}
  }
}

export function leerRegistro(): Registro | null {
  try {
    const r = JSON.parse(localStorage.getItem(CLAVE_REGISTRO) ?? 'null') as Registro | null
    return r?.correo && r.codigo ? r : null
  } catch {
    return null
  }
}

function guardarRegistro(r: Registro) {
  try {
    localStorage.setItem(CLAVE_REGISTRO, JSON.stringify(r))
  } catch {
    // Sin almacenamiento, el registro igual quedó en el servidor.
  }
}

async function enviar(datos: Record<string, string | undefined>): Promise<Respuesta> {
  const res = await fetch('/api/lista-espera', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  })
  const cuerpo = (await res.json().catch(() => ({}))) as Partial<Respuesta> & { error?: string }
  if (!res.ok || cuerpo.error) throw new Error(cuerpo.error ?? 'No pudimos guardar tus datos. Intenta de nuevo en un momento.')
  return cuerpo as Respuesta
}

export async function contarLista(): Promise<number | null> {
  try {
    const res = await fetch('/api/lista-espera')
    if (!res.ok) return null
    const { total } = (await res.json()) as { total: number | null }
    return typeof total === 'number' ? total : null
  } catch {
    return null
  }
}

const enlaceDe = (codigo: string) => `${window.location.origin}/?ref=${codigo}`

// ---------- Formularios ----------

type AlUnirse = (r: Registro, total: number | null, nuevo: boolean) => void

const campo =
  'h-12 w-full rounded-xl border-2 border-line bg-surface px-4 text-base text-ink placeholder:text-ink-soft/70 focus:border-ink focus:outline-none'

/** Campo invisible para personas: si un bot lo llena, el servidor descarta el envío. */
function Trampa() {
  return (
    <label className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden>
      Sitio web
      <input name="sitio" tabIndex={-1} autoComplete="off" />
    </label>
  )
}

function useEnvio(origen: Origen, alUnirse: AlUnirse) {
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function enviarFormulario(e: FormEvent<HTMLFormElement>, perfil: boolean) {
    e.preventDefault()
    if (enviando) return
    const datos = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>
    setEnviando(true)
    setError(null)
    try {
      const r = await enviar({ ...datos, ...origen })
      if (!r.codigo) return // el campo trampa se llenó: no mostramos nada especial
      const registro = { correo: datos.correo.trim().toLowerCase(), codigo: r.codigo, perfil }
      guardarRegistro(registro)
      alUnirse(registro, r.total, r.nuevo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos guardar tus datos.')
    } finally {
      setEnviando(false)
    }
  }

  return { enviando, error, enviarFormulario }
}

function BotonEnviar({ enviando, children, className }: { enviando: boolean; children: ReactNode; className?: string }) {
  return (
    <button
      type="submit"
      disabled={enviando}
      className={cx(
        'inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-semibold text-primary-ink transition hover:opacity-90 disabled:opacity-60',
        className,
      )}
    >
      {enviando && <LoaderCircle className="size-5 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

/** Formulario corto del inicio: solo el correo. */
export function FormularioCorreo({ origen, alUnirse }: { origen: Origen; alUnirse: AlUnirse }) {
  const { enviando, error, enviarFormulario } = useEnvio(origen, alUnirse)
  return (
    <form onSubmit={(e) => enviarFormulario(e, false)} className="relative flex flex-col gap-2" noValidate={false}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="correo-inicio" className="sr-only">
          Tu correo
        </label>
        <input id="correo-inicio" name="correo" type="email" required autoComplete="email" placeholder="tucorreo@ejemplo.com" className={cx(campo, 'sm:flex-1')} />
        <BotonEnviar enviando={enviando}>Unirme a la lista</BotonEnviar>
      </div>
      <Trampa />
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}

/** Formulario completo del final de la página. */
export function FormularioCompleto({ origen, alUnirse }: { origen: Origen; alUnirse: AlUnirse }) {
  const { enviando, error, enviarFormulario } = useEnvio(origen, alUnirse)
  return (
    <form onSubmit={(e) => enviarFormulario(e, true)} className="relative grid gap-3 sm:grid-cols-2">
      <label htmlFor="lista-nombre" className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Tu nombre</span>
        <input id="lista-nombre" name="nombre" autoComplete="given-name" placeholder="Rosa" className={campo} />
      </label>
      <label htmlFor="lista-correo" className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Correo</span>
        <input id="lista-correo" name="correo" type="email" required autoComplete="email" placeholder="tucorreo@ejemplo.com" className={campo} />
      </label>
      <label htmlFor="lista-rol" className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">¿Qué haces?</span>
        <select id="lista-rol" name="rol" defaultValue="" className={campo}>
          <option value="">Elige una opción</option>
          {ROLES.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </label>
      <label htmlFor="lista-region" className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Región</span>
        <select id="lista-region" name="region" defaultValue="" className={campo}>
          <option value="">Elige tu región</option>
          {REGIONES.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </label>
      <label htmlFor="lista-colegio" className="flex flex-col gap-1.5 sm:col-span-2">
        <span className="text-sm font-medium">
          Colegio <span className="font-normal text-ink-soft">(opcional)</span>
        </span>
        <input id="lista-colegio" name="colegio" placeholder="I.E. N.º 2048" className={campo} />
      </label>
      <Trampa />
      <div className="flex flex-col gap-2 sm:col-span-2">
        <BotonEnviar enviando={enviando} className="w-full">
          Unirme a la lista de espera
        </BotonEnviar>
        {error && (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        <p className="text-center text-sm text-ink-soft">Solo usamos tu correo para avisarte cuando abramos.</p>
      </div>
    </form>
  )
}

// ---------- Después de unirse ----------

/** Confirmación, enlace para invitar y, si falta, el perfil opcional. */
export function Bienvenida({
  registro,
  total,
  nuevo,
  origen,
  alUnirse,
}: {
  registro: Registro
  total: number | null
  nuevo: boolean | null
  origen: Origen
  alUnirse: AlUnirse
}) {
  const [copiado, setCopiado] = useState(false)
  const { enviando, error, enviarFormulario } = useEnvio(origen, alUnirse)
  const enlace = enlaceDe(registro.codigo)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(enlace)
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 2000)
    } catch {
      window.prompt('Copia tu enlace:', enlace)
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border-2 border-ok/40 bg-surface p-5 text-left" role="status">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ok text-on-tool">
          <Check className="size-5" aria-hidden />
        </span>
        <div>
          <p className="text-lg font-semibold">
            {nuevo === false ? '¡Ya estabas en la lista!' : nuevo && total ? `¡Listo! Eres la persona n.º ${total} en la lista.` : '¡Listo! Ya estás en la lista.'}
          </p>
          <p className="text-ink-soft">Te escribiremos a {registro.correo} apenas abramos.</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-xl bg-surface-2 p-4">
        <p className="font-semibold">Invita a otros profes</p>
        <p className="text-sm text-ink-soft">¿Conoces a otros profes a quienes les serviría? Compárteles tu enlace:</p>
        <div className="flex min-w-0 items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2">
          <span className="min-w-0 flex-1 truncate text-sm">{enlace}</span>
          <button type="button" onClick={copiar} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold hover:underline">
            {copiado ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {copiado ? 'Copiado' : 'Copiar'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(enlace)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold hover:bg-surface-2"
          >
            <Share2 className="size-4" aria-hidden /> Facebook
          </a>
        </div>
      </div>

      {!registro.perfil && (
        <form onSubmit={(e) => enviarFormulario(e, true)} className="relative flex flex-col gap-3 border-t border-line pt-4">
          <p className="font-semibold">
            Cuéntanos de ti <span className="font-normal text-ink-soft">(opcional, nos ayuda a priorizar)</span>
          </p>
          <input type="hidden" name="correo" value={registro.correo} />
          <div className="grid gap-2 sm:grid-cols-2">
            <label htmlFor="perfil-nombre" className="sr-only">
              Tu nombre
            </label>
            <input id="perfil-nombre" name="nombre" placeholder="Tu nombre" autoComplete="given-name" className={campo} />
            <label htmlFor="perfil-rol" className="sr-only">
              ¿Qué haces?
            </label>
            <select id="perfil-rol" name="rol" defaultValue="" className={campo}>
              <option value="">¿Qué haces?</option>
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <label htmlFor="perfil-region" className="sr-only">
              Región
            </label>
            <select id="perfil-region" name="region" defaultValue="" className={campo}>
              <option value="">Región</option>
              {REGIONES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <Trampa />
          <BotonEnviar enviando={enviando} className="self-start">
            Guardar
          </BotonEnviar>
          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  )
}
