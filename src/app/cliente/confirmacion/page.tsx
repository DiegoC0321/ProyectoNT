'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/services/api';
import { formatearMoneda } from '@/utils/format';
import { marcarPedidoFinalizado } from '@/lib/flujoCliente';
import type { Pedido } from '@/models/types';

export default function ConfirmacionPage() {
  return (
    <Suspense fallback={<p className="text-muted text-center py-5">Cargando confirmación...</p>}>
      <ConfirmacionContent />
    </Suspense>
  );
}

/**
 * Pantalla terminal del flujo de cliente: una vez confirmado el pedido, la
 * sesión de invitado se cerró y aquí finaliza la experiencia del cliente.
 * No ofrece ninguna navegación hacia el resto de la app.
 */
function ConfirmacionContent() {
  const searchParams = useSearchParams();
  const pedidoId = searchParams.get('pedido');
  const mesaNumero = searchParams.get('mesa');

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const bloqueadoRef = useRef(false);

  useEffect(() => {
    if (!pedidoId) {
      setCargando(false);
      return;
    }
    api
      .get<{ pedido: Pedido }>(`/orders/${pedidoId}/public?mesa=${mesaNumero ?? ''}`)
      .then((res) => {
        setPedido(res.pedido);
        if (!bloqueadoRef.current) {
          bloqueadoRef.current = true;
          marcarPedidoFinalizado();
        }
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setCargando(false));
  }, [pedidoId, mesaNumero]);

  return (
    <div>
      <section className="rv-menu-cabecera" style={{ padding: '2.5rem 0' }}>
        <div className="container">
          <p className="rv-eyebrow rv-eyebrow-claro">Ordine inviato</p>
          <h1 className="rv-menu-marca">
            Grazie! <span>Pedido</span> recibido
          </h1>
          <p className="rv-menu-sub">il tuo ordine sta arrivando in cucina</p>
        </div>
      </section>

      <div className="container py-4" style={{ maxWidth: 680 }}>
        {cargando ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status" />
            <p className="rv-mano rv-mano-oliva mt-3" style={{ fontSize: '1.3rem' }}>
              preparando il conto...
            </p>
          </div>
        ) : error ? (
          <div className="rv-card-panel d-flex align-items-center gap-2 p-3 mb-4" style={{ background: 'var(--rv-crema)', borderLeft: '4px solid var(--rv-pomodoro)' }}>
            <i className="bi bi-exclamation-triangle" style={{ color: 'var(--rv-pomodoro)', fontSize: '1.3rem' }}></i>
            <span>{error}</span>
          </div>
        ) : !pedido ? (
          <div className="rv-listado-platos" style={{ maxWidth: 480, margin: '0 auto' }}>
            <div className="rv-listado-cuerpo" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
              <i className="bi bi-receipt" style={{ fontSize: '2.5rem', color: 'var(--rv-tinta-2)', opacity: 0.5 }}></i>
              <h3 style={{ fontFamily: 'var(--font-display)', marginTop: '1rem' }}>Grazie</h3>
              <p className="rv-mano rv-mano-oliva" style={{ fontSize: '1.2rem', margin: '0.6rem 0 0' }}>
                tu pedido ya está en camino. Para cualquier cosa, pide ayuda al personal.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="rv-card-panel d-flex align-items-center gap-2 p-3 mb-4" style={{ background: 'var(--rv-crema)', borderLeft: '4px solid var(--rv-oliva)' }}>
              <i className="bi bi-check-circle" style={{ color: 'var(--rv-oliva)', fontSize: '1.5rem' }}></i>
              <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
                Pedido <strong>#{pedido.id}</strong>
                {mesaNumero ? <> — mesa {mesaNumero}</> : ''}. Un camarero lo revisa y lo confirma en cocina.
              </span>
            </div>

            <div className="rv-listado-platos mb-4">
              <div className="rv-listado-cabecera">
                <p className="rv-eyebrow mb-1">Il conto</p>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '1.4rem' }}>
                  Tu pedido
                </h3>
              </div>
              <div className="rv-listado-cuerpo">
                <ul className="rv-lista">
                  {(pedido.detalles ?? []).map((d) => (
                    <li key={d.id}>
                      <div>
                        <span className="rv-lista-nombre">
                          {d.cantidad} × {d.platillo_nombre}
                        </span>
                      </div>
                      <div className="d-flex align-items-center">
                        <span className="rv-lista-precio">{formatearMoneda(d.subtotal)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
                <hr style={{ borderStyle: 'dashed', color: 'rgba(43, 28, 14, 0.35)', margin: '1rem 0' }} />
                <div className="d-flex justify-content-between align-items-center">
                  <span className="rv-mano rv-mano-oliva" style={{ fontSize: '1.1rem', margin: 0 }}>
                    Totale
                  </span>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, margin: 0, fontSize: '1.6rem' }}>
                    {formatearMoneda(pedido.total)}
                  </h4>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="rv-mano rv-mano-oliva" style={{ fontSize: '1.2rem', margin: '0.6rem 0 2rem' }}>
                la tua esperienza termina qui — grazie e buon appetito
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}