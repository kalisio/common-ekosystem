---
title: global-authorization
description: Access to the shared authorization instance.
---

# global-authorization

Functions for sharing an [Authorization](./authorization.md) instance across application modules. The application creates and configures the instance before other modules access it. There is no default instance.

## setGlobalAuthorization

### Signature

```js
setGlobalAuthorization(authorization)
```

### Description

Installs an existing authorization instance as the shared instance. Calling the function again replaces the shared reference. It does not migrate rules, roles or cached entries from another instance.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `authorization` | `Authorization` | yes | The instance to share |

### Returns

| Type | Description |
|------|-------------|
| `void` | No return value |

### Examples

```js
import { Authorization, setGlobalAuthorization } from '@kalisio/common-authorization'

const authorization = new Authorization()
setGlobalAuthorization(authorization)
```

## getGlobalAuthorization

### Signature

```js
getGlobalAuthorization()
```

### Description

Returns the installed instance. Call it only after the application has configured global authorization.

### Returns

| Type | Description |
|------|-------------|
| `Authorization` | The shared authorization instance |

### Examples

```js
import { getGlobalAuthorization } from '@kalisio/common-authorization'

const authorization = getGlobalAuthorization()
const ability = await authorization.getAbility({ _id: 'user-1' })
```

::: info
Sharing the instance does not imply sharing an actor or an ability. Each consumer still computes or retrieves the ability for its own actor and context. For independent authorization policies, create separate `Authorization` instances.
:::
