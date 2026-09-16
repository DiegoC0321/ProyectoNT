'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { orderService } from '@/services/orderService';
import { authService } from '@/services/authService';
import { marcarPedidoFinalizado } from '@/lib/flujoCliente';
import { formatearMoneda } from '@/utils/format';

export default function CarritoPage() {
  const { items, cambiarCantidad, quitar, vaciar, total, mesa } = useCart();
  const { usuario } = useAuth();
  // Identidad del cliente: solo una cuenta CLIENTE registrada cuenta como
  // sesión; las del personal (mesero/cocina/admin) pertenecen a OTRO proceso
  // y no deben contaminar el pedido del comensal en este navegador.
  const esClienteRegistrado = usuario?.rol === 'CLIENTE';
  const sinMesa = !esClienteRegistrado && !mesa;
  const [observaciones, setObservaciones] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleConfirmar() {
    setError('');
    setEnviando(true);
    try {
      // Visitante (con o sin cuenta de personal abierta): se obtiene un token
      // de invitado en memoria, se usa SOLO para crear este pedido y se
      // descarta. La cookie de la cuenta (si existe) queda intacta.
      let tokenInvitado: string | undefined;
      if (!esClienteRegistrado) {
        const sesion = await authService.sesionInvitado();
        tokenInvitado = sesion.token;
      }
      const { pedido } = await orderService.crearComoCliente(
        items.map((i) => ({ platillo_id: i.platillo.id, cantidad: i.cantidad })),
        observaciones || undefined,
        mesa?.id,
        tokenInvitado
      );
      const numeroMesa = mesa?.numero ?? null;
      vaciar();
      if (esClienteRegistrado) {
        // Cliente registrado: conserva su sesión y sigue sus pedidos.
        router.push(`/cliente/pedidos?nuevo=${pedido.id}`);
      } else {
        // Apenas se hace el pedido, el flujo del cliente queda bloqueado en la
        // confirmación sin dejar rastro de sesión.
        marcarPedidoFinalizado();
        router.push(`/cliente/confirmacion?pedido=${pedido.id}&mesa=${numeroMesa ?? ''}`);
      }
    } catch (err) {
      setError((err as Error).message);
      setEnviando(false);
    }
  }

  if (items.length === 0) {
    return (
      <div>
        <section className="rv-menu-cabecera" style={{ padding: '2.5rem 0' }}>
          <div className="container">
            <p className="rv-eyebrow rv-eyebrow-claro">Il carrello</p>
            <h1 className="rv-menu-marca">La <span>Cuenta</span></h1>
          </div>
        </section>
        <div className="container py-5 text-center">
          <div className="rv-listado-platos" style={{ maxWidth: 420, margin: '0 auto' }}>
            <div className="rv-listado-cuerpo" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
              <i className="bi bi-cart-x" style={{ fontSize: '2.5rem', color: 'var(--rv-tinta-2)', opacity: 0.5 }}></i>
              <h3 style={{ fontFamily: 'var(--font-display)', marginTop: '1rem' }}>El carrito está vacío</h3>
              <p className="rv-mano rv-mano-oliva" style={{ fontSize: '1.3rem', margin: '0.6rem 0 1.4rem' }}>
                aún no has pedido nada — ¿qué quieres para hoy?
              </p>
              <Link href="/cliente/menu" className="rv-btn rv-btn-pomodoro">
                <i className="bi bi-book"></i> Ver la carta
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="rv-menu-cabecera" style={{ padding: '2.5rem 0' }}>
        <div className="container">
          <p className="rv-eyebrow rv-eyebrow-claro">El carrito</p>
          <h1 className="rv-menu-marca">La <span>Cuenta</span></h1>
          <p className="rv-menu-sub">tu pedido — listo para la cocina</p>
        </div>
      </section>

      <div className="container py-4" style={{ maxWidth: 700 }}>
        {error && (
          <div className="alert alert-danger rv-card-panel">
            <i className="bi bi-exclamation-triangle"></i> {error}
          </div>
        )}

        {mesa && (
          <div className="rv-card-panel d-flex align-items-center gap-2 p-3 mb-4" style={{ background: 'var(--rv-crema)', borderLeft: '4px solid var(--rv-oliva)' }}>
            <i className="bi bi-qr-code" style={{ color: 'var(--rv-oliva)', fontSize: '1.3rem' }}></i>
            <span>Tu pedido se enviará a la <strong>mesa {mesa.numero}</strong>.</span>
          </div>
        )}

        {sinMesa && (
          <div className="rv-card-panel d-flex align-items-center gap-2 p-3 mb-4" style={{ background: 'var(--rv-papel-2)', borderLeft: '4px solid var(--rv-oro)' }}>
            <i className="bi bi-qr-code-scan" style={{ color: 'var(--rv-oro)', fontSize: '1.3rem' }}></i>
            <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
              Escanea el código QR de tu mesa antes de confirmar.
            </span>
          </div>
        )}

        {/* Tabla de items */}
        <div className="rv-listado-platos mb-4">
          <div className="rv-listado-cabecera">
            <p className="rv-eyebrow mb-1">Ordine</p>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '1.4rem' }}>
              Detalle del pedido
            </h3>
          </div>
          <div className="rv-listado-cuerpo">
            <table className="table align-middle mb-0" style={{ marginBottom: 0 }}>
              <thead>
                <tr>
                  <th style={{ fontFamily: 'var(--font-cuerpo)', fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--rv-pomodoro)', border: 'none' }}>
                    Producto
                  </th>
                  <th className="text-center" style={{ fontFamily: 'var(--font-cuerpo)', fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--rv-pomodoro)', border: 'none' }}>
                    Cantidad
                  </th>
                  <th className="text-end" style={{ fontFamily: 'var(--font-cuerpo)', fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--rv-pomodoro)', border: 'none' }}>
                    Subtotal
                  </th>
                  <th style={{ border: 'none' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.platillo.id} style={{ borderBottom: '1px dashed rgba(43, 28, 14, 0.25)' }}>
                    <td>
                      <span className="rv-lista-nombre">{i.platillo.nombre}</span>
                      <span className="rv-lista-italiano" style={{ display: 'block' }}>
                        {formatearMoneda(i.platillo.precio)} c/u
                      </span>
                    </td>
                    <td style={{ maxWidth: 110 }} className="text-center">
                      <input
                        type="number"
                        min={1}
                        className="form-control form-control-sm text-center"
                        value={i.cantidad}
                        onChange={(e) => cambiarCantidad(i.platillo.id, Number(e.target.value))}
                        style={{ background: 'var(--rv-crema)', borderColor: 'rgba(43, 28, 14, 0.35)' }}
                      />
                    </td>
                    <td className="text-end">
                      <span className="rv-lista-precio">{formatearMoneda(i.platillo.precio * i.cantidad)}</span>
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm"
                        onClick={() => quitar(i.platillo.id)}
                        style={{ color: 'var(--rv-pomodoro)', border: '1px solid rgba(184, 58, 38, 0.4)' }}
                        title="Quitar"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Observaciones */}
        <div className="mb-4">
          <label className="form-label" style={{ fontFamily: 'var(--font-cuerpo)', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--rv-tinta-2)' }}>
            Observaciones (opcional)
          </label>
          <textarea
            className="form-control"
            rows={2}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ej: sin cebolla, término de la carne, alergias..."
            style={{ background: 'var(--rv-crema)', borderColor: 'rgba(43, 28, 14, 0.35)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
          />
        </div>

        {/* Total y acciones */}
        <div className="rv-listado-platos">
          <div className="rv-listado-cuerpo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p className="rv-mano rv-mano-oliva" style={{ fontSize: '1.1rem', margin: 0 }}>Total</p>
              <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, margin: 0, fontSize: '1.8rem' }}>
                {formatearMoneda(total)}
              </h4>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <Link href="/cliente/menu" className="rv-btn rv-btn-linea" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                <i className="bi bi-arrow-left"></i> Seguir pidiendo
              </Link>
              <button
                className="rv-btn rv-btn-pomodoro"
                style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}
                onClick={handleConfirmar}
                disabled={enviando || sinMesa}
              >
                {enviando ? 'Enviando...' : 'Confirmar y enviar'}
                {!enviando && <i className="bi bi-send"></i>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
