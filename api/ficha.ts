// Ficha del tema: completa con IA las ideas clave, el vocabulario, el ejemplo y el error frecuente de un tema
// del Currículo Nacional. El tema, su competencia y sus desempeños ya vienen del currículo (no se suben fotos
// ni archivos): la app crea la ficha al instante y esto la completa en segundo plano.
//
//   POST /api/ficha  JSON: EntradaTema (texto, gradoId, areaId, grado, area, competencia, capacidad,
//                    desempenos, duracion)  → Ficha (apps/web/src/api/types.ts)
import { z } from 'zod'
import { fallo, generar, json } from './_ia.js'

const Esquema = z.object({
  titulo: z.string().describe('Nombre corto del tema, como lo diría el docente'),
  proposito: z.string().describe('Una oración: "Que los estudiantes…"'),
  competencia: z.string().describe('Competencia del CNEB tal como la nombra el MINEDU (p. ej. "Se comunica oralmente en su lengua materna"); usa la indicada'),
  capacidad: z.string().describe('Capacidad del CNEB que se trabaja; usa la indicada'),
  conceptos: z.array(z.string()).describe('3 a 5 ideas clave, una oración cada una'),
  vocabulario: z
    .array(z.object({ palabra: z.string().describe('Una sola palabra, sin espacios'), definicion: z.string() }))
    .describe('5 a 8 palabras del tema con definición para el grado (sirven para crucigrama y juegos)'),
  ejemplo: z.string().describe('Un ejemplo concreto y cotidiano para explicar en clase'),
  errorFrecuente: z.string().describe('El error más común de los estudiantes en este tema y cómo corregirlo'),
})

const texto = (v: unknown, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export async function POST(request: Request) {
  try {
    const datos = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>
    const grado = texto(datos.grado, 60)
    const area = texto(datos.area, 60)
    const tema = texto(datos.texto, 300)
    const competencia = texto(datos.competencia, 300)
    const capacidad = texto(datos.capacidad, 300)
    const duracion = texto(datos.duracion, 30) || '45 min'
    const desempenos = (Array.isArray(datos.desempenos) ? datos.desempenos : []).filter((d): d is string => typeof d === 'string').map((d) => d.slice(0, 2000)).slice(0, 12)
    if (!grado || !area || !tema) return json({ error: 'Falta el tema, el grado o el curso.' }, 400)

    const contenido = [
      {
        type: 'text' as const,
        text: [
          `Prepara la ficha del tema para una clase de ${duracion} de ${area}, ${grado}.`,
          `Tema del Currículo Nacional: ${tema}`,
          competencia && `Competencia del CNEB: ${competencia}`,
          capacidad && `Capacidad: ${capacidad}`,
          desempenos.length && `Desempeños del grado:\n- ${desempenos.join('\n- ')}`,
        ]
          .filter(Boolean)
          .join('\n'),
      },
    ]

    const f = await generar(Esquema, contenido)
    return json({
      id: `ficha-${Date.now()}`,
      fecha: new Date().toISOString(),
      titulo: tema || f.titulo,
      gradoId: texto(datos.gradoId, 60),
      areaId: texto(datos.areaId, 60),
      grado,
      area,
      duracion,
      fuente: `Currículo Nacional: ${area}, ${grado}`,
      proposito: f.proposito,
      curriculo: { competencia: competencia || f.competencia, capacidad: capacidad || f.capacidad, desempenos },
      conceptos: f.conceptos,
      vocabulario: f.vocabulario,
      ejemplo: f.ejemplo,
      errorFrecuente: f.errorFrecuente,
    })
  } catch (e) {
    return fallo(e)
  }
}
