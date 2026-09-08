'use client';

import { useEffect, useState } from 'react';
import { reportService, ResumenVentas } from '@/services/otherServices';
import { formatearMoneda } from '@/utils/format';
import BarChartSimple from '@/components/BarChartSimple';

export default function AdminVentasPage() {
  const [resumen, setResumen] = useState<ResumenVentas | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    reportService.resumen().then(setResumen).finally(() => setCargando(false));
  }, []);

  if (cargando) return <div className="container py-5 text-muted">Cargando panel de ventas...</div>;
  if (!resumen) return <div className="container py-5 text-danger">No se pudo cargar el resumen de ventas.</div>;

  return (
    <div className="container py-5">
      <h1 className="mb-4">Panel de control de ventas</h1>

      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card shadow-sm p-3 text-center">
            <p className="text-muted mb-1">Ventas de hoy</p>
            <h3>{formatearMoneda(resumen.ventas_dia.total)}</h3>
            <p className="small text-muted mb-0">{resumen.ventas_dia.pedidos} pedidos</p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm p-3 text-center">
            <p className="text-muted mb-1">Ventas de la semana</p>
            <h3>{formatearMoneda(resumen.ventas_semana.total)}</h3>
            <p className="small text-muted mb-0">{resumen.ventas_semana.pedidos} pedidos</p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm p-3 text-center">
            <p className="text-muted mb-1">Ventas del mes</p>
            <h3>{formatearMoneda(resumen.ventas_mes.total)}</h3>
            <p className="small text-muted mb-0">{resumen.ventas_mes.pedidos} pedidos</p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm p-3 text-center">
            <p className="text-muted mb-1">Total histórico de pedidos</p>
            <h3>{resumen.total_pedidos_historico}</h3>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card shadow-sm p-4 h-100">
            <h5 className="mb-3">Productos más vendidos</h5>
            {resumen.productos_mas_vendidos.length === 0 ? (
              <p className="text-muted">Aún no hay ventas registradas.</p>
            ) : (
              <BarChartSimple
                datos={resumen.productos_mas_vendidos.map((p) => ({ etiqueta: p.nombre, valor: p.unidades_vendidas }))}
                formato={(v) => `${v} unidades`}
              />
            )}
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card shadow-sm p-4 h-100">
            <h5 className="mb-3">Ventas de los últimos 7 días</h5>
            {resumen.ventas_ultimos_7_dias.length === 0 ? (
              <p className="text-muted">Sin datos suficientes.</p>
            ) : (
              <BarChartSimple
                datos={resumen.ventas_ultimos_7_dias.map((v) => ({ etiqueta: v.fecha, valor: v.total }))}
                formato={(v) => formatearMoneda(v)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
