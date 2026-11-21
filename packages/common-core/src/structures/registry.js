import { assert, is } from '../predicates/index.js'

export class Registry {
  #name
  #entries = new Map()

  constructor (name = 'registry') {
    assert.that(name, is.nonEmptyString, 'name must be a non-empty string')
    this.#name = name
  }

  get name () {
    return this.#name
  }

  get size () {
    return this.#entries.size
  }

  register (key, value) {
    this._validateEntry(key, value)
    // has() lets subclasses decide what counts as present, e.g. expired cache entries
    // Not an assertion: this invariant must hold in production too
    if (this.has(key)) {
      throw new Error(`[${this.#name}] entry already registered: ${String(key)}`)
    }
    return this._set(key, value)
  }

  replace (key, value) {
    this._validateEntry(key, value)
    // Not an assertion: this invariant must hold in production too
    if (!this.has(key)) {
      throw new Error(`[${this.#name}] entry not registered: ${String(key)}`)
    }
    return this._set(key, value)
  }

  get (key) {
    assert.that(key, is.nonEmptyString, 'key must be a non-empty string')
    return this.#entries.get(key)
  }

  has (key) {
    assert.that(key, is.nonEmptyString, 'key must be a non-empty string')
    return this.#entries.has(key)
  }

  keys () {
    return [...this.#entries.keys()]
  }

  values () {
    return [...this.#entries.values()]
  }

  entries () {
    return [...this.#entries.entries()]
  }

  unregister (key) {
    assert.that(key, is.nonEmptyString, 'key must be a non-empty string')
    return this.#entries.delete(key)
  }

  clear () {
    this.#entries.clear()
  }

  // Extension point: validation shared by every write operation
  _validateEntry (key, value) {
    assert.all([
      { value: key, validator: is.nonEmptyString, message: 'key must be a non-empty string' },
      // nil is reserved for "absent" so that get() stays unambiguous
      { value, validator: is.defined, message: 'value must be defined' }
    ])
  }

  // Extension point: oldest key in insertion order, without copying
  _firstKey () {
    return this.#entries.keys().next().value
  }

  // Extension point: raw write, callers must validate first
  _set (key, value) {
    this.#entries.set(key, value)
    return value
  }
}
