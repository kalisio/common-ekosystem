import { Cache, Registry } from '@kalisio/common-core/structures'
import { object } from '@kalisio/common-core/utilities'
import { assert, conform, is, optional } from '@kalisio/common-core/predicates'
import { abilities } from '../utilities/index.js'
import { ensureSynchronous } from '../utilities/predicates.js'
import { RoleRegistry } from './role-registry.js'

// A safety net rather than a revocation mechanism: invalidation remains the application's responsibility
const DEFAULT_CACHE_TTL = 60000

const OPTIONS_SCHEMA = {
  // Validated by abilities
  aliases: optional(is.plainObject),
  // max and ttl are validated by Cache
  cache: optional(value => is.plainObject(value) && conform.schema(value, { key: is.function }))
}

export class Authorization {
  #roles = new RoleRegistry()
  #hooks = new Registry('authorization-hooks')
  #hooksVersion = 0
  #abilityOptions
  #cache
  #key

  constructor (options = {}) {
    assert.that(
      options,
      value => is.plainObject(value) && conform.schema(value, OPTIONS_SCHEMA),
      'invalid authorization options'
    )
    const { aliases, cache } = options
    // A copy: the configuration must not change during the lifetime of the instance
    this.#abilityOptions = is.defined(aliases) ? { aliases: object.clone(aliases) } : {}
    // Checks the aliases now, with the same validation as every ability, rather than on the first one
    abilities.create([], this.#abilityOptions)
    if (is.defined(cache)) {
      const { key, ttl = DEFAULT_CACHE_TTL, ...cacheOptions } = cache
      this.#cache = new Cache('abilities', { ...cacheOptions, ttl })
      this.#key = key
    }
  }

  get roles () {
    return this.#roles
  }

  // Hooks run in registration order: as the last matching rule wins in CASL, a later hook takes precedence
  registerHook (name, hook) {
    assert.that(hook, is.function, 'hook must be a function')
    this.#hooks.register(name, hook)
    this.#hooksVersion++
  }

  unregisterHook (name) {
    const removed = this.#hooks.unregister(name)
    if (removed) this.#hooksVersion++
    return removed
  }

  // Always builds a new ability. Each hook receives the actor, the functions to define rules and the context,
  // and must be synchronous
  defineAbility (actor, context = {}) {
    assert.that(context, is.plainObject, 'context must be an object')
    const builder = abilities.createBuilder(this.#abilityOptions)
    const definitions = {
      can: builder.can,
      cannot: builder.cannot,
      defineRoleAbilities: (roles, roleDefinitions, scope) =>
        abilities.defineRoleAbilities(builder, this.#roles, roles, roleDefinitions, scope)
    }
    for (const [name, hook] of this.#hooks.entries()) {
      ensureSynchronous(hook(actor, definitions, context), `hook ${name} must be synchronous`)
    }
    return builder.build()
  }

  // The cache holds a private copy of the rules, never an ability
  getAbility (actor, context = {}) {
    assert.that(context, is.plainObject, 'context must be an object')
    if (is.nil(this.#cache)) return this.defineAbility(actor, context)
    const key = this.#getKey(actor, context)
    const epoch = this.#getEpoch()
    let entry = this.#cache.get(key)
    if (is.nil(entry) || entry.epoch !== epoch) {
      // A failure throws before anything is cached
      entry = { epoch, rules: this.#defineRules(actor, context) }
      this.#cache.set(key, entry)
    }
    // Every ability gets its own copy, so that it is isolated from the others and behaves as one built by defineAbility
    return abilities.create(object.clone(entry.rules), this.#abilityOptions)
  }

  // Only affects the next calls: an ability already returned is not revoked
  invalidateAbility (actor, context = {}) {
    assert.that(context, is.plainObject, 'context must be an object')
    if (is.nil(this.#cache)) return false
    return this.#cache.unregister(this.#getKey(actor, context))
  }

  clearAbilities () {
    this.#cache?.clear()
  }

  #defineRules (actor, context) {
    const ability = this.defineAbility(actor, context)
    // A private copy: conditions may hold values shared with the hooks, such as an array of the actor
    return object.clone(ability.rules)
  }

  #getKey (actor, context) {
    const key = this.#key(actor, context)
    // A key that is not a string, an ObjectId for instance, would never be found again
    assert.that(key, is.nonEmptyString, 'cache key must be a non-empty string')
    return key
  }

  // Changes whenever roles or hooks do, so that entries computed before are stale
  #getEpoch () {
    return `${this.#roles.version}:${this.#hooksVersion}`
  }
}
