// El intento de un alumno en una tarea (api/tareas.ts). Sin cuenta: el alumno eligió su nombre de la lista del salón.
//
//   POST /api/intentos  { codigo, alumno, segundos, respuestas: [{ pregunta, elegida, correcta }] }  → { primero }
//
// Cuenta el primero: si ya había uno, no se guarda nada (practicar otra vez no cambia lo que recibió su profe).
import { db } from './_db.js'
import { CODIGO, demasiadas, entero, json, objeto, texto } from './_juegos.js'

export async function POST(request: Request) {
  let o: Record<string, unknown>
  try {
    o = objeto(JSON.parse((await request.text()).slice(0, 20_000)))
  } catch {
    return json({ error: 'No pudimos leer tu tarea.' }, 400)
  }
  const codigo = texto(o.codigo, 6).toUpperCase()
  const alumno = entero(o.alumno, 1, Number.MAX_SAFE_INTEGER)
  const segundos = entero(o.segundos, 0, 24 * 3600)
  const respuestas = (Array.isArray(o.respuestas) ? o.respuestas : []).slice(0, 20).map((r) => {
    const x = objeto(r)
    return { pregunta: texto(x.pregunta, 300), elegida: texto(x.elegida, 120), correcta: texto(x.correcta, 120) }
  })
  if (!CODIGO.test(codigo) || alumno === null || segundos === null || !respuestas.length || respuestas.some((r) => !r.correcta)) {
    return json({ error: 'Faltan datos de tu tarea.' }, 400)
  }
  if (demasiadas(request, 'intento', 120)) return json({ error: 'Demasiadas tareas seguidas. Espera unos minutos.' }, 429)

  // El alumno tiene que ser del salón de la tarea.
  const { results } = await db().prepare('SELECT 1 FROM tareas t JOIN alumnos a ON a.salon = t.salon WHERE t.codigo = ? AND a.id = ?').bind(codigo, alumno).all()
  if (!results.length) return json({ error: 'No encontramos tu tarea.' }, 404)
  const aciertos = respuestas.filter((r) => r.elegida === r.correcta).length
  const r = (await db()
    .prepare('INSERT INTO intentos (tarea, alumno, aciertos, total, segundos, respuestas, fecha) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING')
    .bind(codigo, alumno, aciertos, respuestas.length, segundos, JSON.stringify(respuestas), new Date().toISOString())
    .run()) as { meta?: { changes?: number } }
  return json({ primero: (r.meta?.changes ?? 0) > 0 })
}
