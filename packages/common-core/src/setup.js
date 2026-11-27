import { assert, is, conform, optional } from './predicates/index.js'
import { setLocales } from './runtime/locales.js'
import { setLogger } from './runtime/logger.js'

const SETUP_OPTIONS_SCHEMA = {
  logger: optional(is.function),
  locales: optional(is.plainObject)
}

export function setup (options = {}) {
  assert.that(options, value => conform.schema(value, SETUP_OPTIONS_SCHEMA), 'invalid setup options')
  const { logger, locales } = options
  if (is.defined(locales)) setLocales(locales)
  if (is.defined(logger)) setLogger(logger)
}
