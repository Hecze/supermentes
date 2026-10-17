// Ficha del tema: resume lo que se va a enseñar, alineado al Currículo Nacional. Todo lo demás parte de aquí.
//
//   POST /api/ficha  multipart/form-data: tipo, texto, archivo, gradoId, areaId, grado, area,
//                    competencia, capacidad, desempenos (JSON), duracion  → Ficha (apps/web/src/api/types.ts)
import type Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { bloqueArchivo, fallo, generar, json } from './_ia'

const Esquema = z.object({
  titulo: z.string().describe('Nombre corto del tema, como lo diría el docente'),
  proposito: z.string().describe('Una oración: "Que los estudiantes…"'),
  capacidad: z.string().describe('Capacidad del CNEB que se trabaja; usa la indicada si te la dan'),
  conceptos: z.array(z.string()).describe('3 a 5 ideas clave, una oración cada una'),
  vocabulario: z
    .array(z.object({ palabra: z.string().describe('Una sola palabra, sin espacios'), definicion: z.string() }))
    .describe('5 a 8 palabras del tema con definición para el grado (sirven para crucigrama y juegos)'),
  ejemplo: z.string().describe('Un ejemplo concreto y cotidiano para explicar en clase'),
  errorFrecuente: z.string().describe('El error más común de los estudiantes en este tema y cómo corregirlo'),
})

const texto = (v: FormDataEntryValue | null, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export async function POST(request: Request) {
  try {
    const datos = await request.formData()
    const tipo = texto(datos.get('tipo'), 10)
    const grado = texto(datos.get('grado'), 60)
    const area = texto(datos.get('area'), 60)
    const tema = texto(datos.get('texto'))
    const competencia = texto(datos.get('competencia'), 300)
    const capacidad = texto(datos.get('capacidad'), 300)
    const duracion = texto(datos.get('duracion'), 30) || '45 min'
    const archivo = datos.get('archivo')
    let desempenos: string[] = []
    try {
      desempenos = (JSON.parse(texto(datos.get('desempenos'), 8000) || '[]') as unknown[]).filter((d): d is string => typeof d === 'string').slice(0, 12)
    } catch {}
    if (!grado || !area) return json({ error: 'Falta el grado o el curso.' }, 400)
    if (!tema && !(archivo instanceof File)) return json({ error: 'Escribe el tema o sube una foto del libro.' }, 400)

    const contenido: Anthropic.ContentBlockParam[] = []
    if (archivo instanceof File) contenido.push(await bloqueArchivo(archivo))
    contenido.push({
      type: 'text',
      text: [
        `Prepara la ficha del tema para una clase de ${duracion} de ${area}, ${grado}.`,
        tema && `Tema que escribió el docente: ${tema}`,
        archivo instanceof File && 'Arriba está la página del libro o la sesión que subió el docente: el tema sale de ahí.',
        competencia && `Competencia del CNEB: ${competencia}`,
        capacidad && `Capacidad: ${capacidad}`,
        desempenos.length && `Desempeños del grado:\n- ${desempenos.join('\n- ')}`,
      ]
        .filter(Boolean)
        .join('\n'),
    })

    const f = await generar(Esquema, contenido)
    return json({
      id: `ficha-${Date.now()}`,
      fecha: new Date().toISOString(),
      titulo: f.titulo,
      gradoId: texto(datos.get('gradoId'), 60),
      areaId: texto(datos.get('areaId'), 60),
      grado,
      area,
      duracion,
      fuente:
        tipo === 'foto' ? 'Foto del libro' : archivo instanceof File ? `Archivo: ${archivo.name}` : `Currículo Nacional: ${area}, ${grado}`,
      proposito: f.proposito,
      curriculo: { competencia: competencia || area, capacidad: capacidad || f.capacidad },
      conceptos: f.conceptos,
      vocabulario: f.vocabulario,
      ejemplo: f.ejemplo,
      errorFrecuente: f.errorFrecuente,
      coincidenciasBiblioteca: 0,
    })
  } catch (e) {
    return fallo(e)
  }
}
