export function formatearMoneda(valor: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
    valor
  );
}

export function formatearFechaHora(fechaIso: string): string {
  const fecha = new Date(fechaIso.replace(' ', 'T') + (fechaIso.endsWith('Z') ? '' : 'Z'));
  return fecha.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

export const ESTADO_BADGE_CLASE: Record<string, string> = {
  RECIBIDO: 'text-bg-secondary',
  'EN PREPARACION': 'text-bg-warning',
  LISTO: 'text-bg-success',
  ENTREGADO: 'text-bg-primary',
  CANCELADO: 'text-bg-danger',
  LIBRE: 'text-bg-success',
  OCUPADA: 'text-bg-danger',
  'PEDIDO EN CURSO': 'text-bg-warning',
};
