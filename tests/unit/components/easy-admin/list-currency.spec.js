import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import CurrencyCell from '@/easyadmin/ui/vue/plugins/list/currency.vue'
import { formatCurrency } from '@/utils/currency'

function mountCell(value, field = {}) {
  return mount(CurrencyCell, {
    props: { value, field },
    global: { plugins: [ElementPlus], mocks: { $t: (key) => key }}
  })
}

describe('list/currency.vue', () => {
  it('renders dash for empty values', () => {
    for (const value of [null, undefined, '']) {
      const wrapper = mountCell(value, {})
      expect(wrapper.find('.currency-value').text()).toBe('-')
      expect(wrapper.vm.formattedValue).toBe('-')
    }
  })

  it('passes through non-numeric strings', () => {
    const wrapper = mountCell('abc', {})
    expect(wrapper.find('.currency-value').text()).toBe('abc')
  })

  it('formats with default CNY options (multiplier 100)', () => {
    const wrapper = mountCell(10000, {})
    expect(wrapper.find('.currency-value').text()).toBe(formatCurrency(10000, {}))
    expect(wrapper.vm.formattedValue).toBe(formatCurrency(10000, {}))
  })

  it('formats string numbers and zero', () => {
    expect(mountCell('2500', {}).vm.formattedValue).toBe(formatCurrency('2500', {}))
    expect(mountCell(0, {}).vm.formattedValue).toBe(formatCurrency(0, {}))
    expect(mountCell(0, {}).find('.currency-value').text()).toBe(formatCurrency(0, {}))
  })

  it('honours custom currency and multiplier', () => {
    const field = { type_options: { currency: 'USD', multiplier: 1 }}
    const wrapper = mountCell(1234.5, field)
    expect(wrapper.vm.formattedValue).toBe(formatCurrency(1234.5, field))
    expect(wrapper.find('.currency-value').text()).toBe(formatCurrency(1234.5, field))
  })

  it('uses 3 fraction digits for multiplier 1000', () => {
    const field = { type_options: { currency: 'USD', multiplier: 1000 }}
    expect(mountCell(1500, field).vm.formattedValue).toBe(formatCurrency(1500, field))
  })

  it('falls back to multiplier 100 for invalid multipliers', () => {
    for (const multiplier of [0, -5, NaN, 'bad']) {
      const field = { type_options: { currency: 'CNY', multiplier }}
      expect(mountCell(100, field).vm.formattedValue).toBe(formatCurrency(100, field))
    }
  })

  it('applies currency-value styling class', () => {
    const wrapper = mountCell(500, {})
    expect(wrapper.find('span.currency-value').exists()).toBe(true)
  })
})
