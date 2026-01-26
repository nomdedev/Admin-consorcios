'use client';

import { QueryProvider } from '@/lib/query-provider';
import { Toaster } from 'ui';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      {children}
      <Toaster />
    </QueryProvider>
  );
}
