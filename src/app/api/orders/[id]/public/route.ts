import { NextRequest, NextResponse } from 'next/server';
import { obtenerPedido } from '@/controllers/orderController';

interface Params {
  params: { id: string };
}

/**
 * Confirmación pública de un pedido (punto de venta / cliente).
 * Solo devuelve el pedido si el número de mesa coincide: el cliente acaba de
 * cerrar su sesión de invitado y aún necesita ver su comprobante.
 */
export async function GET(req: NextRequest, { params }: Params) {
  const { searchParams } = new URL(req.url);
  const mesaId = Number(searchParams.get('mesa') ?? '0');

  try {
    const pedido = await obtenerPedido(Number(params.id));
    if (!Number.isInteger(mesaId) || mesaId <= 0 || Number(pedido.mesa_id) !== mesaId) {
      return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 });
    }
    return NextResponse.json({ pedido });
  } catch {
    return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 });
  }
}