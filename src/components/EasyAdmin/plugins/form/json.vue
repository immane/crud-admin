<template>
  <div class="json-editor-field">
    <div class="json-editor-toolbar">
      <el-button size="mini" plain @click="formatJson">格式化</el-button>
      <span v-if="error" class="json-editor-error">{{ error }}</span>
    </div>
    <prism-editor
      v-model="editorText"
      class="json-editor"
      :highlight="highlighter"
      line-numbers
      v-bind="field.type_options"
      v-on="field.type_events"
      @input="handleInput"
    />
  </div>
</template>

<script>
import { PrismEditor } from 'vue-prism-editor'
import 'vue-prism-editor/dist/prismeditor.min.css'

import { highlight, languages } from 'prismjs/components/prism-core'
import 'prismjs/components/prism-json'
import 'prismjs/themes/prism-tomorrow.css'

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
  data() {
    return {
      editorText: '',
      error: ''
    }
  },
  watch: {
    'field.property': {
      immediate: true,
      handler() {
        this.editorText = this.stringifyValue(this.form[this.field.property])
      }
    }
  },
  created() {
    this.editorText = this.stringifyValue(this.form[this.field.property])
  },
  methods: {
    highlighter(code) {
      return highlight(code, languages.json)
    },

    stringifyValue(value) {
      if (typeof value === 'string') {
        try {
          return JSON.stringify(JSON.parse(value), null, 2)
        } catch (error) {
          return value
        }
      }
      if (value === undefined) return '{}'
      return JSON.stringify(value, null, 2)
    },

    handleInput(value) {
      this.error = ''

      try {
        const parsed = value.trim() ? JSON.parse(value) : null
        this.$set(this.form, this.field.property, parsed)
      } catch (error) {
        this.error = error.message
      }
    },

    formatJson() {
      try {
        const parsed = this.editorText.trim() ? JSON.parse(this.editorText) : null
        this.editorText = JSON.stringify(parsed, null, 2)
        this.$set(this.form, this.field.property, parsed)
        this.error = ''
      } catch (error) {
        this.error = error.message
      }
    }
  }
}
</script>

<style scoped>
.json-editor-field {
  width: 100%;
}

.json-editor-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.json-editor-error {
  color: #f56c6c;
  font-size: 12px;
}

.json-editor {
  min-height: 220px;
  max-height: 520px;
  overflow: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #2d2d2d;
  color: #ccc;
  font-family: Fira code, Fira Mono, Consolas, Menlo, Courier, monospace;
  font-size: 13px;
  line-height: 1.5;
  padding: 8px;
}

.json-editor ::v-deep .prism-editor__textarea:focus {
  outline: none;
}
</style>
