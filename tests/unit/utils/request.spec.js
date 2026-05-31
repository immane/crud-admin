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

  it('injects X-Auth-Token header when store has token', async() => {
    await import('@/utils/request')

    const config = { headers: {} }
    const output = requestSuccess(config)

    expect(output.headers['X-Auth-Token']).toBe('token-1')
  })

  it('returns data when API response code is 0', async() => {
    await import('@/utils/request')

    const response = { data: { code: 0, data: { id: 1 } } }
    const output = responseSuccess(response)

    expect(output).toEqual(response.data)
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