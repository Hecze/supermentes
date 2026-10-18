// D1, la base de datos de Cloudflare (binding DB en wrangler.jsonc). Tablas en migrations/.
// ponytail: solo existe en Cloudflare (wrangler deploy / wrangler dev); en `npm run dev` con Vite no hay DB.
// @ts-expect-error: módulo de Cloudflare, sin tipos en el tsconfig de Node de api/
import { env } from 'cloudflare:workers'

type Resultado<T> = { results: T[] }
type Consulta = { bind(...valores: unknown[]): Consulta; all<T>(): Promise<Resultado<T>>; run(): Promise<unknown> }
export type D1 = { prepare(sql: string): Consulta; batch(consultas: Consulta[]): Promise<unknown> }

export const db = () => (env as { DB: D1 }).DB
