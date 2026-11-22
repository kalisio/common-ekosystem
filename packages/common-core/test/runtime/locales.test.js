import { Locales, createLocales } from '../../src/runtime/locales.js'

function setup (codes = ['en'], options = {}) {
  const locales = new Locales(options)
  for (const code of codes) locales.register(code)
  return locales
}

describe('Locales', () => {
  describe('construction', () => {
    it('starts on the normalized default locale', () => {
      const locales = new Locales({ defaultLocale: 'fr-ca', fallbackLocale: 'en' })
      expect(locales.getCurrent()).toBe('fr-CA')
    })
    it('rejects a malformed default locale', () => {
      expect(() => new Locales({ defaultLocale: 'en_US' })).toThrow(RangeError)
    })
    it('rejects a malformed fallback locale', () => {
      expect(() => new Locales({ fallbackLocale: '*' })).toThrow(RangeError)
    })
    it('can be built through createLocales', () => {
      expect(createLocales()).toBeInstanceOf(Locales)
    })
  })

  describe('register', () => {
    it('stores normalized codes', () => {
      const locales = setup(['EN', 'fr-ca'])
      expect([...locales.list()]).toEqual(['en', 'fr-CA'])
    })
  })

  describe('readiness', () => {
    it('requires the default locale to be registered', () => {
      const locales = setup(['en'], { defaultLocale: 'fr' })
      expect(() => locales.resolve()).toThrow('Default locale is not registered: fr')
    })
    it('requires the fallback locale to be registered', () => {
      const locales = setup(['fr'], { defaultLocale: 'fr', fallbackLocale: 'en' })
      expect(() => locales.resolve()).toThrow('Fallback locale is not registered: en')
    })
    it('is checked by setCurrent and getResources too', () => {
      const locales = setup(['fr'], { defaultLocale: 'fr', fallbackLocale: 'en' })
      expect(() => locales.setCurrent('fr')).toThrow('Fallback locale is not registered: en')
      expect(() => locales.getResources('time')).toThrow('Fallback locale is not registered: en')
    })
  })

  describe('setCurrent', () => {
    it('switches to a registered locale and notifies the event bus', () => {
      const eventBus = { emit: vi.fn() }
      const locales = setup(['en', 'fr'], { eventBus })
      locales.setCurrent('fr')
      expect(locales.getCurrent()).toBe('fr')
      expect(eventBus.emit).toHaveBeenCalledWith('locale:changed', { locale: 'fr', previous: 'en' })
    })
    it('normalizes the code before lookup', () => {
      const locales = setup(['en', 'fr-CA'])
      locales.setCurrent('FR-ca')
      expect(locales.getCurrent()).toBe('fr-CA')
    })
    it('does not notify when the locale is unchanged', () => {
      const eventBus = { emit: vi.fn() }
      const locales = setup(['en'], { eventBus })
      locales.setCurrent('en')
      expect(eventBus.emit).not.toHaveBeenCalled()
    })
    it('works without an event bus', () => {
      const locales = setup(['en', 'fr'])
      expect(() => locales.setCurrent('fr')).not.toThrow()
    })
    it('rejects an unregistered locale, even when its parent is registered', () => {
      const locales = setup(['en', 'fr'])
      expect(() => locales.setCurrent('fr-CA')).toThrow(RangeError)
      expect(locales.getCurrent()).toBe('en')
    })
  })

  describe('resolve', () => {
    it('resolves the current locale without arguments', () => {
      const locales = setup(['en', 'fr'])
      locales.setCurrent('fr')
      expect(locales.resolve()).toBe('fr')
    })
    it('returns the first registered preference', () => {
      const locales = setup(['en', 'fr'])
      expect(locales.resolve('de', 'fr')).toBe('fr')
    })
    it('accepts a spread list such as navigator.languages', () => {
      const locales = setup(['en', 'fr'])
      const languages = ['de-DE', 'de', 'fr-FR', 'fr']
      expect(locales.resolve(...languages)).toBe('fr')
    })
    it('normalizes requested codes', () => {
      const locales = setup(['en', 'fr-CA'])
      expect(locales.resolve('FR-ca')).toBe('fr-CA')
    })
    it('truncates subtags from the most specific to the least', () => {
      const locales = setup(['en', 'zh-Hant', 'zh'])
      expect(locales.resolve('zh-Hant-TW')).toBe('zh-Hant')
      expect(locales.resolve('zh-Hans-CN')).toBe('zh')
    })
    it('prefers a truncated first preference over a later exact match', () => {
      const locales = setup(['en', 'fr', 'en-GB'])
      expect(locales.resolve('fr-CA', 'en-GB')).toBe('fr')
    })
    it('falls back when no preference matches', () => {
      const locales = setup(['en', 'fr'])
      expect(locales.resolve('de', 'it')).toBe('en')
    })
    it('skips malformed entries', () => {
      const locales = setup(['en', 'fr'])
      expect(locales.resolve('*', 'en_US', 'fr')).toBe('fr')
    })
    it('still truncates a valid preference that follows an invalid one', () => {
      const locales = setup(['en', 'fr'])
      expect(locales.resolve('invalid_locale', 'fr-CA')).toBe('fr')
    })
    it('falls back, not to the current locale, when every entry is malformed', () => {
      const locales = setup(['en', 'fr'])
      locales.setCurrent('fr')
      expect(locales.resolve('*')).toBe('en')
    })
  })

  describe('resources', () => {
    it('orders contributions by locale specificity, then newest first', () => {
      const locales = setup(['en', 'fr', 'fr-CA'])
      const time = { 'fr-CA': { id: 'time:fr-CA' }, fr: { id: 'time:fr' }, en: { id: 'time:en' } }
      const app = { fr: { id: 'app:fr' } }
      locales.registerResources('time', time)
      locales.registerResources('time', app)
      locales.setCurrent('fr-CA')
      expect(locales.getResources('time')).toEqual([
        { locale: 'fr-CA', resource: time['fr-CA'] },
        { locale: 'fr', resource: app.fr },
        { locale: 'fr', resource: time.fr },
        { locale: 'en', resource: time.en }
      ])
    })
    it('reads an explicit locale instead of the current one', () => {
      const locales = setup(['en', 'fr'])
      locales.registerResources('time', { fr: { id: 'fr' }, en: { id: 'en' } })
      expect(locales.getResources('time').map(({ locale }) => locale)).toEqual(['en'])
      expect(locales.getResources('time', 'fr').map(({ locale }) => locale)).toEqual(['fr', 'en'])
    })
    it('normalizes resource locales', () => {
      const locales = setup(['en'])
      locales.registerResources('time', { 'en-us': { id: 'en-US' } })
      expect(locales.getResources('time', 'en-US')).toEqual([{ locale: 'en-US', resource: { id: 'en-US' } }])
    })
    it('rejects duplicate locales within one contribution', () => {
      const locales = setup(['en'])
      expect(() => locales.registerResources('time', { 'en-US': {}, 'en-us': {} }))
        .toThrow('Duplicate resource locale: en-US')
    })
    it('keeps namespaces apart', () => {
      const locales = setup(['en'])
      locales.registerResources('time', { en: { id: 'time' } })
      locales.registerResources('geospatial', { en: { id: 'geospatial' } })
      expect(locales.getResources('time')).toEqual([{ locale: 'en', resource: { id: 'time' } }])
    })
    it('returns an empty list for an unknown namespace', () => {
      const locales = setup(['en'])
      expect(locales.getResources('time')).toEqual([])
    })
    it('accepts resources registered before the locales', () => {
      const locales = new Locales()
      locales.registerResources('time', { en: { id: 'en' } })
      locales.register('en')
      expect(locales.getResources('time')).toEqual([{ locale: 'en', resource: { id: 'en' } }])
    })
  })
})
