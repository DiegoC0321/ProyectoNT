import { q, qOne, qRun, qInsert } from '@/lib/db';
import type { Platillo, Categoria } from '@/models/types';

/** RF01 — Consulta de menú digital (público) */
export async function listarPlatillos(opts: { soloDisponibles?: boolean; categoriaId?: number } = {}): Promise<Platillo[]> {
  let query = `
    SELECT p.*, c.nombre as categoria_nombre
    FROM platillo p LEFT JOIN categoria c ON c.id = p.categoria_id
    WHERE 1 = 1`;
  const params: unknown[] = [];

  if (opts.soloDisponibles) {
    query += ' AND p.disponible = true';
  }
  if (opts.categoriaId) {
    query += ' AND p.categoria_id = ?';
    params.push(opts.categoriaId);
  }
  query += ' ORDER BY p.categoria_id, p.nombre';

  return q<Platillo>(query, params);
}

export async function obtenerPlatillo(id: number): Promise<Platillo> {
  const row = await qOne<Platillo>(
    `SELECT p.*, c.nombre as categoria_nombre
     FROM platillo p LEFT JOIN categoria c ON c.id = p.categoria_id
     WHERE p.id = ?`,
    [id]
  );
  if (!row) throw new Error('Platillo no encontrado.');
  return row;
}

/** RF14 — Gestión del menú (administrador) */
export async function crearPlatillo(data: {
  nombre: string;
  descripcion?: string;
  precio: number;
  imagen_url?: string;
  categoria_id?: number | null;
  disponible?: boolean;
}): Promise<Platillo> {
  const id = await qInsert(
    `INSERT INTO platillo (nombre, descripcion, precio, imagen_url, disponible, categoria_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.nombre,
      data.descripcion ?? null,
      data.precio,
      data.imagen_url ?? null,
      data.disponible ?? true,
      data.categoria_id ?? null,
    ]
  );
  return obtenerPlatillo(id);
}

export async function actualizarPlatillo(
  id: number,
  data: Partial<{
    nombre: string;
    descripcion: string;
    precio: number;
    imagen_url: string;
    categoria_id: number | null;
    disponible: boolean;
  }>
): Promise<Platillo> {
  const actual = await obtenerPlatillo(id);

  await qRun(
    `UPDATE platillo SET nombre = ?, descripcion = ?, precio = ?, imagen_url = ?, categoria_id = ?, disponible = ?, updated_at = NOW()
     WHERE id = ?`,
    [
      data.nombre ?? actual.nombre,
      data.descripcion ?? actual.descripcion,
      data.precio ?? actual.precio,
      data.imagen_url ?? actual.imagen_url,
      data.categoria_id !== undefined ? data.categoria_id : actual.categoria_id,
      data.disponible === undefined ? actual.disponible : data.disponible,
      id,
    ]
  );

  return obtenerPlatillo(id);
}

export async function eliminarPlatillo(id: number) {
  await qRun('DELETE FROM platillo WHERE id = ?', [id]);
}

export async function alternarDisponibilidad(id: number): Promise<Platillo> {
  const actual = await obtenerPlatillo(id);
  await qRun('UPDATE platillo SET disponible = ?, updated_at = NOW() WHERE id = ?', [
    !actual.disponible,
    id,
  ]);
  return obtenerPlatillo(id);
}

export async function listarCategorias(): Promise<Categoria[]> {
  return q<Categoria>('SELECT * FROM categoria ORDER BY nombre');
}

export async function crearCategoria(nombre: string, descripcion?: string): Promise<Categoria> {
  const id = await qInsert('INSERT INTO categoria (nombre, descripcion) VALUES (?, ?)', [
    nombre,
    descripcion ?? null,
  ]);
  return (await qOne<Categoria>('SELECT * FROM categoria WHERE id = ?', [id])) as Categoria;
}