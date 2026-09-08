import { getDb } from '@/lib/db';
import type { Inventario } from '@/models/types';
import { crearNotificacion } from '@/controllers/notificationController';

/** RF12 — Consultar inventario, con indicador de bajo stock */
export function listarInventario(): Inventario[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT inv.*, ing.nombre as ingrediente_nombre, ing.unidad_medida
       FROM inventario inv JOIN ingrediente ing ON ing.id = inv.ingrediente_id
       ORDER BY ing.nombre`
    )
    .all() as Inventario[];

  return rows.map((r) => ({ ...r, bajo_stock: r.cantidad_actual <= r.cantidad_minima }));
}

export function registrarIngrediente(nombre: string, unidad: string, cantidadInicial: number, cantidadMinima: number) {
  const db = getDb();
  const tx = db.transaction(() => {
    const info = db.prepare('INSERT INTO ingrediente (nombre, unidad_medida) VALUES (?, ?)').run(nombre, unidad);
    const ingredienteId = Number(info.lastInsertRowid);
    db.prepare('INSERT INTO inventario (ingrediente_id, cantidad_actual, cantidad_minima) VALUES (?, ?, ?)').run(
      ingredienteId,
      cantidadInicial,
      cantidadMinima
    );
    return ingredienteId;
  });
  tx();
  return listarInventario();
}

/** RF12 — Actualizar cantidades y detectar/alertar bajo inventario */
export function actualizarCantidadInventario(inventarioId: number, nuevaCantidad: number) {
  const db = getDb();
  db.prepare(`UPDATE inventario SET cantidad_actual = ?, updated_at = datetime('now') WHERE id = ?`).run(
    nuevaCantidad,
    inventarioId
  );

  const row = db
    .prepare(
      `SELECT inv.*, ing.nombre as ingrediente_nombre
       FROM inventario inv JOIN ingrediente ing ON ing.id = inv.ingrediente_id
       WHERE inv.id = ?`
    )
    .get(inventarioId) as (Inventario & { ingrediente_nombre: string }) | undefined;

  if (row && row.cantidad_actual <= row.cantidad_minima) {
    const admins = db
      .prepare(`SELECT u.id FROM usuario u JOIN rol r ON r.id = u.rol_id WHERE r.nombre = 'ADMINISTRADOR' AND u.activo = 1`)
      .all() as { id: number }[];
    for (const a of admins) {
      crearNotificacion(
        a.id,
        null,
        'STOCK_BAJO',
        `Inventario bajo: "${row.ingrediente_nombre}" (${row.cantidad_actual} restante).`
      );
    }
  }

  return listarInventario();
}
