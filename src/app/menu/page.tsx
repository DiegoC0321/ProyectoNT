'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { menuService } from '@/services/menuService';
import { api } from '@/services/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import PlatilloCard from '@/components/PlatilloCard';
import type { Platillo, Categoria, Mesa } from '@/models/types';

export default function MenuPublicoPage() {
  return (
    <Suspense fallback={<p className="text-muted text-center py-5">Cargando menú...</p>}>
      <MenuPublicoContent />
    </Suspense>
  );
}

function MenuPublicoContent() {
  const [platillos, setPlatillos] = useState<Platillo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mesa, setMesa] = useState<Mesa | null>(null);
  const [mesaError, setMesaError] = useState('');
  const { setMesa: guardarMesa } = useCart();
  const { usuario, cargando: cargandoAuth, crearSesionInvitado } = useAuth();
  const searchParams = useSearchParams();

  const numeroMesa = Number(searchParams.get('mesa'));

  useEffect(() => {
    if (!searchParams.has('mesa') || cargandoAuth) return;
    if (!usuario) {
      // Sin contraseña: se crea una sesión anónima para que pueda pedir.
      crearSesionInvitado().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, cargandoAuth, usuario]);

  useEffect(() => {
    Promise.all([menuService.listar(true), menuService.listarCategorias()])
      .then(([m, c]) => {
        setPlatillos(m.platillos);
        setCategorias(c.categorias);
      })
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (!searchParams.has('mesa')) return;
    if (!Number.isInteger(numeroMesa) || numeroMesa <= 0) {
      setMesaError('Código QR/NFC inválido: mesa no reconocida.');
      return;
    }
    api
      .get<{ mesa: Mesa }>(`/tables/by-number/${numeroMesa}`)
      .then(({ mesa }) => {
        setMesa(mesa);
        guardarMesa({ id: mesa.id, numero: mesa.numero });
      })
      .catch((err) => setMesaError((err as Error).message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="container py-5">
      <h1 className="mb-4">Nuestro Menú</h1>

      {mesa && (
        <div className="alert alert-success d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span>
            <i className="bi bi-qr-code"></i> Estás en la <strong>mesa {mesa.numero}</strong> (capacidad {mesa.capacidad}).
          </span>
          <Link href={`/cliente/menu?mesa=${mesa.numero}`} className="btn btn-warning btn-sm">
            <i className="bi bi-cart-plus"></i> Ver menú y hacer pedido
          </Link>
        </div>
      )}

      {mesaError && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle"></i> {mesaError}
        </div>
      )}

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

      {!mesa && !mesaError && (
        <div className="alert alert-info mt-4">
          <i className="bi bi-info-circle"></i> Escanea el código QR de tu mesa para pedir directamente, sin necesidad de
          crear una cuenta.
        </div>
      )}
    </div>
  );
}