// Resultados de los alumnos en un juego compartido: el mejor puntaje de cada uno y cuántas veces jugó.
//
//   POST /api/resultados  { codigo, alumno: { id, nombre }, juego, puntaje, estrellas }  → { ok, mejor, nuevoRecord }
//   GET  /api/resultados?codigo=ABC234&clave=…                                            → { juego, alumnos[] }
//
// Sin cuentas: el alumno escribe su nombre la primera vez y su celular guarda un id. Cada alumno es un archivo
// privado (resultados/CODIGO/ID.json), así dos alumnos que terminan a la vez no se pisan. Ver los resultados
// pide la clave que recibió el docente al compartir el juego.
import { list, put } from '@vercel/blob'
import { CODIGO, JUEGOS, claveCorrecta, entero, json, leerJson, leerJuego, objeto, texto } from './_juegos.js'

type Registro = {
  id: string
  nombre: string
  intentos: number
  mejor: { puntaje: number; estrellas: number; juego: string; fecha: string }
  primero: string
  ultimo: string
}

const ruta = (codigo: string, id: string) => `resultados/${codigo}/${id}.json`

export async function POST(request: Request) {
  let datos: Record<string, unknown>
  try {
    datos = objeto(JSON.parse((await request.text()).slice(0, 5000)))
  } catch {
    return json({ error: 'No pudimos leer el resultado.' }, 400)
  }
  const codigo = texto(datos.codigo, 6).toUpperCase()
  const alumno = objeto(datos.alumno)
  const id = texto(alumno.id, 24)
  const nombre = texto(alumno.nombre, 30)
  const juego = texto(datos.juego, 20)
  const puntaje = entero(datos.puntaje, 0, 1_000_000)
  const estrellas = entero(datos.estrellas, 0, 3)
  if (!CODIGO.test(codigo) || !/^[a-z0-9]{8,24}$/.test(id) || !nombre || !JUEGOS.has(juego) || puntaje === null || estrellas === null) {
    return json({ error: 'Faltan datos del resultado.' }, 400)
  }

  try {
    if (!(await leerJuego(codigo))) return json({ error: 'No encontramos ese juego.' }, 404)
    const previo = await leerJson<Registro>(ruta(codigo, id))
    const ahora = new Date().toISOString()
    const nuevoRecord = !previo || puntaje > previo.mejor.puntaje
    const registro: Registro = {
      id,
      nombre,
      intentos: (previo?.intentos ?? 0) + 1,
      mejor: nuevoRecord ? { puntaje, estrellas, juego, fecha: ahora } : previo.mejor,
      primero: previo?.primero ?? ahora,
      ultimo: ahora,
    }
    await put(ruta(codigo, id), JSON.stringify(registro), { access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true })
    return json({ ok: true, mejor: registro.mejor.puntaje, nuevoRecord })
  } catch (e) {
    console.error('No se pudo guardar el resultado', e)
    return json({ error: 'No pudimos guardar tu puntaje. Intenta de nuevo.' }, 500)
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const codigo = (url.searchParams.get('codigo') ?? '').trim().toUpperCase()
  if (!CODIGO.test(codigo)) return json({ error: 'Ese código no es válido.' }, 400)
  try {
    const juego = await leerJuego(codigo)
    if (!juego) return json({ error: 'No encontramos ese juego.' }, 404)
    if (!claveCorrecta(juego.clave, url.searchParams.get('clave'))) return json({ error: 'Solo el docente que compartió el juego puede ver los resultados.' }, 401)

    const rutas: string[] = []
    let cursor: string | undefined
    do {
      const pagina = await list({ prefix: `resultados/${codigo}/`, cursor, limit: 1000 })
      rutas.push(...pagina.blobs.map((b) => b.pathname))
      cursor = pagina.hasMore ? pagina.cursor : undefined
    } while (cursor)

    const alumnos: Registro[] = []
    for (let i = 0; i < rutas.length; i += 20) {
      const tanda = await Promise.all(rutas.slice(i, i + 20).map((r) => leerJson<Registro>(r)))
      alumnos.push(...tanda.filter((r): r is Registro => r !== null))
    }
    alumnos.sort((a, b) => b.mejor.puntaje - a.mejor.puntaje || a.nombre.localeCompare(b.nombre))
    return json({ juego: { codigo, juego: juego.juego, tema: juego.tema, creado: juego.creado }, alumnos })
  } catch (e) {
    console.error('No se pudieron leer los resultados', e)
    return json({ error: 'No pudimos traer los resultados. Intenta de nuevo.' }, 500)
  }
}
