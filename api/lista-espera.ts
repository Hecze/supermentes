// Lista de espera: guarda cada registro como un archivo privado en Vercel Blob.
//
//   GET  /api/lista-espera                         → { total }  (contador público, cacheado)
//   POST /api/lista-espera  { correo, nombre, … }  → { ok, nuevo, codigo, total }
//   GET  /api/lista-espera?formato=csv&clave=…     → CSV con todos los registros (requiere LISTA_CLAVE)
import { createHash, timingSafeEqual } from 'node:crypto'
import { get, list, put } from '@vercel/blob'

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

async function leer(ruta: string): Promise<Registro | null> {
  const r = await get(ruta, { access: 'private', useCache: false })
  if (!r || r.statusCode !== 200 || !r.stream) return null
  return JSON.parse(await new Response(r.stream).text()) as Registro
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  if (url.searchParams.get('formato') === 'csv') return exportar(request, url)
  try {
    // El contador se cachea en la CDN para no listar la tienda en cada visita.
    return json({ total: await contar() }, 200, { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' })
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

    await put(ruta, JSON.stringify(registro), {
      access: 'private',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    })

    return json({ ok: true, nuevo: !previo, codigo, total: await contar() })
  } catch (e) {
    console.error('No se pudo guardar el registro', e)
    return json({ error: 'No pudimos guardar tus datos. Intenta de nuevo en un momento.' }, 500)
  }
}

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
  const dada = url.searchParams.get('clave') ?? request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null
  if (!claveValida(dada)) return json({ error: 'Clave incorrecta.' }, 401)

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
