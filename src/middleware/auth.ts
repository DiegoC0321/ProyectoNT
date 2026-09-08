import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import type { JwtPayload, RolNombre } from '@/models/types';

/**
 * Extrae y valida el JWT desde el header Authorization: Bearer <token>
 * o desde la cookie "token" (para peticiones desde el navegador).
 */
export function getAuthUser(req: NextRequest): JwtPayload | null {
  const authHeader = req.headers.get('authorization');
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    token = req.cookies.get('token')?.value;
  }

  if (!token) return null;
  return verifyToken(token);
}

/**
 * Protege una ruta API: exige un token válido.
 * Devuelve el usuario autenticado o una respuesta 401.
 */
export function requireAuth(req: NextRequest): { user: JwtPayload } | { error: NextResponse } {
  const user = getAuthUser(req);
  if (!user) {
    return { error: NextResponse.json({ error: 'No autenticado. Token inválido o ausente.' }, { status: 401 }) };
  }
  return { user };
}

/**
 * Protege una ruta API según rol(es) permitidos.
 * Uso: const auth = requireRole(req, ['ADMINISTRADOR']); if ('error' in auth) return auth.error;
 */
export function requireRole(
  req: NextRequest,
  rolesPermitidos: RolNombre[]
): { user: JwtPayload } | { error: NextResponse } {
  const authResult = requireAuth(req);
  if ('error' in authResult) return authResult;

  if (!rolesPermitidos.includes(authResult.user.rol)) {
    return {
      error: NextResponse.json(
        { error: `Acceso denegado. Se requiere uno de los roles: ${rolesPermitidos.join(', ')}.` },
        { status: 403 }
      ),
    };
  }
  return { user: authResult.user };
}
