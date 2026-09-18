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

describe('form/json.vue gaps', () => {
  beforeEach(() => {
    globalThis.__jsonInstances = []
  })

  it('covers JSON.stringify throw branch (lines 57-58) with circular value', async () => {
    const circular = { a: 1 }
    circular.self = circular
    const form = reactive({ payload: circular })
    const field = reactive({ property: 'payload' })
    const wrapper = makeWrapper(form, field)
    await flush()
    const editor = lastEditor()
    expect(editor).toBeTruthy()
    // watcher catch path: internalValue set without JSON comparison
    expect(wrapper.vm.internalValue).toMatchObject({ a: 1 })
    expect(wrapper.vm.internalValue.self).toBe(wrapper.vm.internalValue)
    expect(editor.value).toBe(wrapper.vm.internalValue)
    wrapper.unmount()
  })

  it('covers stringify-throw early return when next === internalValue', async () => {
    const circular = { a: 1 }
    circular.self = circular
    const form = reactive({ payload: { ok: true } })
    const field = reactive({ property: 'payload' })
    const wrapper = makeWrapper(form, field)
    await flush()
    // force internalValue to a circular proxy, then invoke watcher handler with the same proxy
    wrapper.vm.internalValue = circular
    await flush()
    const handler = wrapper.vm.$options.watch.fieldValue.handler
    const setSpy = lastEditor().set
    setSpy.mockClear()
    const sameRef = wrapper.vm.internalValue
    handler.call(wrapper.vm, sameRef)
    await flush()
    // next === internalValue in catch -> return, editor.set not called
    expect(setSpy).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
