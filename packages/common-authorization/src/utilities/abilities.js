import { Ability, AbilityBuilder, createAliasResolver, fieldPatternMatcher } from '@casl/ability'
import { assert, conform, ensure, is, optional } from '@kalisio/common-core/predicates'
import { promise } from '@kalisio/common-core/utilities'
import { conditionsMatcher, ensureConditions } from './conditions-matcher.js'

const OPTIONS_SCHEMA = {
  aliases: optional(value => is.plainObject(value) &&
    Object.values(value).every(actions => is.nonEmptyArrayOf(actions, is.nonEmptyString)))
}

const isConditions = value => is.nil(value) || is.plainObject(value)

function ensureRules (rules) {
  ensure.that(rules, is.array, 'rules must be an array')
  for (const rule of rules) {
    ensure.that(rule, is.plainObject, 'rule must be an object')
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

export const abilities = {

  create (rules = [], options = {}) {
    ensureRules(rules)
    return new Ability(rules, getAbilityOptions(options))
  },

  createBuilder (options = {}) {
    const abilityOptions = getAbilityOptions(options)
    return new AbilityBuilder(rules => {
      ensureRules(rules)
      // A copy: rules defined through the builder afterwards must not alter the ability
      return new Ability([...rules], abilityOptions)
    })
  },

  update (ability, rules) {
    assert.that(ability, value => is.instanceOf(value, Ability), 'ability must be a CASL ability')
    ensureRules(rules)
    return ability.update(rules)
  },

  // Definitions and scope functions must be synchronous
  defineRoleAbilities (builder, registry, roles, definitions, scope) {
    assert.all([
      { value: builder, validator: value => is.instanceOf(value, AbilityBuilder), message: 'builder must be a CASL ability builder' },
      { value: registry, validator: value => is.function(value?.resolve), message: 'registry must resolve roles' },
      {
        value: definitions,
        validator: value => is.plainObject(value) && Object.values(value).every(is.function),
        message: 'definitions must map roles to functions'
      },
      {
        value: scope,
        validator: value => is.nil(value) || is.plainObject(value) || is.function(value),
        message: 'scope must be an object, a function or nil'
      }
    ])
    for (const role of registry.resolve(is.string(roles) ? [roles] : roles)) {
      if (!Object.hasOwn(definitions, role)) continue
      const start = builder.rules.length
      promise.checkNotThenable(definitions[role](builder), `definition of role ${role} must be synchronous`)
      if (is.nil(scope)) continue
      for (const rule of builder.rules.slice(start)) {
        const conditions = is.function(scope) ? promise.checkNotThenable(scope(rule), 'scope must be synchronous') : scope
        // Not an assertion: other conditions would silently leave the rule unscoped in production too
        ensure.that(conditions, isConditions, 'scope must return an object or nil')
        rule.conditions = abilities.mergeConditions(rule.conditions, conditions)
      }
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
