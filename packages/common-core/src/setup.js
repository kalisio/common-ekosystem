import { assert, is, conform, optional } from './predicates/index.js'
import { Locales, setLocales, EventBus, setEventBus } from './runtime/index.js'
import { setLogger } from './runtime/logger.js'

const SETUP_OPTIONS_SCHEMA = {
  logger: optional(is.function),
  locales: optional(value => is.instanceOf(value, Locales)),
  bus: optional(value => is.instanceOf(value, EventBus))
}

export function setup (options = {}) {
  assert.that(options, value => conform.schema(value, SETUP_OPTIONS_SCHEMA), 'invalid setup options')
  const { logger, locales, bus } = options
  if (is.defined(logger)) setLogger(logger)
  if (is.defined(locales)) setLocales(locales)
  if (is.defined(bus)) setEventBus(bus)
}
