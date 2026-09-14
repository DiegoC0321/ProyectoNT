/**
 * Estado terminal del flujo de cliente: una vez que el invitado hace su
 * pedido, la sesión se cierra y el navegador queda "bloqueado" en la pantalla
 * de confirmación hasta que entre una cuenta con sesión (personal o cliente
 * registrado). Así el cliente no puede seguir navegando la app.
 */

export const PEDIDO_FINALIZADO_KEY = 'restaurante.pedido_finalizado';

export function pedidoFinalizado(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(PEDIDO_FINALIZADO_KEY) === '1';
}

export function marcarPedidoFinalizado(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PEDIDO_FINALIZADO_KEY, '1');
  window.dispatchEvent(new Event('rv:pedido-finalizado'));
}

export function limpiarPedidoFinalizado(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PEDIDO_FINALIZADO_KEY);
  window.dispatchEvent(new Event('rv:pedido-finalizado-limpio'));
}

/** Cuentas de personal que sí pueden moverse por la app con normalidad. */
export function esPersonal(rol: string | undefined): boolean {
  return !!rol && rol !== 'CLIENTE' && rol !== 'INVITADO';
}