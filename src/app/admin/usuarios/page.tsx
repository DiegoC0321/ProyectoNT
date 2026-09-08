'use client';

import { useEffect, useState, FormEvent } from 'react';
import { userService } from '@/services/otherServices';
import type { UsuarioPublico, RolNombre } from '@/models/types';

const ROLES_ASIGNABLES: RolNombre[] = ['MESERO', 'COCINA', 'ADMINISTRADOR'];

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioPublico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<RolNombre>('MESERO');

  function cargar() {
    userService.listar().then((res) => setUsuarios(res.usuarios)).finally(() => setCargando(false));
  }

  useEffect(() => {
    cargar();
  }, []);

  async function handleCrear(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await userService.crearEmpleado(nombre, email, password, rol);
      setNombre('');
      setEmail('');
      setPassword('');
      setMostrarForm(false);
      cargar();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleDesactivar(id: number) {
    if (!confirm('¿Desactivar este usuario?')) return;
    await userService.desactivar(id);
    cargar();
  }

  async function handleActivar(id: number) {
    await userService.actualizar(id, { activo: true });
    cargar();
  }

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">Usuarios y roles</h1>
        <button className="btn btn-warning" onClick={() => setMostrarForm((v) => !v)}>
          <i className="bi bi-person-plus"></i> Nuevo empleado
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {mostrarForm && (
        <form onSubmit={handleCrear} className="card shadow-sm p-3 mb-4">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Nombre</label>
              <input className="form-control" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Correo electrónico</label>
              <input
                type="email"
                className="form-control"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Contraseña temporal</label>
              <input
                type="password"
                className="form-control"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Rol</label>
              <select className="form-select" value={rol} onChange={(e) => setRol(e.target.value as RolNombre)}>
                {ROLES_ASIGNABLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-warning mt-3">
            Crear empleado
          </button>
        </form>
      )}

      {cargando ? (
        <p className="text-muted">Cargando usuarios...</p>
      ) : (
        <table className="table align-middle">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.nombre}</td>
                <td>{u.email}</td>
                <td>
                  <span className="badge text-bg-secondary">{u.rol}</span>
                </td>
                <td>
                  {u.activo ? (
                    <span className="badge text-bg-success">Activo</span>
                  ) : (
                    <span className="badge text-bg-danger">Inactivo</span>
                  )}
                </td>
                <td className="text-end">
                  {u.activo ? (
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDesactivar(u.id)}>
                      Desactivar
                    </button>
                  ) : (
                    <button className="btn btn-sm btn-outline-success" onClick={() => handleActivar(u.id)}>
                      Reactivar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
