// FIXTURE DE PRUEBA, NO es Atomic Memory: un servidor HTTP local (127.0.0.1) que imita las rutas que usa
// api/_atomicmemory.ts, según la documentación oficial (https://docs.atomicstrata.ai/api-reference/http) y el código
// de atomicmemory-core: ingest/quick idempotente por metadata.externalId y user_id, list por user_id y source_site,
// delete por id solo dentro del mismo user_id. Lo usan `npm test` y la demo local; nunca habla con el servicio real.
import { randomUUID } from 'node:crypto'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'

export type RecuerdoFixture = { id: string; user_id: string; content: string; source_site: string; metadata: Record<string, unknown>; created_at: string }
export type Pedido = { metodo: string; ruta: string; cuerpo: unknown }
export type Fixture = {
  url: string
  clave: string
  recuerdos: RecuerdoFixture[]
  pedidos: Pedido[]
  /**
   * 'ok'; 'falla' responde 500; 'lento' tarda más que el tiempo límite de la app; 'vacio' responde 200 sin confirmar
   * (ingest sin ids, delete sin success) y 'malformado' responde 200 con un cuerpo que no es JSON (estos dos, solo en
   * ingest y delete).
   */
  modo: 'ok' | 'falla' | 'lento' | 'vacio' | 'malformado'
  cerrar: () => Promise<void>
}

const responder = (res: ServerResponse, estado: number, datos: unknown) => {
  res.writeHead(estado, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(datos))
}

async function cuerpoDe(req: IncomingMessage): Promise<unknown> {
  const partes: Buffer[] = []
  for await (const parte of req) partes.push(Buffer.from(parte))
  const texto = Buffer.concat(partes).toString('utf8')
  return texto ? JSON.parse(texto) : null
}

const registro = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v)) : {})

export async function iniciarFixture({ clave = 'amc_fixture_local', puerto = 0 } = {}): Promise<Fixture> {
  const f: Omit<Fixture, 'url' | 'cerrar'> = { clave, recuerdos: [], pedidos: [], modo: 'ok' }

  const servidor = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1')
    const cuerpo = await cuerpoDe(req).catch(() => undefined)
    f.pedidos.push({ metodo: req.method ?? '', ruta: url.pathname + url.search, cuerpo })
    if (f.modo === 'lento') await new Promise((r) => setTimeout(r, 4000))
    if (f.modo === 'falla') return responder(res, 500, { error: 'fixture: falla simulada' })
    if (req.headers.authorization !== `Bearer ${clave}`) return responder(res, 401, { error: 'Unauthorized' })

    const escribe = req.method === 'DELETE' || url.pathname === '/v1/memories/ingest/quick'
    if (escribe && f.modo === 'malformado') {
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      return res.end('ok')
    }
    if (escribe && f.modo === 'vacio') {
      return responder(res, 200, req.method === 'DELETE' ? {} : { memories_stored: 0, memories_updated: 0, stored_memory_ids: [], updated_memory_ids: [] })
    }

    if (req.method === 'POST' && url.pathname === '/v1/memories/ingest/quick') {
      const b = registro(cuerpo)
      const metadata = registro(b.metadata)
      if (typeof b.user_id !== 'string' || !b.user_id || typeof b.conversation !== 'string' || !b.conversation || typeof b.source_site !== 'string' || !b.source_site) {
        return responder(res, 400, { error: 'user_id, conversation y source_site son obligatorios' })
      }
      if (b.skip_extraction !== true) return responder(res, 400, { error: 'metadata is only supported with skip_extraction=true' })
      if (b.content_class !== 'summary' && b.content_class !== 'redacted') return responder(res, 422, { error: 'raw_content_rejected' })
      const externo = typeof metadata.externalId === 'string' ? metadata.externalId : undefined
      const previo = externo && f.recuerdos.find((m) => m.user_id === b.user_id && m.metadata.externalId === externo)
      if (previo) {
        Object.assign(previo, { content: b.conversation, source_site: b.source_site, metadata: { ...previo.metadata, ...metadata } })
        return responder(res, 200, { memories_stored: 0, memories_updated: 1, stored_memory_ids: [], updated_memory_ids: [previo.id] })
      }
      const nuevo = { id: randomUUID(), user_id: b.user_id, content: b.conversation, source_site: b.source_site, metadata, created_at: new Date().toISOString() }
      f.recuerdos.unshift(nuevo)
      return responder(res, 200, { memories_stored: 1, memories_updated: 0, stored_memory_ids: [nuevo.id], updated_memory_ids: [] })
    }

    const usuario = url.searchParams.get('user_id')
    if (!usuario) return responder(res, 400, { error: 'user_id (string) is required' })

    if (req.method === 'GET' && url.pathname === '/v1/memories/list') {
      const fuente = url.searchParams.get('source_site')
      const memories = f.recuerdos
        .filter((m) => m.user_id === usuario && (!fuente || m.source_site === fuente))
        .slice(0, Number(url.searchParams.get('limit') ?? 20))
        .map(({ user_id: _u, ...m }) => m)
      return responder(res, 200, { memories, count: memories.length })
    }

    const id = url.pathname.match(/^\/v1\/memories\/([0-9a-f-]{36})$/)?.[1]
    if (req.method === 'DELETE' && id) {
      // Como core: borra solo si el recuerdo es de ese user_id.
      f.recuerdos = f.recuerdos.filter((m) => !(m.id === id && m.user_id === usuario))
      return responder(res, 200, { success: true })
    }
    responder(res, 404, { error: 'fixture: ruta no implementada' })
  })

  await new Promise<void>((r) => servidor.listen(puerto, '127.0.0.1', r))
  const direccion = servidor.address()
  if (!direccion || typeof direccion === 'string') throw new Error('fixture: no se pudo abrir el puerto')
  return Object.assign(f, {
    url: `http://127.0.0.1:${direccion.port}`,
    cerrar: () => new Promise<void>((r) => servidor.close(() => r())),
  })
}
