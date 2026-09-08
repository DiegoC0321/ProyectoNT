'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { menuService } from '@/services/menuService';
import { useCart } from '@/context/CartContext';
import PlatilloCard from '@/components/PlatilloCard';
import type { Platillo, Categoria } from '@/models/types';

export default function ClienteMenuPage() {
  const [platillos, setPlatillos] = useState<Platillo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const { agregar, cantidadTotal } = useCart();

  useEffect(() => {
    Promise.all([menuService.listar(true), menuService.listarCategorias()])
      .then(([m, c]) => {
        setPlatillos(m.platillos);
        setCategorias(c.categorias);
      })
      .finally(() => setCargando(false));
  }, []);

  function handleAgregar(platillo: Platillo) {
    agregar(platillo, 1);
    setMensaje(`"${platillo.nombre}" agregado al carrito.`);
    setTimeout(() => setMensaje(''), 2000);
  }

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">Menú</h1>
        <Link href="/cliente/carrito" className="btn btn-warning position-relative">
          <i className="bi bi-cart"></i> Carrito
          {cantidadTotal > 0 && (
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              {cantidadTotal}
            </span>
          )}
        </Link>
      </div>

      {mensaje && <div className="alert alert-success py-2">{mensaje}</div>}

      {cargando ? (
        <p className="text-muted">Cargando menú...</p>
      ) : (
        categorias
          .map((cat) => ({ cat, items: platillos.filter((p) => p.categoria_id === cat.id) }))
          .filter((g) => g.items.length > 0)
          .map(({ cat, items }) => (
            <section key={cat.id} className="mb-5">
              <h3 className="border-bottom pb-2 mb-3">{cat.nombre}</h3>
              <div className="row g-4">
                {items.map((p) => (
                  <div className="col-sm-6 col-lg-4" key={p.id}>
                    <PlatilloCard platillo={p} onAgregar={handleAgregar} />
                  </div>
                ))}
              </div>
            </section>
          ))
      )}
    </div>
  );
}
