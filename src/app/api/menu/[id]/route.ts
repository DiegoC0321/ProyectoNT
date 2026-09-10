import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/middleware/auth';
import { obtenerPlatillo, actualizarPlatillo, eliminarPlatillo, alternarDisponibilidad } from '@/controllers/menuController';

interface Params {
  params: { id: string };
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    return NextResponse.json({ platillo: await obtenerPlatillo(Number(params.id)) });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 404 });
  }
}

/** RF14 — Editar platillo (administrador) */
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = requireRole(req, ['ADMINISTRADOR']);
  if ('error' in auth) return auth.error;

  try {
    const data = await req.json();
    const platillo = await actualizarPlatillo(Number(params.id), data);
    return NextResponse.json({ platillo });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

/** RF14 — Activar/desactivar disponibilidad rápidamente */
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = requireRole(req, ['ADMINISTRADOR']);
  if ('error' in auth) return auth.error;

  try {
    const platillo = await alternarDisponibilidad(Number(params.id));
    return NextResponse.json({ platillo });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

/** RF14 — Eliminar platillo (administrador) */
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = requireRole(req, ['ADMINISTRADOR']);
  if ('error' in auth) return auth.error;

  try {
    await eliminarPlatillo(Number(params.id));
    return NextResponse.json({ message: 'Platillo eliminado.' });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
