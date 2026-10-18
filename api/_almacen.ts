// Dónde se guardan los datos: Postgres (Neon) si hay DATABASE_URL; si no, Vercel Blob como antes.
// El "_" hace que Vercel no lo publique como endpoint.
//
// Las claves son las mismas rutas de siempre ("lista-espera/<id>.json", "juegos/<código>.json",
// "resultados/<código>/<id>.json"), en una sola tabla:
//
//   almacen(ruta text primary key, datos jsonb, creado timestamptz, actualizado timestamptz)
//
// La primera vez que se usa la base, copia lo que ya había en Blob (una sola vez; ver migrarDesdeBlob).
import { neon } from '@neondatabase/serverless'
import { del, get, list, put } from '@vercel/blob'

const URL_BASE = process.env.DATABASE_URL ?? process.env.POSTGRES_URL
const sql = URL_BASE ? neon(URL_BASE) : null

/** "postgres" o "blob": para saber dónde quedó cada cosa. */
export const motor = sql ? 'postgres' : 'blob'

const PREFIJOS_BLOB = ['lista-espera/', 'juegos/', 'resultados/']
const MARCA_MIGRACION = '_migracion/blob'

let lista: Promise<void> | null = null

/** Crea la tabla si no existe y trae lo de Blob una vez. Se hace una vez por instancia. */
function preparar() {
  if (!sql) return Promise.resolve()
  lista ??= (async () => {
    await sql`create table if not exists almacen (
      ruta text primary key,
      datos jsonb not null,
      creado timestamptz not null default now(),
      actualizado timestamptz not null default now()
    )`
    const [hecha] = await sql`select 1 from almacen where ruta = ${MARCA_MIGRACION}`
    if (!hecha) await migrarDesdeBlob()
  })().catch((e) => {
    lista = null
    throw e
  })
  return lista
}

/** Copia cada registro de Blob a la tabla, sin pisar lo que ya esté. Si Blob falla, se reintenta otra vez. */
async function migrarDesdeBlob() {
  if (!sql || !process.env.BLOB_READ_WRITE_TOKEN) return
  try {
    let copiados = 0
    for (const prefijo of PREFIJOS_BLOB) {
      let cursor: string | undefined
      do {
        const pagina = await list({ prefix: prefijo, cursor, limit: 1000 })
        for (const b of pagina.blobs) {
          const datos = await leerBlob(b.pathname)
          if (datos === null) continue
          await sql`insert into almacen (ruta, datos, creado) values (${b.pathname}, ${JSON.stringify(datos)}::jsonb, ${b.uploadedAt.toISOString()}) on conflict (ruta) do nothing`
          copiados++
        }
        cursor = pagina.hasMore ? pagina.cursor : undefined
      } while (cursor)
    }
    await sql`insert into almacen (ruta, datos) values (${MARCA_MIGRACION}, ${JSON.stringify({ copiados, cuando: new Date().toISOString() })}::jsonb) on conflict (ruta) do nothing`
    console.log(`Migración desde Blob: ${copiados} registros copiados a Postgres`)
  } catch (e) {
    console.error('No se pudo copiar desde Blob (se reintenta en la próxima instancia)', e)
  }
}

async function leerBlob<T>(ruta: string): Promise<T | null> {
  const r = await get(ruta, { access: 'private', useCache: false })
  if (!r || r.statusCode !== 200 || !r.stream) return null
  return JSON.parse(await new Response(r.stream).text()) as T
}

const filtroPrefijo = (prefijo: string) => `${prefijo.replace(/[\\%_]/g, (c) => `\\${c}`)}%`

/** Lee un registro; null si no existe. */
export async function leer<T>(ruta: string): Promise<T | null> {
  if (!sql) return leerBlob<T>(ruta)
  await preparar()
  const [fila] = await sql`select datos from almacen where ruta = ${ruta}`
  return fila ? (fila.datos as T) : null
}

/** Guarda (o reemplaza) un registro. */
export async function guardar(ruta: string, datos: unknown) {
  if (!sql) {
    await put(ruta, JSON.stringify(datos), { access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true })
    return
  }
  await preparar()
  await sql`insert into almacen (ruta, datos) values (${ruta}, ${JSON.stringify(datos)}::jsonb)
    on conflict (ruta) do update set datos = excluded.datos, actualizado = now()`
}

/** Borra un registro. */
export async function borrar(ruta: string) {
  if (!sql) return del(ruta)
  await preparar()
  await sql`delete from almacen where ruta = ${ruta}`
}

/** Cuántos registros hay con ese prefijo. */
export async function contar(prefijo: string) {
  if (!sql) {
    let total = 0
    let cursor: string | undefined
    do {
      const pagina = await list({ prefix: prefijo, cursor, limit: 1000 })
      total += pagina.blobs.length
      cursor = pagina.hasMore ? pagina.cursor : undefined
    } while (cursor)
    return total
  }
  await preparar()
  const [fila] = await sql`select count(*)::int as total from almacen where ruta like ${filtroPrefijo(prefijo)}`
  return fila.total as number
}

/** Todos los registros con ese prefijo, del más antiguo al más nuevo. */
export async function todos<T>(prefijo: string): Promise<T[]> {
  if (!sql) {
    const rutas: string[] = []
    let cursor: string | undefined
    do {
      const pagina = await list({ prefix: prefijo, cursor, limit: 1000 })
      rutas.push(...pagina.blobs.map((b) => b.pathname))
      cursor = pagina.hasMore ? pagina.cursor : undefined
    } while (cursor)
    const res: T[] = []
    for (let i = 0; i < rutas.length; i += 20) {
      const tanda = await Promise.all(rutas.slice(i, i + 20).map((r) => leerBlob<T>(r)))
      res.push(...tanda.filter((r): r is Awaited<T> => r !== null))
    }
    return res
  }
  await preparar()
  const filas = await sql`select datos from almacen where ruta like ${filtroPrefijo(prefijo)} order by creado`
  return filas.map((f) => f.datos as T)
}
