// Lista de espera: cada registro se guarda en Postgres (Neon) con api/_almacen.ts; sin DATABASE_URL, en Vercel Blob.
//
//   GET  /api/lista-espera                         → { total }  (contador público, cacheado una hora)
//   POST /api/lista-espera  { correo, nombre, … }  → { ok, nuevo, codigo, total }  (total null si se usa Blob)
//   GET  /api/lista-espera?formato=csv&clave=…     → CSV con todos los registros (requiere LISTA_CLAVE)
//   DELETE /api/lista-espera?correo=…&clave=…      → borra un registro (pruebas o spam; requiere LISTA_CLAVE)
//
// Si se usa Blob: el plan Hobby permite 2.000 operaciones avanzadas (put, list) al mes y se bloquea 30 días si
// se pasan. Por eso, con Blob, cada inscripción hace un solo put y el contador se cachea una hora.
import { createHash, timingSafeEqual } from 'node:crypto'
import { borrar, contar as contarEn, guardar, leer as leerDe, motor, todos } from './_almacen.js'

const PREFIJO = 'lista-espera/'
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Celular peruano: 9 dígitos que empiezan con 9, con o sin +51 y espacios. Devuelve +51…, '' si no hay o null si no es válido. */
function celularDe(v: unknown): string | null {
  const d = typeof v === 'string' ? v.replace(/\D/g, '').replace(/^51(?=9\d{8}$)/, '') : ''
  if (!d) return ''
  return /^9\d{8}$/.test(d) ? `+51${d}` : null
}

type Registro = {
  correo: string
  nombre: string
  rol: string
  region: string
  colegio: string
  /** WhatsApp en formato +51XXXXXXXXX (opcional): por ahí se le manda su material, como hace ACET. */
  celular: string
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

const contar = () => contarEn(PREFIJO)

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

const leer = (ruta: string) => leerDe<Registro>(ruta)

export async function GET(request: Request) {
  const url = new URL(request.url)
  if (url.searchParams.get('formato') === 'csv') return exportar(request, url)
  try {
    // Con Postgres el conteo es barato (un minuto de caché); con Blob, cada list() gasta operaciones (una hora).
    const cache = motor === 'postgres' ? 'public, s-maxage=60, stale-while-revalidate=600' : 'public, s-maxage=3600, stale-while-revalidate=86400'
    return json({ total: await contar() }, 200, { 'Cache-Control': cache })
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
  const celular = celularDe(datos.celular)
  if (celular === null) return json({ error: 'Revisa tu WhatsApp: son 9 números y empiezan con 9.' }, 400)

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
      celular: celular || previo?.celular || '',
      codigo,
      invitadoPor: previo ? previo.invitadoPor : invitadoPor && invitadoPor !== codigo ? invitadoPor : null,
      fuente: previo ? previo.fuente : texto(datos.fuente, 60) || null,
      medio: previo ? previo.medio : texto(datos.medio, 60) || null,
      campana: previo ? previo.campana : texto(datos.campana, 80) || null,
      creado: previo?.creado ?? ahora,
      actualizado: ahora,
    }

    // Si ya estaba y no cambió nada, no se vuelve a escribir.
    const cambio = !previo || (['nombre', 'rol', 'region', 'colegio', 'celular'] as const).some((k) => registro[k] !== previo[k])
    if (cambio) {
      await guardar(ruta, registro)
    }

    // Con Blob no se cuenta: gastaría otra operación avanzada en cada inscripción.
    return json({ ok: true, nuevo: !previo, codigo, total: motor === 'postgres' ? await contar() : null })
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
  await borrar(ruta)
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

  const registros = await todos<Registro>(PREFIJO)
  registros.sort((a, b) => a.creado.localeCompare(b.creado))

  const invitados = new Map<string, number>()
  for (const r of registros) if (r.invitadoPor) invitados.set(r.invitadoPor, (invitados.get(r.invitadoPor) ?? 0) + 1)

  const columnas = ['creado', 'correo', 'celular', 'nombre', 'rol', 'region', 'colegio', 'codigo', 'invitadoPor', 'invitados', 'fuente', 'medio', 'campana']
  const filas = registros.map((r) =>
    [r.creado, r.correo, r.celular ?? '', r.nombre, r.rol, r.region, r.colegio, r.codigo, r.invitadoPor, invitados.get(r.codigo) ?? 0, r.fuente, r.medio, r.campana]
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
