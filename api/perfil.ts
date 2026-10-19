// Perfil de la docente, del onboarding (tabla docentes; ver api/_db.ts).
//
//   GET  /api/perfil  Authorization: Bearer <token de Clerk>               → { perfil: { nombre, colegio?, grado } | null }
//   POST /api/perfil  Authorization: Bearer …  { nombre, colegio?, grado }  → { perfil }
import { docente } from './_cuenta.js'
import { db } from './_db.js'
import { json, objeto, texto } from './_juegos.js'

type Perfil = { nombre: string; colegio?: string; grado: string }

export async function GET(request: Request) {
  const id = await docente(request)
  if (!id) return json({ error: 'Entra con tu cuenta.' }, 401)
  const { results } = await db().prepare('SELECT nombre, colegio, grado FROM docentes WHERE id = ?').bind(id).all<Perfil & { colegio: string | null }>()
  const p = results[0]
  return json({ perfil: p ? { nombre: p.nombre, colegio: p.colegio ?? undefined, grado: p.grado } : null })
}

export async function POST(request: Request) {
  const id = await docente(request)
  if (!id) return json({ error: 'Entra con tu cuenta.' }, 401)
  const o = objeto(await request.json().catch(() => null))
  const nombre = texto(o.nombre, 60)
  const colegio = texto(o.colegio, 120) || undefined
  const grado = texto(o.grado, 20)
  if (!nombre || !/^(inicial|primaria|secundaria)-\d$/.test(grado)) return json({ error: 'Falta tu nombre o tu grado.' }, 400)
  await db()
    .prepare(
      'INSERT INTO docentes (id, nombre, colegio, grado, creado) VALUES (?, ?, ?, ?, ?) ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, colegio = excluded.colegio, grado = excluded.grado',
    )
    .bind(id, nombre, colegio ?? null, grado, new Date().toISOString())
    .run()
  return json({ perfil: { nombre, colegio, grado } })
}
