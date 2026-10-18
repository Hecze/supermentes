// Resultados de los alumnos en un juego compartido: el mejor puntaje de cada uno.
//
//   POST /api/resultados  { codigo, alumno: { id, nombre }, juego, puntaje, estrellas }  → { ok, mejor, nuevoRecord }
//   GET  /api/resultados?codigo=ABC234&clave=…                                            → { juego, alumnos[] }
//
// Sin cuentas: el alumno escribe su nombre la primera vez y su celular guarda un id. Cada alumno es un archivo
// privado (resultados/CODIGO/ID.json), así dos alumnos que terminan a la vez no se pisan. Ver los resultados
// pide la clave que recibió el docente al compartir el juego.
//
// El plan Hobby de Vercel permite 2.000 operaciones avanzadas (put, list) al mes y bloquea Blob 30 días si se
// pasan (ver api/lista-espera.ts). Por eso solo se escribe cuando el alumno mejora su puntaje (el celular ni
// siquiera llama si no lo superó) y el docente lista los resultados solo del juego que abre.
import { guardar, todos } from './_almacen.js'
import { CODIGO, JUEGOS, claveCorrecta, demasiadas, entero, json, leerJson, leerJuego, objeto, texto } from './_juegos.js'

type Registro = {
  id: string
  nombre: string
  mejor: { puntaje: number; estrellas: number; juego: string; fecha: string }
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
    if (previo && puntaje <= previo.mejor.puntaje) return json({ ok: true, mejor: previo.mejor.puntaje, nuevoRecord: false })
    if (demasiadas(request, 'resultado', 60)) return json({ error: 'Demasiados puntajes seguidos. Espera unos minutos.' }, 429)
    const registro: Registro = { id, nombre, mejor: { puntaje, estrellas, juego, fecha: new Date().toISOString() } }
    await guardar(ruta(codigo, id), registro)
    return json({ ok: true, mejor: puntaje, nuevoRecord: true })
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

    const alumnos = await todos<Registro>(`resultados/${codigo}/`)
    alumnos.sort((a, b) => b.mejor.puntaje - a.mejor.puntaje || a.nombre.localeCompare(b.nombre))
    return json({ juego: { codigo, juego: juego.juego, tema: juego.tema, creado: juego.creado }, alumnos })
  } catch (e) {
    console.error('No se pudieron leer los resultados', e)
    return json({ error: 'No pudimos traer los resultados. Intenta de nuevo.' }, 500)
  }
}
