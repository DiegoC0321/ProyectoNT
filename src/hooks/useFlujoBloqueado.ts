'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { pedidoFinalizado, PEDIDO_FINALIZADO_KEY, esPersonal } from '@/lib/flujoCliente';

/**
 * Devuelve si el flujo de cliente quedó bloqueado tras un pedido.
 * El personal autenticado nunca se considera bloqueado.
 */
export function useFlujoBloqueado(): boolean {
  const { usuario } = useAuth();
  const [bloqueado, setBloqueado] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setBloqueado(pedidoFinalizado());
    const onSet = () => setBloqueado(true);
    const onClear = () => setBloqueado(false);
    window.addEventListener('rv:pedido-finalizado', onSet);
    window.addEventListener('rv:pedido-finalizado-limpio', onClear);
    window.addEventListener('storage', (e) => {
      if (e.key === PEDIDO_FINALIZADO_KEY) setBloqueado(pedidoFinalizado() && e.newValue === '1');
    });
    return () => {
      window.removeEventListener('rv:pedido-finalizado', onSet);
      window.removeEventListener('rv:pedido-finalizado-limpio', onClear);
    };
  }, []);

  return !esPersonal(usuario?.rol) && bloqueado;
}