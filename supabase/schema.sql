-- =========================================================
-- Sistema de Gestión de Restaurante Inteligente
-- Esquema de base de datos relacional para PostgreSQL (Supabase)
-- Ejecutar en: Supabase Dashboard -> SQL Editor
-- idempotente: todas las sentencias usan IF NOT EXISTS
-- =========================================================

-- -------------------------------------------------
-- Roles
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS rol (
  id          SERIAL PRIMARY KEY,
  nombre      TEXT NOT NULL UNIQUE CHECK (nombre IN ('CLIENTE','MESERO','COCINA','ADMINISTRADOR'))
);

-- -------------------------------------------------
-- Usuarios
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS usuario (
  id            SERIAL PRIMARY KEY,
  nombre        TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol_id        INTEGER NOT NULL,
  activo        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (rol_id) REFERENCES rol(id)
);

-- -------------------------------------------------
-- Categorías del menú
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS categoria (
  id          SERIAL PRIMARY KEY,
  nombre      TEXT NOT NULL UNIQUE,
  descripcion TEXT
);

-- -------------------------------------------------
-- Platillos (menú digital) - RF01 / RF14
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS platillo (
  id           SERIAL PRIMARY KEY,
  nombre       TEXT NOT NULL,
  descripcion  TEXT,
  precio       NUMERIC NOT NULL CHECK (precio >= 0),
  imagen_url   TEXT,
  disponible   BOOLEAN NOT NULL DEFAULT TRUE,
  categoria_id INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (categoria_id) REFERENCES categoria(id)
);

-- -------------------------------------------------
-- Mesas - RF08
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS mesa (
  id        SERIAL PRIMARY KEY,
  numero    INTEGER NOT NULL UNIQUE,
  capacidad INTEGER NOT NULL DEFAULT 4,
  estado    TEXT NOT NULL DEFAULT 'LIBRE' CHECK (estado IN ('LIBRE','OCUPADA','PEDIDO EN CURSO'))
);

-- -------------------------------------------------
-- Pedidos - RF04 / RF05 / RF07
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS pedido (
  id            SERIAL PRIMARY KEY,
  cliente_id    INTEGER,              -- usuario con rol CLIENTE (nullable si lo crea un mesero sin cliente registrado)
  mesero_id     INTEGER,              -- usuario con rol MESERO (nullable si el pedido lo hizo el cliente directamente)
  mesa_id       INTEGER,
  origen        TEXT NOT NULL DEFAULT 'CLIENTE' CHECK (origen IN ('CLIENTE','MESERO')),
  estado        TEXT NOT NULL DEFAULT 'RECIBIDO' CHECK (estado IN ('RECIBIDO','EN PREPARACION','LISTO','ENTREGADO','CANCELADO')),
  observaciones TEXT,
  total         NUMERIC NOT NULL DEFAULT 0,
  confirmado    BOOLEAN NOT NULL DEFAULT FALSE, -- RF10: solo editable si no está confirmado
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (cliente_id) REFERENCES usuario(id),
  FOREIGN KEY (mesero_id)  REFERENCES usuario(id),
  FOREIGN KEY (mesa_id)    REFERENCES mesa(id)
);

-- -------------------------------------------------
-- Detalle de pedido (relación N:M entre pedido y platillo)
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_pedido (
  id              SERIAL PRIMARY KEY,
  pedido_id       INTEGER NOT NULL,
  platillo_id     INTEGER NOT NULL,
  cantidad        INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC NOT NULL CHECK (precio_unitario >= 0),
  subtotal        NUMERIC NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedido(id) ON DELETE CASCADE,
  FOREIGN KEY (platillo_id) REFERENCES platillo(id)
);

-- -------------------------------------------------
-- Ingredientes
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS ingrediente (
  id               SERIAL PRIMARY KEY,
  nombre           TEXT NOT NULL UNIQUE,
  codigo_de_barras TEXT,
  unidad_medida    TEXT NOT NULL DEFAULT 'unidad'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ingrediente_codigo_barras
  ON ingrediente(codigo_de_barras)
  WHERE codigo_de_barras IS NOT NULL;

-- -------------------------------------------------
-- Relación N:M platillo <-> ingrediente (receta)
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS platillo_ingrediente (
  platillo_id         INTEGER NOT NULL,
  ingrediente_id      INTEGER NOT NULL,
  cantidad_requerida  NUMERIC NOT NULL DEFAULT 0,
  PRIMARY KEY (platillo_id, ingrediente_id),
  FOREIGN KEY (platillo_id) REFERENCES platillo(id) ON DELETE CASCADE,
  FOREIGN KEY (ingrediente_id) REFERENCES ingrediente(id) ON DELETE CASCADE
);

-- -------------------------------------------------
-- Inventario - RF12
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS inventario (
  id               SERIAL PRIMARY KEY,
  ingrediente_id   INTEGER NOT NULL UNIQUE,
  cantidad_actual  NUMERIC NOT NULL DEFAULT 0,
  cantidad_minima  NUMERIC NOT NULL DEFAULT 0,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (ingrediente_id) REFERENCES ingrediente(id) ON DELETE CASCADE
);

-- -------------------------------------------------
-- Notificaciones - RF09 / RF17
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS notificacion (
  id         SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL,
  pedido_id  INTEGER,
  tipo       TEXT NOT NULL DEFAULT 'INFO' CHECK (tipo IN ('INFO','PEDIDO_LISTO','PEDIDO_NUEVO','STOCK_BAJO')),
  mensaje    TEXT NOT NULL,
  leida      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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