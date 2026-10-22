import { assert, is } from '../predicates/index.js'
import { getLogger } from './logger.js'

const logger = getLogger(['common-core', 'event-bus'])

const isEventName = (value) => is.nonEmptyString(value) || typeof value === 'symbol'

export function createEventBus () {
  // Each subscription is an entry of its own, so that the function returned
  // by on() or once() only ever removes that subscription.
  const listeners = new Map()
  let destroyed = false

  function assertSubscription (event, callback) {
    if (destroyed) throw new Error('event bus has been destroyed')
    assert.that(event, isEventName, 'event must be a non-empty string or a symbol')
    assert.that(callback, is.function, 'callback must be a function')
  }

  // A removed entry is flagged so that an emission in progress skips it.
  function removeEntry (event, entry) {
    const entries = listeners.get(event)
    if (!entries) return
    const index = entries.indexOf(entry)
    if (index === -1) return
    entries.splice(index, 1)
    entry.removed = true
    if (entries.length === 0) listeners.delete(event)
  }

  function subscribe (event, callback, once) {
    const entry = { callback, once, removed: false }
    if (!listeners.has(event)) listeners.set(event, [])
    listeners.get(event).push(entry)
    return () => removeEntry(event, entry)
  }

  return {

    get destroyed () {
      return destroyed
    },

    on (event, callback) {
      assertSubscription(event, callback)
      return subscribe(event, callback, false)
    },

    once (event, callback) {
      assertSubscription(event, callback)
      return subscribe(event, callback, true)
    },

    // Removes the first subscription of the callback, once() ones included.
    off (event, callback) {
      const entry = listeners.get(event)?.find((candidate) => candidate.callback === callback)
      if (entry) removeEntry(event, entry)
    },

    offAll (event) {
      for (const entry of listeners.get(event) ?? []) entry.removed = true
      listeners.delete(event)
    },

    // Listeners receive { type, timestamp, data }, data being any value.
    // Listeners added during an emission are not called by it; listeners
    // removed during an emission are skipped, so a once() listener is called
    // a single time even when emissions are nested.
    emit (event, data) {
      if (destroyed) return
      const payload = { type: event, timestamp: Date.now(), data }
      const snapshot = [...(listeners.get(event) ?? [])]
      for (const entry of snapshot) {
        if (destroyed) break
        if (entry.removed) continue
        if (entry.once) removeEntry(event, entry)
        try {
          const result = entry.callback(payload)
          if (typeof result?.then === 'function') {
            Promise.resolve(result).catch((error) => logger.error(error, event))
          }
        } catch (error) {
          logger.error(error, event)
        }
      }
    },

    listenerCount (event) {
      return listeners.get(event)?.length ?? 0
    },

    destroy () {
      destroyed = true
      listeners.clear()
    }

  }
}
