---
title: abilities
description: Utility functions for creating and manipulating authorization abilities.
---

# abilities

Utility functions for creating and manipulating CASL abilities.

All abilities share the same condition matcher, supporting MongoDB-style conditions, including the `$and`, `$or` and `$nor` logical operators.

Unsupported operators and invalid conditions are rejected when abilities are created or updated, including in production.

## create

### Signature

```js
abilities.create(rules, options)
```

### Description

Creates a CASL ability from a set of rules.

An ability created without rules does not grant any permission.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `rules` | `Object[]` | no | Authorization rules. Defaults to `[]` |
| `options` | `Object` | no | Ability options |
| `options.aliases` | `Object` | no | Mapping of action aliases to arrays of action names |

### Returns

| Type | Description |
|------|-------------|
| `Ability` | A new CASL ability |

### Examples

```js
import { abilities } from '@kalisio/common-authorization/utilities'

const ability = abilities.create([
  { action: 'read', subject: 'projects' },
  {
    action: 'update',
    subject: 'projects',
    conditions: { ownerId: 'user-1' }
  }
])
```

Using action aliases:

```js
const ability = abilities.create([
  { action: 'read', subject: 'projects' }
], {
  aliases: {
    read: ['get', 'find']
  }
})

ability.can('find', 'projects')
// true
```

## createBuilder

### Signature

```js
abilities.createBuilder(options)
```

### Description

Creates a CASL ability builder for defining authorization rules using the `can` and `cannot` functions.

Ability options are configured when the builder is created. Additional options passed to `build()` are ignored.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `Object` | no | Ability options |
| `options.aliases` | `Object` | no | Mapping of action aliases to arrays of action names |

### Returns

| Type | Description |
|------|-------------|
| `AbilityBuilder` | A CASL ability builder |

### Examples

```js
const { can, cannot, build } = abilities.createBuilder()

can('read', 'projects')

can('update', 'projects', {
  ownerId: 'user-1'
})

cannot('update', 'projects', {
  $or: [
    { locked: true },
    { archived: true }
  ]
})

const ability = build()
```

Restricting permissions to specific fields:

```js
const { can, build } = abilities.createBuilder()

can('update', 'projects', ['name', 'description'], {
  ownerId: 'user-1'
})

const ability = build()
```

## update

### Signature

```js
abilities.update(ability, rules)
```

### Description

Replaces the rules of an existing ability while preserving its instance and configuration.

This is particularly useful when other components hold references to the ability.

Frozen abilities cannot be updated.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `ability` | `Ability` | yes | The ability to update |
| `rules` | `Object[]` | yes | The new authorization rules |

### Returns

| Type | Description |
|------|-------------|
| `Ability` | The updated ability |

### Examples

```js
const ability = abilities.create([
  { action: 'read', subject: 'projects' }
])

abilities.update(ability, [
  { action: 'update', subject: 'projects' }
])

ability.can('read', 'projects')
// false

ability.can('update', 'projects')
// true
```

## mergeConditions

### Signature

```js
abilities.mergeConditions(left, right)
```

### Description

Combines two sets of conditions using a logical AND.

Conditions with disjoint keys are merged into a single object. When both conditions share a key, they are combined using the `$and` operator to preserve both constraints.

Neither input object is modified.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `left` | `Object` | no | The first set of conditions |
| `right` | `Object` | no | The second set of conditions |

### Returns

| Type | Description |
|------|-------------|
| `Object \| undefined` | The combined conditions, or `undefined` if both inputs are empty or nil |

### Examples

```js
abilities.mergeConditions(
  { ownerId: 'user-1' },
  { locked: false }
)
// { ownerId: 'user-1', locked: false }
```

Combining conditions on the same property:

```js
abilities.mergeConditions(
  { age: { $gte: 18 } },
  { age: { $lte: 65 } }
)
// {
//   $and: [
//     { age: { $gte: 18 } },
//     { age: { $lte: 65 } }
//   ]
// }
```

Combining empty conditions:

```js
abilities.mergeConditions({}, undefined)
// undefined
```
