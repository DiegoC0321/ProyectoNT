import { NextResponse } from 'next/server';
import { signToken } from '@/lib/jwt';

/**
 * Invitado: sesión anónima sin contraseña para pedir en mesa (QR/NFC).
 *
 * La identidad del invitado es TRANSITORIA y NO usa la cookie "token", que
 * está reservada a las cuentas reales (personal y clientes registrados). El
 * token se devuelve en el cuerpo para que el flujo de cliente lo envíe solo
 * en la llamada que crea el pedido (Authorization: Bearer), sin contaminar la
 * sesión del personal que pueda estar abierta en el mismo navegador.
 */
export async function POST() {
  const token = signToken({ sub: 0, email: '', rol: 'INVITADO', nombre: 'Invitado' });

  return NextResponse.json({
    usuario: { id: 0, nombre: 'Invitado', email: '', rol: 'INVITADO', activo: true },
    token,
  });
}