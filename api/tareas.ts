// Tareas por salón: un Concurso con reloj para un salón, que el alumno hace eligiendo su nombre (obsidian/TAREAS.md).
//
//   POST /api/tareas  Authorization: Bearer <token de Clerk>  { salon, publicado, area, desempeno, vence }  → { codigo }
//   GET  /api/tareas?codigo=ABC234   (alumno, sin cuenta)  → la tarea, el juego y la lista del salón con quién ya la hizo
//   GET  /api/tareas  Authorization: Bearer …              → { tareas[] } de la docente, con sus alumnos e intentos
//
// El reloj por pregunta sale del grado: 30 s en 1.º–2.º, 20 s en 3.º–4.º y 15 s desde 5.º.
import { randomInt } from 'node:crypto'
import { docente } from './_cuenta.js'
import { db } from './_db.js'
import { CODIGO, json, objeto, texto } from './_juegos.js'
import { validar } from './juegos-compartidos.js'

const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const nuevoCodigo = () => Array.from({ length: 6 }, () => ALFABETO[randomInt(ALFABETO.length)]).join('')

function segundosDe(grado: string | undefined) {
  const [nivel, n] = (grado ?? '').split('-')
  if (nivel === 'primaria') return Number(n) <= 2 ? 30 : Number(n) <= 4 ? 20 : 15
  return nivel === 'secundaria' ? 15 : 30
}

type Fila = { codigo: string; salon: string; grado: string; seccion: string; tema: string; area: string; desempeno: string; juego: string; segundos: number; vence: string; creado: string }
type Alumno = { id: number; salon: string; nombre: string }
type Intento = { tarea: string; alumno: number; aciertos: number; total: number; segundos: number; respuestas: string; fecha: string }

export async function POST(request: Request) {
  const id = await docente(request)
  if (!id) return json({ error: 'Entra con tu cuenta.' }, 401)
  const cuerpo = await request.text()
  if (cuerpo.length > 200_000) return json({ error: 'La tarea es demasiado grande.' }, 413)
  let o: Record<string, unknown>
  try {
    o = objeto(JSON.parse(cuerpo))
  } catch {
    return json({ error: 'No pudimos leer la tarea.' }, 400)
  }
  const salon = texto(o.salon, 20)
  const vence = texto(o.vence, 10)
  const limpio = validar({ ...objeto(o.publicado), juego: 'concurso' })
  if (typeof limpio === 'string') return json({ error: limpio }, 400)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(vence)) return json({ error: 'Falta hasta cuándo entregan.' }, 400)
  const { results } = await db().prepare('SELECT id FROM salones WHERE id = ? AND docente = ?').bind(salon, id).all()
  if (!results.length) return json({ error: 'No encontramos ese salón.' }, 404)

  const insertar = db().prepare(
    'INSERT INTO tareas (codigo, docente, salon, tema, area, desempeno, juego, segundos, vence, creado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  )
  for (let i = 0; i < 4; i++) {
    const codigo = nuevoCodigo()
    try {
      await insertar
        .bind(codigo, id, salon, limpio.tema, texto(o.area, 60), texto(o.desempeno, 600), JSON.stringify(limpio), segundosDe(limpio.grado), vence, new Date().toISOString())
        .run()
      return json({ codigo })
    } catch (e) {
      if (!/UNIQUE/.test(String(e))) throw e
    }
  }
  return json({ error: 'No pudimos crear la tarea. Intenta de nuevo.' }, 500)
}

export async function GET(request: Request) {
  const codigo = (new URL(request.url).searchParams.get('codigo') ?? '').trim().toUpperCase()
  if (codigo) {
    if (!CODIGO.test(codigo)) return json({ error: 'Ese código no es válido.' }, 400)
    const { results } = await db()
      .prepare(
        `SELECT t.codigo, t.salon, s.grado, s.seccion, t.tema, t.area, t.juego, t.segundos, t.vence, d.nombre AS profe
         FROM tareas t JOIN salones s ON s.id = t.salon LEFT JOIN docentes d ON d.id = t.docente WHERE t.codigo = ?`,
      )
      .bind(codigo)
      .all<Fila & { profe: string | null }>()
    const t = results[0]
    if (!t) return json({ error: 'No encontramos esa tarea.' }, 404)
    // Solo el nombre y si ya la hizo: ningún puntaje sale hacia el celular del alumno.
    const { results: alumnos } = await db()
      .prepare('SELECT a.id, a.nombre, EXISTS (SELECT 1 FROM intentos i WHERE i.tarea = ? AND i.alumno = a.id) AS hizo FROM alumnos a WHERE a.salon = ? ORDER BY a.orden')
      .bind(codigo, t.salon)
      .all<{ id: number; nombre: string; hizo: number }>()
    const { juego, ...resto } = t
    return json({ ...resto, profe: t.profe ?? '', publicado: JSON.parse(juego), alumnos: alumnos.map((a) => ({ ...a, hizo: !!a.hizo })) })
  }

  const id = await docente(request)
  if (!id) return json({ error: 'Entra con tu cuenta.' }, 401)
  const [tareas, alumnos, intentos] = await Promise.all([
    db()
      .prepare(
        'SELECT t.codigo, t.salon, s.grado, s.seccion, t.tema, t.area, t.desempeno, t.segundos, t.vence, t.creado FROM tareas t JOIN salones s ON s.id = t.salon WHERE t.docente = ? ORDER BY t.creado DESC LIMIT 100',
      )
      .bind(id)
      .all<Omit<Fila, 'juego'>>(),
    db().prepare('SELECT a.id, a.salon, a.nombre FROM alumnos a JOIN salones s ON s.id = a.salon WHERE s.docente = ? ORDER BY a.orden').bind(id).all<Alumno>(),
    db()
      .prepare('SELECT i.tarea, i.alumno, i.aciertos, i.total, i.segundos, i.respuestas, i.fecha FROM intentos i JOIN tareas t ON t.codigo = i.tarea WHERE t.docente = ?')
      .bind(id)
      .all<Intento>(),
  ])
  return json({
    tareas: tareas.results.map((t) => ({
      ...t,
      alumnos: alumnos.results.filter((a) => a.salon === t.salon).map(({ id, nombre }) => ({ id, nombre })),
      intentos: intentos.results.filter((i) => i.tarea === t.codigo).map(({ tarea: _t, respuestas, ...i }) => ({ ...i, respuestas: JSON.parse(respuestas) })),
    })),
  })
}
