---
title: abilities
description: Utility functions for creating and manipulating authorization abilities.
---

# abilities

Utility functions for creating and manipulating CASL abilities.

All abilities share the same [condition matcher](./conditions-matcher.md), supporting MongoDB-style conditions, including the `$and`, `$or` and `$nor` logical operators.

Unsupported operators and invalid conditions are rejected when abilities are created or updated, including in production.

Rules are evaluated in reverse definition order: the last applicable rule takes precedence. Use these utilities to validate conditions instead of updating a CASL ability directly.

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
import { abilities } from '@kalisio/common-authorization'

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

## defineRoleAbilities

### Signature

```js
await abilities.defineRoleAbilities(builder, registry, roles, definitions, scope)
```

### Description

Resolves the supplied role or roles through the registry, then executes matching definition callbacks sequentially in resolution order. A definition callback receives the CASL builder and may be asynchronous. Roles without a definition are skipped. Each role is resolved once. When supplied, `scope` is combined with the conditions of every rule added by the callback, including deny rules. A scope function receives the individual rule. Existing builder rules are not changed by scoping.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `builder` | `AbilityBuilder` | yes | CASL ability builder |
| `registry` | `RoleRegistry` | yes | Role registry (or compatible resolver) |
| `roles` | `string \| string[]` | yes | Role names to resolve |
| `definitions` | `Object` | yes | Mapping of role names to definition functions |
| `scope` | `Object \| Function` | no | Conditions or `(rule) => conditions` |

### Returns

| Type | Description |
|------|-------------|
| `Promise<void>` | Completes after the rules have been added |

### Examples

```js
import { abilities, permissions, RoleRegistry } from '@kalisio/common-authorization'

const roles = new RoleRegistry()
roles.register('member', {})
roles.register('manager', { inherits: ['member'] })

const builder = abilities.createBuilder()
await abilities.defineRoleAbilities(builder, roles, 'manager', {
  member: ({ can }) => can('read', 'projects'),
  manager: ({ can }) => can('update', 'projects')
}, { organizationId: 'org-1' })

const ability = builder.build()
permissions.can(ability, 'update', 'projects', { organizationId: 'org-1' })
// true
```

::: warning
Scoping a deny rule restricts that rule to its scope as well. Always await asynchronous role definitions before building the ability. The scope does not automatically attach attributes to subjects or database queries.
:::
