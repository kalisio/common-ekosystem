import { assert, is } from '../predicates/index.js'
import { Registry } from './registry.js'

export class Factory extends Registry {
  constructor (name = 'factory') {
    super(name)
  }

  _validateEntry (key, creator) {
    super._validateEntry(key, creator)
    assert.that(creator, is.function, 'creator must be a function')
  }

  create (key, ...args) {
    const creator = this.get(key)
    if (!creator) throw new Error(`[${this.name}] unknown key: ${String(key)}`)
    return creator(...args)
  }
}
