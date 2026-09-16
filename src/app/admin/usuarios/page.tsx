'use client';

import { useEffect, useState, FormEvent } from 'react';
import { userService } from '@/services/otherServices';
import type { UsuarioPublico, RolNombre } from '@/models/types';

const ROLES_ASIGNABLES: RolNombre[] = ['CLIENTE', 'MESERO', 'COCINA', 'ADMINISTRADOR'];

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
      await userService.crearUsuario(nombre, email, password, rol);
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
    <div>
      <div className="rv-panel-cabecera">
        <div className="container">
          <p className="rv-eyebrow rv-eyebrow-dark">El sistema · el personal</p>
          <h1 className="rv-panel-nombre">Usuarios y <em>roles</em></h1>
          <p className="rv-mano rv-mano-oliva" style={{ fontSize: '1.3rem', margin: '0.5rem 0 0' }}>solo el administrador crea cuentas — para todos</p>
        </div>
      </div>
      <div className="container pb-4 pt-3">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0" style={{ fontFamily: 'var(--font-display)' }}>Usuarios</h2>
          <button className="rv-btn rv-btn-pomodoro" onClick={() => setMostrarForm((v) => !v)}>
            <i className="bi bi-person-plus"></i> Nuevo usuario
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
            Crear usuario
          </button>
        </form>
      )}

      {cargando ? (
        <p className="text-muted">Cargando usuarios...</p>
      ) : (
        <div className="table-responsive">
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
        </div>
      )}
      </div>
    </div>
  );
}
