'use client';

import { useEffect, useState } from 'react';
import { recommendationService } from '@/services/otherServices';
import { useCart } from '@/context/CartContext';
import PlatilloCard from '@/components/PlatilloCard';
import type { Platillo } from '@/models/types';

export default function RecomendacionesPage() {
  const [platillos, setPlatillos] = useState<Platillo[]>([]);
  const [cargando, setCargando] = useState(true);
  const { agregar } = useCart();
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    recommendationService
      .obtener(6)
      .then((res) => setPlatillos(res.recomendaciones))
      .finally(() => setCargando(false));
  }, []);

  function handleAgregar(p: Platillo) {
    agregar(p, 1);
    setMensaje(`"${p.nombre}" agregado al carrito.`);
    setTimeout(() => setMensaje(''), 2000);
  }

  return (
    <div className="container py-5">
      <h1 className="mb-1">
        <i className="bi bi-stars text-warning"></i> Recomendado para ti
      </h1>
      <p className="text-muted mb-4">
        Sugerencias basadas en tus preferencias y en lo que más has pedido.
      </p>
      {mensaje && <div className="alert alert-success py-2">{mensaje}</div>}

      {cargando ? (
        <p className="text-muted">Buscando las mejores recomendaciones...</p>
      ) : platillos.length === 0 ? (
        <p className="text-muted">Aún no tenemos suficientes datos para recomendarte algo. ¡Haz tu primer pedido!</p>
      ) : (
        <div className="row g-4">
          {platillos.map((p) => (
            <div className="col-sm-6 col-lg-4" key={p.id}>
              <PlatilloCard platillo={p} onAgregar={handleAgregar} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
