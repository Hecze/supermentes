// Los juegos que mandó la docente, guardados en su cuenta (Clerk) para ver los resultados desde cualquier computadora.
//
//   POST /api/mis-envios  Authorization: Bearer <token de Clerk>  { envios: Enviado[] }  → { envios: Enviado[] }
//
// El navegador manda los envíos que conoce y recibe la unión con los que ya estaban en su cuenta. Un solo archivo
// por docente (docentes/USER_ID.json): una lectura y una escritura por sincronización. Necesita CLERK_SECRET_KEY.
import { verifyToken } from '@clerk/backend'
import { put } from '@vercel/blob'
import { CODIGO, JUEGOS, json, leerJson, objeto, texto } from './_juegos.js'

type Enviado = { codigo: string; clave: string; juego: string; tema: string; grado?: string; practica?: string; fecha: string }

const MAXIMO = 200
const ORIGENES = ['https://www.supermentes.app', 'https://supermentes.app', 'https://supermentes.haroldmedrano33.workers.dev', 'http://localhost:5173', 'http://localhost:8787']

function limpiar(v: unknown): Enviado | null {
  const o = objeto(v)
  const codigo = texto(o.codigo, 6)
  const clave = texto(o.clave, 40)
  const juego = texto(o.juego, 20)
  const fecha = texto(o.fecha, 30)
  if (!CODIGO.test(codigo) || !clave || !JUEGOS.has(juego) || Number.isNaN(Date.parse(fecha))) return null
  return { codigo, clave, juego, tema: texto(o.tema, 120), grado: texto(o.grado, 40) || undefined, practica: texto(o.practica, 200) || undefined, fecha }
}

async function docente(request: Request) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer /, '')
  if (!token || !process.env.CLERK_SECRET_KEY) return null
  try {
    const { sub } = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY, authorizedParties: ORIGENES })
    return /^user_[A-Za-z0-9]+$/.test(sub) ? sub : null
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const id = await docente(request)
  if (!id) return json({ error: 'Entra con tu cuenta.' }, 401)
  let nuevos: Enviado[]
  try {
    const datos = objeto(JSON.parse((await request.text()).slice(0, 200_000)))
    nuevos = (Array.isArray(datos.envios) ? datos.envios : []).map(limpiar).filter((e): e is Enviado => e !== null)
  } catch {
    return json({ error: 'No pudimos leer tus juegos.' }, 400)
  }
  try {
    const ruta = `docentes/${id}.json`
    const antes = (await leerJson<Enviado[]>(ruta)) ?? []
    const porCodigo = new Map([...antes, ...nuevos].map((e) => [e.codigo, e]))
    const envios = [...porCodigo.values()].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, MAXIMO)
    if (envios.length !== antes.length || nuevos.some((e) => !antes.some((a) => a.codigo === e.codigo))) {
      await put(ruta, JSON.stringify(envios), { access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true })
    }
    return json({ envios })
  } catch (e) {
    console.error('No se pudieron sincronizar los envíos', e)
    return json({ error: 'No pudimos guardar tus juegos. Intenta de nuevo.' }, 500)
  }
}
