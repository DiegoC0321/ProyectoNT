import { getDb } from '@/lib/db';
import type { Mesa, EstadoMesa } from '@/models/types';

/** RF08 — Gestión visual de mesas */
export function listarMesas(): Mesa[] {
  const db = getDb();
  return db.prepare('SELECT * FROM mesa ORDER BY numero').all() as Mesa[];
}

export function actualizarEstadoMesa(id: number, estado: EstadoMesa): Mesa {
  const db = getDb();
  db.prepare('UPDATE mesa SET estado = ? WHERE id = ?').run(estado, id);
  const row = db.prepare('SELECT * FROM mesa WHERE id = ?').get(id) as Mesa | undefined;
  if (!row) throw new Error('Mesa no encontrada.');
  return row;
}

export function crearMesa(numero: number, capacidad: number): Mesa {
  const db = getDb();
  const info = db.prepare('INSERT INTO mesa (numero, capacidad, estado) VALUES (?, ?, ?)').run(numero, capacidad, 'LIBRE');
  return db.prepare('SELECT * FROM mesa WHERE id = ?').get(Number(info.lastInsertRowid)) as Mesa;
}
