// Lo recordado de las sesiones, por cuenta: cada docente tiene su propia respuesta guardada y sus propios oyentes. Si
// en la misma página sale una cuenta y entra otra, nada de la primera (ni una respuesta que llega tarde) le llega a la
// segunda. El id de la cuenta aquí solo ordena el caché del navegador: quién es la docente lo decide el servidor con
// su token (api/_preferencias-sesion.ts). Sin React ni Clerk, para probarlo con `npm test`.
import { ENFOQUES } from './enfoques'
import type { OpcionesSesion } from './tipos'

export type Recordadas =
  | { estado: 'apagado' }
  | { estado: 'cargando' }
  | { estado: 'listo'; opciones: OpcionesSesion | null }
  | { estado: 'error'; mensaje: string }

export type Resultado = { ok: true } | { ok: false; mensaje: string }

/** Lo que manda y devuelve el servidor: el enfoque por su nombre del CNEB, no por su lugar en la lista. */
type Preferencia = { duracion: 45 | 90; enfoque: string }
type Respuesta = { activa?: boolean; preferencia?: unknown; error?: string }

const RUTA = '/api/preferencias-sesion'
const SIN_RESPUESTA = 'No pudimos conectarnos. Revisa tu internet y vuelve a intentarlo.'
const SIN_TRAER = 'No pudimos traer lo que pediste recordar.'
const OTRA_CUENTA = 'Cambiaste de cuenta: no se guardó nada. Vuelve a intentarlo.'

const deServidor = (p: unknown): OpcionesSesion | null => {
  if (!p || typeof p !== 'object' || !('duracion' in p) || !('enfoque' in p)) return null
  const enfoque = ENFOQUES.findIndex((e) => e.nombre === p.enfoque)
  return (p.duracion === 45 || p.duracion === 90) && enfoque >= 0 ? { duracion: p.duracion, enfoque } : null
}

const aServidor = (o: OpcionesSesion): Preferencia => ({ duracion: o.duracion, enfoque: ENFOQUES[o.enfoque].nombre })

/** El `sub` del token de Clerk, sin verificarlo: solo para no mandar con el token de una cuenta lo que pidió otra. */
export function cuentaDelToken(token: string): string | null {
  try {
    const parte = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/')
    const datos: unknown = parte ? JSON.parse(atob(parte)) : null
    return datos && typeof datos === 'object' && 'sub' in datos && typeof datos.sub === 'string' ? datos.sub : null
  } catch {
    return null
  }
}

type Dependencias = { token: () => Promise<string | null>; pedir?: typeof fetch }

export function crearMemoriaSesiones({ token, pedir = (...a) => fetch(...a) }: Dependencias) {
  const cache = new Map<string, Promise<Recordadas>>()
  const oyentes = new Map<string, Set<(r: Recordadas) => void>>()

  /** Con el token de esa cuenta y ninguna otra; null si ya no es la cuenta que entró. */
  async function llamar(cuenta: string, metodo: 'GET' | 'POST' | 'DELETE', cuerpo?: Preferencia) {
    const t = await token()
    if (!t || cuentaDelToken(t) !== cuenta) return null
    const r = await pedir(RUTA, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: cuerpo && JSON.stringify(cuerpo),
      // El servidor espera a Atomic Memory hasta 2,5 s; esto es un tope por si la red se cuelga.
      signal: AbortSignal.timeout(5000),
    })
    const datos: Respuesta = await r.json().catch(() => ({}))
    return { estado: r.status, datos }
  }

  function fijar(cuenta: string, r: Recordadas) {
    cache.set(cuenta, Promise.resolve(r))
    oyentes.get(cuenta)?.forEach((o) => o(r))
  }

  async function cambiar(cuenta: string, metodo: 'POST' | 'DELETE', o?: OpcionesSesion): Promise<Resultado> {
    try {
      const r = await llamar(cuenta, metodo, o && aServidor(o))
      if (!r) return { ok: false, mensaje: OTRA_CUENTA }
      if (r.estado !== 200 || r.datos.activa !== true) return { ok: false, mensaje: r.datos.error ?? SIN_RESPUESTA }
      fijar(cuenta, { estado: 'listo', opciones: deServidor(r.datos.preferencia) })
      return { ok: true }
    } catch {
      return { ok: false, mensaje: SIN_RESPUESTA }
    }
  }

  return {
    /** Se pregunta una vez por cuenta y por visita. */
    cargar(cuenta: string): Promise<Recordadas> {
      const guardada = cache.get(cuenta)
      if (guardada) return guardada
      const nueva = llamar(cuenta, 'GET')
        .then((r): Recordadas => {
          // Sin token de esta cuenta (salió o entró otra): no se guarda en el caché, que vuelva a preguntar.
          if (!r) {
            cache.delete(cuenta)
            return { estado: 'apagado' }
          }
          if (r.datos.activa === false || r.estado === 401) return { estado: 'apagado' }
          if (r.estado !== 200) return { estado: 'error', mensaje: r.datos.error ?? SIN_TRAER }
          return { estado: 'listo', opciones: deServidor(r.datos.preferencia) }
        })
        .catch((): Recordadas => {
          cache.delete(cuenta)
          return { estado: 'error', mensaje: SIN_TRAER }
        })
      cache.set(cuenta, nueva)
      return nueva
    },

    /** Avisa solo a quien escucha esa cuenta. Devuelve cómo dejar de escuchar. */
    suscribir(cuenta: string, oyente: (r: Recordadas) => void) {
      const set = oyentes.get(cuenta) ?? new Set()
      oyentes.set(cuenta, set.add(oyente))
      return () => void set.delete(oyente)
    },

    /** Recuerda estas opciones para sus próximas sesiones (reemplaza lo que había). */
    recordar: (cuenta: string, o: OpcionesSesion) => cambiar(cuenta, 'POST', o),

    olvidar: (cuenta: string) => cambiar(cuenta, 'DELETE'),
  }
}
