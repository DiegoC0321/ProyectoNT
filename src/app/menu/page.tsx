'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { menuService } from '@/services/menuService';
import { api } from '@/services/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import AccesoEmpleados from '@/components/AccesoEmpleados';
import { CURSOS } from '@/data/carta';
import type { Platillo, Categoria, Mesa } from '@/models/types';

const RECETAS_SOCKET: { label: string; text: string; komenu?: string }[] = [
  { label: 'fatto in casa, ogni giorno', text: 'la pasta si fa stamattina, il ragù si fa ieri e oggi si mangia.' },
  { label: 'segreti di nonna Rosina', text: 'nessuna ricetta scritta — si eredita, si discute in tavola, si corregge col tempo.' },
  { label: 'dal 1987, senza fretta', text: 'chi ha fretta, mangia male: questo non era scritto nei libri, stava sul retro di una bottiglia.' },
  { label: 'vino della casa e buona compagnia', text: "si beve in caraffa, come in casa: pane, olio e un po' di chiacchiere che durano stamattina." },
  { label: 'oggi: il solito, il solito è eccellente', text: 'la pizza non è sul menù, ma se qualcuno te la raccomanda, fai una domanda al cameriere.' },
];

const MARQUEE_WORDS = [
  'pasta fresca', 'fatta a mano', 'vino della casa', 'nonna partigiana',
  'ragù lento', 'al parmigiano', 'ogni giorno', 'dal 1987',
  'fichi secchi', 'al basilico', 'al pomodoro', 'senza fretta',
].map(w => w.toUpperCase());

export default function MenuPublicoPage() {
  return (
    <Suspense fallback={<p className="text-muted text-center py-5">Cargando menú...</p>}>
      <MenuPublicoContent />
    </Suspense>
  );
}

function MenuPublicoContent() {
  const [platillos, setPlatillos] = useState<Platillo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mesa, setMesa] = useState<Mesa | null>(null);
  const [mesaError, setMesaError] = useState('');
  const [recetaActual, setRecetaActual] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { setMesa: guardarMesa } = useCart();
  const { usuario, cargando: cargandoAuth, crearSesionInvitado } = useAuth();
  const searchParams = useSearchParams();

  const numeroMesa = Number(searchParams.get('mesa'));

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRecetaActual((i) => (i + 1) % RECETAS_SOCKET.length);
    }, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (!searchParams.has('mesa') || cargandoAuth) return;
    if (!usuario) {
      crearSesionInvitado().catch(() => {});
    }
  }, [searchParams, cargandoAuth, usuario, crearSesionInvitado]);

  useEffect(() => {
    Promise.all([menuService.listar(true), menuService.listarCategorias()])
      .then(([m, c]) => {
        setPlatillos(m.platillos);
        setCategorias(c.categorias);
      })
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (!searchParams.has('mesa')) return;
    if (!Number.isInteger(numeroMesa) || numeroMesa <= 0) {
      setMesaError('Código QR/NFC inválido: mesa no reconocida.');
      return;
    }
    api
      .get<{ mesa: Mesa }>(`/tables/by-number/${numeroMesa}`)
      .then(({ mesa }) => {
        setMesa(mesa);
        guardarMesa({ id: mesa.id, numero: mesa.numero });
      })
      .catch((err) => setMesaError((err as Error).message));
  }, [searchParams, numeroMesa, guardarMesa]);

  return (
    <div>
      {/* ============ MARQUEE + ENCABEZADO ============ */}
      <section className="rv-menu-cabecera">
        <div className="rv-marquee" aria-label="Palabras de la casa en italiano">
          <span className="rv-marquee-movimiento">
            {MARQUEE_WORDS.join(' ◆ ')} ◆ {MARQUEE_WORDS.join(' ◆ ')}
          </span>
        </div>
        <div className="container">
          <p className="rv-eyebrow rv-eyebrow-claro">La carta</p>
          <h1 className="rv-menu-marca">La <span>Carta</span></h1>
          <p className="rv-menu-sub">il menù del giorno — fatto in casa</p>
          <p className="rv-carta-villancico">
            {RECETAS_SOCKET[recetaActual]?.label} —{' '}
            <span className="rv-mano rv-mano-crema" style={{ display: 'inline-block', transform: 'rotate(2deg)' }}>
              {RECETAS_SOCKET[recetaActual]?.komenu ?? 'scritto da nonna Rosina'}
            </span>
          </p>
        </div>
      </section>

      <div className="container py-4 position-relative">
        {/* nota manuscrita */}
        <span className="rv-mano rv-mano-pomodoro" style={{ display: 'block', textAlign: 'center', margin: '1rem 0 0.5rem', fontSize: '1.5rem', transform: 'rotate(-2deg)' }}>
          oggi: spaghetti, ragù, e un buon vino
        </span>

        {/* Mesa QR */}
        {mesa && (
          <div className="rv-card-panel d-flex flex-wrap justify-content-between align-items-start gap-3 p-3 mb-4">
            <span>
              <i className="bi bi-qr-code me-1" style={{ color: 'var(--rv-pomodoro)' }}></i>
              Estás en la <strong>mesa {mesa.numero}</strong> (capacidad {mesa.capacidad}).
            </span>
            <Link href={`/cliente/menu?mesa=${mesa.numero}`} className="rv-btn rv-btn-pomodoro" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
              <i className="bi bi-cart-plus"></i> Hacer pedido
            </Link>
          </div>
        )}

        {mesaError && (
          <div className="rv-card-panel d-flex align-items-center gap-2 p-3 mb-4" style={{ background: 'var(--rv-crema)', borderLeft: '4px solid var(--rv-pomodoro)' }}>
            <i className="bi bi-exclamation-triangle" style={{ color: 'var(--rv-pomodoro)' }}></i> {mesaError}
          </div>
        )}

        {error && (
          <div className="rv-card-panel d-flex align-items-center gap-2 p-3 mb-4" style={{ background: 'var(--rv-crema)', borderLeft: '4px solid var(--rv-pomodoro)' }}>
            <i className="bi bi-exclamation-triangle" style={{ color: 'var(--rv-pomodoro)' }}></i> {error}
          </div>
        )}

        {/* ====== CARTA CURSOS — SIEMPRE SE MUESTRA ====== */}
        {CURSOS.map((curso) => (
          <section key={curso.nombre} className="mb-4">
            <div className="d-flex align-items-baseline gap-2 mb-3">
              <p className="rv-eyebrow rv-eyebrow-dark">{curso.nombre}</p>
              <span className="puntos" style={{ flex: '1 auto', borderBottom: '1px dotted rgba(43, 28, 14, 0.4)', transform: 'translateY(-0.2em)' }}></span>
            </div>
            <div className="rv-listado-platos">
              <div className="rv-listado-cabecera">
                <p className="rv-eyebrow mb-1">Se serve oggi</p>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '1.4rem' }}>
                  {curso.nombre}
                </h3>
              </div>
              <div className="rv-listado-cuerpo">
                <ul className="rv-lista">
                  {curso.platos.map((plato) => (
                    <li key={plato.nombre}>
                      <div>
                        <span className="rv-lista-nombre">
                          {plato.nombre}
                          {plato.favorito && <span className="rv-badge-recetta">il più amato</span>}
                          {plato.picante && <span className="rv-picante">¡piccante!</span>}
                        </span>
                        {plato.italiano && <span className="rv-lista-italiano">{plato.italiano}</span>}
                      </div>
                      <div className="d-flex align-items-baseline" style={{ gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <span className="rv-lista-precio">{plato.precio}</span>
                        <span className="puntos" style={{ minWidth: '0.5rem', borderBottom: '1px dotted rgba(43, 28, 14, 0.4)', transform: 'translateY(-0.3em)' }}></span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        ))}

        {/* Pie de carta */}
        <p className="rv-carta-pie mt-4">
          la pasta se hace el mismo día — si se acaba, se acaba
        </p>
      </div>

      {/* Tira manuscrita */}
      {RECETAS_SOCKET.length > 0 && (
        <section className="bg-secondary bg-opacity-10 py-2 border-top border-bottom border-1" style={{ borderColor: 'rgba(184, 58, 38, 0.4)' }}>
          <div className="container position-relative" style={{ zIndex: 2 }}>
            <p className="rv-mano rv-mano-pomodoro" style={{ fontSize: '1.35rem', textAlign: 'center', transform: 'rotate(-3deg)' }}>
              {RECETAS_SOCKET[recetaActual].label} — {RECETAS_SOCKET[recetaActual].komenu}
            </p>
            <p className="rv-mano rv-mano-oliva" style={{ fontSize: '1.1rem', textAlign: 'center', marginTop: '0.4rem', transform: 'rotate(2deg)' }}>
              {RECETAS_SOCKET[recetaActual].text}
            </p>
          </div>
        </section>
      )}

      {/* Conto */}
      <section className="rv-conto-seccion">
        <div className="container">
          <div className="rv-conto">
            <span className="rv-timbre">Fatto con amore</span>
            <header className="rv-conto-cabecera">
              <p className="rv-conto-nombre">
                Trattoria <em>del Vicolo</em> — Conto
              </p>
              <p className="rv-conto-datos">N. 1987 · Via dei Fiori, 12 · Firenze · dal 1987</p>
            </header>
            <div className="rv-conto-fila">
              <span>Pasta fresca fatta a mano</span>
              <span className="puntos"></span>
              <span className="valor">gentilezza</span>
            </div>
            <div className="rv-conto-fila">
              <span>Vino della casa</span>
              <span className="puntos"></span>
              <span className="valor">tempo per parlare</span>
            </div>
            <div className="rv-conto-fila">
              <span>Tiramisù della nonna</span>
              <span className="puntos"></span>
              <span className="valor">sobremesa</span>
            </div>
            <div className="rv-conto-fila">
              <span>Música de fondo</span>
              <span className="puntos"></span>
              <span className="valor">la radio del bar</span>
            </div>
            <p className="rv-conto-corte">✂ corta aquí</p>
            <p className="rv-conto-total">
              Totale: una cena <em>in famiglia</em>
            </p>
            <p className="rv-conto-pie">
              se aceptan sonrisas · propina: un buen chiste
            </p>
            <div className="rv-conto-acciones">
              <Link href="/menu" className="rv-btn rv-btn-pomodoro">
                Ver la carta completa <i className="bi bi-arrow-right"></i>
              </Link>
              <Link href="/menu?mesa=1" className="rv-btn rv-btn-linea">
                <i className="bi bi-qr-code-scan"></i> Pedir desde la mesa
              </Link>
            </div>
            <p className="rv-conto-gracias">grazie, e tornate presto — Massimo</p>
          </div>
          <div className="text-center">
            <AccesoEmpleados className="rv-conto-empleados-dark" />
          </div>
        </div>
      </section>
    </div>
  );
}
