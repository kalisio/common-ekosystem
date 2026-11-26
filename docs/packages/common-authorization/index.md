---
title: common-authorization
description: Permission management for the Kalisio ekosystem
---

# common-authorization

*Permission management for the Kalisio ekosystem.*

## Overview

`@kalisio/common-authorization` provides utilities and runtime components for defining, managing, and evaluating authorization rules across frontend applications, backend services, and MCP servers.

::: tip
`common-authorization` builds on [CASL](https://casl.js.org/) and provides a [MongoDB-compatible condition matcher](./utilities/conditions-matcher.md) for consistent permission evaluation and query generation within its supported subset.
:::

It is organized around two modules:

- [utilities](./utilities/abilities.md) — Stateless helpers for creating and manipulating [abilities](./utilities/abilities.md), evaluating [permissions](./utilities/permissions.md), and generating MongoDB queries.
- [runtime](./runtime/authorization.md) — Stateful components for managing [role hierarchies](./runtime/role-registry.md), [authorization](./runtime/authorization.md), ability caching, and [global authorization](./runtime/global-authorization.md).

The authorization model relies on the following concepts:

| Concept | Description |
|---------|-------------|
| Actor | The identity performing an action, such as a user, service, application, or agent. |
| Ability | A set of authorization rules associated with an actor. |
| Rule | A definition allowing or denying an action on a subject. |
| Action | The operation to perform. |
| Subject type | The type of resource targeted by an action. |
| Subject | The resource instance targeted by an action. |
| Conditions | Constraints determining whether a rule applies to a subject. |
| Fields | Subject properties targeted by a rule. |
| Role | A named responsibility that can inherit from other roles. |
| Attributes | Additional subject properties supplied during permission evaluation. |

::: info
The package exposes native CASL abilities and builders with a common configuration for condition matching, field matching, and action resolution.
:::

## Installation

::: code-group

```bash [pnpm]
pnpm add @kalisio/common-authorization
```

```bash [npm]
npm install @kalisio/common-authorization
```

```bash [yarn]
yarn add @kalisio/common-authorization
```

:::

```js
import {
  abilities, permissions,
  RoleRegistry, Authorization,
  getGlobalAuthorization, setGlobalAuthorization
} from '@kalisio/common-authorization'
```

## Usage

### Defining abilities

Use [abilities](./utilities/abilities.md) to create and update authorization abilities, define action aliases, and combine conditions.

```js
const aliases = {
  read: ['get', 'find'],
  update: ['patch']
}
const { can, cannot, build } = abilities.createBuilder({ aliases })

can('read', 'projects')
can('update', 'projects', { ownerId: 'user-1' })
cannot('update', 'projects', { locked: true })

const ability = build()
```

Rules support [MongoDB-style conditions](./utilities/conditions-matcher.md), logical operators, and field-level restrictions. The last applicable rule takes precedence.

### Evaluating permissions

Use [permissions](./utilities/permissions.md) to evaluate authorization rules against resource types, resource instances, or individual fields.

```js
const project = { ownerId: 'user-1', locked: false }

permissions.can(ability, 'find', 'projects') // true
permissions.can(ability, 'patch', 'projects', project) // true
permissions.cannot(ability, 'remove', 'projects', project) // true
```

Additional attributes can enrich a subject without modifying the original object.

### Generating MongoDB queries

Use [permissions.toMongoQuery()](./utilities/permissions.md#tomongoquery) to restrict database queries to authorized documents.

```js
const query = permissions.toMongoQuery(ability, 'update', 'projects')
```

- `null` — No document is authorized; do not execute the query.
- `{}` — All documents are authorized for this action (and field, if specified).
- A non-empty MongoDB filter — Only matching documents are authorized.

Authorization filters can be combined with application filters using `$and`.

### Managing roles

Use [RoleRegistry](./runtime/role-registry.md) to define and resolve role hierarchies.

```js
const roles = new RoleRegistry()

roles.register('member', {})
roles.register('manager', { inherits: ['member'] })
roles.register('owner', { inherits: ['manager'] })

roles.resolve(['owner'])
// ['member', 'manager', 'owner']
```

Roles support multiple inheritance. Each role is resolved once, with ancestors preceding their descendants.

### Managing authorization

Use [Authorization](./runtime/authorization.md) to centralize role management and ability computation. Authorization hooks allow application modules to contribute permission rules independently.

```js
const authorization = new Authorization({
  aliases: {
    read: ['get', 'find'],
    update: ['patch']
  },
  cache: {
    key: actor => actor._id,
    max: 1000,
    ttl: 60000
  }
})

authorization.roles.register('member', {})
authorization.roles.register('manager', { inherits: ['member'] })

authorization.registerHook('projects', (actor, { defineRoleAbilities }) => {
  for (const organization of actor.organizations) {
    defineRoleAbilities(organization.role, {
      member: ({ can }) => can('read', 'projects'),
      manager: ({ can }) => can('update', 'projects')
    }, { organizationId: organization._id })
  }
})

const actor = {
  _id: 'user-1',
  organizations: [
    { _id: 'org-1', role: 'manager' },
    { _id: 'org-2', role: 'member' }
  ]
}

const actorAbility = authorization.getAbility(actor)

permissions.can(actorAbility, 'patch', 'projects', {
  organizationId: 'org-1'
}) // true

permissions.can(actorAbility, 'patch', 'projects', {
  organizationId: 'org-2'
}) // false
```

Authorization supports synchronous hooks, scoped permissions, and optional caching with LRU eviction
and expiration. Changes to roles or hooks make cached rules stale. Applications can explicitly invalidate
cached rules when an actor's permissions change.

### Sharing authorization across modules

Use [getGlobalAuthorization and setGlobalAuthorization](./runtime/global-authorization.md) to share an
authorization instance across application modules.

```js
// Application initialization, using the configured instance above
setGlobalAuthorization(authorization)

// Other modules
const sharedAbility = getGlobalAuthorization().getAbility(actor)
```

Multiple independent authorization instances can also be created when required.

### Sharing abilities across applications

Authorization rules can be transferred between applications to reconstruct an ability using
[abilities.create()](./utilities/abilities.md#create).

```js
const rules = JSON.stringify(ability.rules)
const clientAbility = abilities.create(JSON.parse(rules), { aliases })
```

Applications must use the same action aliases and preserve condition value types when transferring rules. JSON
serialization is only suitable for JSON-compatible rules; values such as dates, regular expressions and BSON
ObjectIds require a type-preserving representation.

::: warning

Client-side permission checks are intended to control user interface behavior. Authorization must always be enforced
on the server side using trusted attributes and complete resource instances or authorization filters. Field-level
restrictions must also be enforced when applicable.

:::