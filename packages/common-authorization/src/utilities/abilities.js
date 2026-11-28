import { Ability, AbilityBuilder, createAliasResolver, fieldPatternMatcher } from '@casl/ability'
import { assert, conform, ensure, is, optional } from '@kalisio/common-core/predicates'
import { object } from '@kalisio/common-core/utilities'
import { conditionsMatcher, ensureConditions } from './conditions-matcher.js'

const OPTIONS_SCHEMA = {
  aliases: optional(value => is.plainObject(value) &&
    Object.values(value).every(actions => is.nonEmptyArrayOf(actions, is.nonEmptyString)))
}

const isConditions = value => is.nil(value) || is.plainObject(value)
// every() skips sparse array holes, whereas includes(undefined) finds them.
const isNames = value => is.arrayOf(value, is.nonEmptyString) && !value.includes(undefined)
const isNameOrNames = value => is.nonEmptyString(value) || (is.nonEmptyArray(value) && isNames(value))
const isScopeConditions = value => is.nonEmptyObject(value) && Object.values(value).every(is.defined)
const createdBuilders = new WeakSet()
const createdAbilities = new WeakSet()
const pendingRoles = new WeakMap()

export const UNSCOPED = Symbol('unscoped')

function ensureIdle (builder, message = 'role abilities must finish before writing or building') {
  ensure.that(builder, value => !pendingRoles.has(value), message)
}

function ensureRules (rules) {
  ensure.that(rules, is.array, 'rules must be an array')
  for (const rule of rules) {
    ensure.that(rule, is.plainObject, 'rule must be an object')
    ensure.that(rule.action, isNameOrNames, 'rule action must be a non-empty string or array')
    // CASL treats a missing subject as a wildcard.
    ensure.that(rule.subject, isNameOrNames, 'rule subject must be a non-empty string or array')
    ensure.that(rule.inverted, value => is.nil(value) || is.boolean(value), 'rule inverted must be a boolean')
    ensure.that(rule.fields, value => is.nil(value) || isNameOrNames(value), 'rule fields must be a non-empty string or array')
    ensureConditions(rule.conditions)
  }
}

function getAbilityOptions (options) {
  assert.that(
    options,
    value => is.plainObject(value) && conform.schema(value, OPTIONS_SCHEMA),
    'invalid ability options'
  )
  const matchers = { conditionsMatcher, fieldMatcher: fieldPatternMatcher }
  const { aliases } = options
  return is.defined(aliases)
    ? { ...matchers, resolveAction: createAliasResolver(aliases) }
    : matchers
}

function createAbility (rules, options) {
  ensureRules(rules)
  const ability = new Ability([...rules], options)
  createdAbilities.add(ability)
  return ability
}

export const abilities = {

  create (rules = [], options = {}) {
    return createAbility(rules, getAbilityOptions(options))
  },

  createBuilder (options = {}) {
    const abilityOptions = getAbilityOptions(options)
    const builder = new AbilityBuilder(rules => createAbility(rules, abilityOptions))
    const build = builder.build
    builder.build = (options) => {
      ensureIdle(builder)
      ensure.that(options, value => value === undefined, 'ability options must be passed to abilities.createBuilder')
      return build()
    }
    for (const method of ['can', 'cannot']) {
      const write = builder[method]
      builder[method] = (...args) => {
        ensureIdle(builder)
        return write(...args)
      }
    }
    createdBuilders.add(builder)
    return builder
  },

  update (ability, rules) {
    ensure.that(ability, value => createdAbilities.has(value), 'ability must be created by abilities.create or abilities.createBuilder')
    ensureRules(rules)
    return ability.update([...rules])
  },

  async defineRoleAbilities (builder, registry, roles, definitions, scope) {
    if (scope === UNSCOPED) scope = undefined
    ensure.that(builder, value => createdBuilders.has(value), 'builder must be created by abilities.createBuilder')
    assert.all([
      { value: registry, validator: value => is.function(value?.resolve), message: 'registry must resolve roles' },
      {
        value: definitions,
        validator: value => is.plainObject(value) && Object.values(value).every(is.function),
        message: 'definitions must map roles to functions'
      }
    ])
    const names = is.string(roles) ? [roles] : roles
    ensure.that(names, isNames, 'roles must be a non-empty string or an array of role names')
    const resolvedRoles = registry.resolve(names)
    const scopeFunction = is.function(scope) ? scope : undefined
    let staticScope
    if (is.nil(scopeFunction) && is.defined(scope)) {
      ensure.that(scope, isScopeConditions, 'static scope must be non-empty conditions with defined values')
      ensureConditions(scope)
      staticScope = object.clone(scope)
    }
    const previous = pendingRoles.get(builder)
    const pending = (async () => {
      await previous?.catch(() => {})
      // Commit only after every definition and scope succeeds.
      const staged = abilities.createBuilder()
      for (const role of resolvedRoles) {
        if (!Object.hasOwn(definitions, role)) continue
        const start = staged.rules.length
        await definitions[role](staged)
        if (is.nil(scope)) continue
        for (const rule of staged.rules.slice(start)) {
          const conditions = is.defined(scopeFunction) ? await scopeFunction(object.clone(rule)) : staticScope
          if (conditions === UNSCOPED) continue
          ensure.that(conditions, isScopeConditions, 'scope must return non-empty conditions with defined values or UNSCOPED')
          rule.conditions = abilities.mergeConditions(rule.conditions, object.clone(conditions))
        }
      }
      ensureIdle(staged, 'role definitions must await nested role abilities')
      ensureRules(staged.rules)
      for (const rule of staged.rules) builder.rules.push(rule)
    })()
    pendingRoles.set(builder, pending)
    try {
      await pending
    } finally {
      if (pendingRoles.get(builder) === pending) pendingRoles.delete(builder)
    }
  },

  mergeConditions (left, right) {
    assert.all([
      { value: left, validator: isConditions, message: 'left must be an object or nil' },
      { value: right, validator: isConditions, message: 'right must be an object or nil' }
    ])
    const hasLeft = is.nonEmptyObject(left)
    const hasRight = is.nonEmptyObject(right)
    if (!hasLeft && !hasRight) return undefined
    if (!hasLeft) return { ...right }
    if (!hasRight) return { ...left }
    const shared = Object.keys(left).some(key => Object.hasOwn(right, key))
    return shared ? { $and: [left, right] } : { ...left, ...right }
  }

}
