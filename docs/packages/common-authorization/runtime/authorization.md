---
title: Authorization
description: Authorization hooks, role management and ability caching.
---

# Authorization

Manages an authorization policy for an application. Each instance owns its [RoleRegistry](./role-registry.md), its authorization hooks, and an optional cache of computed rules. It does not authenticate principals or enforce access on application resources by itself.

## Constructor

### Signature

```js
new Authorization(options)
```

### Description

Creates an independent authorization instance. Aliases are copied at construction. Caching is disabled unless a cache configuration is supplied.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `Object` | no | Authorization options |
| `options.aliases` | `Object` | no | Action aliases as arrays of action names |
| `options.cache` | `Object` | no | Enables rule caching |
| `options.cache.key` | `Function` | yes, if cache is enabled | `(principal, context) => string`, returning a non-empty cache key |
| `options.cache.max` | `number` | no | Maximum number of entries; positive integer or Infinity (default) |
| `options.cache.ttl` | `number` | no | Entry lifetime in milliseconds; defaults to 0 (no expiration) |

### Examples

```js
import { Authorization, permissions } from '@kalisio/common-authorization'

const authorization = new Authorization({
  aliases: { read: ['get', 'find'] },
  cache: {
    key: principal => principal._id,
    max: 1000,
    ttl: 60000
  }
})
```

## Properties

| Name | Type | Description |
|------|------|-------------|
| `roles` | `RoleRegistry` | Role registry owned by the instance |

## Authorization hooks

Hooks contribute rules to a shared builder and can be synchronous or asynchronous. Their signature is:

```js
(principal, { can, cannot, defineRoleAbilities }, context) => {}
```

`principal` is the identity supplied by the caller (which may be null for anonymous access). `context` is the object supplied to ability computation, defaulting to `{}`. It is not automatically added to rule conditions.

`can` and `cannot` are CASL rule-definition functions. `defineRoleAbilities(roles, definitions, scope)` delegates to [abilities.defineRoleAbilities()](../utilities/abilities.md#defineroleabilities) using the instance's builder and registry. Await or return its promise in the hook. A scope is a condition object or a function of each generated rule, combined with that rule's conditions.

Hooks run sequentially in registration order. Rules from later hooks take precedence when applicable. Hooks registered during a computation apply only to subsequent computations. A rejected hook rejects the computation; no successful cached ability is produced from that failure.

## registerHook

### Signature

```js
authorization.registerHook(name, hook)
```

### Description

Registers a named hook. Names must be unique. Registration makes previously cached rules stale.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | yes | Hook name |
| `hook` | `Function` | yes | Rule-definition hook |

### Returns

| Type | Description |
|------|-------------|
| `void` | No return value |

### Examples

```js
authorization.registerHook('public', (principal, { can }) => {
  can('read', 'publications')
})
```

## unregisterHook

### Signature

```js
authorization.unregisterHook(name)
```

### Description

Removes a named hook. Successful removal makes previously cached rules stale.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | yes | Hook name |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | Whether a hook was removed |

### Examples

```js
authorization.unregisterHook('public')
```

## defineAbility

### Signature

```js
await authorization.defineAbility(principal, context)
```

### Description

Runs the registered hooks and builds a new CASL ability. Always computes rules directly, bypassing the cache.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `principal` | `any` | yes | Principal supplied to hooks |
| `context` | `Object` | no | Hook context; defaults to `{}` |

### Returns

| Type | Description |
|------|-------------|
| `Promise<Ability>` | New ability |

### Examples

```js
const ability = await authorization.defineAbility({ _id: 'user-1' })
```

## getAbility

### Signature

```js
await authorization.getAbility(principal, context)
```

### Description

Retrieves rules from the cache or computes them on a miss. When caching is disabled, it delegates to `defineAbility()`. Each call returns an independent ability, even when several calls share one rule computation.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `principal` | `any` | yes | Principal supplied to hooks |
| `context` | `Object` | no | Hook context; defaults to `{}` |

### Returns

| Type | Description |
|------|-------------|
| `Promise<Ability>` | New ability with the computed or cached rules |

### Examples

```js
const ability = await authorization.getAbility({ _id: 'user-1' })
```

## invalidateAbility

### Signature

```js
authorization.invalidateAbility(principal, context)
```

### Description

Removes the cached entry for the key computed from the principal and context. Returns false when no cache is configured or no entry was removed.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `principal` | `any` | yes | Principal supplied to hooks |
| `context` | `Object` | no | Hook context; defaults to `{}` |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | Whether a cache entry was removed |

### Examples

```js
authorization.invalidateAbility({ _id: 'user-1' })
```

## clearAbilities

### Signature

```js
authorization.clearAbilities()
```

### Description

Clears the entire rule cache. Has no effect when caching is disabled.

### Returns

| Type | Description |
|------|-------------|
| `void` | No return value |

### Examples

```js
authorization.clearAbilities()
```

## Scoped role definitions

```js
const authorization = new Authorization()
authorization.roles.register('member', {})
authorization.roles.register('manager', { inherits: ['member'] })

authorization.registerHook('projects', async (principal, { defineRoleAbilities }) => {
  for (const organization of principal.organizations ?? []) {
    await defineRoleAbilities(organization.role, {
      member: ({ can }) => can('read', 'projects'),
      manager: ({ can }) => can('update', 'projects')
    }, { organizationId: organization._id })
  }
})

const ability = await authorization.getAbility({
  organizations: [{ _id: 'org-1', role: 'manager' }]
})

permissions.can(ability, 'update', 'projects', { organizationId: 'org-1' })
// true
```

## Cache behavior

- The cache contains private copies of rules, not CASL ability instances. Each caller receives its own copied rules and ability.
- Concurrent requests for the same key and policy version share the computation. Failed computations are not retained.
- Entries are evicted in least-recently-used order when the size limit is exceeded. TTL is measured from insertion, not the most recent access.
- Changes to role definitions or hooks cause stale entries to be recomputed on the next access.
- Changes to a principal's memberships, permissions or external policy data require explicit invalidation, an appropriate key change, or expiration.

::: warning
The cache key must distinguish every principal and context that can produce different rules. Use trusted identifiers and include context values whenever they influence hooks. Do not use a BSON ObjectId directly as a key; convert it to a string. Anonymous access needs a separate key if supported.

Invalidation only affects future lookups. Already returned abilities and computations in progress are not revoked. In multi-process deployments, coordinate invalidation across instances if policy changes must take effect everywhere.
:::

For example, when the organization in the hook context affects rule generation:

```js
const authorization = new Authorization({
  cache: {
    key: (principal, context) => JSON.stringify([
      principal == null ? null : String(principal._id),
      context.organizationId ?? null
    ]),
    max: 1000,
    ttl: 60000
  }
})
```

The example assumes authenticated principals have unique, trusted IDs and the organization ID is the only context dimension that affects the policy.
