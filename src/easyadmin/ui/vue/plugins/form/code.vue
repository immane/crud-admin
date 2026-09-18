<template>
  <div class="code-editor" :style="{ '--code-editor-height': editorHeight }">
    <div ref="editor" class="code-editor__surface" />
  </div>
</template>

<script>
import { EditorState } from '@codemirror/state'
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers
} from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { bracketMatching, defaultHighlightStyle, indentOnInput, syntaxHighlighting } from '@codemirror/language'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { sql } from '@codemirror/lang-sql'

const languageExtensions = {
  javascript: () => javascript(),
  js: () => javascript(),
  typescript: () => javascript({ typescript: true }),
  ts: () => javascript({ typescript: true }),
  json: () => json(),
  html: () => html(),
  css: () => css(),
  sql: () => sql()
}

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
  },
  data() {
    return {
      view: null,
      updatingFromEditor: false
    }
  },
  computed: {
    editorHeight() {
      const height = this.field.type_options?.height
      return typeof height === 'number' ? `${height}px` : height || '280px'
    },
    language() {
      return String(this.field.type_options?.language || '').toLowerCase()
    },
    modelValue() {
      return this.form[this.field.property]
    }
  },
  watch: {
    modelValue(value) {
      if (this.updatingFromEditor || !this.view) return

      const nextValue = value == null ? '' : String(value)
      if (nextValue === this.view.state.doc.toString()) return

      this.view.dispatch({
        changes: { from: 0, to: this.view.state.doc.length, insert: nextValue }
      })
    }
  },
  mounted() {
    const options = this.field.type_options || {}
    const languageExtension = languageExtensions[this.language]?.()
    const initialValue = this.modelValue == null ? '' : String(this.modelValue)

    const updateListener = EditorView.updateListener.of(update => {
      if (!update.docChanged) return

      const value = update.state.doc.toString()
      this.updatingFromEditor = true
      this.form[this.field.property] = value
      this.$nextTick(() => { this.updatingFromEditor = false })
      this.field.type_events?.input?.(value)
      this.field.type_events?.['update:model-value']?.(value)
    })

    const state = EditorState.create({
      doc: initialValue,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        bracketMatching(),
        highlightActiveLine(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        EditorState.readOnly.of(Boolean(options.readonly || options.disabled)),
        EditorView.editable.of(!options.readonly && !options.disabled),
        EditorView.theme({
          '&': { height: 'var(--code-editor-height)' },
          '.cm-scroller': { overflow: 'auto', fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace', fontSize: '13px' },
          '.cm-content': { padding: '12px 0' },
          '.cm-gutters': { backgroundColor: '#f8fafc', color: '#98a2b3', borderRight: '1px solid #e7edf4' },
          '.cm-activeLineGutter': { backgroundColor: '#eef4ff' },
          '.cm-activeLine': { backgroundColor: '#f8fbff' }
        }),
        languageExtension,
        updateListener
      ].filter(Boolean)
    })

    this.view = new EditorView({ state, parent: this.$refs.editor })
  },
  beforeUnmount() {
    this.view?.destroy()
    this.view = null
  }
}
</script>

<style scoped>
.code-editor {
  width: 100%;
  overflow: hidden;
  border: 1px solid #d9e1ec;
  border-radius: 8px;
  background: #fff;
  transition: border-color .2s ease, box-shadow .2s ease;
}

.code-editor:focus-within {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, .12);
}

.code-editor__surface :deep(.cm-editor) {
  height: var(--code-editor-height);
  outline: none;
}

</style>
