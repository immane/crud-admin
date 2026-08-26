import { vi } from 'vitest'

describe('i18n', () => {
  afterEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    vi.resetModules()
    vi.doUnmock('@/i18n/en')
    vi.doUnmock('@/i18n/zh')
    vi.doUnmock('@/i18n/zh-Hant')
    vi.doUnmock('@/i18n/ja')
  })

  async function loadI18n({ stored, lang } = {}) {
    vi.resetModules()
    localStorage.clear()
    if (stored !== undefined && stored !== null) {
      localStorage.setItem('app_locale', stored)
    }
    if (lang !== undefined) {
      vi.stubGlobal('navigator', { language: lang })
    } else {
      vi.stubGlobal('navigator', { language: '' })
    }
    const mod = await import('@/i18n/index.js')
    return mod
  }

  describe('detectLocale', () => {
    it('returns stored valid locale en', async () => {
      const mod = await loadI18n({ stored: 'en', lang: 'zh-CN' })
      expect(mod.getLocale()).toBe('en')
    })
    it('returns stored valid locale zh', async () => {
      const mod = await loadI18n({ stored: 'zh', lang: 'en-US' })
      expect(mod.getLocale()).toBe('zh')
    })
    it('returns stored valid locale zh-Hant', async () => {
      const mod = await loadI18n({ stored: 'zh-Hant', lang: 'en-US' })
      expect(mod.getLocale()).toBe('zh-Hant')
    })
    it('returns stored valid locale ja', async () => {
      const mod = await loadI18n({ stored: 'ja', lang: 'en-US' })
      expect(mod.getLocale()).toBe('ja')
    })
    it('ignores stored invalid locale and falls back to navigator zh-CN -> zh', async () => {
      const mod = await loadI18n({ stored: 'fr', lang: 'zh-CN' })
      expect(mod.getLocale()).toBe('zh')
    })
    it('stored invalid + navigator empty -> en', async () => {
      const mod = await loadI18n({ stored: 'invalid', lang: '' })
      expect(mod.getLocale()).toBe('en')
    })
    it('no stored + navigator zh-CN -> zh', async () => {
      const mod = await loadI18n({ stored: null, lang: 'zh-CN' })
      expect(mod.getLocale()).toBe('zh')
    })
    it('no stored + navigator zh (bare) -> zh', async () => {
      const mod = await loadI18n({ stored: null, lang: 'zh' })
      expect(mod.getLocale()).toBe('zh')
    })
    it('no stored + navigator zh-TW -> zh-Hant', async () => {
      const mod = await loadI18n({ stored: null, lang: 'zh-TW' })
      expect(mod.getLocale()).toBe('zh-Hant')
    })
    it('no stored + navigator zh-HK -> zh-Hant', async () => {
      const mod = await loadI18n({ stored: null, lang: 'zh-HK' })
      expect(mod.getLocale()).toBe('zh-Hant')
    })
    it('no stored + navigator zh-Hant -> zh-Hant (includes Hant)', async () => {
      const mod = await loadI18n({ stored: null, lang: 'zh-Hant' })
      expect(mod.getLocale()).toBe('zh-Hant')
    })
    it('no stored + navigator ja-JP -> ja', async () => {
      const mod = await loadI18n({ stored: null, lang: 'ja-JP' })
      expect(mod.getLocale()).toBe('ja')
    })
    it('no stored + navigator ja -> ja', async () => {
      const mod = await loadI18n({ stored: null, lang: 'ja' })
      expect(mod.getLocale()).toBe('ja')
    })
    it('no stored + navigator en-US -> en', async () => {
      const mod = await loadI18n({ stored: null, lang: 'en-US' })
      expect(mod.getLocale()).toBe('en')
    })
    it('no stored + navigator undefined/empty -> en', async () => {
      vi.resetModules()
      localStorage.clear()
      vi.stubGlobal('navigator', {})
      const mod = await import('@/i18n/index.js')
      expect(mod.getLocale()).toBe('en')
    })
    it('stored invalid locale with undefined language -> en', async () => {
      vi.resetModules()
      localStorage.clear()
      localStorage.setItem('app_locale', 'xx')
      vi.stubGlobal('navigator', { language: undefined })
      const mod = await import('@/i18n/index.js')
      expect(mod.getLocale()).toBe('en')
    })
  })

  describe('t(key, ...args)', () => {
    async function setup(locale = 'en') {
      const mod = await loadI18n({ stored: locale, lang: 'en-US' })
      return mod
    }

    it('returns translation when key exists', async () => {
      const mod = await setup('en')
      expect(mod.t('Back')).toBe('Back')
      expect(mod.t('Hello, {0}')).toBe('Hello, {0}')
    })
    it('returns locale-specific translation', async () => {
      const modEn = await setup('en')
      expect(modEn.t('Back')).toBe('Back')
      vi.resetModules()
      localStorage.clear()
      vi.stubGlobal('navigator', { language: 'en-US' })
      const modZh = await import('@/i18n/index.js')
      modZh.setLocale('zh')
      expect(modZh.t('Back')).toBe('返回')
      modZh.setLocale('ja')
      expect(modZh.t('Back')).toBe('戻る')
    })
    it('missing key returns key and warns', async () => {
      const mod = await setup('en')
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      expect(mod.t('__MISSING_KEY__')).toBe('__MISSING_KEY__')
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[i18n] Missing key: "__MISSING_KEY__"'))
      warnSpy.mockRestore()
    })
    it('interpolates {0},{1} placeholders', async () => {
      const mod = await setup('en')
      expect(mod.t('Hello, {0}', 'World')).toBe('Hello, World')
      expect(mod.t('{0} records selected', 5)).toBe('5 records selected')
      // en has 'Delete {0} selected records?' pattern
      expect(mod.t('Delete {0} selected records?', 3)).toBe('Delete 3 selected records?')
    })
    it('interpolates multiple args', async () => {
      const mod = await setup('en')
      // use a key with single placeholder but pass multiple args - only used ones replaced
      expect(mod.t('Hello, {0}', 'A', 'B')).toBe('Hello, A')
      // test direct placeholder replacement logic with constructed translation
      // we can mock a translation with two placeholders via doMock
      vi.resetModules()
      localStorage.clear()
      vi.stubGlobal('navigator', { language: 'en-US' })
      vi.doMock('@/i18n/en', () => ({ default: { 'Multi {0} and {1}': 'Multi {0} and {1}' } }))
      vi.doMock('@/i18n/zh', () => ({ default: {} }))
      vi.doMock('@/i18n/zh-Hant', () => ({ default: {} }))
      vi.doMock('@/i18n/ja', () => ({ default: {} }))
      const mocked = await import('@/i18n/index.js')
      mocked.setLocale('en')
      expect(mocked.t('Multi {0} and {1}', 'X', 'Y')).toBe('Multi X and Y')
    })
    it('args out of bounds returns empty string for missing index', async () => {
      vi.resetModules()
      localStorage.clear()
      vi.stubGlobal('navigator', { language: 'en-US' })
      vi.doMock('@/i18n/en', () => ({ default: { 'Need {0} and {1}': 'Need {0} and {1}' } }))
      vi.doMock('@/i18n/zh', () => ({ default: {} }))
      vi.doMock('@/i18n/zh-Hant', () => ({ default: {} }))
      vi.doMock('@/i18n/ja', () => ({ default: {} }))
      const mod = await import('@/i18n/index.js')
      mod.setLocale('en')
      expect(mod.t('Need {0} and {1}', 'onlyOne')).toBe('Need onlyOne and ')
      expect(mod.t('Need {0} and {1}')).toBe('Need {0} and {1}') // no args => no replace
    })
    it('non-string value returns key and warns', async () => {
      vi.resetModules()
      localStorage.clear()
      vi.stubGlobal('navigator', { language: 'en-US' })
      vi.doMock('@/i18n/en', () => ({ default: { 'num-key': 123, 'null-key': null, 'obj-key': {}, 'Back': 'Back' } }))
      vi.doMock('@/i18n/zh', () => ({ default: {} }))
      vi.doMock('@/i18n/zh-Hant', () => ({ default: {} }))
      vi.doMock('@/i18n/ja', () => ({ default: {} }))
      const mod = await import('@/i18n/index.js')
      mod.setLocale('en')
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      expect(mod.t('num-key')).toBe('num-key')
      expect(mod.t('null-key')).toBe('null-key')
      expect(mod.t('obj-key')).toBe('obj-key')
      expect(warnSpy).toHaveBeenCalledTimes(3)
      warnSpy.mockRestore()
    })
    it('missing key in current locale returns key (locale-specific missing)', async () => {
      const mod = await setup('zh')
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      // ensure zh has Back, but ja key missing test: zh missing a non-existent key
      expect(mod.t('NonExistentKeyXYZ')).toBe('NonExistentKeyXYZ')
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('(zh)'))
      warnSpy.mockRestore()
    })
  })

  describe('setLocale / getLocale', () => {
    it('getLocale returns current locale', async () => {
      const mod = await loadI18n({ stored: 'en', lang: 'en-US' })
      expect(mod.getLocale()).toBe('en')
    })
    it('setLocale switches to valid locale and persists', async () => {
      const mod = await loadI18n({ stored: 'en', lang: 'en-US' })
      mod.setLocale('zh')
      expect(mod.getLocale()).toBe('zh')
      expect(localStorage.getItem('app_locale')).toBe('zh')
      expect(mod.t('Back')).toBe('返回')
    })
    it('setLocale switches to zh-Hant and ja', async () => {
      const mod = await loadI18n({ stored: 'en', lang: 'en-US' })
      mod.setLocale('zh-Hant')
      expect(mod.getLocale()).toBe('zh-Hant')
      expect(localStorage.getItem('app_locale')).toBe('zh-Hant')
      mod.setLocale('ja')
      expect(mod.getLocale()).toBe('ja')
      expect(localStorage.getItem('app_locale')).toBe('ja')
      expect(mod.t('Back')).toBe('戻る')
    })
    it('setLocale ignores invalid locale and keeps previous', async () => {
      const mod = await loadI18n({ stored: 'en', lang: 'en-US' })
      mod.setLocale('fr')
      expect(mod.getLocale()).toBe('en')
      expect(localStorage.getItem('app_locale')).toBe('en')
      mod.setLocale('zh')
      expect(mod.getLocale()).toBe('zh')
      mod.setLocale('invalid')
      expect(mod.getLocale()).toBe('zh')
      expect(localStorage.getItem('app_locale')).toBe('zh')
    })
    it('setLocale writes to localStorage only for valid locales', async () => {
      const mod = await loadI18n({ stored: 'en', lang: 'en-US' })
      localStorage.clear()
      // after load, locale en but localStorage cleared manually, so setItem not yet called for en initial
      mod.setLocale('invalid-xx')
      expect(localStorage.getItem('app_locale')).toBeNull()
      mod.setLocale('ja')
      expect(localStorage.getItem('app_locale')).toBe('ja')
    })
  })

  describe('install(app)', () => {
    it('registers globalProperties $t, $locale, $setLocale', async () => {
      const mod = await loadI18n({ stored: 'en', lang: 'en-US' })
      const app = { config: { globalProperties: {} } }
      mod.default.install(app)
      expect(app.config.globalProperties.$t).toBe(mod.t)
      expect(app.config.globalProperties.$setLocale).toBe(mod.setLocale)
      expect(app.config.globalProperties.$locale).toBe('en')
    })
    it('$t via install works for translation', async () => {
      const mod = await loadI18n({ stored: 'zh', lang: 'en-US' })
      const app = { config: { globalProperties: {} } }
      mod.default.install(app)
      expect(app.config.globalProperties.$t('Back')).toBe('返回')
    })
    it('$locale reflects locale at install time (snapshot)', async () => {
      const mod = await loadI18n({ stored: 'ja', lang: 'en-US' })
      const app = { config: { globalProperties: {} } }
      mod.default.install(app)
      expect(app.config.globalProperties.$locale).toBe('ja')
      // after install, changing locale does not automatically update $locale (it is snapshot value)
      mod.setLocale('en')
      expect(app.config.globalProperties.$locale).toBe('ja')
      // but $t reflects new locale
      expect(app.config.globalProperties.$t('Back')).toBe('Back')
    })
  })
})
