import { Locales, setLocales, getLocales } from '../../src/runtime/locales.js'
import { EventBus, setEventBus } from '../../src/runtime/event-bus.js'

function setup (codes = [], options = {}) {
  const locales = new Locales(options)
  const registered = new Set(locales.list())
  for (const code of codes) {
    const normalized = Intl.getCanonicalLocales(code)[0]
    if (registered.has(normalized)) continue
    locales.register(code)
    registered.add(normalized)
  }
  return locales
}

describe('Locales', () => {
  describe('construction', () => {
    it('starts on the normalized default locale', () => {
      const locales = new Locales({ default: 'fr-ca', fallback: 'en' })
      expect(locales.getCurrent()).toBe('fr-CA')
    })
    it('registers default and fallback automatically', () => {
      const locales = new Locales({ default: 'fr', fallback: 'en' })
      expect([...locales.list()]).toEqual(['fr', 'en'])
      expect(locales.resolve()).toBe('fr')
      expect(locales.resolve('de')).toBe('en')
    })
    it('registers the locale only once when default and fallback are identical', () => {
      const locales = new Locales()
      expect([...locales.list()]).toEqual(['en'])
    })
    it('rejects a malformed default locale', () => {
      expect(() => new Locales({ default: 'en_US' })).toThrow(RangeError)
    })
    it('rejects a malformed fallback locale', () => {
      expect(() => new Locales({ fallback: '*' })).toThrow(RangeError)
    })
  })

  describe('register', () => {
    it('stores normalized codes', () => {
      const locales = setup(['EN', 'fr-ca'])
      expect([...locales.list()]).toEqual(['en', 'fr-CA'])
    })
  })

  describe('setCurrent', () => {
    it('switches to a registered locale and notifies the global event bus', () => {
      const bus = new EventBus()
      const listener = vi.fn()
      bus.on('locale:changed', listener)
      setEventBus(bus)
      const locales = setup(['fr'])
      locales.setCurrent('fr')
      expect(locales.getCurrent()).toBe('fr')
      expect(listener).toHaveBeenCalledWith({
        type: 'locale:changed',
        timestamp: expect.any(Number),
        data: { locale: 'fr', previous: 'en' }
      })
    })
    it('uses the currently installed event bus', () => {
      const first = new EventBus()
      const second = new EventBus()
      const firstListener = vi.fn()
      const secondListener = vi.fn()
      first.on('locale:changed', firstListener)
      second.on('locale:changed', secondListener)
      const locales = setup(['fr'])
      setEventBus(first)
      locales.setCurrent('fr')
      setEventBus(second)
      locales.setCurrent('en')
      expect(firstListener).toHaveBeenCalledTimes(1)
      expect(secondListener).toHaveBeenCalledTimes(1)
      expect(secondListener).toHaveBeenCalledWith(expect.objectContaining({
        data: { locale: 'en', previous: 'fr' }
      }))
    })
    it('normalizes the code before lookup', () => {
      const locales = setup(['fr-CA'])
      locales.setCurrent('FR-ca')
      expect(locales.getCurrent()).toBe('fr-CA')
    })
    it('does not notify when the locale is unchanged', () => {
      const bus = new EventBus()
      const listener = vi.fn()
      bus.on('locale:changed', listener)
      setEventBus(bus)
      const locales = setup()
      locales.setCurrent('en')
      expect(listener).not.toHaveBeenCalled()
    })
    it('works without a configured event bus', async () => {
      vi.resetModules()
      const { Locales } = await import('../../src/runtime/locales.js')
      const locales = new Locales({ default: 'en', fallback: 'fr' })
      expect(() => locales.setCurrent('fr')).not.toThrow()
      expect(locales.getCurrent()).toBe('fr')
    })
    it('rejects an unregistered locale, even when its parent is registered', () => {
      const locales = setup(['fr'])
      expect(() => locales.setCurrent('fr-CA')).toThrow(RangeError)
      expect(locales.getCurrent()).toBe('en')
    })
  })

  describe('resolve', () => {
    it('resolves the current locale without arguments', () => {
      const locales = setup(['fr'])
      locales.setCurrent('fr')
      expect(locales.resolve()).toBe('fr')
    })
    it('returns the first registered preference', () => {
      const locales = setup(['fr'])
      expect(locales.resolve('de', 'fr')).toBe('fr')
    })
    it('accepts a spread list such as navigator.languages', () => {
      const locales = setup(['fr'])
      const languages = ['de-DE', 'de', 'fr-FR', 'fr']
      expect(locales.resolve(...languages)).toBe('fr')
    })
    it('normalizes requested codes', () => {
      const locales = setup(['fr-CA'])
      expect(locales.resolve('FR-ca')).toBe('fr-CA')
    })
    it('truncates subtags from the most specific to the least', () => {
      const locales = setup(['zh-Hant', 'zh'])
      expect(locales.resolve('zh-Hant-TW')).toBe('zh-Hant')
      expect(locales.resolve('zh-Hans-CN')).toBe('zh')
    })
    it('prefers a truncated first preference over a later exact match', () => {
      const locales = setup(['fr', 'en-GB'])
      expect(locales.resolve('fr-CA', 'en-GB')).toBe('fr')
    })
    it('falls back when no preference matches', () => {
      const locales = setup(['fr'])
      expect(locales.resolve('de', 'it')).toBe('en')
    })
    it('skips malformed entries', () => {
      const locales = setup(['fr'])
      expect(locales.resolve('*', 'en_US', 'fr')).toBe('fr')
    })
    it('still truncates a valid preference that follows an invalid one', () => {
      const locales = setup(['fr'])
      expect(locales.resolve('invalid_locale', 'fr-CA')).toBe('fr')
    })
    it('falls back, not to the current locale, when every entry is malformed', () => {
      const locales = setup(['fr'])
      locales.setCurrent('fr')
      expect(locales.resolve('*')).toBe('en')
    })
  })

  describe('resources', () => {
    it('orders contributions by locale specificity, then newest first', () => {
      const locales = setup(['fr', 'fr-CA'])
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
      const locales = setup(['fr'])
      locales.registerResources('time', { fr: { id: 'fr' }, en: { id: 'en' } })
      expect(locales.getResources('time').map(({ locale }) => locale)).toEqual(['en'])
      expect(locales.getResources('time', 'fr').map(({ locale }) => locale)).toEqual(['fr', 'en'])
    })
    it('normalizes resource locales', () => {
      const locales = setup()
      locales.registerResources('time', { 'en-us': { id: 'en-US' } })
      expect(locales.getResources('time', 'en-US')).toEqual([{ locale: 'en-US', resource: { id: 'en-US' } }])
    })
    it('rejects duplicate locales within one contribution', () => {
      const locales = setup()
      expect(() => locales.registerResources('time', { 'en-US': {}, 'en-us': {} }))
        .toThrow('Duplicate resource locale: en-US')
    })
    it('keeps namespaces apart', () => {
      const locales = setup()
      locales.registerResources('time', { en: { id: 'time' } })
      locales.registerResources('geospatial', { en: { id: 'geospatial' } })
      expect(locales.getResources('time')).toEqual([{ locale: 'en', resource: { id: 'time' } }])
    })
    it('returns an empty list for an unknown namespace', () => {
      const locales = setup()
      expect(locales.getResources('time')).toEqual([])
    })
    it('accepts resources registered before additional locales', () => {
      const locales = new Locales()
      locales.registerResources('time', { fr: { id: 'fr' } })
      locales.register('fr')
      expect(locales.getResources('time', 'fr')).toEqual([{ locale: 'fr', resource: { id: 'fr' } }])
    })
  })
})

describe('current locales', () => {
  it('throws when no locales have been configured', async () => {
    vi.resetModules()
    const { getLocales } = await import('../../src/runtime/locales.js')
    expect(() => getLocales()).toThrow('locales must be configured')
  })
  it('installs and retrieves the current locales', () => {
    const locales = setup(['fr'])
    setLocales(locales)
    expect(getLocales()).toBe(locales)
  })
  it('rejects an invalid instance and preserves the current one', () => {
    const locales = setup()
    setLocales(locales)
    for (const value of [undefined, null, {}, 'en', 42]) {
      expect(() => setLocales(value)).toThrow('locales must be an instance of Locales')
      expect(getLocales()).toBe(locales)
    }
  })
  it('replaces the current locales', () => {
    const first = setup(['fr'])
    const second = setup(['de'])
    setLocales(first)
    setLocales(second)
    expect(getLocales()).toBe(second)
    expect([...getLocales().list()]).toEqual(['en', 'de'])
  })
  it('reflects changes to the installed instance', () => {
    const locales = setup(['fr'])
    setLocales(locales)
    locales.setCurrent('fr')
    expect(getLocales().getCurrent()).toBe('fr')
  })
})
