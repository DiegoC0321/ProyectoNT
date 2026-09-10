import { Pool, PoolClient, types } from 'pg';

/**
 * Capa de acceso a datos para PostgreSQL (Supabase).
 *
 * Reemplaza el anterior adaptador síncrono de SQLite. Los controllers ahora
 * son asíncronos y usan estos helpers:
 *
 *   await q(sql, params)          -> filas (T[])
 *   await qOne(sql, params)       -> primera fila o undefined
 *   await qRun(sql, params)       -> UPDATE/DELETE
 *   await qInsert(sql, params)    -> INSERT y devuelve el id generado
 *   await withTransaction(fn)     -> BEGIN/COMMIT/ROLLBACK con el mismo cliente
 *
 * Compatibilidad con el SQL previo de SQLite:
 *   - Los placeholders '?' se convierten automáticamente a $1, $2, ...
 *   - datetime('now') se convierte a NOW().
 */

declare global {
  // eslint-disable-next-line no-var
  var __restaurantePg: Pool | undefined;
}

// node-pg devuelve int8 y numeric como strings; en este dominio los ids y
// montos viven cómodamente dentro de Number (seguro mientras id < 2^53).
types.setTypeParser(20, Number); // int8 (ids, COUNT(*))
types.setTypeParser(1700, Number); // numeric (SUM/AVG)

/**
 * pg >= 8.13 trata sslmode=require como 'verify-full' (busca la CA del servidor
 * en las del sistema). El pooler de Supabase usa su propia cadena, así que se
 * quita sslmode de la URL y se fuerza TLS sin verificación de certificado.
 */
function normalizarDsn(conn: string): string {
  try {
    const u = new URL(conn);
    u.searchParams.delete('sslmode');
    return u.toString();
  } catch {
    return conn;
  }
}

function getPool(): Pool {
  const conn = process.env.DATABASE_URL;
  if (!conn) {
    throw new Error('Falta DATABASE_URL en .env.local (cadena de conexión de tu proyecto Supabase).');
  }
  if (!global.__restaurantePg) {
    global.__restaurantePg = new Pool({
      connectionString: normalizarDsn(conn),
      ssl: { rejectUnauthorized: false },
      max: 10,
      connectionTimeoutMillis: 5000,
    });
  }
  return global.__restaurantePg;
}

function preparar(sql: string): string {
  // Normalizar date de SQLite -> Postgres para las sentencias comunes.
  const texto = sql.replace(/datetime\('now'\)/g, 'NOW()');
  let n = 0;
  return texto.replace(/\?/g, () => `$${++n}`);
}

export interface DbTx {
  q: <T = any>(sql: string, params?: unknown[]) => Promise<T[]>;
  qOne: <T = any>(sql: string, params?: unknown[]) => Promise<T | undefined>;
  qRun: (sql: string, params?: unknown[]) => Promise<{ changes: number }>;
  qInsert: (sql: string, params?: unknown[]) => Promise<number>;
}

export async function q<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
  const res = await getPool().query<Record<string, unknown>>(preparar(sql), params);
  return res.rows as T[];
}

export async function qOne<T = any>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  const rows = await q<T>(sql, params);
  return rows[0];
}

export async function qRun(sql: string, params: unknown[] = []): Promise<{ changes: number }> {
  const res = await getPool().query(preparar(sql), params);
  return { changes: res.rowCount ?? 0 };
}

/** INSERT ... (RETURNING id) -> devuelve el id generado */
export async function qInsert(sql: string, params: unknown[] = []): Promise<number> {
  let texto = preparar(sql);
  if (!/\bRETURNING\b/i.test(texto)) texto += ' RETURNING id';
  const res = await getPool().query<{ id: number }>(texto, params);
  return Number(res.rows[0]?.id);
}

/** Ejecuta una función dentro de BEGIN/COMMIT/ROLLBACK usando un único cliente. */
export async function withTransaction<T>(fn: (tx: DbTx) => Promise<T>): Promise<T> {
  const client: PoolClient = await getPool().connect();
  const tx: DbTx = {
    q: async <U = any>(sql: string, params: unknown[] = []) =>
      (await client.query<Record<string, unknown>>(preparar(sql), params)).rows as U[],
    qOne: async <U = any>(sql: string, params: unknown[] = []) =>
      (await client.query<Record<string, unknown>>(preparar(sql), params)).rows[0] as U | undefined,
    qRun: async (sql: string, params: unknown[] = []) => {
      const res = await client.query(preparar(sql), params);
      return { changes: res.rowCount ?? 0 };
    },
    qInsert: async (sql: string, params: unknown[] = []) => {
      let texto = preparar(sql);
      if (!/\bRETURNING\b/i.test(texto)) texto += ' RETURNING id';
      const res = await client.query<{ id: number }>(texto, params);
      return Number(res.rows[0]?.id);
    },
  };
  try {
    await client.query('BEGIN');
    const resultado = await fn(tx);
    await client.query('COMMIT');
    return resultado;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // si ROLLBACK falla, la conexión quedó corrupta: se libera igualmente
    }
    throw err;
  } finally {
    client.release();
  }
}