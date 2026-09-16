import { q, qOne, qRun, qInsert } from '@/lib/db';
import type { Inventario } from '@/models/types';
import { crearNotificacion } from '@/controllers/notificationController';

/** RF12 — Consultar inventario, con indicador de bajo stock */
export async function listarInventario(): Promise<Inventario[]> {
  const rows = await q<Inventario>(
    `SELECT inv.*, ing.nombre as ingrediente_nombre, ing.unidad_medida, ing.codigo_de_barras
     FROM inventario inv JOIN ingrediente ing ON ing.id = inv.ingrediente_id
     ORDER BY ing.nombre`
  );

  return rows.map((r) => ({ ...r, bajo_stock: r.cantidad_actual <= r.cantidad_minima }));
}

export async function registrarIngrediente(
  nombre: string,
  unidad: string,
  cantidadInicial: number,
  cantidadMinima: number,
  codigoBarras?: string
) {
  const codigo = codigoBarras?.trim() || null;
  // Una sola sentencia CTE: inserta/actualiza ingrediente e inventario de forma atómica.
  await qRun(
    `WITH nuevo AS (
       INSERT INTO ingrediente (nombre, unidad_medida, codigo_de_barras) VALUES (?, ?, ?)
       ON CONFLICT (nombre) DO UPDATE SET
         codigo_de_barras = COALESCE(EXCLUDED.codigo_de_barras, ingrediente.codigo_de_barras)
       RETURNING id
     )
     INSERT INTO inventario (ingrediente_id, cantidad_actual, cantidad_minima)
     SELECT id, ?, ? FROM nuevo
     ON CONFLICT (ingrediente_id)
     DO UPDATE SET cantidad_actual = EXCLUDED.cantidad_actual,
                   cantidad_minima = EXCLUDED.cantidad_minima,
                   updated_at = NOW()`,
    [nombre, unidad, codigo, cantidadInicial, cantidadMinima]
  ).catch((err: Error) => {
    if (/duplicate key value violates unique constraint "idx_ingrediente_codigo_barras"/i.test(err.message)) {
      throw new Error('Ese código de barras ya está asignado a otro insumo.');
    }
    throw err;
  });
  return listarInventario();
}

/** Escaneo de código de barras: suma stock al insumo (crea la fila si el insumo no tenía inventario). */
export async function agregarStockPorCodigoBarras(codigoBarras: string, cantidad: number) {
  const row = await qOne<{
    inventario_id: number | null;
    ingrediente_id: number;
    cantidad_actual: number;
  }>(
    `SELECT inv.id AS inventario_id, inv.ingrediente_id AS ingrediente_id,
            COALESCE(inv.cantidad_actual, 0) AS cantidad_actual
     FROM ingrediente ing
     LEFT JOIN inventario inv ON inv.ingrediente_id = ing.id
     WHERE ing.codigo_de_barras = ?`,
    [codigoBarras.trim()]
  );

  if (!row) {
    throw new Error(`No se encontró ningún insumo con el código "${codigoBarras.trim()}".`);
  }

  if (row.inventario_id == null) {
    await qInsert(
      'INSERT INTO inventario (ingrediente_id, cantidad_actual, cantidad_minima) VALUES (?, ?, 0)',
      [row.ingrediente_id, cantidad]
    );
  } else {
    await actualizarCantidadInventario(row.inventario_id, (row.cantidad_actual as number) + cantidad);
  }

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