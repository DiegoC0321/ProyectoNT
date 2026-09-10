'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { tableService } from '@/services/otherServices';
import EstadoBadge from '@/components/EstadoBadge';
import type { Mesa, EstadoMesa } from '@/models/types';

const ESTADOS: EstadoMesa[] = ['LIBRE', 'OCUPADA', 'PEDIDO EN CURSO'];

export default function MesasPage() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [cargando, setCargando] = useState(true);

  function cargar() {
    tableService.listar().then((res) => setMesas(res.mesas)).finally(() => setCargando(false));
  }

  useEffect(() => {
    cargar();
  }, []);

  async function cambiarEstado(mesa: Mesa, estado: EstadoMesa) {
    await tableService.actualizarEstado(mesa.id, estado);
    cargar();
  }

  return (
    <div>
      <div className="rv-panel-cabecera">
        <div className="container">
          <p className="rv-eyebrow rv-eyebrow-dark">Il sistema · tavoli</p>
          <h1 className="rv-panel-nombre">Mesas <em>della sala</em></h1>
          <p className="rv-mano rv-mano-oliva" style={{ fontSize: '1.3rem', margin: '0.5rem 0 0' }}>ogni tavolo è pronto — serve con calma</p>
        </div>
      </div>
      <div className="container pb-4 pt-3">
      <h2 className="mb-4" style={{ fontFamily: 'var(--font-display)' }}>Mesas</h2>
      {cargando ? (
        <p className="text-muted">Cargando mesas...</p>
      ) : (
        <div className="row g-3">
          {mesas.map((mesa) => (
            <div className="col-6 col-md-3" key={mesa.id}>
              <div className="card text-center shadow-sm h-100">
                <div className="card-body">
                  <h4>Mesa {mesa.numero}</h4>
                  <p className="text-muted small mb-2">Capacidad: {mesa.capacidad}</p>
                  <EstadoBadge estado={mesa.estado} />
                  <div className="mt-3 d-flex flex-column gap-1">
                    {ESTADOS.filter((e) => e !== mesa.estado).map((estado) => (
                      <button
                        key={estado}
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => cambiarEstado(mesa, estado)}
                      >
                        Marcar {estado}
                      </button>
                    ))}
                    {mesa.estado !== 'LIBRE' && (
                      <Link
                        href={`/mesero/registrar-pedido?mesa=${mesa.id}`}
                        className="btn btn-sm btn-warning mt-1"
                      >
                        Registrar pedido
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
