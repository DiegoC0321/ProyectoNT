import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/middleware/auth';
import { actualizarCantidadInventario } from '@/controllers/inventoryController';

interface Params {
  params: { id: string };
}

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = requireRole(req, ['ADMINISTRADOR']);
  if ('error' in auth) return auth.error;

  try {
    const { cantidad_actual } = await req.json();
    if (cantidad_actual === undefined) {
      return NextResponse.json({ error: 'cantidad_actual es obligatoria.' }, { status: 400 });
    }
    const inventario = await actualizarCantidadInventario(Number(params.id), Number(cantidad_actual));
    return NextResponse.json({ inventario });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
