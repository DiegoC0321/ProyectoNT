#!/usr/bin/env node
/**
 * Configura la base de datos en tu proyecto Supabase:
 *  1. Lee DATABASE_URL de .env.local
 *  2. Aplica supabase/schema.sql (idempotente, CREATE ... IF NOT EXISTS)
 *  3. Siembra datos demo (solo si las tablas están vacías)
 *
 * Uso: npm run db:setup
 */

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// ------------------------------------------------------------
// 1) Cargar .env.local (formato CLAVE=VALOR, saltar comentarios)
// ------------------------------------------------------------
function loadDotEnv() {
  const envPath = path.join(root, '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('[db:setup] No existe .env.local con DATABASE_URL.');
    process.exit(1);
  }
  const env = {};
  for (const raw of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return env;
}

const env = loadDotEnv();
const conexion = env.DATABASE_URL;
if (!conexion) {
  console.error('[db:setup] Falta DATABASE_URL en .env.local.');
  process.exit(1);
}

const { Pool, types } = pg;
types.setTypeParser(20, Number);
types.setTypeParser(1700, Number);

// ---- Validación rápida de la cadena de conexión ---------------------------
function validarDsn() {
  let u;
  try {
    u = new URL(conexion);
  } catch (e) {
    console.error('[db:setup] DATABASE_URL no es una URL válida:', e.message);
    process.exit(1);
  }
  const avisos = [];
  if (!u.username) avisos.push('sin usuario (debería comenzar con postgresql://postgres.<ref>:<pass>@...)');
  if (!u.password) avisos.push('sin contraseña');
  if (/\b(?:db\.)?[a-z]{20,}\.supabase\.co$/i.test(u.hostname) && u.hostname !== `db.${u.hostname}`) {
    // host del proyecto vs host de BD
  }
  if (u.port && Number(u.port) === 5432 && /\.supabase\.co$/i.test(u.hostname)) avisos.push('puerto 5432 sugerido: usa el pooler (6543) o db.<ref>.supabase.co');
  if (/CAMBIAME|TU-|tu-proyecto|tu-password/i.test(conexion)) avisos.push('sigue siendo el placeholder de ejemplo (pon tu cadena real de Supabase en .env.local)');
  console.log(`[db:setup] Conectando a ${u.hostname}:${u.port || 5432} (usuario: ${u.username || '(vacío)'})`);
  if (avisos.length) {
    console.error('[db:setup] ADVERTENCIA sobre DATABASE_URL:');
    for (const a of avisos) console.error('  - ' + a);
    console.error('  La cadena debe verse así (Supabase -> Settings -> Database -> Connection string -> pestaña URI):');
    console.error('  postgresql://postgres.<REF>.aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require');
    console.error('  (o directa: postgresql://postgres:<PASSWORD>@db.<REF>.supabase.co:5432/postgres)');
  }
}
validarDsn();

// pg >= 8.13 interpreta sslmode=require como 'verify-full'; el pooler de
// Supabase usa su propia cadena CA, así que se usa TLS sin verificación.
function normalizarDsn(cadena) {
  try {
    const u = new URL(cadena);
    u.searchParams.delete('sslmode');
    return u.toString();
  } catch {
    return cadena;
  }
}

const pool = new Pool({
  connectionString: normalizarDsn(conexion),
  ssl: { rejectUnauthorized: false },
});

// ------------------------------------------------------------
// 2) Esquema
// ------------------------------------------------------------
async function crearEsquema() {
  const schemaSql = fs.readFileSync(path.join(root, 'supabase', 'schema.sql'), 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(schemaSql);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  console.log('[db:setup] Esquema aplicado.');
}

// ------------------------------------------------------------
// 3) Seed (idempotente)
// ------------------------------------------------------------
async function tableroVacia(tabla) {
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS n FROM ${tabla}`);
  return rows[0].n === 0;
}

async function seed() {
  // Roles
  if (await tableroVacia('rol')) {
    for (const nombre of ['CLIENTE', 'MESERO', 'COCINA', 'ADMINISTRADOR']) {
      await pool.query('INSERT INTO rol (nombre) VALUES ($1) ON CONFLICT (nombre) DO NOTHING', [nombre]);
    }
  }

  const rolId = async (nombre) => {
    const { rows } = await pool.query('SELECT id FROM rol WHERE nombre = $1', [nombre]);
    return rows[0].id;
  };

  // Usuarios demo
  if (await tableroVacia('usuario')) {
    const usuarios = [
      { nombre: 'Cliente Demo', email: 'cliente@demo.com', pass: 'Cliente123!', rol: 'CLIENTE' },
      { nombre: 'Mesero Demo', email: 'mesero@demo.com', pass: 'Mesero123!', rol: 'MESERO' },
      { nombre: 'Cocina Demo', email: 'cocina@demo.com', pass: 'Cocina123!', rol: 'COCINA' },
      { nombre: 'Admin Demo', email: 'admin@demo.com', pass: 'Admin123!', rol: 'ADMINISTRADOR' },
    ];
    for (const u of usuarios) {
      const password_hash = bcrypt.hashSync(u.pass, 10);
      await pool.query(
        `INSERT INTO usuario (nombre, email, password_hash, rol_id)
         VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING`,
        [u.nombre, u.email, password_hash, await rolId(u.rol)]
      );
    }
    console.log('[db:setup] Usuarios demo: cliente/demo, mesero/demo, cocina/demo, admin/demo.');
  }

  // Categorías
  let categorias = {};
  if (await tableroVacia('categoria')) {
    const cats = [
      ['Entradas', 'Platos para abrir el apetito'],
      ['Platos fuertes', 'Platos principales de la casa'],
      ['Bebidas', 'Bebidas frías y calientes'],
      ['Postres', 'Dulces para cerrar la comida'],
    ];
    for (const [nombre, descripcion] of cats) {
      await pool.query(
        'INSERT INTO categoria (nombre, descripcion) VALUES ($1, $2) ON CONFLICT (nombre) DO NOTHING',
        [nombre, descripcion]
      );
    }
    const { rows } = await pool.query('SELECT id, nombre FROM categoria');
    categorias = Object.fromEntries(rows.map((r) => [r.nombre, r.id]));
  }

  // Platillos
  if (await tableroVacia('platillo')) {
    if (Object.keys(categorias).length === 0) {
      const { rows } = await pool.query('SELECT id, nombre FROM categoria');
      categorias = Object.fromEntries(rows.map((r) => [r.nombre, r.id]));
    }
    const platillos = [
      ['Empanadas de carne', 'Tres unidades con ají casero', 12000, '/img/empanadas.jpg', 'Entradas'],
      ['Patacones con hogao', 'Plátano verde frito con salsa criolla', 14000, '/img/patacones.jpg', 'Entradas'],
      ['Bandeja paisa', 'Frijoles, arroz, carne molida, chicharrón, huevo y arepa', 32000, '/img/bandeja.jpg', 'Platos fuertes'],
      ['Pechuga a la plancha', 'Con ensalada y arroz', 26000, '/img/pechuga.jpg', 'Platos fuertes'],
      ['Trucha al ajillo', 'Trucha fresca con salsa de ajo', 30000, '/img/trucha.jpg', 'Platos fuertes'],
      ['Limonada de coco', 'Limonada natural con crema de coco', 9000, '/img/limonada.jpg', 'Bebidas'],
      ['Jugo de mora', 'Jugo natural en agua o leche', 7000, '/img/jugo.jpg', 'Bebidas'],
      ['Flan de caramelo', 'Postre casero de la casa', 8000, '/img/flan.jpg', 'Postres'],
      ['Brownie con helado', 'Brownie tibio con helado de vainilla', 11000, '/img/brownie.jpg', 'Postres'],
    ];
    for (const [nombre, descripcion, precio, imagen, cat] of platillos) {
      await pool.query(
        `INSERT INTO platillo (nombre, descripcion, precio, imagen_url, disponible, categoria_id)
         VALUES ($1, $2, $3, $4, true, $5)`,
        [nombre, descripcion, precio, imagen, categorias[cat] ?? null]
      );
    }
  }

  // Mesas (10, id coincide con numero en un proyecto recién creado)
  if (await tableroVacia('mesa')) {
    for (let i = 1; i <= 10; i++) {
      await pool.query(
        'INSERT INTO mesa (numero, capacidad, estado) VALUES ($1, $2, $3) ON CONFLICT (numero) DO NOTHING',
        [i, i % 3 === 0 ? 6 : 4, 'LIBRE']
      );
    }
  }

  // Ingredientes + inventario + recetas
  if (await tableroVacia('ingrediente')) {
    const base = [
      ['Carne de res', 'kg'],
      ['Plátano verde', 'unidad'],
      ['Frijoles', 'kg'],
      ['Arroz', 'kg'],
      ['Pechuga de pollo', 'kg'],
      ['Trucha', 'kg'],
      ['Limón', 'unidad'],
      ['Coco', 'unidad'],
      ['Mora', 'kg'],
      ['Leche', 'l'],
      ['Huevos', 'unidad'],
      ['Azúcar', 'kg'],
    ];
    for (const [nombre, unidad] of base) {
      await pool.query(
        'INSERT INTO ingrediente (nombre, unidad_medida) VALUES ($1, $2) ON CONFLICT (nombre) DO NOTHING',
        [nombre, unidad]
      );
    }

    const ingId = async (nombre) => {
      const { rows } = await pool.query('SELECT id FROM ingrediente WHERE nombre = $1', [nombre]);
      return rows[0].id;
    };

    if (await tableroVacia('inventario')) {
      const inv = [
        ['Carne de res', 20, 5],
        ['Plátano verde', 40, 10],
        ['Frijoles', 15, 5],
        ['Arroz', 25, 8],
        ['Pechuga de pollo', 3, 5], // bajo inventario a propósito (prueba RF12)
        ['Trucha', 8, 4],
        ['Limón', 60, 15],
        ['Coco', 10, 3],
        ['Mora', 12, 4],
        ['Leche', 18, 5],
        ['Huevos', 100, 24],
        ['Azúcar', 10, 3],
      ];
      for (const [nombre, actual, minima] of inv) {
        await pool.query(
          'INSERT INTO inventario (ingrediente_id, cantidad_actual, cantidad_minima) VALUES ($1, $2, $3)',
          [await ingId(nombre), actual, minima]
        );
      }
    }

    if (await tableroVacia('platillo_ingrediente')) {
      const platilloId = async (nombre) => {
        const { rows } = await pool.query('SELECT id FROM platillo WHERE nombre = $1', [nombre]);
        return rows[0].id;
      };
      const recetas = [
        ['Bandeja paisa', 'Carne de res', 0.2],
        ['Bandeja paisa', 'Frijoles', 0.15],
        ['Bandeja paisa', 'Arroz', 0.15],
        ['Bandeja paisa', 'Huevos', 1],
        ['Pechuga a la plancha', 'Pechuga de pollo', 0.25],
        ['Trucha al ajillo', 'Trucha', 0.3],
      ];
      for (const [platillo, ingrediente, cantidad] of recetas) {
        await pool.query(
          `INSERT INTO platillo_ingrediente (platillo_id, ingrediente_id, cantidad_requerida)
           VALUES ($1, $2, $3) ON CONFLICT (platillo_id, ingrediente_id) DO NOTHING`,
          [await platilloId(platillo), await ingId(ingrediente), cantidad]
        );
      }
    }
  }

  console.log('[db:setup] Datos de demostración listos.');
}

// ------------------------------------------------------------
async function main() {
  await crearEsquema();
  await seed();
  await pool.end();
  console.log('[db:setup] Listo. Ejecuta `npm run dev` para probar.');
}

main().catch((err) => {
  console.error('[db:setup] Error:');
  console.error(err);
  if (err && typeof err === 'object') {
    if (err.code) console.error('  code    :', err.code);
    if (err.hint) console.error('  hint    :', err.hint);
    if (err.detail) console.error('  detail  :', err.detail);
    if (err.message) console.error('  message :', err.message);
    if (err.stack) console.error('  stack   :', err.stack.split('\n').slice(0, 4).join('\n'));
  } else {
    console.error('  detalle :', String(err));
  }
  process.exit(1);
});