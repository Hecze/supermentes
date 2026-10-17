// Letra de la canción del tema. El audio sale después, a pedido, de /api/audio.
//
//   POST /api/cancion  { ficha, opciones }  → Cancion (apps/web/src/api/types.ts)
import { z } from 'zod'
import { fallo, generar, json } from './_ia'

const Esquema = z.object({
  titulo: z.string().describe('Título corto y pegajoso'),
  partes: z
    .array(
      z.object({
        etiqueta: z.string().describe('"Verso 1", "Coro", "Verso 2"… o "Estrofa" si es con melodía'),
        lineas: z.array(z.string()).describe('4 a 6 líneas cortas, fáciles de cantar'),
      }),
    )
    .describe('Con ritmo: verso, coro, verso, coro. Con melodía: 2 o 3 estrofas con la métrica de esa melodía'),
})

type Ficha = { titulo: string; grado: string; area: string; proposito: string; conceptos?: string[]; vocabulario?: { palabra: string }[] }
type Opciones = { modo: 'ritmo' | 'melodia'; ritmo: string; melodia: string }

export async function POST(request: Request) {
  try {
    const { ficha, opciones } = (await request.json()) as { ficha: Ficha; opciones: Opciones }
    if (!ficha?.titulo || !opciones?.modo) return json({ error: 'Falta el tema o el ritmo.' }, 400)
    const melodia = opciones.modo === 'melodia'
    const estilo = String(melodia ? opciones.melodia : opciones.ritmo).slice(0, 60)

    const c = await generar(Esquema, [
      {
        type: 'text',
        text: [
          `Escribe una canción para que estudiantes de ${ficha.grado} memoricen el tema de ${ficha.area}: ${ficha.titulo}.`,
          `Propósito de la clase: ${ficha.proposito}`,
          ficha.conceptos?.length && `Ideas clave que la letra tiene que enseñar:\n- ${ficha.conceptos.slice(0, 6).join('\n- ')}`,
          ficha.vocabulario?.length && `Palabras del tema que conviene usar: ${ficha.vocabulario.slice(0, 8).map((v) => v.palabra).join(', ')}`,
          melodia
            ? `Se canta con la melodía de "${estilo}": respeta su métrica y número de sílabas para que calce al cantarla.`
            : `Ritmo: ${estilo}. Un coro que se repite y se pega; versos con rima y ejemplos de la vida diaria.`,
          'Lenguaje para la edad del grado, nada de palabras difíciles. Que cada idea clave quede dicha con exactitud.',
        ]
          .filter(Boolean)
          .join('\n'),
      },
    ])
    return json({ titulo: c.titulo, opciones, partes: c.partes })
  } catch (e) {
    return fallo(e)
  }
}
