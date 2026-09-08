'use client';

import { useState, FormEvent } from 'react';
import { reportService } from '@/services/otherServices';
import { formatearMoneda } from '@/utils/format';

interface ReportePeriodo {
  periodo: { desde: string; hasta: string };
  ventas: { total: number; pedidos: number };
  productos_mas_vendidos: { nombre: string; unidades_vendidas: number; ingresos: number }[];
  consumo_inventario: { nombre: string; consumo_estimado: number; unidad_medida: string }[];
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function ReportesPage() {
  const [desde, setDesde] = useState(hoyISO());
  const [hasta, setHasta] = useState(hoyISO());
  const [reporte, setReporte] = useState<ReportePeriodo | null>(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const data = await reportService.porPeriodo(desde, hasta);
      setReporte(data as ReportePeriodo);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="container py-5">
      <h1 className="mb-4">Reportes por periodo</h1>

      <form onSubmit={handleSubmit} className="row g-3 align-items-end mb-4">
        <div className="col-auto">
          <label className="form-label">Desde</label>
          <input type="date" className="form-control" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="col-auto">
          <label className="form-label">Hasta</label>
          <input type="date" className="form-control" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
        <div className="col-auto">
          <button className="btn btn-warning" type="submit" disabled={cargando}>
            {cargando ? 'Generando...' : 'Generar reporte'}
          </button>
        </div>
      </form>

      {error && <div className="alert alert-danger">{error}</div>}

      {reporte && (
        <div className="row g-4">
          <div className="col-md-4">
            <div className="card shadow-sm p-3 text-center">
              <p className="text-muted mb-1">Ventas del periodo</p>
              <h3>{formatearMoneda(reporte.ventas.total)}</h3>
              <p className="small text-muted mb-0">{reporte.ventas.pedidos} pedidos</p>
            </div>
          </div>
          <div className="col-md-8">
            <div className="card shadow-sm p-3">
              <h5>Productos más vendidos</h5>
              {reporte.productos_mas_vendidos.length === 0 ? (
                <p className="text-muted mb-0">Sin ventas en este periodo.</p>
              ) : (
                <table className="table table-sm mb-0">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Unidades</th>
                      <th>Ingresos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporte.productos_mas_vendidos.map((p) => (
                      <tr key={p.nombre}>
                        <td>{p.nombre}</td>
                        <td>{p.unidades_vendidas}</td>
                        <td>{formatearMoneda(p.ingresos)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div className="col-12">
            <div className="card shadow-sm p-3">
              <h5>Consumo estimado de inventario</h5>
              {reporte.consumo_inventario.length === 0 ? (
                <p className="text-muted mb-0">Sin consumo registrado en este periodo.</p>
              ) : (
                <table className="table table-sm mb-0">
                  <thead>
                    <tr>
                      <th>Insumo</th>
                      <th>Consumo estimado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporte.consumo_inventario.map((c) => (
                      <tr key={c.nombre}>
                        <td>{c.nombre}</td>
                        <td>
                          {c.consumo_estimado} {c.unidad_medida}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
