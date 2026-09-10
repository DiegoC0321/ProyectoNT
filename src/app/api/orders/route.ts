import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { listarPedidos, crearPedido, listarPedidosCocina } from '@/controllers/orderController';
import type { EstadoPedido, Pedido } from '@/models/types';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  const { searchParams } = new URL(req.url);
  const estado = searchParams.get('estado') as EstadoPedido | null;

  if (user.rol === 'CLIENTE') {
    return NextResponse.json({ pedidos: await listarPedidos({ clienteId: user.sub, estado: estado ?? undefined }) });
  }
  if (user.rol === 'INVITADO') {
    // Invitado: solo ve los pedidos de su mesa.
    const mesaId = Number(searchParams.get('mesa_id') ?? '0');
    if (!Number.isInteger(mesaId) || mesaId <= 0) {
      return NextResponse.json({ pedidos: [] });
    }
    return NextResponse.json({ pedidos: await listarPedidos({ mesaId, estado: estado ?? undefined }) });
  }
  if (user.rol === 'MESERO') {
    // RF10 — El mesero ve sus propios pedidos + todos los borradores pendientes
    // de confirmar (los que el cliente mandó desde la mesa) para revisarlos/confirmarlos.
    const propios = await listarPedidos({ meseroId: user.sub, estado: estado ?? undefined });
    const pendientes = await listarPedidos({ confirmado: 0, estado: estado ?? undefined });
    const mapa = new Map<number, Pedido>();
    for (const p of propios) mapa.set(p.id, p);
    for (const p of pendientes) if (!mapa.has(p.id)) mapa.set(p.id, p);
    return NextResponse.json({ pedidos: [...mapa.values()] });
  }
  if (user.rol === 'COCINA') {
    // RF16 — pedidos entrantes en orden de llegada
    return NextResponse.json({ pedidos: await listarPedidosCocina() });
  }
  // ADMINISTRADOR ve todo
  return NextResponse.json({ pedidos: await listarPedidos({ estado: estado ?? undefined }) });
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

    let mesaId: number | null = null;
    if (mesa_id != null) {
      mesaId = Number(mesa_id);
      if (!Number.isInteger(mesaId) || mesaId <= 0) {
        return NextResponse.json({ error: 'mesa_id inválido.' }, { status: 400 });
      }
    }

    if (user.rol === 'CLIENTE') {
      const pedido = await crearPedido({
        cliente_id: user.sub,
        mesa_id: mesaId,
        origen: 'CLIENTE',
        observaciones,
        items,
      });
      return NextResponse.json({ pedido }, { status: 201 });
    }

    if (user.rol === 'INVITADO') {
      // Invitado: pedido anónimo ligado a la mesa (sin cuenta).
      // Nace como BORRADOR para que el mesero lo revise, edite y confirme antes de cocina.
      if (!mesa_id) {
        return NextResponse.json(
          { error: 'Debes indicar la mesa (mesa_id) para registrar el pedido.' },
          { status: 400 }
        );
      }
      const pedido = await crearPedido({
        mesa_id: mesaId,
        origen: 'CLIENTE',
        observaciones,
        items,
        confirmado: false,
      });
      return NextResponse.json({ pedido }, { status: 201 });
    }

    if (user.rol === 'MESERO') {
      if (!mesa_id) {
        return NextResponse.json({ error: 'Debes indicar la mesa (mesa_id) para registrar el pedido.' }, { status: 400 });
      }
      const pedido = await crearPedido({
        mesero_id: user.sub,
        mesa_id: mesaId,
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
