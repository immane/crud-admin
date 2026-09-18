<template>
  <tinymce
    :model-value="form[field.property]"
    :height="300"
    width="100%"
    v-bind="field.type_options"
    @update:model-value="form[field.property] = $event"
    v-on="field.type_events || {}"
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
