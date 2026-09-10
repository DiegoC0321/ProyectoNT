import bcrypt from 'bcryptjs';
import { q, qOne } from '@/lib/db';
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

const USUARIO_QUERY = `
  SELECT u.id, u.nombre, u.email, u.password_hash, u.activo, r.nombre as rol
  FROM usuario u JOIN rol r ON r.id = u.rol_id`;

function toPublico(row: UsuarioRow): UsuarioPublico {
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    rol: row.rol,
    activo: !!row.activo,
  };
}

async function obtenerUsuarioRowPorId(id: number): Promise<UsuarioRow | undefined> {
  return qOne<UsuarioRow>(USUARIO_QUERY + ' WHERE u.id = ?', [id]);
}

async function obtenerUsuarioRowPorEmail(email: string): Promise<UsuarioRow | undefined> {
  return qOne<UsuarioRow>(USUARIO_QUERY + ' WHERE u.email = ?', [email]);
}

/** RF03 — Registro de clientes (auto-registro siempre crea rol CLIENTE) */
export async function registrarCliente(nombre: string, email: string, password: string) {
  const existente = await qOne('SELECT id FROM usuario WHERE email = ?', [email]);
  if (existente) {
    throw new Error('Ya existe una cuenta registrada con este correo electrónico.');
  }

  const rolCliente = await qOne<{ id: number }>("SELECT id FROM rol WHERE nombre = 'CLIENTE'");
  if (!rolCliente) throw new Error('Rol CLIENTE no configurado.');

  const hash = bcrypt.hashSync(password, 10);
  const ids = await q<{ id: number }>(
    'INSERT INTO usuario (nombre, email, password_hash, rol_id) VALUES (?, ?, ?, ?) RETURNING id',
    [nombre, email, hash, rolCliente.id]
  );
  const clienteId = ids[0].id;

  const row = await obtenerUsuarioRowPorId(clienteId);
  if (!row) throw new Error('No se pudo crear el usuario.');

  const usuario = toPublico(row);
  const token = signToken({ sub: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre });
  return { usuario, token };
}

/** Inicio de sesión válido para cualquier rol */
export async function iniciarSesion(email: string, password: string) {
  const row = await obtenerUsuarioRowPorEmail(email);
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

export async function obtenerUsuarioPorId(id: number): Promise<UsuarioPublico | null> {
  const row = await obtenerUsuarioRowPorId(id);
  return row ? toPublico(row) : null;
}