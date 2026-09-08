-- =========================================================
-- Sistema de Gestión de Restaurante Inteligente
-- Esquema de base de datos relacional (SQLite)
-- =========================================================

PRAGMA foreign_keys = ON;

-- -------------------------------------------------
-- Roles
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS rol (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre      TEXT NOT NULL UNIQUE CHECK (nombre IN ('CLIENTE','MESERO','COCINA','ADMINISTRADOR'))
);

-- -------------------------------------------------
-- Usuarios
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS usuario (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre        TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol_id        INTEGER NOT NULL,
  activo        INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0,1)),
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (rol_id) REFERENCES rol(id)
);

-- -------------------------------------------------
-- Categorías del menú
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS categoria (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre      TEXT NOT NULL UNIQUE,
  descripcion TEXT
);

-- -------------------------------------------------
-- Platillos (menú digital) - RF01 / RF14
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS platillo (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre       TEXT NOT NULL,
  descripcion  TEXT,
  precio       REAL NOT NULL CHECK (precio >= 0),
  imagen_url   TEXT,
  disponible   INTEGER NOT NULL DEFAULT 1 CHECK (disponible IN (0,1)),
  categoria_id INTEGER,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (categoria_id) REFERENCES categoria(id)
);

-- -------------------------------------------------
-- Mesas - RF08
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS mesa (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  numero    INTEGER NOT NULL UNIQUE,
  capacidad INTEGER NOT NULL DEFAULT 4,
  estado    TEXT NOT NULL DEFAULT 'LIBRE' CHECK (estado IN ('LIBRE','OCUPADA','PEDIDO EN CURSO'))
);

-- -------------------------------------------------
-- Pedidos - RF04 / RF05 / RF07
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS pedido (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id    INTEGER,              -- usuario con rol CLIENTE (nullable si lo crea un mesero sin cliente registrado)
  mesero_id     INTEGER,              -- usuario con rol MESERO (nullable si el pedido lo hizo el cliente directamente)
  mesa_id       INTEGER,
  origen        TEXT NOT NULL DEFAULT 'CLIENTE' CHECK (origen IN ('CLIENTE','MESERO')),
  estado        TEXT NOT NULL DEFAULT 'RECIBIDO' CHECK (estado IN ('RECIBIDO','EN PREPARACION','LISTO','ENTREGADO','CANCELADO')),
  observaciones TEXT,
  total         REAL NOT NULL DEFAULT 0,
  confirmado    INTEGER NOT NULL DEFAULT 0 CHECK (confirmado IN (0,1)), -- RF10: solo editable si no está confirmado
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (cliente_id) REFERENCES usuario(id),
  FOREIGN KEY (mesero_id)  REFERENCES usuario(id),
  FOREIGN KEY (mesa_id)    REFERENCES mesa(id)
);

-- -------------------------------------------------
-- Detalle de pedido (relación N:M entre pedido y platillo)
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_pedido (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id       INTEGER NOT NULL,
  platillo_id     INTEGER NOT NULL,
  cantidad        INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario REAL NOT NULL CHECK (precio_unitario >= 0),
  subtotal        REAL NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedido(id) ON DELETE CASCADE,
  FOREIGN KEY (platillo_id) REFERENCES platillo(id)
);

-- -------------------------------------------------
-- Ingredientes
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS ingrediente (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre        TEXT NOT NULL UNIQUE,
  unidad_medida TEXT NOT NULL DEFAULT 'unidad'
);

-- -------------------------------------------------
-- Relación N:M platillo <-> ingrediente (receta)
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS platillo_ingrediente (
  platillo_id         INTEGER NOT NULL,
  ingrediente_id      INTEGER NOT NULL,
  cantidad_requerida  REAL NOT NULL DEFAULT 0,
  PRIMARY KEY (platillo_id, ingrediente_id),
  FOREIGN KEY (platillo_id) REFERENCES platillo(id) ON DELETE CASCADE,
  FOREIGN KEY (ingrediente_id) REFERENCES ingrediente(id) ON DELETE CASCADE
);

-- -------------------------------------------------
-- Inventario - RF12
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS inventario (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  ingrediente_id   INTEGER NOT NULL UNIQUE,
  cantidad_actual  REAL NOT NULL DEFAULT 0,
  cantidad_minima  REAL NOT NULL DEFAULT 0,
  updated_at       TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (ingrediente_id) REFERENCES ingrediente(id) ON DELETE CASCADE
);

-- -------------------------------------------------
-- Notificaciones - RF09 / RF17
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS notificacion (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  pedido_id  INTEGER,
  tipo       TEXT NOT NULL DEFAULT 'INFO' CHECK (tipo IN ('INFO','PEDIDO_LISTO','PEDIDO_NUEVO','STOCK_BAJO')),
  mensaje    TEXT NOT NULL,
  leida      INTEGER NOT NULL DEFAULT 0 CHECK (leida IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
  FOREIGN KEY (pedido_id) REFERENCES pedido(id) ON DELETE SET NULL
);

-- -------------------------------------------------
-- Índices útiles
-- -------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_pedido_estado ON pedido(estado);
CREATE INDEX IF NOT EXISTS idx_pedido_cliente ON pedido(cliente_id);
CREATE INDEX IF NOT EXISTS idx_detalle_pedido_pedido ON detalle_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_notificacion_usuario ON notificacion(usuario_id, leida);
CREATE INDEX IF NOT EXISTS idx_platillo_categoria ON platillo(categoria_id);
