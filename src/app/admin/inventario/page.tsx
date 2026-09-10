'use client';

import { useEffect, useState, FormEvent } from 'react';
import { inventoryService } from '@/services/otherServices';
import type { Inventario } from '@/models/types';

export default function InventarioPage() {
  const [inventario, setInventario] = useState<Inventario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);

  const [nombre, setNombre] = useState('');
  const [unidad, setUnidad] = useState('kg');
  const [cantidadInicial, setCantidadInicial] = useState(0);
  const [cantidadMinima, setCantidadMinima] = useState(0);

  function cargar() {
    inventoryService.listar().then((res) => setInventario(res.inventario)).finally(() => setCargando(false));
  }

  useEffect(() => {
    cargar();
  }, []);

  async function handleActualizar(id: number, cantidad: number) {
    setError('');
    try {
      const res = await inventoryService.actualizarCantidad(id, cantidad);
      setInventario(res.inventario);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleCrear(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const res = await inventoryService.registrar(nombre, unidad, cantidadInicial, cantidadMinima);
      setInventario(res.inventario);
      setNombre('');
      setCantidadInicial(0);
      setCantidadMinima(0);
      setMostrarForm(false);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const bajoStock = inventario.filter((i) => i.bajo_stock);

  return (
    <div>
      <div className="rv-panel-cabecera">
        <div className="container">
          <p className="rv-eyebrow rv-eyebrow-dark">Il sistema · inventario</p>
          <h1 className="rv-panel-nombre">Inventario <em>della cucina</em></h1>
          <p className="rv-mano rv-mano-oliva" style={{ fontSize: '1.3rem', margin: '0.5rem 0 0' }}>controlla gli ingredienti — ogni giorno, prima di aprire</p>
        </div>
      </div>
      <div className="container pb-4 pt-3">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0" style={{ fontFamily: 'var(--font-display)' }}>Ingredientes</h2>
          <button className="rv-btn rv-btn-pomodoro" onClick={() => setMostrarForm((v) => !v)}>
            <i className="bi bi-plus-lg"></i> Registrar insumo
          </button>
        </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {bajoStock.length > 0 && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle-fill"></i> Alerta de bajo inventario:{' '}
          {bajoStock.map((i) => i.ingrediente_nombre).join(', ')}
        </div>
      )}

      {mostrarForm && (
        <form onSubmit={handleCrear} className="card shadow-sm p-3 mb-4">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Nombre del insumo</label>
              <input className="form-control" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div className="col-md-2">
              <label className="form-label">Unidad</label>
              <input className="form-control" value={unidad} onChange={(e) => setUnidad(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Cantidad inicial</label>
              <input
                type="number"
                className="form-control"
                value={cantidadInicial}
                onChange={(e) => setCantidadInicial(Number(e.target.value))}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Cantidad mínima</label>
              <input
                type="number"
                className="form-control"
                value={cantidadMinima}
                onChange={(e) => setCantidadMinima(Number(e.target.value))}
              />
            </div>
          </div>
          <button className="btn btn-warning mt-3" type="submit">
            Guardar insumo
          </button>
        </form>
      )}

      {cargando ? (
        <p className="text-muted">Cargando inventario...</p>
      ) : (
        <table className="table table-striped align-middle">
          <thead>
            <tr>
              <th>Insumo</th>
              <th>Unidad</th>
              <th>Cantidad actual</th>
              <th>Mínimo</th>
              <th>Estado</th>
              <th>Actualizar</th>
            </tr>
          </thead>
          <tbody>
            {inventario.map((i) => (
              <tr key={i.id} className={i.bajo_stock ? 'table-danger' : ''}>
                <td>{i.ingrediente_nombre}</td>
                <td>{i.unidad_medida}</td>
                <td>{i.cantidad_actual}</td>
                <td>{i.cantidad_minima}</td>
                <td>
                  {i.bajo_stock ? (
                    <span className="badge text-bg-danger">Bajo stock</span>
                  ) : (
                    <span className="badge text-bg-success">OK</span>
                  )}
                </td>
                <td style={{ maxWidth: 140 }}>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    defaultValue={i.cantidad_actual}
                    onBlur={(e) => handleActualizar(i.id, Number(e.target.value))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </div>
    </div>
  );
}
