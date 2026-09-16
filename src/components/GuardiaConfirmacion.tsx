'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { pedidoFinalizado, esPersonal } from '@/lib/flujoCliente';
import { RUTA_LOGIN } from '@/lib/acceso';

/** Rutas donde el bloqueo no aplica (acceso del personal + pantalla terminal). */
const RUTAS_LIBRES = [RUTA_LOGIN, '/cliente/confirmacion'];

/**
 * Tras un pedido, el flujo del cliente termina: todo visitante (sin sesión,
 * invitado o cliente sin aprovechar sesión) que intente ir a otra ruta es
 * devuelto a la pantalla de confirmación. El personal autenticado queda libre.
 */
export default function GuardiaConfirmacion() {
  const { usuario, cargando } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (cargando) return;
    if (esPersonal(usuario?.rol)) return;
    if (!pedidoFinalizado()) return;
    const ruta = pathname ?? '';
    if (RUTAS_LIBRES.includes(ruta)) return;
    router.replace('/cliente/confirmacion');
  }, [cargando, usuario, pathname, router]);

  return null;
}