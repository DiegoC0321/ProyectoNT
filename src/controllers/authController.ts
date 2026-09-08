import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { signToken } from '@/lib/jwt';
import type { RolNombre, UsuarioPublico } from '@/models/types';

interface UsuarioRow {
  id: number;
  nombre: string;
  email: string;
  password_hash: string;
  activo: number;
  rol: RolNombre;
}

function toPublico(row: UsuarioRow): UsuarioPublico {
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    rol: row.rol,
    activo: !!row.activo,
  };
}

/** RF03 — Registro de clientes (auto-registro siempre crea rol CLIENTE) */
export function registrarCliente(nombre: string, email: string, password: string) {
  const db = getDb();

  const existente = db.prepare('SELECT id FROM usuario WHERE email = ?').get(email);
  if (existente) {
    throw new Error('Ya existe una cuenta registrada con este correo electrónico.');
  }

  const rolCliente = db.prepare("SELECT id FROM rol WHERE nombre = 'CLIENTE'").get() as { id: number };
  const hash = bcrypt.hashSync(password, 10);

  const info = db
    .prepare('INSERT INTO usuario (nombre, email, password_hash, rol_id) VALUES (?, ?, ?, ?)')
    .run(nombre, email, hash, rolCliente.id);

  const row = db
    .prepare(
      `SELECT u.id, u.nombre, u.email, u.password_hash, u.activo, r.nombre as rol
       FROM usuario u JOIN rol r ON r.id = u.rol_id WHERE u.id = ?`
    )
    .get(Number(info.lastInsertRowid)) as UsuarioRow;

  const usuario = toPublico(row);
  const token = signToken({ sub: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre });
  return { usuario, token };
}

/** Inicio de sesión válido para cualquier rol */
export function iniciarSesion(email: string, password: string) {
  const db = getDb();

  const row = db
    .prepare(
      `SELECT u.id, u.nombre, u.email, u.password_hash, u.activo, r.nombre as rol
       FROM usuario u JOIN rol r ON r.id = u.rol_id WHERE u.email = ?`
    )
    .get(email) as UsuarioRow | undefined;

  if (!row) {
    throw new Error('Credenciales inválidas.');
  }
  if (!row.activo) {
    throw new Error('Este usuario ha sido desactivado. Contacta al administrador.');
  }

  const passwordValida = bcrypt.compareSync(password, row.password_hash);
  if (!passwordValida) {
    throw new Error('Credenciales inválidas.');
  }

  const usuario = toPublico(row);
  const token = signToken({ sub: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre });
  return { usuario, token };
}

export function obtenerUsuarioPorId(id: number): UsuarioPublico | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT u.id, u.nombre, u.email, u.password_hash, u.activo, r.nombre as rol
       FROM usuario u JOIN rol r ON r.id = u.rol_id WHERE u.id = ?`
    )
    .get(id) as UsuarioRow | undefined;
  return row ? toPublico(row) : null;
}
