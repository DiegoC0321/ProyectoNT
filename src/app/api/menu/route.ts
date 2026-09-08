import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/middleware/auth';
import { listarPlatillos, crearPlatillo } from '@/controllers/menuController';

/** RF01 — Consulta pública del menú digital (no requiere autenticación) */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const soloDisponibles = searchParams.get('disponibles') !== 'false';
  const categoriaId = searchParams.get('categoria_id');

  const platillos = listarPlatillos({
    soloDisponibles,
    categoriaId: categoriaId ? Number(categoriaId) : undefined,
  });

  return NextResponse.json({ platillos });
}

/** RF14 — Crear platillo (solo administrador) */
export async function POST(req: NextRequest) {
  const auth = requireRole(req, ['ADMINISTRADOR']);
  if ('error' in auth) return auth.error;

  try {
    const data = await req.json();
    if (!data.nombre || data.precio === undefined) {
      return NextResponse.json({ error: 'nombre y precio son obligatorios.' }, { status: 400 });
    }
    const platillo = crearPlatillo(data);
    return NextResponse.json({ platillo }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
