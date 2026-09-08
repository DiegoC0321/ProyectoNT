import { ESTADO_BADGE_CLASE } from '@/utils/format';

export default function EstadoBadge({ estado }: { estado: string }) {
  const clase = ESTADO_BADGE_CLASE[estado] ?? 'text-bg-light';
  return <span className={`badge ${clase}`}>{estado}</span>;
}
