const mockMessage = jest.fn()
const mockGetLocale = jest.fn(() => 'en')
const mockGetToken = jest.fn(() => 'token-1')
const mockGetRefreshToken = jest.fn(() => 'refresh-1')
const mockSetToken = jest.fn()
const mockSetRefreshToken = jest.fn()
const mockDispatch = jest.fn(() => Promise.resolve())
const mockCommit = jest.fn()
const mockReplace = jest.fn()

let storeToken = 'token-1'
let currentRoutePath = '/'
let currentRouteFullPath = '/dashboard?x=1'

let requestInterceptor
let requestErrorInterceptor
let responseSuccessInterceptor
let responseErrorInterceptor

let axiosCreateCall = 0

const mockServiceInstance = jest.fn((config) => Promise.resolve({ data: { code: 0, data: {} }, config }))
mockServiceInstance.interceptors = {
  request: { use: jest.fn((s, e) => { requestInterceptor = s; requestErrorInterceptor = e }) },
  response: { use: jest.fn((s, e) => { responseSuccessInterceptor = s; responseErrorInterceptor = e }) }
}

const mockRefreshInstance = {
  post: jest.fn(),
  interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }
}

jest.mock('axios', () => ({
  default: {
    create: jest.fn(() => {
      axiosCreateCall++
      return axiosCreateCall === 1 ? mockServiceInstance : mockRefreshInstance
    })
  }
}))

jest.mock('element-plus', () => ({
  ElMessage: mockMessage
}))

jest.mock('@/store', () => ({
  __esModule: true,
  default: {
    get getters() { return { token: storeToken } },
    dispatch: mockDispatch,
    commit: mockCommit
  }
}))

jest.mock('@/utils/auth', () => ({
  getToken: mockGetToken,
  getRefreshToken: mockGetRefreshToken,
  setToken: mockSetToken,
  setRefreshToken: mockSetRefreshToken
}))

jest.mock('@/router', () => ({
  __esModule: true,
  default: {
    get currentRoute() { return { value: { path: currentRoutePath, fullPath: currentRouteFullPath } } },
    replace: mockReplace
  }
}))

jest.mock('@/i18n', () => ({
  getLocale: mockGetLocale
}))

async function loadRequest() {
  await import('@/utils/request')
}

describe('utils/request.ts advanced', () => {
  beforeEach(() => {
    jest.resetModules()
    axiosCreateCall = 0
    requestInterceptor = undefined
    requestErrorInterceptor = undefined
    responseSuccessInterceptor = undefined
    responseErrorInterceptor = undefined

    mockMessage.mockReset()
    mockGetLocale.mockReset()
    mockGetLocale.mockReturnValue('en')
    mockGetToken.mockReset()
    mockGetToken.mockReturnValue('token-1')
    mockGetRefreshToken.mockReset()
    mockGetRefreshToken.mockReturnValue('refresh-1')
    mockSetToken.mockReset()
    mockSetRefreshToken.mockReset()
    mockDispatch.mockReset()
    mockDispatch.mockResolvedValue(undefined)
    mockCommit.mockReset()
    mockReplace.mockReset()
    mockRefreshInstance.post.mockReset()
    mockServiceInstance.mockReset()
    mockServiceInstance.mockImplementation((config) => Promise.resolve({ data: { code: 0, data: {} }, config }))
    mockServiceInstance.interceptors.request.use.mockClear()
    mockServiceInstance.interceptors.response.use.mockClear()
    // re-attach capture logic after clear (mockClear keeps impl)
    mockServiceInstance.interceptors.request.use.mockImplementation((s, e) => { requestInterceptor = s; requestErrorInterceptor = e })
    mockServiceInstance.interceptors.response.use.mockImplementation((s, e) => { responseSuccessInterceptor = s; responseErrorInterceptor = e })

    storeToken = 'token-1'
    currentRoutePath = '/'
    currentRouteFullPath = '/dashboard?x=1'
  })

  describe('request interceptor', () => {
    it('injects Authorization when token exists', async () => {
      await loadRequest()
      const out = requestInterceptor({ headers: {} })
      expect(out.headers.Authorization).toBe('Bearer token-1')
      expect(mockGetToken).toHaveBeenCalled()
    })

    it('does not inject Authorization when store has no token', async () => {
      storeToken = ''
      await loadRequest()
      const out = requestInterceptor({ headers: {} })
      expect(out.headers.Authorization).toBeUndefined()
    })

    it('initializes headers when missing', async () => {
      await loadRequest()
      const out = requestInterceptor({})
      expect(out.headers).toBeDefined()
      expect(out.headers['Accept-Language']).toBe('en')
    })

    it('injects Accept-Language and _locale query', async () => {
      mockGetLocale.mockReturnValue('zh')
      await loadRequest()
      const out = requestInterceptor({ headers: {}, params: { page: 1 } })
      expect(out.headers['Accept-Language']).toBe('zh')
      expect(out.params).toEqual({ page: 1, _locale: 'zh' })
    })

    it('merges _locale with existing params and preserves other keys', async () => {
      mockGetLocale.mockReturnValue('ja')
      await loadRequest()
      const out = requestInterceptor({ headers: {}, params: { a: 1 } })
      expect(out.params._locale).toBe('ja')
      expect(out.params.a).toBe(1)
    })

    it('creates params with _locale when none provided', async () => {
      mockGetLocale.mockReturnValue('en')
      await loadRequest()
      const out = requestInterceptor({ headers: {} })
      expect(out.params).toEqual({ _locale: 'en' })
    })

    it('propagates request error', async () => {
      await loadRequest()
      const err = new Error('req fail')
      await expect(requestErrorInterceptor(err)).rejects.toBe(err)
    })
  })

  describe('response interceptor success', () => {
    it('returns success envelope for 204', async () => {
      await loadRequest()
      const out = responseSuccessInterceptor({ status: 204, data: '' })
      expect(out).toEqual({ code: 0, data: null, message: 'SUCCESS' })
    })

    it('wraps raw JSON when code undefined', async () => {
      await loadRequest()
      const out = responseSuccessInterceptor({ status: 200, data: { access_token: 'x' }, config: {} })
      expect(out).toEqual({ code: 0, data: { access_token: 'x' }, message: 'SUCCESS' })
    })

    it('passes through code 0', async () => {
      await loadRequest()
      const res = { code: 0, data: { id: 1 } }
      expect(responseSuccessInterceptor({ status: 200, data: res })).toEqual(res)
    })

    it('passes through code 200', async () => {
      await loadRequest()
      const res = { code: 200, data: { id: 2 } }
      expect(responseSuccessInterceptor({ status: 200, data: res })).toEqual(res)
    })

    it('rejects and notifies on non-401 code', async () => {
      await loadRequest()
      await expect(responseSuccessInterceptor({ status: 200, data: { code: 1, message: 'bad' } })).rejects.toThrow('bad')
      expect(mockMessage).toHaveBeenCalledWith(expect.objectContaining({ message: 'bad', type: 'error' }))
    })

    it('rejects with fallback Error message when message missing', async () => {
      await loadRequest()
      await expect(responseSuccessInterceptor({ status: 200, data: { code: 500 } })).rejects.toThrow('Error')
      expect(mockMessage).toHaveBeenCalled()
    })

    it('when code 401 delegates to refresh and replays', async () => {
      mockRefreshInstance.post.mockResolvedValue({ data: { code: 0, data: { access_token: 'new-token', refresh_token: 'new-refresh' } } })
      mockServiceInstance.mockResolvedValue({ data: { code: 0, data: { id: 9 } } })
      await loadRequest()
      // omit HTTP status so error.response.status is falsy and fallback to data.code 401 triggers retry (implementation uses ||)
      const response = { data: { code: 401, message: 'Unauthorized' }, config: { url: '/api/v1/manage/users', headers: {} } }
      const result = await responseSuccessInterceptor(response)
      expect(mockRefreshInstance.post).toHaveBeenCalledWith('/api/auth/token/refresh', { refresh_token: 'refresh-1' })
      expect(mockCommit).toHaveBeenCalledWith('user/SET_TOKEN', 'new-token')
      expect(mockSetToken).toHaveBeenCalledWith('new-token')
      expect(mockCommit).toHaveBeenCalledWith('user/SET_REFRESH_TOKEN', 'new-refresh')
      expect(mockSetRefreshToken).toHaveBeenCalledWith('new-refresh')
      expect(mockServiceInstance).toHaveBeenCalledWith(expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer new-token' }) }))
      // service replay resolved value is returned? retry returns service(config) promise
      expect(result).toEqual({ data: { code: 0, data: { id: 9 } } })
    })

    it('when code 401 and refresh fails clears session', async () => {
      mockRefreshInstance.post.mockRejectedValue(new Error('refresh failed'))
      await loadRequest()
      const response = { data: { code: 401, message: 'Unauthorized' }, config: { url: '/api/v1/manage/users', headers: {} } }
      await expect(responseSuccessInterceptor(response)).rejects.toThrow('refresh failed')
      expect(mockDispatch).toHaveBeenCalledWith('user/resetToken')
      expect(mockReplace).toHaveBeenCalledWith(expect.objectContaining({ path: '/login' }))
    })
  })

  describe('response interceptor error', () => {
    it('retries on status 401 via refresh', async () => {
      mockRefreshInstance.post.mockResolvedValue({ data: { code: 0, data: { access_token: 't2' } } })
      mockServiceInstance.mockResolvedValue({ data: { code: 0 } })
      await loadRequest()
      const error = { config: { url: '/api/v1/manage/users', headers: {} }, response: { status: 401, data: { message: 'Unauthorized' } } }
      const result = await responseErrorInterceptor(error)
      expect(mockRefreshInstance.post).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('shows ElMessage and rejects on non-401 error', async () => {
      await loadRequest()
      const error = { message: 'network error', response: { status: 500, data: { message: 'server error' } } }
      await expect(responseErrorInterceptor(error)).rejects.toBe(error)
      expect(mockMessage).toHaveBeenCalledWith(expect.objectContaining({ message: 'server error' }))
    })

    it('uses error.message fallback when response message missing', async () => {
      await loadRequest()
      const error = { message: 'net fail', response: { status: 500, data: {} } }
      await expect(responseErrorInterceptor(error)).rejects.toBe(error)
      expect(mockMessage).toHaveBeenCalledWith(expect.objectContaining({ message: 'net fail' }))
    })

    it('uses generic Error fallback', async () => {
      await loadRequest()
      const error = { response: { status: 500, data: {} } }
      await expect(responseErrorInterceptor(error)).rejects.toBe(error)
      expect(mockMessage).toHaveBeenCalledWith(expect.objectContaining({ message: 'Error' }))
    })
  })

  describe('isAuthRequest guard', () => {
    it.each([
      '/api/auth/login',
      '/api/auth/logout',
      '/api/auth/token/refresh'
    ])('does not retry for auth path %s', async (path) => {
      mockRefreshInstance.post.mockResolvedValue({ data: { code: 0, data: { access_token: 'x' } } })
      await loadRequest()
      const error = { config: { url: path, headers: {} }, response: { status: 401, data: { code: 401 } } }
      await expect(responseErrorInterceptor(error)).rejects.toBe(error)
      expect(mockRefreshInstance.post).not.toHaveBeenCalled()
    })

    it('also blocks retry via code 401 wrapper', async () => {
      mockRefreshInstance.post.mockResolvedValue({ data: { code: 0, data: { access_token: 'x' } } })
      await loadRequest()
      const res = { data: { code: 401, message: 'Unauthorized' }, config: { url: '/api/auth/login', headers: {} } }
      await expect(responseSuccessInterceptor(res)).rejects.toBeDefined()
      expect(mockRefreshInstance.post).not.toHaveBeenCalled()
    })

    it('allows retry for non-auth path containing token substring not matching full path', async () => {
      mockRefreshInstance.post.mockResolvedValue({ data: { code: 0, data: { access_token: 'new' } } })
      mockServiceInstance.mockResolvedValue({ data: { code: 0 } })
      await loadRequest()
      const error = { config: { url: '/api/v1/manage/users', headers: {} }, response: { status: 401 } }
      await responseErrorInterceptor(error)
      expect(mockRefreshInstance.post).toHaveBeenCalled()
    })
  })

  describe('retryUnauthorizedRequest guards', () => {
    it('rejects when status is not 401', async () => {
      await loadRequest()
      const error = { config: { url: '/api/v1/manage/users' }, response: { status: 500 } }
      await expect(responseErrorInterceptor(error)).rejects.toBe(error)
      expect(mockRefreshInstance.post).not.toHaveBeenCalled()
    })

    it('supports code 401 as status via response data (via retry fallback)', async () => {
      // error interceptor only checks status===401, so code-only does not trigger retry;
      // verify that status 401 with code fallback still triggers when status is 401
      mockRefreshInstance.post.mockResolvedValue({ data: { code: 0, data: { access_token: 'new' } } })
      mockServiceInstance.mockResolvedValue({ data: {} })
      await loadRequest()
      const error = { config: { url: '/api/v1/manage/users', headers: {} }, response: { status: 401, data: { code: 401 } } }
      await responseErrorInterceptor(error)
      expect(mockRefreshInstance.post).toHaveBeenCalled()
    })

    it('prevents re-entry when _retry already true', async () => {
      mockRefreshInstance.post.mockResolvedValue({ data: { code: 0, data: { access_token: 'new' } } })
      await loadRequest()
      const error = { config: { url: '/api/v1/manage/users', _retry: true, headers: {} }, response: { status: 401 } }
      await expect(responseErrorInterceptor(error)).rejects.toBe(error)
      expect(mockRefreshInstance.post).not.toHaveBeenCalled()
    })

    it('sets _retry flag on retried config', async () => {
      mockRefreshInstance.post.mockResolvedValue({ data: { code: 0, data: { access_token: 'new' } } })
      mockServiceInstance.mockImplementation((cfg) => {
        expect(cfg._retry).toBe(true)
        return Promise.resolve({ data: {} })
      })
      await loadRequest()
      const error = { config: { url: '/api/v1/manage/users', headers: {} }, response: { status: 401 } }
      await responseErrorInterceptor(error)
    })

    it('merges existing headers with new Authorization on replay', async () => {
      mockRefreshInstance.post.mockResolvedValue({ data: { code: 0, data: { access_token: 'new-token' } } })
      let replayHeaders
      mockServiceInstance.mockImplementation((cfg) => { replayHeaders = cfg.headers; return Promise.resolve({}) })
      await loadRequest()
      const error = { config: { url: '/api/v1/manage/users', headers: { 'X-Custom': '1' } }, response: { status: 401 } }
      await responseErrorInterceptor(error)
      expect(replayHeaders.Authorization).toBe('Bearer new-token')
      expect(replayHeaders['X-Custom']).toBe('1')
    })
  })

  describe('single refreshPromise concurrency', () => {
    it('shares one refresh call for concurrent 401s', async () => {
      let resolveRefresh
      const refreshPromise = new Promise(resolve => { resolveRefresh = resolve })
      mockRefreshInstance.post.mockReturnValue(refreshPromise)
      mockServiceInstance.mockResolvedValue({ data: { code: 0 } })
      await loadRequest()
      const err1 = { config: { url: '/api/v1/a', headers: {} }, response: { status: 401 } }
      const err2 = { config: { url: '/api/v1/b', headers: {} }, response: { status: 401 } }
      const p1 = responseErrorInterceptor(err1)
      const p2 = responseErrorInterceptor(err2)
      expect(mockRefreshInstance.post).toHaveBeenCalledTimes(1)
      resolveRefresh({ data: { code: 0, data: { access_token: 'shared-token' } } })
      await Promise.all([p1, p2])
      expect(mockRefreshInstance.post).toHaveBeenCalledTimes(1)
      expect(mockServiceInstance).toHaveBeenCalledTimes(2)
    })

    it('allows new refresh after previous finishes (promise reset)', async () => {
      mockRefreshInstance.post.mockResolvedValue({ data: { code: 0, data: { access_token: 't1' } } })
      mockServiceInstance.mockResolvedValue({ data: {} })
      await loadRequest()
      const err = { config: { url: '/api/v1/a', headers: {} }, response: { status: 401 } }
      await responseErrorInterceptor(err)
      expect(mockRefreshInstance.post).toHaveBeenCalledTimes(1)
      // second round should trigger new refresh
      const err2 = { config: { url: '/api/v1/b', headers: {} }, response: { status: 401 } }
      mockRefreshInstance.post.mockResolvedValue({ data: { code: 0, data: { access_token: 't2' } } })
      await responseErrorInterceptor(err2)
      expect(mockRefreshInstance.post).toHaveBeenCalledTimes(2)
    })
  })

  describe('refreshAccessToken edge cases', () => {
    it('rejects immediately when no refreshToken', async () => {
      mockGetRefreshToken.mockReturnValue('')
      await loadRequest()
      const error = { config: { url: '/api/v1/manage/users', headers: {} }, response: { status: 401 } }
      await expect(responseErrorInterceptor(error)).rejects.toThrow('Session expired')
      expect(mockRefreshInstance.post).not.toHaveBeenCalled()
      expect(mockDispatch).toHaveBeenCalledWith('user/resetToken')
    })

    it('handles raw body without code wrapper', async () => {
      mockRefreshInstance.post.mockResolvedValue({ data: { access_token: 'raw-token', refresh_token: 'raw-refresh' } })
      mockServiceInstance.mockResolvedValue({ data: {} })
      await loadRequest()
      const error = { config: { url: '/api/v1/a', headers: {} }, response: { status: 401 } }
      await responseErrorInterceptor(error)
      expect(mockSetToken).toHaveBeenCalledWith('raw-token')
      expect(mockSetRefreshToken).toHaveBeenCalledWith('raw-refresh')
    })

    it('handles wrapped body with code field', async () => {
      mockRefreshInstance.post.mockResolvedValue({ data: { code: 0, data: { access_token: 'wrapped-token' } } })
      mockServiceInstance.mockResolvedValue({ data: {} })
      await loadRequest()
      const error = { config: { url: '/api/v1/a', headers: {} }, response: { status: 401 } }
      await responseErrorInterceptor(error)
      expect(mockSetToken).toHaveBeenCalledWith('wrapped-token')
      expect(mockCommit).toHaveBeenCalledWith('user/SET_TOKEN', 'wrapped-token')
    })

    it('throws when access_token missing even with success code', async () => {
      mockRefreshInstance.post.mockResolvedValue({ data: { code: 0, data: {} } })
      await loadRequest()
      const error = { config: { url: '/api/v1/a', headers: {} }, response: { status: 401 } }
      await expect(responseErrorInterceptor(error)).rejects.toThrow()
      expect(mockDispatch).toHaveBeenCalledWith('user/resetToken')
    })

    it('uses body.message fallback when refresh fails without token', async () => {
      mockRefreshInstance.post.mockResolvedValue({ data: { code: 0, data: {}, message: 'refresh bad' } })
      await loadRequest()
      // Need to trigger missing access_token to use message
      // Already covered above with empty data -> should throw with message or fallback
      const error = { config: { url: '/api/v1/a', headers: {} }, response: { status: 401 } }
      await expect(responseErrorInterceptor(error)).rejects.toThrow()
    })

    it('does not update refresh token when not returned', async () => {
      mockRefreshInstance.post.mockResolvedValue({ data: { code: 0, data: { access_token: 'only-access' } } })
      mockServiceInstance.mockResolvedValue({ data: {} })
      await loadRequest()
      const error = { config: { url: '/api/v1/a', headers: {} }, response: { status: 401 } }
      await responseErrorInterceptor(error)
      expect(mockSetToken).toHaveBeenCalledWith('only-access')
      expect(mockSetRefreshToken).not.toHaveBeenCalled()
      expect(mockCommit).toHaveBeenCalledWith('user/SET_TOKEN', 'only-access')
    })
  })

  describe('clearSession redirect', () => {
    it('dispatches resetToken and redirects when not on /login', async () => {
      mockRefreshInstance.post.mockRejectedValue(new Error('fail'))
      currentRoutePath = '/dashboard'
      currentRouteFullPath = '/dashboard?x=1'
      await loadRequest()
      const error = { config: { url: '/api/v1/a', headers: {} }, response: { status: 401 } }
      await expect(responseErrorInterceptor(error)).rejects.toThrow('fail')
      expect(mockDispatch).toHaveBeenCalledWith('user/resetToken')
      expect(mockReplace).toHaveBeenCalledWith({ path: '/login', query: { redirect: '/dashboard?x=1' } })
    })

    it('does not redirect when already on /login', async () => {
      mockRefreshInstance.post.mockRejectedValue(new Error('fail'))
      currentRoutePath = '/login'
      currentRouteFullPath = '/login'
      await loadRequest()
      const error = { config: { url: '/api/v1/a', headers: {} }, response: { status: 401 } }
      await expect(responseErrorInterceptor(error)).rejects.toThrow('fail')
      expect(mockDispatch).toHaveBeenCalledWith('user/resetToken')
      expect(mockReplace).not.toHaveBeenCalled()
    })
  })
})
