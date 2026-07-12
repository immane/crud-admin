<template>
  <div class="json-editor-field">
    <div ref="container" class="jsoneditor-container" />
  </div>
</template>

<script>
import 'vue-json-editor/assets/jsoneditor.css'
import jsoneditorUrl from 'vue-json-editor/assets/jsoneditor.min.js?url'

let JSONEditor = null
let loading = null

export default {
  props: {
    form: {
      type: Object,
      default: () => ({})
    },
    field: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      editor: null,
      internalValue: null
    }
  },
  computed: {
    editorMode() {
      return this.field.type_options?.mode || 'code'
    },
    editorModes() {
      return this.field.type_options?.modes || ['tree', 'code', 'form', 'text', 'view']
    },
    fieldValue() {
      return this.form[this.field.property]
    }
  },
  watch: {
    fieldValue: {
      immediate: true,
      handler(v) {
        if (v != null) {
          try {
            this.internalValue = typeof v === 'string' ? JSON.parse(v) : v
          } catch (e) {
            this.internalValue = v
          }
        } else {
          this.internalValue = {}
        }
        if (this.editor) {
          this.editor.set(this.internalValue)
        }
      }
    }
  },
  async mounted() {
    await this.ensureJsonEditor()
    this.createEditor()
  },
  beforeDestroy() {
    if (this.editor) {
      this.editor.destroy()
      this.editor = null
    }
  },
  methods: {
    async ensureJsonEditor() {
      if (JSONEditor) return
      if (typeof window !== 'undefined' && window.JSONEditor) {
        JSONEditor = window.JSONEditor
        return
      }
      if (!loading) {
        loading = new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = jsoneditorUrl
          script.onload = () => {
            JSONEditor = window.JSONEditor
            resolve()
          }
          script.onerror = reject
          document.head.appendChild(script)
        })
      }
      await loading
    },
    createEditor() {
      const options = {
        mode: this.editorMode,
        modes: this.editorModes,
        onChange: () => {
          try {
            const json = this.editor.get()
            this.internalValue = json
            this.$set(this.form, this.field.property, json)
          } catch (e) {
            // invalid JSON, keep existing value
          }
        }
      }
      this.$nextTick(() => {
        this.editor = new JSONEditor(this.$refs.container, options, this.internalValue)
      })
    }
  }
}
</script>

<style scoped>
.json-editor-field {
  width: 100%;
}
.jsoneditor-container {
  min-height: 220px;
  max-height: 520px;
}
.json-editor-field ::v-deep .jsoneditor {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}
.json-editor-field ::v-deep .jsoneditor-outer {
  min-height: 220px;
  max-height: 520px;
}
.json-editor-field ::v-deep .ace_editor {
  min-height: 220px;
  max-height: 520px;
}
</style>
