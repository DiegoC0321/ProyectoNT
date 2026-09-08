import { getDb } from '@/lib/db';
import type { Platillo, Categoria } from '@/models/types';

/** RF01 — Consulta de menú digital (público) */
export function listarPlatillos(opts: { soloDisponibles?: boolean; categoriaId?: number } = {}): Platillo[] {
  const db = getDb();
  let query = `
    SELECT p.*, c.nombre as categoria_nombre
    FROM platillo p LEFT JOIN categoria c ON c.id = p.categoria_id
    WHERE 1 = 1`;
  const params: unknown[] = [];

  if (opts.soloDisponibles) {
    query += ' AND p.disponible = 1';
  }
  if (opts.categoriaId) {
    query += ' AND p.categoria_id = ?';
    params.push(opts.categoriaId);
  }
  query += ' ORDER BY p.categoria_id, p.nombre';

  return db.prepare(query).all(...params) as Platillo[];
}

export function obtenerPlatillo(id: number): Platillo {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT p.*, c.nombre as categoria_nombre
       FROM platillo p LEFT JOIN categoria c ON c.id = p.categoria_id
       WHERE p.id = ?`
    )
    .get(id) as Platillo | undefined;
  if (!row) throw new Error('Platillo no encontrado.');
  return row;
}

/** RF14 — Gestión del menú (administrador) */
export function crearPlatillo(data: {
  nombre: string;
  descripcion?: string;
  precio: number;
  imagen_url?: string;
  categoria_id?: number | null;
  disponible?: boolean;
}) {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO platillo (nombre, descripcion, precio, imagen_url, disponible, categoria_id)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.nombre,
      data.descripcion ?? null,
      data.precio,
      data.imagen_url ?? null,
      data.disponible === false ? 0 : 1,
      data.categoria_id ?? null
    );
  return obtenerPlatillo(Number(info.lastInsertRowid));
}

export function actualizarPlatillo(
  id: number,
  data: Partial<{
    nombre: string;
    descripcion: string;
    precio: number;
    imagen_url: string;
    categoria_id: number | null;
    disponible: boolean;
  }>
) {
  const db = getDb();
  const actual = obtenerPlatillo(id);

  db.prepare(
    `UPDATE platillo SET nombre = ?, descripcion = ?, precio = ?, imagen_url = ?, categoria_id = ?, disponible = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    data.nombre ?? actual.nombre,
    data.descripcion ?? actual.descripcion,
    data.precio ?? actual.precio,
    data.imagen_url ?? actual.imagen_url,
    data.categoria_id !== undefined ? data.categoria_id : actual.categoria_id,
    data.disponible !== undefined ? (data.disponible ? 1 : 0) : actual.disponible,
    id
  );

  return obtenerPlatillo(id);
}

export function eliminarPlatillo(id: number) {
  const db = getDb();
  db.prepare('DELETE FROM platillo WHERE id = ?').run(id);
}

export function alternarDisponibilidad(id: number) {
  const db = getDb();
  const actual = obtenerPlatillo(id);
  db.prepare(`UPDATE platillo SET disponible = ?, updated_at = datetime('now') WHERE id = ?`).run(
    actual.disponible ? 0 : 1,
    id
  );
  return obtenerPlatillo(id);
}

export function listarCategorias(): Categoria[] {
  const db = getDb();
  return db.prepare('SELECT * FROM categoria ORDER BY nombre').all() as Categoria[];
}

export function crearCategoria(nombre: string, descripcion?: string) {
  const db = getDb();
  const info = db.prepare('INSERT INTO categoria (nombre, descripcion) VALUES (?, ?)').run(nombre, descripcion ?? null);
  return db.prepare('SELECT * FROM categoria WHERE id = ?').get(Number(info.lastInsertRowid)) as Categoria;
}
