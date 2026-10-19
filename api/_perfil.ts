// Perfil de la docente, del onboarding y de "Mi perfil" (ver api/_db.ts).
//
//   GET  /api/perfil  Authorization: Bearer <token de Clerk>  → { perfil: { nombre, colegio?, grado, grados, cursos, colegios } | null }
//   POST /api/perfil  Authorization: Bearer …  { nombre, colegios, grados, cursos }  → { perfil }        (tabla docentes)
//   (cada colegio: { nombre, numero?, logo?, tipo, grados, cursos }; el logo es un data URL de hasta ~200 KB)
//   POST /api/perfil  { anonimo: <id del navegador>, colegios, grados, cursos }  → { perfil }          (docentes_sin_cuenta)
//
// `colegios` es dónde enseña: [{ nombre, tipo: 'publico' | 'privado', grados, cursos }] (cursos vacío = todos; en un
// privado, también sus cursos propios como 'algebra'), guardado como JSON. `grados` y `cursos` juntan los de todos sus
// colegios y `grado` es el primero, para consultas simples. Lo de quien usa la app sin cuenta también se guarda (sin su
// nombre), para saber qué y dónde enseñan los docentes que la usan.
// Si a la base le faltan las columnas o la tabla (migrations-postgres/0002), se crean aquí la primera vez.
import { docente } from './_cuenta.js'
import { db } from './_db.js'
import { json, objeto, texto } from './_juegos.js'

type Fila = { nombre: string; colegio: string | null; grado: string; grados: string | null; cursos: string | null; colegios: string | null }
type Colegio = { nombre: string; numero?: string; logo?: string; tipo: 'publico' | 'privado'; grados: string[]; cursos: string[] }

/** El logo del colegio: una imagen chica que la app ya achicó (ver apps/web/src/app/documento.ts). */
const LOGO = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/

const GRADO = /^(primaria|secundaria)-\d$/
const CURSO = /^[a-z]+(-[a-z]+)*$/
const ANONIMO = /^[a-z0-9-]{8,64}$/

const lista = (v: unknown, valido: RegExp, max: number) =>
  Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string' && x.length <= 60 && valido.test(x)))].slice(0, max) : []

const separar = (v: string | null | undefined) => (v ? v.split(',').filter(Boolean) : [])

/** Hasta 6 colegios, cada uno con al menos un grado. */
function colegiosDe(v: unknown): Colegio[] {
  if (!Array.isArray(v)) return []
  return v
    .slice(0, 6)
    .map((x) => {
      const c = objeto(x)
      const numero = texto(c.numero, 12)
      const logo = typeof c.logo === 'string' && c.logo.length <= 300_000 && LOGO.test(c.logo) ? c.logo : undefined
      return {
        nombre: texto(c.nombre, 120),
        ...(numero && { numero }),
        ...(logo && { logo }),
        tipo: c.tipo === 'privado' ? 'privado' : 'publico',
        grados: lista(c.grados, GRADO, 11),
        cursos: lista(c.cursos, CURSO, 40),
      } as Colegio
    })
    .filter((c) => c.grados.length)
}

function leerColegios(v: string | null): Colegio[] {
  try {
    return colegiosDe(JSON.parse(v ?? '[]'))
  } catch {
    return []
  }
}

// Lo mismo que migrations-postgres/0001 (docentes) y 0002, por si no se corrió `npm run db:postgres`.
const ESQUEMA = [
  'CREATE TABLE IF NOT EXISTS docentes (id TEXT PRIMARY KEY, nombre TEXT NOT NULL, colegio TEXT, grado TEXT NOT NULL, creado TEXT NOT NULL)',
  'ALTER TABLE docentes ADD COLUMN IF NOT EXISTS grados TEXT',
  'ALTER TABLE docentes ADD COLUMN IF NOT EXISTS cursos TEXT',
  'ALTER TABLE docentes ADD COLUMN IF NOT EXISTS colegios TEXT',
  'ALTER TABLE docentes ADD COLUMN IF NOT EXISTS actualizado TEXT',
  'CREATE TABLE IF NOT EXISTS docentes_sin_cuenta (id TEXT PRIMARY KEY, grados TEXT NOT NULL, cursos TEXT NOT NULL, colegios TEXT, creado TEXT NOT NULL, actualizado TEXT NOT NULL)',
  'ALTER TABLE docentes_sin_cuenta ADD COLUMN IF NOT EXISTS colegios TEXT',
]

let esquema: Promise<unknown> | null = null

class SinBase extends Error {}

/** Sin base de datos (o si se cae) responde un error claro en vez de reventar la función. */
async function seguro(manejar: () => Promise<Response>): Promise<Response> {
  try {
    return await manejar()
  } catch (e) {
    if (!(e instanceof SinBase)) console.error('perfil', e)
    return json({ error: 'No pudimos guardar tu perfil. Intenta de nuevo en un momento.' }, 503)
  }
}

/** Corre la consulta; si falla porque falta una columna o una tabla, las crea y la vuelve a correr. */
async function conEsquema<T>(consulta: () => Promise<T>): Promise<T> {
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) throw new SinBase()
  try {
    return await consulta()
  } catch (e) {
    if (!/does not exist|no existe/i.test(String(e))) throw e
    esquema ??= db()
      .batch(ESQUEMA.map((s) => db().prepare(s)))
      .catch((error) => {
        esquema = null
        throw error
      })
    await esquema
    return consulta()
  }
}

export const GET = (request: Request) => seguro(() => leer(request))
export const POST = (request: Request) => seguro(() => guardar(request))

async function leer(request: Request) {
  const id = await docente(request)
  if (!id) return json({ error: 'Entra con tu cuenta.' }, 401)
  const { results } = await conEsquema(() =>
    db().prepare('SELECT nombre, colegio, grado, grados, cursos, colegios FROM docentes WHERE id = ?').bind(id).all<Fila>(),
  )
  const p = results[0]
  if (!p) return json({ perfil: null })
  const grados = separar(p.grados)
  return json({
    perfil: {
      nombre: p.nombre,
      colegio: p.colegio ?? undefined,
      grado: p.grado,
      grados: grados.length ? grados : [p.grado],
      cursos: separar(p.cursos),
      colegios: leerColegios(p.colegios),
    },
  })
}

async function guardar(request: Request) {
  const id = await docente(request)
  const o = objeto(await request.json().catch(() => null))
  const colegios = colegiosDe(o.colegios)
  // Si no manda colegios (clientes de antes), sus grados y cursos sueltos.
  const grados = lista(o.grados, GRADO, 11).concat(colegios.flatMap((c) => c.grados)).filter((g, i, xs) => xs.indexOf(g) === i)
  const cursos = lista(o.cursos, CURSO, 40).concat(colegios.flatMap((c) => c.cursos)).filter((c, i, xs) => xs.indexOf(c) === i)
  const ahora = new Date().toISOString()

  if (!id) {
    // Sin cuenta: solo lo que enseña, con el id que el navegador inventó la primera vez.
    const anonimo = texto(o.anonimo, 64)
    if (!ANONIMO.test(anonimo)) return json({ error: 'Entra con tu cuenta.' }, 401)
    if (!grados.length) return json({ error: 'Falta tu grado.' }, 400)
    await conEsquema(() =>
      db()
        .prepare(
          'INSERT INTO docentes_sin_cuenta (id, grados, cursos, colegios, creado, actualizado) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO UPDATE SET grados = excluded.grados, cursos = excluded.cursos, colegios = excluded.colegios, actualizado = excluded.actualizado',
        )
        .bind(anonimo, grados.join(','), cursos.join(','), JSON.stringify(colegios), ahora, ahora)
        .run(),
    )
    return json({ perfil: { grados, cursos, colegios } })
  }

  const nombre = texto(o.nombre, 60)
  const colegio = colegios[0]?.nombre || texto(o.colegio, 120) || undefined
  // Clientes de antes mandan solo `grado`.
  const grado = grados[0] ?? texto(o.grado, 20)
  if (!nombre || !GRADO.test(grado)) return json({ error: 'Falta tu nombre o tu grado.' }, 400)
  const todos = grados.length ? grados : [grado]
  await conEsquema(() =>
    db()
      .prepare(
        'INSERT INTO docentes (id, nombre, colegio, grado, grados, cursos, colegios, creado, actualizado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, colegio = excluded.colegio, grado = excluded.grado, grados = excluded.grados, cursos = excluded.cursos, colegios = COALESCE(excluded.colegios, docentes.colegios), actualizado = excluded.actualizado',
      )
      // Un cliente de antes no manda colegios: no se borran los que ya tenía.
      .bind(id, nombre, colegio ?? null, grado, todos.join(','), cursos.join(','), colegios.length ? JSON.stringify(colegios) : null, ahora, ahora)
      .run(),
  )
  return json({ perfil: { nombre, colegio, grado, grados: todos, cursos, colegios } })
}
