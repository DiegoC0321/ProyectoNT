'use client';

import { useEffect, useState, useCallback } from 'react';
import { orderService } from '@/services/orderService';
import { useAuth } from '@/context/AuthContext';
import PedidoCard from '@/components/PedidoCard';
import type { Pedido } from '@/models/types';

export default function MisPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const { usuario } = useAuth();
  const esClienteRegistrado = usuario?.rol === 'CLIENTE';

  const cargar = useCallback(() => {
    if (esClienteRegistrado) {
      orderService
        .listar()
        .then((res) => setPedidos(res.pedidos))
        .catch((err) => setError(err.message))
        .finally(() => setCargando(false));
    } else {
      setCargando(false);
    }
  }, [esClienteRegistrado]);

  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, 8000);
    return () => clearInterval(intervalo);
  }, [cargar]);

  async function handleCancelar(id: number) {
    try {
      await orderService.cancelar(id);
      cargar();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const activos = pedidos.filter((p) => p.estado !== 'ENTREGADO' && p.estado !== 'CANCELADO');

  return (
    <div>
      <section className="rv-menu-cabecera" style={{ padding: '2.5rem 0' }}>
        <div className="container">
          <p className="rv-eyebrow rv-eyebrow-claro">Mis pedidos</p>
          <h1 className="rv-menu-marca">Mis <span>Pedidos</span></h1>
          <p className="rv-menu-sub">el estado de tu pedido — sigue a la cocina</p>
        </div>
      </section>

      <div className="container py-4" style={{ maxWidth: 800 }}>
        {error && (
          <div className="rv-card-panel d-flex align-items-center gap-2 p-3 mb-4" style={{ background: 'var(--rv-crema)', borderLeft: '4px solid var(--rv-pomodoro)' }}>
            <i className="bi bi-exclamation-triangle" style={{ color: 'var(--rv-pomodoro)', fontSize: '1.3rem' }}></i>
            <span>{error}</span>
          </div>
        )}

        {!esClienteRegistrado ? (
          <div className="rv-card-panel text-center p-4 mb-5" style={{ maxWidth: 480, margin: '0 auto' }}>
            <i className="bi bi-qr-code-scan" style={{ fontSize: '2.2rem', color: 'var(--rv-oro)' }}></i>
            <h3 style={{ fontFamily: 'var(--font-display)', marginTop: '0.75rem' }}>
              Pide desde tu mesa
            </h3>
            <p className="rv-mano rv-mano-oliva" style={{ fontSize: '1.15rem', margin: '0.5rem 0 0' }}>
              escanea el código QR de tu mesa para ordenar y seguir tu pedido
            </p>
          </div>
        ) : (
          <div className="rv-listado-platos mb-5">
            <div className="rv-listado-cabecera">
              <p className="rv-eyebrow mb-1">Pedidos activos</p>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '1.4rem' }}>
                Seguimiento activo
              </h3>
            </div>
            <div className="rv-listado-cuerpo">
              {cargando ? (
                <div className="text-center py-3">
                  <div className="spinner-border text-warning" role="status" />
                </div>
              ) : activos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                  <span className="rv-mano rv-mano-oliva" style={{ fontSize: '1.3rem' }}>
                    sin pedidos activos — ¿qué quieres pedir?
                  </span>
                </div>
              ) : (
                activos.map((p) => (
                  <PedidoCard
                    key={p.id}
                    pedido={p}
                    acciones={
                      !p.confirmado ? (
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleCancelar(p.id)}>
                          Cancelar
                        </button>
                      ) : undefined
                    }
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}