import { NextRequest, NextResponse } from 'next/server';
import { iniciarSesion } from '@/controllers/authController';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email y password son obligatorios.' }, { status: 400 });
    }

    const { usuario, token } = await iniciarSesion(email, password);

    const response = NextResponse.json({ usuario, token });
    response.cookies.set('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    });
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al iniciar sesión.';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
