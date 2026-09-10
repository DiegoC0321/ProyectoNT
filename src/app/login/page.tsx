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
  INVITADO: '/cliente',
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
      <div className="rv-formulario-card">
        <div className="card-header">
          <div className="text-center">
            <p className="rv-eyebrow rv-eyebrow-dark mb-2">Il sistema · accesso</p>
            <h2 className="rv-subrayado" style={{ fontSize: '1.8rem', textAlign: 'center' }}>
              Ingresso
            </h2>
            <p className="rv-bajada" style={{ margin: '0.4rem auto 0', maxWidth: '100%' }}>
              chi ha una chiave, entra — il resto aspetta al bancone
            </p>
          </div>
        </div>
        <div className="card-body p-4">
          {error && <div className="alert alert-danger py-2">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">La chiave — email</label>
              <input
                type="email"
                className="form-control"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@demo.com"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">La parola — password</label>
              <input
                type="password"
                className="form-control"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="btn btn-warning w-100" disabled={cargando}>
              {cargando ? 'aspetta... si entra' : 'Entrar'}
            </button>
          </form>
          <hr style={{ borderColor: 'rgba(43, 28, 14, 0.3)' }} />
          <p className="small text-muted mb-1">Chiavi di prova:</p>
          <ul className="small text-muted mb-0">
            <li>cliente@demo.com / Cliente123!</li>
            <li>mesero@demo.com / Mesero123!</li>
            <li>cocina@demo.com / Cocina123!</li>
            <li>admin@demo.com / Admin123!</li>
          </ul>
          <p className="rv-accentos-demo mt-3">
            per il personale: cassa, cucina, sala — uno per ruolo.
          </p>
          <p className="text-center mt-3 mb-0">
            Non hai la chiave? <Link href="/register">Farsela dare dal cuoco</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
