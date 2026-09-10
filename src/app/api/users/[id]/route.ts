import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/middleware/auth';
import { obtenerUsuario, actualizarUsuario, desactivarUsuario } from '@/controllers/userController';

interface Params {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: Params) {
  const auth = requireRole(req, ['ADMINISTRADOR']);
  if ('error' in auth) return auth.error;

  try {
    return NextResponse.json({ usuario: await obtenerUsuario(Number(params.id)) });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 404 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = requireRole(req, ['ADMINISTRADOR']);
  if ('error' in auth) return auth.error;

  try {
    const data = await req.json();
    const usuario = await actualizarUsuario(Number(params.id), data);
    return NextResponse.json({ usuario });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

/** Desactivar usuario (no se elimina para preservar trazabilidad de pedidos) */
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = requireRole(req, ['ADMINISTRADOR']);
  if ('error' in auth) return auth.error;

  try {
    const usuario = await desactivarUsuario(Number(params.id));
    return NextResponse.json({ usuario });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
