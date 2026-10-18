// Videos y fichas que ya existen en internet para el tema, buscados con Exa (exa.ai).
//
//   GET /api/recursos?tema=…&grado=…&area=…  → Recurso[] (apps/web/src/api/types.ts)
//
// Sin base de datos: la respuesta se guarda una semana en el CDN de Vercel, así que el mismo tema no vuelve a
// gastar créditos de Exa. Necesita EXA_API_KEY.

type Recurso = { tipo: 'video' | 'ficha'; titulo: string; url: string; fuente: string; imagen?: string }
type ResultadoExa = { title?: string | null; url: string; image?: string }

const texto = (v: string | null, max: number) => (v ?? '').trim().replace(/\s+/g, ' ').slice(0, max)

function json(datos: unknown, estado = 200, cache = 'no-store') {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache },
  })
}

async function buscar(query: string, filtros: Record<string, unknown>): Promise<ResultadoExa[]> {
  const res = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXA_API_KEY ?? '' },
    body: JSON.stringify({ query, type: 'auto', numResults: 8, ...filtros }),
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) throw new Error(`Exa ${res.status}: ${await res.text()}`)
  return ((await res.json()) as { results: ResultadoExa[] }).results
}

// Solo videos sueltos (no canales ni listas): con el id se arma la miniatura.
const idYoutube = (url: string) => url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{11})/)?.[1]

export async function GET(request: Request) {
  const p = new URL(request.url).searchParams
  const tema = texto(p.get('tema'), 120)
  const grado = texto(p.get('grado'), 40)
  const area = texto(p.get('area'), 60)
  if (!tema || !grado) return json({ error: 'Falta el tema o el grado.' }, 400)
  // Sin clave la sección no aparece (la app la oculta si no hay recursos) en vez de mostrar un error.
  if (!process.env.EXA_API_KEY) {
    console.warn('api/recursos: falta EXA_API_KEY; la sección de videos y fichas no aparece')
    return json([])
  }

  try {
    const [videos, fichas] = await Promise.all([
      buscar(`Video educativo en español para niños de ${grado} de primaria que explica: ${tema} (${area})`, {
        includeDomains: ['youtube.com'],
      }),
      buscar(`Ficha de trabajo para imprimir en español, ${grado} de primaria, ${area}: ${tema}`, {
        excludeDomains: ['youtube.com', 'youtu.be', 'tiktok.com', 'facebook.com', 'instagram.com', 'pinterest.com'],
      }),
    ])
    const vistos = new Set<string>()
    const recursos: Recurso[] = [
      ...videos.flatMap((r): Recurso[] => {
        const id = idYoutube(r.url)
        if (!id || vistos.has(id)) return []
        vistos.add(id)
        return [{ tipo: 'video', titulo: texto(r.title ?? '', 140), url: `https://www.youtube.com/watch?v=${id}`, fuente: 'YouTube', imagen: `https://i.ytimg.com/vi/${id}/mqdefault.jpg` }]
      }).slice(0, 4),
      ...fichas.map((r): Recurso => ({ tipo: 'ficha', titulo: texto(r.title ?? '', 140) || r.url, url: r.url, fuente: new URL(r.url).hostname.replace(/^www\./, ''), imagen: r.image })).slice(0, 4),
    ]
    return json(recursos, 200, 'public, max-age=3600, s-maxage=604800, stale-while-revalidate=604800')
  } catch (e) {
    console.error(e)
    return json({ error: 'No pudimos buscar videos y fichas. Vuelve a intentarlo.' }, 502)
  }
}
