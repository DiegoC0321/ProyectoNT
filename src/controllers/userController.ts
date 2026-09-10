import bcrypt from 'bcryptjs';
import { q, qOne, qRun, qInsert } from '@/lib/db';
import type { RolNombre, UsuarioPublico } from '@/models/types';

interface UsuarioRow {
  id: number;
  nombre: string;
  email: string;
  activo: number;
  rol: RolNombre;
}

const USUARIO_QUERY = `
  SELECT u.id, u.nombre, u.email, u.activo, r.nombre as rol
  FROM usuario u JOIN rol r ON r.id = u.rol_id`;

function toPublico(row: UsuarioRow): UsuarioPublico {
  return { id: row.id, nombre: row.nombre, email: row.email, rol: row.rol, activo: !!row.activo };
}

export async function listarUsuarios(): Promise<UsuarioPublico[]> {
  const rows = await q<UsuarioRow>(USUARIO_QUERY + ' ORDER BY u.id DESC');
  return rows.map(toPublico);
}

/** RF15 — Crear empleados con rol MESERO, COCINA o ADMINISTRADOR */
export async function crearEmpleado(nombre: string, email: string, password: string, rol: RolNombre) {
  if (rol === 'CLIENTE') {
    throw new Error('Los clientes deben registrarse mediante el formulario público de registro.');
  }

  const existente = await qOne('SELECT id FROM usuario WHERE email = ?', [email]);
  if (existente) throw new Error('Ya existe un usuario con este correo electrónico.');

  const rolRow = await qOne<{ id: number }>('SELECT id FROM rol WHERE nombre = ?', [rol]);
  if (!rolRow) throw new Error('Rol inválido.');

  const hash = bcrypt.hashSync(password, 10);
  const id = await qInsert('INSERT INTO usuario (nombre, email, password_hash, rol_id) VALUES (?, ?, ?, ?)', [
    nombre,
    email,
    hash,
    rolRow.id,
  ]);

  return obtenerUsuario(id);
}

export async function obtenerUsuario(id: number): Promise<UsuarioPublico> {
  const row = await qOne<UsuarioRow>(USUARIO_QUERY + ' WHERE u.id = ?', [id]);
  if (!row) throw new Error('Usuario no encontrado.');
  return toPublico(row);
}

export async function actualizarUsuario(
  id: number,
  data: Partial<{ nombre: string; email: string; rol: RolNombre; activo: boolean }>
): Promise<UsuarioPublico> {
  const actual = await obtenerUsuario(id);

  const nombre = data.nombre ?? actual.nombre;
  const email = data.email ?? actual.email;
  const activo = data.activo ?? actual.activo;
  let rolId: number | null = null;

  if (data.rol) {
    const rolRow = await qOne<{ id: number }>('SELECT id FROM rol WHERE nombre = ?', [data.rol]);
    if (!rolRow) throw new Error('Rol inválido.');
    rolId = rolRow.id;
  }

  await qRun(
    `UPDATE usuario SET nombre = ?, email = ?, activo = ?, rol_id = COALESCE(?, rol_id), updated_at = NOW()
     WHERE id = ?`,
    [nombre, email, activo, rolId, id]
  );

  return obtenerUsuario(id);
}

/** Desactivar usuario (no se elimina físicamente, por trazabilidad de pedidos) */
export async function desactivarUsuario(id: number): Promise<UsuarioPublico> {
  await qRun('UPDATE usuario SET activo = false, updated_at = NOW() WHERE id = ?', [id]);
  return obtenerUsuario(id);
}