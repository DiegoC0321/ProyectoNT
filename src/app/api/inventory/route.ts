import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/middleware/auth';
import { listarInventario, registrarIngrediente } from '@/controllers/inventoryController';

export async function GET(req: NextRequest) {
  const auth = requireRole(req, ['ADMINISTRADOR', 'COCINA']);
  if ('error' in auth) return auth.error;

  return NextResponse.json({ inventario: listarInventario() });
}

export async function POST(req: NextRequest) {
  const auth = requireRole(req, ['ADMINISTRADOR']);
  if ('error' in auth) return auth.error;

  try {
    const { nombre, unidad_medida, cantidad_inicial, cantidad_minima } = await req.json();
    if (!nombre) return NextResponse.json({ error: 'El nombre del insumo es obligatorio.' }, { status: 400 });

    const inventario = registrarIngrediente(
      nombre,
      unidad_medida ?? 'unidad',
      Number(cantidad_inicial ?? 0),
      Number(cantidad_minima ?? 0)
    );
    return NextResponse.json({ inventario }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
