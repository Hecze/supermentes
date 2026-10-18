// Salones de la docente: grado, sección y la lista de nombres que pegó (tablas salones y alumnos de D1).
//
//   GET  /api/salones  Authorization: Bearer <token de Clerk>                         → { salones: [{ id, grado, seccion, alumnos }] }
//   POST /api/salones  Authorization: Bearer …  { grado, seccion, alumnos: string[] }  → { salon }
//
// Solo nombres: nada de DNI, teléfonos ni correos. Los alumnos no tienen cuenta; eligen su nombre de esta lista.
import { randomBytes } from 'node:crypto'
import { docente } from './_cuenta.js'
import { db } from './_db.js'
import { json, objeto, texto } from './_juegos.js'

type Salon = { id: string; grado: string; seccion: string; alumnos: number }

export async function GET(request: Request) {
  const id = await docente(request)
  if (!id) return json({ error: 'Entra con tu cuenta.' }, 401)
  const { results } = await db()
    .prepare('SELECT s.id, s.grado, s.seccion, COUNT(a.id) AS alumnos FROM salones s LEFT JOIN alumnos a ON a.salon = s.id WHERE s.docente = ? GROUP BY s.id ORDER BY s.creado DESC')
    .bind(id)
    .all<Salon>()
  return json({ salones: results })
}

export async function POST(request: Request) {
  const id = await docente(request)
  if (!id) return json({ error: 'Entra con tu cuenta.' }, 401)
  const o = objeto(await request.json().catch(() => null))
  const grado = texto(o.grado, 20)
  const seccion = texto(o.seccion, 20)
  // Pegada del registro, de Excel o de WhatsApp: se quitan números de orden ("1.", "2)") y repetidos.
  const nombres = [
    ...new Set(
      (Array.isArray(o.alumnos) ? o.alumnos : [])
        .slice(0, 80)
        .map((n) => texto(n, 60).replace(/^\d+\s*[.)\-–]?\s*/, ''))
        .filter((n) => n.length >= 2),
    ),
  ].slice(0, 60)
  if (!/^(inicial|primaria|secundaria)-\d$/.test(grado) || !seccion || !nombres.length) return json({ error: 'Falta la sección o la lista de alumnos.' }, 400)

  const salon = randomBytes(9).toString('base64url')
  const insertar = db().prepare('INSERT INTO alumnos (salon, nombre, orden) VALUES (?, ?, ?)')
  await db().batch([
    db().prepare('INSERT INTO salones (id, docente, grado, seccion, creado) VALUES (?, ?, ?, ?, ?)').bind(salon, id, grado, seccion, new Date().toISOString()),
    ...nombres.map((n, i) => insertar.bind(salon, n, i)),
  ])
  return json({ salon: { id: salon, grado, seccion, alumnos: nombres.length } satisfies Salon })
}
