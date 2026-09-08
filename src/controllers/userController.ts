import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import type { RolNombre, UsuarioPublico } from '@/models/types';

interface UsuarioRow {
  id: number;
  nombre: string;
  email: string;
  activo: number;
  rol: RolNombre;
}

function toPublico(row: UsuarioRow): UsuarioPublico {
  return { id: row.id, nombre: row.nombre, email: row.email, rol: row.rol, activo: !!row.activo };
}

export function listarUsuarios(): UsuarioPublico[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT u.id, u.nombre, u.email, u.activo, r.nombre as rol
       FROM usuario u JOIN rol r ON r.id = u.rol_id ORDER BY u.id DESC`
    )
    .all() as UsuarioRow[];
  return rows.map(toPublico);
}

/** RF15 — Crear empleados con rol MESERO, COCINA o ADMINISTRADOR */
export function crearEmpleado(nombre: string, email: string, password: string, rol: RolNombre) {
  if (rol === 'CLIENTE') {
    throw new Error('Los clientes deben registrarse mediante el formulario público de registro.');
  }
  const db = getDb();

  const existente = db.prepare('SELECT id FROM usuario WHERE email = ?').get(email);
  if (existente) throw new Error('Ya existe un usuario con este correo electrónico.');

  const rolRow = db.prepare('SELECT id FROM rol WHERE nombre = ?').get(rol) as { id: number } | undefined;
  if (!rolRow) throw new Error('Rol inválido.');

  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare('INSERT INTO usuario (nombre, email, password_hash, rol_id) VALUES (?, ?, ?, ?)')
    .run(nombre, email, hash, rolRow.id);

  return obtenerUsuario(Number(info.lastInsertRowid));
}

export function obtenerUsuario(id: number): UsuarioPublico {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT u.id, u.nombre, u.email, u.activo, r.nombre as rol
       FROM usuario u JOIN rol r ON r.id = u.rol_id WHERE u.id = ?`
    )
    .get(id) as UsuarioRow | undefined;
  if (!row) throw new Error('Usuario no encontrado.');
  return toPublico(row);
}

export function actualizarUsuario(
  id: number,
  data: Partial<{ nombre: string; email: string; rol: RolNombre; activo: boolean }>
) {
  const db = getDb();
  const actual = obtenerUsuario(id);

  const nombre = data.nombre ?? actual.nombre;
  const email = data.email ?? actual.email;
  const activo = data.activo ?? actual.activo;
  let rolId: number | null = null;

  if (data.rol) {
    const rolRow = db.prepare('SELECT id FROM rol WHERE nombre = ?').get(data.rol) as { id: number } | undefined;
    if (!rolRow) throw new Error('Rol inválido.');
    rolId = rolRow.id;
  }

  db.prepare(
    `UPDATE usuario SET nombre = ?, email = ?, activo = ?, rol_id = COALESCE(?, rol_id), updated_at = datetime('now')
     WHERE id = ?`
  ).run(nombre, email, activo ? 1 : 0, rolId, id);

  return obtenerUsuario(id);
}

/** Desactivar usuario (no se elimina físicamente, por trazabilidad de pedidos) */
export function desactivarUsuario(id: number) {
  const db = getDb();
  db.prepare(`UPDATE usuario SET activo = 0, updated_at = datetime('now') WHERE id = ?`).run(id);
  return obtenerUsuario(id);
}
