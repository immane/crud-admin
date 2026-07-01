const mockMessage = jest.fn()

let requestSuccess
let responseSuccess
let responseError

const mockAxiosInstance = {
  interceptors: {
    request: {
      use: jest.fn((success) => {
        requestSuccess = success
      })
    },
    response: {
      use: jest.fn((success, error) => {
        responseSuccess = success
        responseError = error
      })
    }
  }
}

jest.mock('axios', () => ({
  create: jest.fn(() => mockAxiosInstance)
}))

jest.mock('element-ui', () => ({
  Message: mockMessage
}))

jest.mock('@/store', () => ({
  getters: {
    token: 'token-1'
  }
}))

jest.mock('@/utils/auth', () => ({
  getToken: jest.fn(() => 'token-1')
}))

describe('utils/request.ts', () => {
  beforeEach(() => {
    jest.resetModules()
    mockMessage.mockReset()
    requestSuccess = undefined
    responseSuccess = undefined
    responseError = undefined
  })

  it('injects Authorization bearer header when store has token', async() => {
    await import('@/utils/request')

    const config = { headers: {} }
    const output = requestSuccess(config)

    expect(output.headers.Authorization).toBe('Bearer token-1')
  })

  it('returns data when API response code is 0', async() => {
    await import('@/utils/request')

    const response = { data: { code: 0, data: { id: 1 } } }
    const output = responseSuccess(response)

    expect(output).toEqual(response.data)
  })

  it('returns data when API response code is 200', async() => {
    await import('@/utils/request')

    const response = { data: { code: 200, data: { id: 1 } } }
    const output = responseSuccess(response)

    expect(output).toEqual(response.data)
  })

  it('returns success envelope for 204 empty responses', async() => {
    await import('@/utils/request')

    const output = responseSuccess({ status: 204, data: '' })

    expect(output).toEqual({ code: 0, data: null, message: 'SUCCESS' })
  })

  it('wraps successful raw JSON responses', async() => {
    await import('@/utils/request')

    const output = responseSuccess({ status: 200, data: { access_token: 'token-1' } })

    expect(output).toEqual({ code: 0, data: { access_token: 'token-1' }, message: 'SUCCESS' })
  })

  it('rejects and notifies when API response code is non-zero', async() => {
    await import('@/utils/request')

    await expect(responseSuccess({ data: { code: 1, message: 'bad' } })).rejects.toThrow('bad')
    expect(mockMessage).toHaveBeenCalledTimes(1)
  })

  it('rejects with fallback message on axios error', async() => {
    await import('@/utils/request')

    const error = {
      message: 'network error',
      response: {
        data: {
          message: 'request failed'
        }
      }
    }

    await expect(responseError(error)).rejects.toBe(error)
    expect(mockMessage).toHaveBeenCalledWith(expect.objectContaining({ message: 'request failed', type: 'error' }))
  })
})
