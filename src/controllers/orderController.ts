import { getDb } from '@/lib/db';
import type { Pedido, DetallePedido, EstadoPedido, OrigenPedido } from '@/models/types';
import { crearNotificacion } from '@/controllers/notificationController';

export interface ItemPedidoInput {
  platillo_id: number;
  cantidad: number;
}

export interface CrearPedidoInput {
  cliente_id?: number | null;
  mesero_id?: number | null;
  mesa_id?: number | null;
  origen: OrigenPedido;
  observaciones?: string;
  items: ItemPedidoInput[];
  /** RF10: si es false, el pedido queda como borrador editable/cancelable y NO se envía a cocina todavía. */
  confirmado?: boolean;
}

const TRANSICIONES_VALIDAS: Record<EstadoPedido, EstadoPedido[]> = {
  RECIBIDO: ['EN PREPARACION', 'CANCELADO'],
  'EN PREPARACION': ['LISTO', 'CANCELADO'],
  LISTO: ['ENTREGADO'],
  ENTREGADO: [],
  CANCELADO: [],
};

function adjuntarDetalles(pedido: Pedido): Pedido {
  const db = getDb();
  const detalles = db
    .prepare(
      `SELECT d.*, p.nombre as platillo_nombre
       FROM detalle_pedido d JOIN platillo p ON p.id = d.platillo_id
       WHERE d.pedido_id = ?`
    )
    .all(pedido.id) as DetallePedido[];
  return { ...pedido, detalles };
}

export function obtenerPedido(id: number): Pedido {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT pe.*, m.numero as mesa_numero
       FROM pedido pe LEFT JOIN mesa m ON m.id = pe.mesa_id
       WHERE pe.id = ?`
    )
    .get(id) as Pedido | undefined;
  if (!row) throw new Error('Pedido no encontrado.');
  return adjuntarDetalles(row);
}

export function listarPedidos(
  filtros: { clienteId?: number; estado?: EstadoPedido; mesaId?: number; meseroId?: number } = {}
): Pedido[] {
  const db = getDb();
  let query = `
    SELECT pe.*, m.numero as mesa_numero
    FROM pedido pe LEFT JOIN mesa m ON m.id = pe.mesa_id
    WHERE 1 = 1`;
  const params: unknown[] = [];

  if (filtros.clienteId) {
    query += ' AND pe.cliente_id = ?';
    params.push(filtros.clienteId);
  }
  if (filtros.estado) {
    query += ' AND pe.estado = ?';
    params.push(filtros.estado);
  }
  if (filtros.mesaId) {
    query += ' AND pe.mesa_id = ?';
    params.push(filtros.mesaId);
  }
  if (filtros.meseroId) {
    query += ' AND pe.mesero_id = ?';
    params.push(filtros.meseroId);
  }
  query += ' ORDER BY pe.created_at ASC';

  const rows = db.prepare(query).all(...params) as Pedido[];
  return rows.map(adjuntarDetalles);
}

/** RF04 / RF07 — Crear pedido (cliente o mesero) */
export function crearPedido(input: CrearPedidoInput): Pedido {
  if (!input.items || input.items.length === 0) {
    throw new Error('El pedido debe contener al menos un producto.');
  }
  const db = getDb();

  const crearTx = db.transaction(() => {
    let total = 0;
    const detallesCalculados: { platillo_id: number; cantidad: number; precio_unitario: number; subtotal: number }[] = [];

    if (input.mesa_id) {
      const mesa = db.prepare('SELECT id FROM mesa WHERE id = ?').get(input.mesa_id);
      if (!mesa) throw new Error('La mesa indicada no existe.');
    }

    for (const item of input.items) {
      const platillo = db
        .prepare('SELECT id, precio, disponible FROM platillo WHERE id = ?')
        .get(item.platillo_id) as { id: number; precio: number; disponible: number } | undefined;

      if (!platillo) throw new Error(`El platillo con id ${item.platillo_id} no existe.`);
      if (!platillo.disponible) throw new Error('Uno de los platillos seleccionados no está disponible.');
      if (item.cantidad <= 0) throw new Error('La cantidad debe ser mayor a cero.');

      const subtotal = platillo.precio * item.cantidad;
      total += subtotal;
      detallesCalculados.push({
        platillo_id: item.platillo_id,
        cantidad: item.cantidad,
        precio_unitario: platillo.precio,
        subtotal,
      });
    }

    const confirmado = input.confirmado === false ? 0 : 1;

    const infoPedido = db
      .prepare(
        `INSERT INTO pedido (cliente_id, mesero_id, mesa_id, origen, estado, observaciones, total, confirmado)
         VALUES (?, ?, ?, ?, 'RECIBIDO', ?, ?, ?)`
      )
      .run(
        input.cliente_id ?? null,
        input.mesero_id ?? null,
        input.mesa_id ?? null,
        input.origen,
        input.observaciones ?? null,
        total,
        confirmado
      );

    const pedidoId = Number(infoPedido.lastInsertRowid);
    const insertDetalle = db.prepare(
      `INSERT INTO detalle_pedido (pedido_id, platillo_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)`
    );
    for (const d of detallesCalculados) {
      insertDetalle.run(pedidoId, d.platillo_id, d.cantidad, d.precio_unitario, d.subtotal);
    }

    if (confirmado && input.mesa_id) {
      db.prepare(`UPDATE mesa SET estado = 'PEDIDO EN CURSO' WHERE id = ?`).run(input.mesa_id);
    }

    if (confirmado) {
      // Notificar a cocina (todos los usuarios con rol COCINA) que llegó un pedido nuevo
      const cocineros = db
        .prepare(`SELECT u.id FROM usuario u JOIN rol r ON r.id = u.rol_id WHERE r.nombre = 'COCINA' AND u.activo = 1`)
        .all() as { id: number }[];
      for (const c of cocineros) {
        crearNotificacion(c.id, pedidoId, 'PEDIDO_NUEVO', `Nuevo pedido #${pedidoId} recibido.`);
      }
    }

    return pedidoId;
  });

  const pedidoId = crearTx();
  return obtenerPedido(pedidoId);
}

/** RF10 — Editar pedido, únicamente si no ha sido confirmado/enviado a cocina */
export function actualizarPedido(id: number, items: ItemPedidoInput[], observaciones?: string): Pedido {
  const db = getDb();
  const pedido = obtenerPedido(id);

  if (pedido.confirmado) {
    throw new Error('El pedido ya fue confirmado y enviado a cocina; no puede modificarse.');
  }

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM detalle_pedido WHERE pedido_id = ?').run(id);
    let total = 0;
    const insertDetalle = db.prepare(
      `INSERT INTO detalle_pedido (pedido_id, platillo_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)`
    );
    for (const item of items) {
      const platillo = db.prepare('SELECT precio FROM platillo WHERE id = ?').get(item.platillo_id) as
        | { precio: number }
        | undefined;
      if (!platillo) throw new Error(`El platillo con id ${item.platillo_id} no existe.`);
      const subtotal = platillo.precio * item.cantidad;
      total += subtotal;
      insertDetalle.run(id, item.platillo_id, item.cantidad, platillo.precio, subtotal);
    }
    db.prepare(`UPDATE pedido SET total = ?, observaciones = ?, updated_at = datetime('now') WHERE id = ?`).run(
      total,
      observaciones ?? pedido.observaciones ?? null,
      id
    );
  });
  tx();

  return obtenerPedido(id);
}

/** RF10 — Confirmar y enviar a cocina un pedido en borrador (creado por un mesero) */
export function confirmarPedido(id: number): Pedido {
  const pedido = obtenerPedido(id);
  if (pedido.confirmado) {
    throw new Error('El pedido ya fue confirmado previamente.');
  }
  const db = getDb();
  db.prepare(`UPDATE pedido SET confirmado = 1, updated_at = datetime('now') WHERE id = ?`).run(id);

  if (pedido.mesa_id) {
    db.prepare(`UPDATE mesa SET estado = 'PEDIDO EN CURSO' WHERE id = ?`).run(pedido.mesa_id);
  }

  const cocineros = db
    .prepare(`SELECT u.id FROM usuario u JOIN rol r ON r.id = u.rol_id WHERE r.nombre = 'COCINA' AND u.activo = 1`)
    .all() as { id: number }[];
  for (const c of cocineros) {
    crearNotificacion(c.id, id, 'PEDIDO_NUEVO', `Nuevo pedido #${id} recibido.`);
  }

  return obtenerPedido(id);
}

/** RF10 — Cancelar pedido no confirmado */
export function cancelarPedido(id: number) {
  const pedido = obtenerPedido(id);
  if (pedido.confirmado) {
    throw new Error('El pedido ya fue confirmado y enviado a cocina; no puede cancelarse desde este módulo.');
  }
  const db = getDb();
  db.prepare(`UPDATE pedido SET estado = 'CANCELADO', updated_at = datetime('now') WHERE id = ?`).run(id);
  return obtenerPedido(id);
}

/** RF05 / RF17 — Actualizar estado del pedido (cocina) con notificación a mesero y cliente (RF09) */
export function actualizarEstadoPedido(id: number, nuevoEstado: EstadoPedido): Pedido {
  const pedido = obtenerPedido(id);
  const permitidos = TRANSICIONES_VALIDAS[pedido.estado];

  if (!permitidos.includes(nuevoEstado)) {
    throw new Error(`Transición inválida: no se puede pasar de "${pedido.estado}" a "${nuevoEstado}".`);
  }

  const db = getDb();
  db.prepare(`UPDATE pedido SET estado = ?, updated_at = datetime('now') WHERE id = ?`).run(nuevoEstado, id);

  if (nuevoEstado === 'LISTO') {
    if (pedido.mesero_id) {
      crearNotificacion(pedido.mesero_id, id, 'PEDIDO_LISTO', `El pedido #${id} está listo para entregar.`);
    }
    if (pedido.cliente_id) {
      crearNotificacion(pedido.cliente_id, id, 'PEDIDO_LISTO', `¡Tu pedido #${id} está listo!`);
    }
  }

  if (nuevoEstado === 'ENTREGADO' && pedido.mesa_id) {
    db.prepare(`UPDATE mesa SET estado = 'LIBRE' WHERE id = ?`).run(pedido.mesa_id);
  }

  return obtenerPedido(id);
}

/** RF16 — Pedidos entrantes para cocina, en orden de llegada */
export function listarPedidosCocina(): Pedido[] {
  return listarPedidos().filter((p) => p.estado === 'RECIBIDO' || p.estado === 'EN PREPARACION');
}

/** RF06 — Historial de pedidos del cliente */
export function historialCliente(clienteId: number): Pedido[] {
  return listarPedidos({ clienteId }).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/** RF06 — Repetir un pedido anterior (crea uno nuevo con los mismos productos) */
export function repetirPedido(pedidoId: number, clienteId: number): Pedido {
  const original = obtenerPedido(pedidoId);
  if (original.cliente_id !== clienteId) {
    throw new Error('No puedes repetir un pedido que no te pertenece.');
  }
  const items = (original.detalles ?? []).map((d) => ({ platillo_id: d.platillo_id, cantidad: d.cantidad }));
  return crearPedido({ cliente_id: clienteId, origen: 'CLIENTE', items });
}
