// Contenido del tema para los juegos: preguntas, parejas y palabras. Cada juego toma lo que le cabe
// (ver apps/web/src/juegos/README.md), así que todo va corto.
//
//   POST /api/juego  { ficha }  → Juego (apps/web/src/api/types.ts)
import { z } from 'zod'
import { fallo, generar, json } from './_ia.js'

const Esquema = z.object({
  preguntas: z
    .array(
      z.object({
        pregunta: z.string().describe('Máximo 90 caracteres'),
        opciones: z.array(z.string()).describe('Exactamente 4 opciones de 1 a 3 palabras; una sola correcta'),
        correcta: z.number().int().describe('Índice (0 a 3) de la opción correcta'),
      }),
    )
    .describe('8 a 10 preguntas del tema, de fácil a difícil'),
  pares: z
    .array(z.object({ a: z.string().describe('Máximo 16 caracteres'), b: z.string().describe('Máximo 16 caracteres') }))
    .describe('6 parejas de cosas que van juntas (término y su significado corto, ejemplo y categoría, 3/4 y "tres cuartos")'),
  palabras: z
    .array(z.object({ palabra: z.string().describe('Una palabra sin espacios, máximo 12 letras'), pista: z.string() }))
    .describe('6 a 8 palabras clave del tema con una pista corta'),
})

type Ficha = { titulo: string; grado: string; area: string; proposito: string; conceptos?: string[]; vocabulario?: { palabra: string }[] }

export async function POST(request: Request) {
  try {
    const { ficha } = (await request.json()) as { ficha: Ficha }
    if (!ficha?.titulo) return json({ error: 'Falta el tema.' }, 400)

    const j = await generar(Esquema, [
      {
        type: 'text',
        text: [
          `Crea el contenido de juegos de clase (proyectados o en el celular) para ${ficha.grado}, ${ficha.area}: ${ficha.titulo}.`,
          `Propósito de la clase: ${ficha.proposito}`,
          ficha.conceptos?.length && `Ideas clave:\n- ${ficha.conceptos.slice(0, 6).join('\n- ')}`,
          ficha.vocabulario?.length && `Vocabulario de la ficha: ${ficha.vocabulario.slice(0, 8).map((v) => v.palabra).join(', ')}`,
          'Los textos se leen rápido en una pantalla: cortos y sin ambigüedad. Las opciones incorrectas deben ser errores típicos de los estudiantes, nunca respuestas también válidas.',
        ]
          .filter(Boolean)
          .join('\n'),
      },
    ])
    return json({
      codigo: `${ficha.titulo.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, '').slice(0, 4).toUpperCase() || 'TEMA'}-${Math.floor(Math.random() * 90 + 10)}`,
      pares: j.pares.map((p) => ({ a: { texto: p.a }, b: { texto: p.b } })),
      preguntas: j.preguntas.filter((p) => p.opciones.length >= 2 && p.correcta >= 0 && p.correcta < p.opciones.length),
      palabras: j.palabras.map((p) => ({ palabra: p.palabra.replace(/\s+/g, ''), pista: p.pista })),
    })
  } catch (e) {
    return fallo(e)
  }
}
