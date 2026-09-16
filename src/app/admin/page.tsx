'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { reportService } from '@/services/otherServices';
import { formatearMoneda } from '@/utils/format';

interface ResumenHoy {
  ventas: { total: number; pedidos: number };
}

export default function AdminDashboardPage() {
  const { usuario } = useAuth();
  const [resumen, setResumen] = useState<ResumenHoy | null>(null);

  useEffect(() => {
    const hoy = new Date().toISOString().slice(0, 10);
    reportService
      .porPeriodo(hoy, hoy)
      .then((data: any) => setResumen({ ventas: data.ventas }))
      .catch(() => {});
  }, []);

  return (
    <div>
      <div className="rv-panel-cabecera">
        <div className="container">
          <p className="rv-eyebrow rv-eyebrow-dark">El sistema · la caja</p>
          <h1 className="rv-panel-nombre">
            <em>{usuario?.nombre ?? 'Admin'}</em>
          </h1>
          <p className="rv-mano rv-mano-oliva" style={{ fontSize: '1.5rem', margin: '0.7rem 0 0' }}>
            cada día, un balance — cada noche, una cuenta
          </p>
        </div>
      </div>

      <div className="container pb-4">
        {/* Resumen del día */}
        {resumen && (
          <div className="rv-listado-platos mb-4" style={{ maxWidth: 500, margin: '1.5rem auto' }}>
            <div className="rv-listado-cabecera">
              <p className="rv-eyebrow mb-1">Resumen de hoy</p>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '1.3rem' }}>
                Resumen del día
              </h3>
            </div>
            <div className="rv-listado-cuerpo" style={{ textAlign: 'center', padding: '1.5rem' }}>
              <p className="rv-mano rv-mano-pomodoro" style={{ fontSize: '1.2rem', margin: '0 0 0.5rem' }}>Vendite</p>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '2rem', margin: 0 }}>
                {formatearMoneda(resumen.ventas.total)}
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--rv-tinta-2)', margin: '0.3rem 0 0' }}>
                {resumen.ventas.pedidos} pedidos hoy
              </p>
            </div>
          </div>
        )}

        {/* Accesos rápidos */}
        <div className="rv-mano rv-mano-pomodoro" style={{ fontSize: '1.5rem', textAlign: 'center', margin: '2rem 0 1rem', transform: 'rotate(-1.5deg)' }}>
          acceso rápido — todo a la mano
        </div>

        <div className="row g-4">
          <div className="col-md-6 col-lg-3">
            <Link href="/admin/menu" className="text-decoration-none">
              <div className="rv-card-panel shadow-sm text-center h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-center mb-3" style={{ fontSize: '2rem' }}>
                    <i className="bi bi-book" style={{ color: 'var(--rv-pomodoro)' }}></i>
                  </div>
                  <p className="rv-eyebrow rv-eyebrow-dark">Menú</p>
                  <h3 className="card-title" style={{ fontSize: '1.1rem' }}>Gestionar carta</h3>
                </div>
              </div>
            </Link>
          </div>
          <div className="col-md-6 col-lg-3">
            <Link href="/admin/inventario" className="text-decoration-none">
              <div className="rv-card-panel shadow-sm text-center h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-center mb-3" style={{ fontSize: '2rem' }}>
                    <i className="bi bi-box-seam" style={{ color: 'var(--rv-oliva)' }}></i>
                  </div>
                  <p className="rv-eyebrow rv-eyebrow-dark">Inventario</p>
                  <h3 className="card-title" style={{ fontSize: '1.1rem' }}>Controlar stock</h3>
                </div>
              </div>
            </Link>
          </div>
          <div className="col-md-6 col-lg-3">
            <Link href="/admin/usuarios" className="text-decoration-none">
              <div className="rv-card-panel shadow-sm text-center h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-center mb-3" style={{ fontSize: '2rem' }}>
                    <i className="bi bi-people" style={{ color: 'var(--rv-oro)' }}></i>
                  </div>
                  <p className="rv-eyebrow rv-eyebrow-dark">Usuarios</p>
                  <h3 className="card-title" style={{ fontSize: '1.1rem' }}>Personal</h3>
                </div>
              </div>
            </Link>
          </div>
          <div className="col-md-6 col-lg-3">
            <Link href="/admin/reportes" className="text-decoration-none">
              <div className="rv-card-panel shadow-sm text-center h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-center mb-3" style={{ fontSize: '2rem' }}>
                    <i className="bi bi-bar-chart" style={{ color: 'var(--rv-vino)' }}></i>
                  </div>
                  <p className="rv-eyebrow rv-eyebrow-dark">Reportes</p>
                  <h3 className="card-title" style={{ fontSize: '1.1rem' }}>Ver reportes</h3>
                </div>
              </div>
            </Link>
          </div>
        </div>

        <div className="text-center mt-4">
          <p className="rv-mano rv-mano-oliva" style={{ fontSize: '1.25rem', transform: 'rotate(-1deg)' }}>
            el regreso de la trattoria — cada día, con la misma calma
          </p>
        </div>
      </div>
    </div>
  );
}
