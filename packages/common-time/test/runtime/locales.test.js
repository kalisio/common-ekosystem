import { setLocales, getLocales } from '@kalisio/common-core/runtime'
import { date, loadTimeLocale, registerTimeLocales } from '../../src/index.js'

describe('time locales', () => {
  it('loads the parent language of the current locale for explicit formatting', async () => {
    setLocales({ default: 'fr-CA' })
    registerTimeLocales()

    const locale = await loadTimeLocale()
    expect(locale).toBe('fr')
    expect(getLocales().getCurrent()).toBe('fr-CA')
    expect(date.format(0, 'MMMM', { locale })).toBe('janvier')
    expect(date.format(0, 'MMMM')).toBe('January')
  })
  it('parses month names in English by default and in a loaded locale on demand', async () => {
    setLocales({ default: 'fr' })
    registerTimeLocales()
    const locale = await loadTimeLocale()
    const format = 'D MMMM YYYY'
    expect(date.parse('20 November 2026', { format }).toISOString()).toBe('2026-11-20T00:00:00.000Z')
    expect(date.parse('20 novembre 2026', { format, locale }).toISOString()).toBe('2026-11-20T00:00:00.000Z')
  })
  it('uses the fallback and prefers newer contributions of the same specificity', async () => {
    setLocales()
    registerTimeLocales()
    await expect(loadTimeLocale('de-DE')).resolves.toBe('en')

    const load = vi.fn()
    getLocales().registerResources('common-time', { fr: { locale: 'en', load } })
    await expect(loadTimeLocale('fr')).resolves.toBe('en')
    expect(load).toHaveBeenCalledOnce()
  })
  it('reports when no resource matches the current locale', async () => {
    setLocales({ default: 'fr-CA' })
    await expect(loadTimeLocale()).rejects.toThrow('No Moment locale available for: fr-CA')
  })
  it.each([
    [{ locale: '' }, TypeError],
    [{ locale: 'en', load: true }, TypeError],
    [{ locale: 'unknown-time-locale' }, RangeError]
  ])('rejects an invalid resource %o', async (resource, errorType) => {
    setLocales()
    getLocales().registerResources('common-time', { en: resource })
    await expect(loadTimeLocale()).rejects.toThrow(errorType)
  })
  it('propagates loader failures', async () => {
    setLocales()
    const error = new Error('load failed')
    getLocales().registerResources('common-time', {
      en: { locale: 'en', load: () => Promise.reject(error) }
    })
    await expect(loadTimeLocale()).rejects.toBe(error)
  })
})
