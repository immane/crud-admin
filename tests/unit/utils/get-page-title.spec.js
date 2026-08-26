import { vi } from 'vitest'

jest.mock('@/settings', () => ({
  __esModule: true,
  default: { title: 'Crud admin skeleton' }
}))

import getPageTitle from '@/utils/get-page-title'

describe('Utils:getPageTitle', () => {
  it('returns title with pageTitle prefix', () => {
    expect(getPageTitle('Dashboard')).toBe('Dashboard - Crud admin skeleton')
  })

  it('returns default title when pageTitle is falsy', () => {
    expect(getPageTitle()).toBe('Crud admin skeleton')
    expect(getPageTitle('')).toBe('Crud admin skeleton')
    expect(getPageTitle(null)).toBe('Crud admin skeleton')
    expect(getPageTitle(undefined)).toBe('Crud admin skeleton')
    expect(getPageTitle(0)).toBe('Crud admin skeleton')
  })

  it('handles title with special characters', () => {
    expect(getPageTitle('A & B')).toBe('A & B - Crud admin skeleton')
  })

  it('falls back to Vue Admin Skeleton when settings title missing', async () => {
    vi.resetModules()
    jest.resetModules()

    // Re-mock settings as empty title
    vi.doMock('@/settings', () => ({
      __esModule: true,
      default: { title: '' }
    }))

    const mod = await import('@/utils/get-page-title')
    const fn = mod.default

    expect(fn('Test')).toBe('Test - Vue Admin Skeleton')
    expect(fn()).toBe('Vue Admin Skeleton')

    // Restore original mock for other tests (vitest will re-use)
    vi.doMock('@/settings', () => ({
      __esModule: true,
      default: { title: 'Crud admin skeleton' }
    }))
    vi.resetModules()
  })
})
