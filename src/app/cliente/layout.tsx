'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { RolNombre } from '@/models/types';

const ROLES_CLIENTE: RolNombre[] = ['CLIENTE', 'INVITADO'];

export default function ClienteLayout({ children }: { children: ReactNode }) {
  const { usuario, cargando, crearSesionInvitado } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (cargando) return;
    if (!usuario) {
      // El cliente no necesita contraseña: se crea una sesión anónima.
      crearSesionInvitado().catch(() => {});
      return;
    }
    if (!ROLES_CLIENTE.includes(usuario.rol)) {
      router.replace('/');
    }
  }, [cargando, usuario, crearSesionInvitado, router]);

  const permitido = !cargando && usuario && ROLES_CLIENTE.includes(usuario.rol);
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