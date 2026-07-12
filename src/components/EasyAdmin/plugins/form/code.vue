<template>
  <el-input
    v-model="form[field.property]"
    type="textarea"
    :rows="12"
    class="my-editor"
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

<style>
  .my-editor {
    border: 1px solid silver;
    font-family: Fira code, Fira Mono, Consolas, Menlo, Courier, monospace;
    font-size: 14px;
    line-height: 1.5;
    padding: 5px;
  }

  .prism-editor__textarea:focus {
    outline: none;
  }
</style>
