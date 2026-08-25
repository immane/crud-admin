describe('Utils:theme', () => {
  let getTheme, applyTheme, THEME_STORAGE_KEY, themes

  beforeEach(async () => {
    localStorage.clear()
    document.documentElement.dataset.theme = ''
    vi.resetModules()
    const mod = await import('@/utils/theme')
    getTheme = mod.getTheme
    applyTheme = mod.applyTheme
    THEME_STORAGE_KEY = mod.THEME_STORAGE_KEY
    themes = mod.themes
  })

  afterEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    vi.restoreAllMocks()
  })

  describe('constants', () => {
    it('exports correct storage key and themes', () => {
      expect(THEME_STORAGE_KEY).toBe('app_theme')
      expect(themes).toEqual(['ocean', 'mist', 'dark'])
    })
  })

  describe('getTheme', () => {
    it('returns ocean when nothing stored', () => {
      expect(getTheme()).toBe('ocean')
    })

    it('returns stored theme when valid', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'mist')
      expect(getTheme()).toBe('mist')
      localStorage.setItem(THEME_STORAGE_KEY, 'dark')
      expect(getTheme()).toBe('dark')
      localStorage.setItem(THEME_STORAGE_KEY, 'ocean')
      expect(getTheme()).toBe('ocean')
    })

    it('returns ocean for invalid stored value', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'invalid')
      expect(getTheme()).toBe('ocean')
      localStorage.setItem(THEME_STORAGE_KEY, '')
      expect(getTheme()).toBe('ocean')
      localStorage.setItem(THEME_STORAGE_KEY, 'OCEAN')
      expect(getTheme()).toBe('ocean')
    })

    it('returns ocean for null', () => {
      // localStorage.getItem returns null when missing
      expect(getTheme()).toBe('ocean')
    })
  })

  describe('applyTheme', () => {
    it('applies valid theme to dataset and localStorage', () => {
      const result = applyTheme('mist')
      expect(result).toBe('mist')
      expect(document.documentElement.dataset.theme).toBe('mist')
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('mist')
    })

    it('applies ocean for invalid theme', () => {
      const result = applyTheme('invalid')
      expect(result).toBe('ocean')
      expect(document.documentElement.dataset.theme).toBe('ocean')
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('ocean')
    })

    it('falls back to ocean for undefined/null/empty', () => {
      expect(applyTheme(undefined)).toBe('ocean')
      expect(applyTheme(null)).toBe('ocean')
      expect(applyTheme('')).toBe('ocean')
    })

    it('dispatches app-theme-change event', () => {
      const handler = jest.fn()
      window.addEventListener('app-theme-change', handler)
      applyTheme('dark')
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler.mock.calls[0][0]).toBeInstanceOf(CustomEvent)
      window.removeEventListener('app-theme-change', handler)
    })

    it('dispatches event even for fallback theme', () => {
      const handler = jest.fn()
      window.addEventListener('app-theme-change', handler)
      applyTheme('bad')
      expect(handler).toHaveBeenCalledTimes(1)
      window.removeEventListener('app-theme-change', handler)
    })

    it('overwrites previous theme', () => {
      applyTheme('mist')
      expect(document.documentElement.dataset.theme).toBe('mist')
      applyTheme('dark')
      expect(document.documentElement.dataset.theme).toBe('dark')
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    })
  })
})
