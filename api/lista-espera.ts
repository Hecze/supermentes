// Lista de espera: guarda cada registro como un archivo privado en Vercel Blob.
//
//   GET  /api/lista-espera                         → { total }  (contador público, cacheado una hora)
//   POST /api/lista-espera  { correo, nombre, … }  → { ok, nuevo, codigo, total: null }
//   GET  /api/lista-espera?formato=csv&clave=…     → CSV con todos los registros (requiere LISTA_CLAVE)
//   DELETE /api/lista-espera?correo=…&clave=…      → borra un registro (pruebas o spam; requiere LISTA_CLAVE)
//
// Límite del plan Hobby de Vercel: 2.000 operaciones avanzadas (put, list) al mes; si se pasan, Blob se bloquea
// 30 días. Por eso cada inscripción hace un solo put, el contador se cachea una hora y hay un tope por conexión.
import { createHash, timingSafeEqual } from 'node:crypto'
import { del, get, list, put } from '@vercel/blob'

const PREFIJO = 'lista-espera/'
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

type Registro = {
  correo: string
  nombre: string
  rol: string
  region: string
  colegio: string
  /** Código para invitar a otros: supermentes.app/?ref=CODIGO */
  codigo: string
  /** Código de quien invitó a esta persona. */
  invitadoPor: string | null
  /** utm_source, utm_medium y utm_campaign del enlace por el que llegó. */
  fuente: string | null
  medio: string | null
  campana: string | null
  creado: string
  actualizado: string
}

function json(datos: unknown, estado = 200, cabeceras: Record<string, string> = {}) {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cabeceras },
  })
}

const texto = (v: unknown, max = 120) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '')

const huella = (correo: string) => createHash('sha256').update(correo).digest('hex')
const rutaDe = (h: string) => `${PREFIJO}${h.slice(0, 32)}.json`
const codigoDe = (h: string) => BigInt(`0x${h.slice(0, 12)}`).toString(36).slice(0, 6).toUpperCase()

async function contar() {
  let total = 0
  let cursor: string | undefined
  do {
    const pagina = await list({ prefix: PREFIJO, cursor, limit: 1000 })
    total += pagina.blobs.length
    cursor = pagina.hasMore ? pagina.cursor : undefined
  } while (cursor)
  return total
}

// Tope por conexión, en la memoria de cada instancia: frena a un bot sin gastar operaciones de Blob.
// Es holgado porque en un colegio o una capacitación muchos docentes comparten la misma red.
const intentos = new Map<string, number[]>()
const VENTANA = 10 * 60_000
const MAXIMO_POR_VENTANA = 30

function demasiados(request: Request) {
  const ip = (request.headers.get('x-vercel-forwarded-for') ?? request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'sin-ip'
  const ahora = Date.now()
  const recientes = (intentos.get(ip) ?? []).filter((t) => ahora - t < VENTANA)
  recientes.push(ahora)
  if (intentos.size > 10_000) intentos.clear()
  intentos.set(ip, recientes)
  return recientes.length > MAXIMO_POR_VENTANA
}

async function leer(ruta: string): Promise<Registro | null> {
  const r = await get(ruta, { access: 'private', useCache: false })
  if (!r || r.statusCode !== 200 || !r.stream) return null
  return JSON.parse(await new Response(r.stream).text()) as Registro
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  if (url.searchParams.get('formato') === 'csv') return exportar(request, url)
  try {
    // El contador se cachea una hora en la CDN: cada list() cuenta contra el límite de operaciones de Blob.
    return json({ total: await contar() }, 200, { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' })
  } catch (e) {
    console.error('No se pudo contar la lista de espera', e)
    return json({ total: null })
  }
}

export async function POST(request: Request) {
  let datos: Record<string, unknown>
  try {
    datos = (await request.json()) as Record<string, unknown>
  } catch {
    return json({ error: 'No pudimos leer el formulario. Intenta de nuevo.' }, 400)
  }

  // Campo trampa: las personas no lo ven, los bots lo llenan.
  if (texto(datos.sitio)) return json({ ok: true, nuevo: true, codigo: null, total: null })
  if (demasiados(request)) return json({ error: 'Recibimos muchos registros desde tu conexión. Espera unos minutos y vuelve a intentarlo.' }, 429)

  const correo = texto(datos.correo, 254).toLowerCase()
  if (!CORREO.test(correo)) return json({ error: 'Revisa tu correo: parece que le falta algo.' }, 400)

  try {
    const h = huella(correo)
    const ruta = rutaDe(h)
    const previo = await leer(ruta)
    const ahora = new Date().toISOString()
    const codigo = previo?.codigo ?? codigoDe(h)
    const invitadoPor = texto(datos.invitadoPor, 12).toUpperCase()

    const registro: Registro = {
      correo,
      nombre: texto(datos.nombre) || previo?.nombre || '',
      rol: texto(datos.rol, 60) || previo?.rol || '',
      region: texto(datos.region, 60) || previo?.region || '',
      colegio: texto(datos.colegio) || previo?.colegio || '',
      codigo,
      invitadoPor: previo ? previo.invitadoPor : invitadoPor && invitadoPor !== codigo ? invitadoPor : null,
      fuente: previo ? previo.fuente : texto(datos.fuente, 60) || null,
      medio: previo ? previo.medio : texto(datos.medio, 60) || null,
      campana: previo ? previo.campana : texto(datos.campana, 80) || null,
      creado: previo?.creado ?? ahora,
      actualizado: ahora,
    }

    // Si ya estaba y no cambió nada, no se vuelve a escribir.
    const cambio = !previo || (['nombre', 'rol', 'region', 'colegio'] as const).some((k) => registro[k] !== previo[k])
    if (cambio) {
      await put(ruta, JSON.stringify(registro), {
        access: 'private',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
      })
    }

    // Sin total: contar la tienda en cada inscripción gastaría otra operación avanzada.
    return json({ ok: true, nuevo: !previo, codigo, total: null })
  } catch (e) {
    console.error('No se pudo guardar el registro', e)
    return json({ error: 'No pudimos guardar tus datos. Intenta de nuevo en un momento.' }, 500)
  }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url)
  if (!claveValida(claveDe(request, url))) return json({ error: 'Clave incorrecta.' }, 401)
  const correo = texto(url.searchParams.get('correo'), 254).toLowerCase()
  if (!CORREO.test(correo)) return json({ error: 'Indica el correo que quieres borrar.' }, 400)
  const ruta = rutaDe(huella(correo))
  if (!(await leer(ruta))) return json({ error: 'Ese correo no está en la lista.' }, 404)
  await del(ruta)
  return json({ ok: true })
}

const claveDe = (request: Request, url: URL) =>
  url.searchParams.get('clave') ?? request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null

function claveValida(dada: string | null) {
  const clave = process.env.LISTA_CLAVE
  if (!clave || !dada) return false
  const a = Buffer.from(dada)
  const b = Buffer.from(clave)
  return a.length === b.length && timingSafeEqual(a, b)
}

/** Evita que Excel interprete una celda como fórmula y escapa comillas. */
function celda(v: string | number | null) {
  let s = v === null ? '' : String(v)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

async function exportar(request: Request, url: URL) {
  if (!claveValida(claveDe(request, url))) return json({ error: 'Clave incorrecta.' }, 401)

  const rutas: string[] = []
  let cursor: string | undefined
  do {
    const pagina = await list({ prefix: PREFIJO, cursor, limit: 1000 })
    rutas.push(...pagina.blobs.map((b) => b.pathname))
    cursor = pagina.hasMore ? pagina.cursor : undefined
  } while (cursor)

  const registros: Registro[] = []
  for (let i = 0; i < rutas.length; i += 20) {
    const tanda = await Promise.all(rutas.slice(i, i + 20).map(leer))
    registros.push(...tanda.filter((r): r is Registro => r !== null))
  }
  registros.sort((a, b) => a.creado.localeCompare(b.creado))

  const invitados = new Map<string, number>()
  for (const r of registros) if (r.invitadoPor) invitados.set(r.invitadoPor, (invitados.get(r.invitadoPor) ?? 0) + 1)

  const columnas = ['creado', 'correo', 'nombre', 'rol', 'region', 'colegio', 'codigo', 'invitadoPor', 'invitados', 'fuente', 'medio', 'campana']
  const filas = registros.map((r) =>
    [r.creado, r.correo, r.nombre, r.rol, r.region, r.colegio, r.codigo, r.invitadoPor, invitados.get(r.codigo) ?? 0, r.fuente, r.medio, r.campana]
      .map(celda)
      .join(','),
  )

  return new Response(`﻿${[columnas.join(','), ...filas].join('\r\n')}\r\n`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="lista-espera-supermentes.csv"',
      'Cache-Control': 'no-store',
    },
  })
}
