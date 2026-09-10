'use client';

import { useEffect, useState, useCallback } from 'react';
import { orderService } from '@/services/orderService';
import EstadoBadge from '@/components/EstadoBadge';
import { formatearFechaHora } from '@/utils/format';
import type { Pedido } from '@/models/types';

export default function PedidosCocinaPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(() => {
    orderService
      .listar()
      .then((res) => setPedidos(res.pedidos)) // el backend ya filtra RECIBIDO/EN PREPARACION para rol COCINA
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, 6000); // RF16: los pedidos entrantes se actualizan en vivo
    return () => clearInterval(intervalo);
  }, [cargar]);

  async function avanzarEstado(pedido: Pedido) {
    const siguiente = pedido.estado === 'RECIBIDO' ? 'EN PREPARACION' : 'LISTO';
    try {
      await orderService.cambiarEstado(pedido.id, siguiente);
      cargar();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div>
      <div className="rv-panel-cabecera">
        <div className="container">
          <p className="rv-eyebrow rv-eyebrow-dark">Il sistema · cucina</p>
          <h1 className="rv-panel-nombre">Pedidos <em>entrantes</em></h1>
          <p className="rv-mano rv-mano-oliva" style={{ fontSize: '1.3rem', margin: '0.5rem 0 0' }}>ogni ordine è pronto — serve senza fretta</p>
        </div>
      </div>
      <div className="container pb-4 pt-3">
      <h2 className="mb-4" style={{ fontFamily: 'var(--font-display)' }}>Pedidos entrantes</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      {cargando ? (
        <p className="text-muted">Cargando pedidos...</p>
      ) : pedidos.length === 0 ? (
        <p className="text-muted">No hay pedidos pendientes por preparar. 🎉</p>
      ) : (
        <div className="row g-3">
          {pedidos.map((p) => (
            <div className="col-md-6 col-lg-4" key={p.id}>
              <div className="card shadow-sm h-100">
                <div className="card-header d-flex justify-content-between bg-white">
                  <strong>
                    Pedido #{p.id} {p.mesa_numero ? `· Mesa ${p.mesa_numero}` : ''}
                  </strong>
                  <EstadoBadge estado={p.estado} />
                </div>
                <div className="card-body">
                  <p className="small text-muted mb-2">{formatearFechaHora(p.created_at)}</p>
                  <ul className="list-group list-group-flush mb-3">
                    {p.detalles?.map((d) => (
                      <li key={d.id} className="list-group-item px-0">
                        <strong>{d.cantidad}×</strong> {d.platillo_nombre}
                      </li>
                    ))}
                  </ul>
                  {p.observaciones && (
                    <p className="alert alert-warning py-2 small mb-3">
                      <i className="bi bi-exclamation-triangle"></i> {p.observaciones}
                    </p>
                  )}
                  <button className="btn btn-warning w-100" onClick={() => avanzarEstado(p)}>
                    {p.estado === 'RECIBIDO' ? 'Iniciar preparación' : 'Marcar como listo'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
