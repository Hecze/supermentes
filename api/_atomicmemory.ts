// Atomic Memory (https://docs.atomicstrata.ai): lo que la docente pidió que la app recuerde. Opcional: sin
// ATOMICMEMORY_API_URL y ATOMICMEMORY_API_KEY queda apagado y la app funciona igual. La clave vive solo en el servidor.
//
// Rutas del API HTTP de Atomic Memory que se usan (las mismas que usa su SDK):
//   POST   /v1/memories/ingest/quick   { user_id, conversation, source_site, skip_extraction: true, content_class,
//                                        metadata: { externalId } }  → con el mismo externalId, reemplaza el recuerdo
//   GET    /v1/memories/list?user_id=…&source_site=…                 → { memories: [{ id, content, metadata }] }
//   DELETE /v1/memories/:id?user_id=…
//
// Cada docente es su propio "user" (scope solo de usuario): `user_id` sale de su cuenta de Clerk ya verificada en el
// servidor, nunca de lo que mande el navegador. No se usan thread, namespace ni agent: en Atomic Memory Cloud no aíslan.
import { z } from 'zod'

/** Lo que más esperamos a Atomic Memory: la docente no se queda esperando. */
const TIEMPO_LIMITE_MS = 2500

/** Id de la docente en Atomic Memory. Solo se arma con el id de Clerk verificado (api/_cuenta.ts). */
export type SujetoMemoria = string & { readonly __marca: 'SujetoMemoria' }

export const sujetoDe = (idClerk: string) => `supermentes:${idClerk}` as SujetoMemoria

export type ConfigMemoria = { url: string; clave: string }

/** La configuración del servidor, o null si Atomic Memory está apagado. */
export function configMemoria(): ConfigMemoria | null {
  const url = process.env.ATOMICMEMORY_API_URL?.trim().replace(/\/+$/, '')
  const clave = process.env.ATOMICMEMORY_API_KEY?.trim()
  return url && clave ? { url, clave } : null
}

export class ErrorMemoria extends Error {}

const Recuerdo = z.object({
  id: z.string(),
  content: z.string(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
})

export type Recuerdo = z.infer<typeof Recuerdo>

const Lista = z.object({ memories: z.array(Recuerdo) })

async function pedir(config: ConfigMemoria, ruta: string, init: RequestInit = {}): Promise<unknown> {
  let r: Response
  try {
    r = await fetch(`${config.url}/v1/memories${ruta}`, {
      ...init,
      headers: { Authorization: `Bearer ${config.clave}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(TIEMPO_LIMITE_MS),
      redirect: 'error',
    })
  } catch (e) {
    throw new ErrorMemoria(e instanceof Error && e.name === 'TimeoutError' ? 'Atomic Memory tardó demasiado' : 'Atomic Memory no responde')
  }
  if (!r.ok) throw new ErrorMemoria(`Atomic Memory respondió ${r.status}`)
  return r.json().catch(() => {
    throw new ErrorMemoria('Atomic Memory devolvió una respuesta que no es JSON')
  })
}

/** Guarda un recuerdo tal cual (sin que la IA lo reescriba); con el mismo `idPropio`, reemplaza el anterior. */
export async function recordar(config: ConfigMemoria, args: { sujeto: SujetoMemoria; fuente: string; idPropio: string; texto: string }) {
  const respuesta = await pedir(config, '/ingest/quick', {
    method: 'POST',
    body: JSON.stringify({
      user_id: args.sujeto,
      conversation: args.texto,
      source_site: args.fuente,
      skip_extraction: true,
      content_class: 'summary',
      metadata: { externalId: args.idPropio },
    }),
  })
  if (!Confirmacion.safeParse(respuesta).success) throw new ErrorMemoria('Atomic Memory no confirmó el guardado')
}

const Confirmacion = z.object({
  stored_memory_ids: z.array(z.string().min(1)),
  updated_memory_ids: z.array(z.string().min(1)).optional(),
  memories_skipped: z.number().int().nonnegative().optional(),
}).refine((r) => r.stored_memory_ids.length > 0 || (r.updated_memory_ids?.length ?? 0) > 0 || (r.memories_skipped ?? 0) > 0)

/** Los recuerdos de la docente con ese `idPropio` (normalmente uno). */
export async function buscarPropios(config: ConfigMemoria, args: { sujeto: SujetoMemoria; fuente: string; idPropio: string }): Promise<Recuerdo[]> {
  const q = new URLSearchParams({ user_id: args.sujeto, source_site: args.fuente, limit: '20' })
  const lista = Lista.safeParse(await pedir(config, `/list?${q}`))
  if (!lista.success) throw new ErrorMemoria('Atomic Memory devolvió una lista con otra forma')
  return lista.data.memories.filter((m) => m.metadata?.externalId === args.idPropio)
}

export async function olvidar(config: ConfigMemoria, args: { sujeto: SujetoMemoria; id: string }) {
  const respuesta = await pedir(config, `/${encodeURIComponent(args.id)}?${new URLSearchParams({ user_id: args.sujeto })}`, { method: 'DELETE' })
  if (!z.object({ success: z.literal(true) }).safeParse(respuesta).success) throw new ErrorMemoria('Atomic Memory no confirmó el borrado')
}
