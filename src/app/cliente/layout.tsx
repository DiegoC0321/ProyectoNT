'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { RolNombre } from '@/models/types';

const ROLES_CLIENTE: RolNombre[] = ['CLIENTE', 'INVITADO'];

/**
 * Zona del cliente. Permite navegar SIN sesión (visitante anónimo): la sesión
 * de invitado se crea únicamente al confirmar un pedido, para no interferir
 * con el flujo de acceso de los empleados. Los roles de empleado son
 * redirigidos a su propio espacio.
 */
export default function ClienteLayout({ children }: { children: ReactNode }) {
  const { usuario, cargando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (cargando || !usuario) return;
    if (!ROLES_CLIENTE.includes(usuario.rol)) {
      router.replace('/');
    }
  }, [cargando, usuario, router]);

  const permitido = !cargando && (!usuario || ROLES_CLIENTE.includes(usuario.rol));
  if (!permitido) {
    return (
      <div className="container py-5 text-center text-muted">
        <div className="spinner-border text-secondary mb-3" role="status" />
        <p>Preparando tu experiencia...</p>
      </div>
    );
  }

  return <>{children}</>;
}