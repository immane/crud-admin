<template>
  <tinymce
    v-model="form[field.property]"
    :height="300"
    v-bind="field.type_options"
    v-on="field.type_events"
  />
</template>

<script>
import Tinymce from '@/components/Tinymce'

export default {
  components: { Tinymce },
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
