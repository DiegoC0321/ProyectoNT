import { NextResponse } from 'next/server';
import { signToken } from '@/lib/jwt';

/** Invitado: sesión anónima sin contraseña para pedir en mesa (QR/NFC). */
export async function POST() {
  const token = signToken({ sub: 0, email: '', rol: 'INVITADO', nombre: 'Invitado' });

  const response = NextResponse.json({
    usuario: { id: 0, nombre: 'Invitado', email: '', rol: 'INVITADO', activo: true },
  });
  response.cookies.set('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
  return response;
}