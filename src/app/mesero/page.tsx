'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { tableService } from '@/services/otherServices';
import { orderService } from '@/services/orderService';

export default function MeseroDashboardPage() {
  const { usuario } = useAuth();
  const [mesasOcupadas, setMesasOcupadas] = useState(0);
  const [pedidosPendientes, setPedidosPendientes] = useState(0);

  useEffect(() => {
    tableService.listar().then((res) => setMesasOcupadas(res.mesas.filter((m) => m.estado !== 'LIBRE').length));
    orderService.listar().then((res) => setPedidosPendientes(res.pedidos.filter((p) => p.estado === 'LISTO').length));
  }, []);

  return (
    <div className="container py-5">
      <h1 className="mb-1">Hola, {usuario?.nombre} 👋</h1>
      <p className="text-muted mb-4">Panel operativo del mesero</p>

      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div className="card shadow-sm p-4 text-center">
            <i className="bi bi-grid-3x3-gap fs-1 text-warning"></i>
            <h2>{mesasOcupadas}</h2>
            <p className="text-muted mb-0">Mesas ocupadas o con pedido en curso</p>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm p-4 text-center">
            <i className="bi bi-bell fs-1 text-success"></i>
            <h2>{pedidosPendientes}</h2>
            <p className="text-muted mb-0">Pedidos listos para entregar</p>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-md-4">
          <Link href="/mesero/mesas" className="text-decoration-none">
            <div className="card h-100 shadow-sm text-center p-4">
              <i className="bi bi-grid fs-1 text-warning mb-2"></i>
              <h5>Ver mesas</h5>
            </div>
          </Link>
        </div>
        <div className="col-md-4">
          <Link href="/mesero/registrar-pedido" className="text-decoration-none">
            <div className="card h-100 shadow-sm text-center p-4">
              <i className="bi bi-pencil-square fs-1 text-warning mb-2"></i>
              <h5>Registrar pedido</h5>
            </div>
          </Link>
        </div>
        <div className="col-md-4">
          <Link href="/mesero/pedidos" className="text-decoration-none">
            <div className="card h-100 shadow-sm text-center p-4">
              <i className="bi bi-receipt fs-1 text-warning mb-2"></i>
              <h5>Pedidos</h5>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
