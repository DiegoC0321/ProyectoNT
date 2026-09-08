import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { listarPedidos, crearPedido, listarPedidosCocina } from '@/controllers/orderController';
import type { EstadoPedido } from '@/models/types';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  const { searchParams } = new URL(req.url);
  const estado = searchParams.get('estado') as EstadoPedido | null;

  if (user.rol === 'CLIENTE') {
    return NextResponse.json({ pedidos: listarPedidos({ clienteId: user.sub, estado: estado ?? undefined }) });
  }
  if (user.rol === 'MESERO') {
    return NextResponse.json({ pedidos: listarPedidos({ meseroId: user.sub, estado: estado ?? undefined }) });
  }
  if (user.rol === 'COCINA') {
    // RF16 — pedidos entrantes en orden de llegada
    return NextResponse.json({ pedidos: listarPedidosCocina() });
  }
  // ADMINISTRADOR ve todo
  return NextResponse.json({ pedidos: listarPedidos({ estado: estado ?? undefined }) });
}

/** RF04 (cliente) / RF07 (mesero) — Crear un pedido */
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  try {
    const body = await req.json();
    const { items, observaciones, mesa_id } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'El pedido debe incluir al menos un producto.' }, { status: 400 });
    }

    if (user.rol === 'CLIENTE') {
      const pedido = crearPedido({
        cliente_id: user.sub,
        origen: 'CLIENTE',
        observaciones,
        items,
      });
      return NextResponse.json({ pedido }, { status: 201 });
    }

    if (user.rol === 'MESERO') {
      if (!mesa_id) {
        return NextResponse.json({ error: 'Debes indicar la mesa (mesa_id) para registrar el pedido.' }, { status: 400 });
      }
      const pedido = crearPedido({
        mesero_id: user.sub,
        mesa_id,
        cliente_id: body.cliente_id ?? null,
        origen: 'MESERO',
        observaciones,
        items,
        confirmado: body.confirmado === true, // por defecto queda como borrador (RF10)
      });
      return NextResponse.json({ pedido }, { status: 201 });
    }

    return NextResponse.json({ error: 'Solo clientes o meseros pueden registrar pedidos.' }, { status: 403 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
