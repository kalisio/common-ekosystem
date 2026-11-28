import { assert, conform, ensure, is, optional } from '@kalisio/common-core/predicates'
import { Registry } from '@kalisio/common-core/structures'

const DEFINITION_SCHEMA = {
  inherits: optional(value => is.arrayOf(value, is.nonEmptyString))
}

// Knows roles and their inheritance, neither actors nor resources
export class RoleRegistry extends Registry {
  #version = 0

  constructor (name = 'roles') {
    super(name)
  }

  // Incremented on every mutation, so that abilities built from previous roles can be told apart
  get version () {
    return this.#version
  }

  // Unlike Registry, a role still inherited by another one cannot be removed
  unregister (name) {
    if (!this.has(name)) return false
    const descendants = this.getDescendants(name)
    // Not an assertion: this invariant must hold in production too
    if (descendants.length > 0) {
      throw new Error(`[${this.name}] role still inherited by: ${descendants.join(', ')}`)
    }
    super.unregister(name)
    this.#version++
    return true
  }

  clear () {
    super.clear()
    this.#version++
  }

  // Roles in the order their rules must be defined: every ancestor once, before its descendants,
  // parents in the order of inherits so that the last listed one wins, then the role itself.
  // With several roles, the same goes for the given order
  resolve (names) {
    assert.that(names, value => is.arrayOf(value, is.nonEmptyString), 'roles must be an array of names')
    const resolved = new Set()
    const visit = name => {
      if (resolved.has(name)) return
      // Roles may come from stored data: checked in production too
      ensure.that(name, value => this.has(value), `unknown role: ${name}`)
      // Registration forbids cycles, so that this recursion always ends
      for (const parent of this.get(name).inherits) visit(parent)
      resolved.add(name)
    }
    names.forEach(visit)
    return [...resolved]
  }

  // Reflexive: a role inherits itself. Two roles on distinct branches do not inherit each other
  inherits (name, ancestor) {
    assert.that(ancestor, value => is.nonEmptyString(value) && this.has(value), `unknown role: ${ancestor}`)
    return this.resolve([name]).includes(ancestor)
  }

  // Closest ancestors first, i.e. the reverse resolution order
  getAncestors (name) {
    return this.resolve([name]).slice(0, -1).reverse()
  }

  // In registration order
  getDescendants (name) {
    assert.that(name, value => is.nonEmptyString(value) && this.has(value), `unknown role: ${name}`)
    return this.keys().filter(key => key !== name && this.resolve([key]).includes(name))
  }

  _validateEntry (name, definition) {
    super._validateEntry(name, definition)
    assert.that(
      definition,
      value => is.plainObject(value) && conform.schema(value, DEFINITION_SCHEMA),
      'invalid role definition'
    )
    // Not assertions: an unknown parent or a cycle would break resolution in production too
    for (const parent of definition.inherits ?? []) {
      ensure.that(parent, value => this.has(value), `unknown parent role: ${parent}`)
      ensure.that(
        parent,
        value => !this.resolve([value]).includes(name),
        `role ${name} cannot inherit ${parent}, which inherits it`
      )
    }
  }

  // Stores a frozen copy, so that a definition cannot be altered without going through the registry
  _set (name, definition) {
    const stored = Object.freeze({ ...definition, inherits: Object.freeze([...(definition.inherits ?? [])]) })
    super._set(name, stored)
    this.#version++
    return stored
  }
}
