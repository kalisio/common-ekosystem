import { assert, is } from '@kalisio/common-core/predicates'
import { Authorization } from './authorization.js'

let globalAuthorization

export function setGlobalAuthorization (authorization) {
  assert.that(
    authorization,
    value => is.instanceOf(value, Authorization),
    'authorization must be an instance of Authorization'
  )
  globalAuthorization = authorization
}

export function getGlobalAuthorization () {
  return globalAuthorization
}
