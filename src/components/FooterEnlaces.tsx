'use client';

import Link from 'next/link';
import AccesoEmpleados from '@/components/AccesoEmpleados';
import { useFlujoBloqueado } from '@/hooks/useFlujoBloqueado';

/**
 * Enlaces del footer. Tras un pedido (flujo de cliente bloqueado) no se
 * ofrece ninguna salida: el cliente permanece en la confirmación.
 */
export default function FooterEnlaces() {
  const bloqueado = useFlujoBloqueado();
  if (bloqueado) return null;

  return (
    <p className="rv-footer-links">
      <Link href="/menu">Menú digital</Link>
      <AccesoEmpleados className="" />
    </p>
  );
}