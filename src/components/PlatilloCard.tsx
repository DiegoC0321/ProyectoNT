'use client';

import { formatearMoneda } from '@/utils/format';
import type { Platillo } from '@/models/types';

interface Props {
  platillo: Platillo;
  onAgregar?: (platillo: Platillo) => void;
}

export default function PlatilloCard({ platillo, onAgregar }: Props) {
  return (
    <div className="card h-100 shadow-sm">
      <div
        className="card-img-top bg-light d-flex align-items-center justify-content-center"
        style={{ height: 160, fontSize: '2.5rem' }}
      >
        {platillo.imagen_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={platillo.imagen_url}
            alt={platillo.nombre}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <span>🍽️</span>
        )}
      </div>
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start">
          <h5 className="card-title mb-1">{platillo.nombre}</h5>
          {!platillo.disponible && <span className="badge text-bg-secondary">Agotado</span>}
        </div>
        {platillo.categoria_nombre && <p className="text-muted small mb-1">{platillo.categoria_nombre}</p>}
        <p className="card-text flex-grow-1">{platillo.descripcion}</p>
        <div className="d-flex justify-content-between align-items-center mt-2">
          <span className="fw-bold fs-5">{formatearMoneda(platillo.precio)}</span>
          {onAgregar && (
            <button className="btn btn-warning btn-sm" disabled={!platillo.disponible} onClick={() => onAgregar(platillo)}>
              <i className="bi bi-cart-plus"></i> Agregar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
