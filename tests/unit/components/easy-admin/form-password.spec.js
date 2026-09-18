import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus, { ElInput } from 'element-plus'
import PasswordField from '@/easyadmin/ui/vue/plugins/form/password.vue'

function mountPassword({ form = {}, field = { property: 'password' }, provide = {}} = {}) {
  return mount(PasswordField, {
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

function captureValidator({ form = {}, field = { property: 'password' }, id = 0 } = {}) {
  let captured = null
  const admin = { id, rules: {}, $refs: { form: { validateField: vi.fn() }}}
  mountPassword({
    form,
    field,
    provide: {
      registerFieldValidator: (name, validator, trigger) => { captured = { name, validator, trigger } },
      getFormAdmin: () => admin
    }
  })
  return { captured, admin }
}

describe('form/password.vue', () => {
  it('hides hints when both password and confirm are empty', () => {
    const wrapper = mountPassword({ form: {}})
    expect(wrapper.vm.showHints).toBe(false)
    expect(wrapper.find('.password-field__hints').exists()).toBe(false)
  })

  it('shows hints once the password or confirm has content', async() => {
    const wrapper = mountPassword({ form: {}})
    wrapper.vm.onUpdate('secret1')
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.showHints).toBe(true)
    expect(wrapper.find('.password-field__hints').exists()).toBe(true)

    const confirmOnly = mountPassword({ form: {}})
    confirmOnly.vm.onConfirmUpdate('x')
    await confirmOnly.vm.$nextTick()
    expect(confirmOnly.vm.showHints).toBe(true)
  })

  it('evaluates the length requirement at the six-character boundary', () => {
    const short = mountPassword({ form: { password: 'a1b2c' }})
    expect(short.vm.isLengthOk).toBe(false)

    const exact = mountPassword({ form: { password: 'a1b2c3' }})
    expect(exact.vm.isLengthOk).toBe(true)
  })

  it('evaluates letter and number branches independently', () => {
    expect(mountPassword({ form: { password: '123456' }}).vm.hasLetter).toBe(false)
    expect(mountPassword({ form: { password: '123456' }}).vm.hasNumber).toBe(true)
    expect(mountPassword({ form: { password: 'abcdef' }}).vm.hasLetter).toBe(true)
    expect(mountPassword({ form: { password: 'abcdef' }}).vm.hasNumber).toBe(false)
    expect(mountPassword({ form: { password: 'abc123' }}).vm.hasLetter).toBe(true)
    expect(mountPassword({ form: { password: 'abc123' }}).vm.hasNumber).toBe(true)
    expect(mountPassword({ form: {}}).vm.hasLetter).toBe(false)
    expect(mountPassword({ form: {}}).vm.hasNumber).toBe(false)
  })

  it('evaluates match branches for hidden and visible modes', () => {
    const empty = mountPassword({ form: {}})
    expect(empty.vm.isMatch).toBe(false)

    const mismatch = mountPassword({ form: { password: 'abc123' }})
    mismatch.vm.onConfirmUpdate('abc124')
    expect(mismatch.vm.isMatch).toBe(false)

    const match = mountPassword({ form: { password: 'abc123' }})
    match.vm.onConfirmUpdate('abc123')
    expect(match.vm.isMatch).toBe(true)

    const visible = mountPassword({ form: { password: 'abc123' }})
    visible.vm.passwordVisible = true
    expect(visible.vm.isMatch).toBe(true)
  })

  it('defaults to password type with a visible confirm input', () => {
    const wrapper = mountPassword({ form: { password: 'abc123' }})
    const inputs = wrapper.findAllComponents(ElInput)
    expect(inputs).toHaveLength(2)
    expect(inputs[0].props('type')).toBe('password')
    expect(wrapper.find('.password-field__confirm').exists()).toBe(true)
    expect(wrapper.text()).toContain('Password hint match')
  })

  it('toggles visibility, hiding the confirm input and match hint', async() => {
    const wrapper = mountPassword({ form: { password: 'abc123' }})

    await wrapper.find('.password-field__toggle').trigger('click')
    expect(wrapper.vm.passwordVisible).toBe(true)
    expect(wrapper.findAllComponents(ElInput)[0].props('type')).toBe('text')
    expect(wrapper.find('.password-field__confirm').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Password hint match')

    await wrapper.find('.password-field__toggle').trigger('click')
    expect(wrapper.vm.passwordVisible).toBe(false)
    expect(wrapper.find('.password-field__confirm').exists()).toBe(true)
  })

  it('marks satisfied hints with the ok class', async() => {
    const wrapper = mountPassword({ form: {}})
    wrapper.vm.onUpdate('abc123')
    wrapper.vm.onConfirmUpdate('abc123')
    await wrapper.vm.$nextTick()

    const okHints = wrapper.findAll('.password-field__hint.is-ok')
    expect(okHints.length).toBeGreaterThanOrEqual(3)
  })

  it('writes updates and normalizes empty strings to null', () => {
    const form = {}
    const wrapper = mountPassword({ form, field: { property: 'password' }})

    wrapper.vm.onUpdate('abc123')
    expect(form.password).toBe('abc123')

    wrapper.vm.onUpdate('')
    expect(form.password).toBeNull()
  })

  it('clears the confirm value when the password is emptied', () => {
    const form = { password: 'abc123' }
    const wrapper = mountPassword({ form })
    wrapper.vm.onConfirmUpdate('abc123')
    expect(wrapper.vm.confirmValue).toBe('abc123')

    wrapper.vm.onUpdate('')
    expect(wrapper.vm.confirmValue).toBe('')
  })

  it('syncs the plainPassword/password alias in both directions', () => {
    const createForm = {}
    const createWrapper = mountPassword({ form: createForm, field: { property: 'plainPassword' }})
    createWrapper.vm.onUpdate('abc123')
    expect(createForm.plainPassword).toBe('abc123')
    expect(createForm.password).toBe('abc123')

    const passwordForm = {}
    const passwordWrapper = mountPassword({ form: passwordForm, field: { property: 'password' }})
    passwordWrapper.vm.onUpdate('abc123')
    expect(passwordForm.password).toBe('abc123')
    expect(passwordForm.plainPassword).toBe('abc123')
  })

  it('leaves unrelated properties without an alias untouched', () => {
    const form = {}
    const wrapper = mountPassword({ form, field: { property: 'secret' }})
    wrapper.vm.onUpdate('abc123')

    expect(form.secret).toBe('abc123')
    expect('password' in form).toBe(false)
    expect('plainPassword' in form).toBe(false)
  })

  it('stores confirm updates separately from the form', () => {
    const form = { password: 'abc123' }
    const wrapper = mountPassword({ form })

    wrapper.vm.onConfirmUpdate('abc123')
    expect(wrapper.vm.confirmValue).toBe('abc123')
    expect(form.password).toBe('abc123')
  })

  it('writes typed input through to the form', async() => {
    const form = {}
    const wrapper = mountPassword({ form })

    await wrapper.findAll('input')[0].setValue('typed123')
    expect(form.password).toBe('typed123')
  })

  it('registers the validator through the injected registrar with blur/change triggers', () => {
    const registerFieldValidator = vi.fn()
    mountPassword({
      form: {},
      field: { property: 'password' },
      provide: { registerFieldValidator, getFormAdmin: () => ({ id: 0, rules: {}}) }
    })

    expect(registerFieldValidator).toHaveBeenCalledTimes(1)
    expect(registerFieldValidator.mock.calls[0][0]).toBe('password')
    expect(typeof registerFieldValidator.mock.calls[0][1]).toBe('function')
    expect(registerFieldValidator.mock.calls[0][2]).toEqual(['blur', 'change'])
  })

  it('falls back to pushing the validator onto formAdmin.rules', () => {
    const admin = { id: 0, rules: {}}
    mountPassword({
      form: {},
      field: { property: 'password' },
      provide: { getFormAdmin: () => admin }
    })

    expect(admin.rules.password).toHaveLength(1)
    expect(admin.rules.password[0].trigger).toEqual(['blur', 'change'])
    expect(typeof admin.rules.password[0].validator).toBe('function')
  })

  it('mounts safely with no form admin available', () => {
    expect(() => mountPassword({ form: {}})).not.toThrow()
  })

  it('requires a password in create mode but not in update mode', async() => {
    const create = captureValidator({ id: 0 })
    expect(create.captured.name).toBe('password')
    const createError = await runValidator(create.captured.validator, '')
    expect(createError).toBeInstanceOf(Error)
    expect(createError.message).toBe('Password is required')

    const update = captureValidator({ id: 7 })
    const updateError = await runValidator(update.captured.validator, '')
    expect(updateError).toBeUndefined()
  })

  it('rejects passwords that miss length, letter or number requirements', async() => {
    const { captured } = captureValidator({ id: 7 })

    for (const weak of ['a1', 'abcde', '123456', 'abcdef']) {
      const error = await runValidator(captured.validator, weak)
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Password does not meet requirements')
    }
  })

  it('requires confirmation and an exact match while hidden', async() => {
    const form = { password: 'abc123' }
    const { captured } = captureValidator({ form, id: 7 })

    const missing = await runValidator(captured.validator, undefined)
    expect(missing).toBeInstanceOf(Error)
    expect(missing.message).toBe('Please confirm password')
  })

  it('rejects mismatched confirmation while hidden', async() => {
    let validator = null
    const live = mountPassword({
      form: { password: 'abc123' },
      field: { property: 'password' },
      provide: {
        registerFieldValidator: (name, fn) => { validator = fn },
        getFormAdmin: () => ({ id: 7, rules: {}})
      }
    })
    live.vm.onConfirmUpdate('different1')
    const error = await runValidator(validator, undefined)
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('Passwords do not match')
  })

  it('accepts matching confirmation while hidden', async() => {
    let validator = null
    const live = mountPassword({
      form: { password: 'abc123' },
      field: { property: 'password' },
      provide: {
        registerFieldValidator: (name, fn) => { validator = fn },
        getFormAdmin: () => ({ id: 7, rules: {}})
      }
    })
    live.vm.onConfirmUpdate('abc123')
    await expect(runValidator(validator, undefined)).resolves.toBeUndefined()
  })

  it('skips confirmation once the password is visible', async() => {
    let validator = null
    const live = mountPassword({
      form: { password: 'abc123' },
      field: { property: 'password' },
      provide: {
        registerFieldValidator: (name, fn) => { validator = fn },
        getFormAdmin: () => ({ id: 7, rules: {}})
      }
    })
    live.vm.passwordVisible = true
    await expect(runValidator(validator, undefined)).resolves.toBeUndefined()
  })

  it('prefers the explicit value argument over form getters', async() => {
    const { captured } = captureValidator({ form: {}, id: 7 })
    const error = await runValidator(captured.validator, 'ab')
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('Password does not meet requirements')
  })

  it('revalidates the field through the form admin when values change', async() => {
    const validateField = vi.fn()
    const form = {}
    const wrapper = mountPassword({
      form,
      field: { property: 'password' },
      provide: { getFormAdmin: () => ({ id: 0, rules: {}, $refs: { form: { validateField }}}) }
    })

    wrapper.vm.onUpdate('abc123')
    await flushPromises()
    await wrapper.vm.$nextTick()
    expect(validateField).toHaveBeenCalledWith('password')
  })

  it('triggerValidate is a safe no-op without a form admin', async() => {
    const wrapper = mountPassword({ form: {}})
    expect(() => wrapper.vm.triggerValidate()).not.toThrow()
    await flushPromises()
  })
})
