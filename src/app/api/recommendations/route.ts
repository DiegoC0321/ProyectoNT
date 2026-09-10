import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/middleware/auth';
import { recomendarPlatillos } from '@/controllers/recommendationController';

/** RF02 — Recomendaciones personalizadas. Funciona con o sin sesión iniciada. */
export async function GET(req: NextRequest) {
  const user = getAuthUser(req); // puede ser null (usuario anónimo)
  const { searchParams } = new URL(req.url);
  const limite = Number(searchParams.get('limite') ?? 4);

  const clienteId = user && user.rol === 'CLIENTE' ? user.sub : null;
  const recomendaciones = await recomendarPlatillos(clienteId, limite);

  return NextResponse.json({ recomendaciones });
}
