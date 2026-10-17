// Audio de la canción con Lyria 3 (Google) vía OpenRouter: canta la letra con el ritmo elegido.
// Clip de 30 s (US$0.04): coro y primer verso, lo que se usa en el aula. Probado el 17-oct.
//
//   POST /api/audio  { cancion }  → AudioCancion (apps/web/src/api/types.ts), con el mp3 como data: URL
import { ErrorIA, fallo, json } from './_ia.js'

const MODELO_MUSICA = process.env.MUSIC_MODEL || 'google/lyria-3-clip-preview'

// Cómo describirle cada ritmo al modelo.
const ESTILOS: Record<string, string> = {
  Cumbia: 'cumbia peruana alegre, con guitarra y timbales',
  Huayno: 'huayno andino peruano, con charango y quena',
  Festejo: 'festejo afroperuano, con cajón y palmas',
  Rap: 'rap infantil con ritmo pegajoso, base de hip hop suave',
  Balada: 'balada pop suave y emotiva, con piano',
}

type Cancion = { titulo: string; opciones: { modo: string; ritmo: string }; partes: { etiqueta: string; lineas: string[] }[] }

export async function POST(request: Request) {
  try {
    const { cancion } = (await request.json()) as { cancion: Cancion }
    if (!cancion?.partes?.length) return json({ error: 'Falta la letra de la canción.' }, 400)
    const estilo = ESTILOS[cancion.opciones?.ritmo] ?? `${String(cancion.opciones?.ritmo ?? 'cumbia').slice(0, 40)} alegre`

    // En 30 s entran el coro y un verso: primero el coro, que es lo que se aprenden.
    const coro = cancion.partes.find((p) => /coro/i.test(p.etiqueta)) ?? cancion.partes[0]
    const verso = cancion.partes.find((p) => p !== coro)
    const letra = [coro, verso].filter(Boolean).map((p) => `[${p!.etiqueta}]\n${p!.lineas.slice(0, 6).join('\n')}`).join('\n\n')

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
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
    const mp3 = trozos.join('')
    // ponytail: duración por tamaño (mp3 a ~192 kbps); leerla del archivo si hace falta exacta.
    const duracionSeg = Math.round((mp3.length * 3) / 4 / 24_000)
    return json({ url: `data:audio/mpeg;base64,${mp3}`, duracionSeg })
  } catch (e) {
    return fallo(e)
  }
}
