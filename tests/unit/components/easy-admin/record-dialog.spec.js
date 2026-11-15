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
})
