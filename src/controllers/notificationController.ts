import { q, qOne, qRun } from '@/lib/db';
import type { Notificacion, TipoNotificacion } from '@/models/types';

export async function crearNotificacion(
  usuarioId: number,
  pedidoId: number | null,
  tipo: TipoNotificacion,
  mensaje: string
) {
  await qRun(
    `INSERT INTO notificacion (usuario_id, pedido_id, tipo, mensaje) VALUES (?, ?, ?, ?)`,
    [usuarioId, pedidoId, tipo, mensaje]
  );
}

export async function listarNotificaciones(usuarioId: number, soloNoLeidas = false): Promise<Notificacion[]> {
  let query = 'SELECT * FROM notificacion WHERE usuario_id = ?';
  const params: unknown[] = [usuarioId];
  if (soloNoLeidas) {
    query += ' AND leida = false';
  }
  query += ' ORDER BY created_at DESC LIMIT 50';
  return q<Notificacion>(query, params);
}

export async function marcarNotificacionLeida(id: number, usuarioId: number) {
  await qRun('UPDATE notificacion SET leida = true WHERE id = ? AND usuario_id = ?', [id, usuarioId]);
}