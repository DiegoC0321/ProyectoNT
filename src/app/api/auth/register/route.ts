import { NextRequest, NextResponse } from 'next/server';
import { registrarCliente } from '@/controllers/authController';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nombre, email, password } = body;

    if (!nombre || !email || !password) {
      return NextResponse.json({ error: 'Nombre, email y password son obligatorios.' }, { status: 400 });
    }
    if (String(password).length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, { status: 400 });
    }

    const { usuario, token } = registrarCliente(nombre, email, password);

    const response = NextResponse.json({ usuario, token }, { status: 201 });
    response.cookies.set('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    });
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al registrar el usuario.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
