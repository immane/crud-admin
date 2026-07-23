import { getLocale } from '@/i18n'

const localeMap = {
  zh: 'zh-CN',
  'zh-Hant': 'zh-TW',
  ja: 'ja-JP',
  en: 'en-US'
}

export function getCurrencyOptions(field = {}) {
  const options = field.type_options || {}
  const multiplier = Number(options.multiplier)

  return {
    multiplier: Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 100,
    currency: String(options.currency || 'CNY').toUpperCase()
  }
}

export function getCurrencyFractionDigits(multiplier) {
  const digits = Math.log10(multiplier)
  return Number.isInteger(digits) ? Math.max(0, digits) : 2
}

export function getCurrencySymbol(currency) {
  try {
    return new Intl.NumberFormat(localeMap[getLocale()] || 'en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol'
    }).formatToParts(0).find(part => part.type === 'currency')?.value || currency
  } catch {
    return currency
  }
}

export function formatCurrency(value, field) {
  if (value === null || value === undefined || value === '') return '-'

  const amount = Number(value)
  if (!Number.isFinite(amount)) return String(value)

  const { multiplier, currency } = getCurrencyOptions(field)
  const fractionDigits = getCurrencyFractionDigits(multiplier)

  try {
    return new Intl.NumberFormat(localeMap[getLocale()] || 'en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits
    }).format(amount / multiplier)
  } catch {
    return `${getCurrencySymbol(currency)}${(amount / multiplier).toFixed(fractionDigits)}`
  }
}
