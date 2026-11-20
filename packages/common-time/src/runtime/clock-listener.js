import { is } from '@kalisio/common-core/predicates'
import { Clock } from './clock.js'

export function createClockListener (handlers) {
  if (!is.plainObject(handlers)) {
    throw new TypeError('createClockListener expects an object of event handlers')
  }
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
      if (!is.instanceOf(next, Clock)) throw new TypeError('attach expects a Clock instance')
      if (next.disposed) throw new Error('attach expects a Clock that has not been disposed')
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
