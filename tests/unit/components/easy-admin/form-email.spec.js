import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus, { ElInput } from 'element-plus'
import EmailField from '@/easyadmin/ui/vue/plugins/form/email.vue'

function mountEmail({ form = {}, field = { property: 'email' }, provide = {}} = {}) {
  return mount(EmailField, {
    props: { form, field, struct: {}},
    global: {
      plugins: [ElementPlus],
      mocks: { $t: (key) => key },
      provide
    }
  })
}

const runValidator = (validatorFn, value) => new Promise((resolve) => {
  validatorFn({}, value, (err) => resolve(err))
})

function captureValidator({ form = {}, field = { property: 'email' }} = {}) {
  let captured = null
  const admin = { id: 0, rules: {}, $refs: { form: { validateField: vi.fn() }}}
  mountEmail({
    form,
    field,
    provide: {
      registerFieldValidator: (name, validator, trigger) => { captured = { name, validator, trigger } },
      getFormAdmin: () => admin
    }
  })
  return { captured, admin }
}

describe('form/email.vue', () => {
  it('hides the hint when the value is empty', () => {
    const wrapper = mountEmail({ form: {}})
    expect(wrapper.vm.val).toBe('')
    expect(wrapper.vm.showHint).toBe(false)
    expect(wrapper.find('.email-field__hint').exists()).toBe(false)
  })

  it('shows a valid hint for a well-formed address', async() => {
    const form = { email: 'user@example.com' }
    const wrapper = mountEmail({ form })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.showHint).toBe(true)
    expect(wrapper.vm.isValid).toBe(true)
    const hint = wrapper.find('.email-field__hint')
    expect(hint.exists()).toBe(true)
    expect(hint.classes()).toContain('is-ok')
    expect(hint.text()).toContain('Valid email')
  })

  it('shows an invalid hint for malformed addresses', async() => {
    for (const bad of ['nope', 'missing-at.com', 'a@', '@b.com', 'a @b.com', 'a@b c.com']) {
      const wrapper = mountEmail({ form: { email: bad }})
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.isValid).toBe(false)

      const hint = wrapper.find('.email-field__hint')
      expect(hint.classes()).toContain('is-error')
      expect(hint.text()).toContain('Invalid email format')
    }
  })

  it('trims surrounding whitespace before validating', () => {
    const wrapper = mountEmail({ form: { email: '  user@example.com  ' }})
    expect(wrapper.vm.isValid).toBe(true)
  })

  it('treats null form values as empty', () => {
    const wrapper = mountEmail({ form: { email: null }})
    expect(wrapper.vm.val).toBe('')
    expect(wrapper.vm.showHint).toBe(false)
    expect(wrapper.vm.isValid).toBe(false)
  })

  it('binds the form value to the input with email affordances', () => {
    const wrapper = mountEmail({ form: { email: 'user@example.com' }})
    const input = wrapper.findComponent(ElInput)
    expect(input.props('modelValue')).toBe('user@example.com')
    expect(input.props('type')).toBe('email')
    expect(input.props('placeholder')).toBe('example@domain.com')
  })

  it('uses a custom placeholder from field_options when provided', () => {
    const wrapper = mountEmail({
      form: {},
      field: { property: 'email', field_options: { placeholder: 'Work email' }}
    })
    expect(wrapper.findComponent(ElInput).props('placeholder')).toBe('Work email')
  })

  it('writes updates and normalizes empty strings to null', () => {
    const form = {}
    const wrapper = mountEmail({ form })

    wrapper.vm.onUpdate('user@example.com')
    expect(form.email).toBe('user@example.com')

    wrapper.vm.onUpdate('')
    expect(form.email).toBeNull()
  })

  it('writes typed input through to the form', async() => {
    const form = {}
    const wrapper = mountEmail({ form })

    await wrapper.find('input').setValue('typed@example.com')
    expect(form.email).toBe('typed@example.com')
  })

  it('registers the validator through the injected registrar with blur/change triggers', () => {
    const registerFieldValidator = vi.fn()
    mountEmail({
      form: {},
      field: { property: 'email' },
      provide: { registerFieldValidator, getFormAdmin: () => ({ id: 0, rules: {}}) }
    })

    expect(registerFieldValidator).toHaveBeenCalledTimes(1)
    expect(registerFieldValidator.mock.calls[0][0]).toBe('email')
    expect(typeof registerFieldValidator.mock.calls[0][1]).toBe('function')
    expect(registerFieldValidator.mock.calls[0][2]).toEqual(['blur', 'change'])
  })

  it('falls back to pushing the validator onto formAdmin.rules', () => {
    const admin = { id: 0, rules: {}}
    mountEmail({
      form: {},
      field: { property: 'email' },
      provide: { getFormAdmin: () => admin }
    })

    expect(admin.rules.email).toHaveLength(1)
    expect(admin.rules.email[0].trigger).toEqual(['blur', 'change'])
    expect(typeof admin.rules.email[0].validator).toBe('function')
  })

  it('mounts safely with no form admin available', () => {
    expect(() => mountEmail({ form: {}})).not.toThrow()
  })

  it('passes empty values when the field is not required', async() => {
    const { captured } = captureValidator({ field: { property: 'email' }})
    expect(captured.name).toBe('email')
    await expect(runValidator(captured.validator, '')).resolves.toBeUndefined()
    await expect(runValidator(captured.validator, null)).resolves.toBeUndefined()
  })

  it('rejects empty values when the field is required', async() => {
    const { captured } = captureValidator({ field: { property: 'email', required: true }})
    const error = await runValidator(captured.validator, '')
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('Email is required')
  })

  it('rejects malformed addresses', async() => {
    const { captured } = captureValidator({})
    const error = await runValidator(captured.validator, 'not-an-email')
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('Invalid email format')
  })

  it('accepts well-formed and whitespace-padded addresses', async() => {
    const { captured } = captureValidator({})
    await expect(runValidator(captured.validator, 'user@example.com')).resolves.toBeUndefined()
    await expect(runValidator(captured.validator, '  user@example.com  ')).resolves.toBeUndefined()
  })

  it('reads the live form value when no explicit value is passed', async() => {
    const { captured } = captureValidator({ form: { email: 'live@example.com' }})
    await expect(runValidator(captured.validator, undefined)).resolves.toBeUndefined()

    const { captured: invalid } = captureValidator({ form: { email: 'bad' }})
    const error = await runValidator(invalid.validator, undefined)
    expect(error).toBeInstanceOf(Error)
  })

  it('revalidates the field through the form admin on update', async() => {
    const validateField = vi.fn()
    const form = {}
    const wrapper = mountEmail({
      form,
      field: { property: 'email' },
      provide: { getFormAdmin: () => ({ id: 0, rules: {}, $refs: { form: { validateField }}}) }
    })

    wrapper.vm.onUpdate('user@example.com')
    await flushPromises()
    await wrapper.vm.$nextTick()
    expect(validateField).toHaveBeenCalledWith('email')
  })

  it('triggerValidate is a safe no-op without a form admin', async() => {
    const wrapper = mountEmail({ form: {}})
    expect(() => wrapper.vm.triggerValidate()).not.toThrow()
    await flushPromises()
  })
})
