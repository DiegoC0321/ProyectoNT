import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { obtenerUsuarioPorId } from '@/controllers/authController';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ('error' in auth) return auth.error;

  const usuario = obtenerUsuarioPorId(auth.user.sub);
  if (!usuario) {
    return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
  }
  return NextResponse.json({ usuario });
}
