import { assert, is } from '@kalisio/common-core/predicates'
import { listen } from '@kalisio/common-core/runtime'
import { Clock } from './clock.js'

export function createClockListener (handlers) {
  assert.that(handlers, is.plainObject, 'handlers must be an object')
  for (const [event, callback] of Object.entries(handlers)) {
    assert.that(event, is.nonEmptyString, 'Clock event name must be a non-empty string')
    assert.that(callback, is.function, `Handler of event ${event} must be a function`)
  }

  let clock = null
  let stop = null

  const listener = {
    get clock () {
      return clock
    },

    attach (next) {
      assert.that(next, (v) => is.instanceOf(v, Clock), 'next must be a Clock instance')
      assert.that(next.disposed, is.booleanFalse, 'next should not be disposed')
      if (next === clock) return listener

      // Subscribe before detaching to preserve the current clock on failure.
      const nextStop = listen(next, handlers)
      listener.detach()
      clock = next
      stop = nextStop
      return listener
    },

    detach () {
      stop?.()
      stop = null
      clock = null
      return listener
    }
  }

  return Object.freeze(listener)
}
