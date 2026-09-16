import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/middleware/auth';
import { agregarStockPorCodigoBarras } from '@/controllers/inventoryController';

export async function POST(req: NextRequest) {
  const auth = requireRole(req, ['ADMINISTRADOR']);
  if ('error' in auth) return auth.error;

  try {
    const { codigo_de_barras, cantidad } = await req.json();
    if (!codigo_de_barras) {
      return NextResponse.json({ error: 'Escanea o escribe el código de barras.' }, { status: 400 });
    }

    const cantidadN = Number(cantidad);
    if (!Number.isFinite(cantidadN) || cantidadN <= 0) {
      return NextResponse.json({ error: 'La cantidad debe ser mayor que cero.' }, { status: 400 });
    }

    const inventario = await agregarStockPorCodigoBarras(String(codigo_de_barras).trim(), cantidadN);
    return NextResponse.json({ inventario });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al actualizar el stock.';
    const status = /No se encontró ningún insumo/.test(message) ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}