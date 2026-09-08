'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function ClienteDashboardPage() {
  const { usuario } = useAuth();

  return (
    <div className="container py-5">
      <h1 className="mb-1">Hola, {usuario?.nombre} 👋</h1>
      <p className="text-muted mb-4">¿Qué te gustaría hacer hoy?</p>

      <div className="row g-4">
        <div className="col-md-4">
          <Link href="/cliente/menu" className="text-decoration-none">
            <div className="card h-100 shadow-sm text-center p-4">
              <i className="bi bi-book fs-1 text-warning mb-2"></i>
              <h5>Ver menú y pedir</h5>
              <p className="text-muted small mb-0">Explora nuestros platillos y arma tu pedido.</p>
            </div>
          </Link>
        </div>
        <div className="col-md-4">
          <Link href="/cliente/pedidos" className="text-decoration-none">
            <div className="card h-100 shadow-sm text-center p-4">
              <i className="bi bi-clock-history fs-1 text-warning mb-2"></i>
              <h5>Mis pedidos</h5>
              <p className="text-muted small mb-0">Consulta el estado y tu historial de pedidos.</p>
            </div>
          </Link>
        </div>
        <div className="col-md-4">
          <Link href="/cliente/recomendaciones" className="text-decoration-none">
            <div className="card h-100 shadow-sm text-center p-4">
              <i className="bi bi-stars fs-1 text-warning mb-2"></i>
              <h5>Recomendado para ti</h5>
              <p className="text-muted small mb-0">Sugerencias personalizadas con IA.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
