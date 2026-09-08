import { NextRequest, NextResponse } from 'next/server';
import { buscarMesaPorNumero } from '@/controllers/tableController';

interface Params {
  params: { numero: string };
}

/** Público: resuelve la mesa del QR/NFC a partir de su número (solo info básica). */
export async function GET(_req: NextRequest, { params }: Params) {
  const numero = Number(params.numero);
  if (!Number.isInteger(numero) || numero <= 0) {
    return NextResponse.json({ error: 'Número de mesa inválido.' }, { status: 400 });
  }

  const mesa = buscarMesaPorNumero(numero);
  if (!mesa) {
    return NextResponse.json({ error: 'Mesa no encontrada.' }, { status: 404 });
  }

  return NextResponse.json({ mesa });
}