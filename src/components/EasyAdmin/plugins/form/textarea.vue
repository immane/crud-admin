<template>
  <el-input
    v-model="form[field.property]"
    type="textarea"
    :rows="3"
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
