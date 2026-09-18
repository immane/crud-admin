import { mount } from '@vue/test-utils'
import { reactive, nextTick } from 'vue'

vi.mock('@codemirror/state', () => ({
  __esModule: true,
  EditorState: {
    create: (args) => {
      const docText = args.doc ?? ''
      globalThis.__cmLastStateArgs = args
      return {
        doc: { toString: () => String(docText), length: String(docText).length },
        extensions: args.extensions
      }
    },
    readOnly: { of: (v) => ({ kind: 'readOnly', value: v }) }
  }
}))

vi.mock('@codemirror/view', () => {
  class FakeView {
    constructor({ state, parent }) {
      this.state = state
      this.parent = parent
      this.destroyed = false
      globalThis.__cmLastView = this
      if (parent) parent.__cmView = this
    }
    dispatch({ changes }) {
      const cur = this.state.doc.toString()
      const next = cur.slice(0, changes.from) + changes.insert + cur.slice(changes.to)
      this.state = { ...this.state, doc: { toString: () => next, length: next.length }}
    }
    destroy() {
      this.destroyed = true
    }
    static updateListener = { of: (fn) => { globalThis.__cmListener = fn; return { kind: 'updateListener' } } }
    static editable = { of: (v) => ({ kind: 'editable', value: v }) }
    static theme = () => ({ kind: 'theme' })
  }
  return {
    __esModule: true,
    EditorView: FakeView,
    drawSelection: () => ({}),
    highlightActiveLine: () => ({}),
    highlightActiveLineGutter: () => ({}),
    highlightSpecialChars: () => ({}),
    keymap: { of: () => ({ kind: 'keymap' }) },
    lineNumbers: () => ({})
  }
})

vi.mock('@codemirror/commands', () => ({
  __esModule: true,
  defaultKeymap: [],
  history: () => ({}),
  historyKeymap: [],
  indentWithTab: {}
}))

vi.mock('@codemirror/language', () => ({
  __esModule: true,
  bracketMatching: () => ({}),
  defaultHighlightStyle: {},
  indentOnInput: () => ({}),
  syntaxHighlighting: () => ({})
}))

vi.mock('@codemirror/lang-javascript', () => ({ __esModule: true, javascript: () => ({ kind: 'javascript' }) }))
vi.mock('@codemirror/lang-json', () => ({ __esModule: true, json: () => ({ kind: 'json' }) }))
vi.mock('@codemirror/lang-html', () => ({ __esModule: true, html: () => ({ kind: 'html' }) }))
vi.mock('@codemirror/lang-css', () => ({ __esModule: true, css: () => ({ kind: 'css' }) }))
vi.mock('@codemirror/lang-sql', () => ({ __esModule: true, sql: () => ({ kind: 'sql' }) }))

import CodePlugin from '@/easyadmin/ui/vue/plugins/form/code.vue'

function makeWrapper(form, field) {
  return mount(CodePlugin, {
    props: { form, field },
    global: { mocks: { $t: (k) => k }}
  })
}

function simulateEditorInput(text) {
  return globalThis.__cmListener({ docChanged: true, state: { doc: { toString: () => text }}})
}

describe('form-code plugin', () => {
  beforeEach(() => {
    delete globalThis.__cmLastStateArgs
    delete globalThis.__cmLastView
    delete globalThis.__cmListener
  })

  it('mounts CodeMirror with initial doc from form value', () => {
    const form = reactive({ script: 'const a = 1' })
    const field = reactive({ property: 'script', type: 'code', type_options: { language: 'javascript' }})
    const wrapper = makeWrapper(form, field)
    expect(globalThis.__cmLastStateArgs.doc).toBe('const a = 1')
    expect(wrapper.vm.view).toBeDefined()
    expect(wrapper.vm.view.state.doc.toString()).toBe('const a = 1')
    expect(wrapper.find('.code-editor__surface').exists()).toBe(true)
    wrapper.unmount()
  })

  it('initialises empty doc when form value is nullish', () => {
    const form = reactive({ script: null })
    const field = reactive({ property: 'script' })
    const wrapper = makeWrapper(form, field)
    expect(globalThis.__cmLastStateArgs.doc).toBe('')
    wrapper.unmount()
  })

  it('propagates editor changes to the form model and fires type_events', async() => {
    const form = reactive({ script: 'old' })
    const onInput = vi.fn()
    const onUpdate = vi.fn()
    const field = reactive({
      property: 'script',
      type_options: { language: 'javascript' },
      type_events: { input: onInput, 'update:model-value': onUpdate }
    })
    const wrapper = makeWrapper(form, field)
    simulateEditorInput('new code')
    await nextTick()
    await nextTick()
    expect(form.script).toBe('new code')
    expect(onInput).toHaveBeenCalledWith('new code')
    expect(onUpdate).toHaveBeenCalledWith('new code')
    wrapper.unmount()
  })

  it('ignores editor updates without doc changes and works without type_events', async() => {
    const form = reactive({ script: 'keep' })
    const field = reactive({ property: 'script' })
    const wrapper = makeWrapper(form, field)
    globalThis.__cmListener({ docChanged: false, state: { doc: { toString: () => 'other' }}})
    await nextTick()
    expect(form.script).toBe('keep')
    wrapper.unmount()
  })

  it('dispatches external model changes into the editor doc', async() => {
    const form = reactive({ script: 'a' })
    const field = reactive({ property: 'script' })
    const wrapper = makeWrapper(form, field)
    const dispatch = vi.spyOn(wrapper.vm.view, 'dispatch')
    form.script = 'external'
    await nextTick()
    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(wrapper.vm.view.state.doc.toString()).toBe('external')
    wrapper.unmount()
  })

  it('skips dispatch when external value already matches editor doc', async() => {
    const form = reactive({ script: 'same' })
    const field = reactive({ property: 'script' })
    const wrapper = makeWrapper(form, field)
    const dispatch = vi.spyOn(wrapper.vm.view, 'dispatch')
    form.script = 'same'
    await nextTick()
    expect(dispatch).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('computes editor height from numeric, string and default options', () => {
    const form = reactive({ script: '' })
    const numeric = makeWrapper(form, reactive({ property: 'script', type_options: { height: 320 }}))
    expect(numeric.vm.editorHeight).toBe('320px')
    expect(numeric.find('.code-editor').attributes('style')).toContain('320px')
    const str = makeWrapper(form, reactive({ property: 'script', type_options: { height: '50vh' }}))
    expect(str.vm.editorHeight).toBe('50vh')
    const def = makeWrapper(form, reactive({ property: 'script' }))
    expect(def.vm.editorHeight).toBe('280px')
    numeric.unmount()
    str.unmount()
    def.unmount()
  })

  it('normalises language names case-insensitively', () => {
    const form = reactive({ script: '' })
    const wrapper = makeWrapper(form, reactive({ property: 'script', type_options: { language: 'JSON' }}))
    expect(wrapper.vm.language).toBe('json')
    wrapper.unmount()
  })

  it('destroys the editor view on unmount', () => {
    const form = reactive({ script: 'x' })
    const field = reactive({ property: 'script' })
    const wrapper = makeWrapper(form, field)
    const view = wrapper.vm.view
    wrapper.unmount()
    expect(view.destroyed).toBe(true)
  })
})
