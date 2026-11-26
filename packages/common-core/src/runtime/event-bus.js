import { assert, is } from '../predicates/index.js'
import { getLogger } from './logger.js'

const logger = getLogger(['common-core', 'event-bus'])
const isEventName = value => is.nonEmptyString(value) || is.symbol(value)

export class EventBus {
  #listeners = new Map()
  #destroyed = false

  get destroyed () {
    return this.#destroyed
  }

  #assertSubscription (event, callback) {
    if (this.#destroyed) throw new Error('event bus has been destroyed')
    assert.that(event, isEventName, 'event must be a non-empty string or a symbol')
    assert.that(callback, is.function, 'callback must be a function')
  }

  // A removed entry is flagged so that an emission in progress skips it.
  #removeEntry (event, entry) {
    const entries = this.#listeners.get(event)
    if (!entries) return
    const index = entries.indexOf(entry)
    if (index === -1) return
    entries.splice(index, 1)
    entry.removed = true
    if (entries.length === 0) this.#listeners.delete(event)
  }

  // Each subscription has its own entry and unsubscribe function.
  #subscribe (event, callback, once) {
    const entry = { callback, once, removed: false }
    if (!this.#listeners.has(event)) this.#listeners.set(event, [])
    this.#listeners.get(event).push(entry)
    return () => this.#removeEntry(event, entry)
  }

  on (event, callback) {
    this.#assertSubscription(event, callback)
    return this.#subscribe(event, callback, false)
  }

  once (event, callback) {
    this.#assertSubscription(event, callback)
    return this.#subscribe(event, callback, true)
  }

  // Removes the first subscription of the callback, once() included.
  off (event, callback) {
    const entry = this.#listeners.get(event)?.find(candidate => candidate.callback === callback)
    if (entry) this.#removeEntry(event, entry)
  }

  offAll (event) {
    for (const entry of this.#listeners.get(event) ?? []) entry.removed = true
    this.#listeners.delete(event)
  }

  // Listeners receive { type, timestamp, data }.
  // Added listeners are skipped during the current emission.
  // Removed listeners are skipped, including during nested emissions.
  emit (event, data) {
    if (this.#destroyed) return
    const payload = { type: event, timestamp: Date.now(), data }
    const snapshot = [...(this.#listeners.get(event) ?? [])]
    for (const entry of snapshot) {
      if (this.#destroyed) break
      if (entry.removed) continue
      if (entry.once) this.#removeEntry(event, entry)
      try {
        const result = entry.callback(payload)
        if (is.function(result?.then)) {
          Promise.resolve(result).catch(error => logger.error(error, event))
        }
      } catch (error) {
        logger.error(error, event)
      }
    }
  }

  listenerCount (event) {
    return this.#listeners.get(event)?.length ?? 0
  }

  destroy () {
    this.#destroyed = true
    this.#listeners.clear()
  }
}
