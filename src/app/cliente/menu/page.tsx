'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ListadoMenu from '@/components/ListadoMenu';

export default function ClienteMenuPage() {
  return (
    <Suspense fallback={<p className="text-muted text-center py-5">Cargando menú...</p>}>
      <ClienteMenuContent />
    </Suspense>
  );
}

function ClienteMenuContent() {
  const searchParams = useSearchParams();

  const numeroMesaRaw = searchParams.get('mesa');
  const numeroMesa =
    numeroMesaRaw && !Number.isNaN(Number(numeroMesaRaw)) ? Number(numeroMesaRaw) : null;

  return (
    <div>
      {/* Cabecera */}
      <section className="rv-menu-cabecera" style={{ padding: '3rem 0' }}>
        <div className="container">
          <p className="rv-eyebrow rv-eyebrow-claro">El menú</p>
          <h1 className="rv-menu-marca">La <span>Carta</span></h1>
          <p className="rv-menu-sub">el menú del día — hecho en casa</p>
        </div>
      </section>

      {/* Carta con carrito (platillos reales de la BD) */}
      <ListadoMenu numeroMesa={numeroMesa} />
    </div>
  );
}