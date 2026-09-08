import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/middleware/auth';
import { repetirPedido } from '@/controllers/orderController';

interface Params {
  params: { id: string };
}

/** RF06 — El cliente repite un pedido anterior de su historial */
export async function POST(req: NextRequest, { params }: Params) {
  const auth = requireRole(req, ['CLIENTE']);
  if ('error' in auth) return auth.error;

  try {
    const pedido = repetirPedido(Number(params.id), auth.user.sub);
    return NextResponse.json({ pedido }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
