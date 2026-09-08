'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import type { RolNombre } from '@/models/types';

const RUTA_POR_ROL: Record<RolNombre, string> = {
  CLIENTE: '/cliente',
  MESERO: '/mesero',
  COCINA: '/cocina',
  ADMINISTRADOR: '/admin',
};

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const usuario = await login(email, password);
      router.push(RUTA_POR_ROL[usuario.rol] ?? '/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: 460 }}>
      <div className="card shadow-sm">
        <div className="card-body p-4">
          <h2 className="text-center mb-4">Iniciar sesión</h2>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Correo electrónico</label>
              <input
                type="email"
                className="form-control"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Contraseña</label>
              <input
                type="password"
                className="form-control"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-warning w-100" disabled={cargando}>
              {cargando ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
          <p className="text-center mt-3 mb-0">
            ¿No tienes cuenta? <Link href="/register">Regístrate aquí</Link>
          </p>
          <hr />
          <p className="small text-muted mb-1">Usuarios de demostración:</p>
          <ul className="small text-muted mb-0">
            <li>cliente@demo.com / Cliente123!</li>
            <li>mesero@demo.com / Mesero123!</li>
            <li>cocina@demo.com / Cocina123!</li>
            <li>admin@demo.com / Admin123!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
