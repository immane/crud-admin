<template>
  <el-input
    v-model="form[field.property]"
    :autosize="{ minRows: 2 }"
    type="textarea"
    v-bind="field.type_options"
    v-on="field.type_events || {}"
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
