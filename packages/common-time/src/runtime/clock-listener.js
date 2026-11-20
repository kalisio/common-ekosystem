import { assert, is } from '@kalisio/common-core/predicates'
import { Clock } from './clock.js'

export function createClockListener (handlers) {
  assert.that(handlers, is.plainObject, 'handlers muse be an object')
  const entries = Object.entries(handlers)
  for (const [event, callback] of entries) {
    if (!is.nonEmptyString(event)) {
      throw new TypeError('Clock event name must be a non-empty string')
    }
    if (!is.function(callback)) {
      throw new TypeError(`Handler of event ${event} must be a function`)
    }
  }
  let clock = null
  let unsubscribes = []

  const listener = {
    get clock () {
      return clock
    },

    attach (next) {
      assert.that(next, (v) => is.instanceOf(v, Clock), 'next must be a Clock instance')
      assert.that(next.disposed, is.booleanFalse, 'next should not be disposed')
      if (next === clock) return listener
      const subscriptions = []
      try {
        for (const [event, callback] of entries) {
          subscriptions.push(next.on(event, callback))
        }
      } catch (error) {
        for (const unsubscribe of subscriptions) unsubscribe()
        throw error
      }
      listener.detach()
      unsubscribes = subscriptions
      clock = next
      return listener
    },

    detach () {
      for (const unsubscribe of unsubscribes) unsubscribe()
      unsubscribes = []
      clock = null
      return listener
    }
  }

  return Object.freeze(listener)
}
