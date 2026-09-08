'use client';

import { useEffect, useState, useCallback } from 'react';
import { orderService } from '@/services/orderService';
import PedidoCard from '@/components/PedidoCard';
import type { Pedido } from '@/models/types';

export default function MisPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargar = useCallback(() => {
    orderService
      .listar()
      .then((res) => setPedidos(res.pedidos))
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, 8000); // RF05: refresco automático del seguimiento
    return () => clearInterval(intervalo);
  }, [cargar]);

  async function handleRepetir(id: number) {
    setMensaje('');
    try {
      await orderService.repetir(id);
      setMensaje('¡Pedido repetido con éxito! Revisa tus pedidos activos.');
      cargar();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleCancelar(id: number) {
    try {
      await orderService.cancelar(id);
      cargar();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const activos = pedidos.filter((p) => p.estado !== 'ENTREGADO' && p.estado !== 'CANCELADO');
  const historial = pedidos.filter((p) => p.estado === 'ENTREGADO' || p.estado === 'CANCELADO');

  return (
    <div className="container py-5" style={{ maxWidth: 800 }}>
      <h1 className="mb-4">Mis pedidos</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      {mensaje && <div className="alert alert-success">{mensaje}</div>}

      <h4 className="mb-3">Seguimiento activo</h4>
      {cargando ? (
        <p className="text-muted">Cargando...</p>
      ) : activos.length === 0 ? (
        <p className="text-muted">No tienes pedidos activos en este momento.</p>
      ) : (
        activos.map((p) => (
          <PedidoCard
            key={p.id}
            pedido={p}
            acciones={
              !p.confirmado ? (
                <button className="btn btn-sm btn-outline-danger" onClick={() => handleCancelar(p.id)}>
                  Cancelar
                </button>
              ) : undefined
            }
          />
        ))
      )}

      <h4 className="mt-5 mb-3">Historial</h4>
      {historial.length === 0 ? (
        <p className="text-muted">Aún no tienes pedidos anteriores.</p>
      ) : (
        historial.map((p) => (
          <PedidoCard
            key={p.id}
            pedido={p}
            acciones={
              p.estado === 'ENTREGADO' ? (
                <button className="btn btn-sm btn-warning" onClick={() => handleRepetir(p.id)}>
                  <i className="bi bi-arrow-repeat"></i> Repetir pedido
                </button>
              ) : undefined
            }
          />
        ))
      )}
    </div>
  );
}
