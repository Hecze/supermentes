// Valida el banco de un grado y área antes de sumarlo (ver src/banco/README.md): formato y largos como los de 4.º,
// cada cita letra por letra en un desempeño de su competencia, todos los temas del currículo y cuántos juegos tiene
// cada tema apenas se crea (con la misma lógica de la app). Sale con código 1 si algo no cuadra.
//   node scripts/validar-banco.mjs secundaria-1 ciencia-y-tecnologia ruta/al/archivo.json
//   node scripts/validar-banco.mjs secundaria-1 ciencia-y-tecnologia ruta/a/una/carpeta [--parcial]
// Una carpeta junta sus .json en orden de nombre. Con --parcial no exige que estén todos los temas.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const args = process.argv.slice(2)
const parcial = args.includes('--parcial')
const [gradoId, areaId, ruta] = args.filter((a) => !a.startsWith('--'))
if (!gradoId || !areaId || !ruta) {
  console.error('Uso: node scripts/validar-banco.mjs <gradoId> <areaId> <archivo.json o carpeta> [--parcial]')
  process.exit(1)
}

const leer = (r) => {
  const p = resolve(r)
  if (!statSync(p).isDirectory()) return JSON.parse(readFileSync(p, 'utf8'))
  return readdirSync(p)
    .filter((f) => f.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .flatMap((f) => JSON.parse(readFileSync(join(p, f), 'utf8')))
}

const LETRAS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+$/
const CLAVES = ['tema', 'competencia', 'cita', 'palabras', 'preguntas', 'pares'].join(',')

const raiz = fileURLToPath(new URL('..', import.meta.url))
const vite = await createServer({ root: raiz, configFile: false, logLevel: 'error', appType: 'custom', server: { middlewareMode: true, hmr: false } })
try {
  const { temasDe, normalizar } = await vite.ssrLoadModule('/src/curriculo/buscar.ts')
  const { ubicarCita } = await vite.ssrLoadModule('/src/curriculo/citas.ts')
  const { cuantos, fichaDe } = await vite.ssrLoadModule('/src/banco/verificar.ts')
  const { habilidadesDelTema } = await vite.ssrLoadModule('/src/juegos/matematica/deducir.ts')
  const nivel = (await import(`../../../packages/curriculo/data/${gradoId.split('-')[0]}.json`, { with: { type: 'json' } })).default
  const grado = nivel.grados.find((g) => g.id === gradoId)
  const area = grado?.areas.find((a) => a.id === areaId)
  if (!area) throw new Error(`No hay ${areaId} en ${gradoId}.`)

  const delCurriculo = new Map(temasDe(area).map((t) => [t.tema, t.indiceCompetencia]))
  const lista = leer(ruta)
  const errores = []
  const avisos = []
  const vistos = new Set()
  const juegos = []

  const largo = (t) => [...(t ?? '')].length
  const texto = (v, min, max) => typeof v === 'string' && v === v.trim() && !/[\n\r\t]|\*\*/.test(v) && largo(v) >= min && largo(v) <= max
  const distintos = (xs) => new Set(xs.map(normalizar)).size === xs.length
  // Como en el verificador de exámenes: cuentan la tilde y el signo («¿Dónde…?» y «Dónde…?» son distintas), no la
  // mayúscula («lima» y «Lima» saldrían repetidas en la hoja).
  const opcionesDistintas = (xs) => new Set(xs.map((x) => x.trim().toLowerCase())).size === xs.length

  for (const [k, t] of lista.entries()) {
    const quien = `«${t?.tema ?? `n.º ${k + 1}`}»`
    const mal = (m) => errores.push(`${quien}: ${m}`)
    if (Object.keys(t ?? {}).sort().join(',') !== CLAVES.split(',').sort().join(',')) mal(`las claves deben ser exactamente ${CLAVES}.`)
    if (!delCurriculo.has(t.tema)) {
      mal('no es un tema del currículo tal cual (copia el nombre exacto de la lista).')
      continue
    }
    if (vistos.has(t.tema)) mal('está repetido.')
    vistos.add(t.tema)

    const esperada = delCurriculo.get(t.tema)
    if (!Number.isInteger(t.competencia) || t.competencia < 1 || t.competencia > area.competencias.length) mal(`competencia ${t.competencia} no existe.`)
    else if (esperada !== undefined && t.competencia !== esperada + 1) mal(`la competencia debe ser la ${esperada + 1}.`)
    if (!texto(t.cita, 25, 300)) mal('la cita debe tener entre 25 y 300 letras, sin espacios al borde.')
    else {
      const u = ubicarCita(area, t.cita, t.competencia)
      if (!u) mal(`la cita no aparece letra por letra en ningún desempeño: «${t.cita}»`)
      else if (u.numeroCompetencia !== t.competencia) mal(`la cita es de la competencia ${u.numeroCompetencia}, no de la ${t.competencia}.`)
    }

    const ps = Array.isArray(t.palabras) ? t.palabras : []
    if (ps.length < 7 || ps.length > 8) mal(`debe traer 7 u 8 palabras (trae ${ps.length}).`)
    for (const p of ps) {
      if (!LETRAS.test(p?.palabra ?? '') || normalizar(p.palabra).length < 3 || normalizar(p.palabra).length > 12)
        mal(`palabra «${p?.palabra}»: una sola palabra, solo letras, de 3 a 12.`)
      if (!texto(p?.pista, 10, 85)) mal(`la pista de «${p?.palabra}» debe tener entre 10 y 85 letras.`)
      else if (normalizar(p.pista).includes(normalizar(p.palabra))) mal(`la pista de «${p.palabra}» no puede decir la palabra.`)
    }
    if (!distintos(ps.map((p) => p?.palabra ?? ''))) mal('palabras repetidas.')

    const qs = Array.isArray(t.preguntas) ? t.preguntas : []
    if (qs.length !== 8) mal(`debe traer 8 preguntas (trae ${qs.length}).`)
    for (const q of qs) {
      const donde = `pregunta «${q?.pregunta}»`
      if (!texto(q?.pregunta, 10, 90)) mal(`${donde}: entre 10 y 90 letras.`)
      if (!texto(q?.respuesta, 1, 20)) mal(`${donde}: la respuesta debe tener de 1 a 20 letras.`)
      if (!Array.isArray(q?.distractores) || q.distractores.length !== 3) mal(`${donde}: 3 distractores.`)
      else {
        if (q.distractores.some((d) => !texto(d, 1, 20))) mal(`${donde}: cada distractor de 1 a 20 letras.`)
        if (!opcionesDistintas([q.respuesta ?? '', ...q.distractores])) mal(`${donde}: las 4 opciones deben ser distintas.`)
      }
    }
    if (!opcionesDistintas(qs.map((q) => `${q?.pregunta} → ${q?.respuesta}`))) mal('preguntas repetidas (misma pregunta y misma respuesta).')

    const pr = Array.isArray(t.pares) ? t.pares : []
    if (pr.length !== 6) mal(`debe traer 6 pares (trae ${pr.length}).`)
    for (const p of pr) if (!texto(p?.a, 1, 16) || !texto(p?.b, 1, 16)) mal(`par «${p?.a}» — «${p?.b}»: cada lado de 1 a 16 letras.`)
    if (!distintos(pr.map((p) => p?.a ?? '')) || !distintos(pr.map((p) => p?.b ?? ''))) mal('pares con lados repetidos.')

    // Juegos apenas se crea el tema, como en la app.
    try {
      const ficha = fichaDe(gradoId, grado.nombre, areaId, area.nombre, t.tema)
      const n = cuantos(ficha, t).juegos
      juegos.push(n)
      const calculo = habilidadesDelTema(ficha).length > 0
      if (n < 2) mal(`solo arma ${n} juegos (mínimo 2).`)
      else if (n < 10 && !calculo) avisos.push(`${quien}: arma ${n} juegos; en 4.º suelen ser 13 a 17 (respuestas, opciones y parejas más cortas suman juegos).`)
    } catch (e) {
      mal(`no se pudo contar sus juegos: ${e.message}`)
    }
  }

  const faltan = [...delCurriculo.keys()].filter((t) => !vistos.has(t))
  if (!parcial && faltan.length) errores.push(`Faltan ${faltan.length} temas: ${faltan.map((t) => `«${t}»`).join(', ')}`)

  const prom = juegos.length ? (juegos.reduce((a, b) => a + b, 0) / juegos.length).toFixed(1) : '0'
  console.log(`${gradoId} · ${areaId}: ${vistos.size} de ${delCurriculo.size} temas · juegos por tema: promedio ${prom}, mínimo ${juegos.length ? Math.min(...juegos) : 0}`)
  if (avisos.length) console.log(`Avisos (${avisos.length}):\n- ${avisos.slice(0, 30).join('\n- ')}`)
  if (errores.length) {
    console.error(`✗ ${errores.length} problemas:\n- ${errores.slice(0, 80).join('\n- ')}${errores.length > 80 ? '\n…' : ''}`)
    process.exitCode = 1
  } else console.log('✓ Todo cuadra.')
} finally {
  await vite.close()
}
