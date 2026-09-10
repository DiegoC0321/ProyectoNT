'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { tableService } from '@/services/otherServices';
import EstadoBadge from '@/components/EstadoBadge';
import type { Mesa } from '@/models/types';

export default function MeseroDashboardPage() {
  const { usuario } = useAuth();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    tableService
      .listar()
      .then((res) => setMesas(res.mesas))
      .finally(() => setCargando(false));
  }, []);

  const mesasLibres = mesas.filter((m) => m.estado === 'LIBRE').length;
  const mesasOcupadas = mesas.filter((m) => m.estado !== 'LIBRE').length;

  return (
    <div>
      <div className="rv-panel-cabecera">
        <div className="container">
          <p className="rv-eyebrow rv-eyebrow-dark">Il sistema · la sala</p>
          <h1 className="rv-panel-nombre">
            <em>{usuario?.nombre ?? 'Mesero'}</em>
          </h1>
          <p className="rv-mano rv-mano-oliva" style={{ fontSize: '1.5rem', margin: '0.7rem 0 0' }}>
            un tavolo per volta — e il resto segue
          </p>
        </div>
      </div>

      <div className="container pb-4">
        {/* Resumen de mesas */}
        <div className="rv-listado-platos mb-4" style={{ maxWidth: 500, margin: '1.5rem auto' }}>
          <div className="rv-listado-cabecera">
            <p className="rv-eyebrow mb-1">Stato tavoli</p>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '1.3rem' }}>
              Estado de las mesas
            </h3>
          </div>
          <div className="rv-listado-cuerpo" style={{ textAlign: 'center', padding: '1.2rem' }}>
            <div className="d-flex justify-content-center gap-4">
              <div>
                <p className="rv-mano rv-mano-oliva" style={{ fontSize: '1.1rem', margin: '0 0 0.2rem' }}>Libre</p>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '2rem', margin: 0, color: 'var(--rv-oliva)' }}>
                  {cargando ? '—' : mesasLibres}
                </p>
              </div>
              <div style={{ width: 1, background: 'rgba(43, 28, 14, 0.2)' }}></div>
              <div>
                <p className="rv-mano rv-mano-pomodoro" style={{ fontSize: '1.1rem', margin: '0 0 0.2rem' }}>Occupata</p>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '2rem', margin: 0, color: 'var(--rv-pomodoro)' }}>
                  {cargando ? '—' : mesasOcupadas}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="rv-mano rv-mano-pomodoro" style={{ fontSize: '1.5rem', textAlign: 'center', margin: '2rem 0 1rem', transform: 'rotate(-1.5deg)' }}>
          accedi rapidamente — ogni tavolo è pronto
        </div>

        <div className="row g-4">
          <div className="col-md-6">
            <Link href="/mesero/mesas" className="text-decoration-none">
              <div className="rv-card-panel shadow-sm text-center h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-center mb-3" style={{ fontSize: '2rem' }}>
                    <i className="bi bi-grid-3x2" style={{ color: 'var(--rv-pomodoro)' }}></i>
                  </div>
                  <p className="rv-eyebrow rv-eyebrow-dark">Tavoli</p>
                  <h3 className="card-title" style={{ fontSize: '1.1rem' }}>Ver mesas</h3>
                  <p className="card-text" style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
                    gestionar estados de las mesas
                  </p>
                </div>
              </div>
            </Link>
          </div>
          <div className="col-md-6">
            <Link href="/mesero/registrar-pedido" className="text-decoration-none">
              <div className="rv-card-panel shadow-sm text-center h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-center mb-3" style={{ fontSize: '2rem' }}>
                    <i className="bi bi-plus-circle" style={{ color: 'var(--rv-oliva)' }}></i>
                  </div>
                  <p className="rv-eyebrow rv-eyebrow-dark">Ordine</p>
                  <h3 className="card-title" style={{ fontSize: '1.1rem' }}>Registrar pedido</h3>
                  <p className="card-text" style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
                    crear un nuevo pedido para una mesa
                  </p>
                </div>
              </div>
            </Link>
          </div>
          <div className="col-md-6">
            <Link href="/mesero/pedidos" className="text-decoration-none">
              <div className="rv-card-panel shadow-sm text-center h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-center mb-3" style={{ fontSize: '2rem' }}>
                    <i className="bi bi-clock-history" style={{ color: 'var(--rv-oro)' }}></i>
                  </div>
                  <p className="rv-eyebrow rv-eyebrow-dark">Ordini</p>
                  <h3 className="card-title" style={{ fontSize: '1.1rem' }}>Ver pedidos</h3>
                  <p className="card-text" style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
                    seguimiento de pedidos en curso
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        <div className="text-center mt-4">
          <p className="rv-mano rv-mano-oliva" style={{ fontSize: '1.25rem', transform: 'rotate(-1deg)' }}>
            la carta è sul tavolo — oggi come ieri
          </p>
        </div>
      </div>
    </div>
  );
}
