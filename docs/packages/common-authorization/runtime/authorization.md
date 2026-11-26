---
title: Authorization
description: Authorization hooks, role management and ability caching.
---

# Authorization

Manages an authorization policy for an application. Each instance owns its [RoleRegistry](./role-registry.md), its authorization hooks, and an optional cache of computed rules. It does not authenticate actors or enforce access on application resources by itself.

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
| `options.cache.key` | `Function` | yes, if cache is enabled | `(actor, context) => string`, returning a non-empty cache key |
| `options.cache.max` | `number` | no | Maximum number of entries; positive integer or Infinity (default) |
| `options.cache.ttl` | `number` | no | Entry lifetime in milliseconds; defaults to 60000, 0 disables expiration |

### Examples

```js
import { Authorization, permissions } from '@kalisio/common-authorization'

const authorization = new Authorization({
  aliases: { read: ['get', 'find'] },
  cache: {
    key: actor => actor._id,
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

Hooks contribute rules to a shared builder and must be synchronous. Their signature is:

```js
(actor, { can, cannot, defineRoleAbilities }, context) => {}
```

`actor` is the identity supplied by the caller (which may be null for anonymous access). `context` is the object supplied to ability computation, defaulting to `{}`. It is not automatically added to rule conditions.

`can` and `cannot` are CASL rule-definition functions. `defineRoleAbilities(roles, definitions, scope)` delegates to [abilities.defineRoleAbilities()](../utilities/abilities.md#defineroleabilities) using the instance's builder and registry. A scope is a condition object or a function of each generated rule, combined with that rule's conditions.

Hooks run sequentially in registration order. Rules from later hooks take precedence when applicable. Hooks registered during a computation apply only to subsequent computations. A hook that throws fails the computation; nothing is cached from that failure.

::: warning
A hook returning a promise, an `async` function included, is rejected with a `TypeError`, in production too: the ability would otherwise be built before the hook completes, silently lacking its rules. Load any data the hooks need, such as an up-to-date actor, before computing the ability.
:::

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
authorization.registerHook('public', (actor, { can }) => {
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
authorization.defineAbility(actor, context)
```

### Description

Runs the registered hooks and builds a new CASL ability. Always computes rules directly, bypassing the cache.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `actor` | `any` | yes | Actor supplied to hooks |
| `context` | `Object` | no | Hook context; defaults to `{}` |

### Returns

| Type | Description |
|------|-------------|
| `Ability` | New ability |

### Examples

```js
const ability = authorization.defineAbility({ _id: 'user-1' })
```

## getAbility

### Signature

```js
authorization.getAbility(actor, context)
```

### Description

Retrieves rules from the cache or computes them on a miss. When caching is disabled, it delegates to `defineAbility()`. Each call returns an independent ability, even when several calls share cached rules.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `actor` | `any` | yes | Actor supplied to hooks |
| `context` | `Object` | no | Hook context; defaults to `{}` |

### Returns

| Type | Description |
|------|-------------|
| `Ability` | New ability with the computed or cached rules |

### Examples

```js
const ability = authorization.getAbility({ _id: 'user-1' })
```

## invalidateAbility

### Signature

```js
authorization.invalidateAbility(actor, context)
```

### Description

Removes the cached entry for the key computed from the actor and context. Returns false when no cache is configured or no entry was removed.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `actor` | `any` | yes | Actor supplied to hooks |
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

authorization.registerHook('projects', (actor, { defineRoleAbilities }) => {
  for (const organization of actor.organizations ?? []) {
    defineRoleAbilities(organization.role, {
      member: ({ can }) => can('read', 'projects'),
      manager: ({ can }) => can('update', 'projects')
    }, { organizationId: organization._id })
  }
})

const ability = authorization.getAbility({
  organizations: [{ _id: 'org-1', role: 'manager' }]
})

permissions.can(ability, 'update', 'projects', { organizationId: 'org-1' })
// true
```

## Cache behavior

- The cache contains private copies of rules, not CASL ability instances. Each caller receives its own copied rules and ability.
- Failed computations are not retained.
- Entries are evicted in least-recently-used order when the size limit is exceeded. TTL is measured from insertion, not the most recent access. It defaults to one minute: a safety net, not a revocation mechanism.
- Changes to role definitions or hooks cause stale entries to be recomputed on the next access.
- Changes to an actor's memberships, permissions or external policy data require explicit invalidation, an appropriate key change, or expiration.

::: warning
The cache key must distinguish every actor and context that can produce different rules. Use trusted identifiers and include context values whenever they influence hooks. Do not use a BSON ObjectId directly as a key; convert it to a string. Anonymous access needs a separate key if supported.

Invalidation only affects future lookups. Already returned abilities are not revoked. The cache is local to the process: in multi-process deployments, the application is responsible for invalidating the abilities of every instance, for instance on changes to users or their permissions, and for computing them from an up-to-date actor.
:::

For example, when the organization in the hook context affects rule generation:

```js
const authorization = new Authorization({
  cache: {
    key: (actor, context) => JSON.stringify([
      actor == null ? null : String(actor._id),
      context.organizationId ?? null
    ]),
    max: 1000,
    ttl: 60000
  }
})
```

The example assumes authenticated actors have unique, trusted IDs and the organization ID is the only context dimension that affects the policy.
