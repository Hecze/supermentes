// Adaptar examen: el docente sube su examen de siempre (PDF o foto) y recibe el mismo examen adaptado,
// ambientado en lo que le gusta a la clase y/o para quien aprende distinto. El PDF se arma en el navegador.
//
//   POST /api/examen  multipart: ficha (JSON), opciones (JSON { interes, necesidades }), examen (archivo)  → Examen
import type Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { bloqueArchivo, fallo, generar, json } from './_ia'

const Esquema = z.object({
  titulo: z.string().describe('Título corto del examen. Si se ambienta, que suene a la historia; si no, "Evaluación de <tema>"'),
  instrucciones: z.string().describe('Instrucciones generales para el estudiante, en una a tres oraciones'),
  etiquetaPaso: z.string().describe('Cómo se llama cada pregunta: "Pregunta", o "Jugada", "Rescate", "Receta"… si se ambienta'),
  preguntas: z
    .array(
      z.object({
        original: z.string().describe('La pregunta tal cual está en el examen del docente'),
        texto: z.string().describe('La misma pregunta adaptada; evalúa exactamente lo mismo'),
        alternativas: z.array(z.string()).optional().describe('Solo si la pregunta original es de opción múltiple: sus alternativas, adaptadas, sin la letra'),
        apoyo: z.string().optional().describe('Solo si se pidió apoyo: una ayuda corta (los pasos, una pista o un ejemplo) que no regala la respuesta'),
        respuesta: z.string().describe('Respuesta correcta, corta, para el docente'),
      }),
    )
    .describe('Todas las preguntas del examen original, en el mismo orden. No agregues ni quites preguntas.'),
})

type Ficha = { titulo: string; grado: string; area: string; curriculo?: { competencia?: string; capacidad?: string } }
type Necesidad = 'tdah' | 'dislexia' | 'tea' | 'facil'

const REGLAS: Record<Necesidad, string> = {
  tdah: 'Le cuesta concentrarse (TDAH): consignas cortas, una acción por oración, y si una pregunta pide varias cosas, sepárala en partes dentro del mismo texto. Da un apoyo con los pasos.',
  dislexia: 'Le cuesta leer (dislexia): oraciones cortas y directas, palabras conocidas, sin dobles negaciones ni frases subordinadas largas.',
  tea: 'Necesita instrucciones claras y literales (TEA): lenguaje literal, sin metáforas, ironías ni preguntas ambiguas; di exactamente qué y cómo responder. Da un apoyo que diga "Primero…, después…".',
  facil: 'Lectura fácil: palabras frecuentes, oraciones de máximo 15 palabras, una idea por oración.',
}

export async function POST(request: Request) {
  try {
    if (!(request.headers.get('content-type') ?? '').includes('multipart/form-data')) return json({ error: 'Sube tu examen (PDF o foto).' }, 400)
    const datos = await request.formData()
    const ficha = JSON.parse(String(datos.get('ficha') ?? '{}')) as Ficha
    const opciones = JSON.parse(String(datos.get('opciones') ?? '{}')) as { interes?: string | null; necesidades?: string[] }
    const archivo = datos.get('examen')
    if (!(archivo instanceof File)) return json({ error: 'Sube tu examen (PDF o foto).' }, 400)

    const interes = typeof opciones.interes === 'string' && opciones.interes.trim() ? opciones.interes.trim().slice(0, 80) : null
    const necesidades = (opciones.necesidades ?? []).filter((n): n is Necesidad => n in REGLAS)
    if (!interes && !necesidades.length) return json({ error: 'Elige cómo adaptar el examen.' }, 400)

    const contenido: Anthropic.ContentBlockParam[] = [
      await bloqueArchivo(archivo),
      {
        type: 'text',
        text: [
          `Arriba está el examen de un docente de ${ficha.area ?? 'su curso'}, ${ficha.grado ?? ''}${ficha.titulo ? `, sobre: ${ficha.titulo}` : ''}.`,
          ficha.curriculo?.competencia && `Competencia del CNEB: ${ficha.curriculo.competencia}`,
          'Adáptalo. Conserva TODAS sus preguntas, en el mismo orden, con los mismos datos y evaluando exactamente lo mismo. Pon cada pregunta tal cual en "original".',
          'Si una pregunta es de opción múltiple, conserva sus alternativas (adaptadas) en "alternativas". Si una pregunta depende de un dibujo que no puedes reproducir, descríbelo en el texto.',
          interes && `Ambienta cada pregunta en "${interes}" sin cambiar lo que evalúa.`,
          necesidades.length > 0 && `Adáptalo para un estudiante que:\n- ${necesidades.map((n) => REGLAS[n]).join('\n- ')}`,
          !necesidades.some((n) => n === 'tdah' || n === 'tea') && 'No agregues "apoyo".',
        ]
          .filter(Boolean)
          .join('\n'),
      },
    ]

    const e = await generar(Esquema, contenido)
    return json({
      opciones: { interes, necesidades },
      archivo: archivo.name,
      titulo: e.titulo,
      instrucciones: e.instrucciones,
      etiquetaPaso: e.etiquetaPaso,
      preguntas: e.preguntas.map((p) => ({
        original: p.original,
        texto: p.texto,
        respuesta: p.respuesta,
        ...(p.alternativas?.length ? { alternativas: p.alternativas } : {}),
        ...(p.apoyo ? { apoyo: p.apoyo } : {}),
      })),
    })
  } catch (e) {
    return fallo(e)
  }
}
