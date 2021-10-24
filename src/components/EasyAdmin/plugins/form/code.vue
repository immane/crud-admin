<template>
  <prism-editor
    v-model="form[field.property]"
    class="my-editor"
    :highlight="highlighter"
    line-numbers
    v-bind="field.type_options"
    v-on="field.type_events"
  />
</template>

<script>
import { PrismEditor } from 'vue-prism-editor'
import 'vue-prism-editor/dist/prismeditor.min.css'

import { highlight, languages } from 'prismjs/components/prism-core'
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-javascript'
import 'prismjs/themes/prism-tomorrow.css' // import syntax highlighting styles

export default {
  components: { PrismEditor },
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
  methods: {
    highlighter(code) {
      return highlight(code, languages.js) // returns html
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
