'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { RolNombre } from '@/models/types';

/**
 * Protege una sección completa según el/los rol(es) permitido(s).
 * Se usa dentro de los layouts de /cliente, /mesero, /cocina y /admin.
 */
export default function RequireRole({ roles, children }: { roles: RolNombre[]; children: ReactNode }) {
  const { usuario, cargando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (cargando) return;
    if (!usuario) {
      router.replace('/login');
      return;
    }
    if (!roles.includes(usuario.rol)) {
      router.replace('/');
    }
  }, [usuario, cargando, roles, router]);

  if (cargando || !usuario || !roles.includes(usuario.rol)) {
    return (
      <div className="container py-5 text-center text-muted">
        <div className="spinner-border text-secondary mb-3" role="status" />
        <p>Verificando acceso...</p>
      </div>
    );
  }

  return <>{children}</>;
}
