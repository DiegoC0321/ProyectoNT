import { q, qOne, qRun } from '@/lib/db';
import type { Inventario } from '@/models/types';
import { crearNotificacion } from '@/controllers/notificationController';

/** RF12 — Consultar inventario, con indicador de bajo stock */
export async function listarInventario(): Promise<Inventario[]> {
  const rows = await q<Inventario>(
    `SELECT inv.*, ing.nombre as ingrediente_nombre, ing.unidad_medida
     FROM inventario inv JOIN ingrediente ing ON ing.id = inv.ingrediente_id
     ORDER BY ing.nombre`
  );

  return rows.map((r) => ({ ...r, bajo_stock: r.cantidad_actual <= r.cantidad_minima }));
}

export async function registrarIngrediente(nombre: string, unidad: string, cantidadInicial: number, cantidadMinima: number) {
  // Una sola sentencia CTE: inserta/actualiza ingrediente e inventario de forma atómica.
  await qRun(
    `WITH nuevo AS (
       INSERT INTO ingrediente (nombre, unidad_medida) VALUES (?, ?)
       ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre
       RETURNING id
     )
     INSERT INTO inventario (ingrediente_id, cantidad_actual, cantidad_minima)
     SELECT id, ?, ? FROM nuevo
     ON CONFLICT (ingrediente_id)
     DO UPDATE SET cantidad_actual = EXCLUDED.cantidad_actual,
                   cantidad_minima = EXCLUDED.cantidad_minima,
                   updated_at = NOW()`,
    [nombre, unidad, cantidadInicial, cantidadMinima]
  );
  return listarInventario();
}

/** RF12 — Actualizar cantidades y detectar/alertar bajo inventario */
export async function actualizarCantidadInventario(inventarioId: number, nuevaCantidad: number) {
  await qRun('UPDATE inventario SET cantidad_actual = ?, updated_at = NOW() WHERE id = ?', [
    nuevaCantidad,
    inventarioId,
  ]);

  const row = await qOne<Inventario & { ingrediente_nombre: string }>(
    `SELECT inv.*, ing.nombre as ingrediente_nombre
     FROM inventario inv JOIN ingrediente ing ON ing.id = inv.ingrediente_id
     WHERE inv.id = ?`,
    [inventarioId]
  );

  if (row && row.cantidad_actual <= row.cantidad_minima) {
    const admins = await q<{ id: number }>(
      `SELECT u.id FROM usuario u JOIN rol r ON r.id = u.rol_id WHERE r.nombre = 'ADMINISTRADOR' AND u.activo = true`
    );
    for (const a of admins) {
      await crearNotificacion(
        a.id,
        null,
        'STOCK_BAJO',
        `Inventario bajo: "${row.ingrediente_nombre}" (${row.cantidad_actual} restante).`
      );
    }
  }

  return listarInventario();
}