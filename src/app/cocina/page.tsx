'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { orderService } from '@/services/orderService';

export default function CocinaDashboardPage() {
  const { usuario } = useAuth();
  const [recibidos, setRecibidos] = useState(0);
  const [enPreparacion, setEnPreparacion] = useState(0);

  useEffect(() => {
    orderService.listar().then((res) => {
      setRecibidos(res.pedidos.filter((p) => p.estado === 'RECIBIDO').length);
      setEnPreparacion(res.pedidos.filter((p) => p.estado === 'EN PREPARACION').length);
    });
  }, []);

  return (
    <div className="container py-5">
      <h1 className="mb-1">Hola, {usuario?.nombre} 👨‍🍳</h1>
      <p className="text-muted mb-4">Panel de cocina</p>

      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div className="card shadow-sm p-4 text-center">
            <i className="bi bi-inbox fs-1 text-secondary"></i>
            <h2>{recibidos}</h2>
            <p className="text-muted mb-0">Pedidos recibidos</p>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm p-4 text-center">
            <i className="bi bi-fire fs-1 text-warning"></i>
            <h2>{enPreparacion}</h2>
            <p className="text-muted mb-0">En preparación</p>
          </div>
        </div>
      </div>

      <Link href="/cocina/pedidos" className="btn btn-warning btn-lg">
        Ver pedidos entrantes
      </Link>
    </div>
  );
}
