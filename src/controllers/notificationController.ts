import { getDb } from '@/lib/db';
import type { Notificacion, TipoNotificacion } from '@/models/types';

export function crearNotificacion(
  usuarioId: number,
  pedidoId: number | null,
  tipo: TipoNotificacion,
  mensaje: string
) {
  const db = getDb();
  db.prepare(
    `INSERT INTO notificacion (usuario_id, pedido_id, tipo, mensaje) VALUES (?, ?, ?, ?)`
  ).run(usuarioId, pedidoId, tipo, mensaje);
}

export function listarNotificaciones(usuarioId: number, soloNoLeidas = false): Notificacion[] {
  const db = getDb();
  let query = 'SELECT * FROM notificacion WHERE usuario_id = ?';
  if (soloNoLeidas) query += ' AND leida = 0';
  query += ' ORDER BY created_at DESC LIMIT 50';
  return db.prepare(query).all(usuarioId) as Notificacion[];
}

export function marcarNotificacionLeida(id: number, usuarioId: number) {
  const db = getDb();
  db.prepare('UPDATE notificacion SET leida = 1 WHERE id = ? AND usuario_id = ?').run(id, usuarioId);
}
