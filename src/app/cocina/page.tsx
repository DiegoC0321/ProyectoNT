'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { orderService } from '@/services/orderService';
import type { Pedido } from '@/models/types';

export default function CocinaDashboardPage() {
  const { usuario } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    orderService
      .listar()
      .then((res) => setPedidos(res.pedidos))
      .finally(() => setCargando(false));

    const intervalo = setInterval(() => {
      orderService.listar().then((res) => setPedidos(res.pedidos)).catch(() => {});
    }, 6000);

    return () => clearInterval(intervalo);
  }, []);

  const pendientes = pedidos.filter((p) => p.estado === 'RECIBIDO');
  const enPreparacion = pedidos.filter((p) => p.estado === 'EN PREPARACION');
  const listos = pedidos.filter((p) => p.estado === 'LISTO');

  async function avanzarEstado(pedido: Pedido) {
    const siguiente = pedido.estado === 'RECIBIDO' ? 'EN PREPARACION' : 'LISTO';
    try {
      await orderService.cambiarEstado(pedido.id, siguiente);
      const res = await orderService.listar();
      setPedidos(res.pedidos);
    } catch {}
  }

  return (
    <div>
      <div className="rv-panel-cabecera">
        <div className="container">
          <p className="rv-eyebrow rv-eyebrow-dark">El sistema · cocina</p>
          <h1 className="rv-panel-nombre">
            <em>{usuario?.nombre ?? 'Cocina'}</em>
          </h1>
          <p className="rv-mano rv-mano-oliva" style={{ fontSize: '1.5rem', margin: '0.7rem 0 0' }}>
            hoy: pasta fresca, ragú lento y sin prisa
          </p>
        </div>
      </div>

      <div className="container pb-4">
        {/* Contadores */}
        <div className="rv-listado-platos mb-4" style={{ maxWidth: 600, margin: '1.5rem auto' }}>
          <div className="rv-listado-cabecera">
            <p className="rv-eyebrow mb-1">Cola de pedidos</p>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '1.3rem' }}>
              Cola de pedidos
            </h3>
          </div>
          <div className="rv-listado-cuerpo" style={{ textAlign: 'center', padding: '1.2rem' }}>
            <div className="d-flex justify-content-center gap-4">
              <div>
                <p className="rv-mano rv-mano-pomodoro" style={{ fontSize: '1rem', margin: '0 0 0.2rem' }}>Recibidos</p>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '2rem', margin: 0, color: 'var(--rv-pomodoro)' }}>
                  {cargando ? '—' : pendientes.length}
                </p>
              </div>
              <div style={{ width: 1, background: 'rgba(43, 28, 14, 0.2)' }}></div>
              <div>
                <p className="rv-mano rv-mano-oliva" style={{ fontSize: '1rem', margin: '0 0 0.2rem' }}>Preparando</p>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '2rem', margin: 0, color: 'var(--rv-oliva)' }}>
                  {cargando ? '—' : enPreparacion.length}
                </p>
              </div>
              <div style={{ width: 1, background: 'rgba(43, 28, 14, 0.2)' }}></div>
              <div>
                <p className="rv-mano rv-mano-ocre" style={{ fontSize: '1rem', margin: '0 0 0.2rem' }}>Listos</p>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '2rem', margin: 0, color: 'var(--rv-oro)' }}>
                  {cargando ? '—' : listos.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pedidos pendientes */}
        <div className="rv-mano rv-mano-pomodoro" style={{ fontSize: '1.5rem', textAlign: 'center', margin: '2rem 0 1rem', transform: 'rotate(-1.5deg)' }}>
          pedidos por preparar — hoy como cada día
        </div>

        {cargando ? (
          <div className="text-center py-4">
            <div className="spinner-border text-warning" role="status" />
          </div>
        ) : pedidos.length === 0 ? (
          <div className="rv-listado-platos" style={{ maxWidth: 420, margin: '0 auto' }}>
            <div className="rv-listado-cuerpo" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
              <span className="rv-mano rv-mano-oliva" style={{ fontSize: '1.5rem', display: 'block' }}>
                sin pedidos pendientes — la cocina descansa
              </span>
              <p className="small text-muted" style={{ fontFamily: 'var(--font-cuerpo)', marginTop: '0.5rem' }}>
                los clientes aún no han pedido — cuando llegan, todo está listo
              </p>
            </div>
          </div>
        ) : (
          <div className="row g-3">
            {pedidos.map((p) => (
              <div className="col-md-6 col-lg-4" key={p.id}>
                <div className="rv-card-panel shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>
                          Pedido #{p.id}
                        </strong>
                        {p.mesa_numero && (
                          <span className="rv-mano rv-mano-oliva" style={{ fontSize: '1rem', marginLeft: '0.5rem' }}>
                            Mesa {p.mesa_numero}
                          </span>
                        )}
                      </div>
                      <span
                        className="badge"
                        style={{
                          background: p.estado === 'RECIBIDO' ? 'var(--rv-pomodoro)' : p.estado === 'EN PREPARACION' ? 'var(--rv-oliva)' : 'var(--rv-oro)',
                          color: p.estado === 'LISTO' ? 'var(--rv-tinta)' : 'var(--rv-papel)',
                          fontFamily: 'var(--font-cuerpo)',
                          fontSize: '0.65rem',
                          letterSpacing: '0.15em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {p.estado}
                      </span>
                    </div>
                    <ul className="list-group list-group-flush mb-3" style={{ border: 'none' }}>
                      {p.detalles?.map((d) => (
                        <li key={d.id} className="list-group-item px-0" style={{ background: 'transparent', borderBottom: '1px dashed rgba(43, 28, 14, 0.2)' }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{d.cantidad}×</span>{' '}
                          <span style={{ fontFamily: 'var(--font-display)' }}>{d.platillo_nombre}</span>
                        </li>
                      ))}
                    </ul>
                    {p.observaciones && (
                      <div className="rv-card-panel p-2 mb-3" style={{ background: 'var(--rv-papel-2)', borderLeft: '3px solid var(--rv-oro)' }}>
                        <p className="small mb-0" style={{ fontFamily: 'var(--font-mano)', color: 'var(--rv-tinta-2)' }}>
                          <i className="bi bi-exclamation-triangle" style={{ color: 'var(--rv-oro)' }}></i> {p.observaciones}
                        </p>
                      </div>
                    )}
                    <button
                      className="rv-btn rv-btn-pomodoro w-100"
                      style={{ justifyContent: 'center' }}
                      onClick={() => avanzarEstado(p)}
                    >
                      {p.estado === 'RECIBIDO' ? 'Iniciar preparación' : 'Marcar como listo'}
                      <i className="bi bi-arrow-right"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-4">
          <p className="rv-mano rv-mano-oliva" style={{ fontSize: '1.25rem', transform: 'rotate(-1deg)' }}>
            la casa se come hoy — y mañana se come otra vez
          </p>
        </div>
      </div>
    </div>
  );
}
