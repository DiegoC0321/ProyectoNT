/**
 * Cliente mínimo OpenAI-compatible para el motor de recomendaciones.
 * Lee la configuración desde variables de entorno y no agrega dependencias:
 *   AI_API_KEY    — clave de API del proveedor (obligatoria para activar la IA)
 *   AI_BASE_URL   — base del API, por defecto https://api.openai.com/v1
 *   AI_MODEL      — modelo a usar, por defecto gpt-4o-mini
 *
 * Funciona igual con OpenAI, DeepSeek, Groq, Mistral, Ollama (`AI_BASE_URL`
 * apuntando a http://localhost:11434/v1), etc., siempre que hablen el
 * protocolo de chat completions.
 */

export interface ConfigAI {
  apiKey?: string;
  baseUrl: string;
  model: string;
}

export function configAI(): ConfigAI {
  return {
    apiKey: process.env.AI_API_KEY,
    baseUrl: (process.env.AI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/+$/, ''),
    model: process.env.AI_MODEL ?? 'gpt-4o-mini',
  };
}

export function aiDisponible(): boolean {
  return Boolean(configAI().apiKey);
}

/** Desenvuelve el contenido del modelo (puede venir envuelto en bloques ```json). */
function desenvolverJSON(contenido: string): unknown {
  const bloque = contenido.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return JSON.parse(bloque ? bloque[1] : contenido);
}

/**
 * Pide al modelo un JSON y lo devuelve tipado. Lanza si el proveedor falla,
 * no responde a tiempo o devuelve JSON inválido; quien llama decide el fallback.
 */
export async function completarJSON<T>({
  mensajeSistema,
  mensajeUsuario,
  temperature = 0.7,
}: {
  mensajeSistema: string;
  mensajeUsuario: string;
  temperature?: number;
}): Promise<T> {
  const { apiKey, baseUrl, model } = configAI();
  if (!apiKey) {
    throw new Error('AI_API_KEY no configurada.');
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      messages: [
        { role: 'system', content: mensajeSistema },
        { role: 'user', content: mensajeUsuario },
      ],
    }),
    // Nunca bloquear la carta más de 12s: si la IA tarda, se sirve el fallback.
    signal: AbortSignal.timeout(Number(process.env.AI_TIMEOUT_MS ?? 12000)),
  });

  if (!res.ok) {
    const detalle = await res.text().catch(() => '');
    throw new Error(`AI respondió con estado ${res.status}: ${detalle.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const contenido = data.choices?.[0]?.message?.content;
  if (!contenido) {
    throw new Error('La IA no devolvió contenido.');
  }

  return desenvolverJSON(contenido) as T;
}