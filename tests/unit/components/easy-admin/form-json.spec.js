import { mount } from '@vue/test-utils'
import { reactive, nextTick } from 'vue'

vi.mock('jsoneditor', () => {
  class FakeJSONEditor {
    constructor(el, options, initialValue) {
      this.el = el
      this.options = options
      this.value = initialValue
      this.set = vi.fn((v) => { this.value = v })
      this.get = vi.fn(() => this.value)
      this.destroy = vi.fn()
      globalThis.__jsonInstances = globalThis.__jsonInstances || []
      globalThis.__jsonInstances.push(this)
    }
  }
  return { __esModule: true, default: FakeJSONEditor }
})

import JsonPlugin from '@/easyadmin/ui/vue/plugins/form/json.vue'

function lastEditor() {
  const list = globalThis.__jsonInstances || []
  return list[list.length - 1]
}

async function flush() {
  await nextTick()
  await nextTick()
  await nextTick()
}

function makeWrapper(form, field) {
  return mount(JsonPlugin, {
    props: { form, field },
    global: { mocks: { $t: (k) => k } }
  })
}

describe('form-json plugin', () => {
  beforeEach(() => {
    globalThis.__jsonInstances = []
  })

  it('initialises editor with default mode and modes', async () => {
    const form = reactive({ payload: { a: 1 } })
    const field = reactive({ property: 'payload', type: 'json' })
    const wrapper = makeWrapper(form, field)
    await flush()
    const editor = lastEditor()
    expect(editor).toBeTruthy()
    expect(editor.options.mode).toBe('code')
    expect(editor.options.modes).toEqual(['tree', 'code', 'form', 'text', 'view'])
    expect(editor.value).toEqual({ a: 1 })
    wrapper.unmount()
  })

  it('respects custom mode and modes from type_options', async () => {
    const form = reactive({ payload: { a: 1 } })
    const field = reactive({ property: 'payload', type_options: { mode: 'tree', modes: ['tree', 'view'] } })
    const wrapper = makeWrapper(form, field)
    await flush()
    const editor = lastEditor()
    expect(editor.options.mode).toBe('tree')
    expect(editor.options.modes).toEqual(['tree', 'view'])
    wrapper.unmount()
  })

  it('parses string JSON values into the editor', async () => {
    const form = reactive({ payload: '{"x":10}' })
    const field = reactive({ property: 'payload' })
    const wrapper = makeWrapper(form, field)
    await flush()
    expect(lastEditor().value).toEqual({ x: 10 })
    wrapper.unmount()
  })

  it('keeps invalid JSON strings as-is without throwing', async () => {
    const form = reactive({ payload: '{broken' })
    const field = reactive({ property: 'payload' })
    const wrapper = makeWrapper(form, field)
    await flush()
    expect(lastEditor().value).toBe('{broken')
    wrapper.unmount()
  })

  it('initialises nullish values to empty object', async () => {
    const form = reactive({ payload: null })
    const field = reactive({ property: 'payload' })
    const wrapper = makeWrapper(form, field)
    await flush()
    expect(lastEditor().value).toEqual({})
    wrapper.unmount()
  })

  it('pushes external form changes into the editor via set', async () => {
    const form = reactive({ payload: { a: 1 } })
    const field = reactive({ property: 'payload' })
    const wrapper = makeWrapper(form, field)
    await flush()
    const editor = lastEditor()
    editor.set.mockClear()
    form.payload = { a: 2 }
    await flush()
    expect(editor.set).toHaveBeenCalledWith({ a: 2 })
    wrapper.unmount()
  })

  it('does not reset editor when change originates from the editor itself', async () => {
    const form = reactive({ payload: { a: 1 } })
    const field = reactive({ property: 'payload' })
    const wrapper = makeWrapper(form, field)
    await flush()
    const editor = lastEditor()
    editor.set.mockClear()
    // Simulate onChange having set the same value, then watcher fires with equal JSON
    editor.value = { a: 1 }
    editor.options.onChange()
    await flush()
    expect(form.payload).toEqual({ a: 1 })
    expect(editor.set).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('writes editor get() result back to the form on change', async () => {
    const form = reactive({ payload: { a: 1 } })
    const field = reactive({ property: 'payload' })
    const wrapper = makeWrapper(form, field)
    await flush()
    const editor = lastEditor()
    editor.value = { b: 2 }
    editor.options.onChange()
    await nextTick()
    expect(form.payload).toEqual({ b: 2 })
    wrapper.unmount()
  })

  it('keeps existing value when editor get() throws (invalid JSON)', async () => {
    const form = reactive({ payload: { a: 1 } })
    const field = reactive({ property: 'payload' })
    const wrapper = makeWrapper(form, field)
    await flush()
    const editor = lastEditor()
    editor.get.mockImplementationOnce(() => { throw new Error('invalid') })
    editor.options.onChange()
    await nextTick()
    expect(form.payload).toEqual({ a: 1 })
    wrapper.unmount()
  })

  it('destroys the editor on unmount and clears reference', async () => {
    const form = reactive({ payload: { a: 1 } })
    const field = reactive({ property: 'payload' })
    const wrapper = makeWrapper(form, field)
    await flush()
    const editor = lastEditor()
    wrapper.unmount()
    expect(editor.destroy).toHaveBeenCalledTimes(1)
  })
})
