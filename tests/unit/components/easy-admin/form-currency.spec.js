import { mount } from '@vue/test-utils'
import { reactive, nextTick } from 'vue'
import ElementPlus, { ElInputNumber } from 'element-plus'
import CurrencyPlugin from '@/easyadmin/ui/vue/plugins/form/currency.vue'

function mountCurrency(formData = { amount: 0 }, fieldData = { property: 'amount' }) {
  const form = reactive(formData)
  const field = reactive(fieldData)
  const wrapper = mount(CurrencyPlugin, {
    props: { form, field },
    global: { plugins: [ElementPlus] }
  })
  return { wrapper, form, field }
}

function inputNumber(wrapper) {
  return wrapper.findComponent(ElInputNumber)
}

describe('form/currency.vue', () => {
  it('converts stored cents to display yuan with the default multiplier of 100', () => {
    const { wrapper } = mountCurrency({ amount: 1999 }, { property: 'amount' })
    expect(inputNumber(wrapper).props('modelValue')).toBeCloseTo(19.99, 10)
  })

  it('shows the default currency code CNY', () => {
    const { wrapper } = mountCurrency({ amount: 100 }, { property: 'amount' })
    expect(wrapper.find('.currency-input__code').text()).toBe('CNY')
  })

  it('converts an edited display value back to integer cents (v-model)', async() => {
    const { wrapper, form } = mountCurrency({ amount: 1999 }, { property: 'amount' })
    await inputNumber(wrapper).vm.$emit('update:modelValue', 20)
    expect(form.amount).toBe(2000)
  })

  it('rounds fractional cents with Math.round', async() => {
    const { wrapper, form } = mountCurrency({ amount: 0 }, { property: 'amount' })
    await inputNumber(wrapper).vm.$emit('update:modelValue', 19.995)
    expect(form.amount).toBe(2000)
  })

  it('maps null/undefined display input to null in the form', async() => {
    const { wrapper, form } = mountCurrency({ amount: 100 }, { property: 'amount' })
    await inputNumber(wrapper).vm.$emit('update:modelValue', null)
    expect(form.amount).toBeNull()
    await inputNumber(wrapper).vm.$emit('update:modelValue', undefined)
    expect(form.amount).toBeNull()
  })

  it('displays undefined when the stored value is missing or non-numeric', () => {
    const { wrapper } = mountCurrency({}, { property: 'amount' })
    expect(inputNumber(wrapper).props('modelValue')).toBeUndefined()
    const bad = mountCurrency({ amount: 'oops' }, { property: 'amount' })
    expect(inputNumber(bad.wrapper).props('modelValue')).toBeUndefined()
  })

  it('supports a custom multiplier and currency code (e.g. JPY x1000)', async() => {
    const { wrapper, form } = mountCurrency(
      { price: 5000 },
      { property: 'price', type_options: { multiplier: 1000, currency: 'jpy' }}
    )
    expect(inputNumber(wrapper).props('modelValue')).toBe(5)
    expect(wrapper.find('.currency-input__code').text()).toBe('JPY')
    await inputNumber(wrapper).vm.$emit('update:modelValue', 5.5)
    expect(form.price).toBe(5500)
  })

  it('falls back to multiplier 100 for invalid multipliers', () => {
    const { wrapper } = mountCurrency(
      { amount: 250 },
      { property: 'amount', type_options: { multiplier: 0 }}
    )
    expect(inputNumber(wrapper).props('modelValue')).toBe(2.5)
  })

  it('defaults precision to fraction digits and step to 1/multiplier', () => {
    const { wrapper } = mountCurrency({ amount: 100 }, { property: 'amount' })
    expect(inputNumber(wrapper).props('precision')).toBe(2)
    expect(inputNumber(wrapper).props('step')).toBeCloseTo(0.01, 10)
  })

  it('uses 3 fraction digits for multiplier 1000 and 0 for multiplier 1', () => {
    const m1000 = mountCurrency({ p: 1000 }, { property: 'p', type_options: { multiplier: 1000 }})
    expect(inputNumber(m1000.wrapper).props('precision')).toBe(3)
    const m1 = mountCurrency({ p: 5 }, { property: 'p', type_options: { multiplier: 1 }})
    expect(inputNumber(m1.wrapper).props('precision')).toBe(0)
  })

  it('respects explicit precision / step overrides from type_options', () => {
    const { wrapper } = mountCurrency(
      { amount: 100 },
      { property: 'amount', type_options: { precision: 1, step: 0.5, min: 0 }}
    )
    const num = inputNumber(wrapper)
    expect(num.props('precision')).toBe(1)
    expect(num.props('step')).toBe(0.5)
    expect(num.props('min')).toBe(0)
  })

  it('strips multiplier/currency from the options passed to el-input-number', () => {
    const { wrapper } = mountCurrency(
      { amount: 100 },
      { property: 'amount', type_options: { multiplier: 100, currency: 'CNY', min: 0 }}
    )
    const num = inputNumber(wrapper)
    expect(num.vm.$attrs.multiplier).toBeUndefined()
    expect(num.vm.$attrs.currency).toBeUndefined()
    expect(num.props('min')).toBe(0)
  })

  it('forwards type_events to el-input-number', async() => {
    const onChange = vi.fn()
    const { wrapper } = mountCurrency(
      { amount: 100 },
      { property: 'amount', type_events: { change: onChange }}
    )
    inputNumber(wrapper).vm.$emit('change', 2, 1)
    await nextTick()
    expect(onChange).toHaveBeenCalledWith(2, 1)
  })

  it('reflects external form mutations in the display value', async() => {
    const { wrapper, form } = mountCurrency({ amount: 100 }, { property: 'amount' })
    form.amount = 250
    await nextTick()
    expect(inputNumber(wrapper).props('modelValue')).toBeCloseTo(2.5, 10)
  })
})
