import { is } from '@kalisio/common-core/predicates'
import { getLocales } from '@kalisio/common-core/runtime'

const NAMESPACE = 'common-geospatial'

function getMessages (code) {
  const currentLocales = getLocales()
  const getResource = locale => currentLocales.getResources(NAMESPACE, locale)[0]?.resource
  if (is.defined(code)) return getResource(code)
  return Object.fromEntries(
    currentLocales.list().map(locale => [locale, getResource(locale)])
  )
}

export const locales = {
  getMessages
}
