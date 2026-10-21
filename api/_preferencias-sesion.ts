// Lo que la docente pidió recordar para sus próximas sesiones de aprendizaje: cuánto dura su clase y el enfoque
// transversal de su unidad. Se guarda en Atomic Memory (api/_atomicmemory.ts) solo si ella marca «Recordar» al
// ajustar una sesión; sin Atomic Memory configurado responde { activa: false } y la app no muestra nada.
//
//   GET    /api/preferencias-sesion  Authorization: Bearer <token de Clerk>  → { activa, preferencia: { duracion, enfoque } | null }
//   POST   /api/preferencias-sesion  Authorization: Bearer …  { duracion: 45 | 90, enfoque: 'Enfoque …' }  → { activa, preferencia }
//   DELETE /api/preferencias-sesion  Authorization: Bearer …  → { activa, preferencia: null }
//
// El enfoque viaja por su nombre del CNEB (apps/web/src/sesion/enfoques.ts); la actitud se sigue tomando del currículo.
import { z } from 'zod'
import { buscarPropios, configMemoria, ErrorMemoria, olvidar, recordar, sujetoDe, type ConfigMemoria, type SujetoMemoria } from './_atomicmemory.js'
import { docente } from './_cuenta.js'
import { json } from './_juegos.js'

const FUENTE = 'supermentes-sesion'
const ID_PROPIO = 'supermentes-sesion-opciones'

export const Preferencia = z.object({
  duracion: z.union([z.literal(45), z.literal(90)]),
  enfoque: z.string().regex(/^Enfoque [\p{L} ]{1,80}$/u),
})

export type Preferencia = z.infer<typeof Preferencia>

/** El recuerdo tal como se guarda: legible para la docente en la consola de Atomic Memory y fácil de leer de vuelta. */
export const textoDe = (p: Preferencia) =>
  `Sesiones de aprendizaje en Supermentes: la docente pidió empezar con clases de ${p.duracion} minutos y el «${p.enfoque}» como enfoque transversal.`

/** De vuelta del texto guardado; null si no tiene la forma de `textoDe`. */
export function preferenciaDe(texto: string): Preferencia | null {
  const p = Preferencia.safeParse({
    duracion: Number(texto.match(/clases de (\d+) minutos/)?.[1]),
    enfoque: texto.match(/«([^»]+)»/)?.[1],
  })
  return p.success ? p.data : null
}

type Contexto = { config: ConfigMemoria; sujeto: SujetoMemoria }

export async function leer({ config, sujeto }: Contexto): Promise<Preferencia | null> {
  const [ultimo] = await buscarPropios(config, { sujeto, fuente: FUENTE, idPropio: ID_PROPIO })
  return ultimo ? preferenciaDe(ultimo.content) : null
}

export async function guardar({ config, sujeto }: Contexto, p: Preferencia) {
  // Mismo idPropio: Atomic Memory reemplaza el recuerdo anterior en vez de sumar otro.
  await recordar(config, { sujeto, fuente: FUENTE, idPropio: ID_PROPIO, texto: textoDe(p) })
}

export async function borrar({ config, sujeto }: Contexto) {
  const propios = await buscarPropios(config, { sujeto, fuente: FUENTE, idPropio: ID_PROPIO })
  for (const m of propios) await olvidar(config, { sujeto, id: m.id })
}

/** Las rutas, con quién es la docente según su cuenta (las pruebas pasan otra forma de saberlo). */
export function crearRutas(identificar: (request: Request) => Promise<string | null>) {
  /** Sin Atomic Memory, sin cuenta o si Atomic Memory falla, una respuesta clara; si no, lo que pidió la ruta. */
  async function conDocente(request: Request, error: string, manejar: (c: Contexto) => Promise<Response>) {
    const config = configMemoria()
    if (!config) return json({ activa: false, preferencia: null })
    const id = await identificar(request)
    if (!id) return json({ activa: true, error: 'Entra con tu cuenta para que la app lo recuerde.' }, 401)
    try {
      return await manejar({ config, sujeto: sujetoDe(id) })
    } catch (e) {
      if (!(e instanceof ErrorMemoria)) throw e
      console.error('preferencias-sesion', e.message)
      return json({ activa: true, error }, 503)
    }
  }

  return {
    GET: (request: Request) =>
      conDocente(request, 'No pudimos traer lo que pediste recordar.', async (c) => json({ activa: true, preferencia: await leer(c) })),

    async POST(request: Request) {
      const p = Preferencia.safeParse(await request.json().catch(() => null))
      if (!p.success) return json({ error: 'Elige 45 o 90 minutos y un enfoque transversal.' }, 400)
      return conDocente(request, 'No pudimos guardarlo. Tu sesión sí cambió; vuelve a intentarlo.', async (c) => {
        await guardar(c, p.data)
        return json({ activa: true, preferencia: p.data })
      })
    },

    DELETE: (request: Request) =>
      conDocente(request, 'No pudimos olvidarlo. Vuelve a intentarlo.', async (c) => {
        await borrar(c)
        return json({ activa: true, preferencia: null })
      }),
  }
}

export const { GET, POST, DELETE } = crearRutas(docente)
