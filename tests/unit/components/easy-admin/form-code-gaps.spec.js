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
      this.state = { ...this.state, doc: { toString: () => next, length: next.length } }
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

import CodePlugin from '@/components/EasyAdmin/plugins/form/code.vue'

function makeWrapper(form, field) {
  return mount(CodePlugin, {
    props: { form, field },
    global: { mocks: { $t: (k) => k } }
  })
}

describe('form/code.vue gaps', () => {
  beforeEach(() => {
    delete globalThis.__cmLastStateArgs
    delete globalThis.__cmLastView
    delete globalThis.__cmListener
  })

  it('covers nullish modelValue branch (line 70 true) with dispatch to empty', async () => {
    const form = reactive({ script: 'hello' })
    const field = reactive({ property: 'script' })
    const wrapper = makeWrapper(form, field)
    expect(wrapper.vm.view.state.doc.toString()).toBe('hello')
    const dispatch = vi.spyOn(wrapper.vm.view, 'dispatch')
    form.script = null
    await nextTick()
    // nextValue '' !== 'hello' so dispatch fires with empty insert
    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(wrapper.vm.view.state.doc.toString()).toBe('')
    wrapper.unmount()
  })

  it('covers nullish modelValue matching doc (lines 70-71 early return)', async () => {
    const form = reactive({ script: null })
    const field = reactive({ property: 'script' })
    const wrapper = makeWrapper(form, field)
    expect(wrapper.vm.view.state.doc.toString()).toBe('')
    const dispatch = vi.spyOn(wrapper.vm.view, 'dispatch')
    // null -> undefined still triggers watcher (change) but normalizes to '' which matches doc
    form.script = undefined
    await nextTick()
    expect(dispatch).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('covers language aliases js/ts/typescript/html/css/sql/json', () => {
    const form = reactive({ script: '' })
    for (const language of ['js', 'ts', 'typescript', 'html', 'css', 'sql', 'json', 'javascript']) {
      const wrapper = makeWrapper(form, reactive({ property: 'script', type_options: { language } }))
      expect(wrapper.vm.language).toBe(language)
      wrapper.unmount()
    }
  })
})
