---
title: RoleRegistry
description: Registry of roles and their inheritance relationships.
---

# RoleRegistry

A specialized [Registry](../../common-core/structures/registry.md) that stores role definitions and resolves their inheritance. It does not associate roles with actors or define permission rules. Use [Authorization](./authorization.md) or [abilities.defineRoleAbilities()](../utilities/abilities.md#defineroleabilities) to translate roles into rules.

## Constructor

### Signature

```js
new RoleRegistry(name)
```

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | no | Registry name, defaults to `roles` |

### Examples

```js
import { RoleRegistry } from '@kalisio/common-authorization'

const roles = new RoleRegistry()
roles.register('member', {})
roles.register('editor', { inherits: ['member'] })
roles.register('reviewer', { inherits: ['member'] })
roles.register('manager', { inherits: ['editor', 'reviewer'] })
```

## Properties

| Name | Type | Description |
|------|------|-------------|
| `name` | `string` | Registry name |
| `size` | `number` | Number of registered roles |
| `version` | `number` | Mutation counter, initially zero; changes after registration, replacement, successful removal or clearing |

## Role definitions

A definition is a plain object with an optional `inherits` array of existing role names. Additional metadata may be included. The registry stores a shallow frozen copy of the definition and a frozen copy of its parent list. Nested metadata is not recursively frozen.

Parents must already exist. Self-inheritance and cycles are rejected. These invariants also apply in production.

## register

### Signature

```js
roles.register(name, definition)
```

### Description

Registers a new role. Duplicate names and invalid inheritance are rejected.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | yes | Unique role name |
| `definition` | `Object` | yes | Role definition |
| `definition.inherits` | `string[]` | no | Parent roles, in precedence order; defaults to `[]` |

### Returns

| Type | Description |
|------|-------------|
| `Object` | Stored role definition |

### Examples

```js
roles.register('owner', { inherits: ['manager'] })
```

## replace

### Signature

```js
roles.replace(name, definition)
```

### Description

Replaces the definition of an existing role without changing its registration order. The replacement must preserve an acyclic hierarchy.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | yes | Existing role name |
| `definition` | `Object` | yes | New role definition |

### Returns

| Type | Description |
|------|-------------|
| `Object` | Stored role definition |

### Examples

```js
roles.replace('manager', { inherits: ['reviewer', 'editor'] })
```

## unregister

### Signature

```js
roles.unregister(name)
```

### Description

Removes a role. A role inherited directly or indirectly by another role cannot be removed until its descendants no longer depend on it.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | yes | Role name |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | Whether a role was removed |

### Examples

```js
roles.unregister('owner')
```

## clear

### Signature

```js
roles.clear()
```

### Description

Removes all roles and increments the registry version.

### Returns

| Type | Description |
|------|-------------|
| `void` | No return value |

### Examples

```js
roles.clear()
```

## resolve

### Signature

```js
roles.resolve(names)
```

### Description

Resolves the requested roles and their ancestors in rule definition order. Parents are traversed in their declared order, then the child. Multiple requested roles are traversed in input order. Each role appears once, even when reached through several inheritance paths. Unknown roles are rejected. Later emitted rules have higher CASL priority when applicable.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `names` | `string[]` | yes | Role names to resolve |

### Returns

| Type | Description |
|------|-------------|
| `string[]` | Resolved roles in definition order |

### Examples

```js
roles.resolve(['manager'])
// ['member', 'editor', 'reviewer', 'manager']
```

## inherits

### Signature

```js
roles.inherits(name, ancestor)
```

### Description

Tests direct or transitive inheritance. A role is considered to inherit itself.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | yes | Role name |
| `ancestor` | `string` | yes | Ancestor role name |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | Whether the relationship exists |

### Examples

```js
roles.inherits('manager', 'member') // true
roles.inherits('editor', 'reviewer') // false
```

## getAncestors

### Signature

```js
roles.getAncestors(name)
```

### Description

Lists ancestors without duplicates, excluding the role itself, in reverse resolution order.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | yes | Role name |

### Returns

| Type | Description |
|------|-------------|
| `string[]` | Ancestor names |

### Examples

```js
roles.getAncestors('manager')
// ['reviewer', 'editor', 'member']
```

## getDescendants

### Signature

```js
roles.getDescendants(name)
```

### Description

Lists direct and indirect descendants, excluding the role itself, in registration order.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | yes | Role name |

### Returns

| Type | Description |
|------|-------------|
| `string[]` | Descendant names |

### Examples

```js
roles.getDescendants('member')
// ['editor', 'reviewer', 'manager']
```

## Inherited methods

The following read operations retain the behavior of [Registry](../../common-core/structures/registry.md):

| Signature | Returns | Description |
|-----------|---------|-------------|
| `roles.get(name)` | `Object \| undefined` | Stored definition or undefined |
| `roles.has(name)` | `boolean` | Whether a role exists |
| `roles.keys()` | `string[]` | Role names in registration order |
| `roles.values()` | `Object[]` | Stored definitions in registration order |
| `roles.entries()` | `Array` | Name-definition pairs in registration order |
