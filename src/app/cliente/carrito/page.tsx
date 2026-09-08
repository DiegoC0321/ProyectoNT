'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { orderService } from '@/services/orderService';
import { formatearMoneda } from '@/utils/format';

export default function CarritoPage() {
  const { items, cambiarCantidad, quitar, vaciar, total, mesa } = useCart();
  const [observaciones, setObservaciones] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleConfirmar() {
    setError('');
    setEnviando(true);
    try {
      const { pedido } = await orderService.crearComoCliente(
        items.map((i) => ({ platillo_id: i.platillo.id, cantidad: i.cantidad })),
        observaciones || undefined,
        mesa?.id
      );
      vaciar();
      router.push(`/cliente/pedidos?nuevo=${pedido.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-cart-x fs-1 text-muted"></i>
        <h3 className="mt-3">Tu carrito está vacío</h3>
        <Link href="/cliente/menu" className="btn btn-warning mt-3">
          Ver menú
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-5" style={{ maxWidth: 700 }}>
      <h1 className="mb-4">Resumen de tu pedido</h1>
      {error && <div className="alert alert-danger">{error}</div>}

      {mesa && (
        <div className="alert alert-success py-2">
          <i className="bi bi-qr-code"></i> Tu pedido se enviará a la <strong>mesa {mesa.numero}</strong>.
        </div>
      )}

      <table className="table align-middle">
        <thead>
          <tr>
            <th>Producto</th>
            <th className="text-center">Cantidad</th>
            <th className="text-end">Precio unitario</th>
            <th className="text-end">Subtotal</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.platillo.id}>
              <td>{i.platillo.nombre}</td>
              <td style={{ maxWidth: 110 }}>
                <input
                  type="number"
                  min={1}
                  className="form-control form-control-sm text-center"
                  value={i.cantidad}
                  onChange={(e) => cambiarCantidad(i.platillo.id, Number(e.target.value))}
                />
              </td>
              <td className="text-end">{formatearMoneda(i.platillo.precio)}</td>
              <td className="text-end">{formatearMoneda(i.platillo.precio * i.cantidad)}</td>
              <td className="text-end">
                <button className="btn btn-sm btn-outline-danger" onClick={() => quitar(i.platillo.id)}>
                  <i className="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mb-3">
        <label className="form-label">Observaciones (opcional)</label>
        <textarea
          className="form-control"
          rows={2}
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Ej: sin cebolla, término de la carne, alergias..."
        />
      </div>

      <div className="d-flex justify-content-between align-items-center border-top pt-3">
        <h4 className="mb-0">Total: {formatearMoneda(total)}</h4>
        <div className="d-flex gap-2">
          <Link href="/cliente/menu" className="btn btn-outline-secondary">
            Seguir pidiendo
          </Link>
          <button className="btn btn-warning" onClick={handleConfirmar} disabled={enviando}>
            {enviando ? 'Enviando...' : 'Confirmar y enviar pedido'}
          </button>
        </div>
      </div>
    </div>
  );
}
