import { describe, it, expect } from 'vitest'
import {
  cn,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPeriodo,
  formatPeriodoCorto,
  getCurrentPeriodo,
  daysDifference,
  isOverdue,
  truncate,
  capitalize,
  getInitials,
  formatPhoneAR,
  isValidCUIT,
  formatCUIT,
} from './utils'

describe('cn (classnames)', () => {
  it('combina clases correctamente', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('fusiona clases de Tailwind conflictivas', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('maneja valores condicionales', () => {
    expect(cn('base', false && 'hidden', true && 'visible')).toBe('base visible')
  })
})

describe('formatCurrency', () => {
  it('formatea números positivos correctamente', () => {
    expect(formatCurrency(1234.56)).toMatch(/\$\s*1\.234,56/)
    expect(formatCurrency(1000)).toMatch(/\$\s*1\.000/)
  })

  it('formatea números negativos correctamente', () => {
    expect(formatCurrency(-1234.56)).toMatch(/-?\$?\s*1\.234,56/)
  })

  it('maneja cero', () => {
    expect(formatCurrency(0)).toMatch(/\$\s*0/)
  })

  it('maneja null y undefined', () => {
    expect(formatCurrency(null)).toBe('$0')
    expect(formatCurrency(undefined)).toBe('$0')
  })

  it('maneja strings numéricos', () => {
    expect(formatCurrency('1234.56')).toMatch(/\$\s*1\.234,56/)
  })

  it('maneja strings inválidos', () => {
    expect(formatCurrency('invalid')).toBe('$0')
  })
})

describe('formatDate', () => {
  it('formatea una fecha correctamente', () => {
    // Usar fecha UTC a mediodía para evitar problemas de zona horaria
    const date = new Date('2026-01-15T12:00:00Z')
    const result = formatDate(date)
    // Verificar formato DD/MM/YYYY
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
    expect(result).toContain('2026')
  })

  it('acepta strings ISO', () => {
    // Las fechas sin hora pueden variar según timezone, solo verificamos formato
    const result = formatDate('2026-01-15')
    expect(result).toMatch(/^\d{2}\/01\/2026$/)
  })

  it('maneja null y undefined', () => {
    expect(formatDate(null)).toBe('-')
    expect(formatDate(undefined)).toBe('-')
  })

  it('maneja fechas inválidas', () => {
    expect(formatDate('invalid')).toBe('-')
  })
})

describe('formatDateTime', () => {
  it('incluye hora y minutos', () => {
    // Crear fecha local para evitar conversiones de zona horaria
    const date = new Date(2026, 0, 15, 14, 30, 0)
    const result = formatDateTime(date)
    // Verificar que contiene una fecha y algún formato de hora
    expect(result).toContain('2026')
    // La hora puede aparecer en diferentes formatos según locale (14:30 o 2:30 p.m.)
    expect(result).toMatch(/\d{1,2}[:.]\d{2}/)
  })
})

describe('formatPeriodo', () => {
  it('formatea período correctamente', () => {
    expect(formatPeriodo('2026-01')).toBe('Enero 2026')
    expect(formatPeriodo('2026-12')).toBe('Diciembre 2026')
    expect(formatPeriodo('2026-06')).toBe('Junio 2026')
  })

  it('maneja formato inválido', () => {
    expect(formatPeriodo('invalid')).toBe('invalid')
    expect(formatPeriodo('2026-1')).toBe('2026-1')
    expect(formatPeriodo('')).toBe('')
  })
})

describe('formatPeriodoCorto', () => {
  it('formatea período en formato corto', () => {
    expect(formatPeriodoCorto('2026-01')).toBe('Ene 2026')
    expect(formatPeriodoCorto('2026-12')).toBe('Dic 2026')
    expect(formatPeriodoCorto('2026-06')).toBe('Jun 2026')
  })
})

describe('getCurrentPeriodo', () => {
  it('retorna período en formato YYYY-MM', () => {
    const result = getCurrentPeriodo()
    expect(result).toMatch(/^\d{4}-\d{2}$/)
  })

  it('retorna el período actual', () => {
    const now = new Date()
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    expect(getCurrentPeriodo()).toBe(expected)
  })
})

describe('daysDifference', () => {
  it('calcula diferencia de días correctamente', () => {
    const date1 = new Date('2026-01-01')
    const date2 = new Date('2026-01-10')
    expect(daysDifference(date1, date2)).toBe(9)
  })

  it('retorna valor absoluto', () => {
    const date1 = new Date('2026-01-10')
    const date2 = new Date('2026-01-01')
    expect(daysDifference(date1, date2)).toBe(9)
  })

  it('retorna 0 para misma fecha', () => {
    const date = new Date('2026-01-01')
    expect(daysDifference(date, date)).toBe(0)
  })
})

describe('isOverdue', () => {
  it('retorna true para fechas pasadas', () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 1)
    expect(isOverdue(pastDate)).toBe(true)
  })

  it('retorna false para fechas futuras', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 1)
    expect(isOverdue(futureDate)).toBe(false)
  })

  it('maneja null y undefined', () => {
    expect(isOverdue(null)).toBe(false)
    expect(isOverdue(undefined)).toBe(false)
  })
})

describe('truncate', () => {
  it('trunca texto largo', () => {
    expect(truncate('Esto es un texto largo', 10)).toBe('Esto es un...')
  })

  it('no modifica texto corto', () => {
    expect(truncate('Corto', 10)).toBe('Corto')
  })

  it('maneja texto vacío', () => {
    expect(truncate('', 10)).toBe('')
  })

  it('maneja límite igual a longitud', () => {
    expect(truncate('Exacto', 6)).toBe('Exacto')
  })
})

describe('capitalize', () => {
  it('capitaliza cada palabra', () => {
    expect(capitalize('hola mundo')).toBe('Hola Mundo')
  })

  it('maneja mayúsculas mixtas', () => {
    expect(capitalize('HOLA mundo')).toBe('Hola Mundo')
  })

  it('maneja texto vacío', () => {
    expect(capitalize('')).toBe('')
  })
})

describe('getInitials', () => {
  it('extrae iniciales de nombre completo', () => {
    expect(getInitials('Juan Pérez')).toBe('JP')
    expect(getInitials('María García López')).toBe('MG')
  })

  it('maneja un solo nombre', () => {
    expect(getInitials('Juan')).toBe('J')
  })

  it('respeta maxInitials', () => {
    expect(getInitials('Juan Carlos Pérez', 3)).toBe('JCP')
  })

  it('maneja texto vacío', () => {
    expect(getInitials('')).toBe('')
  })
})

describe('formatPhoneAR', () => {
  it('formatea teléfono con código de país', () => {
    // 54 + 10 dígitos (sin el 9 de celular)
    expect(formatPhoneAR('541112345678')).toBe('+54 11 1234-5678')
  })

  it('formatea teléfono local', () => {
    expect(formatPhoneAR('1112345678')).toBe('11 1234-5678')
  })

  it('maneja null y undefined', () => {
    expect(formatPhoneAR(null)).toBe('-')
    expect(formatPhoneAR(undefined)).toBe('-')
  })

  it('retorna el original si no puede parsear', () => {
    expect(formatPhoneAR('123')).toBe('123')
  })
})

describe('isValidCUIT', () => {
  it('valida CUIT correcto', () => {
    // CUIT válido de prueba
    expect(isValidCUIT('20123456786')).toBe(true)
    expect(isValidCUIT('20-12345678-6')).toBe(true)
  })

  it('rechaza CUIT incorrecto', () => {
    expect(isValidCUIT('20123456789')).toBe(false)
    expect(isValidCUIT('12345678901')).toBe(false)
  })

  it('rechaza longitud incorrecta', () => {
    expect(isValidCUIT('123456')).toBe(false)
    expect(isValidCUIT('123456789012')).toBe(false)
  })
})

describe('formatCUIT', () => {
  it('formatea CUIT con guiones', () => {
    expect(formatCUIT('20123456786')).toBe('20-12345678-6')
  })

  it('limpia caracteres no numéricos', () => {
    expect(formatCUIT('20-12345678-6')).toBe('20-12345678-6')
  })

  it('maneja null y undefined', () => {
    expect(formatCUIT(null)).toBe('-')
    expect(formatCUIT(undefined)).toBe('-')
  })

  it('retorna original si longitud incorrecta', () => {
    expect(formatCUIT('123')).toBe('123')
  })
})
