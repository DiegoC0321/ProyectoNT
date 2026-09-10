'use client';

import { useEffect, useState, useCallback } from 'react';
import { orderService } from '@/services/orderService';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import PedidoCard from '@/components/PedidoCard';
import type { Pedido } from '@/models/types';

export default function MisPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const { usuario } = useAuth();
  const { mesa } = useCart();

  const esInvitado = usuario?.rol === 'INVITADO';

  const cargar = useCallback(() => {
    orderService
      .listar(esInvitado ? { mesaId: mesa?.id ?? undefined } : undefined)
      .then((res) => setPedidos(res.pedidos))
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, [esInvitado, mesa?.id]);

  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, 8000);
    return () => clearInterval(intervalo);
  }, [cargar]);

  async function handleRepetir(id: number) {
    setMensaje('');
    try {
      await orderService.repetir(id);
      setMensaje('¡Pedido repetido con éxito! Revisa tus pedidos activos.');
      cargar();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleCancelar(id: number) {
    try {
      await orderService.cancelar(id);
      cargar();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const activos = pedidos.filter((p) => p.estado !== 'ENTREGADO' && p.estado !== 'CANCELADO');
  const historial = pedidos.filter((p) => p.estado === 'ENTREGADO' || p.estado === 'CANCELADO');

  return (
    <div>
      <section className="rv-menu-cabecera" style={{ padding: '2.5rem 0' }}>
        <div className="container">
          <p className="rv-eyebrow rv-eyebrow-claro">I tuoi ordini</p>
          <h1 className="rv-menu-marca">Mis <span>Pedidos</span></h1>
          <p className="rv-menu-sub">stato del tuo ordine — segui la cucina</p>
        </div>
      </section>

      <div className="container py-4" style={{ maxWidth: 800 }}>
        {error && (
          <div className="rv-card-panel d-flex align-items-center gap-2 p-3 mb-4" style={{ background: 'var(--rv-crema)', borderLeft: '4px solid var(--rv-pomodoro)' }}>
            <i className="bi bi-exclamation-triangle" style={{ color: 'var(--rv-pomodoro)', fontSize: '1.3rem' }}></i>
            <span>{error}</span>
          </div>
        )}
        {mensaje && (
          <div className="rv-card-panel d-flex align-items-center gap-2 p-3 mb-4" style={{ background: 'var(--rv-crema)', borderLeft: '4px solid var(--rv-oliva)' }}>
            <i className="bi bi-check-circle" style={{ color: 'var(--rv-oliva)', fontSize: '1.3rem' }}></i>
            <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>{mensaje}</span>
          </div>
        )}

        {/* Seguimiento activo */}
        <div className="rv-listado-platos mb-5">
          <div className="rv-listado-cabecera">
            <p className="rv-eyebrow mb-1">Ordini attivi</p>
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
                  nessun ordine attivo — che cosa vuoi ordinare?
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

        {/* Historial */}
        <div className="rv-listado-platos">
          <div className="rv-listado-cabecera">
            <p className="rv-eyebrow mb-1">Storico</p>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '1.4rem' }}>
              Historial
            </h3>
          </div>
          <div className="rv-listado-cuerpo">
            {historial.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <span className="rv-mano rv-mano-oliva" style={{ fontSize: '1.3rem' }}>
                  aun no hay pedidos anteriores
                </span>
              </div>
            ) : (
              historial.map((p) => (
                <PedidoCard
                  key={p.id}
                  pedido={p}
                  acciones={
                    p.estado === 'ENTREGADO' && !esInvitado ? (
                      <button className="rv-btn rv-btn-pomodoro" style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleRepetir(p.id)}>
                        <i className="bi bi-arrow-repeat"></i> Repetir
                      </button>
                    ) : undefined
                  }
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
