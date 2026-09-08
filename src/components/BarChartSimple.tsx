interface BarraDato {
  etiqueta: string;
  valor: number;
}

export default function BarChartSimple({ datos, formato }: { datos: BarraDato[]; formato?: (v: number) => string }) {
  const max = Math.max(...datos.map((d) => d.valor), 1);
  return (
    <div>
      {datos.map((d) => (
        <div key={d.etiqueta} className="mb-2">
          <div className="d-flex justify-content-between small mb-1">
            <span>{d.etiqueta}</span>
            <span className="text-muted">{formato ? formato(d.valor) : d.valor}</span>
          </div>
          <div className="progress" style={{ height: 10 }}>
            <div
              className="progress-bar bg-warning"
              style={{ width: `${Math.max((d.valor / max) * 100, 3)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
