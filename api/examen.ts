// Examen gamificado: preguntas del tema ambientadas en lo que le gusta a la clase.
//
//   POST /api/examen  { ficha, opciones }                                  → Examen (apps/web/src/api/types.ts)
//   POST /api/examen  multipart: ficha (JSON), opciones (JSON), examen (archivo propio del docente)
import type Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { bloqueArchivo, fallo, generar, json } from './_ia'

const Esquema = z.object({
  titulo: z.string().describe('Título del examen; si es misión, que empiece con "Misión:"'),
  intro: z.string().describe('Una o dos oraciones que presentan la historia o el contexto'),
  etiquetaPaso: z.string().describe('Cómo se llama cada pregunta dentro de la historia: "Jugada", "Rescate", "Receta"… o "Pregunta"'),
  preguntas: z
    .array(
      z.object({
        original: z.string().describe('La pregunta tal cual, sin ambientar'),
        texto: z.string().describe('La misma pregunta ambientada en el interés de la clase'),
        respuesta: z.string().describe('Respuesta correcta, corta'),
        fraccion: z
          .array(z.number().int())
          .optional()
          .describe('Solo si la pregunta trata de una fracción que conviene dibujar: [partes pintadas, partes totales]'),
      }),
    )
    .describe('4 a 6 preguntas, de la más fácil a la más difícil'),
})

type Ficha = { titulo: string; grado: string; area: string; proposito: string; curriculo?: { competencia?: string; capacidad?: string }; conceptos?: string[] }
type Opciones = { interes: string; formato: 'mision' | 'contextualizado' }

export async function POST(request: Request) {
  try {
    let ficha: Ficha
    let opciones: Opciones
    let archivo: File | null = null
    if ((request.headers.get('content-type') ?? '').includes('multipart/form-data')) {
      const datos = await request.formData()
      ficha = JSON.parse(String(datos.get('ficha') ?? '{}'))
      opciones = JSON.parse(String(datos.get('opciones') ?? '{}'))
      const a = datos.get('examen')
      if (a instanceof File) archivo = a
    } else {
      ;({ ficha, opciones } = (await request.json()) as { ficha: Ficha; opciones: Opciones })
    }
    if (!ficha?.titulo || !opciones?.interes) return json({ error: 'Falta el tema o lo que le gusta a la clase.' }, 400)
    const interes = String(opciones.interes).slice(0, 80)
    const mision = opciones.formato !== 'contextualizado'

    const contenido: Anthropic.ContentBlockParam[] = []
    if (archivo) contenido.push(await bloqueArchivo(archivo))
    contenido.push({
      type: 'text',
      text: [
        `Crea un examen de ${ficha.area}, ${ficha.grado}, sobre: ${ficha.titulo}.`,
        `Propósito de la clase: ${ficha.proposito}`,
        ficha.curriculo?.competencia && `Competencia del CNEB: ${ficha.curriculo.competencia}`,
        ficha.curriculo?.capacidad && `Capacidad: ${ficha.curriculo.capacidad}`,
        ficha.conceptos?.length && `Ideas clave:\n- ${ficha.conceptos.slice(0, 8).join('\n- ')}`,
        archivo
          ? 'Arriba está el examen del docente: conserva sus preguntas (en "original") y transfórmalas.'
          : 'Crea las preguntas desde las ideas clave.',
        mision
          ? `Formato misión: una historia ambientada en "${interes}" donde cada pregunta es un paso para lograr el objetivo.`
          : `Formato contextualizado: problemas sueltos ambientados en "${interes}", sin historia.`,
      ]
        .filter(Boolean)
        .join('\n'),
    })

    const e = await generar(Esquema, contenido)
    return json({
      opciones: { interes, formato: mision ? 'mision' : 'contextualizado' },
      titulo: e.titulo,
      intro: e.intro,
      etiquetaPaso: e.etiquetaPaso,
      preguntas: e.preguntas.map(({ fraccion, ...p }) => ({
        ...p,
        ...(fraccion?.length === 2 && fraccion[1] > 0 ? { fraccion: [fraccion[0], fraccion[1]] } : {}),
        ilustracion: null,
      })),
    })
  } catch (e) {
    return fallo(e)
  }
}
