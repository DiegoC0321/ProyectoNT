import Link from 'next/link';
import AccesoEmpleados from '@/components/AccesoEmpleados';
import { CURSOS } from '@/data/carta';

/* Subrayado dibujado a mano */
function Subrayado({ children }: { children: React.ReactNode }) {
  return (
    <span className="rv-subrayado">
      {children}
      <svg viewBox="0 0 240 14" fill="none" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M4 9 C 60 2, 120 13, 236 5"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/* Círculo manuscrito alrededor de una palabra */
function Circulo({ children }: { children: React.ReactNode }) {
  return (
    <span className="rv-circulo">
      {children}
      <svg viewBox="0 0 200 60" fill="none" preserveAspectRatio="none" aria-hidden="true">
        <ellipse
          cx="100"
          cy="30"
          rx="92"
          ry="26"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeDasharray="4 7"
          strokeLinecap="round"
          transform="rotate(-3 100 30)"
        />
      </svg>
    </span>
  );
}

/* Ilustración de pasta a línea (dibujada a mano) */
function PlatoPasta() {
  return (
    <svg viewBox="0 0 400 300" className="rv-plato-svg" role="img" aria-label="Plato de spaghetti al pomodoro">
      {/* vapor */}
      <g stroke="#3a2413" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.55">
        <path d="M 120 66 Q 132 48 120 30" />
        <path d="M 158 74 Q 146 56 158 38" />
        <path d="M 96 58 Q 108 42 96 24" opacity="0.4" />
      </g>
      {/* cuerpo del plato */}
      <path d="M 50 140 C 50 248 118 260 200 260 C 282 260 350 248 350 140 Z" fill="#efe1c4" stroke="#3a2413" strokeWidth="3.5" />
      {/* base */}
      <path d="M 165 260 L 235 260 L 225 276 L 175 276 Z" fill="#efe1c4" stroke="#3a2413" strokeWidth="3" />
      {/* interior */}
      <ellipse cx="200" cy="140" rx="150" ry="30" fill="#f3e9d2" stroke="#3a2413" strokeWidth="3.5" />
      {/* espagueti */}
      <g stroke="#3a2413" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9">
        <path d="M 95 128 Q 115 110 135 128 T 175 128 T 215 128 T 255 128 T 295 128" />
        <path d="M 105 140 Q 125 122 145 140 T 185 140 T 225 140 T 265 140 T 305 140" />
        <path d="M 115 152 Q 135 134 155 152 T 195 152 T 235 152 T 275 152" />
        <path d="M 200 118 Q 218 100 236 118" />
        <path d="M 70 148 Q 60 172 76 190" />
        <path d="M 330 150 Q 340 174 326 190" />
        <path d="M 92 160 Q 86 178 96 194" />
      </g>
      {/* tomates */}
      <circle cx="150" cy="132" r="10" fill="#b83a26" />
      <circle cx="235" cy="124" r="8" fill="#b83a26" />
      <circle cx="185" cy="114" r="7" fill="#b83a26" />
      {/* albahaca */}
      <path d="M 262 118 C 270 102 286 104 290 116 C 282 124 268 126 262 118 Z" fill="#5f6b3a" />
      <path d="M 262 118 L 256 126" stroke="#5f6b3a" strokeWidth="2.5" strokeLinecap="round" />
      {/* tenedor clavado */}
      <g stroke="#3a2413" strokeLinecap="round" fill="none">
        <path d="M 255 118 L 255 158 M 268 118 L 268 158 M 281 118 L 281 158 M 294 118 L 294 158" strokeWidth="3.5" />
        <path d="M 255 118 Q 274 106 294 118" strokeWidth="3.5" />
        <path d="M 274.5 152 L 274.5 206" strokeWidth="5" />
      </g>
    </svg>
  );
}

const FECHA_HOY = new Date().toLocaleDateString('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});



const ANUNCIOS = [
  {
    icono: 'bi-phone',
    titulo: 'Menú digital',
    texto: 'La carta completa en tu mano, con fotos y precios. Sin esperar al mesero.',
    tag: 'novedad',
  },
  {
    icono: 'bi-send',
    titulo: 'Pedido directo',
    texto: 'De la mesa a la cocina en un soplo: confirmas y la cocina ya lo tiene.',
    tag: 'rápido',
  },
  {
    icono: 'bi-bell',
    titulo: 'Aviso en vivo',
    texto: 'Te avisamos cuando está listo. Tú, tranquilo, conversando.',
    tag: 'gratis',
  },
  {
    icono: 'bi-stars',
    titulo: 'Recomendaciones',
    texto: 'Una IA de la casa elige por ti: lo más pedido de la última semana, arriba en la carta.',
    tag: 'de la casa',
  },
];

export default function HomePage() {
  return (
    <div>
      {/* ================= PORTADA DEL PERIÓDICO ================= */}
      <section className="rv-gazzetta rv-grano rv-rayado">
        <div className="container rv-gazzetta-inner">
          <div className="rv-fecha">
            <span>Año 39 — N.º 12</span>
            <span>
              Firenze, <em>{FECHA_HOY}</em>
            </span>
            <span>Edición extraordinaria · gratis con el vino</span>
          </div>

          <header className="rv-masthead">
            <h1 className="rv-masthead-nombre">
              IL <span>VICOLO</span>
            </h1>
            <p className="rv-masthead-sub">
              Gazzetta della Trattoria del Vicolo — cocina, vino y buenos modales
            </p>
            <div className="rv-masthead-ornamento" aria-hidden="true">
              ✦
            </div>
          </header>

          <div className="rv-director">
            <span>Director: Massimo Ferretti</span>
            <span>Redacción: la cocina</span>
            <span>Tirada: dos mesas por noche</span>
          </div>

          <p className="rv-hoy" title="Hoy en cocina">
            <b>Hoy en cocina:</b> pasta fresca hecha a mano · vino de la casa · dulces de la casa
          </p>

          {/* ---------- Portada ---------- */}
          <div className="rv-portada">
            <article style={{ position: 'relative' }}>
              <p className="rv-kicker">Crónica de cocina</p>
              <h2 className="rv-titular">
                La cocina de la nonna <em>vuelve a la mesa</em> — y esta vez lleva el menú en el
                bolsillo
              </h2>
              <p className="rv-bajada">
                Treinta y seis años de pasta fresca, ragú lento y ninguna prisa: así se cocina en el
                Vicolo desde 1987.
              </p>

              <div className="rv-cuerpo">
                <p className="rv-capitular">
                  Todo empezó en una cocina pequeña, con una regla de hierro que nadie se atrevió a
                  romper: la pasta se hace el mismo día, la salsa se deja reposar y ningún cliente
                  tiene prisa. La receta de la nonna no está escrita en ningún libro; se hereda, se
                  discute en la mesa de la familia y se corrige con el tiempo.
                </p>

                <blockquote className="rv-tirada">
                  No se come rápido en una trattoria: se come bien, se bebe despacio y se conversa
              hasta tarde.
                </blockquote>

                <p>
                  Hoy seguimos abriendo al mediodía, cortando la pasta a mano y sirviendo el vino
                  como se sirve en casa: en jarra, con pan y sin ceremonias. Lo único que cambió es
                  la forma de pedir — la carta ahora llega a tu mesa por un código, y de ahí a la
                  cocina sin gritos ni papelitos.
                </p>
              </div>

              <figure className="rv-foto-gazzetta">
                <PlatoPasta />
                <figcaption>
                  foto · archivo de familia — <em>espaguetis al pomodoro, la receta de la nonna Rosa</em>
                </figcaption>
              </figure>

              <div className="rv-mancha" style={{ bottom: '3.5rem', right: '1.5rem' }} aria-hidden="true"></div>

              <p className="rv-nota-marginal" aria-hidden="true">
                no hay receta escrita — se hereda
              </p>
            </article>

            <aside className="rv-col-lateral">
              <div className="rv-recuadro">
                <p className="rv-recuadro-titulo">
                  La carta <span>de hoy</span>
                </p>
                <div className="rv-carta-item">
                  <span className="nombre">
                    Spaghetti al pomodoro
                    <span className="italiano">la receta de la abuela</span>
                  </span>
                  <span className="puntos"></span>
                  <span className="precio">$24.000</span>
                </div>
                <div className="rv-carta-item">
                  <span className="nombre">
                    Lasagna <Circulo>della nonna</Circulo>
                    <span className="italiano">el más amado</span>
                  </span>
                  <span className="puntos"></span>
                  <span className="precio">$38.000</span>
                </div>
                <div className="rv-carta-item">
                  <span className="nombre">
                    Ossobuco alla milanese
                    <span className="italiano">con risotto al azafrán</span>
                  </span>
                  <span className="puntos"></span>
                  <span className="precio">$58.000</span>
                </div>
                <div className="rv-carta-item">
                  <span className="nombre">
                    Panna cotta
                    <span className="italiano">con frutos rojos</span>
                  </span>
                  <span className="puntos"></span>
                  <span className="precio">$16.000</span>
                </div>
                <p className="rv-carta-nota">solo hoy · fresco del mercado</p>
              </div>

              <div className="rv-recuadro">
                <p className="rv-recuadro-titulo">
                  El vino de la semana <span>N.º 4</span>
                </p>
                <p className="rv-vino-nombre">
                  Chianti Classico <em>2019</em>
                </p>
                <p className="rv-vino-desc">
                  Tinto de la casa, lo recomienda Massimo con la pasta. <Circulo>¡óptimo!</Circulo>
                </p>
              </div>

              <div className="rv-recuadro">
                <p className="rv-recuadro-titulo">
                  El tiempo en la cocina <span>hoy</span>
                </p>
                <p className="rv-vino-desc">
                  28° en el horno · masa madre feliz · lluvia, solo de tomate. Pronóstico para hoy:
                  sin prisa.
                </p>
              </div>

              <div className="rv-classificato">
                <p className="rv-classificato-titulo">Se ordena al instante</p>
                <p className="rv-classificato-texto">
                  Pide desde tu mesa sin levantarte ni pedir permiso.
                </p>
                <Link href="/menu?mesa=1" className="rv-btn rv-btn-pomodoro">
                  <i className="bi bi-qr-code-scan"></i> Pedir desde la mesa
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ================= LA CARTA (doble página) ================= */}
      <section className="rv-carta-seccion rv-grano">
        <div className="container">
          <header className="rv-carta-cabecera">
            <p className="rv-kicker">Edición extraordinaria</p>
            <h2 className="rv-carta-nombre-grande">
              La <em>Carta</em>
            </h2>
            <p className="rv-carta-fecha">el menú del día — hecho en casa</p>
          </header>

          <div className="rv-columnas-carta">
            {CURSOS.map((curso) => (
              <div className="rv-bloque-curso" key={curso.nombre}>
                <p className="rv-curso">{curso.nombre}</p>
                {curso.platos.map((plato) => (
                  <div className="rv-plato-fila" key={plato.nombre}>
                    <div className="d-flex align-items-baseline flex-wrap">
                      <span className="nombre">
                        {plato.nombre}
                        {plato.favorito && <span className="rv-favorito">el más amado</span>}
                        {plato.picante && <span className="rv-picante">¡picante!</span>}
                      </span>
                    </div>
                    <div className="d-flex align-items-baseline gap-3">
                      <span className="italiano">{plato.italiano}</span>
                      <span className="puntos"></span>
                      <span className="precio">{plato.precio}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <p className="rv-carta-pie">
            la pasta se hace el mismo día — si se acaba, se acaba
          </p>

          <div className="text-center mt-4">
            <Link href="/menu" className="rv-btn rv-btn-linea">
              Ver la carta completa <i className="bi bi-arrow-right"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* ================= ANNUNCI (el servicio, como clasificados) ================= */}
      <section className="rv-anuncios rv-grano">
        <div className="container">
          <header className="rv-anuncios-cabecera">
            <h2 className="rv-anuncios-titulo">
              Anuncios <em>del servicio</em>
            </h2>
            <p className="rv-mano rv-mano-oliva" style={{ fontSize: '1.7rem' }}>
              la casa se modernizó, sin perder el restaurante
            </p>
          </header>

          <div className="rv-anuncios-grid">
            {ANUNCIOS.map((anuncio) => (
              <div className="rv-anuncio" key={anuncio.titulo}>
                <span className="rv-anuncio-tag">{anuncio.tag}</span>
                <p className="rv-anuncio-titulo">
                  <i className={`bi ${anuncio.icono}`}></i> {anuncio.titulo}
                </p>
                <p>{anuncio.texto}</p>
              </div>
            ))}

            <div className="rv-anuncio rv-anuncio-ancho">
              <p>“Se busca — a quien pida sin postre. Hasta hoy, nadie lo ha logrado.”</p>
              <span className="rv-mano rv-mano-pomodoro" style={{ fontSize: '1.5rem' }}>
                — la dirección
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= IL CONTO (la cuenta) ================= */}
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
            <AccesoEmpleados className="rv-conto-empleados" />
          </div>
        </div>
      </section>
    </div>
  );
}