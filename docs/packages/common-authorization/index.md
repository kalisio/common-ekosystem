
---
title: common-authorization
description: Permission management for the Kalisio ekosystem
---

# common-authorization

*Permission management for the Kalisio ekosystem.*

## Overview

`@kalisio/common-authorization` provides utilities for defining, managing, and evaluating authorization rules across frontend applications, backend services, and MCP servers.

::: tip
`common-authorization` builds on [CASL](https://casl.js.org/) and extends its condition matcher to support additional logical operators, ensuring consistent permission evaluation across applications.
:::

It is currently organized around one module:

- [utilities](./utilities/abilities.md) — Stateless helpers for creating and manipulating abilities, combining conditions, and evaluating permissions.

The authorization model relies on the following concepts:

| Concept | Description |
|---------|-------------|
| Principal | The identity performing an action, such as a user, service, application, or agent. |
| Ability | A set of authorization rules associated with a principal. |
| Rule | A definition allowing or denying an action on a subject. |
| Action | The operation to perform. |
| Subject type | The type of resource targeted by an action. |
| Subject | The resource instance targeted by an action. |
| Conditions | Constraints determining whether a rule applies to a subject. |
| Fields | Subject properties targeted by a rule. |

::: info

The package exposes native CASL abilities and builders, while providing a consistent configuration for condition matching and action resolution.

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
import { abilities, permissions } from '@kalisio/common-authorization/utilities'
```

## Usage

### Defining abilities

Use [abilities](./utilities/abilities.md) to create and update authorization abilities, define action aliases, and combine conditions.

```js
const { can, cannot, build } = abilities.createBuilder()

can('read', 'projects')
can('update', 'projects', { ownerId: 'user-1' })
cannot('update', 'projects', { locked: true })

const ability = build()
```

Rules support MongoDB-style conditions, logical operators, and field-level restrictions.

### Evaluating permissions

Use [permissions](./utilities/permissions.md) to evaluate authorization rules on subject types, subject instances, or specific fields.

```js
const project = { ownerId: 'user-1', locked: false }

permissions.can(ability, 'read', 'projects') // true
permissions.can(ability, 'update', 'projects', project) // true
permissions.cannot(ability, 'remove', 'projects', project) // true
```

Additional attributes can be provided to enrich the subject before evaluation.

### Sharing abilities

Authorization rules can be transferred between applications to reconstruct an ability using [abilities.create()](./utilities/abilities.md#create).

```js
const rules = JSON.stringify(ability.rules)
const clientAbility = abilities.create(JSON.parse(rules))
```

Applications must use the same action aliases and preserve condition value types when transferring rules.

::: warning

Client-side permission checks are intended to control user interface behavior. Authorization must always be enforced on the server side.

:::


