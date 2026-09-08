import { api } from '@/services/api';
import type { UsuarioPublico } from '@/models/types';

export const authService = {
  registrar: (nombre: string, email: string, password: string) =>
    api.post<{ usuario: UsuarioPublico; token: string }>('/auth/register', { nombre, email, password }),

  login: (email: string, password: string) =>
    api.post<{ usuario: UsuarioPublico; token: string }>('/auth/login', { email, password }),

  logout: () => api.post<{ message: string }>('/auth/logout'),

  sesionInvitado: () => api.post<{ usuario: UsuarioPublico }>('/auth/guest'),

  me: () => api.get<{ usuario: UsuarioPublico }>('/auth/me'),
};
