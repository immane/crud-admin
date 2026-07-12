<template>
  <span>{{ displayValue }}</span>
</template>

<script>
export default {
  props: {
    value: { type: [String, Number, Boolean, Object, Array], default: null },
    field: { type: Object, default: () => ({}) },
    scope: { type: Object, default: () => ({}) },
    em: { type: Object, default: () => ({}) },
    struct: { type: Object, default: () => ({}) }
  },
  computed: {
    displayValue() {
      if (this.value == null) return ''
      return String(this.value).replace(/<[^>]*>/g, '')
    }
  }
}
</script>
