const { mockElMessage, mockElLoadingService } = vi.hoisted(() => ({
  mockElMessage: vi.fn(),
  mockElLoadingService: vi.fn(() => ({ close: vi.fn() }))
}))

vi.mock('element-plus', () => ({
  ElMessage: mockElMessage,
  ElLoading: { service: mockElLoadingService }
}))

import { createUiFeedback } from '@/components/EasyAdmin/ui/feedback'

describe('EasyAdmin ui feedback - extended', () => {
  beforeEach(() => {
    mockElMessage.mockReset()
    mockElLoadingService.mockReset()
    mockElLoadingService.mockImplementation(() => ({ close: vi.fn() }))
  })

  function makeVm() {
    const messageFn = vi.fn()
    messageFn.error = vi.fn()
    return {
      $message: messageFn,
      $loading: vi.fn(() => ({ close: vi.fn() }))
    }
  }

  describe('fallback (no vm)', () => {
    it('success calls ElMessage with success type', () => {
      const fb = createUiFeedback()
      fb.success('ok')
      expect(mockElMessage).toHaveBeenCalledTimes(1)
      expect(mockElMessage).toHaveBeenCalledWith({ message: 'ok', type: 'success' })
    })

    it('error calls ElMessage with error type', () => {
      const fb = createUiFeedback()
      fb.error('bad')
      expect(mockElMessage).toHaveBeenCalledWith({ message: 'bad', type: 'error' })
    })

    it('warning calls ElMessage with warning type', () => {
      const fb = createUiFeedback()
      fb.warning('careful')
      expect(mockElMessage).toHaveBeenCalledWith({ message: 'careful', type: 'warning' })
    })

    it('loading forwards options to ElLoading.service and returns instance', () => {
      const fb = createUiFeedback()
      const inst = fb.loading({ text: 'wait', lock: true })
      expect(mockElLoadingService).toHaveBeenCalledWith({ text: 'wait', lock: true })
      expect(inst).toBeDefined()
      expect(typeof inst.close).toBe('function')
    })

    it('loading without options defaults to {}', () => {
      const fb = createUiFeedback()
      fb.loading()
      expect(mockElLoadingService).toHaveBeenCalledWith({})
    })

    it('loading with undefined defaults to {}', () => {
      const fb = createUiFeedback()
      fb.loading(undefined)
      expect(mockElLoadingService).toHaveBeenCalledWith({})
    })

    it('treats null vm as fallback', () => {
      const fb = createUiFeedback(null)
      fb.success('s')
      fb.error('e')
      fb.warning('w')
      fb.loading({ text: 'l' })
      expect(mockElMessage).toHaveBeenCalledTimes(3)
      expect(mockElLoadingService).toHaveBeenCalledTimes(1)
    })

    it('treats vm without $message/$loading as fallback', () => {
      const fb = createUiFeedback({})
      fb.success('s')
      fb.loading()
      expect(mockElMessage).toHaveBeenCalledWith({ message: 's', type: 'success' })
      expect(mockElLoadingService).toHaveBeenCalledWith({})
    })

    it('treats vm with only $message as fallback', () => {
      const vm = { $message: vi.fn() }
      vm.$message.error = vi.fn()
      const fb = createUiFeedback(vm)
      fb.success('s')
      fb.error('e')
      fb.loading({ text: 'x' })
      // falls back to globals, vm not used
      expect(vm.$message).not.toHaveBeenCalled()
      expect(mockElMessage).toHaveBeenCalledTimes(2)
      expect(mockElLoadingService).toHaveBeenCalledTimes(1)
    })

    it('treats vm with only $loading as fallback', () => {
      const vm = { $loading: vi.fn(() => ({ close: vi.fn() })) }
      const fb = createUiFeedback(vm)
      fb.success('s')
      fb.loading({ text: 'x' })
      expect(vm.$loading).not.toHaveBeenCalled()
      expect(mockElMessage).toHaveBeenCalledTimes(1)
      expect(mockElLoadingService).toHaveBeenCalledTimes(1)
    })
  })

  describe('with vm', () => {
    it('success delegates to vm.$message with success type', () => {
      const vm = makeVm()
      const fb = createUiFeedback(vm)
      fb.success('ok')
      expect(vm.$message).toHaveBeenCalledWith({ message: 'ok', type: 'success' })
      expect(mockElMessage).not.toHaveBeenCalled()
    })

    it('warning delegates to vm.$message with warning type', () => {
      const vm = makeVm()
      const fb = createUiFeedback(vm)
      fb.warning('w')
      expect(vm.$message).toHaveBeenCalledWith({ message: 'w', type: 'warning' })
      expect(mockElMessage).not.toHaveBeenCalled()
    })

    it('error delegates to vm.$message.error with raw string', () => {
      const vm = makeVm()
      const fb = createUiFeedback(vm)
      fb.error('boom')
      expect(vm.$message.error).toHaveBeenCalledWith('boom')
      expect(vm.$message).not.toHaveBeenCalledWith({ message: 'boom', type: 'error' })
      expect(mockElMessage).not.toHaveBeenCalled()
    })

    it('loading delegates to vm.$loading with given options', () => {
      const vm = makeVm()
      const fb = createUiFeedback(vm)
      fb.loading({ text: 'load', lock: true })
      expect(vm.$loading).toHaveBeenCalledWith({ text: 'load', lock: true })
      expect(mockElLoadingService).not.toHaveBeenCalled()
    })

    it('loading without options delegates with {}', () => {
      const vm = makeVm()
      const fb = createUiFeedback(vm)
      fb.loading()
      expect(vm.$loading).toHaveBeenCalledWith({})
      expect(mockElLoadingService).not.toHaveBeenCalled()
    })

    it('loading returns vm.$loading instance', () => {
      const vm = makeVm()
      const handle = { close: vi.fn() }
      vm.$loading.mockReturnValue(handle)
      const fb = createUiFeedback(vm)
      expect(fb.loading({ text: 'x' })).toBe(handle)
    })
  })
})
