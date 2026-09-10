import { q, qOne, qRun, qInsert } from '@/lib/db';
import type { Mesa, EstadoMesa } from '@/models/types';

/** RF08 — Gestión visual de mesas */
export async function listarMesas(): Promise<Mesa[]> {
  return q<Mesa>('SELECT * FROM mesa ORDER BY numero');
}

export async function actualizarEstadoMesa(id: number, estado: EstadoMesa): Promise<Mesa> {
  await qRun('UPDATE mesa SET estado = ? WHERE id = ?', [estado, id]);
  const row = await qOne<Mesa>('SELECT * FROM mesa WHERE id = ?', [id]);
  if (!row) throw new Error('Mesa no encontrada.');
  return row;
}

export async function crearMesa(numero: number, capacidad: number): Promise<Mesa> {
  const id = await qInsert('INSERT INTO mesa (numero, capacidad, estado) VALUES (?, ?, ?)', [
    numero,
    capacidad,
    'LIBRE',
  ]);
  return (await qOne<Mesa>('SELECT * FROM mesa WHERE id = ?', [id])) as Mesa;
}

/** QR/NFC por mesa: resuelve la mesa a partir de su número impreso. */
export async function buscarMesaPorNumero(numero: number): Promise<Mesa | undefined> {
  return qOne<Mesa>('SELECT * FROM mesa WHERE numero = ?', [numero]);
}