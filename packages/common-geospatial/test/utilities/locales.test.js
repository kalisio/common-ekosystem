import { getLocales, Locales, setLocales } from '@kalisio/common-core/runtime'
import { locales, setup } from '../../src/index.js'

describe('locales.getMessages', () => {
  let previousRegistry

  beforeEach(() => {
    previousRegistry = getLocales()
  })

  afterEach(() => {
    setLocales(previousRegistry)
  })

  it('resolves a parent language and uses the configured fallback for an unsupported language', () => {
    const registry = new Locales({ default: 'en', fallback: 'fr' })
    setLocales(registry)
    setup({ locales: registry })

    const french = locales.getMessages('fr')
    expect(french.DIRECTIONS.WEST).toEqual({ label: 'Ouest', symbol: 'O' })
    expect(french.VALIDATION.INVALID_GEOMETRY).toEqual(expect.any(String))
    expect(locales.getMessages('fr-CA')).toBe(french)
    expect(locales.getMessages('de-DE')).toBe(french)
  })

  it('returns the highest-priority catalog as a whole', () => {
    const registry = new Locales()
    const custom = { VALIDATION: { INVALID_GEOMETRY: 'Custom translation' } }
    setLocales(registry)
    setup({ locales: registry, messages: { fr: custom } })

    expect(locales.getMessages('fr')).toBe(custom)
  })

  it('maps registered locale codes to their resolved catalogs when called without a code', () => {
    const registry = new Locales()
    registry.register('fr-CA')
    setLocales(registry)
    setup({ locales: registry })
    registry.setCurrent('fr-CA')

    expect(locales.getMessages()).toEqual({
      en: locales.getMessages('en'),
      'fr-CA': locales.getMessages('fr')
    })
  })

  it('returns undefined for a code with no matching resource', () => {
    const registry = new Locales({ default: 'de', fallback: 'it' })
    setLocales(registry)
    setup({ locales: registry })

    expect(locales.getMessages('de')).toBeUndefined()
    expect(locales.getMessages()).toEqual({ de: undefined, it: undefined })
  })
})
