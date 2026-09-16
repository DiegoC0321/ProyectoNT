'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function ClienteDashboardPage() {
  const { usuario } = useAuth();
  const nombreCliente = usuario?.rol === 'CLIENTE' ? usuario.nombre : 'invitado';

  return (
    <div>
      <div className="rv-panel-cabecera">
        <div className="container">
          <p className="rv-eyebrow rv-eyebrow-dark">El sistema · la sala</p>
          <h1 className="rv-panel-nombre">
            Hola, <em>{nombreCliente}</em>
          </h1>
          <p className="rv-mano rv-mano-oliva" style={{ fontSize: '1.5rem', margin: '0.7rem 0 0' }}>
            ¿qué quieres para hoy?
          </p>
        </div>
      </div>

      <div className="container pb-4">
        <div className="rv-mano rv-mano-pomodoro" style={{ fontSize: '1.6rem', textAlign: 'center', margin: '2rem 0 1.2rem', transform: 'rotate(-2deg)' }}>
          oggi: espaguetis, ragú y un buen vino
        </div>

        <div className="row g-4">
          <div className="col-md-6">
            <Link href="/cliente/menu" className="text-decoration-none">
              <div className="rv-card-panel shadow-sm text-center h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-center mb-3" style={{ fontSize: '2.2rem' }}>
                    <i className="bi bi-book" style={{ color: 'var(--rv-pomodoro)' }}></i>
                  </div>
                  <p className="rv-eyebrow rv-eyebrow-dark">El menú</p>
                  <h3 className="card-title">Ver la carta</h3>
                  <p className="card-text">
                    La carta completa en mano — fotos, precios, recomendaciones y sin esperar al mesero.
                  </p>
                  <div className="rv-card-receta">
                    <p className="rv-card-preparacion">
                      del &apos;87, hecho en casa
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
          <div className="col-md-6">
            <Link href="/cliente/pedidos" className="text-decoration-none">
              <div className="rv-card-panel shadow-sm text-center h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-center mb-3" style={{ fontSize: '2.2rem' }}>
                    <i className="bi bi-clock-history" style={{ color: 'var(--rv-pomodoro)' }}></i>
                  </div>
                  <p className="rv-eyebrow rv-eyebrow-dark">Mis pedidos</p>
                  <h3 className="card-title">Mis pedidos</h3>
                  <p className="card-text">
                    El estado de tu pedido — sigue la cocina en vivo.
                  </p>
                  <div className="rv-card-receta">
                    <p className="rv-card-preparacion">
                      de la cocina a la mesa — cada pedido
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        <div className="text-center mt-4">
          <p className="rv-mano rv-mano-oliva" style={{ fontSize: '1.35rem', transform: 'rotate(-1deg)' }}>
            el servicio, sin prisa — como siempre
          </p>
        </div>
      </div>
    </div>
  );
}
