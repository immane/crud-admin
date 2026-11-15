import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ElementPlus from 'element-plus'
import RecordDialog from '@/easyadmin/ui/vue/RecordDialog.vue'

describe('RecordDialog', () => {
  let wrapper
  let main
  let bounds

  beforeEach(() => {
    bounds = { left: 210, top: 56, right: 1000, bottom: 760 }
    main = document.createElement('section')
    main.className = 'app-main'
    main.getBoundingClientRect = () => bounds
    document.body.append(main)
    wrapper = mount(RecordDialog, {
      attachTo: document.body,
      props: { modelValue: true, title: 'Edit Record' },
      attrs: { class: 'easy-admin-dialog' },
      slots: { default: '<input value="unsaved" />', footer: '<button>Save</button>' },
      global: { plugins: [ElementPlus], mocks: { $t: key => key }}
    })
    wrapper.vm.observeBounds()
  })

  afterEach(() => {
    wrapper.unmount()
    main.remove()
    vi.unstubAllGlobals()
  })

  it('bounds the overlay to the main area, not the sidebar or navbar', () => {
    expect(wrapper.vm.layoutStyle).toMatchObject({
      '--record-left': '210px', '--record-top': '56px',
      '--record-area-width': '790px', '--record-area-height': '704px',
      '--record-width': '766px'
    })
  })

  it('keeps the frame resize handle outside the footer and content flow without an extra bar', () => {
    const handle = wrapper.find('.record-dialog-resize').element
    expect(handle.closest('.el-dialog__body')).not.toBeNull()
    expect(handle.closest('.el-dialog__footer')).toBeNull()
    expect(handle.closest('.record-dialog-scroll')).toBeNull()
    expect(handle.closest('.record-dialog-content')).toBeNull()
    expect(wrapper.find('.record-dialog-resize-bar').exists()).toBe(false)
    expect(wrapper.find('.el-dialog__footer').text()).toBe('Save')
  })

  it('expands and restores the resized size without remounting the form', async() => {
    wrapper.vm.setSize(600, 400)
    await nextTick()
    const input = wrapper.find('input').element
    await wrapper.find('.record-dialog-expand').trigger('click')
    expect(wrapper.vm.layoutStyle['--record-width']).toBe('790px')
    expect(wrapper.vm.layoutStyle['--record-height']).toBe('704px')
    expect(wrapper.find('.record-dialog-resize').exists()).toBe(false)
    expect(wrapper.find('.record-dialog-expand').attributes('aria-pressed')).toBe('true')
    await wrapper.find('.record-dialog-expand').trigger('click')
    expect(wrapper.vm.layoutStyle['--record-width']).toBe('600px')
    expect(wrapper.vm.layoutStyle['--record-height']).toBe('400px')
    expect(wrapper.find('input').element).toBe(input)
  })

  it('resizes symmetrically with the pointer and stops after release', async() => {
    const handle = wrapper.find('.record-dialog-resize').element
    handle.closest('.el-dialog').getBoundingClientRect = () => ({ width: 600, height: 400 })
    wrapper.vm.startResize({ button: 0, pointerId: 1, clientX: 600, clientY: 400, currentTarget: handle, preventDefault() {} })
    const dispatch = (type, x, y) => {
      const event = new Event(type)
      Object.assign(event, { pointerId: 1, clientX: x, clientY: y })
      window.dispatchEvent(event)
    }
    dispatch('pointermove', 620, 430)
    expect(wrapper.vm.size).toEqual({ width: 640, height: 460 })
    dispatch('pointerup', 620, 430)
    dispatch('pointermove', 700, 500)
    expect(wrapper.vm.size).toEqual({ width: 640, height: 460 })
  })

  it('supports keyboard resizing, clamps to small viewports and reacts to layout changes', async() => {
    const handle = wrapper.find('.record-dialog-resize')
    handle.element.closest('.el-dialog').getBoundingClientRect = () => ({ width: 600, height: 400 })
    await handle.trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.vm.size).toEqual({ width: 620, height: 400 })
    bounds = { left: 0, top: 56, right: 320, bottom: 400 }
    window.dispatchEvent(new Event('resize'))
    expect(wrapper.vm.layoutStyle['--record-width']).toBe('296px')
    wrapper.vm.setSize(1, 1)
    expect(wrapper.vm.size).toEqual({ width: 296, height: 240 })
    wrapper.vm.expanded = true
    wrapper.vm.resetLayout()
    expect(wrapper.vm.expanded).toBe(false)
    expect(wrapper.vm.size).toBe(null)
  })

  it('forwards visibility updates and closed events', async() => {
    const dialog = wrapper.findComponent({ name: 'ElDialog' })
    dialog.vm.$emit('update:modelValue', false)
    dialog.vm.$emit('closed')
    await nextTick()
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('falls back to the viewport without a main area and clips offscreen bounds', () => {
    main.remove()
    wrapper.vm.observeBounds()
    expect(wrapper.vm.bounds).toEqual({ left: 0, top: 0, width: window.innerWidth, height: window.innerHeight })
    document.body.append(main)
    bounds = { left: -10, top: -20, right: window.innerWidth + 100, bottom: window.innerHeight + 100 }
    wrapper.vm.updateBounds()
    expect(wrapper.vm.bounds).toEqual({ left: 0, top: 0, width: window.innerWidth, height: window.innerHeight })
    bounds = { left: window.innerWidth + 10, top: window.innerHeight + 10, right: window.innerWidth + 100, bottom: window.innerHeight + 100 }
    wrapper.vm.updateBounds()
    expect(wrapper.vm.bounds).toEqual({ left: window.innerWidth, top: window.innerHeight, width: 0, height: 0 })
    wrapper.vm.setSize(600, 400)
    expect(wrapper.vm.size).toEqual({ width: 0, height: 0 })
  })

  it('observes main-area changes and releases observers and listeners on close', () => {
    const observers = []
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback) {
        this.callback = callback
        this.observe = vi.fn()
        this.disconnect = vi.fn()
        observers.push(this)
      }
    })
    wrapper.vm.observeBounds()
    expect(observers[0].observe).toHaveBeenCalledWith(main)
    bounds = { left: 64, top: 56, right: 900, bottom: 700 }
    observers[0].callback()
    expect(wrapper.vm.bounds.width).toBe(836)
    wrapper.vm.observeBounds()
    expect(observers[0].disconnect).toHaveBeenCalled()
    expect(observers[1].observe).toHaveBeenCalledWith(main)
    bounds = { left: 100, top: 56, right: 900, bottom: 700 }
    window.dispatchEvent(new Event('scroll'))
    expect(wrapper.vm.bounds.left).toBe(100)
    bounds = { left: 120, top: 56, right: 900, bottom: 700 }
    document.dispatchEvent(new Event('transitionend'))
    expect(wrapper.vm.bounds.left).toBe(120)
    wrapper.vm.resetLayout()
    expect(observers[1].disconnect).toHaveBeenCalled()
    bounds = { left: 200, top: 56, right: 900, bottom: 700 }
    window.dispatchEvent(new Event('resize'))
    window.dispatchEvent(new Event('scroll'))
    document.dispatchEvent(new Event('transitionend'))
    expect(wrapper.vm.bounds.left).toBe(120)
  })

  it('ignores non-primary pointer buttons, other pointers and resizing while expanded', async() => {
    const handle = wrapper.find('.record-dialog-resize')
    handle.element.closest('.el-dialog').getBoundingClientRect = () => ({ width: 600, height: 400 })
    const pointerEvent = { button: 0, pointerId: 1, clientX: 600, clientY: 400, currentTarget: handle.element, preventDefault: vi.fn() }
    wrapper.vm.startResize({ ...pointerEvent, button: 2 })
    expect(pointerEvent.preventDefault).not.toHaveBeenCalled()
    wrapper.vm.expanded = true
    wrapper.vm.startResize(pointerEvent)
    wrapper.vm.resizeWithKeyboard({ key: 'ArrowRight', preventDefault: pointerEvent.preventDefault })
    expect(pointerEvent.preventDefault).not.toHaveBeenCalled()
    wrapper.vm.expanded = false
    await handle.trigger('keydown', { key: 'Enter' })
    expect(wrapper.vm.size).toBeNull()
    wrapper.vm.startResize(pointerEvent)
    const dispatch = (type, pointerId) => {
      const event = new Event(type)
      Object.assign(event, { pointerId, clientX: 620, clientY: 430 })
      window.dispatchEvent(event)
    }
    dispatch('pointermove', 2)
    dispatch('pointerup', 2)
    expect(wrapper.vm.size).toBeNull()
    dispatch('pointermove', 1)
    expect(wrapper.vm.size).toEqual({ width: 640, height: 460 })
    dispatch('pointercancel', 1)
    dispatch('pointermove', 1)
    expect(wrapper.vm.size).toEqual({ width: 640, height: 460 })
  })

  it('replaces active drags and ends them on blur or unmount', () => {
    const handle = wrapper.find('.record-dialog-resize').element
    handle.closest('.el-dialog').getBoundingClientRect = () => ({ width: 600, height: 400 })
    const start = clientX => wrapper.vm.startResize({ button: 0, pointerId: 1, clientX, clientY: 400, currentTarget: handle, preventDefault() {} })
    const move = () => {
      const event = new Event('pointermove')
      Object.assign(event, { pointerId: 1, clientX: 620, clientY: 430 })
      window.dispatchEvent(event)
    }
    start(600)
    start(610)
    move()
    expect(wrapper.vm.size).toEqual({ width: 620, height: 460 })
    window.dispatchEvent(new Event('blur'))
    wrapper.vm.size = null
    move()
    expect(wrapper.vm.size).toBeNull()
    start(600)
    wrapper.unmount()
    move()
    expect(wrapper.vm.size).toBeNull()
  })
})
