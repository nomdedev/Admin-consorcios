import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { Providers } from '../lib/providers';

describe('Providers', () => {
  it('renderiza children', () => {
    render(
      <Providers>
        <div>Contenido</div>
      </Providers>
    );

    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });
});
