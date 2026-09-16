'use client';

import { ReactNode } from 'react';

/**
 * Zona del cliente. Es un PROCESO independiente de las cuentas del personal:
 * cualquier visitante puede navegar aquí, incluso si el mesero está logueado
 * en el mismo navegador (la identidad del personal pertenece a otro proceso).
 */
export default function ClienteLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}