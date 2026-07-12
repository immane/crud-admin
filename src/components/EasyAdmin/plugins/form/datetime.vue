<template>
  <el-date-picker
    v-model="form[field.property]"
    type="datetime"
    :placeholder="$t('form.selectDateTime')"
    v-bind="field.type_options"
    value-format="yyyy-MM-dd HH:mm:ss"
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
