'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { menuService } from '@/services/menuService';
import { tableService } from '@/services/otherServices';
import { orderService, ItemCarrito } from '@/services/orderService';
import { formatearMoneda } from '@/utils/format';
import type { Platillo, Mesa } from '@/models/types';

function RegistrarPedidoContent() {
  const params = useSearchParams();
  const router = useRouter();
  const mesaPreseleccionada = params.get('mesa');

  const [platillos, setPlatillos] = useState<Platillo[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [mesaId, setMesaId] = useState<string>(mesaPreseleccionada ?? '');
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    Promise.all([menuService.listar(true), tableService.listar()]).then(([m, t]) => {
      setPlatillos(m.platillos);
      setMesas(t.mesas);
    });
  }, []);

  function agregarItem(platilloId: number) {
    setItems((prev) => {
      const existente = prev.find((i) => i.platillo_id === platilloId);
      if (existente) {
        return prev.map((i) => (i.platillo_id === platilloId ? { ...i, cantidad: i.cantidad + 1 } : i));
      }
      return [...prev, { platillo_id: platilloId, cantidad: 1 }];
    });
  }

  function cambiarCantidad(platilloId: number, cantidad: number) {
    if (cantidad <= 0) {
      setItems((prev) => prev.filter((i) => i.platillo_id !== platilloId));
      return;
    }
    setItems((prev) => prev.map((i) => (i.platillo_id === platilloId ? { ...i, cantidad } : i)));
  }

  const total = items.reduce((acc, i) => {
    const p = platillos.find((pl) => pl.id === i.platillo_id);
    return acc + (p ? p.precio * i.cantidad : 0);
  }, 0);

  async function guardar(confirmar: boolean) {
    setError('');
    if (!mesaId) {
      setError('Selecciona una mesa.');
      return;
    }
    if (items.length === 0) {
      setError('Agrega al menos un producto.');
      return;
    }
    setEnviando(true);
    try {
      const { pedido } = await orderService.crearComoMesero(Number(mesaId), items, observaciones, confirmar);
      setMensaje(
        confirmar
          ? `Pedido #${pedido.id} enviado a cocina.`
          : `Pedido #${pedido.id} guardado como borrador. Puedes editarlo antes de enviarlo.`
      );
      setItems([]);
      setObservaciones('');
      setTimeout(() => router.push('/mesero/pedidos'), 1200);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="container py-5">
      <h1 className="mb-4">Registrar pedido</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      {mensaje && <div className="alert alert-success">{mensaje}</div>}

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="mb-3">
            <label className="form-label">Mesa</label>
            <select className="form-select" value={mesaId} onChange={(e) => setMesaId(e.target.value)}>
              <option value="">Selecciona una mesa...</option>
              {mesas.map((m) => (
                <option key={m.id} value={m.id}>
                  Mesa {m.numero} ({m.estado})
                </option>
              ))}
            </select>
          </div>

          <h5 className="mt-4">Productos disponibles</h5>
          <div className="list-group mb-4" style={{ maxHeight: 400, overflowY: 'auto' }}>
            {platillos.map((p) => (
              <button
                key={p.id}
                type="button"
                className="list-group-item list-group-item-action d-flex justify-content-between"
                onClick={() => agregarItem(p.id)}
              >
                <span>{p.nombre}</span>
                <span>{formatearMoneda(p.precio)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Detalle del pedido</h5>
              {items.length === 0 ? (
                <p className="text-muted">Toca un producto de la lista para agregarlo.</p>
              ) : (
                <ul className="list-group list-group-flush mb-3">
                  {items.map((i) => {
                    const p = platillos.find((pl) => pl.id === i.platillo_id);
                    return (
                      <li key={i.platillo_id} className="list-group-item px-0">
                        <div className="d-flex justify-content-between align-items-center">
                          <span>{p?.nombre}</span>
                          <input
                            type="number"
                            min={1}
                            className="form-control form-control-sm text-center"
                            style={{ width: 70 }}
                            value={i.cantidad}
                            onChange={(e) => cambiarCantidad(i.platillo_id, Number(e.target.value))}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="mb-3">
                <label className="form-label">Observaciones</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
              </div>
              <h5>Total: {formatearMoneda(total)}</h5>
              <div className="d-grid gap-2 mt-3">
                <button className="btn btn-outline-secondary" disabled={enviando} onClick={() => guardar(false)}>
                  Guardar como borrador
                </button>
                <button className="btn btn-warning" disabled={enviando} onClick={() => guardar(true)}>
                  Enviar directamente a cocina
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegistrarPedidoPage() {
  return (
    <Suspense fallback={<div className="container py-5">Cargando...</div>}>
      <RegistrarPedidoContent />
    </Suspense>
  );
}
