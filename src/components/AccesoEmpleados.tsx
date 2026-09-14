'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useFlujoBloqueado } from '@/hooks/useFlujoBloqueado';

/**
 * Enlace discreto de acceso exclusivo del personal ("Acceso para empleados").
 * No aparece como un login genérico para clientes: se muestra únicamente a
 * visitantes sin sesión, a invitados (por si el personal quedó en esa sesión)
 * y a empleados autenticados. El cliente registrado no lo ve. Tras un pedido,
 * el flujo del cliente queda bloqueado y el enlace desaparece.
 */
export default function AccesoEmpleados({ className }: { className?: string }) {
  const { usuario, cargando } = useAuth();
  const bloqueado = useFlujoBloqueado();

  if (cargando || bloqueado) return null;

  // Visitante sin sesión o invitado: pueden venir del flujo del personal.
  if (!usuario || usuario.rol === 'INVITADO' || usuario.rol !== 'CLIENTE') {
    return (
      <Link href="/login" className={className ?? 'rv-conto-empleados'}>
        <i className="bi bi-person-badge"></i> Acceso para empleados
      </Link>
    );
  }

  return null;
}