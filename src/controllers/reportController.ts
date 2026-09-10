import { q, qOne } from '@/lib/db';

const ESTADOS_VENTA_VALIDA = "('ENTREGADO','LISTO','EN PREPARACION','RECIBIDO')"; // pedidos no cancelados

/** RF11 — Panel de control de ventas (día / semana / mes) */
export async function resumenVentas() {
  const ventasDia = (await qOne(
    `SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as pedidos
     FROM pedido WHERE estado IN ${ESTADOS_VENTA_VALIDA} AND (created_at::date) = CURRENT_DATE`
  )) as { total: number; pedidos: number };

  const ventasSemana = (await qOne(
    `SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as pedidos
     FROM pedido WHERE estado IN ${ESTADOS_VENTA_VALIDA} AND (created_at::date) >= CURRENT_DATE - INTERVAL '7 days'`
  )) as { total: number; pedidos: number };

  const ventasMes = (await qOne(
    `SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as pedidos
     FROM pedido WHERE estado IN ${ESTADOS_VENTA_VALIDA} AND to_char(created_at, 'YYYY-MM') = to_char(NOW(), 'YYYY-MM')`
  )) as { total: number; pedidos: number };

  const totalPedidos = (await qOne(`SELECT COUNT(*) as total FROM pedido`)) as { total: number };

  const masVendidos = await q(
    `SELECT p.nombre, SUM(d.cantidad) as unidades_vendidas, SUM(d.subtotal) as ingresos
     FROM detalle_pedido d
     JOIN pedido pe ON pe.id = d.pedido_id
     JOIN platillo p ON p.id = d.platillo_id
     WHERE pe.estado IN ${ESTADOS_VENTA_VALIDA}
     GROUP BY p.id
     ORDER BY unidades_vendidas DESC
     LIMIT 5`
  );

  const ventasPorDiaSemana = await q(
    `SELECT (created_at::date) as fecha, COALESCE(SUM(total), 0) as total
     FROM pedido
     WHERE estado IN ${ESTADOS_VENTA_VALIDA} AND (created_at::date) >= CURRENT_DATE - INTERVAL '6 days'
     GROUP BY (created_at::date)
     ORDER BY fecha`
  );

  return {
    ventas_dia: ventasDia,
    ventas_semana: ventasSemana,
    ventas_mes: ventasMes,
    total_pedidos_historico: totalPedidos.total,
    productos_mas_vendidos: masVendidos,
    ventas_ultimos_7_dias: ventasPorDiaSemana,
  };
}

/** RF13 — Reportes por periodo (ventas, productos más vendidos, consumo de inventario) */
export async function generarReportePorPeriodo(desde: string, hasta: string) {
  const ventas = (await qOne(
    `SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as pedidos
     FROM pedido WHERE estado IN ${ESTADOS_VENTA_VALIDA} AND (created_at::date) BETWEEN (?::date) AND (?::date)`,
    [desde, hasta]
  )) as { total: number; pedidos: number };

  const productos = await q(
    `SELECT p.nombre, SUM(d.cantidad) as unidades_vendidas, SUM(d.subtotal) as ingresos
     FROM detalle_pedido d
     JOIN pedido pe ON pe.id = d.pedido_id
     JOIN platillo p ON p.id = d.platillo_id
     WHERE pe.estado IN ${ESTADOS_VENTA_VALIDA} AND (pe.created_at::date) BETWEEN (?::date) AND (?::date)
     GROUP BY p.id
     ORDER BY unidades_vendidas DESC`,
    [desde, hasta]
  );

  const consumoInventario = await q(
    `SELECT ing.nombre, SUM(d.cantidad * pi.cantidad_requerida) as consumo_estimado, ing.unidad_medida
     FROM detalle_pedido d
     JOIN pedido pe ON pe.id = d.pedido_id
     JOIN platillo_ingrediente pi ON pi.platillo_id = d.platillo_id
     JOIN ingrediente ing ON ing.id = pi.ingrediente_id
     WHERE pe.estado IN ${ESTADOS_VENTA_VALIDA} AND (pe.created_at::date) BETWEEN (?::date) AND (?::date)
     GROUP BY ing.id, ing.nombre, ing.unidad_medida
     ORDER BY consumo_estimado DESC`,
    [desde, hasta]
  );

  return { periodo: { desde, hasta }, ventas, productos_mas_vendidos: productos, consumo_inventario: consumoInventario };
}