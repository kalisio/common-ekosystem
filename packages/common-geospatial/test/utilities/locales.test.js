import { getLocales, setLocales } from '@kalisio/common-core/runtime'
import { locales, setup } from '../../src/index.js'

describe('locales.getMessages', () => {
  it('resolves a parent language and uses the configured fallback for an unsupported language', () => {
    setLocales({ default: 'en', fallback: 'fr' })
    setup()

    const french = locales.getMessages('fr')
    expect(french.DIRECTIONS.WEST).toEqual({ label: 'Ouest', symbol: 'O' })
    expect(french.VALIDATION.INVALID_GEOMETRY).toEqual(expect.any(String))
    expect(locales.getMessages('fr-CA')).toBe(french)
    expect(locales.getMessages('de-DE')).toBe(french)
  })
  it('returns the highest-priority catalog as a whole', () => {
    setLocales()
    const custom = { VALIDATION: { INVALID_GEOMETRY: 'Custom translation' } }
    setup({ messages: { fr: custom } })

    expect(locales.getMessages('fr')).toBe(custom)
  })
  it('maps registered locale codes to their resolved catalogs when called without a code', () => {
    setLocales()
    const registry = getLocales()
    registry.register('fr-CA')
    setup()
    registry.setCurrent('fr-CA')

    expect(locales.getMessages()).toEqual({
      en: locales.getMessages('en'),
      'fr-CA': locales.getMessages('fr')
    })
  })
  it('returns undefined for a code with no matching resource', () => {
    setLocales({ default: 'de', fallback: 'it' })
    setup()

    expect(locales.getMessages('de')).toBeUndefined()
    expect(locales.getMessages()).toEqual({ de: undefined, it: undefined })
  })
})
