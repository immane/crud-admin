import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus, { ElInput } from 'element-plus'
import PasswordField from '@/easyadmin/ui/vue/plugins/form/password.vue'

function mountPassword({ form = {}, field = { property: 'password' }, provide = {} } = {}) {
  return mount(PasswordField, {
    props: { form, field, struct: {} },
    global: {
      plugins: [ElementPlus],
      mocks: { $t: (key) => key },
      provide
    }
  })
}

describe('form/password.vue gaps', () => {
  it('covers getFormAdmin throw branch (lines 134-135)', () => {
    const wrapper = mountPassword({
      form: {},
      field: { property: 'password' },
      provide: {
        getFormAdmin: () => { throw new Error('boom') }
      }
    })
    expect(wrapper.vm.getFormAdminInstance()).toBeFalsy()
    expect(() => wrapper.vm.registerValidator()).not.toThrow()
  })

  it('covers triggerValidate validateField throw branch (lines 168-169)', async () => {
    const form = {}
    const wrapper = mountPassword({
      form,
      field: { property: 'password' },
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
    wrapper.vm.onUpdate('abc123')
    await flushPromises()
    await wrapper.vm.$nextTick()
    await flushPromises()
    expect(form.password).toBe('abc123')
  })

  it('covers placeholder fallback branch (line 7)', () => {
    const fallback = mountPassword({ form: {}, field: { property: 'password' } })
    expect(fallback.findComponent(ElInput).props('placeholder')).toBe('Password')

    const custom = mountPassword({
      form: {},
      field: { property: 'password', field_options: { placeholder: 'Custom placeholder' } }
    })
    expect(custom.findComponent(ElInput).props('placeholder')).toBe('Custom placeholder')
  })
})
