'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useFlujoBloqueado } from '@/hooks/useFlujoBloqueado';
import { RUTA_LOGIN } from '@/lib/acceso';

/**
 * Enlace de acceso al login del personal (MESERO/COCINA/ADMIN).
 *
 * Visible para todo visitante: la ruta de login ya no es un secreto, se llega
 * desde la landing, el menú, el navbar y el footer. Tras un pedido confirmado
 * el flujo del cliente queda bloqueado y este enlace desaparece para no
 * romper la pantalla de confirmación. El personal sin sesión entra por aquí;
 * la antigua `/login` sigue dando 404. Las cuentas las crea el administrador.
 */
export default function AccesoEmpleados({ className }: { className?: string }) {
  const { cargando } = useAuth();
  const bloqueado = useFlujoBloqueado();

  if (cargando || bloqueado) return null;

  return (
    <Link href={RUTA_LOGIN} className={className ?? 'rv-conto-empleados'}>
      <i className="bi bi-person-badge"></i> Acceso para empleados
    </Link>
  );
}