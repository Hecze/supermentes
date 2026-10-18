// Audio de la canción con Lyria 3 (Google) vía OpenRouter: canta la letra con el ritmo elegido.
// Clip de 30 s (US$0.04): coro y primer verso, lo que se usa en el aula. Probado el 17-oct.
// Cada audio se guarda en Blob la primera vez: la misma canción (las del banco de cada tema) vuelve a sonar al
// instante y sin pagar de nuevo.
//
//   POST /api/audio  { cancion }  → AudioCancion (apps/web/src/api/types.ts), con el mp3 como data: URL
import { createHash } from 'node:crypto'
import { get, put } from '@vercel/blob'
import { ErrorIA, fallo, json } from './_ia.js'
import { demasiadas } from './_juegos.js'

const MODELO_MUSICA = process.env.MUSIC_MODEL || 'google/lyria-3-clip-preview'

// Cómo describirle cada ritmo al modelo.
const ESTILOS: Record<string, string> = {
  Cumbia: 'cumbia peruana alegre, con guitarra y timbales',
  Huayno: 'huayno andino peruano, con charango y quena',
  Festejo: 'festejo afroperuano, con cajón y palmas',
  Rap: 'rap infantil con ritmo pegajoso, base de hip hop suave',
  Balada: 'balada pop suave y emotiva, con piano',
  Marinera: 'marinera norteña alegre, con guitarra, cajón y palmas',
  Saya: 'saya afroandina alegre, con bombos, matracas y coro',
  Valicha: 'huayno cusqueño al estilo de Valicha, con charango y quena',
  Tondero: 'tondero piurano alegre, con guitarra y cajón',
  Landó: 'landó afroperuano suave, con cajón y guitarra',
}

type Cancion = { titulo: string; opciones: { modo: string; ritmo: string; estilo?: string }; partes: { etiqueta: string; lineas: string[] }[] }

const ruta = (clave: string) => `audio/${createHash('sha256').update(clave).digest('hex').slice(0, 40)}.mp3`
const duracionDe = (bytes: number) => Math.round(bytes / 24_000) // mp3 a ~192 kbps

/** El audio guardado de esa misma canción, o null. Sin Blob (local) o si falla, se genera de nuevo. */
async function guardado(r: string) {
  try {
    const b = await get(r, { access: 'private' })
    if (!b || b.statusCode !== 200 || !b.stream) return null
    return Buffer.from(await new Response(b.stream).arrayBuffer())
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const { cancion } = (await request.json()) as { cancion: Cancion }
    if (!cancion?.partes?.length) return json({ error: 'Falta la letra de la canción.' }, 400)
    const pedido = typeof cancion.opciones?.estilo === 'string' ? cancion.opciones.estilo.trim().slice(0, 160) : ''
    const estilo = pedido || (ESTILOS[cancion.opciones?.ritmo] ?? `${String(cancion.opciones?.ritmo ?? 'cumbia').slice(0, 40)} alegre`)

    // En 30 s entran el coro y un verso: primero el coro, que es lo que se aprenden.
    const coro = cancion.partes.find((p) => /coro/i.test(p.etiqueta)) ?? cancion.partes[0]
    const verso = cancion.partes.find((p) => p !== coro)
    const letra = [coro, verso].filter(Boolean).map((p) => `[${p!.etiqueta}]\n${p!.lineas.slice(0, 6).join('\n')}`).join('\n\n')

    const r = ruta(`${MODELO_MUSICA}\n${estilo}\n${letra}`)
    const antes = await guardado(r)
    if (antes) return json({ url: `data:audio/mpeg;base64,${antes.toString('base64')}`, duracionSeg: duracionDe(antes.length) })
    // Cada audio nuevo cuesta: tope por conexión, holgado para un colegio que comparte la red.
    if (demasiadas(request, 'audio', 30)) return json({ error: 'Se pidieron muchas canciones seguidas. Espera unos minutos.' }, 429)

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(60_000), // nada de esperas infinitas: a los 60 s se corta y la app ofrece reintentar
      body: JSON.stringify({
        model: MODELO_MUSICA,
        stream: true, // el audio solo sale en streaming
        modalities: ['audio', 'text'],
        audio: { format: 'mp3' },
        messages: [
          {
            role: 'user',
            content: `Canción educativa para niños de primaria del Perú, estilo ${estilo}. Voz clara en español, que se entienda cada palabra, alegre y fácil de cantar en el aula. Letra:\n\n${letra}`,
          },
        ],
      }),
    })
    if (!res.ok || !res.body) throw new ErrorIA('No pudimos crear el audio. Vuelve a intentarlo.')

    // Junta los trozos de audio del stream (SSE).
    const trozos: string[] = []
    let resto = ''
    const lector = res.body.getReader()
    const texto = new TextDecoder()
    for (;;) {
      const { done, value } = await lector.read()
      if (done) break
      resto += texto.decode(value, { stream: true })
      const lineas = resto.split('\n')
      resto = lineas.pop() ?? ''
      for (const l of lineas) {
        if (!l.startsWith('data:') || l.includes('[DONE]')) continue
        const dato = JSON.parse(l.slice(5)) as { error?: unknown; choices?: { delta?: { audio?: { data?: string } } }[] }
        if (dato.error) throw new ErrorIA('El generador de música no respondió. Vuelve a intentarlo.')
        const audio = dato.choices?.[0]?.delta?.audio?.data
        if (audio) trozos.push(audio)
      }
    }
    if (!trozos.length) throw new ErrorIA('La canción salió sin audio. Vuelve a intentarlo.')
    const mp3 = Buffer.from(trozos.join(''), 'base64')
    try {
      await put(r, mp3, { access: 'private', contentType: 'audio/mpeg', addRandomSuffix: false, allowOverwrite: true })
    } catch {
      // Sin guardar igual suena; la próxima vez se vuelve a generar.
    }
    // ponytail: duración por tamaño; leerla del archivo si hace falta exacta.
    return json({ url: `data:audio/mpeg;base64,${mp3.toString('base64')}`, duracionSeg: duracionDe(mp3.length) })
  } catch (e) {
    return fallo(e)
  }
}
