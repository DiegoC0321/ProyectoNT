'use client';

import { useEffect, useState, FormEvent } from 'react';
import { menuService } from '@/services/menuService';
import { formatearMoneda } from '@/utils/format';
import type { Platillo, Categoria } from '@/models/types';

const PLATILLO_VACIO = { nombre: '', descripcion: '', precio: 0, imagen_url: '', categoria_id: '' as string | number };

export default function AdminMenuPage() {
  const [platillos, setPlatillos] = useState<Platillo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [editando, setEditando] = useState<number | null>(null);
  const [form, setForm] = useState(PLATILLO_VACIO);
  const [mostrarForm, setMostrarForm] = useState(false);

  function cargar() {
    Promise.all([menuService.listar(false), menuService.listarCategorias()]).then(([m, c]) => {
      setPlatillos(m.platillos);
      setCategorias(c.categorias);
    });
  }

  useEffect(() => {
    cargar();
    setCargando(false);
  }, []);

  function nuevoPlatillo() {
    setForm(PLATILLO_VACIO);
    setEditando(null);
    setMostrarForm(true);
  }

  function editarPlatillo(p: Platillo) {
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      precio: p.precio,
      imagen_url: p.imagen_url ?? '',
      categoria_id: p.categoria_id ?? '',
    });
    setEditando(p.id);
    setMostrarForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const data = {
      nombre: form.nombre,
      descripcion: form.descripcion,
      precio: Number(form.precio),
      imagen_url: form.imagen_url,
      categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
    };
    try {
      if (editando) {
        await menuService.actualizar(editando, data);
      } else {
        await menuService.crear(data);
      }
      setMostrarForm(false);
      cargar();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleToggle(id: number) {
    await menuService.alternarDisponibilidad(id);
    cargar();
  }

  async function handleEliminar(id: number) {
    if (!confirm('¿Eliminar este platillo?')) return;
    await menuService.eliminar(id);
    cargar();
  }

  return (
    <div>
      <div className="rv-panel-cabecera">
        <div className="container">
          <p className="rv-eyebrow rv-eyebrow-dark">Il sistema · il menù</p>
          <h1 className="rv-panel-nombre">Gestionar <em>carta</em></h1>
          <p className="rv-mano rv-mano-oliva" style={{ fontSize: '1.3rem', margin: '0.5rem 0 0' }}>aggiungi, modifica, togli — il menù è tuo</p>
        </div>
      </div>
      <div className="container pb-4 pt-3">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0" style={{ fontFamily: 'var(--font-display)' }}>Platillos</h2>
          <button className="rv-btn rv-btn-pomodoro" onClick={nuevoPlatillo}>
            <i className="bi bi-plus-lg"></i> Nuevo platillo
          </button>
        </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {mostrarForm && (
        <form onSubmit={handleSubmit} className="card shadow-sm p-3 mb-4">
          <h5>{editando ? 'Editar platillo' : 'Nuevo platillo'}</h5>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Nombre</label>
              <input
                className="form-control"
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Precio</label>
              <input
                type="number"
                className="form-control"
                required
                value={form.precio}
                onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Categoría</label>
              <select
                className="form-select"
                value={form.categoria_id}
                onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
              >
                <option value="">Sin categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Imagen (URL)</label>
              <input
                className="form-control"
                value={form.imagen_url}
                onChange={(e) => setForm({ ...form, imagen_url: e.target.value })}
              />
            </div>
            <div className="col-12">
              <label className="form-label">Descripción</label>
              <textarea
                className="form-control"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-3 d-flex gap-2">
            <button type="submit" className="btn btn-warning">
              Guardar
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setMostrarForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {cargando ? (
        <p className="text-muted">Cargando menú...</p>
      ) : (
        <table className="table align-middle">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Disponible</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {platillos.map((p) => (
              <tr key={p.id}>
                <td>{p.nombre}</td>
                <td>{p.categoria_nombre ?? '—'}</td>
                <td>{formatearMoneda(p.precio)}</td>
                <td>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={!!p.disponible}
                      onChange={() => handleToggle(p.id)}
                    />
                  </div>
                </td>
                <td className="text-end">
                  <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => editarPlatillo(p)}>
                    <i className="bi bi-pencil"></i>
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleEliminar(p.id)}>
                    <i className="bi bi-trash"></i>
                  </button>
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
