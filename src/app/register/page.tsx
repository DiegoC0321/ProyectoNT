'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const { registrar } = useAuth();
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmar) {
      setError('Le due parole non sono uguali.');
      return;
    }
    if (password.length < 6) {
      setError('Almeno sei caratteri, altrimenti non passi.');
      return;
    }

    setCargando(true);
    try {
      await registrar(nombre, email, password);
      router.push('/cliente');
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
            <p className="rv-eyebrow rv-eyebrow-dark mb-2">Il sistema · creare un posto</p>
            <h2 className="rv-subrayado" style={{ fontSize: '1.8rem', textAlign: 'center' }}>
              Creare la chiave
            </h2>
            <p className="rv-bajada" style={{ margin: '0.4rem auto 0', maxWidth: '100%' }}>
              nessuno viene senza una chiave — anche i migliori cominciano così
            </p>
          </div>
        </div>
        <div className="card-body p-4">
          {error && <div className="alert alert-danger py-2">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Come ti chiami</label>
              <input
                className="form-control"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Rosario Esposito"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">La chiave — email</label>
              <input
                type="email"
                className="form-control"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rosario@demo.com"
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
                placeholder="almeno 6 caratteri"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Riscrivila</label>
              <input
                type="password"
                className="form-control"
                required
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-warning w-100" disabled={cargando}>
              {cargando ? 'fatto, si fa...' : 'Crear la chiave'}
            </button>
          </form>
          <p className="text-center mt-3 mb-0">
            Hai già la chiave? <Link href="/login">Entrami</Link>
          </p>
          <p className="rv-accentos-demo mt-3">
            la chiave è tua — per il cliente, per la sala, per la cucina, per il cassaio.
          </p>
        </div>
      </div>
    </div>
  );
}
