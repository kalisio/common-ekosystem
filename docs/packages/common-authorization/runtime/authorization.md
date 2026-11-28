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
| `options.cache.key` | `Function` | yes, if cache is enabled | `(actor, context) => Array<string \| number \| ObjectId>`, returning a non-empty list of key parts |
| `options.cache.max` | `number` | no | Maximum number of entries; positive integer or Infinity (default) |
| `options.cache.ttl` | `number` | no | Entry lifetime in milliseconds; defaults to 60000, 0 disables expiration |

### Examples

```js
import { Authorization, permissions } from '@kalisio/common-authorization'

const authorization = new Authorization({
  aliases: { read: ['get', 'find'] },
  cache: {
    key: actor => actor == null ? ['anonymous'] : ['actor', actor._id],
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
(actor, { can, cannot, defineRoleAbilities }, context) => {}
```

`actor` is the identity supplied by the caller (which may be null for anonymous access). `context` is the object supplied to ability computation, defaulting to `{}`. It is not automatically added to rule conditions.

`can` and `cannot` are CASL rule-definition functions. `defineRoleAbilities(roles, definitions, scope)` delegates to [abilities.defineRoleAbilities()](../utilities/abilities.md#defineroleabilities) using the instance's builder and registry. A scope is a condition object or a function of each generated rule, combined with that rule's conditions.

Hooks run sequentially in registration order. Rules from later hooks take precedence when applicable. Hooks registered during a computation apply only to subsequent computations. Errors from hooks, role definitions, and scope functions reject the ability computation.

Authorization waits for role calls started by each hook before moving to the next hook, even if the hook omits `await`. Role calls on the same builder run in call order. Await pending role calls before adding direct rules in the same hook. The rule-definition functions `can` and `cannot` throw while role calls are pending. Return or await any other asynchronous work that contributes rules so it completes within the hook. Once the hook returns or its returned promise settles, its rule-definition functions reject further calls by throwing. Use an awaited loop or return the promise for asynchronous membership processing.

`actor.memberships.forEach(async membership => { … })` discards the promises returned by its callbacks. A callback that defines rules after the hook has finished throws into a detached promise. Under Node.js's default unhandled-rejection behavior, that can terminate the process. Use `for...of` and await the work inside the hook:

```js
authorization.registerHook('memberships', async (actor, { defineRoleAbilities }) => {
  for (const membership of actor.memberships) {
    const scope = await loadMembershipScope(membership)
    await defineRoleAbilities(membership.role, roleDefinitions, scope)
  }
})
```

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
authorization.defineAbility(actor, context) // Promise<Ability>
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
| `Promise<Ability>` | Resolves to a new ability |

### Examples

```js
const ability = await authorization.defineAbility({ _id: 'user-1' })
```

## getAbility

### Signature

```js
authorization.getAbility(actor, context) // Promise<Ability>
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
| `Promise<Ability>` | Resolves to a new ability with the computed or cached rules |

### Examples

```js
const ability = await authorization.getAbility({ _id: 'user-1' })
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

authorization.registerHook('projects', async (actor, { defineRoleAbilities }) => {
  for (const organization of actor.organizations ?? []) {
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

- The cache stores promises for private copies of the rules. Concurrent lookups for the same live entry share one computation. Each caller receives its own copied rules and ability.
- A failed computation removes its entry if it is still current. Completion cannot restore an invalidated, expired, or evicted entry.
- Entries are evicted in least-recently-used order when the size limit is exceeded. TTL is measured from insertion of the pending promise. Access and completion leave the expiration time unchanged. It defaults to one minute: a safety net, not a revocation mechanism.
- Changes to role definitions or hooks cause stale entries to be recomputed on the next access.
- Changes to an actor's memberships, permissions or external policy data require explicit invalidation, an appropriate key change, or expiration.

::: warning
The cache key must include the trusted actor identity and every context field that affects hook results. Return each value as a separate part to let Authorization validate and encode it. Parts can be non-empty strings, finite numbers, or BSON ObjectIds. Missing parts are rejected, including in production. Numbers and their string representations share a key, including `-0`, `0`, and `'0'`. A BSON ObjectId shares a key with its canonical lowercase hexadecimal string. If two identifier namespaces can contain the same text, include the namespace as its own key part. Use a separate key for anonymous access.

Invalidation affects future lookups. Callers already awaiting a computation still receive its result or error, and previously returned abilities remain usable. The cache is local to the process: in multi-process deployments, the application is responsible for invalidating the abilities of every instance, for instance on changes to users or their permissions, and for computing them from an up-to-date actor.
:::

For example, when the organization in the hook context affects rule generation:

```js
const authorization = new Authorization({
  cache: {
    key: (actor, context) => actor == null
      ? ['anonymous', context.organizationId]
      : ['actor', actor._id, context.organizationId],
    max: 1000,
    ttl: 60000
  }
})
```

The example assumes authenticated actors have unique, trusted IDs and the organization ID is the only context dimension that affects the policy.
