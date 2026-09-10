import { q, qOne, qRun, qInsert, withTransaction } from '@/lib/db';
import type { DbTx } from '@/lib/db';
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

async function adjuntarDetalles(pedido: Pedido): Promise<Pedido> {
  const detalles = await q<DetallePedido>(
    `SELECT d.*, p.nombre as platillo_nombre
     FROM detalle_pedido d JOIN platillo p ON p.id = d.platillo_id
     WHERE d.pedido_id = ?`,
    [pedido.id]
  );
  return { ...pedido, detalles };
}

export async function obtenerPedido(id: number): Promise<Pedido> {
  const row = await qOne<Pedido>(
    `SELECT pe.*, m.numero as mesa_numero
     FROM pedido pe LEFT JOIN mesa m ON m.id = pe.mesa_id
     WHERE pe.id = ?`,
    [id]
  );
  if (!row) throw new Error('Pedido no encontrado.');
  return adjuntarDetalles(row);
}

export async function listarPedidos(
  filtros: {
    clienteId?: number;
    estado?: EstadoPedido;
    mesaId?: number;
    meseroId?: number;
    confirmado?: 0 | 1;
  } = {}
): Promise<Pedido[]> {
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
  if (filtros.confirmado !== undefined) {
    query += ' AND pe.confirmado = ?';
    params.push(!!filtros.confirmado);
  }
  query += ' ORDER BY pe.created_at ASC';

  const rows = await q<Pedido>(query, params);
  const conDetalles: Pedido[] = [];
  for (const p of rows) {
    conDetalles.push(await adjuntarDetalles(p));
  }
  return conDetalles;
}

/** RF04 / RF07 — Crear pedido (cliente o mesero) */
export async function crearPedido(input: CrearPedidoInput): Promise<Pedido> {
  if (!input.items || input.items.length === 0) {
    throw new Error('El pedido debe contener al menos un producto.');
  }

  const confirmado = input.confirmado !== false;

  const pedidoId = await withTransaction(async (tx: DbTx) => {
    let total = 0;
    const detallesCalculados: { platillo_id: number; cantidad: number; precio_unitario: number; subtotal: number }[] = [];

    if (input.mesa_id) {
      const mesa = await tx.qOne('SELECT id FROM mesa WHERE id = ?', [input.mesa_id]);
      if (!mesa) throw new Error('La mesa indicada no existe.');
    }

    for (const item of input.items) {
      const platillo = await tx.qOne<{ id: number; precio: number; disponible: boolean }>(
        'SELECT id, precio, disponible FROM platillo WHERE id = ?',
        [item.platillo_id]
      );

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

    const id = await tx.qInsert(
      `INSERT INTO pedido (cliente_id, mesero_id, mesa_id, origen, estado, observaciones, total, confirmado)
       VALUES (?, ?, ?, ?, 'RECIBIDO', ?, ?, ?)`,
      [
        input.cliente_id ?? null,
        input.mesero_id ?? null,
        input.mesa_id ?? null,
        input.origen,
        input.observaciones ?? null,
        total,
        confirmado,
      ]
    );

    for (const d of detallesCalculados) {
      await tx.qRun(
        `INSERT INTO detalle_pedido (pedido_id, platillo_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)`,
        [id, d.platillo_id, d.cantidad, d.precio_unitario, d.subtotal]
      );
    }

    if (confirmado && input.mesa_id) {
      await tx.qRun(`UPDATE mesa SET estado = 'PEDIDO EN CURSO' WHERE id = ?`, [input.mesa_id]);
    }

    return id;
  });

  // Efectos posteriores al commit (no deben revertir el pedido si fallan):
  if (confirmado) {
    await notificarNuevoPedidoACocina(pedidoId);
  }

  return obtenerPedido(pedidoId);
}

async function notificarNuevoPedidoACocina(pedidoId: number) {
  const cocineros = await q<{ id: number }>(
    `SELECT u.id FROM usuario u JOIN rol r ON r.id = u.rol_id WHERE r.nombre = 'COCINA' AND u.activo = true`
  );
  for (const c of cocineros) {
    await crearNotificacion(c.id, pedidoId, 'PEDIDO_NUEVO', `Nuevo pedido #${pedidoId} recibido.`);
  }
}

/** RF10 — Editar pedido, únicamente si no ha sido confirmado/enviado a cocina */
export async function actualizarPedido(id: number, items: ItemPedidoInput[], observaciones?: string): Promise<Pedido> {
  const pedido = await obtenerPedido(id);

  if (pedido.confirmado) {
    throw new Error('El pedido ya fue confirmado y enviado a cocina; no puede modificarse.');
  }

  await withTransaction(async (tx: DbTx) => {
    await tx.qRun('DELETE FROM detalle_pedido WHERE pedido_id = ?', [id]);
    let total = 0;
    for (const item of items) {
      const platillo = await tx.qOne<{ precio: number }>('SELECT precio FROM platillo WHERE id = ?', [
        item.platillo_id,
      ]);
      if (!platillo) throw new Error(`El platillo con id ${item.platillo_id} no existe.`);
      const subtotal = platillo.precio * item.cantidad;
      total += subtotal;
      await tx.qRun(
        `INSERT INTO detalle_pedido (pedido_id, platillo_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)`,
        [id, item.platillo_id, item.cantidad, platillo.precio, subtotal]
      );
    }
    await tx.qRun(`UPDATE pedido SET total = ?, observaciones = ?, updated_at = NOW() WHERE id = ?`, [
      total,
      observaciones ?? pedido.observaciones ?? null,
      id,
    ]);
  });

  return obtenerPedido(id);
}

/** RF10 — Confirmar y enviar a cocina un pedido en borrador */
export async function confirmarPedido(id: number): Promise<Pedido> {
  const pedido = await obtenerPedido(id);
  if (pedido.confirmado) {
    throw new Error('El pedido ya fue confirmado previamente.');
  }
  await qRun(`UPDATE pedido SET confirmado = true, updated_at = NOW() WHERE id = ?`, [id]);

  if (pedido.mesa_id) {
    await qRun(`UPDATE mesa SET estado = 'PEDIDO EN CURSO' WHERE id = ?`, [pedido.mesa_id]);
  }

  await notificarNuevoPedidoACocina(id);

  return obtenerPedido(id);
}

/** RF10 — Cancelar pedido no confirmado */
export async function cancelarPedido(id: number): Promise<Pedido> {
  const pedido = await obtenerPedido(id);
  if (pedido.confirmado) {
    throw new Error('El pedido ya fue confirmado y enviado a cocina; no puede cancelarse desde este módulo.');
  }
  await qRun(`UPDATE pedido SET estado = 'CANCELADO', updated_at = NOW() WHERE id = ?`, [id]);
  return obtenerPedido(id);
}

/** RF05 / RF17 — Actualizar estado del pedido (cocina) con notificación a mesero y cliente (RF09) */
export async function actualizarEstadoPedido(id: number, nuevoEstado: EstadoPedido): Promise<Pedido> {
  const pedido = await obtenerPedido(id);
  const permitidos = TRANSICIONES_VALIDAS[pedido.estado];

  if (!permitidos.includes(nuevoEstado)) {
    throw new Error(`Transición inválida: no se puede pasar de "${pedido.estado}" a "${nuevoEstado}".`);
  }

  await qRun(`UPDATE pedido SET estado = ?, updated_at = NOW() WHERE id = ?`, [nuevoEstado, id]);

  if (nuevoEstado === 'LISTO') {
    if (pedido.mesero_id) {
      await crearNotificacion(pedido.mesero_id, id, 'PEDIDO_LISTO', `El pedido #${id} está listo para entregar.`);
    }
    if (pedido.cliente_id) {
      await crearNotificacion(pedido.cliente_id, id, 'PEDIDO_LISTO', `¡Tu pedido #${id} está listo!`);
    }
  }

  if (nuevoEstado === 'ENTREGADO' && pedido.mesa_id) {
    await qRun(`UPDATE mesa SET estado = 'LIBRE' WHERE id = ?`, [pedido.mesa_id]);
  }

  return obtenerPedido(id);
}

/** RF16 — Pedidos entrantes para cocina (solo confirmados por el mesero) */
export async function listarPedidosCocina(): Promise<Pedido[]> {
  const pedidos = await listarPedidos({ confirmado: 1 });
  return pedidos.filter((p) => p.estado === 'RECIBIDO' || p.estado === 'EN PREPARACION');
}

/** RF06 — Historial de pedidos del cliente */
export async function historialCliente(clienteId: number): Promise<Pedido[]> {
  const pedidos = await listarPedidos({ clienteId });
  return pedidos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/** RF06 — Repetir un pedido anterior (crea uno nuevo con los mismos productos) */
export async function repetirPedido(pedidoId: number, clienteId: number): Promise<Pedido> {
  const original = await obtenerPedido(pedidoId);
  if (original.cliente_id !== clienteId) {
    throw new Error('No puedes repetir un pedido que no te pertenece.');
  }
  const items = (original.detalles ?? []).map((d) => ({ platillo_id: d.platillo_id, cantidad: d.cantidad }));
  return crearPedido({ cliente_id: clienteId, origen: 'CLIENTE', items });
}