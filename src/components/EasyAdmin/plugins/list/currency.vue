<template>
  <span class="currency-value">{{ formattedValue }}</span>
</template>

<script>
import { formatCurrency } from '@/utils/currency'

export default {
  props: {
    value: { type: [String, Number, Boolean, Object, Array], default: null },
    field: { type: Object, default: () => ({}) }
  },
  computed: {
    formattedValue() {
      return formatCurrency(this.value, this.field)
    }
  }
}
</script>

<style scoped>
.currency-value {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
</style>
