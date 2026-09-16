'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useFlujoBloqueado } from '@/hooks/useFlujoBloqueado';
import { RUTA_LOGIN } from '@/lib/acceso';

/**
 * Enlace de acceso rápido para el personal YA autenticado (MESERO/COCINA/ADMIN).
 * No se muestra a visitantes sin sesión, ni a invitados, ni a clientes
 * registrados: el cliente que pide desde la mesa nunca ve una opción de
 * iniciar sesión. El personal que no tiene sesión entra por la ruta oculta
 * (RUTA_LOGIN) directamente; la antigua `/login` da 404. Tras un pedido, el
 * flujo del cliente queda bloqueado y este componente no se renderiza.
 */
export default function AccesoEmpleados({ className }: { className?: string }) {
  const { usuario, cargando } = useAuth();
  const bloqueado = useFlujoBloqueado();

  if (cargando || bloqueado) return null;

  // Solo roles del personal autenticados. Clientes, invitados y visitantes
  // sin sesión no ven ningún camino hacia el login.
  if (usuario && (usuario.rol === 'MESERO' || usuario.rol === 'COCINA' || usuario.rol === 'ADMINISTRADOR')) {
    return (
      <Link href={RUTA_LOGIN} className={className ?? 'rv-conto-empleados'}>
        <i className="bi bi-person-badge"></i> Acceso para empleados
      </Link>
    );
  }

  return null;
}