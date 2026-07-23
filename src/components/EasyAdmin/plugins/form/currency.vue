<template>
  <div class="currency-input">
    <el-input-number
      v-model="displayValue"
      :step="inputOptions.step ?? 1 / currencyOptions.multiplier"
      :precision="inputOptions.precision ?? fractionDigits"
      v-bind="inputOptions"
      v-on="field.type_events || {}"
    />
    <span class="currency-input__code">{{ currencyOptions.currency }}</span>
  </div>
</template>

<script>
import { getCurrencyFractionDigits, getCurrencyOptions } from '@/utils/currency'

export default {
  props: {
    form: { type: Object, default: () => ({}) },
    field: { type: Object, default: () => ({}) }
  },
  computed: {
    currencyOptions() {
      return getCurrencyOptions(this.field)
    },
    fractionDigits() {
      return getCurrencyFractionDigits(this.currencyOptions.multiplier)
    },
    inputOptions() {
      const options = { ...(this.field.type_options || {}) }
      delete options.multiplier
      delete options.currency
      return options
    },
    displayValue: {
      get() {
        const value = Number(this.form[this.field.property])
        return Number.isFinite(value) ? value / this.currencyOptions.multiplier : undefined
      },
      set(value) {
        this.form[this.field.property] = value === null || value === undefined
          ? null
          : Math.round(Number(value) * this.currencyOptions.multiplier)
      }
    }
  }
}
</script>

<style scoped>
.currency-input {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.currency-input :deep(.el-input-number) {
  width: 100%;
}

.currency-input__code {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
}
</style>
