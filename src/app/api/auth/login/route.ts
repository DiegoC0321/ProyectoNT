import { NextRequest, NextResponse } from 'next/server';
import { iniciarSesion } from '@/controllers/authController';
import { estadoLogin, registrarFallo, registrarExito } from '@/lib/rateLimit';

function ipDe(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'local';
}

function dormir(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

/**
 * El error es siempre el mismo ("Credenciales inválidas.") para no revelar si
 * el email existe o la razón del fallo, y las respuestas fallidas tardan lo
 * mismo (450 ms) para que la fuerza bruta no gane información por timing.
 */
export async function POST(req: NextRequest) {
  const ip = ipDe(req);

  const { permitido, retryAfterSegundos } = estadoLogin(ip);
  if (!permitido) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera antes de volver a intentar.', retryAfter: retryAfterSegundos },
      { status: 429, headers: { 'Retry-After': String(retryAfterSegundos) } }
    );
  }

  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      await dormir(450);
      registrarFallo(ip);
      return NextResponse.json({ error: 'Credenciales inválidas.' }, { status: 401 });
    }

    const { usuario, token } = await iniciarSesion(email, password);

    registrarExito(ip);
    const response = NextResponse.json({ usuario, token });
    response.cookies.set('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    });
    return response;
  } catch {
    await dormir(450);
    registrarFallo(ip);
    return NextResponse.json({ error: 'Credenciales inválidas.' }, { status: 401 });
  }
}