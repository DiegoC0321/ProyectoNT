import EstadoBadge from '@/components/EstadoBadge';
import { formatearMoneda, formatearFechaHora } from '@/utils/format';
import type { Pedido } from '@/models/types';
import { ReactNode } from 'react';

interface Props {
  pedido: Pedido;
  acciones?: ReactNode;
}

export default function PedidoCard({ pedido, acciones }: Props) {
  return (
    <div className="card shadow-sm mb-3">
      <div className="card-header d-flex justify-content-between align-items-center bg-white">
        <div>
          <strong>Pedido #{pedido.id}</strong>{' '}
          {pedido.mesa_numero && <span className="text-muted">· Mesa {pedido.mesa_numero}</span>}
          <div className="small text-muted">{formatearFechaHora(pedido.created_at)}</div>
        </div>
        <EstadoBadge estado={pedido.estado} />
      </div>
      <div className="card-body">
        <ul className="list-group list-group-flush mb-3">
          {pedido.detalles?.map((d) => (
            <li key={d.id} className="list-group-item d-flex justify-content-between px-0">
              <span>
                {d.cantidad} × {d.platillo_nombre}
              </span>
              <span>{formatearMoneda(d.subtotal)}</span>
            </li>
          ))}
        </ul>
        {pedido.observaciones && (
          <p className="text-muted small mb-2">
            <i className="bi bi-chat-left-text"></i> {pedido.observaciones}
          </p>
        )}
        <div className="d-flex justify-content-between align-items-center">
          <span className="fw-bold fs-5">Total: {formatearMoneda(pedido.total)}</span>
          {!pedido.confirmado && <span className="badge text-bg-info">Borrador (sin enviar a cocina)</span>}
        </div>
        {acciones && <div className="mt-3 d-flex gap-2 flex-wrap">{acciones}</div>}
      </div>
    </div>
  );
}
