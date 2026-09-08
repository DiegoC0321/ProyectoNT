'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const ENLACES_POR_ROL: Record<string, { href: string; label: string }[]> = {
  CLIENTE: [
    { href: '/cliente', label: 'Dashboard' },
    { href: '/cliente/menu', label: 'Menú' },
    { href: '/cliente/carrito', label: 'Carrito' },
    { href: '/cliente/pedidos', label: 'Mis pedidos' },
    { href: '/cliente/recomendaciones', label: 'Recomendaciones' },
  ],
  MESERO: [
    { href: '/mesero', label: 'Dashboard' },
    { href: '/mesero/mesas', label: 'Mesas' },
    { href: '/mesero/registrar-pedido', label: 'Registrar pedido' },
    { href: '/mesero/pedidos', label: 'Pedidos' },
  ],
  COCINA: [
    { href: '/cocina', label: 'Dashboard' },
    { href: '/cocina/pedidos', label: 'Pedidos entrantes' },
  ],
  ADMINISTRADOR: [
    { href: '/admin', label: 'Ventas' },
    { href: '/admin/inventario', label: 'Inventario' },
    { href: '/admin/menu', label: 'Menú' },
    { href: '/admin/usuarios', label: 'Usuarios' },
    { href: '/admin/reportes', label: 'Reportes' },
  ],
};

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const enlaces = usuario ? ENLACES_POR_ROL[usuario.rol] ?? [] : [];

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm sticky-top">
      <div className="container">
        <Link className="navbar-brand fw-bold" href="/">
          🍽️ Restaurante Inteligente
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {!usuario && (
              <li className="nav-item">
                <Link className="nav-link" href="/menu">
                  Menú
                </Link>
              </li>
            )}
            {enlaces.map((enlace) => (
              <li className="nav-item" key={enlace.href}>
                <Link className="nav-link" href={enlace.href}>
                  {enlace.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="navbar-nav ms-auto align-items-lg-center">
            {usuario ? (
              <>
                <li className="nav-item me-2">
                  <span className="badge text-bg-light text-dark">
                    {usuario.nombre} · {usuario.rol}
                  </span>
                </li>
                <li className="nav-item">
                  <button className="btn btn-outline-light btn-sm" onClick={() => logout()}>
                    Cerrar sesión
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item me-2">
                  <Link className="btn btn-outline-light btn-sm" href="/login">
                    Iniciar sesión
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="btn btn-warning btn-sm" href="/register">
                    Registrarse
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
