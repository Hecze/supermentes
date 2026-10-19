// Perfil de la docente, del onboarding y de "Mi perfil" (tabla docentes; ver api/_db.ts).
//
//   GET  /api/perfil  Authorization: Bearer <token de Clerk>  → { perfil: { nombre, colegio?, grado, grados, cursos } | null }
//   POST /api/perfil  Authorization: Bearer …  { nombre, colegio?, grado?, grados?, cursos? }  → { perfil }
//
// `grados` y `cursos` son lo que enseña (cursos vacío = todos); `grado` es el primero de sus grados. Si la base aún
// no tiene esas columnas (falta la migración 0002 / 0004), se guarda solo `grado`, como antes.
import { docente } from './_cuenta.js'
import { db } from './_db.js'
import { json, objeto, texto } from './_juegos.js'

type Perfil = { nombre: string; colegio?: string; grado: string; grados: string[]; cursos: string[] }
type Fila = { nombre: string; colegio: string | null; grado: string; grados?: string | null; cursos?: string | null }

const GRADO = /^(primaria|secundaria)-\d$/
const CURSO = /^[a-z]+(-[a-z]+)*$/

const lista = (v: unknown, valido: RegExp, max: number) =>
  Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string' && x.length <= 60 && valido.test(x)))].slice(0, max) : []

const separar = (v: string | null | undefined) => (v ? v.split(',').filter(Boolean) : [])

export async function GET(request: Request) {
  const id = await docente(request)
  if (!id) return json({ error: 'Entra con tu cuenta.' }, 401)
  const consulta = (columnas: string) => db().prepare(`SELECT ${columnas} FROM docentes WHERE id = ?`).bind(id).all<Fila>()
  const { results } = await consulta('nombre, colegio, grado, grados, cursos').catch(() => consulta('nombre, colegio, grado'))
  const p = results[0]
  if (!p) return json({ perfil: null })
  const grados = separar(p.grados)
  return json({ perfil: { nombre: p.nombre, colegio: p.colegio ?? undefined, grado: p.grado, grados: grados.length ? grados : [p.grado], cursos: separar(p.cursos) } })
}

export async function POST(request: Request) {
  const id = await docente(request)
  if (!id) return json({ error: 'Entra con tu cuenta.' }, 401)
  const o = objeto(await request.json().catch(() => null))
  const nombre = texto(o.nombre, 60)
  const colegio = texto(o.colegio, 120) || undefined
  const grados = lista(o.grados, GRADO, 11)
  const cursos = lista(o.cursos, CURSO, 12)
  const grado = grados[0] ?? texto(o.grado, 20)
  if (!nombre || !/^(inicial|primaria|secundaria)-\d$/.test(grado)) return json({ error: 'Falta tu nombre o tu grado.' }, 400)

  const creado = new Date().toISOString()
  const completo = () =>
    db()
      .prepare(
        'INSERT INTO docentes (id, nombre, colegio, grado, grados, cursos, creado) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, colegio = excluded.colegio, grado = excluded.grado, grados = excluded.grados, cursos = excluded.cursos',
      )
      .bind(id, nombre, colegio ?? null, grado, (grados.length ? grados : [grado]).join(','), cursos.join(','), creado)
      .run()
  const soloGrado = () =>
    db()
      .prepare(
        'INSERT INTO docentes (id, nombre, colegio, grado, creado) VALUES (?, ?, ?, ?, ?) ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, colegio = excluded.colegio, grado = excluded.grado',
      )
      .bind(id, nombre, colegio ?? null, grado, creado)
      .run()
  await completo().catch(soloGrado)

  const perfil: Perfil = { nombre, colegio, grado, grados: grados.length ? grados : [grado], cursos }
  return json({ perfil })
}
