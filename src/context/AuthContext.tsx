'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { UsuarioPublico } from '@/models/types';
import { authService } from '@/services/authService';
import { limpiarPedidoFinalizado } from '@/lib/flujoCliente';

interface AuthContextValue {
  usuario: UsuarioPublico | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<UsuarioPublico>;
  registrar: (nombre: string, email: string, password: string) => Promise<UsuarioPublico>;
  crearSesionInvitado: () => Promise<UsuarioPublico>;
  logout: (destino?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioPublico | null>(null);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();
  const usuarioRef = useRef(usuario);
  usuarioRef.current = usuario;

  useEffect(() => {
    authService
      .me()
      .then((res) => setUsuario(res.usuario))
      .catch(() => setUsuario(null))
      .finally(() => setCargando(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login(email, password);
    setUsuario(res.usuario);
    // Una cuenta real (personal o cliente registrado) levanta el bloqueo que
    // dejó el pedido del invitado anterior.
    if (res.usuario.rol !== 'INVITADO') limpiarPedidoFinalizado();
    return res.usuario;
  }, []);

  const registrar = useCallback(async (nombre: string, email: string, password: string) => {
    const res = await authService.registrar(nombre, email, password);
    setUsuario(res.usuario);
    if (res.usuario.rol !== 'INVITADO') limpiarPedidoFinalizado();
    return res.usuario;
  }, []);

  const crearSesionInvitado = useCallback(async () => {
    const res = await authService.sesionInvitado();
    setUsuario(res.usuario);
    return res.usuario;
  }, []);

  const logout = useCallback(async (destino?: string) => {
    const eraInvitado = usuarioRef.current?.rol === 'INVITADO';
    await authService.logout();
    setUsuario(null);
    router.push(destino ?? (eraInvitado ? '/' : '/login'));
  }, [router]);

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, registrar, crearSesionInvitado, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de un <AuthProvider>');
  return ctx;
}