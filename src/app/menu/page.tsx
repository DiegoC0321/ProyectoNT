'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ListadoMenu from '@/components/ListadoMenu';
import AccesoEmpleados from '@/components/AccesoEmpleados';

const RECETAS_SOCKET: { label: string; text: string; komenu?: string }[] = [
  { label: 'hecho en casa, cada día', text: 'la pasta se hace esta mañana, el ragú se hizo ayer y hoy se come.' },
  { label: 'secretos de la abuela Rosina', text: 'ninguna receta escrita — se hereda, se discute en la mesa y se corrige con el tiempo.' },
  { label: 'desde 1987, sin prisa', text: 'quien tiene prisa, come mal: esto no estaba escrito en los libros, estaba en el reverso de una botella.' },
  { label: 'vino de la casa y buena compañía', text: 'se bebe en jarra, como en casa: pan, aceite y un poco de charla que dura hasta la mañana.' },
  { label: 'hoy: lo de siempre, y lo de siempre es excelente', text: 'la pizza no está en el menú, pero si alguien te la recomienda, pregúntale al camarero.' },
];

const MARQUEE_WORDS = [
  'pasta fresca', 'hecha a mano', 'vino de la casa', 'receta de la abuela',
  'ragú lento', 'al parmesano', 'cada día', 'desde 1987',
  'higos secos', 'albahaca', 'al tomate', 'sin prisa',
].map(w => w.toUpperCase());

export default function MenuPublicoPage() {
  return (
    <Suspense fallback={<p className="text-muted text-center py-5">Cargando menú...</p>}>
      <MenuPublicoContent />
    </Suspense>
  );
}

function MenuPublicoContent() {
  const [recetaActual, setRecetaActual] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchParams = useSearchParams();

  const numeroMesaRaw = searchParams.get('mesa');
  const numeroMesa =
    numeroMesaRaw && !Number.isNaN(Number(numeroMesaRaw)) ? Number(numeroMesaRaw) : null;

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRecetaActual((i) => (i + 1) % RECETAS_SOCKET.length);
    }, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // NOTA: visitar /menu?mesa=N NO crea sesión. El cliente que entra por el
  // enlace navega como visitante; la sesión de invitado solo se crea al
  // confirmar el pedido en el carrito. Así el flujo del cliente nunca
  // interfiere con el acceso de los empleados.

  return (
    <div>
      {/* ============ MARQUEE + ENCABEZADO ============ */}
      <section className="rv-menu-cabecera">
        <div className="rv-marquee" aria-label="Palabras de la casa">
          <span className="rv-marquee-movimiento">
            {MARQUEE_WORDS.join(' ◆ ')} ◆ {MARQUEE_WORDS.join(' ◆ ')}
          </span>
        </div>
        <div className="container">
          <p className="rv-eyebrow rv-eyebrow-claro">La carta</p>
          <h1 className="rv-menu-marca">La <span>Carta</span></h1>
          <p className="rv-menu-sub">el menú del día — hecho en casa</p>
          <p className="rv-carta-villancico">
            {RECETAS_SOCKET[recetaActual]?.label} —{' '}
            <span className="rv-mano rv-mano-crema" style={{ display: 'inline-block', transform: 'rotate(2deg)' }}>
              {RECETAS_SOCKET[recetaActual]?.komenu ?? 'escrito por la abuela Rosina'}
            </span>
          </p>
        </div>
      </section>

      {/* ====== CARTA CON CARRITO (platillos reales de la BD) ====== */}
      <ListadoMenu numeroMesa={numeroMesa} />

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
            <span className="rv-timbre">Hecho con amor</span>
            <header className="rv-conto-cabecera">
              <p className="rv-conto-nombre">
                Trattoria <em>del Vicolo</em> — Cuenta
              </p>
              <p className="rv-conto-datos">N.º 1987 · Via dei Fiori, 12 · Firenze · desde 1987</p>
            </header>
            <div className="rv-conto-fila">
              <span>Pasta fresca hecha a mano</span>
              <span className="puntos"></span>
              <span className="valor">gentileza</span>
            </div>
            <div className="rv-conto-fila">
              <span>Vino de la casa</span>
              <span className="puntos"></span>
              <span className="valor">tiempo para hablar</span>
            </div>
            <div className="rv-conto-fila">
              <span>Tiramisú de la abuela</span>
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
              Total: una cena <em>en familia</em>
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
            <p className="rv-conto-gracias">gracias, y vuelvan pronto — Massimo</p>
          </div>
          <div className="text-center">
            <AccesoEmpleados className="rv-conto-empleados-dark" />
          </div>
        </div>
      </section>
    </div>
  );
}