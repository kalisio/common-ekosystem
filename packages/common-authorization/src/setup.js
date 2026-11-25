import { assert, conform, is, optional } from '@kalisio/common-core/predicates'
import { Authorization, setGlobalAuthorization } from './runtime/index.js'

const OPTIONS_SCHEMA = {
  authorization: optional(value => is.instanceOf(value, Authorization))
}

export function setup (options = {}) {
  assert.that(
    options,
    value => is.plainObject(value) && conform.schema(value, OPTIONS_SCHEMA),
    'invalid setup options'
  )
  const { authorization } = options
  if (is.defined(authorization)) setGlobalAuthorization(authorization)
}
