const mockMessage = jest.fn()
const mockLoadingService = jest.fn(() => ({ close: jest.fn() }))

jest.mock('element-ui', () => ({
  Message: mockMessage,
  Loading: {
    service: mockLoadingService
  }
}))

describe('EasyAdmin ui feedback', () => {
  beforeEach(() => {
    jest.resetModules()
    mockMessage.mockReset()
    mockLoadingService.mockReset()
    mockLoadingService.mockImplementation(() => ({ close: jest.fn() }))
  })

  it('uses vm message/loading when vm is provided', async() => {
    const messageFn = jest.fn()
    messageFn.error = jest.fn()

    const vm = {
      $message: messageFn,
      $loading: jest.fn(() => ({ close: jest.fn() }))
    }

    const { createUiFeedback } = await import('@/components/EasyAdmin/ui/feedback')
    const feedback = createUiFeedback(vm)

    feedback.success('ok')
    feedback.warning('warn')
    feedback.error('err')
    feedback.loading({ text: 'load' })

    expect(vm.$message).toHaveBeenCalledWith({ message: 'ok', type: 'success' })
    expect(vm.$message).toHaveBeenCalledWith({ message: 'warn', type: 'warning' })
    expect(vm.$message.error).toHaveBeenCalledWith('err')
    expect(vm.$loading).toHaveBeenCalledWith({ text: 'load' })
  })

  it('falls back to element-ui globals when vm is absent', async() => {
    const { createUiFeedback } = await import('@/components/EasyAdmin/ui/feedback')
    const feedback = createUiFeedback()

    feedback.success('ok')
    feedback.loading({ text: 'loading' })

    expect(mockMessage).toHaveBeenCalledWith({ message: 'ok', type: 'success' })
    expect(mockLoadingService).toHaveBeenCalledWith({ text: 'loading' })
  })
})