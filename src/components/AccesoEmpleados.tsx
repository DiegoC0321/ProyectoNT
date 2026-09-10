'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

/**
 * Muestra el enlace de "Acceso para empleados" solo cuando
 * el usuario NO está autenticado (o es un rol de empleado).
 * Nunca se muestra a clientes ni invitados.
 */
export default function AccesoEmpleados({ className }: { className?: string }) {
  const { usuario, cargando } = useAuth();

  if (cargando) return null;

  // Si no hay usuario, mostrar (visitante no autenticado)
  if (!usuario) {
    return (
      <Link href="/login" className={className ?? 'rv-conto-empleados'}>
        <i className="bi bi-person-badge"></i> Acceso para empleados
      </Link>
    );
  }

  // Si es cliente o invitado, NUNCA mostrar
  if (usuario.rol === 'CLIENTE' || usuario.rol === 'INVITADO') {
    return null;
  }

  // Si es empleado (MESERO, COCINA, ADMIN), mostrar
  return (
    <Link href="/login" className={className ?? 'rv-conto-empleados'}>
      <i className="bi bi-person-badge"></i> Acceso para empleados
    </Link>
  );
}
