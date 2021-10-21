<template>
  <el-input
    v-model="form[field.property]"
    v-bind="field.type_options"
    v-on="field.type_events"
  />
</template>

<script>
export default {
  props: {
    form: {
      type: Object,
      default: () => { return {} }
    },
    field: {
      type: Object,
      default: () => { return {} }
    }
  }
}
</script>
