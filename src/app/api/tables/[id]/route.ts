import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/middleware/auth';
import { actualizarEstadoMesa } from '@/controllers/tableController';
import type { EstadoMesa } from '@/models/types';

interface Params {
  params: { id: string };
}

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = requireRole(req, ['MESERO', 'ADMINISTRADOR']);
  if ('error' in auth) return auth.error;

  try {
    const { estado } = (await req.json()) as { estado: EstadoMesa };
    const mesa = await actualizarEstadoMesa(Number(params.id), estado);
    return NextResponse.json({ mesa });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
