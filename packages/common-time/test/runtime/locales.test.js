import { Locales } from '@kalisio/common-core/runtime'
import { date, loadTimeLocale, registerTimeLocales } from '../../src/index.js'

describe('time locales', () => {
  it('loads the parent language of the current locale for explicit formatting', async () => {
    const locales = new Locales({ default: 'fr-CA' })
    registerTimeLocales(locales)

    const locale = await loadTimeLocale(locales)
    expect(locale).toBe('fr')
    expect(locales.getCurrent()).toBe('fr-CA')
    expect(date.format(0, 'MMMM', { locale })).toBe('janvier')
    expect(date.format(0, 'MMMM')).toBe('January')
  })

  it('parses month names in English by default and in a loaded locale on demand', async () => {
    const locales = new Locales({ default: 'fr' })
    registerTimeLocales(locales)
    const locale = await loadTimeLocale(locales)
    const format = 'D MMMM YYYY'
    expect(date.parse('20 November 2026', { format }).toISOString()).toBe('2026-11-20T00:00:00.000Z')
    expect(date.parse('20 novembre 2026', { format, locale }).toISOString()).toBe('2026-11-20T00:00:00.000Z')
  })

  it('uses the fallback and prefers newer contributions of the same specificity', async () => {
    const locales = new Locales()
    registerTimeLocales(locales)
    await expect(loadTimeLocale(locales, 'de-DE')).resolves.toBe('en')

    const load = vi.fn()
    locales.registerResources('common-time', { fr: { locale: 'en', load } })
    await expect(loadTimeLocale(locales, 'fr')).resolves.toBe('en')
    expect(load).toHaveBeenCalledOnce()
  })

  it('reports when no resource matches the current locale', async () => {
    const locales = new Locales({ default: 'fr-CA' })
    await expect(loadTimeLocale(locales)).rejects.toThrow('No Moment locale available for: fr-CA')
  })

  it.each([
    [{ locale: '' }, TypeError],
    [{ locale: 'en', load: true }, TypeError],
    [{ locale: 'unknown-time-locale' }, RangeError]
  ])('rejects an invalid resource %o', async (resource, errorType) => {
    const locales = new Locales()
    locales.registerResources('common-time', { en: resource })
    await expect(loadTimeLocale(locales)).rejects.toThrow(errorType)
  })

  it('propagates loader failures', async () => {
    const locales = new Locales()
    const error = new Error('load failed')
    locales.registerResources('common-time', {
      en: { locale: 'en', load: () => Promise.reject(error) }
    })
    await expect(loadTimeLocale(locales)).rejects.toBe(error)
  })
})
