import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/middleware/auth';
import { actualizarEstadoPedido } from '@/controllers/orderController';
import type { EstadoPedido } from '@/models/types';

interface Params {
  params: { id: string };
}

/** RF17 — Cocina actualiza el estado; RF09 notifica a mesero y cliente cuando queda LISTO.
 *  También permite a mesero/admin marcar ENTREGADO. */
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = requireRole(req, ['COCINA', 'MESERO', 'ADMINISTRADOR']);
  if ('error' in auth) return auth.error;

  try {
    const { estado } = (await req.json()) as { estado: EstadoPedido };
    if (!estado) {
      return NextResponse.json({ error: 'El nuevo estado es obligatorio.' }, { status: 400 });
    }
    const pedido = await actualizarEstadoPedido(Number(params.id), estado);
    return NextResponse.json({ pedido });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
