import { assert, conform, ensure, is, optional } from '@kalisio/common-core/predicates'
import { Cache, Registry } from '@kalisio/common-core/structures'
import { cast, object } from '@kalisio/common-core/utilities'
import { abilities } from '../utilities/index.js'
import { RoleRegistry } from './role-registry.js'

// A safety net rather than a revocation mechanism: invalidation remains the application's responsibility
const DEFAULT_CACHE_TTL = 60000

const OPTIONS_SCHEMA = {
  // Validated by abilities
  aliases: optional(is.plainObject),
  // max and ttl are validated by Cache
  cache: optional(value => is.plainObject(value) && is.function(value.key) &&
    Object.keys(value).every(key => ['key', 'ttl', 'max'].includes(key)))
}

const isKeyPart = value => is.nonEmptyString(value) || is.number(value) || is.function(value?.toHexString)

export class Authorization {
  #roles = new RoleRegistry()
  #hooks = new Registry('authorization-hooks')
  #hooksVersion = 0
  #abilityOptions
  #cache
  #key

  constructor (options = {}) {
    ensure.that(
      options,
      value => is.plainObject(value) && conform.schema(value, OPTIONS_SCHEMA) &&
        Object.keys(value).every(key => Object.hasOwn(OPTIONS_SCHEMA, key)),
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

  // Always builds a new ability.
  async defineAbility (actor, context = {}) {
    assert.that(context, is.plainObject, 'context must be an object')
    const builder = abilities.createBuilder(this.#abilityOptions)
    for (const hook of this.#hooks.values()) {
      const pendingRoles = []
      let active = true
      const ensureActive = () => ensure.that(active, is.booleanTrue, 'hook API used after the hook settled')
      try {
        const result = hook(actor, {
          can: (...args) => {
            ensureActive()
            return builder.can(...args)
          },
          cannot: (...args) => {
            ensureActive()
            return builder.cannot(...args)
          },
          defineRoleAbilities: (roles, roleDefinitions, scope) => {
            ensureActive()
            const pending = abilities.defineRoleAbilities(builder, this.#roles, roles, roleDefinitions, scope)
            // The hook may leave this promise unawaited or reject before it settles.
            pending.catch(() => {})
            pendingRoles.push(pending)
            return pending
          }
        }, context)
        if (is.thenable(result)) await result
      } finally {
        active = false
      }
      await Promise.all(pendingRoles)
    }
    return builder.build()
  }

  // Cache the rules promise before running any hooks.
  async getAbility (actor, context = {}) {
    assert.that(context, is.plainObject, 'context must be an object')
    if (is.nil(this.#cache)) return this.defineAbility(actor, context)
    const key = this.#getKey(actor, context)
    const epoch = this.#getEpoch()
    let entry = this.#cache.get(key)
    if (is.nil(entry) || entry.epoch !== epoch) {
      const { promise, resolve, reject } = Promise.withResolvers()
      entry = { epoch, rules: promise }
      this.#cache.set(key, entry)
      entry.rules.catch(() => {
        // Inspect without changing the recency of a replacement entry.
        if (this.#cache.entries().some(([cachedKey, cached]) => cachedKey === key && cached === entry)) {
          this.#cache.unregister(key)
        }
      })
      this.#defineRules(actor, context).then(resolve, reject)
    }
    // Every ability gets its own copy, so that it is isolated from the others and behaves as one built by defineAbility
    return abilities.create(object.clone(await entry.rules), this.#abilityOptions)
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

  async #defineRules (actor, context) {
    const ability = await this.defineAbility(actor, context)
    // A private copy: conditions may hold values shared with the hooks, such as an array of the actor
    return object.clone(ability.rules)
  }

  #getKey (actor, context) {
    const parts = this.#key(actor, context)
    // Invalid parts can make distinct actors share one cache entry. Array.from exposes sparse holes.
    ensure.that(
      parts,
      value => is.nonEmptyArray(value) && Array.from(value).every(isKeyPart),
      'cache key must be a non-empty array of strings, finite numbers or ObjectIds'
    )
    return JSON.stringify(parts.map(part => {
      // A serialized identifier must invalidate the same entry as the original value.
      const text = cast.string(part)
      if (is.defined(text)) return text
      const hex = part.toHexString()
      ensure.that(hex, value => is.string(value) && /^[a-f\d]{24}$/i.test(value), 'invalid ObjectId cache key part')
      return hex.toLowerCase()
    }))
  }

  // Changes whenever roles or hooks do, so that entries computed before are stale
  #getEpoch () {
    return `${this.#roles.version}:${this.#hooksVersion}`
  }
}
