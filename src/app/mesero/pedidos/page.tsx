'use client';

import { useEffect, useState, useCallback } from 'react';
import { orderService } from '@/services/orderService';
import { menuService } from '@/services/menuService';
import PedidoCard from '@/components/PedidoCard';
import { formatearMoneda } from '@/utils/format';
import type { Pedido, Platillo } from '@/models/types';

interface LineaEdicion {
  platillo_id: number;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
}

export default function PedidosMeseroPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [platillos, setPlatillos] = useState<Platillo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [itemsEdit, setItemsEdit] = useState<LineaEdicion[]>([]);
  const [platilloNuevoId, setPlatilloNuevoId] = useState<number | ''>('');
  const [cantidadNueva, setCantidadNueva] = useState(1);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(() => {
    orderService
      .listar()
      .then((res) => setPedidos(res.pedidos))
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar();
    menuService
      .listar(true)
      .then((res) => setPlatillos(res.platillos))
      .catch(() => {});
    const intervalo = setInterval(cargar, 8000); // refresca notificaciones de "listo" (RF09)
    return () => clearInterval(intervalo);
  }, [cargar]);

  async function handleConfirmar(id: number) {
    setError('');
    try {
      await orderService.confirmar(id);
      setMensaje(`Pedido #${id} enviado a cocina.`);
      cargar();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleCancelar(id: number) {
    try {
      await orderService.cancelar(id);
      setEditandoId(null);
      cargar();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleEntregar(id: number) {
    try {
      await orderService.cambiarEstado(id, 'ENTREGADO');
      cargar();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function startEdit(pedido: Pedido) {
    setEditandoId(pedido.id);
    setItemsEdit(
      (pedido.detalles ?? []).map((d) => ({
        platillo_id: d.platillo_id,
        nombre: d.platillo_nombre ?? `Platillo #${d.platillo_id}`,
        precio_unitario: d.precio_unitario,
        cantidad: d.cantidad,
      }))
    );
    setPlatilloNuevoId('');
    setCantidadNueva(1);
  }

  function cambiarCantidad(idx: number, valor: number) {
    setItemsEdit((prev) => prev.map((l, i) => (i === idx ? { ...l, cantidad: Math.max(0, valor) } : l)));
  }

  function quitarLinea(idx: number) {
    setItemsEdit((prev) => prev.filter((_, i) => i !== idx));
  }

  function agregarLinea() {
    if (platilloNuevoId === '') return;
    const pl = platillos.find((p) => p.id === platilloNuevoId);
    if (!pl) return;
    setItemsEdit((prev) => {
      const existente = prev.find((l) => l.platillo_id === pl.id);
      if (existente) {
        return prev.map((l) =>
          l.platillo_id === pl.id ? { ...l, cantidad: l.cantidad + cantidadNueva } : l
        );
      }
      return [...prev, { platillo_id: pl.id, nombre: pl.nombre, precio_unitario: pl.precio, cantidad: cantidadNueva }];
    });
    setPlatilloNuevoId('');
    setCantidadNueva(1);
  }

  async function guardarEdicion(id: number) {
    setError('');
    setMensaje('');
    setGuardando(true);
    try {
      const limpio = itemsEdit
        .filter((l) => l.cantidad > 0)
        .map((l) => ({ platillo_id: l.platillo_id, cantidad: l.cantidad }));
      if (limpio.length === 0) throw new Error('El pedido debe incluir al menos un producto.');
      await orderService.actualizar(id, limpio);
      setEditandoId(null);
      setMensaje(`Pedido #${id} actualizado. Revísalo y envíalo a cocina.`);
      cargar();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  const borradores = pedidos.filter((p) => !p.confirmado);
  const enCurso = pedidos.filter((p) => p.confirmado && p.estado !== 'ENTREGADO' && p.estado !== 'CANCELADO');
  const finalizados = pedidos.filter((p) => p.estado === 'ENTREGADO' || p.estado === 'CANCELADO');

  return (
    <div>
      <div className="rv-panel-cabecera">
        <div className="container">
          <p className="rv-eyebrow rv-eyebrow-dark">Il sistema · ordini</p>
          <h1 className="rv-panel-nombre">Pedidos <em>della sala</em></h1>
          <p className="rv-mano rv-mano-oliva" style={{ fontSize: '1.3rem', margin: '0.5rem 0 0' }}>ogni ordine è pronto — serve con calma</p>
        </div>
      </div>
      <div className="container pb-4 pt-3" style={{ maxWidth: 800 }}>
      <h2 className="mb-4" style={{ fontFamily: 'var(--font-display)' }}>Pedidos</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {mensaje && <div className="alert alert-success">{mensaje}</div>}

      <h4 className="mb-3">Pendientes de confirmación (pedidos de mesa y borradores)</h4>
      {cargando ? (
        <p className="text-muted">Cargando...</p>
      ) : borradores.length === 0 ? (
        <p className="text-muted">No hay pedidos pendientes de confirmar.</p>
      ) : (
        borradores.map((p) => (
          <div key={p.id}>
            <PedidoCard
              pedido={p}
              acciones={
                editandoId !== p.id ? (
                  <>
                    <button className="btn btn-sm btn-secondary" onClick={() => startEdit(p)}>
                      <i className="bi bi-pencil"></i> Editar
                    </button>
                    <button className="btn btn-sm btn-warning" onClick={() => handleConfirmar(p.id)}>
                      Enviar a cocina
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleCancelar(p.id)}>
                      Cancelar
                    </button>
                  </>
                ) : undefined
              }
            />
            {editandoId === p.id && (
              <div className="card shadow-sm mb-3 border-warning">
                <div className="card-header bg-warning bg-opacity-10 fw-bold">
                  Editando pedido #{p.id}
                </div>
                <div className="card-body">
                  {itemsEdit.length === 0 ? (
                    <p className="text-muted">El pedido quedó sin productos.</p>
                  ) : (
                    <table className="table table-sm align-middle mb-3">
                      <tbody>
                        {itemsEdit.map((l, idx) => (
                          <tr key={`${l.platillo_id}-${idx}`}>
                            <td>{l.nombre}</td>
                            <td style={{ maxWidth: 110 }}>
                              <input
                                type="number"
                                min={0}
                                className="form-control form-control-sm text-center"
                                value={l.cantidad}
                                onChange={(e) => cambiarCantidad(idx, Number(e.target.value))}
                              />
                            </td>
                            <td className="text-end">{formatearMoneda(l.precio_unitario * l.cantidad)}</td>
                            <td className="text-end">
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => quitarLinea(idx)}
                                title="Quitar"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  <div className="d-flex gap-2 align-items-center mb-3 flex-wrap">
                    <select
                      className="form-select form-select-sm"
                      style={{ maxWidth: 260 }}
                      value={platilloNuevoId}
                      onChange={(e) => setPlatilloNuevoId(e.target.value === '' ? '' : Number(e.target.value))}
                    >
                      <option value="">Añadir platillo...</option>
                      {platillos.map((pl) => (
                        <option key={pl.id} value={pl.id}>
                          {pl.nombre} — {formatearMoneda(pl.precio)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      className="form-control form-control-sm"
                      style={{ maxWidth: 90 }}
                      value={cantidadNueva}
                      onChange={(e) => setCantidadNueva(Math.max(1, Number(e.target.value)))}
                    />
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={agregarLinea}
                      disabled={platilloNuevoId === ''}
                    >
                      <i className="bi bi-plus-lg"></i> Añadir
                    </button>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => guardarEdicion(p.id)}
                      disabled={guardando || itemsEdit.filter((l) => l.cantidad > 0).length === 0}
                    >
                      {guardando ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditandoId(null)}>
                      Cancelar edición
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      )}

      <h4 className="mt-5 mb-3">En curso</h4>
      {enCurso.length === 0 ? (
        <p className="text-muted">No hay pedidos en curso.</p>
      ) : (
        enCurso.map((p) => (
          <PedidoCard
            key={p.id}
            pedido={p}
            acciones={
              p.estado === 'LISTO' ? (
                <button className="btn btn-sm btn-primary" onClick={() => handleEntregar(p.id)}>
                  Marcar como entregado
                </button>
              ) : undefined
            }
          />
        ))
      )}

      <h4 className="mt-5 mb-3">Finalizados</h4>
      {finalizados.length === 0 ? (
        <p className="text-muted">Aún no hay pedidos finalizados.</p>
      ) : (
        finalizados.map((p) => <PedidoCard key={p.id} pedido={p} />)
      )}
      </div>
    </div>
  );
}