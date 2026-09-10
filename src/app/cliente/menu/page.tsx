'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { menuService } from '@/services/menuService';
import { api } from '@/services/api';
import { useCart } from '@/context/CartContext';
import { CURSOS } from '@/data/carta';
import type { Platillo, Categoria, Mesa } from '@/models/types';

export default function ClienteMenuPage() {
  return (
    <Suspense fallback={<p className="text-muted text-center py-5">Cargando menú...</p>}>
      <ClienteMenuContent />
    </Suspense>
  );
}

function ClienteMenuContent() {
  const [platillos, setPlatillos] = useState<Platillo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [mesa, setMesaInfo] = useState<Mesa | null>(null);
  const { agregar, cantidadTotal, setMesa } = useCart();
  const searchParams = useSearchParams();

  const numeroMesa = Number(searchParams.get('mesa') ?? '0');

  useEffect(() => {
    if (!validMesaId(numeroMesa)) return;
    api
      .get<{ mesa: Mesa }>(`/tables/by-number/${numeroMesa}`)
      .then(({ mesa }) => {
        setMesaInfo(mesa);
        setMesa({ id: mesa.id, numero: mesa.numero });
      })
      .catch(() => {
        setMesa(null);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numeroMesa]);

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
    <div>
      {/* Cabecera */}
      <section className="rv-menu-cabecera" style={{ padding: '3rem 0' }}>
        <div className="container">
          <p className="rv-eyebrow rv-eyebrow-claro">Il menù</p>
          <h1 className="rv-menu-marca">La <span>Carta</span></h1>
          <p className="rv-menu-sub">il menù del giorno — fatto in casa</p>
        </div>
      </section>

      <div className="container py-4 position-relative">
        {mensaje && (
          <div className="rv-card-panel d-flex align-items-center gap-2 p-3 mb-4" style={{ background: 'var(--rv-crema)', borderLeft: '4px solid var(--rv-oliva)' }}>
            <i className="bi bi-check-circle" style={{ color: 'var(--rv-oliva)', fontSize: '1.3rem' }}></i>
            <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>{mensaje}</span>
          </div>
        )}

        {/* Mesa + carrito */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          {mesa ? (
            <div className="rv-card-panel d-flex align-items-center gap-2 p-3">
              <i className="bi bi-qr-code" style={{ color: 'var(--rv-pomodoro)' }}></i>
              <span>Mesa <strong>{mesa.numero}</strong></span>
            </div>
          ) : <span />}
          <Link href="/cliente/carrito" className="rv-btn rv-btn-pomodoro" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <i className="bi bi-cart"></i> Carrito
            {cantidadTotal > 0 && (
              <span className="badge bg-light text-dark ms-1">{cantidadTotal}</span>
            )}
          </Link>
        </div>

        {/* ====== CARTA CURSOS — SIEMPRE SE MUESTRA ====== */}
        {CURSOS.map((curso) => (
          <section key={curso.nombre} className="mb-4">
            <div className="d-flex align-items-baseline gap-2 mb-3">
              <p className="rv-eyebrow rv-eyebrow-dark">{curso.nombre}</p>
              <span className="puntos" style={{ flex: '1 auto', borderBottom: '1px dotted rgba(43, 28, 14, 0.4)', transform: 'translateY(-0.2em)' }}></span>
            </div>
            <div className="rv-listado-platos">
              <div className="rv-listado-cabecera">
                <p className="rv-eyebrow mb-1">Se serve oggi</p>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '1.4rem' }}>
                  {curso.nombre}
                </h3>
              </div>
              <div className="rv-listado-cuerpo">
                <ul className="rv-lista">
                  {curso.platos.map((plato) => (
                    <li key={plato.nombre}>
                      <div>
                        <span className="rv-lista-nombre">
                          {plato.nombre}
                          {plato.favorito && <span className="rv-badge-recetta">il più amato</span>}
                          {plato.picante && <span className="rv-picante">¡piccante!</span>}
                        </span>
                        {plato.italiano && <span className="rv-lista-italiano">{plato.italiano}</span>}
                      </div>
                      <div className="d-flex align-items-center" style={{ gap: '0.6rem', justifyContent: 'flex-end' }}>
                        <span className="rv-lista-precio">{plato.precio}</span>
                        <span className="puntos" style={{ minWidth: '0.5rem', borderBottom: '1px dotted rgba(43, 28, 14, 0.4)', transform: 'translateY(-0.3em)' }}></span>
                        <button
                          className="rv-btn rv-btn-pomodoro"
                          style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
                          onClick={() => {
                            setMensaje(`\"${plato.nombre}\" agregado al carrito.`);
                            setTimeout(() => setMensaje(''), 2000);
                          }}
                        >
                          <i className="bi bi-plus-lg"></i>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        ))}

        {/* Botón flotante del carrito */}
        {cantidadTotal > 0 && (
          <div className="text-center mt-4 mb-3">
            <Link href="/cliente/carrito" className="rv-btn rv-btn-pomodoro">
              <i className="bi bi-cart"></i> Ver carrito ({cantidadTotal})
            </Link>
          </div>
        )}

        {/* Pie de carta */}
        <p className="rv-carta-pie mt-4">
          la pasta se hace el mismo día — si se acaba, se acaba
        </p>
      </div>
    </div>
  );
}

function validMesaId(v: number): boolean {
  return Number.isInteger(v) && v > 0;
}
