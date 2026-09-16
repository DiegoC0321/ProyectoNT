'use client';

import { useEffect, useState, FormEvent, useCallback } from 'react';
import { inventoryService } from '@/services/otherServices';
import type { Inventario } from '@/models/types';
import EscanerCodigo, { type ResultadoEscaner } from '@/components/EscanerCodigo';

export default function InventarioPage() {
  const [inventario, setInventario] = useState<Inventario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [avisoOk, setAvisoOk] = useState('');
  const [noEncontrado, setNoEncontrado] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);

  const [nombre, setNombre] = useState('');
  const [unidad, setUnidad] = useState('kg');
  const [cantidadInicial, setCantidadInicial] = useState(0);
  const [cantidadMinima, setCantidadMinima] = useState(0);
  const [codigoForm, setCodigoForm] = useState('');

  const [codigoEscaneo, setCodigoEscaneo] = useState('');
  const [cantidadEscaneo, setCantidadEscaneo] = useState(0);

  const [escanerAbierto, setEscanerAbierto] = useState(false);
  const [cantidadCamara, setCantidadCamara] = useState(1);
  const [resultadoCamara, setResultadoCamara] = useState<ResultadoEscaner | null>(null);

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
    setAvisoOk('');
    try {
      const res = await inventoryService.registrar(
        nombre,
        unidad,
        cantidadInicial,
        cantidadMinima,
        codigoForm.trim() || undefined
      );
      setInventario(res.inventario);
      setNombre('');
      setUnidad('kg');
      setCantidadInicial(0);
      setCantidadMinima(0);
      setCodigoForm('');
      setMostrarForm(false);
      setAvisoOk('Insumo registrado.');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleAgregarPorCodigo(e: FormEvent) {
    e.preventDefault();
    setError('');
    setAvisoOk('');
    setNoEncontrado('');

    const codigo = codigoEscaneo.trim();
    if (!codigo) {
      setError('Escanea o escribe un código de barras.');
      return;
    }
    if (!(cantidadEscaneo > 0)) {
      setError('Indica una cantidad mayor que cero.');
      return;
    }

    try {
      const res = await inventoryService.agregarPorCodigo(codigo, cantidadEscaneo);
      setInventario(res.inventario);
      setAvisoOk(`Stock agregado: +${cantidadEscaneo} para el código ${codigo}.`);
      setCodigoEscaneo('');
      setCantidadEscaneo(0);
    } catch (err) {
      const message = (err as Error).message;
      if (/No se encontró ningún insumo/.test(message)) {
        setNoEncontrado(codigo);
      } else {
        setError(message);
      }
    }
  }

  const handleCodigoCamara = useCallback(
    async (codigo: string) => {
      setResultadoCamara(null);
      if (!(cantidadCamara > 0)) {
        setResultadoCamara({
          tipo: 'error',
          texto: 'Indica una cantidad mayor que cero antes de escanear.',
        });
        return;
      }
      try {
        const res = await inventoryService.agregarPorCodigo(codigo, cantidadCamara);
        setInventario(res.inventario);
        const insumo = res.inventario.find((i) => i.codigo_de_barras === codigo);
        const nombre = insumo?.ingrediente_nombre ?? 'insumo';
        setResultadoCamara({
          tipo: 'ok',
          texto: `Agregado +${cantidadCamara} ${insumo?.unidad_medida ?? ''} a "${nombre}" [${codigo}].`.trim(),
        });
        setCantidadCamara(1);
      } catch (err) {
        setResultadoCamara({ tipo: 'error', texto: (err as Error).message });
      }
    },
    [cantidadCamara]
  );

  const bajoStock = inventario.filter((i) => i.bajo_stock);

  return (
    <div>
      <div className="rv-panel-cabecera">
        <div className="container">
          <p className="rv-eyebrow rv-eyebrow-dark">El sistema · inventario</p>
          <h1 className="rv-panel-nombre">Inventario <em>de la cocina</em></h1>
          <p className="rv-mano rv-mano-oliva" style={{ fontSize: '1.3rem', margin: '0.5rem 0 0' }}>revisa los ingredientes — cada día, antes de abrir</p>
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
      {avisoOk && (
        <div className="alert alert-success">
          <i className="bi bi-check-circle-fill"></i> {avisoOk}
        </div>
      )}

      <form onSubmit={handleAgregarPorCodigo} className="card shadow-sm p-3 mb-4">
        <div className="row g-2 align-items-end">
          <div className="col-md-5">
            <label className="form-label">
              <i className="bi bi-upc-scan"></i> Escanea el código de barras
            </label>
            <input
              className="form-control form-control-lg"
              placeholder="Apunta el lector aquí y pulsa Enter"
              value={codigoEscaneo}
              onChange={(e) => setCodigoEscaneo(e.target.value)}
              autoFocus
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Cantidad a agregar</label>
            <input
              type="number"
              min="0"
              step="0.001"
              className="form-control form-control-lg"
              value={cantidadEscaneo}
              onChange={(e) => setCantidadEscaneo(Number(e.target.value))}
            />
          </div>
          <div className="col-md-4">
            <button type="submit" className="btn btn-warning w-100">
              <i className="bi bi-upc-scan"></i> Agregar al stock
            </button>
          </div>
        </div>
        {noEncontrado && (
          <div className="alert alert-warning mt-3 mb-0">
            No se encontró ningún insumo con el código <strong>{noEncontrado}</strong>.
            <button
              type="button"
              className="btn btn-sm btn-outline-dark ms-3"
              onClick={() => {
                setCodigoForm(noEncontrado);
                setMostrarForm(true);
                setNoEncontrado('');
              }}
            >
              Registrar insumo con este código
            </button>
          </div>
        )}
      </form>

      <div className="text-end mb-3">
        <button
          type="button"
          className="btn btn-outline-warning btn-sm"
          onClick={() => {
            setCantidadCamara(1);
            setResultadoCamara(null);
            setEscanerAbierto(true);
          }}
        >
          <i className="bi bi-camera"></i> Escanear con la cámara (opcional)
        </button>
      </div>

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
              <label className="form-label">Código de barras (opcional)</label>
              <input
                className="form-control"
                value={codigoForm}
                onChange={(e) => setCodigoForm(e.target.value)}
                placeholder="Ej: 7501000532323"
              />
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
        <div className="table-responsive">
          <table className="table table-striped align-middle">
          <thead>
            <tr>
              <th>Insumo</th>
              <th>Código</th>
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
                <td>
                  <code>{i.codigo_de_barras || '—'}</code>
                </td>
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
        </div>
      )}
      </div>

      {escanerAbierto && (
        <EscanerCodigo
          abierto={escanerAbierto}
          cantidad={cantidadCamara}
          onCantidad={setCantidadCamara}
          onDetectado={handleCodigoCamara}
          onReanudar={() => setResultadoCamara(null)}
          onCerrar={() => setEscanerAbierto(false)}
          resultado={resultadoCamara}
        />
      )}
    </div>
  );
}