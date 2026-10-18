// Juegos compartidos con los alumnos: cada uno es un archivo privado en Vercel Blob con un código corto.
//
//   POST /api/juegos-compartidos  { v, juego, ritmo, tema, grado, fuente }  → { codigo, clave }
//   GET  /api/juegos-compartidos?codigo=ABC234                                 → el juego, sin la clave (se cachea en la CDN)
//
// La clave queda en la laptop del docente: con ella ve los resultados de sus alumnos (api/resultados.ts).
//
// La forma de los datos está en apps/web/src/juegos/compartir/publicado.ts. Aquí se valida y se recorta todo
// lo que llega, porque cualquiera puede llamar a este endpoint.
import { randomBytes, randomInt } from 'node:crypto'
import { get, put } from '@vercel/blob'
import { CODIGO, JUEGOS, demasiadas, entero, json, leerJuego, objeto, rutaJuego, texto } from './_juegos.js'

const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const MAXIMO_BYTES = 200_000

type Visual = { tipo: 'fraccion'; partes: [number, number] } | { tipo: 'contar'; figura: string; cantidad: number }
type Reto = { consigna?: string; pregunta: string; visual?: Visual; respuesta: string; distractores: string[] }
type Lado = { texto: string; visual?: Visual }

const lista = (v: unknown, max: number): unknown[] => (Array.isArray(v) ? v.slice(0, max) : [])

function visual(v: unknown): Visual | undefined {
  const o = objeto(v)
  if (o.tipo === 'fraccion' && Array.isArray(o.partes)) {
    const k = entero(o.partes[0], 0, 24)
    const n = entero(o.partes[1], 1, 24)
    return k !== null && n !== null ? { tipo: 'fraccion', partes: [k, n] } : undefined
  }
  if (o.tipo === 'contar') {
    const figura = texto(o.figura, 8)
    const cantidad = entero(o.cantidad, 1, 30)
    return figura && cantidad !== null ? { tipo: 'contar', figura, cantidad } : undefined
  }
  return undefined
}

function reto(v: unknown): Reto | null {
  const o = objeto(v)
  const respuesta = texto(o.respuesta, 120)
  const distractores = lista(o.distractores, 12)
    .map((d) => texto(d, 120))
    .filter((d) => d && d !== respuesta)
  const r: Reto = { pregunta: texto(o.pregunta, 300), respuesta, distractores }
  const consigna = texto(o.consigna, 120)
  if (consigna) r.consigna = consigna
  const vis = visual(o.visual)
  if (vis) r.visual = vis
  return respuesta && distractores.length && (r.pregunta || r.visual) ? r : null
}

function lado(v: unknown): Lado | null {
  const o = objeto(v)
  const l: Lado = { texto: texto(o.texto, 80) }
  const vis = visual(o.visual)
  if (vis) l.visual = vis
  return l.texto || l.visual ? l : null
}

/** Devuelve el juego limpio, o un texto con lo que falta. */
function validar(datos: unknown) {
  const o = objeto(datos)
  const juego = texto(o.juego, 20)
  if (!JUEGOS.has(juego)) return 'Juego desconocido.'
  const ritmo = entero(o.ritmo, 1, 3)
  if (ritmo === null) return 'Falta el ritmo.'
  const tema = texto(o.tema, 120)
  const grado = /^(inicial|primaria|secundaria)-\d$/.test(texto(o.grado, 20)) ? texto(o.grado, 20) : undefined
  const f = objeto(o.fuente)

  if (f.tipo === 'calculo') {
    const habilidad = texto(f.habilidad, 40)
    const nivel = entero(f.nivel, 0, 20)
    if (!/^[a-z-]{2,40}$/.test(habilidad) || nivel === null) return 'Habilidad inválida.'
    return { v: 1, juego, ritmo, tema, grado, fuente: { tipo: 'calculo', habilidad, nivel } }
  }

  if (f.tipo === 'tema') {
    const c = objeto(f.contenido)
    const retos = lista(c.retos, 80).map(reto).filter((r): r is Reto => r !== null)
    const pares = lista(c.pares, 40)
      .map((p) => {
        const a = lado(objeto(p).a)
        const b = lado(objeto(p).b)
        return a && b ? { a, b } : null
      })
      .filter((p) => p !== null)
    const palabras = lista(c.palabras, 60)
      .map((p) => ({ palabra: texto(objeto(p).palabra, 40), pista: texto(objeto(p).pista, 200) }))
      .filter((p) => p.palabra && p.pista)
    if (!retos.length && !pares.length && !palabras.length) return 'El juego no tiene contenido.'
    return { v: 1, juego, ritmo, tema, grado, fuente: { tipo: 'tema', contenido: { titulo: texto(c.titulo, 120) || tema, retos, pares, palabras } } }
  }

  return 'Falta de dónde sale el contenido.'
}

const nuevoCodigo = () => Array.from({ length: 6 }, () => ALFABETO[randomInt(ALFABETO.length)]).join('')
const rutaDe = rutaJuego

async function existe(ruta: string) {
  const r = await get(ruta, { access: 'private', useCache: false })
  return !!r && r.statusCode === 200
}

export async function POST(request: Request) {
  if (demasiadas(request, 'juego', 30)) return json({ error: 'Compartiste muchos juegos seguidos. Espera unos minutos.' }, 429)
  const cuerpo = await request.text()
  if (cuerpo.length > MAXIMO_BYTES) return json({ error: 'El juego es demasiado grande.' }, 413)
  let datos: unknown
  try {
    datos = JSON.parse(cuerpo)
  } catch {
    return json({ error: 'No pudimos leer el juego.' }, 400)
  }
  const limpio = validar(datos)
  if (typeof limpio === 'string') return json({ error: limpio }, 400)

  try {
    let codigo = nuevoCodigo()
    for (let i = 0; i < 4 && (await existe(rutaDe(codigo))); i++) codigo = nuevoCodigo()
    const clave = randomBytes(15).toString('base64url')
    await put(rutaDe(codigo), JSON.stringify({ ...limpio, clave, creado: new Date().toISOString() }), {
      access: 'private',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: false,
    })
    return json({ codigo, clave })
  } catch (e) {
    console.error('No se pudo guardar el juego compartido', e)
    return json({ error: 'No pudimos guardar el juego. Intenta de nuevo.' }, 500)
  }
}

export async function GET(request: Request) {
  const codigo = (new URL(request.url).searchParams.get('codigo') ?? '').trim().toUpperCase()
  if (!CODIGO.test(codigo)) return json({ error: 'Ese código no es válido.' }, 400)
  try {
    const guardado = await leerJuego(codigo)
    if (!guardado) return json({ error: 'No encontramos ese juego.' }, 404)
    // La clave es solo del docente. Sin ella, un juego compartido no cambia: la CDN lo guarda.
    const { clave: _clave, ...publico } = guardado
    return json(publico, 200, { 'Cache-Control': 'public, max-age=300, s-maxage=31536000, immutable' })
  } catch (e) {
    console.error('No se pudo leer el juego compartido', e)
    return json({ error: 'No pudimos abrir el juego. Intenta de nuevo.' }, 500)
  }
}
