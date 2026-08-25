import { vi } from 'vitest'

const mockGetLocale = jest.fn(() => 'en')

jest.mock('@/i18n', () => ({
  getLocale: (...args) => mockGetLocale(...args)
}))

import { getCurrencyOptions, getCurrencyFractionDigits, getCurrencySymbol, formatCurrency } from '@/utils/currency'

describe('Utils:currency', () => {
  beforeEach(() => {
    mockGetLocale.mockReset()
    mockGetLocale.mockReturnValue('en')
  })

  describe('getCurrencyOptions', () => {
    it('defaults to multiplier 100 and CNY', () => {
      expect(getCurrencyOptions()).toEqual({ multiplier: 100, currency: 'CNY' })
      expect(getCurrencyOptions({})).toEqual({ multiplier: 100, currency: 'CNY' })
      expect(getCurrencyOptions({ type_options: {} })).toEqual({ multiplier: 100, currency: 'CNY' })
    })

    it('parses valid multiplier string/number', () => {
      expect(getCurrencyOptions({ type_options: { multiplier: 1 } }).multiplier).toBe(1)
      expect(getCurrencyOptions({ type_options: { multiplier: '1000' } }).multiplier).toBe(1000)
      expect(getCurrencyOptions({ type_options: { multiplier: 100 } }).multiplier).toBe(100)
    })

    it('falls back to 100 for invalid multiplier', () => {
      expect(getCurrencyOptions({ type_options: { multiplier: 0 } }).multiplier).toBe(100)
      expect(getCurrencyOptions({ type_options: { multiplier: -5 } }).multiplier).toBe(100)
      expect(getCurrencyOptions({ type_options: { multiplier: NaN } }).multiplier).toBe(100)
      expect(getCurrencyOptions({ type_options: { multiplier: Infinity } }).multiplier).toBe(100)
      expect(getCurrencyOptions({ type_options: { multiplier: 'abc' } }).multiplier).toBe(100)
      expect(getCurrencyOptions({ type_options: { multiplier: '' } }).multiplier).toBe(100)
    })

    it('uppercases currency and defaults to CNY', () => {
      expect(getCurrencyOptions({ type_options: { currency: 'usd' } }).currency).toBe('USD')
      expect(getCurrencyOptions({ type_options: { currency: 'jpy' } }).currency).toBe('JPY')
      expect(getCurrencyOptions({ type_options: { currency: 'cny' } }).currency).toBe('CNY')
      expect(getCurrencyOptions({ type_options: { currency: 'EUR' } }).currency).toBe('EUR')
    })

    it('handles empty/undefined currency', () => {
      expect(getCurrencyOptions({ type_options: { currency: '' } }).currency).toBe('CNY')
      expect(getCurrencyOptions({ type_options: { currency: null } }).currency).toBe('CNY')
    })
  })

  describe('getCurrencyFractionDigits', () => {
    it('returns log10 for power-of-10 multipliers', () => {
      expect(getCurrencyFractionDigits(1)).toBe(0)
      expect(getCurrencyFractionDigits(10)).toBe(1)
      expect(getCurrencyFractionDigits(100)).toBe(2)
      expect(getCurrencyFractionDigits(1000)).toBe(3)
      expect(getCurrencyFractionDigits(100000)).toBe(5)
    })

    it('returns 2 for non-power-of-10', () => {
      expect(getCurrencyFractionDigits(15)).toBe(2)
      expect(getCurrencyFractionDigits(123)).toBe(2)
      expect(getCurrencyFractionDigits(0)).toBe(2) // log10(0) = -Infinity not integer
      expect(getCurrencyFractionDigits(NaN)).toBe(2)
    })

    it('clamps negative digits to 0', () => {
      // multiplier <1 gives negative log10, but integer negative => Math.max(0, digits)
      // e.g. 0.1 => -1 => 0
      expect(getCurrencyFractionDigits(0.1)).toBe(0)
    })
  })

  describe('getCurrencySymbol', () => {
    it('returns symbol for known currencies', () => {
      mockGetLocale.mockReturnValue('en')
      const usd = getCurrencySymbol('USD')
      expect(typeof usd).toBe('string')
      expect(usd.length).toBeGreaterThan(0)
      // en-US USD symbol should be $
      expect(usd).toBe('$')
    })

    it('maps zh locale to zh-CN', () => {
      mockGetLocale.mockReturnValue('zh')
      const symbol = getCurrencySymbol('CNY')
      expect(typeof symbol).toBe('string')
      expect(symbol.length).toBeGreaterThan(0)
    })

    it('maps zh-Hant to zh-TW and ja to ja-JP', () => {
      mockGetLocale.mockReturnValue('zh-Hant')
      expect(typeof getCurrencySymbol('TWD')).toBe('string')
      mockGetLocale.mockReturnValue('ja')
      expect(typeof getCurrencySymbol('JPY')).toBe('string')
    })

    it('falls back to en-US for unknown locale', () => {
      mockGetLocale.mockReturnValue('fr')
      const sym = getCurrencySymbol('EUR')
      expect(typeof sym).toBe('string')
    })

    it('returns currency code on invalid currency', () => {
      // Invalid currency throws RangeError inside Intl.NumberFormat
      expect(getCurrencySymbol('INVALID_CODE')).toBe('INVALID_CODE')
      expect(getCurrencySymbol('')).toBe('')
    })
  })

  describe('formatCurrency', () => {
    it('returns "-" for null/undefined/empty string', () => {
      expect(formatCurrency(null, {})).toBe('-')
      expect(formatCurrency(undefined, {})).toBe('-')
      expect(formatCurrency('', {})).toBe('-')
    })

    it('returns String(value) for non-finite numbers', () => {
      expect(formatCurrency('abc', {})).toBe('abc')
      expect(formatCurrency('NaN', {})).toBe('NaN')
      expect(formatCurrency(NaN, {})).toBe('NaN')
      expect(formatCurrency(Infinity, {})).toBe('Infinity')
    })

    it('formats zero correctly', () => {
      // 0 / 100 = 0.00 with CNY
      const result = formatCurrency(0, { type_options: { currency: 'CNY', multiplier: 100 } })
      expect(typeof result).toBe('string')
      expect(result).not.toBe('-')
    })

    it('formats with default multiplier 100', () => {
      mockGetLocale.mockReturnValue('en')
      // 12345 cents = 123.45
      const result = formatCurrency(12345, { type_options: { currency: 'USD', multiplier: 100 } })
      expect(result).toContain('123.45')
    })

    it('formats string numeric value', () => {
      mockGetLocale.mockReturnValue('en')
      const result = formatCurrency('5000', { type_options: { currency: 'USD', multiplier: 100 } })
      expect(result).toContain('50')
    })

    it('respects multiplier fraction digits', () => {
      mockGetLocale.mockReturnValue('en')
      // multiplier 1 => 0 digits
      const r1 = formatCurrency(1234, { type_options: { currency: 'JPY', multiplier: 1 } })
      expect(r1).toContain('1,234')
      // multiplier 1000 => 3 digits
      const r3 = formatCurrency(1234567, { type_options: { currency: 'USD', multiplier: 1000 } })
      // 1234.567 => should contain 1,234.567
      expect(r3).toContain('1,234.567')
    })

    it('handles negative values', () => {
      mockGetLocale.mockReturnValue('en')
      const result = formatCurrency(-5000, { type_options: { currency: 'USD', multiplier: 100 } })
      expect(result).toContain('50')
      expect(result).toContain('-')
    })

    it('falls back gracefully on Intl error (invalid currency)', () => {
      mockGetLocale.mockReturnValue('en')
      const result = formatCurrency(12345, { type_options: { currency: 'FAKE', multiplier: 100 } })
      // fallback is `${symbol}${(amount/multiplier).toFixed(digits)}` where symbol is currency itself
      expect(result).toContain('123.45')
      expect(result).toContain('FAKE')
    })

    it('uses zh locale mapping', () => {
      mockGetLocale.mockReturnValue('zh')
      const result = formatCurrency(10000, { type_options: { currency: 'CNY', multiplier: 100 } })
      expect(typeof result).toBe('string')
      expect(result).toContain('100')
    })

    it('handles undefined field param', () => {
      mockGetLocale.mockReturnValue('en')
      const result = formatCurrency(100, undefined)
      expect(typeof result).toBe('string')
    })
  })
})
