import { Cache } from './cache.js'

export class Registry {
  constructor () {
    this.cache = new Cache(0)
  }

  get (key) {
    return this.cache.get(key)
  }

  has (key) {
    return this.cache.has(key)
  }

  list () {
    return this.cache.keys()
  }

  register (key, value) {
    this.cache.set(key, value)
  }

  unregister (key) {
    return this.cache.delete(key)
  }

  clear () {
    this.cache.clear()
  }

  get size () {
    return this.cache.size
  }
}

// registry instance
export const registry = new Registry()
