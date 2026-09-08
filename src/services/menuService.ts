import { api } from '@/services/api';
import type { Platillo, Categoria } from '@/models/types';

export const menuService = {
  listar: (soloDisponibles = true) =>
    api.get<{ platillos: Platillo[] }>(`/menu?disponibles=${soloDisponibles}`),

  obtener: (id: number) => api.get<{ platillo: Platillo }>(`/menu/${id}`),

  crear: (data: Partial<Platillo>) => api.post<{ platillo: Platillo }>('/menu', data),

  actualizar: (id: number, data: Partial<Platillo>) => api.put<{ platillo: Platillo }>(`/menu/${id}`, data),

  alternarDisponibilidad: (id: number) => api.patch<{ platillo: Platillo }>(`/menu/${id}`),

  eliminar: (id: number) => api.delete<{ message: string }>(`/menu/${id}`),

  listarCategorias: () => api.get<{ categorias: Categoria[] }>('/categories'),

  crearCategoria: (nombre: string, descripcion?: string) =>
    api.post<{ categoria: Categoria }>('/categories', { nombre, descripcion }),
};
