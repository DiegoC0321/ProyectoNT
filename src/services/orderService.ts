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

  crearComoCliente: (items: ItemCarrito[], observaciones?: string, mesaId?: number) =>
    api.post<{ pedido: Pedido }>('/orders', mesaId != null ? { items, observaciones, mesa_id: mesaId } : { items, observaciones }),

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
