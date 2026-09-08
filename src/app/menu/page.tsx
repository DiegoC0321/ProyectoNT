'use client';

import { useEffect, useState } from 'react';
import { menuService } from '@/services/menuService';
import PlatilloCard from '@/components/PlatilloCard';
import type { Platillo, Categoria } from '@/models/types';

export default function MenuPublicoPage() {
  const [platillos, setPlatillos] = useState<Platillo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([menuService.listar(true), menuService.listarCategorias()])
      .then(([m, c]) => {
        setPlatillos(m.platillos);
        setCategorias(c.categorias);
      })
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="container py-5">
      <h1 className="mb-4">Nuestro Menú</h1>
      {error && <div className="alert alert-danger">{error}</div>}
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
                    <PlatilloCard platillo={p} />
                  </div>
                ))}
              </div>
            </section>
          ))
      )}
      <div className="alert alert-info mt-4">
        <i className="bi bi-info-circle"></i> Inicia sesión o crea una cuenta para poder realizar tu pedido.
      </div>
    </div>
  );
}
