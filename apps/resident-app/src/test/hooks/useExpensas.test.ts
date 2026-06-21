import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import ExpensaDetallePage from '@/app/app/expensas/[periodo]/page';

vi.mock('next/navigation', () => ({
  useParams: () => ({ periodo: '2024-01' }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href }, children),
}));

describe('ExpensaDetallePage', () => {
  it('muestra el resumen y el total a pagar', async () => {
    render(React.createElement(ExpensaDetallePage));

    await screen.findByText(/Total a pagar/i);
    expect(screen.getByText(/Pagar ahora/i)).toBeInTheDocument();
    expect(screen.getByText(/Desglose/i)).toBeInTheDocument();
  });

  it('renderiza gastos ordinarios y extraordinarios', async () => {
    render(React.createElement(ExpensaDetallePage));

    await screen.findByText(/Expensas ordinarias/i);
    expect(screen.getByText(/Expensas extraordinarias/i)).toBeInTheDocument();
    expect(screen.getByText(/Bonificación/i)).toBeInTheDocument();
  });
});
