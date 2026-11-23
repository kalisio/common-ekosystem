import { Locales } from '@kalisio/common-core/runtime'
import { setup } from '../src/setup.js'

const NAMESPACE = 'common-geospatial'

describe('setup', () => {
  it('registers built-in English and French messages', () => {
    const locales = new Locales()
    setup({ locales })
    const en = locales.getResources(NAMESPACE, 'en')
    const fr = locales.getResources(NAMESPACE, 'fr')
    expect(en[0].locale).toBe('en')
    expect(en[0].resource).toHaveProperty('DIRECTIONS')
    expect(fr[0].locale).toBe('fr')
    expect(fr[0].resource).toHaveProperty('DIRECTIONS')
  })
  it('accepts additional messages for German and Italian', () => {
    const locales = new Locales()
    locales.register('de')
    locales.register('it')
    const de = { DIRECTIONS: { NORTH: { label: 'Nord', symbol: 'N' } } }
    const it = { DIRECTIONS: { NORTH: { label: 'Nord', symbol: 'N' } } }
    setup({ locales, messages: { de, it } })
    expect(locales.getResources(NAMESPACE, 'de')[0]).toEqual({ locale: 'de', resource: de })
    expect(locales.getResources(NAMESPACE, 'it')[0]).toEqual({ locale: 'it', resource: it })
  })
  it('preserves built-in messages when adding languages', () => {
    const locales = new Locales()
    locales.register('de')
    setup({ locales, messages: { de: { id: 'custom-de' } } })
    expect(locales.getResources(NAMESPACE, 'en')[0].resource).toHaveProperty('DIRECTIONS')
    expect(locales.getResources(NAMESPACE, 'fr')[0].resource).toHaveProperty('DIRECTIONS')
  })
  it('gives custom messages priority over built-in messages', () => {
    const locales = new Locales()
    const fr = { DIRECTIONS: { NORTH: { label: 'Nord personnalisé', symbol: 'N' } } }
    setup({ locales, messages: { fr } })
    const resources = locales.getResources(NAMESPACE, 'fr')
    expect(resources[0]).toEqual({ locale: 'fr', resource: fr })
    expect(resources[1].locale).toBe('fr')
    expect(resources[1].resource).toHaveProperty('DIRECTIONS')
    expect(resources[2].locale).toBe('en')
  })
  it('accepts omitted optional messages', () => {
    const locales = new Locales()
    expect(() => setup({ locales })).not.toThrow()
    expect(() => setup({ locales, messages: undefined })).not.toThrow()
  })
  it('rejects invalid messages', () => {
    for (const messages of [null, 42, 'de', [], () => {}]) {
      const locales = new Locales()
      expect(() => setup({ locales, messages })).toThrow('invalid setup options')
    }
  })
  it('rejects missing or invalid locales', () => {
    expect(() => setup()).toThrow('invalid setup options')
    expect(() => setup({ locales: null })).toThrow('invalid setup options')
    expect(() => setup({ locales: {} })).toThrow('invalid setup options')
  })
  it('rejects invalid resource locales', () => {
    const locales = new Locales()
    expect(() => setup({ locales, messages: { en_US: {} } })).toThrow(RangeError)
  })
})
