// Crea (o deja como están) las tablas de migrations-postgres/ en la base de DATABASE_URL: npm run db:postgres
import { readdirSync, readFileSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL
if (!url) {
  console.error('Falta DATABASE_URL (la de Neon, la misma que usa Vercel).')
  process.exit(1)
}
const sql = neon(url)
const carpeta = new URL('../migrations-postgres/', import.meta.url)
for (const archivo of readdirSync(carpeta).filter((f) => f.endsWith('.sql')).sort()) {
  const texto = readFileSync(new URL(archivo, carpeta), 'utf8').replace(/--.*$/gm, '')
  // Neon por HTTP corre una sentencia por pedido; van en una transacción: todo o nada.
  const sentencias = texto.split(';').map((s) => s.trim()).filter(Boolean)
  await sql.transaction(sentencias.map((s) => sql.query(s)))
  console.log(`✓ ${archivo}: ${sentencias.length} sentencias`)
}
