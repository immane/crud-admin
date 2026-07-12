<template>
  <span v-if="value">
    <i class="el-icon-time" />
    {{ new Date(value) | dateFormat('YYYY-MM-DD') }}
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
  }
}
</script>
