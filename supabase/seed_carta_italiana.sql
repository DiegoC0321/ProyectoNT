-- =========================================================
-- Carta italiana oficial (Trattoria del Vicolo)
-- Reemplaza las categorías y platillos actuales por la carta
-- italiana del diseño. Idempotente: borra y vuelve a sembrar
-- Ejecutar en: Supabase Dashboard -> SQL Editor
-- =========================================================
BEGIN;

-- Limpiar datos dependientes (en orden de claves foráneas)
DELETE FROM detalle_pedido;
DELETE FROM pedido;
DELETE FROM notificacion;
DELETE FROM platillo_ingrediente;
DELETE FROM platillo;
DELETE FROM categoria;

-- Reiniciar secuencias para ids limpios
SELECT setval('categoria_id_seq', 1, false);
SELECT setval('platillo_id_seq', 1, false);
SELECT setval('detalle_pedido_id_seq', 1, false);
SELECT setval('pedido_id_seq', 1, false);
SELECT setval('notificacion_id_seq', 1, false);

-- Categorías
INSERT INTO categoria (nombre, descripcion) VALUES
  ('Pastas', 'Pasta fresca fatta a mano'),
  ('Carnes', 'Carne e secondi'),
  ('Postres', 'Dolci fatti in casa');

-- Platillos de la carta italiana
INSERT INTO platillo (nombre, descripcion, precio, disponible, categoria_id) VALUES
  ('Spaghetti al pomodoro',    'la ricetta di nonna',          24000, TRUE, (SELECT id FROM categoria WHERE nombre = 'Pastas')),
  ('Lasagna della nonna',      'il più amato',                 38000, TRUE, (SELECT id FROM categoria WHERE nombre = 'Pastas')),
  ('Penne all''arrabbiata',    'piccante e saporito',          26000, TRUE, (SELECT id FROM categoria WHERE nombre = 'Pastas')),
  ('Fettuccine Alfredo',       'salsa de crema y queso',       28000, TRUE, (SELECT id FROM categoria WHERE nombre = 'Pastas')),
  ('Ravioli di ricotta',       'relleno de queso fresco',      32000, TRUE, (SELECT id FROM categoria WHERE nombre = 'Pastas')),
  ('Ossobuco alla milanese',   'con risotto al azafrán',       58000, TRUE, (SELECT id FROM categoria WHERE nombre = 'Carnes')),
  ('Costiletas a la parmesana','empanadas en tomate',          52000, TRUE, (SELECT id FROM categoria WHERE nombre = 'Carnes')),
  ('Saltimbocca alla romana',  'jamón y salvia',               48000, TRUE, (SELECT id FROM categoria WHERE nombre = 'Carnes')),
  ('Panna cotta',              'con frutos rojos',             16000, TRUE, (SELECT id FROM categoria WHERE nombre = 'Postres')),
  ('Tiramisu clásico',         'la receta tradicional',        14000, TRUE, (SELECT id FROM categoria WHERE nombre = 'Postres')),
  ('Zabaglione',               'mousse de vino dulce',         12000, TRUE, (SELECT id FROM categoria WHERE nombre = 'Postres'));

COMMIT;