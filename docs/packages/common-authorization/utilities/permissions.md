---
title: permissions
description: Utility functions for evaluating authorization permissions.
---

# permissions

Utility functions for evaluating authorization permissions on subject types and subject instances.

Permissions are evaluated against a CASL ability using an action, a subject type, an optional subject instance and optional additional attributes.

## createSubject

### Signature

```js
permissions.createSubject(subjectType, subject, attributes)
```

### Description

Creates a typed subject that can be evaluated by CASL.

The subject is shallow-copied before its type is assigned. The original object is not modified.

Additional attributes can be merged into the subject. When an attribute and a subject property share the same key, the attribute takes precedence.

The caller is responsible for ensuring that additional attributes originate from a trusted source.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `subjectType` | `string` | yes | The subject type |
| `subject` | `Object` | no | The subject instance |
| `attributes` | `Object` | no | Additional subject attributes |

### Returns

| Type | Description |
|------|-------------|
| `Object` | A new typed subject |

### Examples

```js
import { permissions } from '@kalisio/common-authorization/utilities'

const project = {
  name: 'My project',
  ownerId: 'user-1'
}

const subject = permissions.createSubject('projects', project)
```

Adding contextual attributes:

```js
const subject = permissions.createSubject(
  'projects',
  project,
  { organizationId: 'org-1' }
)
```

## can

### Signature

```js
permissions.can(ability, action, subjectType, subject, options)
```

### Description

Checks whether an ability grants permission to perform an action on a subject.

The evaluation depends on the provided arguments:

- When only the subject type is provided, permissions are evaluated at the type level.
- When a subject is provided, conditions are evaluated against the subject instance.
- When additional attributes are provided, they are merged into the subject before evaluation.
- When only attributes are provided, conditions are evaluated against those attributes.

Returns `false` if the ability is absent.

::: warning
Type-level checks and checks on partial subjects are useful for user interface decisions but are not sufficient to authorize an operation on a resource.

Resource-level authorization requires all relevant subject properties. Field-level restrictions must also be checked when applicable.
:::

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `ability` | `Ability` | yes | The ability to evaluate |
| `action` | `string` | yes | The action to perform |
| `subjectType` | `string` | yes | The subject type |
| `subject` | `Object` | no | The subject instance |
| `options` | `Object` | no | Permission evaluation options |
| `options.field` | `string` | no | The subject field to evaluate |
| `options.attributes` | `Object` | no | Additional subject attributes |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the action is allowed, `false` otherwise |

### Examples

```js
import { abilities, permissions } from '@kalisio/common-authorization/utilities'

const { can, build } = abilities.createBuilder()

can('read', 'projects')

can('update', 'projects', {
  ownerId: 'user-1'
})

const ability = build()
```

Checking permissions on a subject type:

```js
permissions.can(ability, 'read', 'projects')
// true

permissions.can(ability, 'update', 'projects')
// true
```

Checking permissions on a subject instance:

```js
permissions.can(ability, 'update', 'projects', {
  ownerId: 'user-1'
})
// true

permissions.can(ability, 'update', 'projects', {
  ownerId: 'user-2'
})
// false
```

Checking permissions with additional attributes:

```js
const project = { name: 'My project' }

permissions.can(ability, 'update', 'projects', project, {
  attributes: {
    ownerId: 'user-1'
  }
})
// true
```

Checking field-level permissions:

```js
const { can, build } = abilities.createBuilder()

can('update', 'projects', ['name', 'description'])

const ability = build()

permissions.can(ability, 'update', 'projects', project, {
  field: 'name'
})
// true

permissions.can(ability, 'update', 'projects', project, {
  field: 'ownerId'
})
// false
```

## cannot

### Signature

```js
permissions.cannot(ability, action, subjectType, subject, options)
```

### Description

Checks whether an action is not allowed on a subject.

Returns the logical inverse of `permissions.can()`, using the same evaluation options.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `ability` | `Ability` | yes | The ability to evaluate |
| `action` | `string` | yes | The action to perform |
| `subjectType` | `string` | yes | The subject type |
| `subject` | `Object` | no | The subject instance |
| `options` | `Object` | no | Permission evaluation options |
| `options.field` | `string` | no | The subject field to evaluate |
| `options.attributes` | `Object` | no | Additional subject attributes |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the action is not allowed, `false` otherwise |

### Examples

```js
const ability = abilities.create([
  { action: 'read', subject: 'projects' }
])

permissions.cannot(ability, 'read', 'projects')
// false

permissions.cannot(ability, 'update', 'projects')
// true
```
