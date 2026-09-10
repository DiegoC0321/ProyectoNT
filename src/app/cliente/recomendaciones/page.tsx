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
    <div>
      <section className="rv-menu-cabecera" style={{ padding: '2.5rem 0' }}>
        <div className="container">
          <p className="rv-eyebrow rv-eyebrow-claro">Suggerimenti</p>
          <h1 className="rv-menu-marca">
            <i className="bi bi-stars" style={{ color: 'var(--rv-oro)' }}></i> Recomendado
          </h1>
          <p className="rv-menu-sub">un cameriere che ti conosce — suggerimenti come si farebbe a casa tua</p>
        </div>
      </section>

      <div className="container py-4">
        {mensaje && (
          <div className="rv-card-panel d-flex align-items-center gap-2 p-3 mb-4" style={{ background: 'var(--rv-crema)', borderLeft: '4px solid var(--rv-oliva)' }}>
            <i className="bi bi-check-circle" style={{ color: 'var(--rv-oliva)', fontSize: '1.3rem' }}></i>
            <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>{mensaje}</span>
          </div>
        )}

        {cargando ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status" />
            <p className="rv-mano rv-mano-oliva mt-3" style={{ fontSize: '1.3rem' }}>
              buscando las mejores recomendaciones...
            </p>
          </div>
        ) : platillos.length === 0 ? (
          <div className="rv-listado-platos" style={{ maxWidth: 500, margin: '2rem auto' }}>
            <div className="rv-listado-cuerpo" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
              <i className="bi bi-stars" style={{ fontSize: '2.2rem', color: 'var(--rv-oro)', opacity: 0.6 }}></i>
              <h3 style={{ fontFamily: 'var(--font-display)', marginTop: '0.8rem' }}>Sin recomendaciones aún</h3>
              <p className="rv-mano rv-mano-oliva" style={{ fontSize: '1.2rem', margin: '0.5rem 0 0' }}>
                aun no tenemos suficientes datos — ¡haz tu primer pedido!
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="rv-mano rv-mano-pomodoro" style={{ fontSize: '1.4rem', textAlign: 'center', margin: '0.5rem 0 1.5rem', transform: 'rotate(-1.5deg)' }}>
              il cameriere consiglia — oggi, per te
            </div>
            <div className="rv-listado-platos">
              <div className="rv-listado-cabecera">
                <p className="rv-eyebrow mb-1">Consigliati</p>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '1.4rem' }}>
                  Sugerencias para ti
                </h3>
              </div>
              <div className="rv-listado-cuerpo">
                <ul className="rv-lista">
                  {platillos.map((p) => (
                    <li key={p.id}>
                      <div>
                        <span className="rv-lista-nombre">{p.nombre}</span>
                        {p.descripcion && <span className="rv-lista-desc">{p.descripcion}</span>}
                      </div>
                      <div className="d-flex align-items-center" style={{ gap: '0.6rem', justifyContent: 'flex-end' }}>
                        <span className="rv-lista-precio">${p.precio.toLocaleString('es-CO')}</span>
                        <span className="puntos" style={{ minWidth: '0.5rem', borderBottom: '1px dotted rgba(43, 28, 14, 0.4)', transform: 'translateY(-0.3em)' }}></span>
                        <button
                          className="rv-btn rv-btn-pomodoro"
                          style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
                          onClick={() => handleAgregar(p)}
                        >
                          <i className="bi bi-plus-lg"></i>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}

        <div className="text-center mt-4">
          <p className="rv-mano rv-mano-oliva" style={{ fontSize: '1.25rem', transform: 'rotate(-1deg)' }}>
            il servizio, senza fretta — come è da sempre
          </p>
        </div>
      </div>
    </div>
  );
}
