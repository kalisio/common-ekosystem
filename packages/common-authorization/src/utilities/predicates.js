import { ensure, is } from '@kalisio/common-core/predicates'

// Rules must all be defined before the ability is built: an asynchronous function would complete after it.
// Not an assertion: it would silently define incomplete or unscoped rules in production too.
// The function has already run and its promise is not awaited: a rejection must not be left unhandled
export function ensureSynchronous (value, message) {
  const synchronous = !is.function(value?.then)
  if (!synchronous) Promise.resolve(value).catch(() => {})
  ensure.that(synchronous, is.booleanTrue, message)
  return value
}
