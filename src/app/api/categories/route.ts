import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/middleware/auth';
import { listarCategorias, crearCategoria } from '@/controllers/menuController';

export async function GET() {
  return NextResponse.json({ categorias: listarCategorias() });
}

export async function POST(req: NextRequest) {
  const auth = requireRole(req, ['ADMINISTRADOR']);
  if ('error' in auth) return auth.error;

  try {
    const { nombre, descripcion } = await req.json();
    if (!nombre) return NextResponse.json({ error: 'El nombre de la categoría es obligatorio.' }, { status: 400 });
    const categoria = crearCategoria(nombre, descripcion);
    return NextResponse.json({ categoria }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
