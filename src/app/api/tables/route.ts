import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/middleware/auth';
import { listarMesas, crearMesa } from '@/controllers/tableController';

export async function GET(req: NextRequest) {
  const auth = requireRole(req, ['MESERO', 'ADMINISTRADOR', 'COCINA']);
  if ('error' in auth) return auth.error;

  return NextResponse.json({ mesas: await listarMesas() });
}

export async function POST(req: NextRequest) {
  const auth = requireRole(req, ['ADMINISTRADOR']);
  if ('error' in auth) return auth.error;

  try {
    const { numero, capacidad } = await req.json();
    if (!numero) return NextResponse.json({ error: 'El número de mesa es obligatorio.' }, { status: 400 });
    const mesa = await crearMesa(numero, capacidad ?? 4);
    return NextResponse.json({ mesa }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
