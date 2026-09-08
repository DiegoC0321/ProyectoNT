'use client';

import RequireRole from '@/components/RequireRole';

export default function CocinaLayout({ children }: { children: React.ReactNode }) {
  return <RequireRole roles={['COCINA']}>{children}</RequireRole>;
}
