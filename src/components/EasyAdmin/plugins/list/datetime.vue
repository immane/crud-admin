<template>
  <span v-if="value">
    <i class="el-icon-time" />
    {{ formatDateTime(value) }}
  </span>
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
  methods: {
    formatDateTime(value) {
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return ''
      const datePart = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
      const timePart = [date.getHours(), date.getMinutes(), date.getSeconds()].map(item => String(item).padStart(2, '0')).join(':')
      return `${datePart} ${timePart}`
    }
  }
}
</script>
