'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import type { IScannerControls } from '@zxing/browser';

export interface ResultadoEscaner {
  tipo: 'ok' | 'error';
  texto: string;
}

interface Props {
  abierto: boolean;
  cantidad: number;
  onCantidad: (n: number) => void;
  onDetectado: (codigo: string) => void;
  onReanudar: () => void;
  onCerrar: () => void;
  resultado?: ResultadoEscaner | null;
}

/**
 * Escáner de código de barras por cámara (opcional). Abre la cámara trasera
 * cuando `abierto` es true, decodifica EAN/UPC/Code128/etc. y pausa al
 * detectar un código: el padre decide (agregar al stock) y el operario pulsa
 * "Seguir escaneando" para el siguiente. Si no hay cámara o no llega
 * permiso, avisa y deja usar el ingreso manual.
 */
export default function EscanerCodigo({
  abierto,
  cantidad,
  onCantidad,
  onDetectado,
  onReanudar,
  onCerrar,
  resultado,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlesRef = useRef<IScannerControls | null>(null);
  const pausadoRef = useRef(false);
  const onDetectadoRef = useRef(onDetectado);
  const [iniciando, setIniciando] = useState(false);
  const [errorCamara, setErrorCamara] = useState('');

  useEffect(() => {
    onDetectadoRef.current = onDetectado;
  }, [onDetectado]);

  const detener = useCallback(() => {
    controlesRef.current?.stop();
    controlesRef.current = null;
  }, []);

  useEffect(() => {
    pausadoRef.current = false;
    setErrorCamara('');

    if (!abierto) {
      detener();
      return;
    }

    setIniciando(true);
    let cancelado = false;
    const reader = new BrowserMultiFormatReader();

    reader
      .decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' } }, audio: false },
        videoRef.current ?? undefined,
        (result) => {
          if (!result || pausadoRef.current) return;
          pausadoRef.current = true;
          onDetectadoRef.current(result.getText());
        }
      )
      .then((controles) => {
        if (cancelado) {
          controles.stop();
          return;
        }
        controlesRef.current = controles;
        setIniciando(false);
      })
      .catch((err: unknown) => {
        if (cancelado) return;
        setErrorCamara(
          err instanceof Error && err.message
            ? err.message
            : 'No se pudo abrir la cámara.'
        );
        setIniciando(false);
      });

    return () => {
      cancelado = true;
      detener();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  if (!abierto) return null;

  return (
    <div className="rv-escaneo-overlay" style={estilos.overlay}>
      <div className="card shadow-lg" style={estilos.tarjeta}>
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <h5 className="mb-0" style={{ fontFamily: 'var(--font-display)' }}>
            <i className="bi bi-upc-scan me-2"></i>Escanear código de barras
          </h5>
          <button className="btn-close" onClick={onCerrar} aria-label="Cerrar escáner"></button>
        </div>

        <div className="p-3">
          <div
            style={{
              position: 'relative',
              borderRadius: '0.75rem',
              overflow: 'hidden',
              background: '#000',
              aspectRatio: '4 / 3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <video ref={videoRef} playsInline muted autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {(iniciando || errorCamara) && !resultado && (
              <div className="d-flex flex-column align-items-center gap-2 text-center text-white px-3" style={{ position: 'absolute', inset: 0, justifyContent: 'center' }}>
                {iniciando ? (
                  <>
                    <span className="spinner-border"></span>
                    <small>Abriendo la cámara...</small>
                  </>
                ) : (
                  <>
                    <i className="bi bi-camera-video-off fs-1"></i>
                    <small>{errorCamara}. Puedes escribir el código a mano abajo.</small>
                  </>
                )}
              </div>
            )}
            {!iniciando && !errorCamara && !resultado && (
              <div className="rv-escaneo-guia" style={estilos.guia}>
                <span className="rv-escaneo-linea" style={estilos.linea}></span>
              </div>
            )}
          </div>

          {resultado && (
            <div
              className={`alert ${resultado.tipo === 'ok' ? 'alert-success' : 'alert-danger'} mt-3 mb-0`}
              role="status"
            >
              {resultado.tipo === 'ok' ? <i className="bi bi-check-circle-fill me-1"></i> : <i className="bi bi-x-circle-fill me-1"></i>}
              {resultado.texto}
            </div>
          )}
        </div>

        <div className="p-3 pt-0 d-flex flex-wrap align-items-center gap-2">
          <label className="form-label mb-0 me-1 small">Cantidad</label>
          <input
            type="number"
            min="0"
            step="0.001"
            className="form-control form-control-sm"
            style={{ maxWidth: 120 }}
            value={cantidad}
            onChange={(e) => onCantidad(Number(e.target.value))}
          />
          <button
            className="rv-btn rv-btn-pomodoro ms-auto"
            onClick={() => {
              setErrorCamara('');
              onReanudar();
            }}
          >
            <i className="bi bi-barcode"></i> Seguir escaneando
          </button>
        </div>
      </div>
    </div>
  );
}

const estilos = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 1080,
    background: 'rgba(20, 12, 6, 0.78)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.75rem',
  },
  tarjeta: {
    width: '100%',
    maxWidth: 420,
  },
  guia: {
    height: 2,
    width: '78%',
    background: 'linear-gradient(90deg, transparent, #e0b23a, transparent)',
    boxShadow: '0 0 6px rgba(224, 178, 58, 0.9)',
    animation: 'rv-escaneo-desliza 1.6s ease-in-out infinite alternate',
  },
  linea: {},
};