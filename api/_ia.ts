// Lo común de las funciones que llaman a Claude. El "_" hace que Vercel no lo publique como endpoint.
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import type { z } from 'zod'

// Con OPENROUTER_API_KEY va por OpenRouter (mismo formato de Anthropic); si no, directo con ANTHROPIC_API_KEY.
const openrouter = process.env.OPENROUTER_API_KEY
const cliente = openrouter
  ? new Anthropic({ baseURL: 'https://openrouter.ai/api', apiKey: null, authToken: openrouter })
  : new Anthropic()
const MODELO = openrouter ? 'anthropic/claude-opus-5.5' : 'claude-opus-5-5'

export const SISTEMA = `Eres Supermentes, un asistente que prepara material de clase para docentes del Perú (Inicial, Primaria y Secundaria).
- Escribe en español peruano neutro, claro y cálido, con palabras del aula (nada de jerga técnica ni pedagógica rebuscada).
- Todo lo que generes responde al Currículo Nacional de Educación Básica (CNEB) del MINEDU: la competencia, la capacidad y los desempeños que te indiquen.
- Usa ejemplos de la vida cotidiana peruana (comidas, lugares, costumbres, nombres comunes) apropiados para la edad del grado.
- Sé correcto: si es matemática, verifica cada cálculo; si es ciencia o historia, no inventes datos.`

/** Una llamada a Claude que devuelve JSON validado contra el esquema. */
export async function generar<T extends z.ZodType>(esquema: T, contenido: Anthropic.ContentBlockParam[]): Promise<z.infer<T>> {
  const res = await cliente.messages.parse({
    model: MODELO,
    max_tokens: 16000,
    // ponytail: effort bajo para que el docente no espere; subir a medium si la calidad no alcanza.
    output_config: { effort: 'low', format: zodOutputFormat(esquema) },
    system: SISTEMA,
    messages: [{ role: 'user', content: contenido }],
  })
  if (res.stop_reason === 'refusal') throw new ErrorIA('La IA no quiso generar este material. Prueba a describir el tema de otra forma.')
  if (!res.parsed_output) throw new ErrorIA('La IA devolvió una respuesta incompleta. Vuelve a intentarlo.')
  return res.parsed_output
}

export class ErrorIA extends Error {}

export function json(datos: unknown, estado = 200) {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

/** Respuesta de error para el docente: el mensaje se muestra tal cual, el detalle va al log. */
export function fallo(e: unknown) {
  console.error(e)
  if (e instanceof ErrorIA) return json({ error: e.message }, 502)
  if (e instanceof Anthropic.RateLimitError) return json({ error: 'Hay muchos docentes generando a la vez. Espera un momento y vuelve a intentarlo.' }, 429)
  return json({ error: 'No pudimos generar el material. Vuelve a intentarlo.' }, 500)
}

const TIPOS_IMAGEN = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
export const MAXIMO_ARCHIVO = 15_000_000

/** Convierte la foto o el PDF que sube el docente en un bloque que Claude puede leer. */
export async function bloqueArchivo(archivo: File): Promise<Anthropic.ContentBlockParam> {
  if (archivo.size > MAXIMO_ARCHIVO) throw new ErrorIA('El archivo pesa demasiado (máximo 15 MB).')
  const data = Buffer.from(await archivo.arrayBuffer()).toString('base64')
  if (archivo.type === 'application/pdf') return { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data } }
  if (TIPOS_IMAGEN.has(archivo.type))
    return { type: 'image', source: { type: 'base64', media_type: archivo.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif', data } }
  throw new ErrorIA('Sube una foto (JPG, PNG o WebP) o un PDF.')
}
