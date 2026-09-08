import Link from 'next/link';

export default function HomePage() {
  return (
    <div>
      <section className="hero-section py-5 text-center">
        <div className="container py-5">
          <h1 className="display-4 fw-bold mb-3">Restaurante Inteligente</h1>
          <p className="lead mb-4">
            Consulta nuestro menú digital, realiza tu pedido y recibe recomendaciones personalizadas con
            inteligencia artificial.
          </p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <Link href="/menu" className="btn btn-warning btn-lg">
              <i className="bi bi-book"></i> Ver menú
            </Link>
            <Link href="/menu?mesa=1" className="btn btn-outline-light btn-lg">
              <i className="bi bi-qr-code-scan"></i> Pedir por mesa
            </Link>
          </div>
        </div>
      </section>

      <section className="container py-5">
        <div className="row g-4 text-center">
          <div className="col-md-3">
            <i className="bi bi-phone fs-1 text-warning"></i>
            <h5 className="mt-3">Menú digital</h5>
            <p className="text-muted">Explora platillos, precios e imágenes desde cualquier dispositivo.</p>
          </div>
          <div className="col-md-3">
            <i className="bi bi-cart-check fs-1 text-warning"></i>
            <h5 className="mt-3">Pedidos en línea</h5>
            <p className="text-muted">Arma tu pedido, revísalo y envíalo directamente a cocina.</p>
          </div>
          <div className="col-md-3">
            <i className="bi bi-stars fs-1 text-warning"></i>
            <h5 className="mt-3">Recomendaciones IA</h5>
            <p className="text-muted">Sugerencias basadas en tus preferencias e historial de consumo.</p>
          </div>
          <div className="col-md-3">
            <i className="bi bi-clock-history fs-1 text-warning"></i>
            <h5 className="mt-3">Seguimiento en vivo</h5>
            <p className="text-muted">Conoce el estado de tu pedido: recibido, en preparación, listo o entregado.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
