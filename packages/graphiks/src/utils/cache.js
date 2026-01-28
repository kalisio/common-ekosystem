export class Cache {
  constructor (maxSize = 100) {
    this.cache = new Map()
    this.maxSize = maxSize
  }

  get (key) {
    return this.cache.get(key)
  }

  has (key) {
    return this.cache.has(key)
  }

  keys () {
    return [...this.cache.keys()]
  }

  set (key, value) {
    // remove oldest entry if max size reached
    if (this.maxSize && this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    // update or add entry
    this.cache.set(key, value)
  }

  delete (key) {
    return this.cache.delete(key)
  }

  clear () {
    this.cache.clear()
  }

  get size () {
    return this.cache.size
  }

  get max () {
    return this.maxSize
  }

  setMaxSize (newMaxSize) {
    this.maxSize = newMaxSize
    if (this.maxSize && this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
  }
}
