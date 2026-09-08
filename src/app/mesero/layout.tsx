'use client';

import RequireRole from '@/components/RequireRole';

export default function MeseroLayout({ children }: { children: React.ReactNode }) {
  return <RequireRole roles={['MESERO']}>{children}</RequireRole>;
}
