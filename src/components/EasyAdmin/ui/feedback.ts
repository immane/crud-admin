import { Message, Loading } from 'element-ui'

export interface LoadingInstance {
  close: () => void
}

export interface LoadingOptions {
  lock?: boolean
  text?: string
  spinner?: string
  background?: string
}

export interface UiFeedbackService {
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
  loading: (options?: LoadingOptions) => LoadingInstance
}

export function createUiFeedback(vm?: any): UiFeedbackService {
  const fallbackMessage = (type: 'success' | 'error' | 'warning', message: string) => {
    Message({ message, type })
  }

  const fromVm = vm && vm.$message && vm.$loading

  if (fromVm) {
    return {
      success: message => vm.$message({ message, type: 'success' }),
      error: message => vm.$message.error(message),
      warning: message => vm.$message({ message, type: 'warning' }),
      loading: options => vm.$loading(options || {})
    }
  }

  return {
    success: message => fallbackMessage('success', message),
    error: message => fallbackMessage('error', message),
    warning: message => fallbackMessage('warning', message),
    loading: options => Loading.service(options || {})
  }
}