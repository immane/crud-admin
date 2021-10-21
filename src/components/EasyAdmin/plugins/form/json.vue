<template>
  <vue-json-editor
    v-model="form[field.property]"
    :expanded-on-start="true"
    v-bind="field.type_options"
    v-on="field.type_events"
  />
</template>

<script>
import vueJsonEditor from 'vue-json-editor'

export default {
  components: { vueJsonEditor },
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
