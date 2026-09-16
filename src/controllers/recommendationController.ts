import { q } from '@/lib/db';
import { aiDisponible, completarJSON } from '@/lib/ai';
import type { Platillo, PlatoRecomendado } from '@/models/types';

/** Resultado del endpoint: mensaje de la casa + platillos con su motivación. */
export interface Recomendaciones {
  mensaje: string;
  items: PlatoRecomendado[];
}

/**
 * RF02 — Recomendaciones de la casa (sin login).
 *
 * Base: platillos más pedidos de la última semana (7 días), en vivo desde la BD.
 * Narrativa: si hay IA configurada (AI_API_KEY), un LLM elige/ordena los top y
 * escribe un mensaje y una motivación por plato con el tono de la casa. Si la IA
 * no está configurada o falla, se sirve el mismo top con texto por defecto.
 */
export async function recomendarPlatillos(limite = 4): Promise<Recomendaciones> {
  const top = await topSemana(limite);

  if (top.length === 0) {
    return { mensaje: '', items: [] };
  }

  const narrativa = await narrativaIA(top, limite);

  const items: PlatoRecomendado[] = top.map((p) => ({
    ...p,
    motivacion:
      narrativa?.motivaciones.get(p.id) ??
      `Uno de los más pedidos esta semana: ${p.veces_vendido} ${p.veces_vendido === 1 ? 'pedido' : 'pedidos'} en los últimos 7 días.`,
  }));

  // Si la IA dio un orden distinto, respetarlo para armar "el menú de la semana".
  if (narrativa?.orden) {
    const orden = new Map<number, number>();
    narrativa.orden.forEach((id, i) => orden.set(id, i));
    items.sort((a, b) => (orden.get(a.id) ?? 999) - (orden.get(b.id) ?? 999));
  }

  return {
    mensaje:
      narrativa?.mensaje ??
      'Lo más pedido de la última semana, para que no tengas que decidir.',
    items,
  };
}

/** Top N platillos disponibles por unidades pedidas en los últimos 7 días. */
async function topSemana(limite: number): Promise<PlatoRecomendado[]> {
  return q<PlatoRecomendado>(
    `SELECT p.*, c.nombre as categoria_nombre,
            COALESCE(ag.veces, 0) as veces_vendido,
            '' as motivacion
     FROM platillo p
     LEFT JOIN categoria c ON c.id = p.categoria_id
     LEFT JOIN (
       SELECT d.platillo_id, SUM(d.cantidad) as veces
       FROM detalle_pedido d
       JOIN pedido pe ON pe.id = d.pedido_id
       WHERE pe.created_at >= NOW() - INTERVAL '7 days'
         AND pe.estado != 'CANCELADO'
       GROUP BY d.platillo_id
     ) ag ON ag.platillo_id = p.id
     WHERE p.disponible = true
     ORDER BY veces_vendido DESC, p.nombre ASC
     LIMIT ?`,
    [limite]
  );
}

interface NarrativaIA {
  mensaje: string;
  orden: number[];
  motivaciones: Map<number, string>;
}

const TTL_IA_MS = Number(process.env.RECO_IA_TTL_MINUTOS ?? 180) * 60 * 1000;
const cacheIA = new Map<string, { narrativa: NarrativaIA; expira: number }>();

/**
 * Pide a la IA que escriba la narrativa de la semana sobre los candidatos.
 * Con caché en memoria (por defecto 3 h) para no llamar al proveedor en cada
 * carga de la carta. Devuelve null si no hay IA configurada o si falla: en ese
 * caso `recomendarPlatillos` usa el texto por defecto.
 */
async function narrativaIA(top: PlatoRecomendado[], limite: number): Promise<NarrativaIA | null> {
  if (!aiDisponible()) return null;

  const clave = `${limite}:${top.map((t) => `${t.id}:${t.veces_vendido}`).join('|')}`;
  const ahora = Date.now();
  const enCache = cacheIA.get(clave);
  if (enCache && enCache.expira > ahora) {
    return enCache.narrativa;
  }

  const candidatos = top.map((t) => ({
    id: t.id,
    nombre: t.nombre,
    categoria: t.categoria_nombre ?? 'Casa',
    veces_vendido: t.veces_vendido,
    descripcion: t.descripcion ?? '',
  }));

  try {
    const respuesta = await completarJSON<{
      mensaje?: string;
      items?: { id?: number; motivacion?: string }[];
    }>({
      mensajeSistema: [
        'Eres Massimo Ferretti, el encargado de la Trattoria del Vicolo (cocina italiana, Firenze).',
        'El comensal ve la carta digital desde su mesa y no quiere decidir. Tú le sugieres.',
        `Elige exactamente ${limite} platos de la lista que te dan y responde SOLO con JSON válido:`,
        '{"mensaje": "...", "items": [{"id": 1, "motivacion": "..."}]}',
        '- "mensaje": una frase cálida de máximo 24 palabras invitando a probar estos platos ahora.',
        '- "items": exactamente ' + limite + ' elementos, ordenados como tú los servirías esta semana.',
        '- "motivacion" por plato: máximo 15 palabras, en presente, con el tono de la casa ("esta semana", "el público", "la abuela Rosina"...).',
        'Usa únicamente ids de la lista dada y escribe todo en español rioplatense cálido, nunca inventar datos.',
      ].join('\n'),
      mensajeUsuario: JSON.stringify({ platillos_candidatos: candidatos }),
      temperature: 0.8,
    });

    const idsValidos = new Set(top.map((t) => t.id));
    const itemsAI = (respuesta.items ?? [])
      .filter((i) => typeof i.id === 'number' && idsValidos.has(i.id) && typeof i.motivacion === 'string')
      .slice(0, limite);

    if (itemsAI.length === 0) {
      throw new Error('La IA no devolvió platos válidos.');
    }

    const narrativa: NarrativaIA = {
      mensaje: typeof respuesta.mensaje === 'string' ? respuesta.mensaje.trim() : '',
      orden: itemsAI.map((i) => i.id as number),
      motivaciones: new Map(itemsAI.map((i) => [i.id as number, (i.motivacion ?? '').trim()])),
    };

    cacheIA.set(clave, { narrativa, expira: ahora + TTL_IA_MS });
    return narrativa;
  } catch (err) {
    console.error('[recommendations] IA no disponible, sirviendo fallback:', (err as Error).message);
    return null;
  }
}