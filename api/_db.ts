// La base de datos de cuentas, salones, tareas, intentos y envíos: Postgres (Neon) con DATABASE_URL. Tablas en
// migrations-postgres/ (`npm run db:postgres`). Las consultas de api/ se escriben con "?" (prepare/bind/all/run/batch);
// aquí pasan a $1, $2… para Postgres.
import { neon, type NeonQueryPromise } from '@neondatabase/serverless'

type Resultado<T> = { results: T[] }
type Consulta = { bind(...valores: unknown[]): Consulta; all<T>(): Promise<Resultado<T>>; run(): Promise<{ meta: { changes: number } }> }
export type Base = { prepare(sql: string): Consulta; batch(consultas: Consulta[]): Promise<unknown> }

const aPostgres = (sql: string) => {
  let n = 0
  return sql.replace(/\?/g, () => `$${++n}`)
}

type ConsultaNeon = Consulta & { pendiente(): NeonQueryPromise<false, true> }

function postgres(url: string): Base {
  const sql = neon(url, { fullResults: true })
  const consulta = (texto: string, valores: unknown[] = []): ConsultaNeon => ({
    bind: (...v) => consulta(texto, v),
    pendiente: () => sql.query(aPostgres(texto), valores),
    all: async <T>() => ({ results: (await sql.query(aPostgres(texto), valores)).rows as T[] }),
    run: async () => ({ meta: { changes: (await sql.query(aPostgres(texto), valores)).rowCount ?? 0 } }),
  })
  // batch: todo o nada.
  return { prepare: (t) => consulta(t), batch: (cs) => sql.transaction(cs.map((c) => (c as ConsultaNeon).pendiente())) }
}

let neonBase: Base | null = null

export function db(): Base {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL
  // Sin base no hay cuentas ni tareas: que se vea en el log, no un fallo callado.
  if (!url) throw new Error('Falta DATABASE_URL: sin base de datos no hay cuentas, salones ni tareas.')
  return (neonBase ??= postgres(url))
}
