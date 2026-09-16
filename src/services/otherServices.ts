import { api } from '@/services/api';
import type { Mesa, EstadoMesa, Inventario, Platillo, PlatoRecomendado, UsuarioPublico, RolNombre } from '@/models/types';

export const tableService = {
  listar: () => api.get<{ mesas: Mesa[] }>('/tables'),
  actualizarEstado: (id: number, estado: EstadoMesa) => api.put<{ mesa: Mesa }>(`/tables/${id}`, { estado }),
  crear: (numero: number, capacidad: number) => api.post<{ mesa: Mesa }>('/tables', { numero, capacidad }),
};

export const inventoryService = {
  listar: () => api.get<{ inventario: Inventario[] }>('/inventory'),
  registrar: (
    nombre: string,
    unidad_medida: string,
    cantidad_inicial: number,
    cantidad_minima: number,
    codigo_de_barras?: string
  ) =>
    api.post<{ inventario: Inventario[] }>('/inventory', {
      nombre,
      unidad_medida,
      cantidad_inicial,
      cantidad_minima,
      codigo_de_barras: codigo_de_barras ?? '',
    }),
  agregarPorCodigo: (codigo_de_barras: string, cantidad: number) =>
    api.post<{ inventario: Inventario[] }>('/inventory/agregar', { codigo_de_barras, cantidad }),
  actualizarCantidad: (id: number, cantidad_actual: number) =>
    api.put<{ inventario: Inventario[] }>(`/inventory/${id}`, { cantidad_actual }),
};

export interface ResumenVentas {
  ventas_dia: { total: number; pedidos: number };
  ventas_semana: { total: number; pedidos: number };
  ventas_mes: { total: number; pedidos: number };
  total_pedidos_historico: number;
  productos_mas_vendidos: { nombre: string; unidades_vendidas: number; ingresos: number }[];
  ventas_ultimos_7_dias: { fecha: string; total: number }[];
}

export const reportService = {
  resumen: () => api.get<ResumenVentas>('/reports'),
  porPeriodo: (desde: string, hasta: string) => api.get<unknown>(`/reports?desde=${desde}&hasta=${hasta}`),
};

export const recommendationService = {
  obtener: (limite = 4) =>
    api.get<{ mensaje: string; recomendaciones: PlatoRecomendado[] }>(`/recommendations?limite=${limite}`),
};

export const userService = {
  listar: () => api.get<{ usuarios: UsuarioPublico[] }>('/users'),
  crearUsuario: (nombre: string, email: string, password: string, rol: RolNombre) =>
    api.post<{ usuario: UsuarioPublico }>('/users', { nombre, email, password, rol }),
  actualizar: (id: number, data: Partial<{ nombre: string; email: string; rol: RolNombre; activo: boolean }>) =>
    api.put<{ usuario: UsuarioPublico }>(`/users/${id}`, data),
  desactivar: (id: number) => api.delete<{ usuario: UsuarioPublico }>(`/users/${id}`),
};
