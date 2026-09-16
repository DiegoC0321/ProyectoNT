'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useFlujoBloqueado } from '@/hooks/useFlujoBloqueado';

const ENLACES_POR_ROL: Record<string, { href: string; label: string }[]> = {
  INVITADO: [
    { href: '/cliente', label: 'Inicio' },
    { href: '/cliente/menu', label: 'Menú' },
    { href: '/cliente/carrito', label: 'Carrito' },
    { href: '/cliente/pedidos', label: 'Mis pedidos' },
  ],
  CLIENTE: [
    { href: '/cliente', label: 'Dashboard' },
    { href: '/cliente/menu', label: 'Menú' },
    { href: '/cliente/carrito', label: 'Carrito' },
    { href: '/cliente/pedidos', label: 'Mis pedidos' },
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
  const pathname = usePathname();
  const bloqueado = useFlujoBloqueado();
  // En la zona del cliente, una cuenta de personal (mesero/cocina/admin) NO es
  // la identidad del comensal: pertenece a otro proceso. Se muestra la vista de
  // invitado. Solo una cuenta CLIENTE registrada se muestra como sesión aquí.
  const enCliente = (pathname ?? '').startsWith('/cliente');
  const vistaCliente = enCliente && usuario?.rol !== 'CLIENTE';
  const enlaces = vistaCliente
    ? ENLACES_POR_ROL.INVITADO
    : usuario
      ? ENLACES_POR_ROL[usuario.rol] ?? []
      : [];

  // Tras un pedido, el cliente queda en la confirmación: no se ofrece ninguna
  // navegación ni acceso a login.
  if (bloqueado) {
    return (
      <nav className="navbar navbar-dark rv-navbar sticky-top">
        <div className="container">
          <span className="navbar-brand mb-0">
            Trattoria <em>del Vicolo</em>
            <small>Cucina italiana · dal 1987</small>
          </span>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark rv-navbar sticky-top">
      <div className="container">
        <Link className="navbar-brand" href="/">
          Trattoria <em>del Vicolo</em>
          <small>Cucina italiana · dal 1987</small>
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-label="Abrir menú de navegación"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-4">
            {!usuario && (
              <li className="nav-item">
                <Link className="nav-link" href="/menu">
                  La carta
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
                <li className="nav-item me-2 mb-2 mb-lg-0">
                  <span className="rv-nav-badge">
                    {usuario.rol === 'INVITADO' || vistaCliente
                      ? 'Invitado'
                      : `${usuario.nombre} · ${usuario.rol}`}
                  </span>
                </li>
                {usuario.rol !== 'INVITADO' && !vistaCliente && (
                  <li className="nav-item mb-2 mb-lg-0">
                    <button className="rv-nav-salir" onClick={() => logout()}>
                      Cerrar sesión
                    </button>
                  </li>
                )}
              </>
            ) : (
              <li className="nav-item">
                <Link className="nav-link rv-nav-cta" href="/menu?mesa=1">
                  <i className="bi bi-qr-code-scan"></i> Pedir desde la mesa
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}