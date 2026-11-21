import { assert, is } from '../predicates/index.js'
import { Registry } from './registry.js'

export class Cache extends Registry {
  #max
  #ttl
  #expirations = new Map()

  // ttl is in milliseconds, 0 disables expiration
  constructor (name = 'cache', { max = Infinity, ttl = 0 } = {}) {
    super(name)
    assert.all([
      {
        value: max,
        validator: v => is.positiveInteger(v) || is.positiveInfinity(v),
        message: 'max must be a positive integer or Infinity'
      },
      {
        value: ttl,
        validator: is.nonNegativeInteger,
        message: 'ttl must be a non-negative integer'
      }
    ])
    this.#max = max
    this.#ttl = ttl
  }

  get max () {
    return this.#max
  }

  get ttl () {
    return this.#ttl
  }

  get size () {
    this.#pruneExpired()
    return super.size
  }

  set (key, value) {
    this._validateEntry(key, value)
    return this._set(key, value)
  }

  get (key) {
    if (!this.has(key)) return undefined
    const value = super.get(key)
    // Move to the end (most recently used) without refreshing the ttl
    super.unregister(key)
    super._set(key, value)
    return value
  }

  has (key) {
    this.#pruneIfExpired(key)
    return super.has(key)
  }

  getOrSet (key, compute) {
    assert.that(compute, is.function, 'compute must be a function')
    if (this.has(key)) return this.get(key)
    return this.set(key, compute(key))
  }

  keys () {
    this.#pruneExpired()
    return super.keys()
  }

  values () {
    this.#pruneExpired()
    return super.values()
  }

  entries () {
    this.#pruneExpired()
    return super.entries()
  }

  unregister (key) {
    const removed = super.unregister(key)
    this.#expirations.delete(key)
    return removed
  }

  clear () {
    super.clear()
    this.#expirations.clear()
  }

  _set (key, value) {
    // Replacing an entry refreshes its recency
    if (super.has(key)) this.unregister(key)
    super._set(key, value)
    if (this.#ttl > 0) this.#expirations.set(key, Date.now() + this.#ttl)
    // Expired entries go first so that they never cost a live entry its place
    if (super.size > this.#max) this.#pruneExpired()
    // Evict least recently used entries
    while (super.size > this.#max) this.unregister(this._firstKey())
    return value
  }

  #pruneIfExpired (key) {
    const expiresAt = this.#expirations.get(key)
    if (is.defined(expiresAt) && expiresAt <= Date.now()) this.unregister(key)
  }

  #pruneExpired () {
    if (this.#ttl === 0) return
    for (const key of this.#expirations.keys()) this.#pruneIfExpired(key)
  }
}
