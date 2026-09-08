import bcrypt from 'bcryptjs';
import type Database from 'better-sqlite3';

/**
 * Carga datos iniciales de demostración: roles, usuarios (uno por rol),
 * categorías, platillos, mesas, ingredientes e inventario.
 * Se ejecuta automáticamente la primera vez que se crea el archivo de BD.
 */
export function seedDatabase(db: Database.Database) {
  const insertRol = db.prepare('INSERT INTO rol (nombre) VALUES (?)');
  const roles = ['CLIENTE', 'MESERO', 'COCINA', 'ADMINISTRADOR'];
  const rolIds: Record<string, number> = {};
  for (const nombre of roles) {
    const info = insertRol.run(nombre);
    rolIds[nombre] = Number(info.lastInsertRowid);
  }

  const hash = (pwd: string) => bcrypt.hashSync(pwd, 10);
  const insertUsuario = db.prepare(
    `INSERT INTO usuario (nombre, email, password_hash, rol_id) VALUES (?, ?, ?, ?)`
  );
  insertUsuario.run('Cliente Demo', 'cliente@demo.com', hash('Cliente123!'), rolIds['CLIENTE']);
  insertUsuario.run('Mesero Demo', 'mesero@demo.com', hash('Mesero123!'), rolIds['MESERO']);
  insertUsuario.run('Cocina Demo', 'cocina@demo.com', hash('Cocina123!'), rolIds['COCINA']);
  insertUsuario.run('Admin Demo', 'admin@demo.com', hash('Admin123!'), rolIds['ADMINISTRADOR']);

  const insertCategoria = db.prepare('INSERT INTO categoria (nombre, descripcion) VALUES (?, ?)');
  const catEntradas = insertCategoria.run('Entradas', 'Platos para abrir el apetito');
  const catFuertes = insertCategoria.run('Platos fuertes', 'Platos principales de la casa');
  const catBebidas = insertCategoria.run('Bebidas', 'Bebidas frías y calientes');
  const catPostres = insertCategoria.run('Postres', 'Dulces para cerrar la comida');

  const insertPlatillo = db.prepare(
    `INSERT INTO platillo (nombre, descripcion, precio, imagen_url, disponible, categoria_id)
     VALUES (?, ?, ?, ?, 1, ?)`
  );
  const platillos = [
    ['Empanadas de carne', 'Tres unidades con ají casero', 12000, '/img/empanadas.jpg', catEntradas.lastInsertRowid],
    ['Patacones con hogao', 'Plátano verde frito con salsa criolla', 14000, '/img/patacones.jpg', catEntradas.lastInsertRowid],
    ['Bandeja paisa', 'Frijoles, arroz, carne molida, chicharrón, huevo y arepa', 32000, '/img/bandeja.jpg', catFuertes.lastInsertRowid],
    ['Pechuga a la plancha', 'Con ensalada y arroz', 26000, '/img/pechuga.jpg', catFuertes.lastInsertRowid],
    ['Trucha al ajillo', 'Trucha fresca con salsa de ajo', 30000, '/img/trucha.jpg', catFuertes.lastInsertRowid],
    ['Limonada de coco', 'Limonada natural con crema de coco', 9000, '/img/limonada.jpg', catBebidas.lastInsertRowid],
    ['Jugo de mora', 'Jugo natural en agua o leche', 7000, '/img/jugo.jpg', catBebidas.lastInsertRowid],
    ['Flan de caramelo', 'Postre casero de la casa', 8000, '/img/flan.jpg', catPostres.lastInsertRowid],
    ['Brownie con helado', 'Brownie tibio con helado de vainilla', 11000, '/img/brownie.jpg', catPostres.lastInsertRowid],
  ] as const;
  const platilloIds: number[] = [];
  for (const p of platillos) {
    const info = insertPlatillo.run(...p);
    platilloIds.push(Number(info.lastInsertRowid));
  }

  const insertMesa = db.prepare('INSERT INTO mesa (numero, capacidad, estado) VALUES (?, ?, ?)');
  for (let i = 1; i <= 10; i++) {
    insertMesa.run(i, i % 3 === 0 ? 6 : 4, 'LIBRE');
  }

  const insertIngrediente = db.prepare('INSERT INTO ingrediente (nombre, unidad_medida) VALUES (?, ?)');
  const ingredientesBase = [
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
  ] as const;
  const ingredienteIds: Record<string, number> = {};
  for (const [nombre, unidad] of ingredientesBase) {
    const info = insertIngrediente.run(nombre, unidad);
    ingredienteIds[nombre] = Number(info.lastInsertRowid);
  }

  const insertInventario = db.prepare(
    `INSERT INTO inventario (ingrediente_id, cantidad_actual, cantidad_minima) VALUES (?, ?, ?)`
  );
  insertInventario.run(ingredienteIds['Carne de res'], 20, 5);
  insertInventario.run(ingredienteIds['Plátano verde'], 40, 10);
  insertInventario.run(ingredienteIds['Frijoles'], 15, 5);
  insertInventario.run(ingredienteIds['Arroz'], 25, 8);
  insertInventario.run(ingredienteIds['Pechuga de pollo'], 3, 5); // bajo inventario a propósito
  insertInventario.run(ingredienteIds['Trucha'], 8, 4);
  insertInventario.run(ingredienteIds['Limón'], 60, 15);
  insertInventario.run(ingredienteIds['Coco'], 10, 3);
  insertInventario.run(ingredienteIds['Mora'], 12, 4);
  insertInventario.run(ingredienteIds['Leche'], 18, 5);
  insertInventario.run(ingredienteIds['Huevos'], 100, 24);
  insertInventario.run(ingredienteIds['Azúcar'], 10, 3);

  const insertReceta = db.prepare(
    `INSERT INTO platillo_ingrediente (platillo_id, ingrediente_id, cantidad_requerida) VALUES (?, ?, ?)`
  );
  insertReceta.run(platilloIds[2], ingredienteIds['Carne de res'], 0.2);
  insertReceta.run(platilloIds[2], ingredienteIds['Frijoles'], 0.15);
  insertReceta.run(platilloIds[2], ingredienteIds['Arroz'], 0.15);
  insertReceta.run(platilloIds[2], ingredienteIds['Huevos'], 1);
  insertReceta.run(platilloIds[3], ingredienteIds['Pechuga de pollo'], 0.25);
  insertReceta.run(platilloIds[4], ingredienteIds['Trucha'], 0.3);

  // eslint-disable-next-line no-console
  console.log('[seed] Base de datos inicializada con datos de demostración.');
}
