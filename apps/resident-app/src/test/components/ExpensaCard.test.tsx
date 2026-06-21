import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import ExpensasPage from '@/app/app/expensas/page';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('ExpensasPage', () => {
  it('renderiza expensas desde la API', async () => {
    render(<ExpensasPage />);

    await screen.findByText('Mis Expensas');

    const yearSelect = await screen.findByLabelText('Filtrar por año');
    fireEvent.change(yearSelect, { target: { value: '2024' } });

    await screen.findByText(/Saldo actual/i);
    await screen.findByText(/Pagar ahora/);

    expect(screen.getByText(/enero 2024/i)).toBeInTheDocument();
    expect(screen.getByText(/febrero 2024/i)).toBeInTheDocument();
  });

  it('filtra solo expensas pendientes', async () => {
    render(<ExpensasPage />);

    await screen.findByText('Mis Expensas');

    const yearSelect = await screen.findByLabelText('Filtrar por año');
    fireEvent.change(yearSelect, { target: { value: '2024' } });

    await screen.findByText(/enero 2024/i);

    fireEvent.click(screen.getByRole('button', { name: 'Pendientes' }));

    await waitFor(() => {
      expect(screen.queryByText('Pagado')).not.toBeInTheDocument();
    });
  });
});
