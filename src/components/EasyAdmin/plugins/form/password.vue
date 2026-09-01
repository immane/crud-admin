<template>
  <el-input
    :model-value="form[field.property]"
    type="password"
    show-password
    :placeholder="field.field_options?.placeholder || $t('Password')"
    :clearable="true"
    autocomplete="new-password"
    v-bind="field.type_options"
    v-on="field.type_events || {}"
    @update:model-value="onUpdate"
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
    },
    struct: {
      type: Object,
      default: () => { return {} }
    }
  },
  methods: {
    onUpdate(val) {
      // Convert empty string to null so FormAdmin.cleanBlankAttributes can drop it on edit
      const normalized = val === '' ? null : val
      this.form[this.field.property] = normalized
      // Compatibility: backend may expect `password` or `plainPassword`; sync both
      const alias = this.field.property === 'plainPassword' ? 'password' : this.field.property === 'password' ? 'plainPassword' : null
      if (alias) {
        this.form[alias] = normalized
      }
    }
  }
}
</script>
