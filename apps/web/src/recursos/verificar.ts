// Verificador de recursos.json: cada recurso con su fuente, un enlace https, grados y cursos que existen en el
// currículo, y la fecha en que se comprobó el enlace. Que el enlace siga abriendo lo revisa
// `npm run verificar:enlaces` (necesita internet). Lo corre `npm run verificar:curriculo`; no lo importa la app.
import { AREAS_POR_NIVEL, GRADOS_CURRICULO } from '../curriculo/catalogo'
import { ORDEN_TIPOS, TIPOS, type RecursoOficial } from './catalogo'
import recursos from './recursos.json'

export function verificarRecursos() {
  const grados = new Set(GRADOS_CURRICULO.map((g) => g.id))
  const areas = new Set(Object.values(AREAS_POR_NIVEL).flatMap((l) => l.map((a) => a.id)))
  const errores: string[] = []
  const urls = new Set<string>()
  for (const r of recursos as RecursoOficial[]) {
    const quien = `«${r.titulo ?? '(sin título)'}»`
    if (!ORDEN_TIPOS.includes(r.tipo)) errores.push(`${quien}: tipo desconocido «${r.tipo}».`)
    for (const campo of ['titulo', 'fuente', 'descripcion'] as const) if (!r[campo]?.trim()) errores.push(`${quien}: falta ${campo}.`)
    for (const u of [r.url, r.pdf, ...(r.partes ?? []).map((p) => p.url)].filter(Boolean) as string[])
      if (!/^https:\/\/[^\s]+$/.test(u)) errores.push(`${quien}: enlace no válido ${u}`)
    for (const p of r.partes ?? []) if (!p.nombre?.trim()) errores.push(`${quien}: una parte no tiene nombre.`)
    if (urls.has(r.url)) errores.push(`${quien}: enlace repetido ${r.url}`)
    urls.add(r.url)
    for (const g of r.grados ?? []) if (!grados.has(g)) errores.push(`${quien}: grado desconocido «${g}».`)
    for (const a of r.areas ?? []) if (!areas.has(a)) errores.push(`${quien}: curso desconocido «${a}».`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.verificado ?? '')) errores.push(`${quien}: falta la fecha en que se comprobó el enlace.`)
  }
  const porTipo = Object.fromEntries(ORDEN_TIPOS.map((t) => [TIPOS[t].plural.toLowerCase(), (recursos as RecursoOficial[]).filter((r) => r.tipo === t).length]))
  return { total: recursos.length, porTipo, errores }
}
