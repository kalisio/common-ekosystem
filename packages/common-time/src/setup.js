import { assert, is, conform, optional } from '@kalisio/common-core/predicates'
import { Clock, setGlobalClock } from './runtime/index.js'

const SETUP_OPTIONS_SCHEMA = {
  clock: optional(value => is.instanceOf(value, Clock))
}

export function setup (options = {}) {
  assert.that(
    options,
    value => is.plainObject(value) && conform.schema(value, SETUP_OPTIONS_SCHEMA),
    'invalid setup options'
  )
  const { clock } = options
  if (is.defined(clock)) setGlobalClock(clock)
}
