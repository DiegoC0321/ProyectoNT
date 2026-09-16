import { NextRequest, NextResponse } from 'next/server';
import { recomendarPlatillos } from '@/controllers/recommendationController';

/**
 * RF02 — Recomendaciones de la casa. Sin sesión.
 *
 * Base: lo más pedido de la última semana. Si AI_API_KEY está configurada, un
 * LLM (endpoint OpenAI-compatible) ordena los top y escribe el mensaje y las
 * motivaciones con el tono de la casa. Respuesta:
 *   { mensaje: string, recomendaciones: PlatoRecomendado[] }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limite = Math.min(Math.max(Number(searchParams.get('limite') ?? 4), 1), 8);

  const resultado = await recomendarPlatillos(limite);

  return NextResponse.json({ mensaje: resultado.mensaje, recomendaciones: resultado.items });
}