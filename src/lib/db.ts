import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

/**
 * Conexión única (singleton) a la base de datos SQLite.
 * Se reutiliza en toda la aplicación (patrón MVW -> capa de acceso a datos).
 */

declare global {
  // eslint-disable-next-line no-var
  var __restauranteDb: Database.Database | undefined;
}

function createConnection(): Database.Database {
  const dbFile = process.env.DATABASE_FILE || './data/restaurante.db';
  const absolutePath = path.isAbsolute(dbFile) ? dbFile : path.join(process.cwd(), dbFile);

  const dir = path.dirname(absolutePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const isNewDatabase = !fs.existsSync(absolutePath);
  const db = new Database(absolutePath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Ejecuta siempre el esquema (todas las sentencias usan IF NOT EXISTS)
  const schemaPath = path.join(process.cwd(), 'src', 'lib', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);

  if (isNewDatabase) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { seedDatabase } = require('./seed');
    seedDatabase(db);
  }

  return db;
}

export function getDb(): Database.Database {
  if (!global.__restauranteDb) {
    global.__restauranteDb = createConnection();
  }
  return global.__restauranteDb;
}
