import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/middleware/auth';
import { listarUsuarios, crearEmpleado } from '@/controllers/userController';
import type { RolNombre } from '@/models/types';

export async function GET(req: NextRequest) {
  const auth = requireRole(req, ['ADMINISTRADOR']);
  if ('error' in auth) return auth.error;

  return NextResponse.json({ usuarios: await listarUsuarios() });
}

export async function POST(req: NextRequest) {
  const auth = requireRole(req, ['ADMINISTRADOR']);
  if ('error' in auth) return auth.error;

  try {
    const { nombre, email, password, rol } = await req.json();
    if (!nombre || !email || !password || !rol) {
      return NextResponse.json({ error: 'nombre, email, password y rol son obligatorios.' }, { status: 400 });
    }
    const usuario = await crearEmpleado(nombre, email, password, rol as RolNombre);
    return NextResponse.json({ usuario }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al crear el usuario.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
