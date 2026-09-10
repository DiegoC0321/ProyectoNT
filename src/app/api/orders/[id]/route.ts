import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { obtenerPedido, actualizarPedido, cancelarPedido } from '@/controllers/orderController';
import type { Pedido } from '@/models/types';

interface Params {
  params: { id: string };
}

function puedeVerPedido(user: { sub: number; rol: string }, pedido: Pedido) {
  if (user.rol === 'ADMINISTRADOR' || user.rol === 'COCINA') return true;
  if (user.rol === 'CLIENTE') return pedido.cliente_id === user.sub;
  // MESERO: sus propios pedidos + cualquier borrador pendiente de confirmar (pedidos de mesa)
  if (user.rol === 'MESERO') return pedido.mesero_id === user.sub || !pedido.confirmado;
  return false;
}

export async function GET(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if ('error' in auth) return auth.error;

  try {
    const pedido = await obtenerPedido(Number(params.id));
    if (!puedeVerPedido(auth.user, pedido)) {
      return NextResponse.json({ error: 'No tienes permiso para ver este pedido.' }, { status: 403 });
    }
    return NextResponse.json({ pedido });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 404 });
  }
}

/** RF10 — Editar pedido (solo si no ha sido confirmado/enviado a cocina) */
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if ('error' in auth) return auth.error;

  try {
    const pedido = await obtenerPedido(Number(params.id));
    if (!puedeVerPedido(auth.user, pedido)) {
      return NextResponse.json({ error: 'No tienes permiso para modificar este pedido.' }, { status: 403 });
    }
    const { items, observaciones } = await req.json();
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'El pedido debe incluir al menos un producto.' }, { status: 400 });
    }
    const actualizado = await actualizarPedido(Number(params.id), items, observaciones);
    return NextResponse.json({ pedido: actualizado });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

/** RF10 — Cancelar pedido (solo si no ha sido confirmado/enviado a cocina) */
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if ('error' in auth) return auth.error;

  try {
    const pedido = await obtenerPedido(Number(params.id));
    if (!puedeVerPedido(auth.user, pedido)) {
      return NextResponse.json({ error: 'No tienes permiso para cancelar este pedido.' }, { status: 403 });
    }
    const cancelado = await cancelarPedido(Number(params.id));
    return NextResponse.json({ pedido: cancelado });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
