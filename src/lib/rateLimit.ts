/**
 * Rate-limit simple en memoria para el inicio de sesión, por IP.
 *
 * Reglas: máximo 5 fallos por ventana de 15 minutos. Al superarlos se bloquea
 * la IP con backoff exponencial (15 min, 30 min, 1 h, ... hasta 24 h máximo).
 * Un éxito limpia el registro de esa IP.
 *
 * Limitación conocida: los datos viven en la memoria del proceso, así que
 * basta reiniciar el server (o escalar a más de un proceso) para
 * reiniciar los contadores. Para producción fuerte se recomienda un
 * rate-limit real (Cloudflare/Upstash/Redis).
 */
interface Registro {
  fallos: number;
  ultimoFallo: number;
  bloqueadoHasta: number;
}

const VENTANA_MS = 15 * 60 * 1000;
const MAX_FALLOS = 5;
const BLOQUEO_BASE_MS = 15 * 60 * 1000;
const BLOQUEO_MAX_MS = 24 * 60 * 60 * 1000;

const registros = new Map<string, Registro>();

function limpiarVencidos() {
  if (registros.size < 10_000) return;
  const ahora = Date.now();
  for (const [ip, r] of registros) {
    if (!r.bloqueadoHasta && ahora - r.ultimoFallo > VENTANA_MS) registros.delete(ip);
  }
}

export function estadoLogin(ip: string): { permitido: boolean; retryAfterSegundos: number } {
  const r = registros.get(ip);
  if (r && r.bloqueadoHasta > Date.now()) {
    return {
      permitido: false,
      retryAfterSegundos: Math.max(1, Math.ceil((r.bloqueadoHasta - Date.now()) / 1000)),
    };
  }
  return { permitido: true, retryAfterSegundos: 0 };
}

export function registrarFallo(ip: string) {
  limpiarVencidos();
  const ahora = Date.now();
  const previo = registros.get(ip);
  const dentroDeVentana = previo && (previo.bloqueadoHasta || ahora - previo.ultimoFallo < VENTANA_MS);
  const fallos = (dentroDeVentana ? previo!.fallos : 0) + 1;

  let bloqueadoHasta = 0;
  if (fallos >= MAX_FALLOS) {
    const potencia = Math.min(fallos - MAX_FALLOS, 10);
    bloqueadoHasta = ahora + Math.min(BLOQUEO_BASE_MS * Math.pow(2, potencia), BLOQUEO_MAX_MS);
  }

  registros.set(ip, { fallos, ultimoFallo: ahora, bloqueadoHasta });
}

export function registrarExito(ip: string) {
  registros.delete(ip);
}