import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/middleware/auth';
import { confirmarPedido } from '@/controllers/orderController';

interface Params {
  params: { id: string };
}

/** RF10 — El mesero confirma y envía a cocina un pedido en borrador */
export async function POST(req: NextRequest, { params }: Params) {
  const auth = requireRole(req, ['MESERO', 'ADMINISTRADOR']);
  if ('error' in auth) return auth.error;

  try {
    const pedido = confirmarPedido(Number(params.id));
    return NextResponse.json({ pedido });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
