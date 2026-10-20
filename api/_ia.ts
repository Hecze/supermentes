// Lo común de las funciones que llaman a Claude. El "_" hace que Vercel no lo publique como endpoint.
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import type { z } from 'zod'

// Todo va por OpenRouter con el formato de Anthropic. El modelo se cambia con AI_MODEL (cualquier id de
// openrouter.ai/models que soporte structured outputs); por defecto, Claude Opus 5.5. Probados el 17-oct:
// google/gemini-3.8-flash (10 s, bien), x-ai/grok-4.7 (42 s, bien); deepseek/deepseek-v4.1-flash devuelve basura.
const cliente = new Anthropic({ baseURL: 'https://openrouter.ai/api', apiKey: null, authToken: process.env.OPENROUTER_API_KEY })
const MODELO = process.env.AI_MODEL || 'anthropic/claude-opus-5.5'

export const SISTEMA = `Eres Supermentes, un asistente que prepara material de clase para docentes del Perú (Primaria y Secundaria).
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
/** Sin la clave, cada función lo dice claro (al docente y en los logs de Vercel) en vez de fallar callada. */
export const SIN_CLAVE = 'La IA no está configurada en el servidor: falta OPENROUTER_API_KEY en el servidor. Avísale al equipo de Supermentes.'

export function fallo(e: unknown) {
  console.error(e)
  if (!process.env.OPENROUTER_API_KEY) return json({ error: SIN_CLAVE }, 503)
  if (e instanceof ErrorIA) return json({ error: e.message }, 502)
  if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) {
    return json({ error: 'La clave de la IA (OPENROUTER_API_KEY) no es válida. Avísale al equipo de Supermentes.' }, 503)
  }
  if (e instanceof Anthropic.APIError && e.status === 402) return json({ error: 'Se acabó el saldo de la IA en OpenRouter. Avísale al equipo de Supermentes.' }, 503)
  if (e instanceof Anthropic.RateLimitError) return json({ error: 'Hay muchos docentes generando a la vez. Espera un momento y vuelve a intentarlo.' }, 429)
  return json({ error: 'No pudimos generar el material. Vuelve a intentarlo.' }, 500)
}
