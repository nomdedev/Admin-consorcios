import { describe, expect, it } from 'vitest';

import { formatCurrency, formatPeriodo } from '../lib/utils';

describe('utils', () => {
  it('formatea moneda en ARS', () => {
    const formatted = formatCurrency(1500);
    expect(formatted).toContain('$');
    expect(formatted).toMatch(/1\.500/);
  });

  it('formatea periodo YYYY-MM', () => {
    const formatted = formatPeriodo('2024-01');
    expect(formatted.toLowerCase()).toContain('enero');
    expect(formatted).toContain('2024');
  });
});
