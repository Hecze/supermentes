// Lo poco de @vercel/blob que usa api/, hecho sobre R2. wrangler.jsonc lo pone en lugar del paquete (alias),
// así api/ sigue igual y Vercel también funciona.
import { env } from 'cloudflare:workers'

const r2 = () => (env as { BLOB: R2Bucket }).BLOB

export async function get(ruta: string, _opciones?: unknown) {
  const o = await r2().get(ruta)
  return o ? { statusCode: 200, stream: o.body } : null
}

export async function put(
  ruta: string,
  cuerpo: string | ArrayBuffer | Uint8Array,
  opciones: { contentType?: string; allowOverwrite?: boolean } = {},
) {
  if (opciones.allowOverwrite === false && (await r2().head(ruta))) throw new Error(`Ya existe ${ruta}`)
  await r2().put(ruta, cuerpo, { httpMetadata: { contentType: opciones.contentType } })
  return { pathname: ruta }
}

export async function list({ prefix, cursor, limit }: { prefix?: string; cursor?: string; limit?: number }) {
  const r = await r2().list({ prefix, cursor, limit })
  return { blobs: r.objects.map((o) => ({ pathname: o.key })), hasMore: r.truncated, cursor: r.truncated ? r.cursor : undefined }
}

export async function del(ruta: string) {
  await r2().delete(ruta)
}
