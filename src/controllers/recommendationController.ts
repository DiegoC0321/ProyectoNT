import { getDb } from '@/lib/db';
import type { Platillo } from '@/models/types';

/**
 * RF02 — Módulo de recomendaciones personalizadas (prioridad SHOULD).
 *
 * Implementación base: motor de recomendación por reglas (histórico de
 * consumo + popularidad por categoría), pensado para poder ser
 * reemplazado o combinado con un modelo de IA (por ejemplo, un modelo de
 * Anthropic) sin cambiar el contrato de la función `recomendarPlatillos`.
 *
 * Para conectar un LLM real más adelante, basta con:
 *  1. Obtener el mismo contexto que aquí se calcula (historial, categorías
 *     favoritas, catálogo disponible).
 *  2. Enviarlo como prompt a la API de Anthropic (POST /v1/messages).
 *  3. Pedir una respuesta JSON con los IDs de platillo sugeridos y usarlos
 *     para construir el mismo tipo de retorno que produce esta función.
 */
export function recomendarPlatillos(clienteId: number | null, limite = 4): Platillo[] {
  const db = getDb();

  const disponibles = db
    .prepare(
      `SELECT p.*, c.nombre as categoria_nombre FROM platillo p
       LEFT JOIN categoria c ON c.id = p.categoria_id
       WHERE p.disponible = 1`
    )
    .all() as Platillo[];

  if (disponibles.length === 0) return [];

  // Usuario anónimo o sin historial: recomienda los más vendidos en general.
  if (!clienteId) {
    return recomendarPorPopularidad(limite);
  }

  const historial = db
    .prepare(
      `SELECT d.platillo_id, SUM(d.cantidad) as veces_pedido
       FROM detalle_pedido d JOIN pedido pe ON pe.id = d.pedido_id
       WHERE pe.cliente_id = ? AND pe.estado != 'CANCELADO'
       GROUP BY d.platillo_id
       ORDER BY veces_pedido DESC`
    )
    .all(clienteId) as { platillo_id: number; veces_pedido: number }[];

  // Cliente sin historial todavía -> recomendar populares.
  if (historial.length === 0) {
    return recomendarPorPopularidad(limite);
  }

  const idsYaPedidos = new Set(historial.map((h) => h.platillo_id));

  // Categorías preferidas según lo que más ha pedido el cliente.
  const categoriasFavoritas = db
    .prepare(
      `SELECT p.categoria_id, COUNT(*) as frecuencia
       FROM detalle_pedido d
       JOIN pedido pe ON pe.id = d.pedido_id
       JOIN platillo p ON p.id = d.platillo_id
       WHERE pe.cliente_id = ? AND pe.estado != 'CANCELADO' AND p.categoria_id IS NOT NULL
       GROUP BY p.categoria_id
       ORDER BY frecuencia DESC`
    )
    .all(clienteId) as { categoria_id: number; frecuencia: number }[];

  const categoriaIds = categoriasFavoritas.map((c) => c.categoria_id);

  // 1) Prioriza platillos nuevos dentro de sus categorías favoritas.
  const sugerenciasPorCategoria = disponibles.filter(
    (p) => p.categoria_id !== null && categoriaIds.includes(p.categoria_id) && !idsYaPedidos.has(p.id)
  );

  // 2) Completa con platillos que ya pidió antes (para fomentar repetición) si aún faltan.
  const platillosRepetibles = disponibles.filter((p) => idsYaPedidos.has(p.id));

  // 3) Si aún falta, completa con los más populares del restaurante.
  const populares = recomendarPorPopularidad(limite);

  const resultado: Platillo[] = [];
  const idsAgregados = new Set<number>();

  for (const lista of [sugerenciasPorCategoria, platillosRepetibles, populares]) {
    for (const p of lista) {
      if (resultado.length >= limite) break;
      if (!idsAgregados.has(p.id)) {
        resultado.push(p);
        idsAgregados.add(p.id);
      }
    }
    if (resultado.length >= limite) break;
  }

  return resultado.slice(0, limite);
}

function recomendarPorPopularidad(limite: number): Platillo[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT p.*, c.nombre as categoria_nombre, COALESCE(SUM(d.cantidad), 0) as veces_vendido
       FROM platillo p
       LEFT JOIN categoria c ON c.id = p.categoria_id
       LEFT JOIN detalle_pedido d ON d.platillo_id = p.id
       WHERE p.disponible = 1
       GROUP BY p.id
       ORDER BY veces_vendido DESC, p.nombre ASC
       LIMIT ?`
    )
    .all(limite) as Platillo[];
}
