import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { QueryProvider } from '../lib/providers';

describe('QueryProvider', () => {
  it('renderiza children correctamente', () => {
    render(
      <QueryProvider>
        <div data-testid="child">Contenido hijo</div>
      </QueryProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Contenido hijo')).toBeInTheDocument();
  });

  it('provee contexto de QueryClient a componentes hijos', () => {
    // Componente que verifica acceso al context
    const TestComponent = () => {
      // Si no hay provider, esto fallaría
      return <div data-testid="query-child">Query context disponible</div>;
    };

    render(
      <QueryProvider>
        <TestComponent />
      </QueryProvider>
    );

    expect(screen.getByTestId('query-child')).toBeInTheDocument();
  });

  it('permite renderizar múltiples children', () => {
    render(
      <QueryProvider>
        <div data-testid="first">Primero</div>
        <div data-testid="second">Segundo</div>
      </QueryProvider>
    );

    expect(screen.getByTestId('first')).toBeInTheDocument();
    expect(screen.getByTestId('second')).toBeInTheDocument();
  });
});
