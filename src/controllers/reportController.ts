import { getDb } from '@/lib/db';

const ESTADOS_VENTA_VALIDA = "('ENTREGADO','LISTO','EN PREPARACION','RECIBIDO')"; // pedidos no cancelados

/** RF11 — Panel de control de ventas (día / semana / mes) */
export function resumenVentas() {
  const db = getDb();

  const ventasDia = db
    .prepare(
      `SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as pedidos
       FROM pedido WHERE estado IN ${ESTADOS_VENTA_VALIDA} AND date(created_at) = date('now')`
    )
    .get() as { total: number; pedidos: number };

  const ventasSemana = db
    .prepare(
      `SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as pedidos
       FROM pedido WHERE estado IN ${ESTADOS_VENTA_VALIDA} AND date(created_at) >= date('now', '-7 days')`
    )
    .get() as { total: number; pedidos: number };

  const ventasMes = db
    .prepare(
      `SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as pedidos
       FROM pedido WHERE estado IN ${ESTADOS_VENTA_VALIDA} AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`
    )
    .get() as { total: number; pedidos: number };

  const totalPedidos = db.prepare(`SELECT COUNT(*) as total FROM pedido`).get() as { total: number };

  const masVendidos = db
    .prepare(
      `SELECT p.nombre, SUM(d.cantidad) as unidades_vendidas, SUM(d.subtotal) as ingresos
       FROM detalle_pedido d
       JOIN pedido pe ON pe.id = d.pedido_id
       JOIN platillo p ON p.id = d.platillo_id
       WHERE pe.estado IN ${ESTADOS_VENTA_VALIDA}
       GROUP BY p.id
       ORDER BY unidades_vendidas DESC
       LIMIT 5`
    )
    .all();

  const ventasPorDiaSemana = db
    .prepare(
      `SELECT date(created_at) as fecha, COALESCE(SUM(total), 0) as total
       FROM pedido
       WHERE estado IN ${ESTADOS_VENTA_VALIDA} AND date(created_at) >= date('now', '-6 days')
       GROUP BY date(created_at)
       ORDER BY fecha`
    )
    .all();

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
export function generarReportePorPeriodo(desde: string, hasta: string) {
  const db = getDb();

  const ventas = db
    .prepare(
      `SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as pedidos
       FROM pedido WHERE estado IN ${ESTADOS_VENTA_VALIDA} AND date(created_at) BETWEEN date(?) AND date(?)`
    )
    .get(desde, hasta) as { total: number; pedidos: number };

  const productos = db
    .prepare(
      `SELECT p.nombre, SUM(d.cantidad) as unidades_vendidas, SUM(d.subtotal) as ingresos
       FROM detalle_pedido d
       JOIN pedido pe ON pe.id = d.pedido_id
       JOIN platillo p ON p.id = d.platillo_id
       WHERE pe.estado IN ${ESTADOS_VENTA_VALIDA} AND date(pe.created_at) BETWEEN date(?) AND date(?)
       GROUP BY p.id
       ORDER BY unidades_vendidas DESC`
    )
    .all(desde, hasta);

  const consumoInventario = db
    .prepare(
      `SELECT ing.nombre, SUM(d.cantidad * pi.cantidad_requerida) as consumo_estimado, ing.unidad_medida
       FROM detalle_pedido d
       JOIN pedido pe ON pe.id = d.pedido_id
       JOIN platillo_ingrediente pi ON pi.platillo_id = d.platillo_id
       JOIN ingrediente ing ON ing.id = pi.ingrediente_id
       WHERE pe.estado IN ${ESTADOS_VENTA_VALIDA} AND date(pe.created_at) BETWEEN date(?) AND date(?)
       GROUP BY ing.id
       ORDER BY consumo_estimado DESC`
    )
    .all(desde, hasta);

  return { periodo: { desde, hasta }, ventas, productos_mas_vendidos: productos, consumo_inventario: consumoInventario };
}
