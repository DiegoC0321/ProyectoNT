import { api } from '@/services/api';
import type { Pedido, EstadoPedido } from '@/models/types';

export interface ItemCarrito {
  platillo_id: number;
  cantidad: number;
}

export const orderService = {
  listar: (opts?: { estado?: EstadoPedido; mesaId?: number }) => {
    const params = new URLSearchParams();
    if (opts?.estado) params.set('estado', opts.estado);
    if (opts?.mesaId) params.set('mesa_id', String(opts.mesaId));
    const qs = params.toString();
    return api.get<{ pedidos: Pedido[] }>(`/orders${qs ? `?${qs}` : ''}`);
  },

  obtener: (id: number) => api.get<{ pedido: Pedido }>(`/orders/${id}`),

  crearComoCliente: (items: ItemCarrito[], observaciones?: string, mesaId?: number, tokenInvitado?: string) => {
    const body = mesaId != null ? { items, observaciones, mesa_id: mesaId } : { items, observaciones };
    // Flujo de cliente: si viene un token de invitado transitorio, se envía por
    // header en lugar de la cookie, para no mezclar la sesión del personal.
    const headers = tokenInvitado ? { Authorization: `Bearer ${tokenInvitado}` } : undefined;
    return api.post<{ pedido: Pedido }>('/orders', body, headers);
  },

  crearComoMesero: (mesaId: number, items: ItemCarrito[], observaciones?: string, confirmado = false) =>
    api.post<{ pedido: Pedido }>('/orders', { mesa_id: mesaId, items, observaciones, confirmado }),

  actualizar: (id: number, items: ItemCarrito[], observaciones?: string) =>
    api.put<{ pedido: Pedido }>(`/orders/${id}`, { items, observaciones }),

  cancelar: (id: number) => api.delete<{ pedido: Pedido }>(`/orders/${id}`),

  confirmar: (id: number) => api.post<{ pedido: Pedido }>(`/orders/${id}/confirm`),

  cambiarEstado: (id: number, estado: EstadoPedido) =>
    api.patch<{ pedido: Pedido }>(`/orders/${id}/status`, { estado }),

  repetir: (id: number) => api.post<{ pedido: Pedido }>(`/orders/${id}/repeat`),
};
