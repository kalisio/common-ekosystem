import { assert, is } from '@kalisio/common-core/predicates'
import moment from 'moment-timezone'

const NAMESPACE = 'common-time'

// Registers the Moment locales supported by common-time.
export function registerTimeLocales (locales) {
  assert.that(locales, value => is.object(value) && is.function(value.registerResources), 'locales must support registerResources()')
  locales.registerResources(NAMESPACE, {
    en: { locale: 'en' },
    fr: {
      locale: 'fr',
      load: () => import('moment/locale/fr.js')
    }
  })
}

// Loads the best matching Moment locale and returns its code.
export async function loadTimeLocale (locales, code) {
  assert.that(locales, value => is.object(value) && is.function(value.getResources), 'locales must support getResources()')
  const [entry] = locales.getResources(NAMESPACE, code)
  if (!entry) throw new RangeError(`No Moment locale available for: ${code ?? locales.getCurrent()}`)
  const { locale, load } = entry.resource
  if (!is.nonEmptyString(locale)) throw new TypeError('Moment locale must be a non-empty string')
  if (load !== undefined) {
    if (!is.function(load)) throw new TypeError('Moment locale loader must be a function')
    await load()
  }
  if (!moment.locales().includes(locale)) {
    throw new RangeError(`Moment locale not loaded: ${locale}`)
  }
  return locale
}
