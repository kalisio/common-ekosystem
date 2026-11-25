import { Ability, subject as setSubjectType } from '@casl/ability'
import { rulesToCondition } from '@casl/ability/extra'
import { assert, conform, is, optional } from '@kalisio/common-core/predicates'
import { abilities } from './abilities.js'
import { conditionsMatcher } from './conditions-matcher.js'

const OPTIONS_SCHEMA = {
  field: optional(is.nonEmptyString),
  attributes: optional(is.plainObject)
}

const isObjectOrNil = value => is.nil(value) || is.plainObject(value)

// Contract shared by can and toMongoQuery
function assertArguments (ability, action, subjectType, options) {
  assert.all([
    { value: ability, validator: value => is.instanceOf(value, Ability), message: 'ability must be a CASL ability' },
    { value: action, validator: is.nonEmptyString, message: 'action must be a non-empty string' },
    { value: subjectType, validator: is.nonEmptyString, message: 'subjectType must be a non-empty string' },
    {
      value: options,
      validator: value => is.plainObject(value) && conform.schema(value, OPTIONS_SCHEMA),
      message: 'invalid permission options'
    }
  ])
}

const LOGICAL_OPERATORS = new Set(['$and', '$or', '$nor'])

// MongoDB combinations of the rules converted by toMongoQuery, a single condition being left as is
const hooks = {
  and: conditions => conditions.length === 1 ? conditions[0] : { $and: conditions },
  or: conditions => conditions.length === 1 ? conditions[0] : { $or: conditions },
  empty: () => ({})
}

// A cannot rule excludes the documents matching its conditions
const convert = ({ inverted, conditions }) => inverted ? { $nor: [conditions] } : conditions

// Top-level conjuncts of a query, nested $and included, so that each one is classified on its own
function getConjuncts (query) {
  return Object.entries(query).flatMap(([key, value]) =>
    key === '$and' ? value.flatMap(getConjuncts) : [{ [key]: value }])
}

// First segments of the field paths of a query. Only logical operators hold nested queries:
// the value of a field, $elemMatch included, refers to its subfields
function getFieldRoots (query, roots = new Set()) {
  for (const [key, value] of Object.entries(query)) {
    if (LOGICAL_OPERATORS.has(key)) value.forEach(item => getFieldRoots(item, roots))
    else roots.add(key.split('.')[0])
  }
  return roots
}

function toConditions (conjuncts) {
  return conjuncts.reduce((conditions, conjunct) => abilities.mergeConditions(conditions, conjunct), undefined)
}

// A rule whose attribute part does not match is dropped, otherwise only its part on stored fields is kept
function resolveAttributes (rule, attributes) {
  const attributeConjuncts = []
  const storedConjuncts = []
  for (const conjunct of getConjuncts(rule.conditions)) {
    const roots = [...getFieldRoots(conjunct)]
    const attributeRoots = roots.filter(root => Object.hasOwn(attributes, root))
    if (attributeRoots.length === 0) storedConjuncts.push(conjunct)
    else if (attributeRoots.length === roots.length) attributeConjuncts.push(conjunct)
    // Not an assertion: no query could express such a rule, ignoring either part would change the permissions
    else throw new Error(`rule mixes attributes and stored fields under ${Object.keys(conjunct).join(', ')}`)
  }
  // Evaluated on the attributes alone, with the matcher of every ability
  if (attributeConjuncts.length > 0 && !conditionsMatcher(toConditions(attributeConjuncts))(attributes)) return null
  return { inverted: rule.inverted, conditions: toConditions(storedConjuncts) }
}

export const permissions = {

  // Types a copy: CASL defines a hidden property on the object it types, which would alter the caller's object,
  // fail on a frozen or readonly one, and throw if the object was already typed otherwise.
  // Attributes take priority over subject properties, as they are meant to carry trusted information:
  // this function cannot tell where they come from, the caller is responsible for it
  createSubject (subjectType, subject, attributes) {
    assert.all([
      { value: subjectType, validator: is.nonEmptyString, message: 'subjectType must be a non-empty string' },
      { value: subject, validator: isObjectOrNil, message: 'subject must be an object or nil' },
      { value: attributes, validator: isObjectOrNil, message: 'attributes must be an object or nil' }
    ])
    return setSubjectType(subjectType, { ...subject, ...attributes })
  },

  // The evaluation depends on what is given:
  // - the subject type alone: CASL only checks that a rule exists, even a conditional one;
  // - a subject: conditions are evaluated on a typed copy;
  // - a subject and attributes: conditions are evaluated on a typed copy, attributes taking priority;
  // - attributes alone: conditions are evaluated on the attributes, any other property being absent.
  // Only a complete subject gives a definitive authorization on a resource. Otherwise, conditions on missing
  // properties are evaluated as on absent ones: $exists: false, $ne or $nin may match, and a cannot rule
  // depending on them does not apply. The same goes for a subject loaded with a projection.
  // Fine to show or hide an action, never to authorize an operation on a resource.
  can (ability, action, subjectType, subject, options = {}) {
    if (is.nil(ability)) return false
    assertArguments(ability, action, subjectType, options)
    const { field, attributes } = options
    const target = is.nil(subject) && is.nil(attributes)
      ? subjectType
      : permissions.createSubject(subjectType, subject, attributes)
    return ability.can(action, target, field)
  },

  cannot (ability, action, subjectType, subject, options) {
    return !permissions.can(ability, action, subjectType, subject, options)
  },

  // Filter on the documents of the subject type the ability allows for the action:
  // - null: no document, the query must not be run;
  // - {}: every document;
  // - otherwise a filter, to combine with another query through $and rather than by merging keys.
  // With a field, only the rules applying to it are taken into account, as in can: the filter selects
  // the documents on which the operation is allowed for this field, it is not a projection.
  // Attributes are properties which are not stored in the collection, such as a context: they are resolved
  // rule by rule before conversion. Without them, a rule depending on such a property is converted as is:
  // a can rule matches no document, a cannot rule excludes none, as can on a partial subject
  toMongoQuery (ability, action, subjectType, options = {}) {
    if (is.nil(ability)) return null
    assertArguments(ability, action, subjectType, options)
    const { field, attributes } = options
    // In priority order, aliases resolved. Empty conditions are no conditions: converted as is, they would give { $or: [{}] }
    let rules = ability.rulesFor(action, subjectType, field).map(({ inverted, conditions }) =>
      ({ inverted, conditions: is.nonEmptyObject(conditions) ? conditions : undefined }))
    if (is.defined(attributes)) {
      rules = rules
        .map(rule => is.defined(rule.conditions) ? resolveAttributes(rule, attributes) : rule)
        .filter(rule => rule !== null)
    }
    return rulesToCondition(rules, convert, hooks)
  }

}
