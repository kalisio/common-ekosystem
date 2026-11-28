---
title: abilities
description: Utility functions for creating and manipulating authorization abilities.
---

# abilities

Utility functions for creating and manipulating CASL abilities.

All abilities share the same [condition matcher](./conditions-matcher.md), supporting MongoDB-style conditions, including the `$and`, `$or` and `$nor` logical operators.

Rule shape and conditions are validated when abilities are created or updated, including in production. Each rule requires an action and an explicit subject, each a non-empty string or an array of non-empty strings. Use `all` for a wildcard subject. When supplied, `fields` follows the same format and `inverted` must be a boolean.

Rules are evaluated in reverse definition order: the last applicable rule takes precedence. Use these utilities to validate conditions instead of updating a CASL ability directly.

## create

### Signature

```js
abilities.create(rules, options)
```

### Description

Creates a CASL ability from a set of rules and copies the input array. Treat the individual rule objects as immutable after passing them in.

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

Ability options are configured when the builder is created. `build()` rejects options. Pass them to `abilities.createBuilder()`.

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

Replaces the rules of an ability created by these utilities while preserving its instance and configuration. Like `create()`, it copies the input array.

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
abilities.defineRoleAbilities(builder, registry, roles, definitions, scope) // Promise<void>
```

### Description

Resolves the supplied roles through the registry and awaits matching callbacks in resolution order. Definitions receive a temporary CASL builder containing only rules from the current call. They can be synchronous or asynchronous. Each resolved role is visited once, and roles without a definition are skipped. The last matching rule takes precedence. With [`RoleRegistry`](../runtime/role-registry.md#resolve), a descendant is always applied after its ancestors, regardless of their order in the input. Unrelated roles are visited in input order.

A scope object or function adds conditions to each generated rule, including deny rules. A scope must provide non-empty conditions with defined top-level values. The function receives a copy of each rule in order and can return conditions or the exported `UNSCOPED` symbol, directly or through a promise. `UNSCOPED` preserves the original conditions on that rule. Omit the scope or pass nil or `UNSCOPED` as the scope to leave all rules in the call as defined. Invalid results cause a `TypeError`, including in production. Static scopes are copied at the start of the call.

Calls targeting the same builder execute in call order. Each call appends its rules after all of its definitions and scopes succeed. Errors reject the promise without appending any rules from that call. Await the promise before calling `can`, `cannot`, or `build` on the destination builder. Those methods throw while role calls are pending.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `builder` | `AbilityBuilder` | yes | Builder returned by `abilities.createBuilder()` |
| `registry` | `RoleRegistry` | yes | Role registry (or compatible resolver) |
| `roles` | `string \| string[]` | yes | Role names to resolve |
| `definitions` | `Object` | yes | Mapping of role names to definition functions |
| `scope` | `Object \| Function` | no | Conditions, `UNSCOPED`, or a function returning either directly or through a promise |

### Returns

| Type | Description |
|------|-------------|
| `Promise<void>` | Resolves when the rules have been added |

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
Scoping a deny rule restricts that rule to its scope as well. A check on a type alone, such as `ability.can('remove', 'projects')`, can return true regardless of the organization. To authorize a resource operation, check the complete subject or apply the filter from [`permissions.toMongoQuery()`](./permissions.md#tomongoquery).
:::
