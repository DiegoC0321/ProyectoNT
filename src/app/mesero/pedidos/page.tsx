'use client';

import { useEffect, useState, useCallback } from 'react';
import { orderService } from '@/services/orderService';
import PedidoCard from '@/components/PedidoCard';
import type { Pedido } from '@/models/types';

export default function PedidosMeseroPage() {
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

  const borradores = pedidos.filter((p) => !p.confirmado);
  const enCurso = pedidos.filter((p) => p.confirmado && p.estado !== 'ENTREGADO' && p.estado !== 'CANCELADO');
  const finalizados = pedidos.filter((p) => p.estado === 'ENTREGADO' || p.estado === 'CANCELADO');

  return (
    <div className="container py-5" style={{ maxWidth: 800 }}>
      <h1 className="mb-4">Pedidos</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      {mensaje && <div className="alert alert-success">{mensaje}</div>}

      <h4 className="mb-3">Borradores (sin enviar a cocina)</h4>
      {cargando ? (
        <p className="text-muted">Cargando...</p>
      ) : borradores.length === 0 ? (
        <p className="text-muted">No tienes borradores pendientes.</p>
      ) : (
        borradores.map((p) => (
          <PedidoCard
            key={p.id}
            pedido={p}
            acciones={
              <>
                <button className="btn btn-sm btn-warning" onClick={() => handleConfirmar(p.id)}>
                  Enviar a cocina
                </button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => handleCancelar(p.id)}>
                  Cancelar
                </button>
              </>
            }
          />
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
  );
}
