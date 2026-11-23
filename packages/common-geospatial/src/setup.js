import { assert, is, conform, optional } from '@kalisio/common-core/predicates'
import en from './i18n/en.json'
import fr from './i18n/fr.json'

const SETUP_OPTIONS_SCHEMA = {
  locales: value => is.function(value?.registerResources),
  messages: optional(is.plainObject)
}

export function setup (options = {}) {
  assert.that(options, value => conform.schema(value, SETUP_OPTIONS_SCHEMA), 'invalid setup options')
  const { locales, messages } = options
  locales.registerResources('common-geospatial', { en, fr })
  if (is.defined(messages)) {
    locales.registerResources('common-geospatial', messages)
  }
}
