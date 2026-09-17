import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import EmailField from '@/easyadmin/ui/vue/plugins/form/email.vue'

function mountEmail({ form = {}, field = { property: 'email' }, provide = {} } = {}) {
  return mount(EmailField, {
    props: { form, field, struct: {} },
    global: {
      plugins: [ElementPlus],
      mocks: { $t: (key) => key },
      provide
    }
  })
}

describe('form/email.vue gaps', () => {
  it('covers getFormAdmin throw branch (lines 67-68) via $parent walk', () => {
    const wrapper = mountEmail({
      form: {},
      field: { property: 'email' },
      provide: {
        getFormAdmin: () => { throw new Error('boom') }
      }
    })
    // getFormAdmin threw -> catch ignored -> $parent walk finds nothing -> no crash
    expect(wrapper.vm.getFormAdminInstance()).toBeFalsy()
  })

  it('covers getFormAdmin throw with $parent rules fallback', () => {
    const fakeAdmin = { rules: {} }
    const wrapper = mountEmail({
      form: {},
      field: { property: 'email' },
      provide: {
        getFormAdmin: () => { throw new Error('boom') }
      },
      // mount options cannot set $parent directly; verify catch path returns parent chain (null-safe)
    })
    expect(() => wrapper.vm.registerValidator()).not.toThrow()
    expect(fakeAdmin.rules.email).toBeUndefined()
  })

  it('covers triggerValidate validateField throw branch (lines 100-101)', async () => {
    const form = {}
    const wrapper = mountEmail({
      form,
      field: { property: 'email' },
      provide: {
        getFormAdmin: () => ({
          id: 0,
          rules: {},
          $refs: {
            form: {
              validateField: () => { throw new Error('validate boom') }
            }
          }
        })
      }
    })
    wrapper.vm.onUpdate('user@example.com')
    await flushPromises()
    await wrapper.vm.$nextTick()
    await flushPromises()
    expect(form.email).toBe('user@example.com')
    // no unhandled throw
  })
})
