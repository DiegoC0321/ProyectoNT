'use client';

import RequireRole from '@/components/RequireRole';

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return <RequireRole roles={['CLIENTE']}>{children}</RequireRole>;
}
