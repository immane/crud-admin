<template>
  <form-admin
    v-model="form[field.property]"
    entity-conf="Option"
    :fields="fields"
  >
    <template v-slot:title><span /></template>
    <template v-slot:action><span /></template>
  </form-admin>
</template>

<script>
/**
 * @description Array fields
 * @example
 */
/*
  { property: 'pictures',
    type: 'array',     // Auto detected.
    type_options: { fields: [
      { property: 'picture', type: 'image', field_options: { label: 'Picture' }},
      { property: 'link', type: 'input', field_options: { label: 'Url' }},
      { property: 'listOrder', type: 'input', field_options: { label: 'List order' }}
    ] },
    default_value: {}  // Default value must be set.
  }
*/

import FormAdmin from '@/components/EasyAdmin/FormAdmin'

export default {
  components: { FormAdmin },
  props: {
    form: {
      type: Object,
      default: () => { return {} }
    },
    field: {
      type: Object,
      default: () => { return {} }
    }
  },
  data() {
    return {
      fields: this.field?.type_options?.fields ??
        [{ property: 'common', type: 'input', field_options: { label: $t('Default') }}]
    }
  },
  created() {
    if (!this.form[this.field.property] || Array.isArray(this.form[this.field.property])) {
      this.form[this.field.property] = {}
    }
  }
}
</script>
