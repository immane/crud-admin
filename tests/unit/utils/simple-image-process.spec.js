const uploadMocks = vi.hoisted(() => ({
  getPictureUrl: vi.fn(url => `mocked-${url}`),
  resolveUploadHost: vi.fn(() => ''),
  getUploadUrl: vi.fn(),
  getUploadData: vi.fn(),
  getUploadHeaders: vi.fn(),
  resolveUploadPath: vi.fn()
}))

vi.mock('@/utils/upload', () => ({
  __esModule: true,
  getPictureUrl: (...args) => uploadMocks.getPictureUrl(...args),
  resolveUploadHost: (...args) => uploadMocks.resolveUploadHost(...args),
  getUploadUrl: (...args) => uploadMocks.getUploadUrl(...args),
  getUploadData: (...args) => uploadMocks.getUploadData(...args),
  getUploadHeaders: (...args) => uploadMocks.getUploadHeaders(...args),
  resolveUploadPath: (...args) => uploadMocks.resolveUploadPath(...args)
}))

import simpleImageProcess from '@/utils/simple-image-process'

describe('Utils:simple-image-process', () => {
  beforeEach(() => {
    uploadMocks.getPictureUrl.mockClear()
  })

  it('exports getPicture as alias to getPictureUrl', () => {
    expect(typeof simpleImageProcess.getPicture).toBe('function')
  })

  it('delegates to getPictureUrl', () => {
    uploadMocks.getPictureUrl.mockReturnValue('http://host/uploads/images/a.jpg')
    const result = simpleImageProcess.getPicture('a.jpg')
    expect(uploadMocks.getPictureUrl).toHaveBeenCalledWith('a.jpg')
    expect(result).toBe('http://host/uploads/images/a.jpg')
  })

  it('passes through falsy values', () => {
    uploadMocks.getPictureUrl.mockImplementation(v => v)
    expect(simpleImageProcess.getPicture('')).toBe('')
    expect(simpleImageProcess.getPicture(null)).toBe(null)
    expect(simpleImageProcess.getPicture(undefined)).toBe(undefined)
    expect(uploadMocks.getPictureUrl).toHaveBeenCalledTimes(3)
  })

  it('handles absolute url', () => {
    uploadMocks.getPictureUrl.mockReturnValue('https://cdn.example.com/img.png')
    expect(simpleImageProcess.getPicture('https://cdn.example.com/img.png')).toBe('https://cdn.example.com/img.png')
  })

  it('delegates arbitrary values', () => {
    uploadMocks.getPictureUrl.mockImplementation(v => `wrapped-${v}`)
    expect(simpleImageProcess.getPicture('b.png')).toBe('wrapped-b.png')
    expect(uploadMocks.getPictureUrl).toHaveBeenCalledWith('b.png')
  })
})
