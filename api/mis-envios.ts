// Los juegos que mandó la docente, guardados en su cuenta (Clerk) para ver los resultados desde cualquier computadora.
//
//   POST /api/mis-envios  Authorization: Bearer <token de Clerk>  { envios: Enviado[] }  → { envios: Enviado[] }
//
// El navegador manda los envíos que conoce y recibe la unión con los que ya estaban en su cuenta (tabla envios; ver api/_db.ts).
// Necesita CLERK_SECRET_KEY.
import { docente } from './_cuenta.js'
import { db } from './_db.js'
import { CODIGO, JUEGOS, json, objeto, texto } from './_juegos.js'

type Enviado = { codigo: string; clave: string; juego: string; tema: string; grado?: string; practica?: string; fecha: string }

const MAXIMO = 200

function limpiar(v: unknown): Enviado | null {
  const o = objeto(v)
  const codigo = texto(o.codigo, 6)
  const clave = texto(o.clave, 40)
  const juego = texto(o.juego, 20)
  const fecha = texto(o.fecha, 30)
  if (!CODIGO.test(codigo) || !clave || !JUEGOS.has(juego) || Number.isNaN(Date.parse(fecha))) return null
  return { codigo, clave, juego, tema: texto(o.tema, 120), grado: texto(o.grado, 40) || undefined, practica: texto(o.practica, 200) || undefined, fecha }
}

export async function POST(request: Request) {
  const id = await docente(request)
  if (!id) return json({ error: 'Entra con tu cuenta.' }, 401)
  let nuevos: Enviado[]
  try {
    const datos = objeto(JSON.parse((await request.text()).slice(0, 200_000)))
    nuevos = (Array.isArray(datos.envios) ? datos.envios : []).slice(0, MAXIMO).map(limpiar).filter((e): e is Enviado => e !== null)
  } catch {
    return json({ error: 'No pudimos leer tus juegos.' }, 400)
  }
  try {
    // ON CONFLICT DO NOTHING: un envío no cambia después de mandarse; lo que ya estaba se respeta.
    const insertar = db().prepare(
      'INSERT INTO envios (docente, codigo, clave, juego, tema, grado, practica, fecha) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING',
    )
    if (nuevos.length) await db().batch(nuevos.map((e) => insertar.bind(id, e.codigo, e.clave, e.juego, e.tema, e.grado ?? null, e.practica ?? null, e.fecha)))
    const { results } = await db()
      .prepare('SELECT codigo, clave, juego, tema, grado, practica, fecha FROM envios WHERE docente = ? ORDER BY fecha DESC LIMIT ?')
      .bind(id, MAXIMO)
      .all<Enviado>()
    return json({ envios: results.map((e) => ({ ...e, grado: e.grado ?? undefined, practica: e.practica ?? undefined })) })
  } catch (e) {
    console.error('No se pudieron sincronizar los envíos', e)
    return json({ error: 'No pudimos guardar tus juegos. Intenta de nuevo.' }, 500)
  }
}
