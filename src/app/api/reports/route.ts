import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/middleware/auth';
import { resumenVentas, generarReportePorPeriodo } from '@/controllers/reportController';

export async function GET(req: NextRequest) {
  const auth = requireRole(req, ['ADMINISTRADOR']);
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const desde = searchParams.get('desde');
  const hasta = searchParams.get('hasta');

  if (desde && hasta) {
    // RF13 — Reporte por periodo
    return NextResponse.json(await generarReportePorPeriodo(desde, hasta));
  }

  // RF11 — Panel de control de ventas (día / semana / mes)
  return NextResponse.json(await resumenVentas());
}
